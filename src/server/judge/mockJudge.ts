/**
 * TEST-ONLY deterministic judge, enabled exclusively when the dev/test server
 * sets RIZZCODE_JUDGE_MOCK=1 (see playwright.config.ts). It exists so browser
 * and e2e tests never call a real provider.
 *
 * It is NOT the official judge. The official result always comes from the
 * LLM path in route.ts. This mock still derives every score, excerpt, and
 * outcome from the actual transcript, so tests can verify that results are
 * input-sensitive and schema-valid end to end.
 */
import { finalizeScore } from "../../domain/scoring";
import type {
  CriterionId,
  Evidence,
  HardGateFinding,
  JudgeRequest,
  JudgeResult,
  OutcomeCode,
  PersonaState,
  PracticeMessage,
  RubricEntry,
  Scenario,
} from "../../domain/types";

export interface MockJudgeInput {
  request: JudgeRequest;
  scenario: Scenario;
  messages: PracticeMessage[];
  responses: Array<{ turn: 1 | 2 | 3; body: string }>;
  finalPersonaState: PersonaState;
  hardGate: HardGateFinding;
}

function excerptFor(body: string, preferredStart = 0): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "";
  const start = Math.min(preferredStart, Math.max(0, trimmed.length - 1));
  const slice = trimmed.slice(start, start + 42);
  return slice.trim().length > 0 ? slice.trim() : trimmed.slice(0, 42);
}

function scoreContext(responses: MockJudgeInput["responses"], mode: string): number {
  const lengths = responses.map((r) => r.body.trim().length);
  const average = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const tooShort = lengths.some((length) => length < 12);
  const tooLongForSpeech =
    mode === "in_person" && lengths.some((length) => length > 300);
  if (tooLongForSpeech) return 0;
  if (tooShort) return 1;
  if (average >= 20 && average <= 260) return 2;
  return 1;
}

function scoreReciprocity(responses: MockJudgeInput["responses"]): number {
  const questions = responses.filter((r) => r.body.includes("?")).length;
  const personal = responses.filter((r) => /\b(i|i'm|i've|my|me)\b/i.test(r.body)).length;
  if (questions >= 2 && personal >= 2) return 2;
  if (questions >= 1 || personal >= 1) return 1;
  return 0;
}

function scorePlayfulness(responses: MockJudgeInput["responses"]): number {
  const playful = responses.filter((r) =>
    /(!|haha|lol|😂|😄|\bjk\b|\blmao\b)/i.test(r.body),
  ).length;
  const warm = responses.filter((r) =>
    /\b(love|great|fun|thanks|appreciate|glad)\b/i.test(r.body),
  ).length;
  if (playful >= 1 && responses.length >= 2) return 2;
  if (warm >= 1) return 1;
  return 1; // neutral warmth floor for test runs
}

function scoreRespect(hardGate: HardGateFinding): number {
  if (hardGate.severity === "stop") return 0;
  if (hardGate.severity === "cap") return 1;
  return 2;
}

function scoreObjective(input: MockJudgeInput): number {
  const all = input.responses.map((r) => r.body.toLowerCase());
  const invitation = all.some((body) =>
    /\b(coffee|number|walk|join|drink|lunch|dinner|text you|see you)\b/.test(body),
  );
  const graceful = all.some((body) =>
    /\b(no worries|take care|all good|have a good|nice talking|let you go)\b/.test(
      body,
    ),
  );
  if (input.hardGate.severity !== "none") return 0;
  if (invitation || graceful) return 2;
  if (input.responses.length >= 3) return 1;
  return 1;
}

