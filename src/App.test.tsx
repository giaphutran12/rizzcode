import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

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

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the RizzCode hero", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Practice courage\./ }),
    ).toBeInTheDocument();
  });
});
