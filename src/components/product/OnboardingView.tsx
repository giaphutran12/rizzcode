import { type FormEvent, useState } from "react";
import { ArrowRight, CheckCircle, FastForward } from "@phosphor-icons/react";
import { useRizzCode } from "../../context/RizzCodeContext";
import type { UserProfile } from "../../domain/types";
import { getScenario } from "../../data/scenarios";
import { ProductShell } from "./ProductShell";

const goalOptions = [
  "Talk naturally",
  "Become funnier",
  "Improve texting",
  "Ask someone out",
  "Get more dates",
  "Become more relationship-ready",
];

export function OnboardingView() {
  const { completeOnboarding, skipOnboarding } = useRizzCode();
  const [goals, setGoals] = useState<string[]>([]);
  const [typeDescription, setTypeDescription] = useState("");
  const [desiredRelationship, setDesiredRelationship] = useState("");
  const [struggles, setStruggles] = useState("");
  const [result, setResult] = useState<UserProfile>();

  function toggleGoal(goal: string) {
    setGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal],
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setResult(
      completeOnboarding({
        goals: goals.length ? goals : ["Talk naturally"],
        typeDescription,
        desiredRelationship:
          desiredRelationship || "An intentional, enjoyable relationship",
        struggles: struggles || "I overthink the first move.",
      }),
    );
  }

  if (result) {
    const plan = result.onboardingPlan;
    const firstScenario = getScenario(plan.orderedScenarioIds[0]);
    return (
      <ProductShell
        eyebrow="Growth direction"
        title="Good. Now we know what to train."
      >
        <section className="rizz-onboarding-result">
          <div className="rizz-result-lede">
            <span>Recommended starting track</span>
            <strong>{plan.startingModule}</strong>
            <p>
              Start with {plan.skillPriorities[0].toLowerCase()} and{" "}
              {plan.skillPriorities[1].toLowerCase()}. Small reps, no personality
              transplant.
            </p>
          </div>
          <div className="rizz-growth-grid">
            {plan.growthDirections.map((direction) => (
              <article key={direction.quality}>
                <CheckCircle size={24} weight="fill" />
                <h2>{direction.quality}</h2>
                <p>{direction.whyItMatters}</p>
                <strong>Next rep</strong>
                <span>{direction.nextRep}</span>
              </article>
            ))}
          </div>
          <a
            className="rizz-primary-button"
            href={firstScenario ? `/practice/${firstScenario.id}` : "/practice"}
          >
            Run {firstScenario?.title ?? "the first scenario"}
            <ArrowRight size={19} weight="bold" />
          </a>
        </section>
      </ProductShell>
    );
  }

  return (
    <ProductShell
      eyebrow="Four quick questions"
      title="Point the reps at your actual life."
      actions={
        <button
          className="rizz-text-button"
          type="button"
          onClick={() => setResult(skipOnboarding())}
        >
          <FastForward size={18} />
          Skip with smart defaults
        </button>
      }
    >
      <form className="rizz-onboarding" onSubmit={submit}>
        <fieldset>
          <legend>
            <span>01</span>
            What do you want to improve?
          </legend>
          <div className="rizz-choice-grid">
            {goalOptions.map((goal) => (
              <label key={goal}>
                <input
                  type="checkbox"
                  checked={goals.includes(goal)}
                  onChange={() => toggleGoal(goal)}
                />
                <span>{goal}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="rizz-long-answer">
          <span>
            <b>02</b>
            What kind of woman catches your attention?
          </span>
          <textarea
            value={typeDescription}
            onChange={(event) => setTypeDescription(event.target.value)}
            rows={3}
            maxLength={420}
            placeholder="Appearance, energy, interests, personality. Keep it real."
          />
        </label>

        <label className="rizz-long-answer">
          <span>
            <b>03</b>
            What kind of relationship or shared life do you want?
          </span>
          <textarea
            value={desiredRelationship}
            onChange={(event) => setDesiredRelationship(event.target.value)}
            rows={3}
            maxLength={420}
            placeholder="What would a good ordinary Tuesday together look like?"
          />
        </label>

        <label className="rizz-long-answer">
          <span>
            <b>04</b>
            Where do you currently struggle?
          </span>
          <textarea
            value={struggles}
            onChange={(event) => setStruggles(event.target.value)}
            rows={3}
            maxLength={420}
            placeholder="Freezing, boring texts, asking clearly, following through..."
          />
        </label>

        <button className="rizz-primary-button" type="submit">
          Build my direction
          <ArrowRight size={19} weight="bold" />
        </button>
      </form>
    </ProductShell>
  );
}
