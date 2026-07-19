/**
 * Pure progression rules: apply a validated judge result to the player's
 * Progress record. No storage, no React — the hooks layer persists results.
 *
 * XP rules (locked):
 *   masteryXP = finalScore * 10 + difficultyBonus (easy 0 / medium 10 / hard 20)
 *   publicXPDelta = max(0, masteryXP - previousBestMasteryXP) + 10 on first
 *                   valid completion only
 *   Stop-level violations award zero public XP.
 *   level = floor(totalPublicXP / 250) + 1
 */
import { getAchievementById } from "../data/achievements";
import { levelFor, xpDeltaFor } from "./xp";
import type {
  Difficulty,
  JudgeResult,
  Progress,
  Scenario,
} from "./types";

export interface AppliedJudgment {
  progress: Progress;
  publicXPDelta: number;
  masteryXP: number;
  newAchievements: string[];
  isPersonalBest: boolean;
  isFirstCompletion: boolean;
}

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function yesterdayKey(now: Date): string {
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

export function nextStreak(progress: Progress, now: Date = new Date()): number {
  const today = todayKey(now);
  if (progress.lastPracticeDay === today) return progress.streak;
  if (progress.lastPracticeDay === yesterdayKey(now)) return progress.streak + 1;
  return 1;
}

/** Achievement rules keyed to the static catalog ids. */
export function achievementsForResult(input: {
  scenario: Scenario;
  result: JudgeResult;
  progress: Progress;
  streakAfter: number;
}): string[] {
  const { scenario, result, progress, streakAfter } = input;
  const unlocked = new Set(progress.achievements);
  const earned: string[] = [];
  const award = (id: string) => {
    if (!unlocked.has(id) && getAchievementById(id)) {
      unlocked.add(id);
      earned.push(id);
    }
  };

  // First Contact: first valid judged completion of any scenario.
  award("first_contact");

  const playfulness = result.rubric.find(
    (entry) => entry.id === "playfulness_personality",
  );
  if (playfulness?.score === 2) award("made_her_laugh");

  if (
    scenario.id === "connection-awkward-message-recovery" &&
    result.finalScore >= 7
  ) {
    award("smooth_recovery");
  }

  if (
    result.outcome.code === "date_invited" ||
    result.outcome.code === "date_agreed"
  ) {
    award("asked_her_out");
  }
  if (result.outcome.code === "date_agreed") award("first_date");

  if (scenario.id === "connection-playful-callback" && result.finalScore >= 7) {
    award("callback_king");
  }

  if (result.outcome.code === "graceful_exit") {
    award("graceful_exit");
    if (result.finalScore >= 7) award("read_the_room");
  }

  if (streakAfter >= 3) award("consistent_communicator");

  return earned;
}

export function applyJudgmentToProgress(input: {
  progress: Progress;
  scenario: Scenario;
  result: JudgeResult;
  now?: Date;
}): AppliedJudgment {
  const { scenario, result } = input;
  const now = input.now ?? new Date();
  const progress = input.progress;

  const previousBestMastery = progress.bestMasteryXP[scenario.id];
  const { masteryXP, publicXPDelta } = xpDeltaFor({
    finalScore: result.finalScore,
    difficulty: scenario.difficulty as Difficulty,
    previousBestMasteryXP: previousBestMastery,
    stopViolation: result.hardGate.severity === "stop",
  });

  const isFirstCompletion = previousBestMastery === undefined;
  const isPersonalBest =
    isFirstCompletion || result.finalScore > (progress.bestScores[scenario.id] ?? -1);

  const streak = nextStreak(progress, now);
  const completedScenarioIds = progress.completedScenarioIds.includes(scenario.id)
    ? progress.completedScenarioIds
    : [...progress.completedScenarioIds, scenario.id];

  const base: Progress = {
    ...progress,
    publicXP: progress.publicXP + publicXPDelta,
    streak,
    lastPracticeDay: todayKey(now),
    bestScores: isPersonalBest
      ? { ...progress.bestScores, [scenario.id]: result.finalScore }
      : progress.bestScores,
    bestMasteryXP:
      previousBestMastery === undefined || masteryXP > previousBestMastery
        ? { ...progress.bestMasteryXP, [scenario.id]: masteryXP }
        : progress.bestMasteryXP,
    completedScenarioIds,
  };

  const newAchievements = achievementsForResult({
    scenario,
    result,
    progress: base,
    streakAfter: streak,
  });

  const withAchievements: Progress = {
    ...base,
    achievements: [...base.achievements, ...newAchievements],
  };

  return {
    progress: { ...withAchievements, level: levelFor(withAchievements.publicXP) },
    publicXPDelta,
    masteryXP,
    newAchievements,
    isPersonalBest,
    isFirstCompletion,
  };
}
