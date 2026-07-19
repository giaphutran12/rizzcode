/**
 * Small hand-written scenarios shared by the domain tests.
 * These are test fixtures only — the real catalog lives in src/data.
 */

import type { Scenario } from "./types.js";

export const BUS_STOP: Scenario = {
  id: "bus_stop_opener",
  module: "spark",
  mode: "in_person",
  difficulty: "easy",
  title: "The late bus",
  setting: "A bus stop downtown, mid-afternoon.",
  premise: "You are both waiting for the same delayed bus.",
  objective: "Begin naturally from observable context.",
  visibleContext: [
    "She is reading a novel",
    "No headphones",
    "The bus is ten minutes late",
  ],
  boundaries: ["She may be tired after work"],
  skills: ["Situational openers"],
  opening: { kind: "scene_only" },
  persona: {
    name: "Maya",
    traits: ["dry humor", "observant"],
    currentGoal: "Get home without awkwardness",
    constraints: ["Does not give contact info to strangers"],
    initialState: { engagement: "neutral", boundary: "none", terminal: false },
  },
  successSignals: ["She laughs", "She asks you a question back"],
  supportedOutcomeCodes: [
    "conversation_continues",
    "shared_interest",
    "graceful_exit",
    "low_interest",
    "boundary_crossed",
  ],
  fallback: {
    positiveSignals: ["book", "novel", "reading", "funny", "bus late"],
    lowInterestSignals: ["whatever", "boring", "stupid"],
    boundarySignals: ["send pics", "i will find you", "or else"],
    exitSignals: ["got to go", "gotta go", "nice meeting you", "i should go"],
    repliesByTurn: {
      1: {
        closed: "She gives a short nod and steps away from the stop.",
        low: "She glances up briefly. \"Hm.\"",
        neutral: "\"Yeah, the bus is never on time,\" she says.",
        warm: "She smiles. \"Right? I could have finished three chapters by now.\"",
      },
      2: {
        closed: "She puts the book away and checks the road instead.",
        low: "\"Sure,\" she says, eyes back on her book.",
        neutral: "\"Ha, fair.\" She keeps reading, but she is smiling a little.",
        warm: "She laughs. \"Okay, that one's good. What else have you got?\"",
      },
      3: {
        closed: "Her bus pulls in and she boards without a word.",
        low: "\"Anyway. That's my bus.\"",
        neutral: "\"Nice chatting. That's my bus.\"",
        warm: "\"You're fun. That's my bus — see you around, maybe?\"",
      },
    },
  },
};

export const TEXT_AFTER_MEETING: Scenario = {
  id: "text_after_meeting",
  module: "spark",
  mode: "messaging",
  difficulty: "medium",
  title: "Text after the demo",
  setting: "You met her at a game demo night yesterday and got her number.",
  premise: "She texted you first this afternoon.",
  objective: "Reopen the shared moment with personality.",
  visibleContext: ["You met at a game demo night", "She texted first"],
  boundaries: ["She replies slowly when work is busy"],
  skills: ["Interesting texting", "Playful callbacks"],
  opening: {
    kind: "persona_message",
    body: "That demo was chaotic, but I kind of loved it.",
  },
  persona: {
    name: "Jules",
    traits: ["quick wit", "direct"],
    currentGoal: "See if yesterday's fun guy is actually fun over text",
    constraints: ["Ignores low-effort small talk"],
    initialState: { engagement: "warm", boundary: "none", terminal: false },
  },
  successSignals: ["She sends a fast reply", "She uses an emoji"],
  supportedOutcomeCodes: [
    "conversation_continues",
    "shared_interest",
    "contact_exchanged",
    "date_invited",
    "low_interest",
    "boundary_crossed",
  ],
  fallback: {
    positiveSignals: ["demo", "chaotic", "loved it"],
    lowInterestSignals: ["whatever", "lol no"],
    boundarySignals: ["send pics", "come over"],
    exitSignals: ["good night", "talk later"],
    repliesByTurn: {
      1: {
        closed: "new phone who dis",
        low: "lol ok",
        neutral: "ha! it really was",
        warm: "RIGHT?? the smoke machine alone deserved an award",
      },
      2: {
        closed: "…",
        low: "anyway",
        neutral: "okay that's fair",
        warm: "stoppp i'm still laughing about the cardboard sword guy",
      },
      3: {
        closed: "gtg",
        low: "talk later maybe",
        neutral: "this was fun, ttyl",
        warm: "okay you're officially funnier over text than in person. barely.",
      },
    },
  },
};
