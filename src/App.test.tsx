import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { App } from "./App";
import { useFreshStorage } from "./test/testUtils";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    matchMedia: vi.fn(() => ({ add: vi.fn(), revert: vi.fn() })),
    utils: { toArray: vi.fn(() => []) },
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn() },
}));

useFreshStorage();

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the landing hero heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Practice courage\./ }),
    ).toBeInTheDocument();
  });

  it("renders the curriculum heading on /practice", () => {
    window.history.pushState({}, "", "/practice");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Ten situations\./ }),
    ).toBeInTheDocument();
  });

  it("renders the leaderboard on /leaderboard", () => {
    window.history.pushState({}, "", "/leaderboard");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Practice XP, ranked\./ }),
    ).toBeInTheDocument();
  });

  it("renders the 404 view for an unknown route", () => {
    window.history.pushState({}, "", "/definitely-not-a-route");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /This page left the conversation early\./,
      }),
    ).toBeInTheDocument();
  });
});
