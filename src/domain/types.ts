/**
 * RizzCode domain contracts.
 *
 * These types are the single source of truth shared by the browser client,
 * the deterministic persona engine, and the server-side LLM judge.
 * They follow docs/RIZZCODE_MASTER_PLAN.md exactly.
 */

// ---------------------------------------------------------------------------
// Scenarios and personas
// ---------------------------------------------------------------------------

export type ScenarioMode = "in_person" | "messaging";
export type ModuleId = "spark" | "connection";
export type Difficulty = "easy" | "medium" | "hard";

export type Engagement = "closed" | "low" | "neutral" | "warm";
export type BoundaryState = "none" | "soft" | "explicit";

export interface PersonaState {
  engagement: Engagement;
  boundary: BoundaryState;
  terminal: boolean;
}

export interface PersonaDefinition {
  name: string;
  traits: string[];
  currentGoal: string;
  constraints: string[];
  initialState: PersonaState;
}

export type OutcomeCode =
  | "conversation_continues"
  | "shared_interest"
  | "contact_exchanged"
  | "date_invited"
  | "date_agreed"
  | "graceful_exit"
  | "low_interest"
  | "incompatible"
  | "boundary_crossed";

export interface ScenarioFallbackGraph {
  positiveSignals: string[];
  lowInterestSignals: string[];
  boundarySignals: string[];
  exitSignals: string[];
  repliesByTurn: Record<1 | 2 | 3, Record<Engagement, string>>;
}

export type ScenarioOpening =
  | { kind: "scene_only" }
  | { kind: "persona_message"; body: string };

export interface Scenario {
  id: string;
  module: ModuleId;
  mode: ScenarioMode;
  difficulty: Difficulty;
  title: string;
  setting: string;
  premise: string;
  objective: string;
  visibleContext: string[];
  boundaries: string[];
  skills: string[];
  opening: ScenarioOpening;
  persona: PersonaDefinition;
  successSignals: string[];
  supportedOutcomeCodes: OutcomeCode[];
  fallback: ScenarioFallbackGraph;
}

// ---------------------------------------------------------------------------
// Practice attempts
// ---------------------------------------------------------------------------

export type AttemptStatus =
  | "idle"
  | "active"
  | "awaiting_reply"
  | "awaiting_judgment"
  | "complete"
  | "error";

export interface PracticeMessage {
  id: string;
  speaker: "you" | "her";
  body: string;
  turn: number;
  createdAt: string;
}

export interface Attempt {
  id: string;
  scenarioId: string;
  messages: PracticeMessage[];
  userTurn: 0 | 1 | 2 | 3;
  status: AttemptStatus;
  result?: JudgeResult;
  startedAt: string;
  completedAt?: string;
}

export interface PersonaReply {
  reply: string;
  state: PersonaState;
  interestChange: "down" | "same" | "up";
  terminalReason:
    | null
    | "completed"
    | "persona_exit"
    | "user_exit"
    | "boundary";
}

export interface ConversationEngine {
  reply(input: {
    scenario: Scenario;
    attempt: Attempt;
    personaState: PersonaState;
  }): Promise<PersonaReply>;
}

export interface JudgeEngine {
  evaluate(input: {
    scenario: Scenario;
    attempt: Attempt;
    finalPersonaState: PersonaState;
  }): Promise<JudgeResult>;
}

// ---------------------------------------------------------------------------
// Judge
// ---------------------------------------------------------------------------

export type CriterionId =
  | "context_naturalness"
  | "reciprocity_listening"
  | "playfulness_personality"
  | "respect_calibration"
  | "challenge_objective";

export type Verdict = "FUMBLED" | "COOKED" | "ATE";

export interface Evidence {
  turn: 1 | 2 | 3;
  excerpt: string;
  reason: string;
}

export type HardGateSeverity = "none" | "cap" | "stop";

export interface HardGateFinding {
  triggered: boolean;
  severity: HardGateSeverity;
  codes: string[];
  maxScore: 2 | 4 | 10;
  evidence: Evidence[];
}

export interface RubricEntry {
  id: CriterionId;
  score: 0 | 1 | 2;
  evidence: Evidence;
  feedback: string;
}

export interface SimulatedOutcome {
  code: OutcomeCode;
  label: string;
  confidence: "low" | "medium" | "high";
  basis: Evidence[];
}

export interface JudgeResult {
  schemaVersion: "1.0";
  attemptId: string;
  mode: "llm";
  hardGate: HardGateFinding;
  rubric: RubricEntry[];
  rawScore: number;
  finalScore: number;
  verdict: Verdict;
  worked: string[];
  improve: string[];
  betterResponse: string;
  outcome: SimulatedOutcome;
}

export interface JudgeRequest {
  schemaVersion: "1.0";
  attemptId: string;
  scenarioId: string;
  responses: Array<{
    turn: 1 | 2 | 3;
    body: string;
  }>;
}

export type JudgeErrorCode =
  | "judge_unconfigured"
  | "judge_timeout"
  | "judge_rate_limited"
  | "judge_invalid_output"
  | "judge_unavailable";

export type JudgeApiResponse =
  | { ok: true; result: JudgeResult }
  | {
      ok: false;
      retryable: boolean;
      code: JudgeErrorCode;
      message: string;
    };

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export interface GrowthDirection {
  quality: string;
  whyItMatters: string;
  nextRep: string;
}

export interface OnboardingPlan {
  startingModule: ModuleId;
  skillPriorities: [string, string];
  growthDirections: [GrowthDirection, GrowthDirection];
  orderedScenarioIds: string[];
  sideQuestId?: string;
}

export interface OnboardingAnswers {
  improve: string[];
  typeDescription: string;
  desiredRelationship: string;
  struggles: string[];
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export interface UserProfile {
  version: 1;
  displayName: string;
  goals: string[];
  typeDescription: string;
  desiredRelationship: string;
  struggles: string[];
  onboardingComplete: boolean;
}

export interface Progress {
  version: 1;
  publicXP: number;
  level: number;
  streak: number;
  lastPracticeDay: string | null;
  bestScores: Record<string, number>;
  bestMasteryXP: Record<string, number>;
  completedScenarioIds: string[];
  achievements: string[];
}

export type MilestoneId =
  | "good_conversation"
  | "contact_exchanged"
  | "received_reply"
  | "date_scheduled"
  | "went_on_date"
  | "second_date"
  | "graceful_exit";

export interface Milestone {
  id: string;
  kind: MilestoneId;
  note: string;
  recordedAt: string;
}

export interface SideQuest {
  id: string;
  title: string;
  whyItFits: string;
  personalBenefit: string;
  socialBenefit: string;
  starterAction: string;
  handoffPrompt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_RESPONSE_LENGTH = 420;
export const USER_TURNS_PER_ATTEMPT = 3;

export const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  easy: 0,
  medium: 10,
  hard: 20,
};

export const CRITERION_IDS: CriterionId[] = [
  "context_naturalness",
  "reciprocity_listening",
  "playfulness_personality",
  "respect_calibration",
  "challenge_objective",
];

export const ENGAGEMENT_ORDER: Engagement[] = [
  "closed",
  "low",
  "neutral",
  "warm",
];
