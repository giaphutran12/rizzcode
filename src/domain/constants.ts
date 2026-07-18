import type { CriterionId, OutcomeCode } from "./types";

export const CRITERIA: readonly CriterionId[] = [
  "context_naturalness",
  "reciprocity_listening",
  "playfulness_personality",
  "respect_calibration",
  "challenge_objective",
] as const;

export const CRITERION_LABELS: Record<CriterionId, string> = {
  context_naturalness: "Context & naturalness",
  reciprocity_listening: "Reciprocity & listening",
  playfulness_personality: "Playfulness & personality",
  respect_calibration: "Respect & calibration",
  challenge_objective: "Challenge objective",
};

export const OUTCOME_LABELS: Record<OutcomeCode, string> = {
  conversation_continues: "Comfortable continuation",
  shared_interest: "Shared interest",
  contact_exchanged: "Contact exchanged",
  date_invited: "Date invited",
  date_agreed: "Date agreed",
  graceful_exit: "Graceful exit",
  low_interest: "Low interest",
  incompatible: "Incompatibility clarified",
  boundary_crossed: "Boundary crossed",
};

export const MAX_RESPONSE_LENGTH = 420;
