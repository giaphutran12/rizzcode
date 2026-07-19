/**
 * Progress persistence (key: rizzcode.v1.progress).
 */

import type { Progress } from "../domain/types";
import {
  STORAGE_KEYS,
  isFiniteNumber,
  isNumberRecord,
  isRecord,
  isString,
  isStringArray,
  readRecord,
  removeRecord,
  writeRecord,
} from "./safeStorage";

export function defaultProgress(): Progress {
  return {
    version: 1,
    publicXP: 0,
    level: 1,
    streak: 0,
    lastPracticeDay: null,
    bestScores: {},
    bestMasteryXP: {},
    completedScenarioIds: [],
    achievements: [],
  };
}

/** Strict, coercion-free validation with bounds checks. Rejects wrong versions. */
export function validateProgress(value: unknown): Progress | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!isFiniteNumber(value.publicXP) || value.publicXP < 0) return null;
  if (!isFiniteNumber(value.level) || value.level < 1) return null;
  if (!isFiniteNumber(value.streak) || value.streak < 0) return null;
  if (value.lastPracticeDay !== null && !isString(value.lastPracticeDay)) {
    return null;
  }
  if (!isNumberRecord(value.bestScores)) return null;
  if (!isNumberRecord(value.bestMasteryXP)) return null;
  if (!isStringArray(value.completedScenarioIds)) return null;
  if (!isStringArray(value.achievements)) return null;
  return {
    version: 1,
    publicXP: value.publicXP,
    level: value.level,
    streak: value.streak,
    lastPracticeDay: value.lastPracticeDay,
    bestScores: { ...value.bestScores },
    bestMasteryXP: { ...value.bestMasteryXP },
    completedScenarioIds: [...value.completedScenarioIds],
    achievements: [...value.achievements],
  };
}

/**
 * Loads stored progress, falling back to the default when missing or corrupt.
 * A corrupt record resets only the progress record, never other keys.
 */
export function loadProgress(): { progress: Progress; recovered: boolean } {
  const { value, recovered } = readRecord(
    STORAGE_KEYS.progress,
    validateProgress,
  );
  return { progress: value ?? defaultProgress(), recovered };
}

/** Returns false when the write landed in the in-memory fallback. */
export function saveProgress(progress: Progress): boolean {
  return writeRecord(STORAGE_KEYS.progress, progress);
}

export function clearProgress(): void {
  removeRecord(STORAGE_KEYS.progress);
}
