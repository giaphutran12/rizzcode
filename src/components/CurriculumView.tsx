import { useMemo } from "react";
import { ArrowRight, CheckCircle, LockSimple } from "@phosphor-icons/react";
import { AppNav } from "./AppNav";
import { navigate } from "../router";
import { useProgressStore } from "../hooks/useProgress";
import { scenarios } from "../data/scenarios";
import { buildOnboardingPlan } from "../domain/onboarding";
import { isScenarioUnlocked, nextScenarioId } from "../domain/unlocks";
import type { ModuleId, Scenario } from "../domain/types";

const MODULE_COPY: Record<ModuleId, { title: string; blurb: string }> = {
  spark: {
    title: "Spark",
    blurb:
      "Get attention and create a fun first moment — openers, banter, light flirting, calibrated asks.",
  },
  connection: {
    title: "Connection",
    blurb:
      "Keep mutual interest alive — listening, callbacks, honest invitations, graceful exits.",
  },
};

export function CurriculumView() {
  const { progress, profile } = useProgressStore();

  const orderedIds = useMemo(() => {
    const catalogIds = scenarios.map((scenario) => scenario.id);
    if (!profile.onboardingComplete) return catalogIds;
    return buildOnboardingPlan(
      {
        improve: profile.goals,
        typeDescription: profile.typeDescription,
        desiredRelationship: profile.desiredRelationship,
        struggles: profile.struggles,
      },
      catalogIds,
    ).orderedScenarioIds;
  }, [profile]);

  const recommendedId = nextScenarioId(progress.completedScenarioIds, orderedIds);
  const recommended = scenarios.find((scenario) => scenario.id === recommendedId);

  const openScenario = (scenario: Scenario) => {
    const index = orderedIds.indexOf(scenario.id);
    if (!isScenarioUnlocked(index, progress.completedScenarioIds, orderedIds)) return;
    navigate(`/practice/${scenario.id}`);
  };

  const renderCard = (scenario: Scenario) => {
    const index = orderedIds.indexOf(scenario.id);
    const unlocked = isScenarioUnlocked(index, progress.completedScenarioIds, orderedIds);
    const complete = progress.completedScenarioIds.includes(scenario.id);
    const best = progress.bestScores[scenario.id];
    const status = complete ? "complete" : unlocked ? "available" : "locked";

    return (
      <button
        aria-disabled={!unlocked}
        className="taste-scenario-card"
        data-status={status}
        key={scenario.id}
        type="button"
        onClick={() => openScenario(scenario)}
      >
        <span className="taste-scenario-card__badges">
          <span className="taste-badge taste-badge--dim">
            {scenario.mode === "in_person" ? "In person" : "Messaging"}
          </span>
          <span className="taste-badge taste-badge--dim">{scenario.difficulty}</span>
          {scenario.id === recommendedId && (
            <span className="taste-badge taste-badge--oxblood">Up next</span>
          )}
          {complete && (
            <span className="taste-badge taste-badge--lime">
              <CheckCircle size={13} weight="fill" /> Complete
            </span>
          )}
        </span>
        <h3>{scenario.title}</h3>
        <p className="taste-scenario-card__objective">{scenario.objective}</p>
        <span className="taste-scenario-card__meta">
          <span>{scenario.setting}</span>
          {status === "locked" ? (
            <span>
              <LockSimple size={13} /> Locked
            </span>
          ) : (
            <span className="taste-scenario-card__best">
              {best !== undefined ? `Best ${best}/10` : "Not attempted"}
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <main className="taste-page taste-app">
      <AppNav />
      <div className="taste-app-main">
        <header className="taste-page-heading">
          <p className="taste-kicker">The curriculum</p>
          <h1>
            Ten situations. <em>Three turns each.</em>
          </h1>
          <p>
            Every scenario is a real moment you will actually hit. Finish one to
            unlock the next. Replays improve your best — and only improvement pays.
          </p>
          <div className="taste-stat-row">
            <span className="taste-stat">
              Level <strong>{progress.level}</strong>
            </span>
            <span className="taste-stat">
              XP <strong>{progress.publicXP}</strong>
            </span>
            <span className="taste-stat">
              Done{" "}
              <strong>
                {progress.completedScenarioIds.length}/{scenarios.length}
              </strong>
            </span>
            {recommended && (
              <button
                className="taste-button taste-button--ink"
                type="button"
                onClick={() => navigate(`/practice/${recommended.id}`)}
              >
                Resume: {recommended.title}
                <ArrowRight size={17} weight="bold" />
              </button>
            )}
          </div>
        </header>

        {(["spark", "connection"] as ModuleId[]).map((moduleId) => (
          <section className="taste-module" key={moduleId} aria-labelledby={`${moduleId}-title`}>
            <div className="taste-module__header">
              <h2 id={`${moduleId}-title`}>
                {MODULE_COPY[moduleId].title === "Spark" ? (
                  <>
                    Module 01 — <em>Spark</em>
                  </>
                ) : (
                  <>
                    Module 02 — <em>Connection</em>
                  </>
                )}
              </h2>
              <p>{MODULE_COPY[moduleId].blurb}</p>
            </div>
            <div className="taste-scenario-grid">
              {scenarios
                .filter((scenario) => scenario.module === moduleId)
                .map(renderCard)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
