/**
 * Server-side judge route. This module owns the official result:
 *
 *  1. Validate the request and load the canonical scenario.
 *  2. Reject any client-supplied scores, gates, outcomes, persona state, or XP
 *     (the JudgeRequest schema only carries attemptId, scenarioId, responses).
 *  3. Replay the shared deterministic persona engine over the user's responses
 *     to reconstruct the canonical transcript and final persona state.
 *  4. Run deterministic hard-gate detection before any model call.
 *  5. Call the LLM judge (Vercel AI SDK v6 + @ai-sdk/openai) for a structured
 *     draft: rubric scores, evidence, coaching, and likely outcome.
 *  6. Validate the draft (schema + exact-excerpt evidence), then recalculate
 *     rawScore, apply gate caps, and derive the verdict on the server.
 *
 * The model never decides arithmetic, caps, verdicts, XP, or rank.
 */
import { generateText, Output } from "ai";
import { getScenarioById } from "../../data/scenarios";
import { getPersonaReply } from "../../domain/personaEngine";
import { detectHardGates } from "../../domain/hardGates";
import { finalizeScore } from "../../domain/scoring";
import {
  JudgeModelDraftSchema,
  JudgeRequestSchema,
  validateJudgeResult,
} from "../../domain/validation";
import type {
  Attempt,
  HardGateFinding,
  JudgeApiResponse,
  JudgeRequest,
  JudgeResult,
  PersonaState,
  PracticeMessage,
  Scenario,
} from "../../domain/types";
import { createJudgeModel, isJudgeConfigured } from "./provider";
import { buildJudgeDataPrompt, JUDGE_SYSTEM_PROMPT } from "./prompt";
import { buildMockJudgment } from "./mockJudge";

export interface JudgeRouteResult {
  status: number;
  body: JudgeApiResponse;
}

const JUDGE_TIMEOUT_MS = 45_000;

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError("judge timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

interface ReplayedTranscript {
  messages: PracticeMessage[];
  finalPersonaState: PersonaState;
  responses: Array<{ turn: 1 | 2 | 3; body: string }>;
}

/**
 * Rebuilds the canonical transcript from the user's responses using the same
 * pure persona transition code the client ran. Client-sent persona messages
 * are never trusted — they are not even part of the request schema.
 */
export function replayTranscript(
  scenario: Scenario,
  request: JudgeRequest,
): ReplayedTranscript {
  const messages: PracticeMessage[] = [];
  const responses: Array<{ turn: 1 | 2 | 3; body: string }> = [];

  if (scenario.opening.kind === "persona_message") {
    messages.push({
      id: `${request.attemptId}-opening`,
      speaker: "her",
      body: scenario.opening.body,
      turn: 0,
      createdAt: request.attemptId,
    });
  }

  let personaState: PersonaState = scenario.persona.initialState;

  for (const response of request.responses) {
    const turn = response.turn;
    const body = response.body.trim().slice(0, 420);
    responses.push({ turn, body });
    messages.push({
      id: `${request.attemptId}-you-${turn}`,
      speaker: "you",
      body,
      turn,
      createdAt: request.attemptId,
    });

    if (personaState.terminal) continue; // no replies after a terminal state

    const reply = getPersonaReply({
      scenario,
      userText: body,
      personaState,
      turn,
    });
    personaState = reply.state;
    messages.push({
      id: `${request.attemptId}-her-${turn}`,
      speaker: "her",
      body: reply.reply,
      turn,
      createdAt: request.attemptId,
    });
  }

  return { messages, finalPersonaState: personaState, responses };
}

function isRateLimit(error: unknown): boolean {
  const status = (error as { statusCode?: number })?.statusCode;
  return status === 429;
}

/** The model's draft failed schema or evidence validation — retryable once. */
class ValidationFailure extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super("judge draft failed validation");
    this.errors = errors;
  }
}

interface JudgeCallInput {
  scenario: Scenario;
  messages: PracticeMessage[];
  finalPersonaState: PersonaState;
  hardGate: HardGateFinding;
}

/**
 * One provider request for the structured draft, bounded by the timeout.
 * Throws TimeoutError, the raw provider error, or returns the draft.
 */
async function generateDraft(
  input: JudgeCallInput,
  correctionErrors: string[] | null,
): Promise<unknown> {
  const model = createJudgeModel();
  const prompt = buildJudgeDataPrompt({
    scenario: input.scenario,
    transcript: input.messages,
    finalPersonaState: input.finalPersonaState,
    hardGateCodes: input.hardGate.codes,
    correctionErrors,
  });

  const abort = new AbortController();
  const { output } = await withTimeout(
    generateText({
      model,
      system: JUDGE_SYSTEM_PROMPT,
      prompt,
      output: Output.object({ schema: JudgeModelDraftSchema }),
      abortSignal: abort.signal,
    }),
    JUDGE_TIMEOUT_MS,
  );
  return output;
}

/**
 * Turns a raw draft into a fully validated JudgeResult, doing ALL arithmetic
 * (schema re-check, raw sum, caps, verdict, exact-excerpt evidence) on the
 * server. Throws ValidationFailure with the reasons when anything is off.
 */
