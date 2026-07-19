/**
 * Public practice XP (leaderboard choice A).
 *
 *   masteryXP     = finalScore * 10 + difficultyBonus
 *   publicXPDelta = max(0, masteryXP - previousBest) + 10 on first valid
 *                   completion only
 *
 * Stop-level violations award 0. Replays only earn improvement beyond the
 * scenario's previous best (docs/RIZZCODE_MASTER_PLAN.md, "Gamification").
 */

import { DIFFICULTY_BONUS, type Difficulty } from "./types.js";

export function masteryXPFor(finalScore: number, difficulty: Difficulty): number {
  return finalScore * 10 + DIFFICULTY_BONUS[difficulty];
}

export function xpDeltaFor(input: {
  finalScore: number;
  difficulty: Difficulty;
  previousBestMasteryXP: number | undefined;
  stopViolation: boolean;
}): { masteryXP: number; publicXPDelta: number } {
  if (input.stopViolation) {
    return { masteryXP: 0, publicXPDelta: 0 };
  }
  const masteryXP = masteryXPFor(input.finalScore, input.difficulty);
  const improvement = Math.max(
    0,
    masteryXP - (input.previousBestMasteryXP ?? 0),
  );
  const firstCompletionBonus = input.previousBestMasteryXP === undefined ? 10 : 0;
  return { masteryXP, publicXPDelta: improvement + firstCompletionBonus };
}

export function levelFor(totalPublicXP: number): number {
  return Math.floor(totalPublicXP / 250) + 1;
}
