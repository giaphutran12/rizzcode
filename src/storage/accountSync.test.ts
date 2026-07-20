import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultProfile } from "../domain/onboarding";
import { defaultMilestones, defaultProgress } from "../domain/progression";
import type { Attempt, UserProfile } from "../domain/types";
import type { PersistedRecords } from "./stores";
import { loadAccountActivity, mergeAccountRecords } from "./accountSync";

function attempt(id: string, scenarioId: string, startedAt: string): Attempt {
  return {
    id,
    scenarioId,
    messages: [],
    userTurn: 0,
    status: "active",
    personaState: {
      engagement: "neutral",
      boundary: "none",
      terminal: false,
    },
    startedAt,
  };
}

function records(
  overrides: Partial<PersistedRecords> = {},
): PersistedRecords {
  return {
    profile: defaultProfile,
    progress: defaultProgress,
    attempts: [],
    activity: [],
    milestones: defaultMilestones,
    ...overrides,
  };
}

describe("account progress inheritance", () => {
  it("loads only schema-valid server activity rows", async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                {
                  attempt_id: "valid",
                  scenario_id: "RC-001",
                  completed_at: "2026-07-20T01:00:00.000Z",
                  local_date: "2026-07-20",
                },
                {
                  attempt_id: "invalid",
                  scenario_id: "RC-001",
                  completed_at: "not-a-date",
                  local_date: "2026-07-20",
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(loadAccountActivity(client, "user-1")).resolves.toEqual([
      {
        attemptId: "valid",
        scenarioId: "RC-001",
        completedAt: "2026-07-20T01:00:00.000Z",
        localDate: "2026-07-20",
      },
    ]);
  });

  it("uploads the complete guest record when the account has no state", () => {
    const guest = records({
      progress: {
        ...defaultProgress,
        publicXP: 80,
        level: 1,
        completedScenarioIds: ["RC-001"],
      },
      attempts: [attempt("guest-1", "RC-001", "2026-07-19T01:00:00Z")],
      activity: [
        {
          attemptId: "guest-1",
          scenarioId: "RC-001",
          completedAt: "2026-07-19T01:00:00.000Z",
          localDate: "2026-07-19",
        },
      ],
      milestones: { version: 1, earned: ["good_conversation"] },
    });

    expect(mergeAccountRecords(guest, null)).toEqual(guest);
  });

  it("merges guest and account history without duplicating rewards", () => {
    const local = records({
      progress: {
        ...defaultProgress,
        publicXP: 80,
        bestScores: { "RC-001": 7 },
        bestMasteryXP: { "RC-001": 70 },
        completedScenarioIds: ["RC-001"],
        rewardedAttemptIds: ["shared", "local"],
        lastPracticeDate: "2026-07-19",
        streak: 2,
      },
      attempts: [
        attempt("shared", "RC-001", "2026-07-19T01:00:00Z"),
        attempt("local", "RC-001", "2026-07-19T02:00:00Z"),
      ],
      activity: [
        {
          attemptId: "shared",
          scenarioId: "RC-001",
          completedAt: "2026-07-19T01:00:00.000Z",
          localDate: "2026-07-19",
        },
        {
          attemptId: "local",
          scenarioId: "RC-001",
          completedAt: "2026-07-19T02:00:00.000Z",
          localDate: "2026-07-19",
        },
      ],
      milestones: { version: 1, earned: ["good_conversation"] },
    });
    const remote = records({
      progress: {
        ...defaultProgress,
        publicXP: 60,
        bestScores: { "RC-002": 5 },
        bestMasteryXP: { "RC-002": 50 },
        completedScenarioIds: ["RC-002"],
        rewardedAttemptIds: ["remote", "shared"],
        lastPracticeDate: "2026-07-18",
        streak: 4,
      },
      attempts: [
        attempt("remote", "RC-002", "2026-07-18T01:00:00Z"),
        attempt("shared", "RC-001", "2026-07-18T02:00:00Z"),
      ],
      activity: [
        {
          attemptId: "remote",
          scenarioId: "RC-002",
          completedAt: "2026-07-18T01:00:00.000Z",
          localDate: "2026-07-18",
        },
        {
          attemptId: "shared",
          scenarioId: "RC-001",
          completedAt: "2026-07-18T02:00:00.000Z",
          localDate: "2026-07-18",
        },
      ],
      milestones: { version: 1, earned: ["date_scheduled"] },
    });

    const merged = mergeAccountRecords(local, remote);

    expect(merged.progress.completedScenarioIds).toEqual([
      "RC-002",
      "RC-001",
    ]);
    expect(merged.progress.rewardedAttemptIds).toEqual([
      "remote",
      "shared",
      "local",
    ]);
    expect(merged.progress.publicXP).toBe(140);
    expect(merged.progress.streak).toBe(2);
    expect(merged.attempts.map(({ id }) => id)).toEqual([
      "remote",
      "shared",
      "local",
    ]);
    expect(merged.activity.map(({ attemptId }) => attemptId)).toEqual([
      "remote",
      "shared",
      "local",
    ]);
    expect(merged.milestones.earned).toEqual([
      "date_scheduled",
      "good_conversation",
    ]);
  });

  it("keeps an established account profile over a guest profile", () => {
    const guestProfile: UserProfile = {
      ...defaultProfile,
      displayName: "Guest",
      onboardingComplete: true,
    };
    const accountProfile: UserProfile = {
      ...defaultProfile,
      displayName: "Account",
      onboardingComplete: true,
    };

    expect(
      mergeAccountRecords(
        records({ profile: guestProfile }),
        records({ profile: accountProfile }),
      ).profile.displayName,
    ).toBe("Account");
  });
});