function pickOutcome(input: MockJudgeInput, finalScore: number): OutcomeCode {
  const supported = input.scenario.supportedOutcomeCodes;
  const prefer = (code: OutcomeCode): OutcomeCode | null =>
    supported.includes(code) ? code : null;

  if (input.hardGate.severity === "stop") {
    return prefer("boundary_crossed") ?? supported[0];
  }
  const lastUser = input.responses[input.responses.length - 1]?.body.toLowerCase() ?? "";
  if (/\b(no worries|take care|all good|have a good|let you go)\b/.test(lastUser)) {
    const exit = prefer("graceful_exit");
    if (exit) return exit;
  }
  if (
    input.finalPersonaState.engagement === "warm" &&
    /\b(coffee|number|drink|lunch|dinner)\b/.test(lastUser)
  ) {
    const contact =
      prefer("contact_exchanged") ?? prefer("date_invited") ?? prefer("shared_interest");
    if (contact) return contact;
  }
  if (input.finalPersonaState.engagement === "warm") {
    const shared = prefer("shared_interest") ?? prefer("conversation_continues");
    if (shared) return shared;
  }
  if (input.finalPersonaState.engagement === "low" && finalScore >= 6) {
    const exit = prefer("graceful_exit") ?? prefer("low_interest");
    if (exit) return exit;
  }
  return prefer("conversation_continues") ?? supported[0];
}

const OUTCOME_LABELS: Record<OutcomeCode, string> = {
  conversation_continues: "Comfortable continuation",
  shared_interest: "Shared interest",
  contact_exchanged: "Contact exchanged",
  date_invited: "Date invited",
  date_agreed: "Date agreed",
  graceful_exit: "Graceful exit",
  low_interest: "Low interest",
  incompatible: "Incompatibility clarified",
  boundary_crossed: "Boundary crossed",
};

export function buildMockJudgment(input: MockJudgeInput): JudgeResult {
  const { responses, hardGate } = input;
  const first = responses[0]?.body ?? "";
  const second = responses[1]?.body ?? first;
  const last = responses[responses.length - 1]?.body ?? first;

  const evidence = (turn: 1 | 2 | 3, body: string, reason: string): Evidence => ({
    turn,
    excerpt: excerptFor(body),
    reason,
  });

  const rubric: RubricEntry[] = [
    {
      id: "context_naturalness" satisfies CriterionId,
      score: scoreContext(responses, input.scenario.mode) as 0 | 1 | 2,
      evidence: evidence(1, first, "How naturally the opening fits the moment."),
      feedback: "Fit to the moment is measured from your actual lines.",
    },
    {
      id: "reciprocity_listening" satisfies CriterionId,
      score: scoreReciprocity(responses) as 0 | 1 | 2,
      evidence: evidence(
        (responses.length >= 2 ? 2 : 1) as 1 | 2 | 3,
        second,
        "Questions and personal contribution across the middle turn.",
      ),
      feedback: "Balance asking with offering something of yourself.",
    },
    {
      id: "playfulness_personality" satisfies CriterionId,
      score: scorePlayfulness(responses) as 0 | 1 | 2,
      evidence: evidence(1, first, "Voice and energy in your own words."),
      feedback: "Let one real laugh or specific detail carry your voice.",
    },
    {
      id: "respect_calibration" satisfies CriterionId,
      score: scoreRespect(hardGate) as 0 | 1 | 2,
      evidence: evidence(
        (responses.length >= 3 ? 3 : 1) as 1 | 2 | 3,
        last,
        "Escalation matched to her signals.",
      ),
      feedback: "Match her energy and leave every invitation easy to decline.",
    },
    {
      id: "challenge_objective" satisfies CriterionId,
      score: scoreObjective(input) as 0 | 1 | 2,
      evidence: evidence(
        (responses.length >= 3 ? 3 : 1) as 1 | 2 | 3,
        last,
        "Progress toward this scenario's objective.",
      ),
      feedback: "Keep the scenario objective in view without forcing it.",
    },
  ];

  const { rawScore, finalScore, verdict } = finalizeScore(rubric, hardGate);
  const outcomeCode = pickOutcome(input, finalScore);

  return {
    schemaVersion: "1.0",
    attemptId: input.request.attemptId,
    mode: "llm",
    hardGate,
    rubric,
    rawScore,
    finalScore,
    verdict,
    worked: ["You stayed in the moment and kept the thread moving."],
    improve: ["Add one specific detail from her words before you pivot."],
    betterResponse: excerptFor(last) || "Tell me more about that.",
    outcome: {
      code: outcomeCode,
      label: OUTCOME_LABELS[outcomeCode],
      confidence: "medium",
      basis: [
        {
          turn: (responses.length >= 3 ? 3 : 1) as 1 | 2 | 3,
          excerpt: excerptFor(last),
          reason: "The simulated outcome follows from your final turns.",
        },
      ],
    },
  };
}
