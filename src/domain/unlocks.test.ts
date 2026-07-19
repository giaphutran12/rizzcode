import { describe, expect, it } from "vitest";
import { isScenarioUnlocked, nextScenarioId } from "./unlocks.js";

const ORDER = ["a", "b", "c", "d"];

describe("isScenarioUnlocked", () => {
  it("index 0 is always unlocked", () => {
    expect(isScenarioUnlocked(0, [], ORDER)).toBe(true);
  });

  it("later indexes unlock only when the previous scenario is complete", () => {
    expect(isScenarioUnlocked(1, [], ORDER)).toBe(false);
    expect(isScenarioUnlocked(1, ["a"], ORDER)).toBe(true);
    expect(isScenarioUnlocked(2, ["a"], ORDER)).toBe(false);
    expect(isScenarioUnlocked(2, ["a", "b"], ORDER)).toBe(true);
  });

  it("out-of-range indexes are locked", () => {
    expect(isScenarioUnlocked(4, ["a", "b", "c"], ORDER)).toBe(false);
    expect(isScenarioUnlocked(-1, [], ORDER)).toBe(false);
  });
});

describe("nextScenarioId", () => {
  it("returns the first scenario when nothing is complete", () => {
    expect(nextScenarioId([], ORDER)).toBe("a");
  });

  it("returns the first unlocked-but-incomplete id in order", () => {
    expect(nextScenarioId(["a"], ORDER)).toBe("b");
    expect(nextScenarioId(["a", "b"], ORDER)).toBe("c");
  });

  it("returns null when everything is complete", () => {
    expect(nextScenarioId(["a", "b", "c", "d"], ORDER)).toBeNull();
  });
});
