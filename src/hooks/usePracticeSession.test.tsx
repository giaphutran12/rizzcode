/**
 * State-machine tests for usePracticeSession, covering acceptance fixtures
 * 1-7 from docs/RIZZCODE_MASTER_PLAN.md plus judge failure/retry, reset
 * mid-reply, and graceful early exit.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePracticeSession, type PracticeSession } from "./usePracticeSession";
import {
  makeJudgeResult,
  okJudge,
  waitForPersonaReply,
} from "../test/testUtils";
import {
  MAX_RESPONSE_LENGTH,
  type Attempt,
  type JudgeApiResponse,
} from "../domain/types";

const BUS_STOP = "spark-bus-stop-opener";
const TEXT_AFTER_MEETING = "spark-text-after-meeting";

const BUS_STOP_TEXTS = [
  "ha, the 18 delayed again? i think it has a personal grudge",
  "fair enough — i noticed the library book. what are you reading?",
  "guilty. honestly the best delayed-bus conversation i have had",
];

type HookResult = { current: PracticeSession | null };

function session(result: HookResult): PracticeSession {
  if (!result.current) throw new Error("Expected a practice session");
  return result.current;
}

function herMessages(result: HookResult) {
  return session(result).attempt.messages.filter((m) => m.speaker === "her");
}

function youMessages(result: HookResult) {
  return session(result).attempt.messages.filter((m) => m.speaker === "you");
}

function renderSession(
  scenarioId: string,
  judge: (attempt: Attempt) => Promise<JudgeApiResponse> = okJudge(),
) {
  return renderHook(() =>
    usePracticeSession(scenarioId, { replyDelayMs: 0, judge }),
  );
}

function typeText(result: HookResult, text: string) {
  act(() => session(result).setInput(text));
}

function submitNow(result: HookResult) {
  act(() => session(result).submit());
}

describe("usePracticeSession", () => {
  it("starts a scene-only in-person scenario at turn 0 with no invented message from her", () => {
    const { result } = renderSession(BUS_STOP);

    expect(session(result).scenario.id).toBe(BUS_STOP);
    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).attempt.status).toBe("active");
    expect(session(result).attempt.messages).toHaveLength(0);
    expect(herMessages(result)).toHaveLength(0);
  });

  it("starts a messaging scenario with her opening message visible at turn 0", () => {
    const { result } = renderSession(TEXT_AFTER_MEETING);

    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).attempt.messages).toHaveLength(1);
    expect(session(result).attempt.messages[0]).toMatchObject({
      speaker: "her",
      body: "That demo was chaotic, but I kind of loved it.",
      turn: 0,
    });
  });

  it("completes a normal attempt after exactly three valid submissions", async () => {
    const judgeResult = makeJudgeResult(BUS_STOP_TEXTS);
    let resolveJudge: (response: JudgeApiResponse) => void = () => {};
    const judge = vi.fn(
      (_attempt: Attempt) =>
        new Promise<JudgeApiResponse>((resolve) => {
          resolveJudge = resolve;
        }),
    );
    const { result } = renderSession(BUS_STOP, judge);

    for (const [index, text] of BUS_STOP_TEXTS.entries()) {
      typeText(result, text);
      submitNow(result);

      // Immediately after submit the attempt awaits her reply.
      expect(session(result).attempt.status).toBe("awaiting_reply");
      expect(session(result).isSubmitting).toBe(true);

      await waitForPersonaReply(() =>
        expect(herMessages(result)).toHaveLength(index + 1),
      );
      expect(session(result).attempt.userTurn).toBe(index + 1);

      if (index < 2) {
        expect(session(result).attempt.status).toBe("active");
      }
    }

    // Her third reply ends the attempt; the judge now owns it.
    await waitFor(() =>
      expect(session(result).attempt.status).toBe("awaiting_judgment"),
    );
    expect(session(result).isJudging).toBe(true);
    expect(judge).toHaveBeenCalledTimes(1);
    const judgedAttempt = judge.mock.calls[0][0];
    expect(
      judgedAttempt.messages
        .filter((m) => m.speaker === "you")
        .map((m) => m.body),
    ).toEqual(BUS_STOP_TEXTS);

    await act(async () => {
      resolveJudge({ ok: true, result: judgeResult });
    });
    await waitFor(() =>
      expect(session(result).attempt.status).toBe("complete"),
    );
    expect(session(result).attempt.result).toEqual(judgeResult);
    expect(session(result).attempt.userTurn).toBe(3);
    expect(session(result).attempt.messages).toHaveLength(6);
    expect(session(result).judgeFailure).toBeNull();
  });

  it("ignores a fourth submission after the attempt is complete", async () => {
    const judge = vi.fn(okJudge());
    const { result } = renderSession(BUS_STOP, judge);

    for (const [index, text] of BUS_STOP_TEXTS.entries()) {
      typeText(result, text);
      submitNow(result);
      await waitForPersonaReply(() =>
        expect(herMessages(result)).toHaveLength(index + 1),
      );
    }
    await waitFor(() =>
      expect(session(result).attempt.status).toBe("complete"),
    );

    const completedMessages = session(result).attempt.messages;
    const completedResult = session(result).attempt.result;

    typeText(result, "one more for the road");
    submitNow(result);

    expect(session(result).attempt.messages).toEqual(completedMessages);
    expect(session(result).attempt.userTurn).toBe(3);
    expect(session(result).attempt.status).toBe("complete");
    expect(session(result).attempt.result).toBe(completedResult);
    expect(judge).toHaveBeenCalledTimes(1);
  });

  it("does not advance the turn for empty, whitespace-only, or 421-character input", () => {
    const judge = vi.fn(okJudge());
    const { result } = renderSession(BUS_STOP, judge);

    typeText(result, "");
    submitNow(result);
    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).inputError).toBeNull();

    typeText(result, "   \n\t  ");
    submitNow(result);
    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).inputError).toBeNull();

    typeText(result, "x".repeat(MAX_RESPONSE_LENGTH + 1));
    submitNow(result);
    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).attempt.messages).toHaveLength(0);
    expect(session(result).inputError).toContain(String(MAX_RESPONSE_LENGTH));

    expect(judge).not.toHaveBeenCalled();
  });

  it("records exactly one user message and one persona reply on a double submit", async () => {
    const { result } = renderSession(BUS_STOP);

    typeText(result, "ha, the 18 delayed again?");
    act(() => {
      session(result).submit();
      session(result).submit();
    });

    await waitForPersonaReply(() =>
      expect(herMessages(result)).toHaveLength(1),
    );
    expect(youMessages(result)).toHaveLength(1);
    expect(session(result).attempt.userTurn).toBe(1);
    expect(session(result).attempt.messages).toHaveLength(2);
  });

  it("raises persona engagement when a response hits a scenario positive signal", async () => {
    const { result } = renderSession(BUS_STOP);
    expect(session(result).personaState.engagement).toBe("neutral");

    typeText(result, "ha! the 18 delayed again — i noticed the sky betrayal too");
    submitNow(result);

    await waitForPersonaReply(() =>
      expect(herMessages(result)).toHaveLength(1),
    );
    expect(session(result).personaState.engagement).toBe("warm");
  });

  it("lowers persona engagement when a response hits a low-interest signal", async () => {
    const { result } = renderSession(BUS_STOP);
    expect(session(result).personaState.engagement).toBe("neutral");

    typeText(result, "hey");
    submitNow(result);

    await waitForPersonaReply(() =>
      expect(herMessages(result)).toHaveLength(1),
    );
    expect(session(result).personaState.engagement).toBe("low");
  });

  it("surfaces a judge failure, preserves the transcript, and completes on retry", async () => {
    const judgeResult = makeJudgeResult(BUS_STOP_TEXTS);
    let calls = 0;
    const judge = vi.fn((_attempt: Attempt): Promise<JudgeApiResponse> => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve({
          ok: false,
          retryable: true,
          code: "judge_unavailable",
          message: "The judge is unreachable.",
        });
      }
      return Promise.resolve({ ok: true, result: judgeResult });
    });
    const { result } = renderSession(BUS_STOP, judge);

    for (const [index, text] of BUS_STOP_TEXTS.entries()) {
      typeText(result, text);
      submitNow(result);
      await waitForPersonaReply(() =>
        expect(herMessages(result)).toHaveLength(index + 1),
      );
    }

    await waitFor(() =>
      expect(session(result).attempt.status).toBe("error"),
    );
    expect(session(result).judgeFailure).toMatchObject({
      ok: false,
      retryable: true,
      code: "judge_unavailable",
      message: "The judge is unreachable.",
    });
    // Transcript preserved, no result yet.
    expect(session(result).attempt.messages).toHaveLength(6);
    expect(session(result).attempt.result).toBeUndefined();

    act(() => session(result).retryJudgment());
    expect(session(result).attempt.status).toBe("awaiting_judgment");
    expect(session(result).judgeFailure).toBeNull();

    await waitFor(() =>
      expect(session(result).attempt.status).toBe("complete"),
    );
    expect(session(result).attempt.result).toEqual(judgeResult);
    expect(judge).toHaveBeenCalledTimes(2);
  });

  it("reset mid-reply discards the stale persona reply and starts a fresh attempt", async () => {
    const { result } = renderSession(BUS_STOP);
    const originalId = session(result).attempt.id;

    typeText(result, "ha, the 18 delayed again?");
    act(() => {
      session(result).submit();
      session(result).reset();
    });

    expect(session(result).attempt.id).not.toBe(originalId);
    expect(session(result).attempt.messages).toHaveLength(0);
    expect(session(result).attempt.userTurn).toBe(0);
    expect(session(result).attempt.status).toBe("active");

    // Let any stray timer fire: nothing may land on the fresh attempt.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    expect(session(result).attempt.messages).toHaveLength(0);
    expect(session(result).attempt.status).toBe("active");
  });

  it("ends the attempt early on an exit signal and still triggers judgment", async () => {
    const texts = [
      "ha, the 18 delayed again?",
      "no worries, take care — hope it shows up soon",
    ];
    const judgeResult = makeJudgeResult(texts, { outcomeCode: "graceful_exit" });
    const judge = vi.fn(okJudge(judgeResult));
    const { result } = renderSession(BUS_STOP, judge);

    typeText(result, texts[0]);
    submitNow(result);
    await waitForPersonaReply(() =>
      expect(herMessages(result)).toHaveLength(1),
    );

    typeText(result, texts[1]);
    submitNow(result);

    await waitFor(
      () => expect(session(result).attempt.status).toBe("complete"),
      { timeout: 2000 },
    );
    expect(session(result).attempt.userTurn).toBe(2);
    expect(session(result).personaState.terminal).toBe(true);
    expect(session(result).attempt.result?.outcome.code).toBe("graceful_exit");
    expect(judge).toHaveBeenCalledTimes(1);
    const judgedAttempt = judge.mock.calls[0][0];
    expect(
      judgedAttempt.messages.filter((m) => m.speaker === "you"),
    ).toHaveLength(2);
  });
});
