import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Attempt, Milestone, Progress, UserProfile } from "../domain/types";
import {
  MAX_ATTEMPTS,
  STORAGE_KEYS,
  appendAttempt,
  appendMilestone,
  defaultProfile,
  defaultProgress,
  getAttempt,
  isFallbackActive,
  isRecord,
  loadAttempts,
  loadMilestones,
  loadProfile,
  loadProgress,
  readRecord,
  removeMilestone,
  resetAllProgress,
  resetForTests,
  saveAttempts,
  saveMilestones,
  saveProfile,
  saveProgress,
  storageAvailable,
  storageWarning,
  updateAttempt,
  writeRecord,
} from "./index";

/**
 * This test environment (Node's global localStorage shadowing jsdom's) has no
 * working window.localStorage, so install a fresh spec-shaped mock before
 * each test. The mock is installed with a configurable getter so tests can
 * redefine it (e.g. to simulate storage that throws) and restore it after.
 */
class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function makeAttempt(id: string, overrides: Partial<Attempt> = {}): Attempt {
  return {
    id,
    scenarioId: "scenario-1",
    messages: [
      {
        id: `${id}-m1`,
        speaker: "you",
        body: "hey",
        turn: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    userTurn: 1,
    status: "active",
    startedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMilestone(
  id: string,
  kind: Milestone["kind"] = "good_conversation",
): Milestone {
  return { id, kind, note: "a note", recordedAt: "2026-01-01T00:00:00.000Z" };
}

beforeEach(() => {
  const mock = new LocalStorageMock();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    enumerable: true,
    get: () => mock,
  });
  resetForTests();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("profileStore", () => {
  it("round-trips a profile", () => {
    const profile: UserProfile = {
      ...defaultProfile(),
      displayName: "Ed",
      goals: ["confidence"],
      typeDescription: "curious",
      desiredRelationship: "long-term",
      struggles: ["openers"],
      onboardingComplete: true,
    };
    expect(saveProfile(profile)).toBe(true);
    const { profile: loaded, recovered } = loadProfile();
    expect(recovered).toBe(false);
    expect(loaded).toEqual(profile);
  });

  it("returns the default profile when missing", () => {
    const { profile, recovered } = loadProfile();
    expect(profile).toEqual(defaultProfile());
    expect(profile.displayName).toBe("You");
    expect(profile.onboardingComplete).toBe(false);
    expect(recovered).toBe(false);
  });

  it("rejects an invalid shape and removes only that key", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({ version: 2, displayName: 42 }),
    );
    const { profile, recovered } = loadProfile();
    expect(recovered).toBe(true);
    expect(profile).toEqual(defaultProfile());
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });
});

describe("progressStore", () => {
  it("round-trips progress", () => {
    const progress: Progress = {
      ...defaultProgress(),
      publicXP: 120,
      level: 2,
      streak: 3,
      lastPracticeDay: "2026-01-02",
      bestScores: { "scenario-1": 8 },
      bestMasteryXP: { spark: 40 },
      completedScenarioIds: ["scenario-1"],
      achievements: ["first_rep"],
    };
    expect(saveProgress(progress)).toBe(true);
    const { progress: loaded, recovered } = loadProgress();
    expect(recovered).toBe(false);
    expect(loaded).toEqual(progress);
  });

  it("rejects out-of-bounds or wrongly typed values", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.progress,
      JSON.stringify({ ...defaultProgress(), publicXP: -1 }),
    );
    expect(loadProgress().recovered).toBe(true);
    expect(loadProgress().progress).toEqual(defaultProgress());

    window.localStorage.setItem(
      STORAGE_KEYS.progress,
      JSON.stringify({ ...defaultProgress(), level: 0 }),
    );
    expect(loadProgress().progress).toEqual(defaultProgress());

    window.localStorage.setItem(
      STORAGE_KEYS.progress,
      JSON.stringify({ ...defaultProgress(), bestScores: { a: "high" } }),
    );
    expect(loadProgress().progress).toEqual(defaultProgress());
  });
});

