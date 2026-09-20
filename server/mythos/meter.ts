import {
  InsufficientFundsError,
  SessionNotFoundError,
  reportUsage,
} from "@mythos-work/sdk";
import { type BillableAction, creditsForAction } from "./config";
import { requestMythosSession } from "./pass";

export type MeterOutcome =
  | "not_mythos"
  | "charged"
  | "insufficient_funds"
  | "session_not_found"
  | "failed";

/**
 * Debits the launched consumer's Mythos wallet after billable work succeeded.
 * Never throws and never blocks the product flow: the consumer already got the
 * turn or the judgment, so a billing failure is logged for reconciliation.
 * The idempotency key is derived from the attempt so a client retry of the
 * same turn cannot charge twice.
 */
export async function meterMythosUsage(
  request: Request,
  action: BillableAction,
  attempt: { attemptId: string; turn?: number },
): Promise<MeterOutcome> {
  const session = requestMythosSession(request);
  if (!session) return "not_mythos";

  const credits = creditsForAction(action);
  const idempotencyKey =
    action === "judgment"
      ? `${attempt.attemptId}:judgment`
      : `${attempt.attemptId}:turn:${attempt.turn ?? 0}`;
  const fields = {
    action,
    credits,
    attemptId: attempt.attemptId,
    turn: attempt.turn,
    listingId: session.listingId,
  };

  try {
    await reportUsage(session.sessionJti, {
      credits,
      reason: action,
      idempotencyKey,
    });
    console.info("[mythos] usage metered", JSON.stringify(fields));
    return "charged";
  } catch (error) {
    let outcome: MeterOutcome = "failed";
    if (error instanceof InsufficientFundsError) outcome = "insufficient_funds";
    else if (error instanceof SessionNotFoundError) outcome = "session_not_found";
    console.warn(
      "[mythos] usage not metered",
      JSON.stringify({
        ...fields,
        outcome,
        reason: error instanceof Error ? error.message : "unknown",
      }),
    );
    return outcome;
  }
}
