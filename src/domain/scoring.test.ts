import { describe, expect, it } from "vitest";
import { applyCap, finalizeScore, sumRubric, verdictFor } from "./scoring.js";
import type { HardGateFinding, RubricEntry } from "./types.js";

function entry(score: 0 | 1 | 2): RubricEntry {
  return {
    id: "context_naturalness",
    score,
    evidence: { turn: 1, excerpt: "hi", reason: "fixture" },
    feedback: "fixture",
  };
}

function gate(maxScore: 2 | 4 | 10): HardGateFinding {
  return {
    triggered: maxScore !== 10,
    severity: maxScore === 2 ? "stop" : maxScore === 4 ? "cap" : "none",
    codes: [],
    maxScore,
    evidence: [],
  };
}

describe("sumRubric", () => {
  it("sums criterion scores", () => {
    expect(sumRubric([entry(2), entry(1), entry(0), entry(2), entry(1)])).toBe(6);
    expect(sumRubric([])).toBe(0);
  });
});

describe("applyCap", () => {
  it("caps at the gate maximum", () => {
    expect(applyCap(9, 4)).toBe(4);
    expect(applyCap(1, 2)).toBe(1);
    expect(applyCap(7, 10)).toBe(7);
  });
});

describe("verdictFor", () => {
  it("0-3 FUMBLED, 4-7 COOKED, 8-10 ATE", () => {
    expect(verdictFor(0)).toBe("FUMBLED");
    expect(verdictFor(3)).toBe("FUMBLED");
    expect(verdictFor(4)).toBe("COOKED");
    expect(verdictFor(7)).toBe("COOKED");
    expect(verdictFor(8)).toBe("ATE");
    expect(verdictFor(10)).toBe("ATE");
  });
});

describe("finalizeScore", () => {
  it("raw is the sum, final honors the cap, verdict follows final", () => {
    expect(finalizeScore([entry(2), entry(2), entry(2), entry(2), entry(2)], gate(10))).toEqual({
      rawScore: 10,
      finalScore: 10,
      verdict: "ATE",
    });
    expect(finalizeScore([entry(2), entry(2), entry(2), entry(2), entry(2)], gate(4))).toEqual({
      rawScore: 10,
      finalScore: 4,
      verdict: "COOKED",
    });
    expect(finalizeScore([entry(2), entry(2), entry(2), entry(2), entry(2)], gate(2))).toEqual({
      rawScore: 10,
      finalScore: 2,
      verdict: "FUMBLED",
    });
  });
});
