/**
 * A stand-in Mythos API for tests and local QA: a real ES256 key pair, a
 * JWKS document, token minting for every purpose the SDK checks, and a
 * `fetch` that answers the SDK's JWKS, consume and meter calls in memory.
 */
import { SignJWT, exportJWK, generateKeyPair, type KeyLike } from "jose";

export const FAKE_LISTING_ID = "listing-rizzcode-local";

export interface FakeMythos {
  jwks: { keys: Array<Record<string, unknown>> };
  mintLaunchToken(overrides?: Record<string, unknown>): Promise<string>;
  mintHandshakeToken(): Promise<string>;
  mintPurposeToken(purpose: string): Promise<string>;
  consumed: string[];
  metered: Array<{ jti: string; body: Record<string, unknown> }>;
  /** Status the next consume call should return; resets to 200 after use. */
  nextConsumeStatus: number;
  /** Status the next meter call should return; resets to 200 after use. */
  nextMeterStatus: number;
  fetch: typeof fetch;
}

export async function createFakeMythos(apiUrl: string): Promise<FakeMythos> {
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const kid = "fake-kid-1";
  const publicJwk = { ...(await exportJWK(publicKey)), kid, use: "sig", alg: "ES256" };

  async function sign(claims: Record<string, unknown>, ttlSeconds: number) {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: "ES256", kid })
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(privateKey as KeyLike);
  }

  const fake: FakeMythos = {
    jwks: { keys: [publicJwk] },
    consumed: [],
    metered: [],
    nextConsumeStatus: 200,
    nextMeterStatus: 200,
    mintLaunchToken(overrides = {}) {
      return sign(
        {
          iss: "mythos",
          aud: FAKE_LISTING_ID,
          sub: "consumer-1",
          email: "consumer@example.com",
          displayName: "Consumer One",
          listingId: FAKE_LISTING_ID,
          jti: `jti-${Math.random().toString(36).slice(2, 10)}`,
          ...overrides,
        },
        300,
      );
    },
    mintHandshakeToken() {
      return sign({ sub: "mythos", purpose: "handshake-check" }, 120);
    },
    mintPurposeToken(purpose) {
      return sign({ iss: "mythos", purpose, listingId: FAKE_LISTING_ID }, 120);
    },
    fetch: async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      if (!url.startsWith(apiUrl)) {
        throw new Error(`fake mythos refused ${url}`);
      }
      const path = url.slice(apiUrl.length);
      if (path === "/.well-known/jwks.json") {
        return Response.json(fake.jwks);
      }
      const consume = path.match(/^\/api\/apps\/sessions\/([^/]+)\/consume$/);
      if (consume && init?.method === "POST") {
        const jti = decodeURIComponent(consume[1]);
        let status = fake.nextConsumeStatus;
        fake.nextConsumeStatus = 200;
        // Mirrors Mythos: a launch token is consumed once, replays get 409.
        if (status === 200 && fake.consumed.includes(jti)) status = 409;
        if (status === 200) fake.consumed.push(jti);
        return Response.json({ ok: status === 200 }, { status });
      }
      const meter = path.match(/^\/api\/apps\/sessions\/([^/]+)\/meter$/);
      if (meter && init?.method === "POST") {
        const status = fake.nextMeterStatus;
        fake.nextMeterStatus = 200;
        if (status === 200) {
          fake.metered.push({
            jti: decodeURIComponent(meter[1]),
            body: JSON.parse(String(init.body)) as Record<string, unknown>,
          });
        }
        return Response.json({ ok: status === 200 }, { status });
      }
      return Response.json({ error: "not found" }, { status: 404 });
    },
  };
  return fake;
}
