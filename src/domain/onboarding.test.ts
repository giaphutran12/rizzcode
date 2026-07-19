import { describe, expect, it } from "vitest";
import { buildOnboardingPlan } from "./onboarding.js";
import type { OnboardingAnswers } from "./types.js";

const CATALOG = [
  "bus_stop_opener",
  "social_introduction",
  "text_after_meeting",
  "callback_thread",
  "first_date_ask",
];

function answers(overrides: Partial<OnboardingAnswers>): OnboardingAnswers {
  return {
    improve: [],
    typeDescription: "",
    desiredRelationship: "",
    struggles: [],
    ...overrides,
  };
}

describe("buildOnboardingPlan: defaults", () => {
  it("null answers produce the default plan in catalog order", () => {
    const plan = buildOnboardingPlan(null, CATALOG);
    expect(plan.startingModule).toBe("spark");
    expect(plan.skillPriorities).toEqual(["Situational openers", "Listening"]);
    expect(plan.orderedScenarioIds).toEqual(CATALOG);
    expect(plan.sideQuestId).toBeUndefined();
    expect(plan.growthDirections).toHaveLength(2);
    for (const direction of plan.growthDirections) {
      expect(direction.quality.length).toBeGreaterThan(0);
      expect(direction.whyItMatters.length).toBeGreaterThan(0);
      expect(direction.nextRep.length).toBeGreaterThan(0);
    }
  });

  it("all-empty answers also produce the default plan", () => {
    const plan = buildOnboardingPlan(answers({}), CATALOG);
    expect(plan.startingModule).toBe("spark");
    expect(plan.orderedScenarioIds).toEqual(CATALOG);
  });
});

describe("buildOnboardingPlan: keyword routing", () => {
  it("texting routes to spark with messaging skills", () => {
    const plan = buildOnboardingPlan(
      answers({ improve: ["Improve texting"] }),
      CATALOG,
    );
    expect(plan.startingModule).toBe("spark");
    expect(plan.skillPriorities).toEqual([
      "Interesting texting",
      "Asking for contact information",
    ]);
  });

  it("relationship readiness routes to the connection module", () => {
    const plan = buildOnboardingPlan(
      answers({ improve: ["Become more relationship-ready"] }),
      CATALOG,
    );
    expect(plan.startingModule).toBe("connection");
    expect(plan.skillPriorities).toEqual(["Listening", "Reliability"]);
  });

  it("unknown goals fall back to the default spark plan", () => {
    const plan = buildOnboardingPlan(
      answers({ improve: ["Become a chess grandmaster"] }),
      CATALOG,
    );
    expect(plan.startingModule).toBe("spark");
    expect(plan.skillPriorities).toEqual(["Situational openers", "Listening"]);
    expect(plan.orderedScenarioIds).toEqual(CATALOG);
  });
});

describe("buildOnboardingPlan: scenario ordering", () => {
  it("puts the two most relevant scenarios first and keeps every id once", () => {
    const plan = buildOnboardingPlan(
      answers({ improve: ["Improve texting"] }),
      CATALOG,
    );
    expect(plan.orderedScenarioIds).toHaveLength(CATALOG.length);
    expect(new Set(plan.orderedScenarioIds).size).toBe(CATALOG.length);
    expect([...plan.orderedScenarioIds].sort()).toEqual([...CATALOG].sort());
    expect(plan.orderedScenarioIds.slice(0, 2)).toEqual([
      "text_after_meeting",
      "callback_thread",
    ]);
  });
});

describe("buildOnboardingPlan: growth directions", () => {
  it("picks two qualities from the fixed pool tied to the desired relationship", () => {
    const plan = buildOnboardingPlan(
      answers({
        struggles: ["I freeze up around new people"],
        desiredRelationship: "a calm, intentional relationship",
      }),
      CATALOG,
    );
    expect(plan.growthDirections).toHaveLength(2);
    const qualities = plan.growthDirections.map((d) => d.quality);
    expect(new Set(qualities).size).toBe(2);
    expect(plan.growthDirections[0].quality).toBe("presence");
    expect(plan.growthDirections[0].whyItMatters).toContain(
      "a calm, intentional relationship",
    );
    for (const direction of plan.growthDirections) {
      expect(direction.nextRep.length).toBeGreaterThan(0);
    }
  });
});

describe("buildOnboardingPlan: side quests", () => {
  it("suggests learn_guitar when music comes up", () => {
    const plan = buildOnboardingPlan(
      answers({ typeDescription: "Creative women who love music" }),
      CATALOG,
    );
    expect(plan.sideQuestId).toBe("learn_guitar");
  });

  it("suggests speak_without_freezing when freezing comes up", () => {
    const plan = buildOnboardingPlan(
      answers({ struggles: ["I freeze and overthink everything"] }),
      CATALOG,
    );
    expect(plan.sideQuestId).toBe("speak_without_freezing");
  });

  it("never suggests more than one side quest", () => {
    const plan = buildOnboardingPlan(
      answers({
        typeDescription: "She plays guitar",
        struggles: ["I freeze and overthink everything"],
      }),
      CATALOG,
    );
    expect(plan.sideQuestId).toBe("learn_guitar");
  });
});
