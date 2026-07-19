/**
 * Low-level storage wrapper for RizzCode persistence.
 *
 * Uses versioned localStorage keys when possible and transparently falls back
 * to an in-memory Map when localStorage is unavailable (blocked, throws on
 * access, quota exceeded). Only non-sensitive practice data is ever stored —
 * never secrets and never real-person social data.
 */

export const STORAGE_KEYS = {
  profile: "rizzcode.v1.profile",
  progress: "rizzcode.v1.progress",
  attempts: "rizzcode.v1.attempts",
  milestones: "rizzcode.v1.milestones",
} as const;

let cachedAvailable: boolean | null = null;
let fallbackActive = false;
const memoryStore = new Map<string, string>();

function activateFallback(): void {
  cachedAvailable = false;
  fallbackActive = true;
}

function probe(): boolean {
  if (cachedAvailable !== null) return cachedAvailable;
  if (typeof window === "undefined") {
    activateFallback();
    return false;
  }
  try {
    const probeKey = "rizzcode.v1.__probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    cachedAvailable = true;
  } catch {
    activateFallback();
  }
  return cachedAvailable ?? false;
}

/**
 * True when real localStorage is usable. Availability is detected once with a
 * set/remove probe and then cached; it flips to false permanently (until
 * resetForTests) if any storage operation throws.
 */
export function storageAvailable(): boolean {
  return probe();
}

/**
 * True when the in-memory fallback is active. The UI uses this to show a
 * non-blocking warning that data only lives for the current session.
 */
export function isFallbackActive(): boolean {
  probe();
  return fallbackActive;
}

/**
 * Reads and validates one record. On a JSON parse error or failed validation
 * only that key is removed and `{ value: null, recovered: true }` is
 * returned. Never throws.
 */
export function readRecord<T>(
  key: string,
  validate: (value: unknown) => T | null,
): { value: T | null; recovered: boolean } {
  let raw: string | null;
  try {
    raw = storageAvailable()
      ? window.localStorage.getItem(key)
      : (memoryStore.get(key) ?? null);
  } catch {
    activateFallback();
    raw = memoryStore.get(key) ?? null;
  }
  if (raw === null) return { value: null, recovered: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeRecord(key);
    return { value: null, recovered: true };
  }

  const value = validate(parsed);
  if (value === null) {
    removeRecord(key);
    return { value: null, recovered: true };
  }
  return { value, recovered: false };
}

/**
 * Serializes and writes one record. Returns true when the value landed in
 * real localStorage. On quota or any other error the write switches to the
 * in-memory fallback and false is returned so the caller can surface the
 * warning state. Never throws.
 */
export function writeRecord(key: string, value: unknown): boolean {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = undefined;
  }
  if (typeof serialized !== "string") return false;

  if (storageAvailable()) {
    try {
      window.localStorage.setItem(key, serialized);
      return true;
    } catch {
      activateFallback();
    }
  }
  memoryStore.set(key, serialized);
  return false;
}

/** Removes one record from whichever backend is active. Never throws. */
export function removeRecord(key: string): void {
  memoryStore.delete(key);
  if (storageAvailable()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      activateFallback();
    }
  }
}

/** Test hook: clears the in-memory fallback and cached availability. */
export function resetForTests(): void {
  memoryStore.clear();
  cachedAvailable = null;
  fallbackActive = false;
}

// ---------------------------------------------------------------------------
// Shared validators
// ---------------------------------------------------------------------------

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNumberRecord(
  value: unknown,
): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(isFiniteNumber);
}
