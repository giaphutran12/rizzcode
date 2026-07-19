/**
 * Server-only. Builds the model instance for the RizzCode judge.
 *
 * The provider credential is read from process.env at request time only.
 * It must never be printed, logged, diffed, committed, or sent to the browser.
 */
import { openai } from "@ai-sdk/openai";

export const DEFAULT_JUDGE_MODEL = "gpt-5.4";

export function judgeModelId(): string {
  return process.env.RIZZCODE_JUDGE_MODEL || DEFAULT_JUDGE_MODEL;
}

export function isJudgeConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function createJudgeModel() {
  return openai(judgeModelId());
}
