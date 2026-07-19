/**
 * Deterministic hard-gate detection, run before LLM scoring.
 *
 * Gates are pure pattern matching over the user's responses plus context from
 * the persona transcript (see docs/RIZZCODE_MASTER_PLAN.md, "Hard gates").
 * Stop-level violations cap the score at 2; cap-level violations cap it at 4.
 * Every triggered gate carries the exact substring of the offending user turn
 * so the judge contract's evidence rule can be validated downstream.
 */

import { matchesSignal, normalizeText } from "./personaEngine.js";
import type {
  Evidence,
  HardGateFinding,
  PersonaState,
  Scenario,
} from "./types.js";

export const STOP_GATE_CODES = [
  "threat_coercion",
  "sexual_pressure",
  "doxxing",
  "solicitation_after_refusal",
  "slurs_abuse",
] as const;

export const CAP_GATE_CODES = [
  "insult_negging",
  "material_deception",
  "fabricated_familiarity",
  "unobservable_facts",
  "demanding_after_low_interest",
  "repeated_soft_boundary_push",
] as const;

export type StopGateCode = (typeof STOP_GATE_CODES)[number];
export type CapGateCode = (typeof CAP_GATE_CODES)[number];
export type HardGateCode = StopGateCode | CapGateCode;

const STOP_CODE_SET: ReadonlySet<string> = new Set(STOP_GATE_CODES);

// ---------------------------------------------------------------------------
// Phrase lists. Matching is whole-word / whole-phrase via matchesSignal, so
// "busy" never matches "business" and multi-word phrases stay word-bounded.
// ---------------------------------------------------------------------------

const THREAT_PATTERNS = [
  "or else",
  "i will find you",
  "i'll find you",
  "i will hurt you",
  "i'll hurt you",
  "i will kill you",
  "i'll kill you",
  "i will make you",
  "i'll make you",
  "watch your back",
  "you will regret this",
  "you'll regret this",
  "you're going to regret",
];

// Directed propositions / pressure aimed at her ONLY. Benign mentions of
// faith, values, or the user's own sexual boundaries ("i'm waiting until
// marriage", "i don't hook up") must never appear here or match these.
const SEXUAL_PRESSURE_PATTERNS = [
  "send pics",
  "send me pics",
  "send a pic",
  "send me a pic",
  "send nudes",
  "send me nudes",
  "come over",
  "come to my place",
  "netflix and chill",
  "let's hook up",
  "lets hook up",
  "wanna hook up",
  "want to hook up",
  "sleep with me",
  "have sex with me",
  "let's have sex",
  "wanna have sex",
  "want to have sex",
  "sit on my face",
];

const DOXXING_PATTERNS = [
  "i found your address",
  "i know your address",
  "your address is",
  "i looked up your address",
  "i know where you live",
  "i found where you live",
  "i know where you stay",
];

// Severe slurs and dehumanizing terms. Deliberately small and deliberate.
const SLUR_PATTERNS = [
  "slut",
  "whore",
  "cunt",
  "hoe",
  "bitch",
  "femoid",
  "subhuman",
];

const NEGGING_PATTERNS = [
  "you'd be pretty if",
  "you would be pretty if",
  "you'd be cute if",
  "you would be cute if",
  "not like other girls",
  "not like the other girls",
  "you're a 6",
  "youre a 6",
  "you're a six",
  "fat",
  "ugly",
];

const MATERIAL_DECEPTION_PATTERNS = [
  "i'm a surgeon",
  "im a surgeon",
  "i am a surgeon",
  "i'm a doctor",
  "im a doctor",
  "i'm a ceo",
  "im a ceo",
  "i'm a millionaire",
  "im a millionaire",
  "i make 500k",
  "i make six figures",
  "i own a yacht",
  "i own a mansion",
  "i own a lambo",
  "i own a lamborghini",
];

