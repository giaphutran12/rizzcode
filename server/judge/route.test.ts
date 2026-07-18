import { describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/[...path]/route";
import { fixtureJudgeProvider } from "./provider";
import { selectJudgeProvider } from "../runtime";

describe("judge provider selection", () => {
  it("allows the fixture provider only outside production", () => {
    expect(
      selectJudgeProvider(undefined, {
        NODE_ENV: "test",
        RIZZCODE_MOCK_JUDGE: "1",
      }),
    ).toBe(fixtureJudgeProvider);
    expect(
      selectJudgeProvider(undefined, {
        NODE_ENV: "production",
        RIZZCODE_MOCK_JUDGE: "1",
      }),
    ).toBeUndefined();
  });

  it("uses an explicitly injected provider in every environment", () => {
    expect(
      selectJudgeProvider(fixtureJudgeProvider, {
        NODE_ENV: "production",
      }),
    ).toBe(fixtureJudgeProvider);
  });

  it("returns a judge-specific error for malformed JSON", async () => {
    const response = await POST(
      new Request("http://127.0.0.1/api/judge", {
        method: "POST",
        body: "{",
      }),
      { params: Promise.resolve({ path: ["judge"] }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "judge_invalid_output",
    });
  });
});
