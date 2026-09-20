import type { Attempt } from "../src/domain/types";
import { signJson, verifyJson } from "./signing";

const SESSION_VERSION = 1;
const SESSION_TTL_MS = 1000 * 60 * 60 * 6;

type SessionPayload = {
  version: typeof SESSION_VERSION;
  expiresAt: number;
  attempt: Attempt;
};

export function signConversationSession(attempt: Attempt): string {
  const payload: SessionPayload = {
    version: SESSION_VERSION,
    expiresAt: Date.now() + SESSION_TTL_MS,
    attempt,
  };
  return signJson(payload);
}

export function verifyConversationSession(token: string): Attempt {
  let payload: Partial<SessionPayload>;
  try {
    payload = verifyJson(token) as Partial<SessionPayload>;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    throw new Error(
      reason.includes("malformed")
        ? "Conversation receipt is malformed."
        : "Conversation receipt is invalid.",
    );
  }
  if (
    payload.version !== SESSION_VERSION ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Date.now() ||
    !payload.attempt ||
    typeof payload.attempt.id !== "string" ||
    typeof payload.attempt.scenarioId !== "string" ||
    !Array.isArray(payload.attempt.messages) ||
    typeof payload.attempt.userTurn !== "number"
  ) {
    throw new Error("Conversation receipt is expired or incompatible.");
  }

  return structuredClone(payload.attempt);
}