const FABRICATED_FAMILIARITY_PATTERNS = [
  "remember when we",
  "when we dated",
  "we used to date",
  "like i told you last week",
  "as i told you last week",
  "like i said last week",
  "like i said last time",
];

const UNOBSERVABLE_FACT_PATTERNS = [
  "i saw your instagram",
  "i saw your insta",
  "i saw your profile",
  "your profile says",
  "everyone says you",
  "everyone says that you",
  "people say you",
  "i heard that you",
  "i heard you're",
];

// Contact/date asks (polite or not). Used by solicitation_after_refusal and
// repeated_soft_boundary_push.
const ASK_PATTERNS = [
  "give me your number",
  "let me get your number",
  "can i get your number",
  "can i have your number",
  "could i get your number",
  "could i have your number",
  "send me your number",
  "text me your number",
  "get your instagram",
  "get your insta",
  "go out with me",
  "go on a date",
  "let me take you out",
  "can i take you out",
  "grab coffee with me",
  "grab dinner with me",
  "meet up with me",
  "you have to go out with me",
];

// Imperative demands. Used by demanding_after_low_interest.
const DEMAND_PATTERNS = [
  "give me your number",
  "give me your instagram",
  "give me your insta",
  "let me get your number",
  "you have to go out with me",
  "you have to give me",
];

const EXPLICIT_REFUSAL_PATTERNS = [
  "not interested",
  "please stop",
  "leave me alone",
  "no thanks",
  "don't text me",
  "dont text me",
];

const SOFT_REFUSAL_PATTERNS = [
  "busy",
  "not sure",
  "maybe another time",
  "i don't know",
  "i dont know",
];

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Locate the exact, original-case substring of `body` that corresponds to a
 * phrase already matched on the normalized text. Returns null when the phrase
 * cannot be re-located (defensive; callers skip the finding in that case so
 * emitted excerpts are always true substrings).
 */
export function findExactExcerpt(body: string, phrase: string): string | null {
  const needle = normalizeText(phrase);
  if (needle === "") return null;
  const flexible = needle
    .split(" ")
    .map(escapeRegExp)
    .join("[^a-z0-9']+");
  const pattern = new RegExp(`(^|[^a-z0-9'])(${flexible})(?![a-z0-9'])`, "i");
  const match = pattern.exec(body);
  return match ? match[2] : null;
}

interface PhraseHit {
  phrase: string;
  excerpt: string;
}

