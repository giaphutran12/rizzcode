import type { MythosSession } from "@mythos-work/sdk";
import { signJson, verifyJson } from "../signing";
import { MYTHOS_PASS_HEADER, MYTHOS_PASS_TTL_MS } from "./config";

/**
 * A Mythos launch token is single-use and lives about five minutes, so after
 * the server consumes it the browser needs something durable to prove it is
 * the same launched consumer. The pass is that proof: the verified session,
 * HMAC-signed by this server, sent back on every API call as a header.
 */

const PASS_VERSION = 1;

type PassPayload = {
  version: typeof PASS_VERSION;
  expiresAt: number;
  session: MythosSession;
};

export function issueMythosPass(session: MythosSession): string {
  const payload: PassPayload = {
    version: PASS_VERSION,
    expiresAt: Date.now() + MYTHOS_PASS_TTL_MS,
    session,
  };
  return signJson(payload);
}

export function verifyMythosPass(pass: string): MythosSession {
  const payload = verifyJson(pass) as Partial<PassPayload>;
  const session = payload.session;
  if (
    payload.version !== PASS_VERSION ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Date.now() ||
    !session ||
    typeof session.sessionJti !== "string" ||
    typeof session.userId !== "string" ||
    typeof session.listingId !== "string"
  ) {
    throw new Error("Mythos pass is expired or incompatible.");
  }
  return { ...session };
}

/** The launched Mythos consumer behind a request, or undefined for everyone else. */
export function requestMythosSession(
  request: Request,
): MythosSession | undefined {
  const pass = request.headers.get(MYTHOS_PASS_HEADER)?.trim();
  if (!pass) return undefined;
  try {
    return verifyMythosPass(pass);
  } catch (error) {
    console.warn(
      "[mythos] pass rejected",
      JSON.stringify({
        reason: error instanceof Error ? error.message : "unknown",
        passLength: pass.length,
      }),
    );
    return undefined;
  }
}