function buildValidatedResult(
  draft: unknown,
  input: {
    attemptId: string;
    responses: Array<{ turn: 1 | 2 | 3; body: string }>;
    scenario: Scenario;
    hardGate: HardGateFinding;
  },
): JudgeResult {
  const draftParsed = JudgeModelDraftSchema.safeParse(draft);
  if (!draftParsed.success) {
    throw new ValidationFailure(
      draftParsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    );
  }

  const { rawScore, finalScore, verdict } = finalizeScore(
    draftParsed.data.rubric,
    input.hardGate,
  );

  const candidate: JudgeResult = {
    schemaVersion: "1.0",
    attemptId: input.attemptId,
    mode: "llm",
    hardGate: input.hardGate,
    rubric: draftParsed.data.rubric,
    rawScore,
    finalScore,
    verdict,
    worked: draftParsed.data.worked,
    improve: draftParsed.data.improve,
    betterResponse: draftParsed.data.betterResponse,
    outcome: draftParsed.data.outcome,
  };

  const validated = validateJudgeResult(candidate, {
    attemptId: input.attemptId,
    responses: input.responses,
    supportedOutcomeCodes: input.scenario.supportedOutcomeCodes,
  });

  if (!validated.ok) {
    throw new ValidationFailure(validated.errors);
  }
  return validated.result;
}

/**
 * One logical judgment operation: an initial provider request plus at most
 * one retry — used for transient provider failures AND for drafts that fail
 * schema/evidence validation (the retry prompt carries the exact reasons).
 */
async function judgeWithSingleRetry(
  input: JudgeCallInput & {
    attemptId: string;
    responses: Array<{ turn: 1 | 2 | 3; body: string }>;
  },
): Promise<JudgeResult> {
  let correctionErrors: string[] | null = null;
  let lastError: unknown = null;

  for (let call = 0; call < 2; call += 1) {
    try {
      const draft = await generateDraft(input, correctionErrors);
      return buildValidatedResult(draft, input);
    } catch (error) {
      lastError = error;
      if (error instanceof TimeoutError) throw error; // timeouts never retry
      if (error instanceof ValidationFailure) {
        correctionErrors = error.errors;
        continue; // one corrective retry with the exact failure reasons
      }
      const status = (error as { statusCode?: number })?.statusCode;
      const transient = status === undefined || status === 429 || status >= 500;
      if (!transient) throw error;
      // transient provider failure → fall through to the single retry
    }
  }
  throw lastError;
}

export async function handleJudgeRequest(
  rawBody: unknown,
): Promise<JudgeRouteResult> {
  // 1. Validate the request shape. Extra client fields are stripped by zod;
  //    authoritative-looking fields are explicitly rejected below.
  const parsed = JudgeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        ok: false,
        retryable: false,
        code: "judge_invalid_output",
        message:
          "That judgment request was malformed. Your conversation is safe — try again.",
      },
    };
  }
  const request = parsed.data;

  const forbiddenKeys = [
    "rubric",
    "score",
    "rawScore",
    "finalScore",
    "verdict",
    "outcome",
    "hardGate",
    "xp",
    "publicXP",
    "leaderboard",
    "personaState",
    "personaMessages",
    "messages",
    "result",
  ];
  if (
    typeof rawBody === "object" &&
    rawBody !== null &&
    forbiddenKeys.some((key) => key in rawBody)
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        retryable: false,
        code: "judge_invalid_output",
        message: "Scores, gates, outcomes, and XP are decided on the server only.",
      },
    };
  }

  // 2. Load the canonical scenario.
  const scenario = getScenarioById(request.scenarioId);
  if (!scenario) {
    return {
      status: 404,
      body: {
        ok: false,
        retryable: false,
        code: "judge_invalid_output",
        message: "Unknown scenario.",
      },
    };
  }

  // 3. Replay the canonical transcript.
  const { messages, finalPersonaState, responses } = replayTranscript(
    scenario,
    request,
  );

  // 4. Deterministic hard gates run before any model call.
  const hardGate = detectHardGates({
    responses,
    personaMessages: messages
      .filter((message) => message.speaker === "her")
      .map((message) => ({ turn: message.turn, body: message.body })),
    finalPersonaState,
    scenario,
  });

  // Test-only deterministic judge for browser/e2e runs. The real judge path
  // below is the only official scorer in any normal environment.
  if (process.env.RIZZCODE_JUDGE_MOCK === "1") {
    const mock = buildMockJudgment({
      request,
      scenario,
      messages,
      responses,
      finalPersonaState,
      hardGate,
    });
    return { status: 200, body: { ok: true, result: mock } };
  }

  // 5. The judge must be configured server-side.
  if (!isJudgeConfigured()) {
    return {
      status: 503,
      body: {
        ok: false,
        retryable: false,
        code: "judge_unconfigured",
        message:
          "The judge is not configured on this server yet. Your conversation is saved.",
      },
    };
  }

  // 6-9. Call the LLM judge (one logical operation: initial request plus at
  // most one retry for transient failures or invalid drafts), then build and
  // fully validate the result — schema, exact excerpts, arithmetic, caps, and
  // verdict are all recalculated on the server, never taken from the model.
  try {
    const result = await judgeWithSingleRetry({
      scenario,
      messages,
      finalPersonaState,
      hardGate,
      attemptId: request.attemptId,
      responses,
    });
    return { status: 200, body: { ok: true, result } };
  } catch (error) {
    if (error instanceof TimeoutError) {
      return {
        status: 504,
        body: {
          ok: false,
          retryable: true,
          code: "judge_timeout",
          message:
            "The judge took too long. Your conversation is saved — retry judgment.",
        },
      };
    }
    if (error instanceof ValidationFailure) {
      return {
        status: 502,
        body: {
          ok: false,
          retryable: true,
          code: "judge_invalid_output",
          message:
            "The judge's result failed validation. No score was recorded — retry judgment.",
        },
      };
    }
    if (isRateLimit(error)) {
      return {
        status: 429,
        body: {
          ok: false,
          retryable: true,
          code: "judge_rate_limited",
          message: "The judge is busy right now. Give it a moment and retry.",
        },
      };
    }
    return {
      status: 502,
      body: {
        ok: false,
        retryable: true,
        code: "judge_unavailable",
        message:
          "The judge could not be reached. Your conversation is saved — retry judgment.",
      },
    };
  }
}

export type { Attempt };
