import { describe, expect, it } from "vitest";
import { fixturePersonaProvider } from "./provider";
import { selectPersonaProvider } from "../runtime";
import { POST } from "../../src/app/api/[...path]/route";

describe("persona provider selection", () => {
  it("allows the fixture provider only outside production", () => {
    expect(
      selectPersonaProvider(undefined, {
        NODE_ENV: "test",
        RIZZCODE_MOCK_PERSONA: "1",
      }),
    ).toBe(fixturePersonaProvider);
    expect(
      selectPersonaProvider(undefined, {
        NODE_ENV: "production",
        RIZZCODE_MOCK_PERSONA: "1",
      }),
    ).toBeUndefined();
  });

  it("uses an explicitly injected provider in every environment", () => {
    expect(
      selectPersonaProvider(fixturePersonaProvider, {
        NODE_ENV: "production",
      }),
    ).toBe(fixturePersonaProvider);
  });

  it("keeps prepared persona text out of the browser response", async () => {
    const response = await POST(
      new Request("http://127.0.0.1/api/persona/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          attemptId: "attempt-route-prepare",
          scenarioId: "connection-keep-thread",
          turn: 1,
          body: "What happened next?",
        }),
      }),
      { params: Promise.resolve({ path: ["persona", "prepare"] }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, prepared: true });
    expect(payload).not.toHaveProperty("reply");
  });
});
