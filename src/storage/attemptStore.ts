/**
 * Attempt history persistence (key: rizzcode.v1.attempts).
 *
 * Attempts are stored newest first with a hard cap of MAX_ATTEMPTS entries.
 * Invalid entries are dropped individually on load rather than discarding the
 * whole history.
 */

import type { Attempt, AttemptStatus, PracticeMessage } from "../domain/types";
import {
  STORAGE_KEYS,
  isFiniteNumber,
  isRecord,
  isString,
  readRecord,
  removeRecord,
  writeRecord,
} from "./safeStorage";

export const MAX_ATTEMPTS = 100;

const ATTEMPT_STATUSES: readonly AttemptStatus[] = [
  "idle",
  "active",
  "awaiting_reply",
  "awaiting_judgment",
  "complete",
  "error",
];

const USER_TURNS: readonly number[] = [0, 1, 2, 3];

function validateMessage(value: unknown): PracticeMessage | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id)) return null;
  if (value.speaker !== "you" && value.speaker !== "her") return null;
  if (!isString(value.body)) return null;
  if (!isFiniteNumber(value.turn)) return null;
  if (!isString(value.createdAt)) return null;
  return {
    id: value.id,
    speaker: value.speaker as PracticeMessage["speaker"],
    body: value.body,
    turn: value.turn,
    createdAt: value.createdAt,
  };
}

/** Validates one attempt; returns null when any required field is off. */
export function validateAttempt(value: unknown): Attempt | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id)) return null;
  if (!isString(value.scenarioId)) return null;
  if (!Array.isArray(value.messages)) return null;
  const messages: PracticeMessage[] = [];
  for (const raw of value.messages) {
    const message = validateMessage(raw);
    if (!message) return null;
    messages.push(message);
  }
  if (!isFiniteNumber(value.userTurn) || !USER_TURNS.includes(value.userTurn)) {
    return null;
  }
  if (
    !isString(value.status) ||
    !(ATTEMPT_STATUSES as readonly string[]).includes(value.status)
  ) {
    return null;
  }
  if (!isString(value.startedAt)) return null;
  if (value.completedAt !== undefined && !isString(value.completedAt)) {
    return null;
  }
  if (value.result !== undefined && !isRecord(value.result)) return null;

  const attempt: Attempt = {
    id: value.id,
    scenarioId: value.scenarioId,
    messages,
    userTurn: value.userTurn as Attempt["userTurn"],
    status: value.status as AttemptStatus,
    startedAt: value.startedAt,
  };
  if (value.completedAt !== undefined) {
    attempt.completedAt = value.completedAt as string;
  }
  if (value.result !== undefined) {
    attempt.result = value.result as unknown as Attempt["result"];
  }
  return attempt;
}

/**
 * Loads the attempt history (newest first, at most MAX_ATTEMPTS entries).
 * Individual invalid entries are dropped; `recovered` is true when any entry
 * was dropped or the whole record had to be reset.
 */
export function loadAttempts(): { attempts: Attempt[]; recovered: boolean } {
  let dropped = false;
  const { value, recovered } = readRecord(STORAGE_KEYS.attempts, (raw) => {
    if (!Array.isArray(raw)) return null;
    const attempts: Attempt[] = [];
    for (const entry of raw) {
      const attempt = validateAttempt(entry);
      if (attempt) attempts.push(attempt);
      else dropped = true;
    }
    if (attempts.length > MAX_ATTEMPTS) {
      attempts.length = MAX_ATTEMPTS;
      dropped = true;
    }
    return attempts;
  });
  return { attempts: value ?? [], recovered: recovered || dropped };
}

/** Saves the history, truncating to MAX_ATTEMPTS. Newest first. */
export function saveAttempts(attempts: Attempt[]): boolean {
  return writeRecord(STORAGE_KEYS.attempts, attempts.slice(0, MAX_ATTEMPTS));
}

/** Prepends an attempt and truncates to MAX_ATTEMPTS. Returns the new list. */
export function appendAttempt(attempt: Attempt): Attempt[] {
  const { attempts } = loadAttempts();
  const next = [attempt, ...attempts.filter((a) => a.id !== attempt.id)].slice(
    0,
    MAX_ATTEMPTS,
  );
  saveAttempts(next);
  return next;
}

/**
 * Replaces the attempt with the same id. If no attempt has that id it is
 * prepended instead. Returns the new list.
 */
export function updateAttempt(attempt: Attempt): Attempt[] {
  const { attempts } = loadAttempts();
  const exists = attempts.some((a) => a.id === attempt.id);
  const next = (
    exists
      ? attempts.map((a) => (a.id === attempt.id ? attempt : a))
      : [attempt, ...attempts]
  ).slice(0, MAX_ATTEMPTS);
  saveAttempts(next);
  return next;
}

export function getAttempt(id: string): Attempt | null {
  const { attempts } = loadAttempts();
  return attempts.find((a) => a.id === id) ?? null;
}

export function clearAttempts(): void {
  removeRecord(STORAGE_KEYS.attempts);
}
