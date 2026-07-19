/**
 * Deterministic onboarding plan builder. No LLM, no randomness.
 *
 * Maps the four onboarding answers to a starting module, two skill
 * priorities, two growth directions (each with a one-sentence why tied to the
 * user's desired relationship and one concrete rep), a personalized scenario
 * ordering, and at most one side quest (docs/RIZZCODE_MASTER_PLAN.md,
 * "Onboarding contract").
 *
 * Copy rules: warm, phrased as useful directions — never a verdict on the
 * user's worth, never a diagnosis.
 */

import { matchesSignal } from "./personaEngine.js";
import type {
  GrowthDirection,
  ModuleId,
  OnboardingAnswers,
  OnboardingPlan,
} from "./types.js";

const DEFAULT_PRIORITIES: [string, string] = [
  "Situational openers",
  "Listening",
];

/**
 * Whole-word / whole-phrase keyword matching, so "dm" does not fire inside
 * "grandmaster" and "ask" does not fire inside "mask". Keywords must list the
 * surface forms they should catch ("text" and "texting" separately).
 */
function mentionsAny(text: string, keywords: string[]): boolean {
  return matchesSignal(text, keywords) !== null;
}

interface SkillRoute {
  keywords: string[];
  startingModule: ModuleId;
  skillPriorities: [string, string];
  // Tokens used to pull the most relevant scenario ids to the front.
  scenarioTokens: string[];
}

// First matching route wins, so order encodes priority.
const SKILL_ROUTES: SkillRoute[] = [
  {
    keywords: ["text", "texts", "texting", "messaging", "message", "messages", "dm", "dms"],
    startingModule: "spark",
    skillPriorities: ["Interesting texting", "Asking for contact information"],
    scenarioTokens: ["text", "messag", "callback", "thread", "reopen"],
  },
  {
    keywords: ["relationship", "relationships", "commit", "commitment", "long term", "girlfriend", "ready"],
    startingModule: "connection",
    skillPriorities: ["Listening", "Reliability"],
    scenarioTokens: ["date", "recover", "low_interest", "incompat", "follow", "connection"],
  },
  {
    keywords: ["fun", "funny", "funnier", "humor", "banter", "playful", "joke", "jokes", "boring"],
    startingModule: "spark",
    skillPriorities: ["Humor and playful observations", "Banter"],
    scenarioTokens: ["callback", "banter", "playful", "group"],
  },
  {
    keywords: ["ask", "date", "dates", "approach", "confidence", "nervous", "freeze", "freezing", "overthink", "overthinking"],
    startingModule: "spark",
    skillPriorities: ["Confidence under uncertainty", "Situational openers"],
    scenarioTokens: ["bus", "opener", "open", "library", "cafe", "introduc"],
  },
];

interface QualityDef {
  quality: string;
  keywords: string[];
  whyItMatters: (desiredRelationship: string) => string;
  nextRep: string;
}

function desiredClause(desiredRelationship: string): string {
  const trimmed = desiredRelationship.trim();
  return trimmed === ""
    ? "the relationship you actually want"
    : `the relationship you described — ${trimmed}`;
}

// Fixed quality pool, in stable selection order.
const QUALITY_POOL: QualityDef[] = [
  {
    quality: "presence",
    keywords: ["freeze", "freezes", "freezing", "overthink", "overthinking", "nervous", "anxious", "shy", "blank"],
    whyItMatters: (d) =>
      `Staying present lets you respond to the actual person in front of you instead of your own script — that is where ${desiredClause(d)} starts.`,
    nextRep:
      "In your next conversation, name one thing you can see or hear before you reply.",
  },
  {
    quality: "playfulness",
    keywords: ["fun", "funny", "funnier", "humor", "banter", "playful", "joke", "jokes", "boring", "serious"],
    whyItMatters: (d) =>
      `Playfulness turns small moments into shared ones, and shared moments are the raw material of ${desiredClause(d)}.`,
    nextRep: "Add one playful observation to your next practice reply.",
  },
  {
    quality: "courage",
    keywords: ["approach", "approaching", "ask", "afraid", "scared", "rejection", "confidence", "avoid", "avoiding"],
    whyItMatters: (d) =>
      `Courage here just means making clear, low-pressure moves — ${desiredClause(d)} needs someone willing to go first.`,
    nextRep: "Make one clear, low-pressure invitation in this week's practice.",
  },
  {
    quality: "reliability",
    keywords: ["relationship", "relationships", "commit", "commitment", "dependable", "ghost", "ghosting", "follow through", "flake", "flaky"],
    whyItMatters: (d) =>
      `Reliability is quiet but rare: doing what you said you would do is exactly what ${desiredClause(d)} runs on.`,
    nextRep: "Send one reply you have been putting off, within 24 hours.",
  },
  {
    quality: "listening",
    keywords: ["listen", "listening", "interrupt", "interrupting", "talk too much", "conversation", "conversations", "respond"],
    whyItMatters: (d) =>
      `Listening well means she feels known rather than interviewed — the foundation of ${desiredClause(d)}.`,
    nextRep: "In your next reply, reference one specific detail she mentioned.",
  },
  {
    quality: "honest follow-up",
    keywords: ["text", "texts", "texting", "reply", "replying", "follow up", "late", "disappear", "disappearing"],
    whyItMatters: (d) =>
      `Honest follow-up keeps good moments alive instead of letting them fade — ${desiredClause(d)} grows through small kept promises.`,
    nextRep:
      "After your next practice scenario, write the follow-up text you would actually send.",
  },
  {
    quality: "self-control",
    keywords: ["pressure", "impatient", "push", "intense", "boundary", "boundaries"],
    whyItMatters: (d) =>
      `Self-control lets attraction breathe: matching her pace builds the trust that ${desiredClause(d)} depends on.`,
    nextRep:
      "When you feel the urge to push for more, pause and match her pace instead.",
  },
];

