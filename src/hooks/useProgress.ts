import { useCallback, useMemo, useState } from "react";
import {
  loadMilestones,
  loadProfile,
  loadProgress,
  appendAttempt,
  appendMilestone,
  removeMilestone,
  resetAllProgress,
  saveProfile,
  saveProgress,
  storageWarning,
  defaultProfile,
  defaultProgress,
} from "../storage";
import { applyJudgmentToProgress, type AppliedJudgment } from "../domain/progress";
import type {
  Attempt,
  JudgeResult,
  Milestone,
  MilestoneId,
  Progress,
  Scenario,
  UserProfile,
} from "../domain/types";

export interface ProgressStore {
  progress: Progress;
  profile: UserProfile;
  milestones: Milestone[];
  recovered: boolean;
  warning: string | null;
  /** Applies a validated judgment: XP, bests, streak, achievements, attempt log. */
  recordJudgment: (
    scenario: Scenario,
    attempt: Attempt,
    result: JudgeResult,
  ) => AppliedJudgment;
  saveOnboardingProfile: (profile: UserProfile) => void;
  recordMilestone: (kind: MilestoneId, note?: string) => void;
  deleteMilestone: (id: string) => void;
  resetProgress: () => void;
  reload: () => void;
}

/**
 * Reads progression state from versioned local storage and exposes the
 * write-through mutations. Storage is the source of truth; every view
 * reloads on mount so refreshes and cross-view navigation stay consistent.
 */
export function useProgressStore(): ProgressStore {
  const [state, setState] = useState(() => {
    const progressResult = loadProgress();
    const profileResult = loadProfile();
    return {
      progress: progressResult.progress ?? defaultProgress(),
      profile: profileResult.profile ?? defaultProfile(),
      milestones: loadMilestones().milestones ?? [],
      recovered: progressResult.recovered || profileResult.recovered,
    };
  });

  const reload = useCallback(() => {
    const progressResult = loadProgress();
    const profileResult = loadProfile();
    setState({
      progress: progressResult.progress ?? defaultProgress(),
      profile: profileResult.profile ?? defaultProfile(),
      milestones: loadMilestones().milestones ?? [],
      recovered: progressResult.recovered || profileResult.recovered,
    });
  }, []);

  const recordJudgment = useCallback(
    (scenario: Scenario, attempt: Attempt, result: JudgeResult) => {
      const applied = applyJudgmentToProgress({
        progress: state.progress,
        scenario,
        result,
      });
      saveProgress(applied.progress);
      appendAttempt({ ...attempt, result });
      setState((current) => ({ ...current, progress: applied.progress }));
      return applied;
    },
    [state.progress],
  );

  const saveOnboardingProfile = useCallback((profile: UserProfile) => {
    saveProfile(profile);
    setState((current) => ({ ...current, profile }));
  }, []);

  const recordMilestone = useCallback((kind: MilestoneId, note = "") => {
    const milestone: Milestone = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `milestone-${Date.now()}`,
      kind,
      note,
      recordedAt: new Date().toISOString(),
    };
    appendMilestone(milestone);
    setState((current) => ({
      ...current,
      milestones: [milestone, ...current.milestones],
    }));
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    removeMilestone(id);
    setState((current) => ({
      ...current,
      milestones: current.milestones.filter((milestone) => milestone.id !== id),
    }));
  }, []);

  const resetProgress = useCallback(() => {
    resetAllProgress();
    setState((current) => ({
      ...current,
      progress: defaultProgress(),
      milestones: [],
    }));
  }, []);

  return useMemo(
    () => ({
      progress: state.progress,
      profile: state.profile,
      milestones: state.milestones,
      recovered: state.recovered,
      warning: storageWarning(),
      recordJudgment,
      saveOnboardingProfile,
      recordMilestone,
      deleteMilestone,
      resetProgress,
      reload,
    }),
    [
      state,
      recordJudgment,
      saveOnboardingProfile,
      recordMilestone,
      deleteMilestone,
      resetProgress,
      reload,
    ],
  );
}
