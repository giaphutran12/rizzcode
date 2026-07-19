import { useMemo, useState } from "react";
import {
  CalendarCheck,
  ChatCircle,
  Export,
  Fire,
  HandHeart,
  Heart,
  LockSimple,
  Medal,
  PhoneOutgoing,
  Sparkle,
  Star,
} from "@phosphor-icons/react";
import { AppNav } from "./AppNav";
import { useProgressStore } from "../hooks/useProgress";
import { achievements } from "../data/achievements";
import { getSideQuestById, SIDE_QUEST_BOUNDARY_COPY } from "../data/sideQuests";
import { scenarios } from "../data/scenarios";
import { buildOnboardingPlan } from "../domain/onboarding";
import type { MilestoneId } from "../domain/types";

const MILESTONE_OPTIONS: Array<{ kind: MilestoneId; label: string }> = [
  { kind: "good_conversation", label: "Good real conversation" },
  { kind: "contact_exchanged", label: "Contact exchanged" },
  { kind: "received_reply", label: "Received a reply" },
  { kind: "date_scheduled", label: "Date scheduled" },
  { kind: "went_on_date", label: "Went on a date" },
  { kind: "second_date", label: "Second date" },
  { kind: "graceful_exit", label: "Graceful exit" },
];

const MILESTONE_LABELS = new Map(MILESTONE_OPTIONS.map((o) => [o.kind, o.label]));

const ACHIEVEMENT_ICONS = [
  ChatCircle,
  Sparkle,
  Star,
  Heart,
  CalendarCheck,
  Medal,
  HandHeart,
  PhoneOutgoing,
  Fire,
];

