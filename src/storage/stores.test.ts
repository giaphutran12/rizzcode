import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProgress } from "../domain/progression";
import {
  loadAllRecords,
  STORAGE_KEYS,
  writeRecord,
} from "./stores";

describe("versioned local storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("recovers only the corrupt record", () => {
    window.localStorage.setItem(STORAGE_KEYS.profile, "{not-json");
    writeRecord(STORAGE_KEYS.progress, {
      ...defaultProgress,
      publicXP: 90,
    });
    const loaded = loadAllRecords();
    expect(loaded.profile.onboardingComplete).toBe(false);
    expect(loaded.progress.publicXP).toBe(90);
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(loaded.warning).toMatch(/damaged progress record/i);
  });

  it("retains valid versioned records", () => {
    writeRecord(STORAGE_KEYS.progress, {
      ...defaultProgress,
      publicXP: 250,
      level: 2,
    });
    expect(loadAllRecords().progress).toMatchObject({
      publicXP: 250,
      level: 2,
    });
  });

  it("continues in memory when storage writes are unavailable", () => {
    const failure = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("quota");
      });
    expect(
      writeRecord(STORAGE_KEYS.progress, defaultProgress),
    ).toMatch(/could not be saved/i);
    failure.mockRestore();
  });

  it("keeps private milestones separate from public XP", () => {
    writeRecord(STORAGE_KEYS.progress, {
      ...defaultProgress,
      publicXP: 80,
    });
    writeRecord(STORAGE_KEYS.milestones, {
      version: 1,
      earned: ["went_on_date"],
    });
    const loaded = loadAllRecords();
    expect(loaded.milestones.earned).toEqual(["went_on_date"]);
    expect(loaded.progress.publicXP).toBe(80);
  });
});
