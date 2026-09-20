import {
  InsufficientFundsError,
  SessionNotFoundError,
  reportUsage,
} from "@mythos-work/sdk";
import { requestMythosSession } from "../../../../../server/mythos/pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS_PER_CALL = 10;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * The route the Mythos contract requires. RizzCode meters persona turns and
 * judgments server-side, so this door only accepts a launched consumer's own
 * pass and caps the charge; the pass, not the request body, names the session.
 */
export async function POST(request: Request) {
  const session = requestMythosSession(request);
  if (!session) {
    return json({ error: "Missing Mythos pass" }, 401);
  }

  let body: { credits?: unknown; reason?: unknown; sessionJti?: unknown } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (
    typeof body.sessionJti === "string" &&
    body.sessionJti !== session.sessionJti
  ) {
    return json({ error: "Session does not match pass" }, 403);
  }
  const credits = body.credits === undefined ? 1 : Number(body.credits);
  if (
    !Number.isInteger(credits) ||
    credits <= 0 ||
    credits > MAX_CREDITS_PER_CALL
  ) {
    return json(
      { error: `credits must be an integer from 1 to ${MAX_CREDITS_PER_CALL}` },
      400,
    );
  }
  const reason =
    typeof body.reason === "string" && body.reason.length <= 80
      ? body.reason
      : "client-report";

  try {
    await reportUsage(session.sessionJti, { credits, reason });
    console.info(
      "[mythos] usage metered",
      JSON.stringify({ action: reason, credits, listingId: session.listingId }),
    );
    return json({ ok: true }, 200);
  } catch (error) {
    const status =
      error instanceof InsufficientFundsError
        ? 402
        : error instanceof SessionNotFoundError
          ? 404
          : 503;
    console.warn(
      "[mythos] usage not metered",
      JSON.stringify({
        action: reason,
        credits,
        status,
        reason: error instanceof Error ? error.message : "unknown",
      }),
    );
    return json({ error: "Usage could not be reported" }, status);
  }
}
