import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { createProfile, defaultProfile, type OnboardingAnswers } from "../domain/onboarding";
import {
  applyJudgment,
  defaultMilestones,
  defaultProgress,
} from "../domain/progression";
import type {
  Attempt,
  JudgeResult,
  MilestoneId,
  Milestones,
  Progress,
  UserProfile,
} from "../domain/types";
import { getScenario } from "../data/scenarios";
import {
  clearProgressRecords,
  loadAllRecords,
  loadRecordsOwner,
  STORAGE_KEYS,
  type PersistedRecords,
  writeAllRecords,
  writeRecord,
  writeRecordsOwner,
} from "../storage/stores";
import {
  clearAccountActivity,
  loadAccountActivity,
  loadAccountRecords,
  mergeAccountRecords,
  saveAccountRecords,
  saveAccountActivity,
} from "../storage/accountSync";
import { getSupabaseBrowserClient } from "../lib/auth";
import {
  activityEntryForCompletion,
  localDateKey,
  mergeActivityEntries,
} from "../domain/activity";

type JudgmentReceipt = {
  xpDelta: number;
  isPersonalBest: boolean;
  unlockedAchievements: string[];
};

interface RizzCodeState {
  profile: UserProfile;
  progress: Progress;
  attempts: Attempt[];
  activity: PersistedRecords["activity"];
  milestones: Milestones;
  storageWarning?: string;
  completeOnboarding: (answers: OnboardingAnswers) => UserProfile;
  skipOnboarding: () => UserProfile;
  saveAttempt: (attempt: Attempt) => void;
  recordJudgment: (
    attempt: Attempt,
    result: JudgeResult,
    completedAt?: Date,
  ) => JudgmentReceipt;
  toggleMilestone: (milestone: MilestoneId) => void;
  resetProgress: () => void;
  dismissWarning: () => void;
}

const RizzCodeContext = createContext<RizzCodeState | null>(null);

function emptyRecords(): PersistedRecords {
  return {
    profile: defaultProfile,
    progress: defaultProgress,
    attempts: [],
    activity: [],
    milestones: defaultMilestones,
  };
}

