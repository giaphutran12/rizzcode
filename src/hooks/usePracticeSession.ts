import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getScenarioById } from "../data/scenarios";
import { getPersonaReply, isAttemptOver } from "../domain/personaEngine";
import { requestJudgment } from "../client/judgeClient";
import {
  MAX_RESPONSE_LENGTH,
  USER_TURNS_PER_ATTEMPT,
  type Attempt,
  type JudgeApiResponse,
  type PersonaState,
  type PracticeMessage,
  type Scenario,
} from "../domain/types";

export type JudgeFailure = Extract<JudgeApiResponse, { ok: false }>;

export interface PracticeSession {
  scenario: Scenario;
  attempt: Attempt;
  personaState: PersonaState;
  input: string;
  inputError: string | null;
  judgeFailure: JudgeFailure | null;
  isSubmitting: boolean;
  isJudging: boolean;
  setInput: (value: string) => void;
  submit: () => void;
  retryJudgment: () => void;
  reset: () => void;
}

function createAttempt(scenario: Scenario): Attempt {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const messages: PracticeMessage[] = [];
  if (scenario.opening.kind === "persona_message") {
    messages.push({
      id: `${id}-opening`,
      speaker: "her",
      body: scenario.opening.body,
      turn: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    id,
    scenarioId: scenario.id,
    messages,
    userTurn: 0,
    status: "active",
    startedAt: new Date().toISOString(),
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PracticeSessionOptions {
  /** Simulated thinking time before her reply. Tests pass 0. */
  replyDelayMs?: number;
  /** Override the judge call. Tests inject fakes here. */
  judge?: (
    attempt: Attempt,
  ) => Promise<JudgeApiResponse>;
}

export function usePracticeSession(
  scenarioId: string,
  options: PracticeSessionOptions = {},
): PracticeSession | null {
  const scenario = useMemo(() => getScenarioById(scenarioId), [scenarioId]);
  const replyDelayMs = options.replyDelayMs ?? 650;

  const [attempt, setAttempt] = useState<Attempt | null>(() =>
    scenario ? createAttempt(scenario) : null,
  );
  const [personaState, setPersonaState] = useState<PersonaState | null>(
    () => (scenario ? scenario.persona.initialState : null),
  );
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [judgeFailure, setJudgeFailure] = useState<JudgeFailure | null>(null);

  // Guards against double-submit and stale async completions after reset.
  const turnLockRef = useRef(false);
  const liveAttemptRef = useRef<string | null>(attempt?.id ?? null);
  const judgeAbortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPending = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current = [];
    judgeAbortRef.current?.abort();
    judgeAbortRef.current = null;
    turnLockRef.current = false;
  }, []);

  useEffect(() => clearPending, [clearPending]);

  const runJudgment = useCallback(
    (judgedAttempt: Attempt) => {
      const attemptId = judgedAttempt.id;
      const responses = judgedAttempt.messages
        .filter((message) => message.speaker === "you")
        .map((message) => ({
          turn: message.turn as 1 | 2 | 3,
          body: message.body,
        }));

      const abort = new AbortController();
      judgeAbortRef.current = abort;

      const call = options.judge
        ? options.judge(judgedAttempt)
        : requestJudgment(
            {
              schemaVersion: "1.0",
              attemptId,
              scenarioId: judgedAttempt.scenarioId,
              responses,
            },
            abort.signal,
          );

      void call.then((outcome) => {
        if (liveAttemptRef.current !== attemptId) return; // stale attempt
        if (outcome.ok) {
          setAttempt((current) =>
            current && current.id === attemptId
              ? {
                  ...current,
                  status: "complete",
                  result: outcome.result,
                  completedAt: new Date().toISOString(),
                }
              : current,
          );
          setJudgeFailure(null);
        } else {
          setAttempt((current) =>
            current && current.id === attemptId
              ? { ...current, status: "error" }
              : current,
          );
          setJudgeFailure(outcome);
        }
      });
    },
    [options.judge],
  );

  const submit = useCallback(() => {
    if (!scenario) return;

    const body = input.trim();
    if (body.length === 0) {
      setInputError(null);
      return; // empty input never advances state
    }
    if (body.length > MAX_RESPONSE_LENGTH) {
      setInputError(
        `Keep it under ${MAX_RESPONSE_LENGTH} characters — say it like you would out loud.`,
      );
      return; // too-long input never advances state
    }
    setInputError(null);

    setAttempt((current) => {
      if (!current || current.status !== "active") return current;
      if (turnLockRef.current) return current; // double-submit guard
      turnLockRef.current = true;

      const turn = (current.userTurn + 1) as 1 | 2 | 3;
      const attemptId = current.id;
      const youMessage: PracticeMessage = {
        id: `${attemptId}-you-${turn}`,
        speaker: "you",
        body,
        turn,
        createdAt: new Date().toISOString(),
      };

      const withUser: Attempt = {
        ...current,
        messages: [...current.messages, youMessage],
        userTurn: turn,
        status: "awaiting_reply",
      };

      const stateBefore = personaState ?? scenario.persona.initialState;
      const timer = setTimeout(() => {
        // Discard the reply if the attempt was reset meanwhile.
        if (liveAttemptRef.current !== attemptId) return;

        const reply = getPersonaReply({
          scenario,
          userText: body,
          personaState: stateBefore,
          turn,
        });

        const herMessage: PracticeMessage = {
          id: `${attemptId}-her-${turn}`,
          speaker: "her",
          body: reply.reply,
          turn,
          createdAt: new Date().toISOString(),
        };

        setPersonaState(reply.state);
        turnLockRef.current = false;

        const over = isAttemptOver(reply, turn);
        const finalAttempt: Attempt = {
          ...withUser,
          messages: [...withUser.messages, herMessage],
          status: over.over ? "awaiting_judgment" : "active",
        };

        if (over.over) {
          setAttempt(finalAttempt);
          runJudgment(finalAttempt);
        } else {
          setAttempt(finalAttempt);
        }
      }, replyDelayMs);
      timersRef.current.push(timer);

      setInput("");
      return withUser;
    });
  }, [input, personaState, replyDelayMs, runJudgment, scenario]);

  const retryJudgment = useCallback(() => {
    setAttempt((current) => {
      if (!current || current.status !== "error") return current;
      const pending: Attempt = { ...current, status: "awaiting_judgment" };
      setJudgeFailure(null);
      runJudgment(pending);
      return pending;
    });
  }, [runJudgment]);

  const reset = useCallback(() => {
    if (!scenario) return;
    clearPending();
    const fresh = createAttempt(scenario);
    liveAttemptRef.current = fresh.id;
    setAttempt(fresh);
    setPersonaState(scenario.persona.initialState);
    setInput("");
    setInputError(null);
    setJudgeFailure(null);
  }, [clearPending, scenario]);

  const session = useMemo<PracticeSession | null>(() => {
    if (!scenario || !attempt || !personaState) return null;
    return {
      scenario,
      attempt,
      personaState,
      input,
      inputError,
      judgeFailure,
      isSubmitting: attempt.status === "awaiting_reply",
      isJudging: attempt.status === "awaiting_judgment",
      setInput: (value: string) => {
        setInput(value);
        if (value.trim().length <= MAX_RESPONSE_LENGTH) setInputError(null);
      },
      submit,
      retryJudgment,
      reset,
    };
  }, [
    scenario,
    attempt,
    personaState,
    input,
    inputError,
    judgeFailure,
    submit,
    retryJudgment,
    reset,
  ]);

  void USER_TURNS_PER_ATTEMPT; // documented constant; the state machine enforces it
  return session;
}