function findPhraseInBody(body: string, phrases: string[]): PhraseHit | null {
  const matched = matchesSignal(normalizeText(body), phrases);
  if (matched === null) return null;
  const excerpt = findExactExcerpt(body, matched);
  if (excerpt === null) return null;
  return { phrase: matched, excerpt };
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

interface GateHit {
  code: HardGateCode;
  turn: 1 | 2 | 3;
  excerpt: string;
  reason: string;
}

const REASONS: Record<HardGateCode, string> = {
  threat_coercion:
    "Threatening or coercive language. This ends the interaction and caps the score at 2.",
  sexual_pressure:
    "Directed sexual proposition or pressure at her. Respecting her boundaries is non-negotiable.",
  doxxing:
    "Using or claiming her private information. This ends the interaction immediately.",
  solicitation_after_refusal:
    "Asking for contact or a date after she already gave an explicit refusal.",
  slurs_abuse:
    "Slurs or dehumanizing abuse. This ends the interaction and caps the score at 2.",
  insult_negging:
    "Backhanded insults or negging. Warmth beats put-downs every time.",
  material_deception:
    "Fabricated credentials used to impress. Honesty is the floor.",
  fabricated_familiarity:
    "Claiming a shared history that does not exist in this scenario.",
  unobservable_facts:
    "Asserting facts about her that the scenario never made observable.",
  demanding_after_low_interest:
    "Demanding contact or a date while she is showing low interest.",
  repeated_soft_boundary_push:
    "Repeatedly pushing for contact or a date after soft refusals.",
};

export function detectHardGates(input: {
  responses: Array<{ turn: 1 | 2 | 3; body: string }>;
  personaMessages: Array<{ turn: number; body: string }>;
  finalPersonaState: PersonaState;
  scenario: Scenario;
}): HardGateFinding {
  const { responses, personaMessages, finalPersonaState } = input;
  const hits: GateHit[] = [];

  const scanTurns = (
    code: HardGateCode,
    patterns: string[],
    filter?: (turn: 1 | 2 | 3) => boolean,
  ) => {
    for (const response of responses) {
      if (filter && !filter(response.turn)) continue;
      const hit = findPhraseInBody(response.body, patterns);
      if (hit) {
        hits.push({
          code,
          turn: response.turn,
          excerpt: hit.excerpt,
          reason: REASONS[code],
        });
      }
    }
  };

  // -- Stop-level: per-turn phrase scans -----------------------------------
  scanTurns("threat_coercion", THREAT_PATTERNS);
  scanTurns("sexual_pressure", SEXUAL_PRESSURE_PATTERNS);
  scanTurns("doxxing", DOXXING_PATTERNS);
  scanTurns("slurs_abuse", SLUR_PATTERNS);

  // -- Stop-level: solicitation after an explicit refusal -------------------
  const refusalTurns = personaMessages
    .filter((message) =>
      matchesSignal(normalizeText(message.body), EXPLICIT_REFUSAL_PATTERNS),
    )
    .map((message) => message.turn);
  if (refusalTurns.length > 0) {
    const firstRefusalTurn = Math.min(...refusalTurns);
    scanTurns(
      "solicitation_after_refusal",
      ASK_PATTERNS,
      (turn) => turn > firstRefusalTurn,
    );
  }

  // -- Cap-level: per-turn phrase scans -------------------------------------
  scanTurns("insult_negging", NEGGING_PATTERNS);
  scanTurns("material_deception", MATERIAL_DECEPTION_PATTERNS);
  // Fabricated familiarity only contradicts the scenario on the opening turn.
  scanTurns("fabricated_familiarity", FABRICATED_FAMILIARITY_PATTERNS, (turn) => turn === 1);
  scanTurns("unobservable_facts", UNOBSERVABLE_FACT_PATTERNS);

  // -- Cap-level: context-dependent demand gates -----------------------------
  const lowOrClosed =
    finalPersonaState.engagement === "low" ||
    finalPersonaState.engagement === "closed";
  const softRefusalSeen = personaMessages.some((message) =>
    matchesSignal(normalizeText(message.body), SOFT_REFUSAL_PATTERNS),
  );

  if (lowOrClosed || softRefusalSeen) {
    scanTurns("demanding_after_low_interest", DEMAND_PATTERNS);
  }

  if (softRefusalSeen) {
    const askTurns = responses.filter(
      (response) => findPhraseInBody(response.body, ASK_PATTERNS) !== null,
    );
    if (askTurns.length >= 2) {
      for (const response of askTurns) {
        const hit = findPhraseInBody(response.body, ASK_PATTERNS);
        if (hit) {
          hits.push({
            code: "repeated_soft_boundary_push",
            turn: response.turn,
            excerpt: hit.excerpt,
            reason: REASONS.repeated_soft_boundary_push,
          });
        }
      }
    }
  }

  // -- Assemble the finding --------------------------------------------------
  const codes = [...new Set(hits.map((hit) => hit.code))].sort();
  const severity = codes.some((code) => STOP_CODE_SET.has(code))
    ? "stop"
    : codes.length > 0
      ? "cap"
      : "none";
  const maxScore = severity === "stop" ? 2 : severity === "cap" ? 4 : 10;
  const evidence: Evidence[] = hits.map((hit) => ({
    turn: hit.turn,
    excerpt: hit.excerpt,
    reason: hit.reason,
  }));

  return {
    triggered: codes.length > 0,
    severity,
    codes,
    maxScore,
    evidence,
  };
}