function combinedAnswerText(answers: OnboardingAnswers): string {
  return [
    ...answers.improve,
    ...answers.struggles,
    answers.typeDescription,
    answers.desiredRelationship,
  ]
    .join(" ")
    .toLowerCase();
}

function goalText(answers: OnboardingAnswers): string {
  return [...answers.improve, ...answers.struggles].join(" ").toLowerCase();
}

function isEmptyAnswers(answers: OnboardingAnswers | null): boolean {
  if (answers === null) return true;
  return (
    answers.improve.length === 0 &&
    answers.struggles.length === 0 &&
    answers.typeDescription.trim() === "" &&
    answers.desiredRelationship.trim() === ""
  );
}

function pickQualityDirections(
  answers: OnboardingAnswers,
): [GrowthDirection, GrowthDirection] {
  const text = combinedAnswerText(answers);
  const matched = QUALITY_POOL.filter((def) => mentionsAny(text, def.keywords));
  const chosen: QualityDef[] = [];
  for (const def of matched) {
    if (chosen.length >= 2) break;
    chosen.push(def);
  }
  for (const def of QUALITY_POOL) {
    if (chosen.length >= 2) break;
    if (!chosen.includes(def)) chosen.push(def);
  }
  return [
    {
      quality: chosen[0].quality,
      whyItMatters: chosen[0].whyItMatters(answers.desiredRelationship),
      nextRep: chosen[0].nextRep,
    },
    {
      quality: chosen[1].quality,
      whyItMatters: chosen[1].whyItMatters(answers.desiredRelationship),
      nextRep: chosen[1].nextRep,
    },
  ];
}

function orderScenarios(
  scenarioTokens: string[],
  catalogOrder: string[],
): string[] {
  const scored = catalogOrder.map((id, index) => ({
    id,
    index,
    score: scenarioTokens.filter((token) => id.includes(token)).length,
  }));
  const topTwo = [...scored]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.id);
  return [...topTwo, ...catalogOrder.filter((id) => !topTwo.includes(id))];
}

function pickSideQuestId(answers: OnboardingAnswers): string | undefined {
  const text = combinedAnswerText(answers);
  if (mentionsAny(text, ["music", "guitar"])) {
    return "learn_guitar";
  }
  if (mentionsAny(text, ["freeze", "freezes", "freezing", "overthink", "overthinking", "blank"])) {
    return "speak_without_freezing";
  }
  return undefined;
}

export function buildOnboardingPlan(
  answers: OnboardingAnswers | null,
  allScenarioIdsInCatalogOrder: string[],
): OnboardingPlan {
  if (answers === null || isEmptyAnswers(answers)) {
    const growthDirections: [GrowthDirection, GrowthDirection] = [
      {
        quality: "presence",
        whyItMatters: QUALITY_POOL[0].whyItMatters(""),
        nextRep: QUALITY_POOL[0].nextRep,
      },
      {
        quality: "listening",
        whyItMatters: QUALITY_POOL[4].whyItMatters(""),
        nextRep: QUALITY_POOL[4].nextRep,
      },
    ];
    return {
      startingModule: "spark",
      skillPriorities: [...DEFAULT_PRIORITIES],
      growthDirections,
      orderedScenarioIds: [...allScenarioIdsInCatalogOrder],
    };
  }

  const goals = goalText(answers);
  const route = SKILL_ROUTES.find((candidate) =>
    mentionsAny(goals, candidate.keywords),
  );

  const plan: OnboardingPlan = {
    startingModule: route?.startingModule ?? "spark",
    skillPriorities: route ? [...route.skillPriorities] : [...DEFAULT_PRIORITIES],
    growthDirections: pickQualityDirections(answers),
    orderedScenarioIds: route
      ? orderScenarios(route.scenarioTokens, allScenarioIdsInCatalogOrder)
      : [...allScenarioIdsInCatalogOrder],
  };

  const sideQuestId = pickSideQuestId(answers);
  if (sideQuestId !== undefined) {
    plan.sideQuestId = sideQuestId;
  }
  return plan;
}