export function RizzCodeProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const client = getSupabaseBrowserClient();
  const initial = useRef<ReturnType<typeof loadAllRecords> | null>(null);
  if (initial.current === null) initial.current = loadAllRecords();

  const [profile, setProfile] = useState(initial.current.profile);
  const [progress, setProgressState] = useState(initial.current.progress);
  const progressRef = useRef(initial.current.progress);
  const [attempts, setAttempts] = useState(initial.current.attempts);
  const [activity, setActivity] = useState(initial.current.activity);
  const [milestones, setMilestones] = useState(initial.current.milestones);
  const [storageWarning, setStorageWarning] = useState(initial.current.warning);
  const recordsRef = useRef<PersistedRecords>({
    profile: initial.current.profile,
    progress: initial.current.progress,
    attempts: initial.current.attempts,
    activity: initial.current.activity,
    milestones: initial.current.milestones,
  });
  const ownerRef = useRef(loadRecordsOwner());
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  const replaceLocalRecords = useCallback((next: PersistedRecords) => {
    recordsRef.current = next;
    setProfile(next.profile);
    progressRef.current = next.progress;
    setProgressState(next.progress);
    setAttempts(next.attempts);
    setActivity(next.activity);
    setMilestones(next.milestones);
    setStorageWarning((current) => writeAllRecords(next) ?? current);
  }, []);

  useEffect(() => {
    recordsRef.current = { profile, progress, attempts, activity, milestones };
  }, [activity, attempts, milestones, profile, progress]);

  useEffect(() => {
    const userId = auth.user?.id;
    if (auth.loading) return;
    if (!userId) {
      setSyncedUserId(null);
      if (ownerRef.current && ownerRef.current !== "guest") {
        const guest = emptyRecords();
        clearProgressRecords();
        ownerRef.current = "guest";
        replaceLocalRecords(guest);
        setStorageWarning(
          (current) => writeRecordsOwner("guest") ?? current,
        );
      } else if (!ownerRef.current) {
        ownerRef.current = "guest";
        setStorageWarning(
          (current) => writeRecordsOwner("guest") ?? current,
        );
      }
      return;
    }
    if (!client) {
      setStorageWarning(
        "Your progress is safe on this device, but account sync is not configured.",
      );
      return;
    }

    let active = true;
    const syncGuestStateIntoAccount = async () => {
      try {
        const localStart =
          ownerRef.current === null ||
          ownerRef.current === "guest" ||
          ownerRef.current === userId
            ? recordsRef.current
            : emptyRecords();
        if (localStart !== recordsRef.current) {
          replaceLocalRecords(localStart);
        }
        const [remote, serverActivity] = await Promise.all([
          loadAccountRecords(client, userId),
          loadAccountActivity(client, userId),
        ]);
        const remoteWithAuthoritativeActivity = remote
          ? { ...remote, activity: serverActivity }
          : null;
        let merged = mergeAccountRecords(
          localStart,
          remoteWithAuthoritativeActivity,
        );
        for (let pass = 0; pass < 5; pass += 1) {
          const localSnapshot = recordsRef.current;
          merged = mergeAccountRecords(localSnapshot, merged);
          await Promise.all([
            saveAccountRecords(client, userId, merged),
            saveAccountActivity(client, userId, merged.activity),
          ]);
          if (!active) return;
          if (recordsRef.current === localSnapshot) break;
          if (pass === 4) {
            throw new Error("Local practice changed repeatedly during sync.");
          }
        }
        ownerRef.current = userId;
        setStorageWarning(
          (current) => writeRecordsOwner(userId) ?? current,
        );
        replaceLocalRecords(merged);
        setSyncedUserId(userId);
      } catch {
        if (!active) return;
        setStorageWarning(
          "Your progress is safe on this device, but account sync is temporarily unavailable.",
        );
      }
    };

    void syncGuestStateIntoAccount();
    return () => {
      active = false;
    };
  }, [auth.loading, auth.user?.id, client, replaceLocalRecords]);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!client || !userId || syncedUserId !== userId) return;
    const timeout = window.setTimeout(() => {
      void Promise.all([
        saveAccountRecords(client, userId, recordsRef.current),
        saveAccountActivity(client, userId, recordsRef.current.activity),
      ]).catch(() => {
        setStorageWarning(
          "Your progress is safe on this device, but account sync is temporarily unavailable.",
        );
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    attempts,
    activity,
    auth.user?.id,
    client,
    milestones,
    profile,
    progress,
    syncedUserId,
  ]);

  const setProgress = useCallback((next: Progress) => {
    progressRef.current = next;
    recordsRef.current = { ...recordsRef.current, progress: next };
    setProgressState(next);
    setStorageWarning((current) => writeRecord(STORAGE_KEYS.progress, next) ?? current);
  }, []);

  const persistProfile = useCallback((next: UserProfile) => {
    recordsRef.current = { ...recordsRef.current, profile: next };
    setProfile(next);
    setStorageWarning((current) => writeRecord(STORAGE_KEYS.profile, next) ?? current);
    return next;
  }, []);

  const completeOnboarding = useCallback(
    (answers: OnboardingAnswers) => persistProfile(createProfile(answers)),
    [persistProfile],
  );

  const skipOnboarding = useCallback(
    () => persistProfile(createProfile()),
    [persistProfile],
  );

  const saveAttempt = useCallback((attempt: Attempt) => {
    const withoutCurrent = recordsRef.current.attempts.filter(
      (item) => item.id !== attempt.id,
    );
    const next = [...withoutCurrent, attempt].slice(-100);
    recordsRef.current = { ...recordsRef.current, attempts: next };
    setAttempts(next);
    setStorageWarning(
      (warning) => writeRecord(STORAGE_KEYS.attempts, next) ?? warning,
    );
  }, []);

  const recordJudgment = useCallback(
    (
      attempt: Attempt,
      result: JudgeResult,
      completedAt = new Date(),
    ): JudgmentReceipt => {
      const scenario = getScenario(attempt.scenarioId);
      if (!scenario) {
        return {
          xpDelta: 0,
          isPersonalBest: false,
          unlockedAchievements: [],
        };
      }
      const receipt = applyJudgment({
        progress: progressRef.current,
        attempt,
        scenario,
        result,
        today: localDateKey(completedAt),
      });
      const nextActivity = mergeActivityEntries(
        recordsRef.current.activity,
        [activityEntryForCompletion(attempt, completedAt)],
      );
      recordsRef.current = {
        ...recordsRef.current,
        activity: nextActivity,
      };
      setActivity(nextActivity);
      setStorageWarning(
        (warning) =>
          writeRecord(STORAGE_KEYS.activity, nextActivity) ?? warning,
      );
      setProgress(receipt.progress);
      return {
        xpDelta: receipt.xpDelta,
        isPersonalBest: receipt.isPersonalBest,
        unlockedAchievements: receipt.unlockedAchievements,
      };
    },
    [setProgress],
  );

  const toggleMilestone = useCallback((milestone: MilestoneId) => {
    const current = recordsRef.current.milestones;
    const earned = current.earned.includes(milestone)
      ? current.earned.filter((item) => item !== milestone)
      : [...current.earned, milestone];
    const next: Milestones = { version: 1, earned };
    recordsRef.current = { ...recordsRef.current, milestones: next };
    setMilestones(next);
    setStorageWarning(
      (warning) => writeRecord(STORAGE_KEYS.milestones, next) ?? warning,
    );
  }, []);

  const resetProgress = useCallback(() => {
    const warning = clearProgressRecords();
    const empty = emptyRecords();
    replaceLocalRecords(empty);
    ownerRef.current = auth.user?.id ?? "guest";
    writeRecordsOwner(ownerRef.current);
    setStorageWarning(warning);
    const userId = auth.user?.id;
    if (client && userId) {
      void clearAccountActivity(client, userId).catch(() => {
        setStorageWarning(
          "Local progress was reset, but synced activity could not be cleared.",
        );
      });
    }
  }, [auth.user?.id, client, replaceLocalRecords]);

  return (
    <RizzCodeContext.Provider
      value={{
        profile,
        progress,
        attempts,
        activity,
        milestones,
        storageWarning,
        completeOnboarding,
        skipOnboarding,
        saveAttempt,
        recordJudgment,
        toggleMilestone,
        resetProgress,
        dismissWarning: () => setStorageWarning(undefined),
      }}
    >
      {children}
    </RizzCodeContext.Provider>
  );
}

export function useRizzCode() {
  const value = useContext(RizzCodeContext);
  if (!value) {
    throw new Error("useRizzCode must be used inside RizzCodeProvider.");
  }
  return value;
}
