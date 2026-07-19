/**
 * Deterministic score arithmetic around the LLM judgment.
 * The model never owns these numbers (docs/RIZZCODE_MASTER_PLAN.md,
 * "Judge rubric", "Verdicts", "Hard gates").
 */

import type { HardGateFinding, RubricEntry, Verdict } from "./types.js";

export function sumRubric(rubric: RubricEntry[]): number {
  return rubric.reduce((sum, entry) => sum + entry.score, 0);
}

export function applyCap(raw: number, maxScore: 2 | 4 | 10): number {
  return Math.min(raw, maxScore);
}

/** 0-3 FUMBLED, 4-7 COOKED, 8-10 ATE. */
export function verdictFor(finalScore: number): Verdict {
  if (finalScore <= 3) return "FUMBLED";
  if (finalScore <= 7) return "COOKED";
  return "ATE";
}

export function finalizeScore(
  rubric: RubricEntry[],
  hardGate: HardGateFinding,
): { rawScore: number; finalScore: number; verdict: Verdict } {
  const rawScore = sumRubric(rubric);
  const finalScore = applyCap(rawScore, hardGate.maxScore);
  return { rawScore, finalScore, verdict: verdictFor(finalScore) };
}
