/**
 * RizzCode client-side persistence layer.
 *
 * Versioned localStorage records with validation, per-record recovery, an
 * in-memory fallback when storage is unavailable, and a user-initiated
 * progress reset. Never stores secrets or real-person social data.
 */

export * from "./safeStorage";
export * from "./profileStore";
export * from "./progressStore";
export * from "./attemptStore";
export * from "./milestoneStore";

import { STORAGE_KEYS, isFallbackActive, removeRecord } from "./safeStorage";

/**
 * User-initiated "reset progress": removes only the progress, attempts, and
 * milestones records (achievements live inside the progress record). The
 * profile is kept.
 */
export function resetAllProgress(): void {
  removeRecord(STORAGE_KEYS.progress);
  removeRecord(STORAGE_KEYS.attempts);
  removeRecord(STORAGE_KEYS.milestones);
}

/**
 * Human-readable, non-blocking warning shown when the in-memory fallback is
 * active. Null while real localStorage works.
 */
export function storageWarning(): string | null {
  if (!isFallbackActive()) return null;
  return "Local storage is unavailable, so your progress will only be kept for this session.";
}
