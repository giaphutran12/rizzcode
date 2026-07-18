import { describe, expect, it } from "vitest";
import { fixtureJudgeProvider } from "./provider";
import { selectJudgeProvider } from "./route";

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
});
