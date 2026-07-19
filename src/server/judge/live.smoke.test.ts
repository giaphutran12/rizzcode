// @vitest-environment node
/**
 * Opt-in live smoke test for the real LLM judge path. Skipped unless
 * RIZZCODE_LIVE_JUDGE=1 is set AND an OPENAI_API_KEY is available (from the
 * shell or .env.local). The key is loaded silently and never printed.
 *
 * Run explicitly with:
 *   RIZZCODE_LIVE_JUDGE=1 npx vitest run src/server/judge/live.smoke.test.ts
 */
import { describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { getScenarioById } from "../../data/scenarios";
import { sumRubric, verdictFor } from "../../domain/scoring";
import type { Evidence } from "../../domain/types";
import { handleJudgeRequest } from "./route";

const LIVE = process.env.RIZZCODE_LIVE_JUDGE === "1";

// Fill OPENAI_API_KEY from env files only when the shell did not provide one.
// Values are never logged.
const fileEnv = loadEnv("test", process.cwd(), "");
if (!process.env.OPENAI_API_KEY?.trim() && fileEnv.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = fileEnv.OPENAI_API_KEY;
}

// The live path must be the real judge, never the test mock.
delete process.env.RIZZCODE_JUDGE_MOCK;

const SCENARIO_ID = "spark-text-after-meeting";
const scenario = getScenarioById(SCENARIO_ID);
if (!scenario) {
  throw new Error(`scenario catalog is missing "${SCENARIO_ID}"`);
}

// A warm, calibrated three-text thread: reopens the shared moment with a
// specific callback, one question max per text, matches her playful tone, and
// lands a low-pressure invitation with an easy decline only in the last text.
const RESPONSES: Array<{ turn: 1 | 2 | 3; body: string }> = [
  {
    turn: 1,
    body: "The smoke machine deserved its own speaker slot honestly — and the laptop dying mid-sentence was cinema. What was your favorite disaster of the night?",
  },
  {
    turn: 2,
    body: "Fair choice. Mine was the demo that crashed twice and still got applause — I told my roommate it was performance art and she almost believed me.",
  },
  {
    turn: 3,
    body: "Okay, verdict: that night was a beautiful disaster. Want to continue this over coffee this week? Low stakes — if you're swamped, no worries.",
  },
];

describe.skipIf(!LIVE || !process.env.OPENAI_API_KEY?.trim())(
  "live LLM judge (opt-in)",
  () => {
    it(
      "returns a validated llm-mode judgment for a warm transcript",
      { timeout: 90_000 },
      async () => {
        const request = {
          schemaVersion: "1.0" as const,
          attemptId: `live-smoke-${Date.now()}`,
          scenarioId: SCENARIO_ID,
          responses: RESPONSES,
        };

        const { status, body } = await handleJudgeRequest(request);

        expect(status).toBe(200);
        if (!body.ok) {
          throw new Error(
            `expected ok:true from the live judge, got ${JSON.stringify(body)}`,
          );
        }
        const result = body.result;

        expect(result.mode).toBe("llm");
        expect(result.attemptId).toBe(request.attemptId);

        // Five unique rubric entries covering every criterion.
        expect(result.rubric).toHaveLength(5);
        const ids = result.rubric.map((entry) => entry.id);
        expect(new Set(ids).size).toBe(5);
        expect(ids).toEqual(
          expect.arrayContaining([
            "context_naturalness",
            "reciprocity_listening",
            "playfulness_personality",
            "respect_calibration",
            "challenge_objective",
          ]),
        );

        // Server-owned arithmetic: raw sum, gate cap, verdict.
        expect(result.rawScore).toBe(sumRubric(result.rubric));
        expect(result.finalScore).toBe(
          Math.min(result.rawScore, result.hardGate.maxScore),
        );
        expect(result.verdict).toBe(verdictFor(result.finalScore));

        // Every evidence excerpt is an exact substring of the cited user turn
        // (the route trims/truncates bodies the same way, and these are short).
        const byTurn = new Map(RESPONSES.map((r) => [r.turn, r.body]));
        const checkEvidence = (evidence: Evidence, where: string) => {
          const turnBody = byTurn.get(evidence.turn);
          expect(turnBody, `${where}: real user turn`).toBeDefined();
          expect(
            turnBody?.includes(evidence.excerpt),
            `${where}: excerpt must be an exact substring of turn ${evidence.turn}`,
          ).toBe(true);
        };
        for (const entry of result.rubric) {
          checkEvidence(entry.evidence, `rubric.${entry.id}.evidence`);
        }
        result.outcome.basis.forEach((evidence, index) =>
          checkEvidence(evidence, `outcome.basis[${index}]`),
        );

        // The outcome is one this scenario actually supports.
        expect(scenario.supportedOutcomeCodes).toContain(result.outcome.code);
      },
    );
  },
);
