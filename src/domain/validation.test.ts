import { describe, expect, it } from "vitest";
import { validateJudgeResult } from "./validation.js";
import type { JudgeResult, RubricEntry } from "./types.js";

const responses: Array<{ turn: 1 | 2 | 3; body: string }> = [
  { turn: 1, body: "Ten minutes late again - this bus has commitment issues." },
  { turn: 2, body: "What book are you reading?" },
  { turn: 3, body: "No way, I loved that one." },
];

const supportedOutcomeCodes = [
  "conversation_continues",
  "shared_interest",
  "graceful_exit",
  "low_interest",
  "boundary_crossed",
] as const;

function rubricEntry(
  id: RubricEntry["id"],
  score: 0 | 1 | 2,
  excerpt: string,
  turn: 1 | 2 | 3 = 1,
): RubricEntry {
  return {
    id,
    score,
    evidence: { turn, excerpt, reason: "because" },
    feedback: "feedback",
  };
}

function validResult(): JudgeResult {
  return {
    schemaVersion: "1.0",
    attemptId: "attempt-1",
    mode: "llm",
    hardGate: {
      triggered: false,
      severity: "none",
      codes: [],
      maxScore: 10,
      evidence: [],
    },
    rubric: [
      rubricEntry("context_naturalness", 2, "this bus has commitment issues."),
      rubricEntry("reciprocity_listening", 2, "What book are you reading?", 2),
      rubricEntry("playfulness_personality", 1, "commitment issues"),
      rubricEntry("respect_calibration", 2, "What book", 2),
      rubricEntry("challenge_objective", 1, "No way, I loved that one.", 3),
    ],
    rawScore: 8,
    finalScore: 8,
    verdict: "ATE",
    worked: ["Specific situational opener"],
    improve: ["Ask one follow-up question"],
    betterResponse: "Ten minutes late? This bus and I both have commitment issues.",
    outcome: {
      code: "conversation_continues",
      label: "Comfortable continuation",
      confidence: "medium",
      basis: [{ turn: 1, excerpt: "commitment issues", reason: "playful opener" }],
    },
  };
}

function validate(result: unknown, resp = responses) {
  return validateJudgeResult(result, {
    attemptId: "attempt-1",
    responses: resp,
    supportedOutcomeCodes: [...supportedOutcomeCodes],
  });
}

describe("validateJudgeResult: acceptance", () => {
  it("accepts a well-formed result", () => {
    const outcome = validate(validResult());
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.attemptId).toBe("attempt-1");
    }
  });
});

describe("validateJudgeResult: rejection", () => {
  it("rejects a missing criterion", () => {
    const result = validResult();
    result.rubric = result.rubric.slice(0, 4);
    result.rawScore = 7;
    result.finalScore = 7;
    result.verdict = "COOKED";
    expect(validate(result).ok).toBe(false);
  });

  it("rejects duplicate criterion ids", () => {
    const result = validResult();
    result.rubric[4] = rubricEntry("context_naturalness", 1, "commitment issues");
    const outcome = validate(result);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.errors.join(" ")).toContain("unique");
    }
  });

  it("rejects a score of 3", () => {
    const result = validResult();
    (result.rubric[0] as { score: number }).score = 3;
    expect(validate(result).ok).toBe(false);
  });

  it("rejects a wrong rawScore", () => {
    const result = validResult();
    result.rawScore = 9;
    expect(validate(result).ok).toBe(false);
  });

  it("rejects a finalScore above the hard-gate cap", () => {
    const result = validResult();
    result.hardGate = {
      triggered: true,
      severity: "cap",
      codes: ["insult_negging"],
      maxScore: 4,
      evidence: [],
    };
    // raw 8, cap 4 -> final must be 4, but leave it at 8.
    expect(validate(result).ok).toBe(false);
  });

  it("rejects a verdict that does not match the final score", () => {
    const result = validResult();
    result.verdict = "COOKED";
    expect(validate(result).ok).toBe(false);
  });

  it("rejects an excerpt that is not in the cited turn", () => {
    const result = validResult();
    result.rubric[0].evidence.excerpt = "this bus has commitment issues?";
    expect(validate(result).ok).toBe(false);
  });

  it("rejects evidence citing turn 4", () => {
    const result = validResult();
    result.rubric[0].evidence = {
      turn: 4 as unknown as 1,
      excerpt: "anything",
      reason: "bad turn",
    };
    expect(validate(result).ok).toBe(false);
  });

  it("rejects evidence citing a turn the attempt never reached", () => {
    const result = validResult();
    result.rubric[0].evidence = {
      turn: 3,
      excerpt: "No way",
      reason: "fine excerpt, but attempt ended at turn 2",
    };
    const outcome = validate(result, responses.slice(0, 2));
    expect(outcome.ok).toBe(false);
  });

  it("rejects an unsupported outcome code", () => {
    const result = validResult();
    result.outcome.code = "date_agreed";
    expect(validate(result).ok).toBe(false);
  });

  it("rejects an empty betterResponse", () => {
    const result = validResult();
    result.betterResponse = "";
    expect(validate(result).ok).toBe(false);
  });

  it("rejects empty worked/improve arrays", () => {
    const noWorked = validResult();
    noWorked.worked = [];
    expect(validate(noWorked).ok).toBe(false);

    const noImprove = validResult();
    noImprove.improve = [];
    expect(validate(noImprove).ok).toBe(false);
  });

  it("rejects a mismatched attemptId", () => {
    const result = validResult();
    result.attemptId = "attempt-2";
    expect(validate(result).ok).toBe(false);
  });
});
