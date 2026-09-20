// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeMythos, FAKE_LISTING_ID, type FakeMythos } from "./testing";

const API_URL = "http://fake-mythos.test";
process.env.MYTHOS_API_URL = API_URL;
process.env.MYTHOS_LISTING_ID = FAKE_LISTING_ID;
process.env.RIZZCODE_MOCK_PERSONA = "1";

let fake: FakeMythos;
let handshake: typeof import("../../src/app/api/mythos/handshake/route");
let session: typeof import("../../src/app/api/mythos/session/route");
let reportUsage: typeof import("../../src/app/api/mythos/report-usage/route");
let pass: typeof import("./pass");
let meter: typeof import("./meter");
let api: typeof import("../../src/app/api/[...path]/route");

beforeAll(async () => {
  fake = await createFakeMythos(API_URL);
  vi.stubGlobal("fetch", fake.fetch);
  handshake = await import("../../src/app/api/mythos/handshake/route");
  session = await import("../../src/app/api/mythos/session/route");
  reportUsage = await import("../../src/app/api/mythos/report-usage/route");
  pass = await import("./pass");
  meter = await import("./meter");
  api = await import("../../src/app/api/[...path]/route");
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  fake.consumed.length = 0;
  fake.metered.length = 0;
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

function get(path: string) {
  return new Request(`http://127.0.0.1${path}`);
}

async function launch() {
  const token = await fake.mintLaunchToken();
  const response = await session.GET(get(`/api/mythos/session?lt=${token}`));
  const body = (await response.json()) as {
    pass: string;
    session: { sessionJti: string };
  };
  return { response, body };
}

describe("publish handshake", () => {
  it("rejects a missing token the way the contract expects", async () => {
    const response = await handshake.GET(get("/api/mythos/handshake"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Missing launch token" });
  });

  it("rejects garbage and wrong-purpose tokens", async () => {
    const garbage = await handshake.GET(get("/api/mythos/handshake?lt=nope"));
    expect(garbage.status).toBe(401);
    const wrongPurpose = await fake.mintPurposeToken("listing_registered");
    const replayed = await handshake.GET(
      get(`/api/mythos/handshake?lt=${wrongPurpose}`),
    );
    expect(replayed.status).toBe(401);
  });

  it("answers a real handshake token with ok and the sdk version", async () => {
    const token = await fake.mintHandshakeToken();
    const response = await handshake.GET(get(`/api/mythos/handshake?lt=${token}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });
});

describe("launch session exchange", () => {
  it("consumes the launch token once and issues a signed pass", async () => {
    const { response, body } = await launch();
    expect(response.status).toBe(200);
    expect(fake.consumed).toEqual([body.session.sessionJti]);
    expect(pass.verifyMythosPass(body.pass)).toMatchObject({
      sessionJti: body.session.sessionJti,
      listingId: FAKE_LISTING_ID,
      email: "consumer@example.com",
    });
  });

  it("turns a replayed token into 401, not access", async () => {
    fake.nextConsumeStatus = 409;
    const { response } = await launch();
    expect(response.status).toBe(401);
    expect(fake.consumed).toEqual([]);
  });

  it("refuses a token minted for another listing", async () => {
    const token = await fake.mintLaunchToken({
      aud: "someone-else",
      listingId: "someone-else",
    });
    const response = await session.GET(get(`/api/mythos/session?lt=${token}`));
    expect(response.status).toBe(401);
  });

  it("fails closed when Mythos cannot confirm the consume", async () => {
    fake.nextConsumeStatus = 503;
    const { response } = await launch();
    expect(response.status).toBe(503);
  });
});

describe("usage metering", () => {
  it("charges the launched consumer with an attempt-derived idempotency key", async () => {
    const { body } = await launch();
    const request = new Request("http://127.0.0.1/api/judge", {
      headers: { "x-rizzcode-mythos": body.pass },
    });
    const first = await meter.meterMythosUsage(request, "persona-turn", {
      attemptId: "attempt-1",
      turn: 2,
    });
    const retry = await meter.meterMythosUsage(request, "persona-turn", {
      attemptId: "attempt-1",
      turn: 2,
    });
    expect([first, retry]).toEqual(["charged", "charged"]);
    expect(fake.metered).toHaveLength(2);
    expect(fake.metered[0].jti).toBe(body.session.sessionJti);
    expect(fake.metered[0].body).toMatchObject({
      credits: 1,
      reason: "persona-turn",
      charge_id: "attempt-1:turn:2",
    });
    expect(fake.metered[1].body.charge_id).toBe("attempt-1:turn:2");
  });

  it("does nothing for visitors without a pass and names wallet failures", async () => {
    const plain = new Request("http://127.0.0.1/api/judge");
    expect(
      await meter.meterMythosUsage(plain, "judgment", { attemptId: "a" }),
    ).toBe("not_mythos");
    expect(fake.metered).toHaveLength(0);

    const { body } = await launch();
    const request = new Request("http://127.0.0.1/api/judge", {
      headers: { "x-rizzcode-mythos": body.pass },
    });
    fake.nextMeterStatus = 402;
    expect(
      await meter.meterMythosUsage(request, "judgment", { attemptId: "a" }),
    ).toBe("insufficient_funds");
    fake.nextMeterStatus = 404;
    expect(
      await meter.meterMythosUsage(request, "judgment", { attemptId: "a" }),
    ).toBe("session_not_found");
  });

  it("rejects a forged pass", async () => {
    const { body } = await launch();
    const forged = `${body.pass.slice(0, -4)}AAAA`;
    const request = new Request("http://127.0.0.1/api/judge", {
      headers: { "x-rizzcode-mythos": forged },
    });
    expect(
      await meter.meterMythosUsage(request, "judgment", { attemptId: "a" }),
    ).toBe("not_mythos");
  });

  it("serves the contract's report-usage route only to a pass holder", async () => {
    const unauthenticated = await reportUsage.POST(
      new Request("http://127.0.0.1/api/mythos/report-usage", {
        method: "POST",
        body: JSON.stringify({ credits: 1 }),
      }),
    );
    expect(unauthenticated.status).toBe(401);

    const { body } = await launch();
    const ok = await reportUsage.POST(
      new Request("http://127.0.0.1/api/mythos/report-usage", {
        method: "POST",
        headers: { "x-rizzcode-mythos": body.pass, "content-type": "application/json" },
        body: JSON.stringify({ credits: 2, reason: "client-report" }),
      }),
    );
    expect(ok.status).toBe(200);
    expect(fake.metered.at(-1)?.body).toMatchObject({ credits: 2 });

    const tooMany = await reportUsage.POST(
      new Request("http://127.0.0.1/api/mythos/report-usage", {
        method: "POST",
        headers: { "x-rizzcode-mythos": body.pass, "content-type": "application/json" },
        body: JSON.stringify({ credits: 999 }),
      }),
    );
    expect(tooMany.status).toBe(400);
  });
});

describe("practice API with a launched consumer", () => {
  it("answers the first persona turn and meters it against the wallet", async () => {
    const { body } = await launch();
    const attemptId = `attempt-mythos-${Date.now()}`;
    const response = await api.POST(
      new Request("http://127.0.0.1/api/persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-rizzcode-mythos": body.pass,
        },
        body: JSON.stringify({
          schemaVersion: "1.0",
          attemptId,
          scenarioId: "RC-035",
          turn: 1,
          body: "That ramen tote is elite. Recommendation or warning?",
        }),
      }),
      { params: Promise.resolve({ path: ["persona"] }) },
    );
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(fake.metered.at(-1)).toMatchObject({
      jti: body.session.sessionJti,
      body: { credits: 1, reason: "persona-turn", charge_id: `${attemptId}:turn:1` },
    });
  });
});
