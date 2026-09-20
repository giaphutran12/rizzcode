/**
 * Mythos marketplace settings, read from the environment at call time so a
 * Vercel env change takes effect on the next request without a code change.
 */

export const MYTHOS_PASS_HEADER = "x-rizzcode-mythos";
export const MYTHOS_PASS_TTL_MS = 1000 * 60 * 60 * 12;

export type BillableAction = "persona-turn" | "judgment";

const creditEnvByAction: Record<BillableAction, string> = {
  "persona-turn": "MYTHOS_CREDITS_PER_TURN",
  judgment: "MYTHOS_CREDITS_PER_JUDGMENT",
};

export function mythosListingConfigured(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    environment.MYTHOS_LISTING_IDS?.trim() ||
      environment.MYTHOS_LISTING_ID?.trim(),
  );
}

/** Credits debited per action; a positive integer, defaulting to 1. */
export function creditsForAction(
  action: BillableAction,
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const raw = environment[creditEnvByAction[action]];
  const parsed = raw === undefined ? NaN : Number(raw);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 1;
}
