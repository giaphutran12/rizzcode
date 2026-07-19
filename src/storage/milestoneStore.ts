/**
 * Private real-world milestone persistence (key: rizzcode.v1.milestones).
 */

import type { Milestone, MilestoneId } from "../domain/types";
import {
  STORAGE_KEYS,
  isRecord,
  isString,
  readRecord,
  removeRecord,
  writeRecord,
} from "./safeStorage";

const MILESTONE_IDS: readonly MilestoneId[] = [
  "good_conversation",
  "contact_exchanged",
  "received_reply",
  "date_scheduled",
  "went_on_date",
  "second_date",
  "graceful_exit",
];

/** Validates one milestone; kinds must be in the MilestoneId union. */
export function validateMilestone(value: unknown): Milestone | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id)) return null;
  if (
    !isString(value.kind) ||
    !(MILESTONE_IDS as readonly string[]).includes(value.kind)
  ) {
    return null;
  }
  if (!isString(value.note)) return null;
  if (!isString(value.recordedAt)) return null;
  return {
    id: value.id,
    kind: value.kind as MilestoneId,
    note: value.note,
    recordedAt: value.recordedAt,
  };
}

/**
 * Loads milestones in insertion order. Individual invalid entries are
 * dropped; `recovered` is true when any entry was dropped or the whole
 * record had to be reset.
 */
export function loadMilestones(): {
  milestones: Milestone[];
  recovered: boolean;
} {
  let dropped = false;
  const { value, recovered } = readRecord(STORAGE_KEYS.milestones, (raw) => {
    if (!Array.isArray(raw)) return null;
    const milestones: Milestone[] = [];
    for (const entry of raw) {
      const milestone = validateMilestone(entry);
      if (milestone) milestones.push(milestone);
      else dropped = true;
    }
    return milestones;
  });
  return { milestones: value ?? [], recovered: recovered || dropped };
}

export function saveMilestones(milestones: Milestone[]): boolean {
  return writeRecord(STORAGE_KEYS.milestones, milestones);
}

/** Appends a milestone (replacing any existing entry with the same id). */
export function appendMilestone(milestone: Milestone): Milestone[] {
  const { milestones } = loadMilestones();
  const next = [...milestones.filter((m) => m.id !== milestone.id), milestone];
  saveMilestones(next);
  return next;
}

export function removeMilestone(id: string): Milestone[] {
  const { milestones } = loadMilestones();
  const next = milestones.filter((m) => m.id !== id);
  saveMilestones(next);
  return next;
}

export function clearMilestones(): void {
  removeRecord(STORAGE_KEYS.milestones);
}
