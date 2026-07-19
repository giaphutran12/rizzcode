/**
 * Browser-side client for the official judge endpoint.
 *
 * The browser sends ONLY the attempt id, scenario id, and the user's own
 * responses. It never sends scores, persona state, gates, outcomes, or XP —
 * the server treats all of those as authoritative-only.
 */
import type { JudgeApiResponse, JudgeRequest } from "../domain/types";

export async function requestJudgment(
  request: JudgeRequest,
  signal?: AbortSignal,
): Promise<JudgeApiResponse> {
  let response: Response;
  try {
    response = await fetch("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    return {
      ok: false,
      retryable: true,
      code: "judge_unavailable",
      message:
        "Could not reach the judge. Your conversation is saved — retry when you are back online.",
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      retryable: true,
      code: "judge_unavailable",
      message: "The judge answered with something unreadable. Retry judgment.",
    };
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "ok" in payload &&
    (payload as { ok: unknown }).ok === true
  ) {
    return payload as JudgeApiResponse;
  }

  const failure = payload as Partial<
    Extract<JudgeApiResponse, { ok: false }>
  >;
  return {
    ok: false,
    retryable: failure.retryable ?? response.status >= 500,
    code: failure.code ?? "judge_unavailable",
    message:
      typeof failure.message === "string"
        ? failure.message
        : "Judgment failed. Your conversation is saved — you can retry.",
  };
}
