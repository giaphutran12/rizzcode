import {
  ArrowRight,
  ArrowsClockwise,
  Medal,
  Sparkle,
  Trophy,
} from "@phosphor-icons/react";
import { AppNav } from "./AppNav";
import { navigate } from "../router";
import { getAchievementById } from "../data/achievements";
import type { AppliedJudgment } from "../domain/progress";
import type {
  Attempt,
  JudgeResult,
  Scenario,
} from "../domain/types";

const CRITERION_LABELS: Record<string, string> = {
  context_naturalness: "Context & naturalness",
  reciprocity_listening: "Reciprocity & listening",
  playfulness_personality: "Playfulness & personality",
  respect_calibration: "Respect & calibration",
  challenge_objective: "Challenge objective",
};

export interface ResultViewProps {
  scenario: Scenario;
  attempt: Attempt;
  result: JudgeResult;
  verdictCopy: { title: string; body: string };
  applied: AppliedJudgment | null;
  nextScenarioId: string | null;
  displayName: string;
  onRetry: () => void;
}

export function ResultView(props: ResultViewProps) {
  const { result, scenario, verdictCopy, applied } = props;

  return (
    <main className="taste-page taste-app">
      <AppNav />
      <div className="taste-app-main">
        <header className="taste-page-heading">
          <p className="taste-kicker">
            {scenario.mode === "in_person" ? "In person" : "Messaging"} ·{" "}
            {scenario.title}
          </p>
          <h1>
            The read on <em>your three turns.</em>
          </h1>
        </header>

        <div className="taste-result">
          <section
            className="taste-verdict"
            data-verdict={result.verdict}
            aria-label={`Score ${result.finalScore} out of 10, verdict ${result.verdict}`}
          >
            <div className="taste-verdict__score">
              <span>Conversation score</span>
              <strong>{result.finalScore}</strong>
              <small>out of 10</small>
            </div>
            <div className="taste-verdict__copy">
              <h2>{verdictCopy.title}</h2>
              <p>{verdictCopy.body}</p>
              {result.hardGate.triggered && (
                <p role="note">
                  A hard gate fired ({result.hardGate.codes.join(", ")}), which
                  capped this attempt at {result.hardGate.maxScore}.{" "}
                  {result.hardGate.evidence[0]?.reason ?? ""}
                </p>
              )}
            </div>
          </section>

          <div className="taste-xp-line" aria-live="polite">
            <Medal size={20} weight="fill" />
            {applied && applied.publicXPDelta > 0 ? (
              <span>
                <strong>+{applied.publicXPDelta} XP</strong> practice XP
                {applied.isPersonalBest && " · new personal best"}
              </span>
            ) : (
              <span>
                No new XP — {result.hardGate.severity === "stop"
                  ? "a stop-level violation pays zero"
                  : "beat your previous best on this scenario to earn more"}
                .
              </span>
            )}
          </div>

          {applied && applied.newAchievements.length > 0 && (
            <div className="taste-stat-row" aria-label="Achievements unlocked">
              {applied.newAchievements.map((id) => {
                const achievement = getAchievementById(id);
                return (
                  <span className="taste-achievement-pop" key={id}>
                    <Trophy size={16} weight="fill" />
                    Achievement unlocked: {achievement?.title ?? id}
                  </span>
                );
              })}
            </div>
          )}

          <div className="taste-result-grid">
            <section className="taste-result-card" aria-labelledby="criteria-title">
              <span id="criteria-title">The rubric — five criteria, out of 2 each</span>
              <div className="taste-criteria">
                {result.rubric.map((entry) => (
                  <div className="taste-criterion" key={entry.id}>
                    <div className="taste-criterion__top">
                      <span>{CRITERION_LABELS[entry.id] ?? entry.id}</span>
                      <strong>{entry.score}/2</strong>
                    </div>
                    <div className="taste-rubric-track" aria-hidden="true">
                      <span style={{ width: `${entry.score * 50}%` }} />
                    </div>
                    <blockquote>“{entry.evidence.excerpt}”</blockquote>
                    <p>
                      <strong>Turn {entry.evidence.turn}:</strong>{" "}
                      {entry.evidence.reason}
                    </p>
                    <p>{entry.feedback}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="taste-result-card" aria-labelledby="worked-title">
              <span id="worked-title">What worked</span>
              <ul className="taste-feedback-list">
                {result.worked.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="taste-result-card" aria-labelledby="improve-title">
              <span id="improve-title">What to improve</span>
              <ul className="taste-feedback-list">
                {result.improve.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section
              className="taste-result-card taste-result-card--dark"
              aria-labelledby="better-title"
            >
              <span id="better-title">Say it like this next time</span>
              <p className="taste-better-response">“{result.betterResponse}”</p>
            </section>

            <section
              className="taste-result-card taste-outcome-card"
              aria-labelledby="outcome-title"
            >
              <span id="outcome-title">Likely simulated outcome</span>
              <p className="taste-outcome-card__label">{result.outcome.label}</p>
              <p>
                Confidence: {result.outcome.confidence}.{" "}
                {result.outcome.basis[0]?.reason ?? ""}
              </p>
              <small>
                This is a likely simulated outcome for one fictional persona — a
                practice read, not a prediction of what any real woman would do.
              </small>
            </section>
          </div>

          <div className="taste-result-actions">
            <button
              className="taste-button taste-button--ink"
              type="button"
              onClick={props.onRetry}
            >
              <ArrowsClockwise size={18} weight="bold" />
              Run it back
            </button>
            {props.nextScenarioId && (
              <button
                className="taste-button taste-button--lime"
                type="button"
                onClick={() => navigate(`/practice/${props.nextScenarioId}`)}
              >
                <Sparkle size={18} weight="fill" />
                Next challenge
              </button>
            )}
            <button
              className="taste-button taste-button--quiet"
              type="button"
              onClick={() => navigate("/practice")}
            >
              Curriculum
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
