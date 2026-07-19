import { describe, expect, it } from "vitest";
import { levelFor, masteryXPFor, xpDeltaFor } from "./xp.js";

describe("masteryXPFor", () => {
  it("is finalScore * 10 plus the difficulty bonus", () => {
    expect(masteryXPFor(8, "easy")).toBe(80);
    expect(masteryXPFor(8, "medium")).toBe(90);
    expect(masteryXPFor(8, "hard")).toBe(100);
    expect(masteryXPFor(0, "hard")).toBe(20);
  });
});

describe("xpDeltaFor", () => {
  it("first valid completion adds mastery plus a +10 bonus", () => {
    expect(
      xpDeltaFor({
        finalScore: 8,
        difficulty: "easy",
        previousBestMasteryXP: undefined,
        stopViolation: false,
      }),
    ).toEqual({ masteryXP: 80, publicXPDelta: 90 });
  });

  it("awards only the improvement beyond the previous best", () => {
    expect(
      xpDeltaFor({
        finalScore: 8,
        difficulty: "medium",
        previousBestMasteryXP: 80,
        stopViolation: false,
      }),
    ).toEqual({ masteryXP: 90, publicXPDelta: 10 });
  });

  it("a retry below the previous best awards 0", () => {
    expect(
      xpDeltaFor({
        finalScore: 5,
        difficulty: "medium",
        previousBestMasteryXP: 90,
        stopViolation: false,
      }),
    ).toEqual({ masteryXP: 60, publicXPDelta: 0 });
  });

  it("stop violations award 0 mastery and 0 delta", () => {
    expect(
      xpDeltaFor({
        finalScore: 10,
        difficulty: "hard",
        previousBestMasteryXP: undefined,
        stopViolation: true,
      }),
    ).toEqual({ masteryXP: 0, publicXPDelta: 0 });
  });
});

describe("levelFor", () => {
  it("is floor(xp / 250) + 1", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(249)).toBe(1);
    expect(levelFor(250)).toBe(2);
    expect(levelFor(500)).toBe(3);
  });
});
