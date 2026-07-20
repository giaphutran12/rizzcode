import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "./authFetch";
import { requestJudgment } from "./judgeClient";

vi.mock("./authFetch", () => ({
  authenticatedFetch: vi.fn(),
}));

const request = {
  schemaVersion: "1.0" as const,
  attemptId: "attempt-client",
  scenarioId: "RC-001",
  responses: [{ turn: 1 as const, body: "Hello" }],
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("judge client error mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves a typed server timeout instead of hiding it", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      response(
        {
          ok: false,
          retryable: true,
          code: "judge_timeout",
          message: "The judge took too long.",
        },
        503,
      ),
    );

    await expect(requestJudgment(request)).resolves.toMatchObject({
      ok: false,
      code: "judge_timeout",
    });
  });

  it("preserves an in-progress duplicate as a recoverable state", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      response(
        {
          ok: false,
          retryable: true,
          code: "judge_in_progress",
          message: "This judgment is already running.",
        },
        409,
      ),
    );

    await expect(requestJudgment(request)).resolves.toMatchObject({
      ok: false,
      code: "judge_in_progress",
    });
  });

  it("rejects partial success output without creating a score", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      response({ ok: true, result: { attemptId: request.attemptId } }),
    );

    await expect(requestJudgment(request)).resolves.toMatchObject({
      ok: false,
      code: "judge_invalid_output",
    });
  });

  it("maps an unreachable or non-JSON response to unavailable", async () => {
    vi.mocked(authenticatedFetch)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response("upstream error", { status: 502 }));

    await expect(requestJudgment(request)).resolves.toMatchObject({
      ok: false,
      code: "judge_unavailable",
    });
    await expect(requestJudgment(request)).resolves.toMatchObject({
      ok: false,
      code: "judge_unavailable",
    });
  });
});
