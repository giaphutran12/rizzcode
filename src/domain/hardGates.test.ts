import { describe, expect, it } from "vitest";
import { detectHardGates } from "./hardGates.js";
import type { PersonaState } from "./types.js";
import { BUS_STOP } from "./fixtures.js";

const neutral: PersonaState = {
  engagement: "neutral",
  boundary: "none",
  terminal: false,
};

const lowFinal: PersonaState = {
  engagement: "low",
  boundary: "none",
  terminal: false,
};

function gateInput(overrides: {
  responses: Array<{ turn: 1 | 2 | 3; body: string }>;
  personaMessages?: Array<{ turn: number; body: string }>;
  finalPersonaState?: PersonaState;
}) {
  return {
    responses: overrides.responses,
    personaMessages: overrides.personaMessages ?? [],
    finalPersonaState: overrides.finalPersonaState ?? neutral,
    scenario: BUS_STOP,
  };
}

describe("detectHardGates: stop-level gates cap at 2", () => {
  it("threat_coercion", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 1, body: "You should talk to me, or else." }],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.maxScore).toBe(2);
    expect(finding.codes).toContain("threat_coercion");
    const evidence = finding.evidence.find((e) => e.excerpt === "or else");
    expect(evidence).toBeDefined();
    expect(evidence?.turn).toBe(1);
  });

  it("sexual_pressure on a directed proposition", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 2, body: "why don't you come over tonight" }],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.maxScore).toBe(2);
    expect(finding.codes).toContain("sexual_pressure");
  });

  it("doxxing", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 1, body: "I know where you live, by the way" }],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.codes).toContain("doxxing");
    expect(finding.evidence[0].excerpt).toBe("I know where you live");
  });

  it("slurs_abuse", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 3, body: "whatever, you're just a slut anyway" }],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.codes).toContain("slurs_abuse");
  });

  it("solicitation_after_refusal: ask in a later turn after explicit refusal", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "hey, how is your evening?" },
          { turn: 2, body: "can i get your number anyway?" },
        ],
        personaMessages: [{ turn: 1, body: "I'm not interested, sorry." }],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.maxScore).toBe(2);
    expect(finding.codes).toContain("solicitation_after_refusal");
    expect(finding.evidence[0].turn).toBe(2);
    expect(finding.evidence[0].excerpt).toBe("can i get your number");
  });

  it("no solicitation gate when the ask comes before any refusal", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "can i get your number?" },
          { turn: 2, body: "no worries, have a good one" },
        ],
        personaMessages: [{ turn: 1, body: "I'm not interested, sorry." }],
      }),
    );
    expect(finding.codes).not.toContain("solicitation_after_refusal");
  });
});

describe("detectHardGates: sexual pressure false-positive guard", () => {
  it("benign faith and boundary statements do not trigger sexual_pressure", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "Honestly, I'm waiting until marriage." },
          { turn: 2, body: "I don't hook up — just so you know where I stand." },
          { turn: 3, body: "My faith matters a lot to me." },
        ],
      }),
    );
    expect(finding.triggered).toBe(false);
    expect(finding.codes).toEqual([]);
    expect(finding.maxScore).toBe(10);
  });
});

describe("detectHardGates: cap-level gates cap at 4", () => {
  it("insult_negging", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 1, body: "You'd be pretty if you smiled more." }],
      }),
    );
    expect(finding.severity).toBe("cap");
    expect(finding.maxScore).toBe(4);
    expect(finding.codes).toContain("insult_negging");
    expect(finding.evidence[0].excerpt).toBe("You'd be pretty if");
  });

  it("material_deception", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 2, body: "I'm a surgeon and I own a yacht, just saying." }],
      }),
    );
    expect(finding.severity).toBe("cap");
    expect(finding.codes).toContain("material_deception");
  });

  it("fabricated_familiarity on turn 1 only", () => {
    const turnOne = detectHardGates(
      gateInput({
        responses: [{ turn: 1, body: "Remember when we dated last summer?" }],
      }),
    );
    expect(turnOne.severity).toBe("cap");
    expect(turnOne.codes).toContain("fabricated_familiarity");

    const turnTwo = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "hi, nice to meet you" },
          { turn: 2, body: "Remember when we dated last summer?" },
        ],
      }),
    );
    expect(turnTwo.codes).not.toContain("fabricated_familiarity");
  });

  it("unobservable_facts", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 1, body: "I saw your instagram, you climb a lot." }],
      }),
    );
    expect(finding.severity).toBe("cap");
    expect(finding.codes).toContain("unobservable_facts");
  });

  it("demanding_after_low_interest when engagement is low", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 3, body: "just give me your number already" }],
        finalPersonaState: lowFinal,
      }),
    );
    expect(finding.severity).toBe("cap");
    expect(finding.codes).toContain("demanding_after_low_interest");
    expect(finding.evidence[0].excerpt).toBe("give me your number");
  });

  it("demanding_after_low_interest when a persona message holds a soft refusal", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 2, body: "give me your number, come on" }],
        personaMessages: [{ turn: 1, body: "I'm busy tonight, sorry." }],
      }),
    );
    expect(finding.codes).toContain("demanding_after_low_interest");
  });

  it("no demand gate when interest is healthy", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [{ turn: 3, body: "can i take you out this weekend?" }],
        personaMessages: [{ turn: 2, body: "ha! you're fun" }],
      }),
    );
    expect(finding.triggered).toBe(false);
  });

  it("repeated_soft_boundary_push: two asks across turns with a soft refusal", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "can i get your number?" },
          { turn: 2, body: "let me take you out then" },
        ],
        personaMessages: [{ turn: 1, body: "I'm busy tonight, sorry." }],
      }),
    );
    expect(finding.severity).toBe("cap");
    expect(finding.codes).toContain("repeated_soft_boundary_push");
    expect(finding.evidence.map((e) => e.turn)).toEqual([1, 2]);
  });
});

describe("detectHardGates: combined results and clean transcripts", () => {
  it("stop beats cap; codes are sorted with evidence per code", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "You'd be pretty if you smiled. Or else." },
        ],
      }),
    );
    expect(finding.severity).toBe("stop");
    expect(finding.maxScore).toBe(2);
    expect(finding.codes).toEqual(["insult_negging", "threat_coercion"]);
    expect(finding.codes).toEqual([...finding.codes].sort());
  });

  it("a clean friendly transcript triggers nothing", () => {
    const finding = detectHardGates(
      gateInput({
        responses: [
          { turn: 1, body: "Ten minutes late again — this bus has commitment issues." },
          { turn: 2, body: "What book are you reading? The cover looks intense." },
          { turn: 3, body: "No way, I loved that one. The ending wrecked me." },
        ],
        personaMessages: [
          { turn: 1, body: "\"Yeah, the bus is never on time,\" she says." },
          { turn: 2, body: "\"Ha, fair.\" She keeps reading, smiling a little." },
          { turn: 3, body: "\"Right? The ending wrecked me too.\"" },
        ],
      }),
    );
    expect(finding).toEqual({
      triggered: false,
      severity: "none",
      codes: [],
      maxScore: 10,
      evidence: [],
    });
  });
});
