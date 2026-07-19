/**
 * Canonical deterministic persona engine.
 *
 * Pure functions only: no randomness, no I/O, no dates. The browser client and
 * the judge server both import this module so the same user responses always
 * replay to the same transcript (see docs/RIZZCODE_MASTER_PLAN.md, "Persona
 * engine").
 */

import {
  ENGAGEMENT_ORDER,
  type PersonaReply,
  type PersonaState,
  type Scenario,
} from "./types.js";

/**
 * Lowercase, strip punctuation to spaces (apostrophes inside words survive),
 * collapse whitespace, trim.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/(^|\s)'/g, "$1")
    .replace(/'(\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word / whole-phrase match only. A signal never matches a substring
 * fragment inside an unrelated word ("gym" does not match "gymnasium"), and a
 * multi-word signal matches only as a word-bounded phrase ("let you go").
 *
 * `userText` is expected to be normalized already (normalizing twice is a
 * no-op, so raw text is also safe). Returns the matched signal as authored,
 * or null.
 */
export function matchesSignal(
  userText: string,
  signals: string[],
): string | null {
  const normalized = normalizeText(userText);
  for (const signal of signals) {
    const needle = normalizeText(signal);
    if (needle === "") continue;
    const pattern = new RegExp(
      `(^|[^a-z0-9'])${escapeRegExp(needle)}(?![a-z0-9'])`,
    );
    if (pattern.test(normalized)) return signal;
  }
  return null;
}

function engagementUp(engagement: PersonaState["engagement"]) {
  const index = ENGAGEMENT_ORDER.indexOf(engagement);
  return ENGAGEMENT_ORDER[Math.min(index + 1, ENGAGEMENT_ORDER.length - 1)];
}

function engagementDown(engagement: PersonaState["engagement"]) {
  const index = ENGAGEMENT_ORDER.indexOf(engagement);
  return ENGAGEMENT_ORDER[Math.max(index - 1, 0)];
}

/**
 * Produce the persona's reaction to one user response.
 *
 * Locked deterministic branch order:
 *   1. Boundary signal       -> terminal boundary violation
 *   2. User exit signal      -> one polite closing reply, terminal
 *   3. Low-interest signal   -> engagement down one level (persona exits if
 *                               she was already low and drops to closed)
 *   4. Positive signal       -> engagement up one level (capped at warm)
 *   5. No signal             -> engagement unchanged
 *
 * Prompt-injection text is ordinary dialogue: it only ever matters if it
 * happens to match one of the authored scenario signal lists.
 */
export function getPersonaReply(input: {
  scenario: Scenario;
  userText: string;
  personaState: PersonaState;
  turn: 1 | 2 | 3;
}): PersonaReply {
  const { scenario, userText, personaState, turn } = input;
  const { fallback } = scenario;
  const replies = fallback.repliesByTurn[turn];
  const normalized = normalizeText(userText);

  // 1. Boundary signal: the exchange ends immediately on an explicit boundary.
  if (matchesSignal(normalized, fallback.boundarySignals)) {
    return {
      reply: replies.closed,
      state: { engagement: "closed", boundary: "explicit", terminal: true },
      interestChange: "down",
      terminalReason: "boundary",
    };
  }

  // 2. User exit signal: one polite closing reply at the current engagement.
  if (matchesSignal(normalized, fallback.exitSignals)) {
    return {
      reply: replies[personaState.engagement],
      state: { ...personaState, terminal: true },
      interestChange: "same",
      terminalReason: "user_exit",
    };
  }

  // 3. Low-interest signal: engagement drops one level, never below closed.
  if (matchesSignal(normalized, fallback.lowInterestSignals)) {
    const newEngagement = engagementDown(personaState.engagement);
    if (personaState.engagement === "low" && newEngagement === "closed") {
      return {
        reply: replies.closed,
        state: {
          engagement: "closed",
          boundary: personaState.boundary,
          terminal: true,
        },
        interestChange: "down",
        terminalReason: "persona_exit",
      };
    }
    return {
      reply: replies[newEngagement],
      state: { ...personaState, engagement: newEngagement },
      interestChange: "down",
      terminalReason: null,
    };
  }

  // 4. Positive signal: engagement rises one level, capped at warm.
  if (matchesSignal(normalized, fallback.positiveSignals)) {
    const newEngagement = engagementUp(personaState.engagement);
    return {
      reply: replies[newEngagement],
      state: { ...personaState, engagement: newEngagement },
      interestChange:
        newEngagement === personaState.engagement ? "same" : "up",
      terminalReason: null,
    };
  }

  // 5. No signal: nothing changes.
  return {
    reply: replies[personaState.engagement],
    state: { ...personaState },
    interestChange: "same",
    terminalReason: null,
  };
}

/**
 * An attempt is over when the persona reply is terminal (boundary, user exit,
 * or persona exit) or when the third user turn has been answered.
 */
export function isAttemptOver(
  reply: PersonaReply,
  turn: number,
): {
  over: boolean;
  reason: "completed" | "persona_exit" | "user_exit" | "boundary" | null;
} {
  if (reply.state.terminal) {
    return { over: true, reason: reply.terminalReason ?? "completed" };
  }
  if (turn === 3) {
    return { over: true, reason: "completed" };
  }
  return { over: false, reason: null };
}
