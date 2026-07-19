import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkle } from "@phosphor-icons/react";
import { navigate } from "../router";
import { useProgressStore } from "../hooks/useProgress";
import { scenarios } from "../data/scenarios";
import { buildOnboardingPlan } from "../domain/onboarding";
import type { OnboardingAnswers, OnboardingPlan } from "../domain/types";

const IMPROVE_OPTIONS = [
  "Talk naturally",
  "Become funnier",
  "Improve texting",
  "Ask someone out",
  "Get more dates",
  "Become more relationship-ready",
];

const STRUGGLE_OPTIONS = [
  "I freeze in person",
  "Small talk dies fast",
  "My texts are boring",
  "I can't tell if she's interested",
  "I overthink everything",
  "I disappear after the exciting start",
];

const QUESTION_TITLES = [
  "What do you want to improve?",
  "What kind of woman catches your attention?",
  "What kind of relationship or shared life do you want?",
  "Where do you currently struggle?",
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function OnboardingView() {
  const { saveOnboardingProfile } = useProgressStore();
  const [step, setStep] = useState(0);
  const [improve, setImprove] = useState<string[]>([]);
  const [typeDescription, setTypeDescription] = useState("");
  const [desiredRelationship, setDesiredRelationship] = useState("");
  const [struggles, setStruggles] = useState<string[]>([]);
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);

  const catalogIds = useMemo(() => scenarios.map((scenario) => scenario.id), []);

  const finishWith = (answers: OnboardingAnswers | null) => {
    const built = buildOnboardingPlan(answers, catalogIds);
    saveOnboardingProfile({
      version: 1,
      displayName: "You",
      goals: answers?.improve ?? [],
      typeDescription: answers?.typeDescription ?? "",
      desiredRelationship: answers?.desiredRelationship ?? "",
      struggles: answers?.struggles ?? [],
      onboardingComplete: true,
    });
    return built;
  };

  const handleSkip = () => {
    finishWith(null);
    navigate("/practice");
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    const built = finishWith({
      improve,
      typeDescription,
      desiredRelationship,
      struggles,
    });
    setPlan(built);
  };

  const firstScenario = plan?.orderedScenarioIds[0];

  if (plan) {
    return (
      <main className="taste-page taste-app">
        <div className="taste-app-main taste-app-main--dark">
          <div className="taste-app-inner">
            <header className="taste-page-heading">
              <p className="taste-kicker" style={{ color: "var(--lime)" }}>
                Your starting line
              </p>
              <h1>
                Start with{" "}
                <em>{plan.startingModule === "spark" ? "Spark" : "Connection"}</em>.
              </h1>
              <p>
                Two things to practice first: {plan.skillPriorities[0]} and{" "}
                {plan.skillPriorities[1]}. Not a personality diagnosis — just where
                your reps pay off fastest.
              </p>
            </header>

            <div className="taste-result-grid">
              {plan.growthDirections.map((direction) => (
                <section className="taste-panel taste-panel--lime taste-plan" key={direction.quality}>
                  <span className="taste-kicker">{direction.quality}</span>
                  <div className="taste-plan__direction" style={{ border: 0, padding: 0 }}>
                    <p>{direction.whyItMatters}</p>
                    <span className="taste-plan__rep">
                      Next rep: {direction.nextRep}
                    </span>
                  </div>
                </section>
              ))}
            </div>

            <div className="taste-result-actions" style={{ marginTop: 34 }}>
              {firstScenario && (
                <button
                  className="taste-button taste-button--lime"
                  type="button"
                  onClick={() => navigate(`/practice/${firstScenario}`)}
                >
                  <Sparkle size={18} weight="fill" />
                  Enter your first scenario
                </button>
              )}
              <button
                className="taste-button taste-button--quiet"
                style={{ color: "#fff8ed", borderColor: "rgba(255,248,237,0.5)" }}
                type="button"
                onClick={() => navigate("/practice")}
              >
                Browse the curriculum
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="taste-page taste-app">
      <div className="taste-app-main taste-app-main--dark">
        <div className="taste-app-inner">
          <div className="taste-onboard">
            <div>
              <p className="taste-kicker" style={{ color: "var(--lime)" }}>
                Four questions, sixty seconds
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(2.6rem, 5vw, 5rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.06em",
                  lineHeight: 0.95,
                }}
              >
                Practice for the life you actually want.
              </h1>
              <div className="taste-onboard__steps" aria-label="Onboarding progress">
                {QUESTION_TITLES.map((title, index) => (
                  <span
                    className="taste-onboard__step"
                    data-active={index === step}
                    key={title}
                  >
                    <span>{index + 1}</span>
                    {title}
                  </span>
                ))}
              </div>
            </div>

            <div className="taste-onboard__card">
              <h2 className="taste-onboard__question">{QUESTION_TITLES[step]}</h2>

              {step === 0 && (
                <div className="taste-onboard__options" role="group" aria-label={QUESTION_TITLES[0]}>
                  {IMPROVE_OPTIONS.map((option) => (
                    <button
                      className="taste-chip"
                      data-selected={improve.includes(option)}
                      key={option}
                      type="button"
                      aria-pressed={improve.includes(option)}
                      onClick={() => setImprove(toggle(improve, option))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="taste-onboard__field">
                  <label htmlFor="onboard-type">
                    Appearance, energy, interests, personality — anything real
                  </label>
                  <textarea
                    id="onboard-type"
                    value={typeDescription}
                    onChange={(event) => setTypeDescription(event.target.value)}
                    placeholder="e.g. Quick laugh, reads a lot, a little competitive about board games…"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="taste-onboard__field">
                  <label htmlFor="onboard-relationship">
                    Be honest — situationship, intentional girlfriend, married with a dog?
                  </label>
                  <textarea
                    id="onboard-relationship"
                    value={desiredRelationship}
                    onChange={(event) => setDesiredRelationship(event.target.value)}
                    placeholder="e.g. An intentional relationship that turns into a calm, funny life together…"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="taste-onboard__options" role="group" aria-label={QUESTION_TITLES[3]}>
                  {STRUGGLE_OPTIONS.map((option) => (
                    <button
                      className="taste-chip"
                      data-selected={struggles.includes(option)}
                      key={option}
                      type="button"
                      aria-pressed={struggles.includes(option)}
                      onClick={() => setStruggles(toggle(struggles, option))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <div className="taste-onboard__actions">
                {step > 0 && (
                  <button
                    className="taste-chip"
                    type="button"
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft size={15} weight="bold" /> Back
                  </button>
                )}
                <button
                  className="taste-button taste-button--lime"
                  type="button"
                  onClick={handleNext}
                >
                  {step < 3 ? "Next" : "Build my starting plan"}
                  <ArrowRight size={17} weight="bold" />
                </button>
                <button className="taste-onboard__skip" type="button" onClick={handleSkip}>
                  Skip — give me the default plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
