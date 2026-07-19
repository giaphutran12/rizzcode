/**
 * UserProfile persistence (key: rizzcode.v1.profile).
 */

import type { UserProfile } from "../domain/types";
import {
  STORAGE_KEYS,
  isRecord,
  isString,
  isStringArray,
  readRecord,
  removeRecord,
  writeRecord,
} from "./safeStorage";

export function defaultProfile(): UserProfile {
  return {
    version: 1,
    displayName: "You",
    goals: [],
    typeDescription: "",
    desiredRelationship: "",
    struggles: [],
    onboardingComplete: false,
  };
}

/** Strict, coercion-free validation. Rejects wrong versions. */
export function validateProfile(value: unknown): UserProfile | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!isString(value.displayName)) return null;
  if (!isStringArray(value.goals)) return null;
  if (!isString(value.typeDescription)) return null;
  if (!isString(value.desiredRelationship)) return null;
  if (!isStringArray(value.struggles)) return null;
  if (typeof value.onboardingComplete !== "boolean") return null;
  return {
    version: 1,
    displayName: value.displayName,
    goals: [...value.goals],
    typeDescription: value.typeDescription,
    desiredRelationship: value.desiredRelationship,
    struggles: [...value.struggles],
    onboardingComplete: value.onboardingComplete,
  };
}

/**
 * Loads the stored profile, falling back to the default when missing or
 * corrupt. `recovered` is true when a corrupt record had to be reset.
 */
export function loadProfile(): { profile: UserProfile; recovered: boolean } {
  const { value, recovered } = readRecord(STORAGE_KEYS.profile, validateProfile);
  return { profile: value ?? defaultProfile(), recovered };
}

/** Returns false when the write landed in the in-memory fallback. */
export function saveProfile(profile: UserProfile): boolean {
  return writeRecord(STORAGE_KEYS.profile, profile);
}

export function clearProfile(): void {
  removeRecord(STORAGE_KEYS.profile);
}