export function ProgressView() {
  const {
    progress,
    profile,
    milestones,
    recordMilestone,
    deleteMilestone,
    resetProgress,
  } = useProgressStore();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const plan = useMemo(
    () =>
      buildOnboardingPlan(
        {
          improve: profile.goals,
          typeDescription: profile.typeDescription,
          desiredRelationship: profile.desiredRelationship,
          struggles: profile.struggles,
        },
        scenarios.map((scenario) => scenario.id),
      ),
    [profile],
  );

  const sideQuest = plan.sideQuestId ? getSideQuestById(plan.sideQuestId) : undefined;

  const moduleProgress = (moduleId: "spark" | "connection") => {
    const moduleScenarios = scenarios.filter((scenario) => scenario.module === moduleId);
    const done = moduleScenarios.filter((scenario) =>
      progress.completedScenarioIds.includes(scenario.id),
    ).length;
    return { done, total: moduleScenarios.length };
  };

  const spark = moduleProgress("spark");
  const connection = moduleProgress("connection");
  const xpIntoLevel = progress.publicXP % 250;
  const xpToNext = 250 - xpIntoLevel;

  return (
    <main className="taste-page taste-app">
      <AppNav />
      <div className="taste-app-main">
        <header className="taste-page-heading">
          <p className="taste-kicker">Your progress</p>
          <h1>
            Level {progress.level}. <em>{progress.publicXP} XP earned.</em>
          </h1>
          <p>
            {xpToNext} XP to level {progress.level + 1}. Streak: {progress.streak}{" "}
            {progress.streak === 1 ? "day" : "days"}. Every point came from a judged
            practice attempt.
          </p>
          <div className="taste-stat-row">
            <span className="taste-stat">
              <Fire size={16} weight="fill" />
              Streak <strong>{progress.streak}</strong>
            </span>
            <span className="taste-stat">
              <Star size={16} weight="fill" />
              Level <strong>{progress.level}</strong>
            </span>
            <span className="taste-stat">
              <Medal size={16} weight="fill" />
              Achievements{" "}
              <strong>
                {progress.achievements.length}/{achievements.length}
              </strong>
            </span>
          </div>
        </header>

        <div className="taste-progress-layout">
          <div className="taste-progress-stack">
            <section className="taste-panel" aria-labelledby="module-progress-title">
              <h2 id="module-progress-title" className="taste-kicker">
                Curriculum progress
              </h2>
              <div className="taste-module-progress">
                <div className="taste-module-progress__row">
                  <span>Spark — get attention, make a moment</span>
                  <span>
                    {spark.done}/{spark.total}
                  </span>
                </div>
                <div className="taste-progress-track" aria-hidden="true">
                  <span style={{ width: `${(spark.done / spark.total) * 100}%` }} />
                </div>
              </div>
              <div className="taste-module-progress" style={{ marginTop: 22 }}>
                <div className="taste-module-progress__row">
                  <span>Connection — keep it alive and deepen it</span>
                  <span>
                    {connection.done}/{connection.total}
                  </span>
                </div>
                <div className="taste-progress-track" aria-hidden="true">
                  <span
                    style={{ width: `${(connection.done / connection.total) * 100}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="taste-panel" aria-labelledby="achievements-title">
              <h2 id="achievements-title" className="taste-kicker">
                Achievements
              </h2>
              <div className="taste-achievement-grid">
                {achievements.map((achievement, index) => {
                  const unlocked = progress.achievements.includes(achievement.id);
                  const Icon = ACHIEVEMENT_ICONS[index % ACHIEVEMENT_ICONS.length];
                  return (
                    <div
                      className="taste-achievement"
                      data-locked={!unlocked}
                      key={achievement.id}
                    >
                      {unlocked ? (
                        <Icon size={22} weight="fill" />
                      ) : (
                        <LockSimple size={22} />
                      )}
                      <strong>{achievement.title}</strong>
                      <p>{achievement.description}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="taste-panel" aria-labelledby="milestones-title">
              <h2 id="milestones-title" className="taste-kicker">
                Private real-world milestones
              </h2>
              <p style={{ margin: "0 0 18px", color: "#565044", fontSize: 13 }}>
                Self-reported, private, and zero XP. These never touch the
                leaderboard — they are just proof the practice is leaking into real
                life.
              </p>
              <div className="taste-milestone-chips" role="group" aria-label="Record a milestone">
                {MILESTONE_OPTIONS.map((option) => (
                  <button
                    className="taste-chip taste-chip--ink"
                    key={option.kind}
                    type="button"
                    onClick={() => recordMilestone(option.kind)}
                  >
                    + {option.label}
                  </button>
                ))}
              </div>
              {milestones.length > 0 && (
                <div className="taste-milestone-list" style={{ marginTop: 20 }}>
                  {milestones.map((milestone) => (
                    <div key={milestone.id}>
                      <span>
                        {MILESTONE_LABELS.get(milestone.kind) ?? milestone.kind}
                        <br />
                        <small>{new Date(milestone.recordedAt).toLocaleDateString()}</small>
                      </span>
                      <button type="button" onClick={() => deleteMilestone(milestone.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Reset progress">
              {confirmingReset ? (
                <div className="taste-stat-row">
                  <button
                    className="taste-reset-button"
                    type="button"
                    onClick={() => {
                      resetProgress();
                      setConfirmingReset(false);
                    }}
                  >
                    Yes, wipe XP, streaks, and milestones
                  </button>
                  <button
                    className="taste-chip taste-chip--ink"
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                  >
                    Keep my progress
                  </button>
                </div>
              ) : (
                <button
                  className="taste-reset-button"
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                >
                  Reset progress
                </button>
              )}
            </section>
          </div>

          {sideQuest && (
            <aside
              className="taste-panel taste-panel--oxblood taste-sidequest"
              aria-labelledby="sidequest-title"
            >
              <span className="taste-badge taste-badge--lime">Side quest</span>
              <h3 id="sidequest-title">{sideQuest.title}</h3>
              <p>{sideQuest.whyItFits}</p>
              <p>{sideQuest.personalBenefit}</p>
              <p>{sideQuest.socialBenefit}</p>
              <p>
                <strong>Starter action:</strong> {sideQuest.starterAction}
              </p>
              <div className="taste-sidequest__prompt">{sideQuest.handoffPrompt}</div>
              <span className="taste-sidequest__boundary">
                <Export size={13} weight="bold" />{" "}
                {SIDE_QUEST_BOUNDARY_COPY.replace("{subject}", "this")}
              </span>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