describe("attemptStore", () => {
  it("round-trips attempts newest first", () => {
    appendAttempt(makeAttempt("a-1"));
    appendAttempt(makeAttempt("a-2"));
    const { attempts, recovered } = loadAttempts();
    expect(recovered).toBe(false);
    expect(attempts.map((a) => a.id)).toEqual(["a-2", "a-1"]);
  });

  it("caps history at 100 attempts, keeping the newest", () => {
    for (let i = 0; i < MAX_ATTEMPTS + 5; i += 1) {
      appendAttempt(makeAttempt(`a-${i}`));
    }
    const { attempts } = loadAttempts();
    expect(attempts).toHaveLength(MAX_ATTEMPTS);
    expect(attempts[0]?.id).toBe(`a-${MAX_ATTEMPTS + 4}`);
    expect(attempts[attempts.length - 1]?.id).toBe("a-5");
  });

  it("drops invalid entries individually instead of nuking the list", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([
        makeAttempt("good-1"),
        { id: 7, status: "bogus" },
        makeAttempt("good-2", { status: "complete", userTurn: 3 }),
      ]),
    );
    const { attempts, recovered } = loadAttempts();
    expect(recovered).toBe(true);
    expect(attempts.map((a) => a.id)).toEqual(["good-1", "good-2"]);
  });

  it("updateAttempt replaces an attempt by id", () => {
    appendAttempt(makeAttempt("a-1"));
    appendAttempt(makeAttempt("a-2"));
    updateAttempt(makeAttempt("a-1", { status: "complete", userTurn: 3 }));
    const updated = getAttempt("a-1");
    expect(updated?.status).toBe("complete");
    expect(updated?.userTurn).toBe(3);
    expect(loadAttempts().attempts.map((a) => a.id)).toEqual(["a-2", "a-1"]);
  });

  it("getAttempt returns null for unknown ids", () => {
    expect(getAttempt("nope")).toBeNull();
  });
});

describe("milestoneStore", () => {
  it("round-trips milestones in insertion order", () => {
    appendMilestone(makeMilestone("m-1", "good_conversation"));
    appendMilestone(makeMilestone("m-2", "went_on_date"));
    const { milestones, recovered } = loadMilestones();
    expect(recovered).toBe(false);
    expect(milestones.map((m) => m.id)).toEqual(["m-1", "m-2"]);
  });

  it("removes milestones by id", () => {
    saveMilestones([makeMilestone("m-1"), makeMilestone("m-2")]);
    removeMilestone("m-1");
    expect(loadMilestones().milestones.map((m) => m.id)).toEqual(["m-2"]);
  });

  it("drops milestones with unknown kinds individually", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.milestones,
      JSON.stringify([
        makeMilestone("m-1"),
        { id: "m-2", kind: "not_a_kind", note: "", recordedAt: "x" },
      ]),
    );
    const { milestones, recovered } = loadMilestones();
    expect(recovered).toBe(true);
    expect(milestones.map((m) => m.id)).toEqual(["m-1"]);
  });
});

describe("per-record recovery", () => {
  it("corrupt JSON in one key resets only that key", () => {
    const profile: UserProfile = { ...defaultProfile(), displayName: "Ed" };
    saveProfile(profile);
    saveAttempts([makeAttempt("a-1")]);

    window.localStorage.setItem(STORAGE_KEYS.attempts, "{corrupt json");

    const attempts = loadAttempts();
    expect(attempts.recovered).toBe(true);
    expect(attempts.attempts).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull();

    const { profile: loaded, recovered } = loadProfile();
    expect(recovered).toBe(false);
    expect(loaded).toEqual(profile);
  });
});

describe("localStorage unavailable", () => {
  it("falls back to memory and surfaces a warning when access throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("denied");
      },
    });
    try {
      resetForTests();
      expect(storageAvailable()).toBe(false);

      const profile: UserProfile = { ...defaultProfile(), displayName: "Mem" };
      expect(saveProfile(profile)).toBe(false);
      expect(loadProfile().profile).toEqual(profile);

      expect(isFallbackActive()).toBe(true);
      const warning = storageWarning();
      expect(typeof warning).toBe("string");
      expect(warning?.length).toBeGreaterThan(0);
    } finally {
      if (original) {
        Object.defineProperty(window, "localStorage", original);
      } else {
        delete (window as unknown as Record<string, unknown>).localStorage;
      }
      resetForTests();
    }
  });

  it("switches to memory on write (quota) errors and returns false", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });
    expect(writeRecord("rizzcode.v1.probe-test", { a: 1 })).toBe(false);

    const { value, recovered } = readRecord<{ a: number }>(
      "rizzcode.v1.probe-test",
      (raw) => (isRecord(raw) && typeof raw.a === "number" ? { a: raw.a } : null),
    );
    expect(recovered).toBe(false);
    expect(value).toEqual({ a: 1 });
    expect(storageWarning()).not.toBeNull();
  });
});

describe("resetAllProgress", () => {
  it("clears progress, attempts, and milestones but keeps the profile", () => {
    saveProfile({ ...defaultProfile(), displayName: "Keep Me" });
    saveProgress({ ...defaultProgress(), publicXP: 50 });
    saveAttempts([makeAttempt("a-1")]);
    saveMilestones([makeMilestone("m-1")]);

    resetAllProgress();

    expect(loadProfile().profile.displayName).toBe("Keep Me");
    expect(loadProgress().progress).toEqual(defaultProgress());
    expect(loadAttempts().attempts).toEqual([]);
    expect(loadMilestones().milestones).toEqual([]);

    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.progress)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.milestones)).toBeNull();
  });
});

describe("storageWarning", () => {
  it("is null while localStorage works", () => {
    expect(storageWarning()).toBeNull();
  });
});
