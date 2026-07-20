import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Attempt,
  PracticeActivityEntry,
  Progress,
} from "../domain/types";
import { mergeActivityEntries } from "../domain/activity";
import {
  activityEntrySchema,
  parsePersistedRecords,
  type PersistedRecords,
} from "./stores";

const ACCOUNT_STATE_TABLE = "rizzcode_user_state";
const ACCOUNT_ACTIVITY_TABLE = "rizzcode_practice_activity";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mergeMaximums(
  local: Record<string, number>,
  remote: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const key of unique([...Object.keys(remote), ...Object.keys(local)])) {
    merged[key] = Math.max(local[key] ?? 0, remote[key] ?? 0);
  }
  return merged;
}

function mergeProgress(local: Progress, remote: Progress): Progress {
  const completedScenarioIds = unique([
    ...remote.completedScenarioIds,
    ...local.completedScenarioIds,
  ]);
  const bestMasteryXP = mergeMaximums(
    local.bestMasteryXP,
    remote.bestMasteryXP,
  );
  const earnedXP =
    Object.values(bestMasteryXP).reduce((total, value) => total + value, 0) +
    completedScenarioIds.length * 10;
  const publicXP = Math.max(local.publicXP, remote.publicXP, earnedXP);
  const latestPracticeDate =
    [local.lastPracticeDate, remote.lastPracticeDate]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
  const streak =
    local.lastPracticeDate === remote.lastPracticeDate
      ? Math.max(local.streak, remote.streak)
      : latestPracticeDate === local.lastPracticeDate
        ? local.streak
        : remote.streak;

  return {
    version: 1,
    publicXP,
    level: Math.floor(publicXP / 250) + 1,
    streak,
    bestScores: mergeMaximums(local.bestScores, remote.bestScores),
    bestMasteryXP,
    completedScenarioIds,
    achievements: unique([
      ...remote.achievements,
      ...local.achievements,
    ]),
    rewardedAttemptIds: unique([
      ...remote.rewardedAttemptIds,
      ...local.rewardedAttemptIds,
    ]).slice(-100),
    ...(latestPracticeDate
      ? { lastPracticeDate: latestPracticeDate }
      : {}),
  };
}

function attemptTimestamp(attempt: Attempt): number {
  return Date.parse(attempt.completedAt ?? attempt.startedAt) || 0;
}

function mergeAttempts(local: Attempt[], remote: Attempt[]): Attempt[] {
  const byId = new Map<string, Attempt>();
  for (const attempt of remote) byId.set(attempt.id, attempt);
  for (const attempt of local) {
    const current = byId.get(attempt.id);
    if (!current || attemptTimestamp(attempt) >= attemptTimestamp(current)) {
      byId.set(attempt.id, attempt);
    }
  }
  return [...byId.values()]
    .sort((a, b) => attemptTimestamp(a) - attemptTimestamp(b))
    .slice(-100);
}

export function mergeAccountRecords(
  local: PersistedRecords,
  remote: PersistedRecords | null,
): PersistedRecords {
  if (!remote) return local;
  return {
    profile: remote.profile.onboardingComplete
      ? remote.profile
      : local.profile,
    progress: mergeProgress(local.progress, remote.progress),
    attempts: mergeAttempts(local.attempts, remote.attempts),
    activity: mergeActivityEntries(remote.activity, local.activity),
    milestones: {
      version: 1,
      earned: unique([
        ...remote.milestones.earned,
        ...local.milestones.earned,
      ]),
    },
  };
}

export async function loadAccountRecords(
  client: SupabaseClient,
  userId: string,
): Promise<PersistedRecords | null> {
  const { data, error } = await client
    .from(ACCOUNT_STATE_TABLE)
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const records = parsePersistedRecords(data.state);
  if (!records) throw new Error("Account progress has an unsupported format.");
  return records;
}

export async function saveAccountRecords(
  client: SupabaseClient,
  userId: string,
  records: PersistedRecords,
): Promise<void> {
  const { error } = await client.from(ACCOUNT_STATE_TABLE).upsert(
    {
      user_id: userId,
      state_version: 1,
      state: records,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function loadAccountActivity(
  client: SupabaseClient,
  userId: string,
): Promise<PracticeActivityEntry[]> {
  const { data, error } = await client
    .from(ACCOUNT_ACTIVITY_TABLE)
    .select("attempt_id, scenario_id, completed_at, local_date")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  const entries = (data ?? []).flatMap((row) => {
    const parsed = activityEntrySchema.safeParse({
      attemptId: row.attempt_id,
      scenarioId: row.scenario_id,
      completedAt: row.completed_at,
      localDate: row.local_date,
    });
    return parsed.success ? [parsed.data] : [];
  });
  return mergeActivityEntries(entries);
}

export async function saveAccountActivity(
  client: SupabaseClient,
  userId: string,
  activity: readonly PracticeActivityEntry[],
): Promise<void> {
  if (activity.length === 0) return;
  const { error } = await client.from(ACCOUNT_ACTIVITY_TABLE).upsert(
    activity.map((entry) => ({
      user_id: userId,
      attempt_id: entry.attemptId,
      scenario_id: entry.scenarioId,
      completed_at: entry.completedAt,
      local_date: entry.localDate,
    })),
    { onConflict: "user_id,attempt_id" },
  );
  if (error) throw error;
}

export async function clearAccountActivity(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from(ACCOUNT_ACTIVITY_TABLE)
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
