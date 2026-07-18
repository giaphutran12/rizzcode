// Test helper: fabricate a UseProgressResult with spy callbacks so view tests
// can render the practice/curriculum UI against arbitrary progress without
// touching storage. Not a *.test file, so it is not collected as a suite; it is
// imported by the colocated view tests.

import { vi } from "vitest";
import type { ApplyJudgeResultOutcome } from "../domain/progression";
import type { Progress, UserProfile } from "../domain/types";
import { defaultOnboardingPlan } from "../domain/onboarding";
import type { UseProgressResult } from "../hooks/useProgress";
import { defaultProfile } from "../storage/profileStore";
import { defaultProgress } from "../storage/progressStore";

export interface FakeProgressOptions {
  progress?: Partial<Progress>;
  profile?: Partial<UserProfile>;
  persistent?: boolean;
  recordResult?: UseProgressResult["recordResult"];
  recordAttempt?: UseProgressResult["recordAttempt"];
}

export function makeProgressApi(
  options: FakeProgressOptions = {},
): UseProgressResult {
  const progress: Progress = { ...defaultProgress(), ...options.progress };
  const profile: UserProfile = { ...defaultProfile(), ...options.profile };
  return {
    profile,
    progress,
    milestones: [],
    attemptsMeta: { count: 0, lastAttemptAt: null },
    persistent: options.persistent ?? true,
    plan: defaultOnboardingPlan(),
    saveProfile: vi.fn(),
    completeOnboarding: vi.fn(),
    skipOnboarding: vi.fn(),
    recordResult: options.recordResult ?? vi.fn(() => makeOutcome()),
    recordAttempt: options.recordAttempt ?? vi.fn(),
    recordMilestone: vi.fn(),
    resetProgress: vi.fn(),
  };
}

// A neutral, non-stop outcome for ResultView tests.
export function makeOutcome(
  overrides: Partial<ApplyJudgeResultOutcome> = {},
): ApplyJudgeResultOutcome {
  return {
    next: defaultProgress(),
    publicXPDelta: 40,
    masteryXP: 80,
    isNewBestScore: true,
    isFirstCompletion: true,
    unlockedAchievementIds: [],
    leveledUp: false,
    ...overrides,
  };
}
