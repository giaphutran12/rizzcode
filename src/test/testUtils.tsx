/**
 * Shared helpers for RizzCode client tests.
 *
 * - installLocalStorageMock / useFreshStorage: this environment's
 *   window.localStorage getter returns undefined, so tests install a
 *   spec-shaped Storage mock (same pattern as src/storage/storage.test.ts)
 *   and reset the safeStorage availability cache before each test.
 * - makeJudgeResult: builds a valid JudgeResult whose evidence excerpts are
 *   guaranteed to be exact substrings of the supplied user texts.
 * - okJudge: an injectable judge that always resolves ok with a result.
 * - waitForPersonaReply: flushes the persona reply timer (sessions under
 *   test use replyDelayMs: 0, so replies land on the next macrotask).
 * - stubJudgeFetch: replaces global fetch with a controlled /api/judge stub
 *   and records every parsed JudgeRequest.
 */

import { beforeEach, vi, type Mock } from "vitest";
import { waitFor } from "@testing-library/react";
import { resetForTests } from "../storage/safeStorage";
import { verdictFor } from "../domain/scoring";
import {
  CRITERION_IDS,
  type Attempt,
  type Evidence,
  type HardGateFinding,
  type JudgeApiResponse,
  type JudgeRequest,
  type JudgeResult,
  type OutcomeCode,
  type RubricEntry,
  type Verdict,
} from "../domain/types";

// ---------------------------------------------------------------------------
// localStorage
// ---------------------------------------------------------------------------

/** Spec-shaped in-memory Storage implementation. */
export class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

export function installLocalStorageMock(): LocalStorageMock {
  const mock = new LocalStorageMock();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: mock,
  });
  return mock;
}

/**
 * Registers a beforeEach that installs a fresh localStorage mock and resets
 * the safeStorage availability/fallback caches. Call once at the top level
 * of any test file that touches the storage layer.
 */
export function useFreshStorage(): void {
  beforeEach(() => {
    installLocalStorageMock();
    resetForTests();
  });
}

// ---------------------------------------------------------------------------
// JudgeResult factory
// ---------------------------------------------------------------------------

export interface MakeJudgeResultOptions {
  attemptId?: string;
  /** Five rubric scores (0-2 each), in CRITERION_IDS order. Defaults to all 2s. */
  rubricScores?: Array<0 | 1 | 2>;
  /** Merged over the default "no gate" finding. */
  hardGate?: Partial<HardGateFinding>;
  outcomeCode?: OutcomeCode;
  finalScore?: number;
  verdict?: Verdict;
}

const DEFAULT_USER_TEXTS = [
  "ha, the 18 delayed again? i think it has a personal grudge",
  "fair enough — i noticed the library book. what are you reading?",
  "guilty. honestly the best delayed-bus conversation i have had",
];

const OUTCOME_LABELS: Record<OutcomeCode, string> = {
  conversation_continues: "Conversation continues",
  shared_interest: "Shared interest discovered",
  contact_exchanged: "Contact info exchanged",
  date_invited: "Date invited",
  date_agreed: "Date agreed",
  graceful_exit: "Graceful exit",
  low_interest: "Low interest",
  incompatible: "Incompatible",
  boundary_crossed: "Boundary crossed",
};

/**
 * Builds a schema-valid JudgeResult. Every evidence excerpt is a prefix
 * (and therefore an exact substring) of the corresponding user text, so the
 * result always satisfies the "excerpt from a real user turn" contract.
 */
export function makeJudgeResult(
  userTexts: string[] = DEFAULT_USER_TEXTS,
  options: MakeJudgeResultOptions = {},
): JudgeResult {
  const texts = userTexts.length > 0 ? userTexts : DEFAULT_USER_TEXTS;

  const evidenceFor = (index: number): Evidence => {
    const sourceIndex = index % texts.length;
    return {
      turn: (sourceIndex + 1) as 1 | 2 | 3,
      excerpt: texts[sourceIndex].slice(0, 40),
      reason: `Evidence from turn ${sourceIndex + 1}.`,
    };
  };

  const rubric: RubricEntry[] = CRITERION_IDS.map((id, index) => ({
    id,
    score: options.rubricScores?.[index] ?? 2,
    evidence: evidenceFor(index),
    feedback: `Feedback for ${id}.`,
  }));

  const hardGate: HardGateFinding = {
    triggered: false,
    severity: "none",
    codes: [],
    maxScore: 10,
    evidence: [],
    ...options.hardGate,
  };

  const rawScore = rubric.reduce((sum, entry) => sum + entry.score, 0);
  const finalScore = options.finalScore ?? Math.min(rawScore, hardGate.maxScore);
  const outcomeCode = options.outcomeCode ?? "conversation_continues";

  return {
    schemaVersion: "1.0",
    attemptId: options.attemptId ?? "test-attempt-id",
    mode: "llm",
    hardGate,
    rubric,
    rawScore,
    finalScore,
    verdict: options.verdict ?? verdictFor(finalScore),
    worked: ["Kept the opener specific to the shared moment."],
    improve: ["Ask one follow-up question and then actually listen."],
    betterResponse:
      "Ha — the 18 really does have it out for you. I'm rooting for you both.",
    outcome: {
      code: outcomeCode,
      label: OUTCOME_LABELS[outcomeCode],
      confidence: "medium",
      basis: [evidenceFor(0)],
    },
  };
}

/** An injectable judge that resolves ok with the given (or a default) result. */
export function okJudge(
  result: JudgeResult = makeJudgeResult(),
): (attempt: Attempt) => Promise<JudgeApiResponse> {
  return (_attempt: Attempt) => Promise.resolve({ ok: true, result });
}

// ---------------------------------------------------------------------------
// Persona reply timer
// ---------------------------------------------------------------------------

/**
 * Sessions under test run with replyDelayMs: 0, so the persona reply lands
 * on the next macrotask. This waits until `check` observes it.
 */
export async function waitForPersonaReply(check: () => void): Promise<void> {
  await waitFor(check, { timeout: 2000 });
}

// ---------------------------------------------------------------------------
// /api/judge fetch stub
// ---------------------------------------------------------------------------

export interface StubbedJudgeFetch {
  fetchMock: Mock;
  /** Every JudgeRequest body the component sent, in order. */
  requests: JudgeRequest[];
}

/**
 * Stubs global fetch so requestJudgment receives a controlled
 * JudgeApiResponse. The handler may return a promise, which lets a test
 * hold the attempt in the judging state until it resolves the gate.
 */
export function stubJudgeFetch(
  handler: (request: JudgeRequest) => JudgeApiResponse | Promise<JudgeApiResponse>,
): StubbedJudgeFetch {
  const requests: JudgeRequest[] = [];
  const fetchMock = vi.fn(async (_input: unknown, init?: { body?: string }) => {
    const request = JSON.parse(init?.body ?? "{}") as JudgeRequest;
    requests.push(request);
    const payload = await handler(request);
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, requests };
}
