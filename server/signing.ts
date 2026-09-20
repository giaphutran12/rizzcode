import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * One HMAC key for every server-signed receipt RizzCode hands the browser:
 * the conversation receipt and the Mythos launch pass. Derived from
 * RIZZCODE_SESSION_SECRET, falling back to the OpenAI key so a deploy
 * without the dedicated secret still signs consistently.
 */
export function signingKey(): Buffer {
  const secret =
    process.env.RIZZCODE_SESSION_SECRET ?? process.env.OPENAI_API_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Conversation signing is not configured.");
    }
    return createHash("sha256")
      .update("rizzcode-local-session-key")
      .digest();
  }
  return createHash("sha256")
    .update(`rizzcode-session-v1:${secret}`)
    .digest();
}

export function signatureFor(payload: string): Buffer {
  return createHmac("sha256", signingKey()).update(payload).digest();
}

/** Encodes a JSON payload as `<base64url payload>.<base64url signature>`. */
export function signJson(payload: unknown): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signatureFor(encoded).toString("base64url");
  return `${encoded}.${signature}`;
}

/** Verifies a token produced by signJson and returns the decoded payload. */
export function verifyJson(token: string): unknown {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra) {
    throw new Error("Signed token is malformed.");
  }
  const expected = signatureFor(encoded);
  const provided = Buffer.from(providedSignature, "base64url");
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new Error("Signed token is invalid.");
  }
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}
