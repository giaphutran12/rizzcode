import type {
  Attempt,
  Engagement,
  PersonaReply,
  PersonaState,
  PracticeMessage,
  Scenario,
} from "../domain/types";
import { MAX_RESPONSE_LENGTH } from "../domain/constants";

const engagementOrder: Engagement[] = ["closed", "low", "neutral", "warm"];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesSignal(input: string, signal: string): boolean {
  const normalizedInput = normalize(input);
  const normalizedSignal = normalize(signal);

  if (!normalizedSignal) {
    return false;
  }

  const pattern = new RegExp(
    `(?:^|[^a-z0-9])${escapeRegExp(normalizedSignal)}(?:$|[^a-z0-9])`,
    "i",
  );
  return pattern.test(normalizedInput);
}

export function validateResponse(body: string):
  | { ok: true; body: string }
  | { ok: false; reason: "empty" | "too_long" } {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_RESPONSE_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  return { ok: true, body: trimmed };
}

function hasAnySignal(input: string, signals: string[]): boolean {
  return signals.some((signal) => matchesSignal(input, signal));
}

function moveEngagement(
  current: Engagement,
  direction: "down" | "same" | "up",
): Engagement {
  const index = engagementOrder.indexOf(current);
  if (direction === "up") {
    return engagementOrder[Math.min(index + 1, engagementOrder.length - 1)];
  }
  if (direction === "down") {
    return engagementOrder[Math.max(index - 1, 0)];
  }
  return current;
}

export function replyToUser(input: {
  scenario: Scenario;
  body: string;
  turn: 1 | 2 | 3;
  personaState: PersonaState;
}): PersonaReply {
  const { scenario, body, turn, personaState } = input;
  const { fallback } = scenario;

  let interestChange: PersonaReply["interestChange"] = "same";
  let boundary: PersonaState["boundary"] = personaState.boundary;
  let terminalReason: PersonaReply["terminalReason"] = null;

  if (hasAnySignal(body, fallback.boundarySignals)) {
    interestChange = "down";
    boundary = "explicit";
    terminalReason = "boundary";
  } else if (hasAnySignal(body, fallback.exitSignals)) {
    terminalReason = "user_exit";
  } else if (hasAnySignal(body, fallback.lowInterestSignals)) {
    interestChange = "down";
    boundary = boundary === "none" ? "soft" : boundary;
  } else if (
    hasAnySignal(body, [
      ...fallback.positiveSignals,
      ...scenario.successSignals,
    ])
  ) {
    interestChange = "up";
  }

  const engagement = moveEngagement(
    personaState.engagement,
    interestChange,
  );
  const terminal = terminalReason !== null || turn === 3;
  const reply = fallback.repliesByTurn[turn][engagement];

  return {
    reply,
    state: {
      engagement,
      boundary,
      terminal,
    },
    interestChange,
    terminalReason: terminalReason ?? (turn === 3 ? "completed" : null),
  };
}

export function authoredFallbackReply(input: {
  scenario: Scenario;
  turn: 1 | 2 | 3;
  personaState: PersonaState;
}): PersonaReply {
  const { scenario, turn, personaState } = input;
  const reply = scenario.fallback.repliesByTurn[turn][personaState.engagement];
  return {
    reply,
    state: {
      ...personaState,
      terminal: turn === 3,
    },
    interestChange: "same",
    terminalReason: turn === 3 ? "completed" : null,
  };
}

export async function safePersonaReply(
  input: {
    scenario: Scenario;
    body: string;
    turn: 1 | 2 | 3;
    personaState: PersonaState;
  },
  engine: typeof replyToUser = replyToUser,
): Promise<{ result: PersonaReply; usedFallback: boolean }> {
  try {
    return { result: engine(input), usedFallback: false };
  } catch {
    return {
      result: authoredFallbackReply(input),
      usedFallback: true,
    };
  }
}

function messageId(attemptId: string, speaker: "you" | "her", turn: number) {
  return `${attemptId}:${turn}:${speaker}`;
}

export function createAttempt(
  scenario: Scenario,
  attemptId: string = crypto.randomUUID(),
  now = new Date().toISOString(),
): Attempt {
  const messages: PracticeMessage[] =
    scenario.opening.kind === "persona_message"
      ? [
          {
            id: messageId(attemptId, "her", 0),
            speaker: "her",
            body: scenario.opening.body,
            turn: 0,
            createdAt: now,
          },
        ]
      : [];

  return {
    id: attemptId,
    scenarioId: scenario.id,
    messages,
    userTurn: 0,
    status: "active",
    personaState: { ...scenario.persona.initialState },
    startedAt: now,
  };
}

export function appendTurn(
  attempt: Attempt,
  body: string,
  personaReply: PersonaReply,
  now = new Date().toISOString(),
): Attempt {
  if (
    attempt.status !== "active" &&
    attempt.status !== "awaiting_reply"
  ) {
    return attempt;
  }
  if (attempt.userTurn >= 3) {
    return attempt;
  }

  const turn = (attempt.userTurn + 1) as 1 | 2 | 3;
  return {
    ...attempt,
    messages: [
      ...attempt.messages,
      {
        id: messageId(attempt.id, "you", turn),
        speaker: "you",
        body,
        turn,
        createdAt: now,
      },
      {
        id: messageId(attempt.id, "her", turn),
        speaker: "her",
        body: personaReply.reply,
        turn,
        createdAt: now,
      },
    ],
    userTurn: turn,
    status:
      personaReply.state.terminal || turn === 3
        ? "awaiting_judgment"
        : "active",
    personaState: personaReply.state,
  };
}

export function replayResponses(
  scenario: Scenario,
  responses: Array<{ turn: 1 | 2 | 3; body: string }>,
  attemptId: string,
): Attempt {
  let attempt = createAttempt(scenario, attemptId, "server-replay");

  for (const response of responses) {
    if (response.turn !== attempt.userTurn + 1 || attempt.personaState.terminal) {
      break;
    }
    const reaction = replyToUser({
      scenario,
      body: response.body,
      turn: response.turn,
      personaState: attempt.personaState,
    });
    attempt = appendTurn(attempt, response.body, reaction, "server-replay");
  }

  return attempt;
}

export function userResponses(attempt: Attempt) {
  return attempt.messages
    .filter(
      (message): message is PracticeMessage & { turn: 1 | 2 | 3 } =>
        message.speaker === "you" && message.turn > 0,
    )
    .map(({ turn, body }) => ({ turn, body }));
}
