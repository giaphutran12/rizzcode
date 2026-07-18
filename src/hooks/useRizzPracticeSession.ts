import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { requestJudgment as callJudge } from "../api/judgeClient";
import { useRizzCode } from "../context/RizzCodeContext";
import { MAX_RESPONSE_LENGTH } from "../domain/constants";
import type { Attempt, JudgeResult, Scenario } from "../domain/types";
import {
  appendTurn,
  createAttempt,
  safePersonaReply,
  userResponses,
  validateResponse,
} from "../engine/conversationEngine";

type JudgmentReceipt = {
  xpDelta: number;
  isPersonalBest: boolean;
  unlockedAchievements: string[];
};

const personaDelay = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 240));

export function useRizzPracticeSession(scenario: Scenario) {
  const { recordJudgment, saveAttempt } = useRizzCode();
  const [attempt, setAttempt] = useState<Attempt>(() =>
    createAttempt(scenario),
  );
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string>();
  const [fallbackNotice, setFallbackNotice] = useState<string>();
  const [receipt, setReceipt] = useState<JudgmentReceipt>();
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const attemptRef = useRef(attempt);

  useEffect(() => {
    attemptRef.current = attempt;
    saveAttempt(attempt);
  }, [attempt, saveAttempt]);

  const finishJudgment = useCallback(
    async (pendingAttempt: Attempt, operation: number) => {
      const judgingAttempt: Attempt = {
        ...pendingAttempt,
        status: "awaiting_judgment",
        error: undefined,
      };
      setAttempt(judgingAttempt);
      const apiResult = await callJudge({
        schemaVersion: "1.0",
        attemptId: pendingAttempt.id,
        scenarioId: scenario.id,
        responses: userResponses(pendingAttempt),
      });

      if (
        operationRef.current !== operation ||
        attemptRef.current.id !== pendingAttempt.id
      ) {
        busyRef.current = false;
        return;
      }

      if (!apiResult.ok) {
        const errored: Attempt = {
          ...judgingAttempt,
          status: "error",
          error: { code: apiResult.code, message: apiResult.message },
        };
        setAttempt(errored);
        busyRef.current = false;
        return;
      }

      const judgmentReceipt = recordJudgment(pendingAttempt, apiResult.result);
      const complete: Attempt = {
        ...judgingAttempt,
        status: "complete",
        result: apiResult.result,
        xpAwarded: judgmentReceipt.xpDelta,
        isPersonalBest: judgmentReceipt.isPersonalBest,
        completedAt: new Date().toISOString(),
      };
      setReceipt(judgmentReceipt);
      setAttempt(complete);
      busyRef.current = false;
    },
    [recordJudgment, scenario.id],
  );

  const submit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const current = attemptRef.current;
      const validation = validateResponse(input);
      if (busyRef.current || current.status !== "active") return;
      if (!validation.ok && validation.reason === "empty") {
        setInputError("Give the moment one real line before sending.");
        return;
      }
      if (!validation.ok) {
        setInputError(`Keep it under ${MAX_RESPONSE_LENGTH} characters.`);
        return;
      }
      const body = validation.body;
      if (current.userTurn >= 3) return;

      busyRef.current = true;
      const operation = ++operationRef.current;
      const turn = (current.userTurn + 1) as 1 | 2 | 3;
      setInput("");
      setInputError(undefined);
      setAttempt({ ...current, status: "awaiting_reply" });

      await personaDelay();
      if (
        operationRef.current !== operation ||
        attemptRef.current.id !== current.id
      ) {
        busyRef.current = false;
        return;
      }

      const reaction = await safePersonaReply({
        scenario,
        body,
        turn,
        personaState: current.personaState,
      });
      if (reaction.usedFallback) {
        setFallbackNotice(
          "The live reaction hiccupped, so this scenario used its authored fallback.",
        );
      }
      const next = appendTurn(current, body, reaction.result);
      setAttempt(next);

      if (next.status === "awaiting_judgment") {
        await finishJudgment(next, operation);
      } else {
        busyRef.current = false;
      }
    },
    [finishJudgment, input, scenario],
  );

  const retryJudgment = useCallback(async () => {
    const current = attemptRef.current;
    if (
      busyRef.current ||
      (current.status !== "error" &&
        current.status !== "awaiting_judgment")
    ) {
      return;
    }
    busyRef.current = true;
    const operation = ++operationRef.current;
    await finishJudgment(current, operation);
  }, [finishJudgment]);

  const reset = useCallback(() => {
    operationRef.current += 1;
    busyRef.current = false;
    const next = createAttempt(scenario);
    attemptRef.current = next;
    setAttempt(next);
    setInput("");
    setInputError(undefined);
    setFallbackNotice(undefined);
    setReceipt(undefined);
  }, [scenario]);

  return {
    attempt,
    input,
    inputError,
    fallbackNotice,
    receipt,
    setInput,
    submit,
    retryJudgment,
    reset,
    isBusy:
      attempt.status === "awaiting_reply" ||
      attempt.status === "awaiting_judgment",
  };
}

export function completedJudgment(attempt: Attempt): JudgeResult | undefined {
  return attempt.status === "complete" ? attempt.result : undefined;
}
