/**
 * Zod schemas and the deterministic validator for LLM judge output.
 *
 * The model proposes; this module disposes. Every rule in
 * docs/RIZZCODE_MASTER_PLAN.md ("Structured judgment" -> "Validation rules")
 * is enforced here: criterion coverage, score arithmetic, caps, verdict,
 * evidence excerpts as exact substrings of the cited user turn, supported
 * outcome codes, and non-empty coaching fields.
 */

import { z } from "zod";
import { sumRubric, verdictFor } from "./scoring.js";
import type {
  CriterionId,
  Evidence,
  JudgeResult,
  OutcomeCode,
} from "./types.js";

const TURN_SCHEMA = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const CRITERION_ID_SCHEMA = z.enum([
  "context_naturalness",
  "reciprocity_listening",
  "playfulness_personality",
  "respect_calibration",
  "challenge_objective",
]);

const OUTCOME_CODE_SCHEMA = z.enum([
  "conversation_continues",
  "shared_interest",
  "contact_exchanged",
  "date_invited",
  "date_agreed",
  "graceful_exit",
  "low_interest",
  "incompatible",
  "boundary_crossed",
]);

export const EvidenceSchema = z.object({
  turn: TURN_SCHEMA,
  excerpt: z.string().min(1),
  reason: z.string().min(1),
});

export const RubricEntrySchema = z.object({
  id: CRITERION_ID_SCHEMA,
  score: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  evidence: EvidenceSchema,
  feedback: z.string().min(1),
});

export const HardGateFindingSchema = z.object({
  triggered: z.boolean(),
  severity: z.enum(["none", "cap", "stop"]),
  codes: z.array(z.string()),
  maxScore: z.union([z.literal(2), z.literal(4), z.literal(10)]),
  evidence: z.array(EvidenceSchema),
});

export const SimulatedOutcomeSchema = z.object({
  code: OUTCOME_CODE_SCHEMA,
  label: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  basis: z.array(EvidenceSchema),
});

/** The judge model's raw structured output, before server-side arithmetic. */
export const JudgeModelDraftSchema = z.object({
  rubric: z.array(RubricEntrySchema),
  worked: z.array(z.string()),
  improve: z.array(z.string()),
  betterResponse: z.string(),
  outcome: SimulatedOutcomeSchema,
});

export const JudgeResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  attemptId: z.string().min(1),
  mode: z.literal("llm"),
  hardGate: HardGateFindingSchema,
  rubric: z.array(RubricEntrySchema),
  rawScore: z.number().int(),
  finalScore: z.number().int(),
  verdict: z.enum(["FUMBLED", "COOKED", "ATE"]),
  worked: z.array(z.string()),
  improve: z.array(z.string()),
  betterResponse: z.string(),
  outcome: SimulatedOutcomeSchema,
});

export const JudgeRequestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  attemptId: z.string().min(1),
  scenarioId: z.string().min(1),
  responses: z.array(
    z.object({
      turn: TURN_SCHEMA,
      body: z.string(),
    }),
  ),
});

const ALL_CRITERION_IDS: CriterionId[] = [
  "context_naturalness",
  "reciprocity_listening",
  "playfulness_personality",
  "respect_calibration",
  "challenge_objective",
];

export function validateJudgeResult(
  result: unknown,
  input: {
    attemptId: string;
    responses: Array<{ turn: 1 | 2 | 3; body: string }>;
    supportedOutcomeCodes: OutcomeCode[];
  },
): { ok: true; result: JudgeResult } | { ok: false; errors: string[] } {
  const parsed = JudgeResultSchema.safeParse(result);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  const candidate: JudgeResult = parsed.data;
  const errors: string[] = [];

  if (candidate.attemptId !== input.attemptId) {
    errors.push(
      `attemptId "${candidate.attemptId}" does not match expected "${input.attemptId}"`,
    );
  }

  // Exactly five unique rubric entries covering every criterion.
  if (candidate.rubric.length !== ALL_CRITERION_IDS.length) {
    errors.push(
      `rubric must contain exactly ${ALL_CRITERION_IDS.length} entries, got ${candidate.rubric.length}`,
    );
  }
  const ids = candidate.rubric.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    errors.push("rubric criterion ids must be unique");
  }
  for (const id of ALL_CRITERION_IDS) {
    if (!ids.includes(id)) {
      errors.push(`rubric is missing criterion "${id}"`);
    }
  }

  // Score arithmetic: raw is the rubric sum, final honors the hard-gate cap.
  const expectedRaw = sumRubric(candidate.rubric);
  if (candidate.rawScore !== expectedRaw) {
    errors.push(
      `rawScore ${candidate.rawScore} does not equal rubric sum ${expectedRaw}`,
    );
  }
  const expectedFinal = Math.min(expectedRaw, candidate.hardGate.maxScore);
  if (candidate.finalScore !== expectedFinal) {
    errors.push(
      `finalScore ${candidate.finalScore} does not equal min(rawScore, hardGate.maxScore) = ${expectedFinal}`,
    );
  }
  const expectedVerdict = verdictFor(candidate.finalScore);
  if (candidate.verdict !== expectedVerdict) {
    errors.push(
      `verdict "${candidate.verdict}" does not match finalScore ${candidate.finalScore} (expected "${expectedVerdict}")`,
    );
  }

  // Evidence must cite a real user turn, and the excerpt must be an exact
  // (case-sensitive) substring of that turn's body.
  const responsesByTurn = new Map(
    input.responses.map((response) => [response.turn, response.body]),
  );
  const checkEvidence = (evidence: Evidence, where: string) => {
    const body = responsesByTurn.get(evidence.turn);
    if (body === undefined) {
      errors.push(`${where}: turn ${evidence.turn} is not a real user turn`);
      return;
    }
    if (!body.includes(evidence.excerpt)) {
      errors.push(
        `${where}: excerpt is not an exact substring of turn ${evidence.turn}`,
      );
    }
  };
  for (const entry of candidate.rubric) {
    checkEvidence(entry.evidence, `rubric.${entry.id}.evidence`);
  }
  candidate.hardGate.evidence.forEach((evidence, index) =>
    checkEvidence(evidence, `hardGate.evidence[${index}]`),
  );
  candidate.outcome.basis.forEach((evidence, index) =>
    checkEvidence(evidence, `outcome.basis[${index}]`),
  );

  if (!input.supportedOutcomeCodes.includes(candidate.outcome.code)) {
    errors.push(
      `outcome code "${candidate.outcome.code}" is not supported by this scenario`,
    );
  }

  // Coaching fields must be present and non-empty.
  if (candidate.worked.length === 0 || candidate.worked.some((s) => s.trim() === "")) {
    errors.push("worked must be a non-empty array of non-empty strings");
  }
  if (candidate.improve.length === 0 || candidate.improve.some((s) => s.trim() === "")) {
    errors.push("improve must be a non-empty array of non-empty strings");
  }
  if (candidate.betterResponse.trim() === "") {
    errors.push("betterResponse must be a non-empty string");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, result: candidate };
}
