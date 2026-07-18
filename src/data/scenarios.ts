import type {
  Engagement,
  OutcomeCode,
  Scenario,
  ScenarioFallbackGraph,
} from "../domain/types";

type ReplyRows = [
  Record<Engagement, string>,
  Record<Engagement, string>,
  Record<Engagement, string>,
];

const commonBoundarySignals = [
  "send nudes",
  "sleep with me",
  "have sex",
  "you have no choice",
  "give me your number now",
  "i know where you live",
  "i will follow you",
  "i'll follow you",
  "better give me",
];

const commonLowInterestSignals = [
  "whatever",
  "you are boring",
  "you're boring",
  "not that pretty",
  "you'd look better",
  "for a girl",
];

const commonExitSignals = [
  "no worries",
  "all good",
  "take care",
  "have a good",
  "nice meeting you",
  "i'll let you go",
  "i will let you go",
];

function graph(
  positiveSignals: string[],
  replies: ReplyRows,
  overrides: Partial<
    Pick<
      ScenarioFallbackGraph,
      "lowInterestSignals" | "boundarySignals" | "exitSignals"
    >
  > = {},
): ScenarioFallbackGraph {
  return {
    positiveSignals,
    lowInterestSignals:
      overrides.lowInterestSignals ?? commonLowInterestSignals,
    boundarySignals: overrides.boundarySignals ?? commonBoundarySignals,
    exitSignals: overrides.exitSignals ?? commonExitSignals,
    repliesByTurn: {
      1: replies[0],
      2: replies[1],
      3: replies[2],
    },
  };
}

const allConversationOutcomes: OutcomeCode[] = [
  "conversation_continues",
  "shared_interest",
  "contact_exchanged",
  "graceful_exit",
  "low_interest",
  "boundary_crossed",
];

export const scenarios: Scenario[] = [
  {
    id: "spark-bus-stop",
    module: "spark",
    mode: "in_person",
    difficulty: "easy",
    title: "The bus-stop opening",
    setting: "A sunny bus stop after work",
    premise:
      "You are both waiting for the 99. Her tote bag has a tiny ramen illustration. She is not wearing headphones and does not look rushed.",
    objective: "Begin naturally from something you can actually observe.",
    visibleContext: [
      "The bus display says seven minutes",
      "Her tote has a ramen illustration",
      "She is looking around, not at a phone",
    ],
    boundaries: [
      "Do not invent familiarity",
      "Keep the first line speakable",
      "Leave room for a short answer",
    ],
    skills: ["situational opener", "presence", "calibration"],
    opening: { kind: "scene_only" },
    persona: {
      name: "Maya",
      traits: ["dry humor", "observant", "friendly when unhurried"],
      currentGoal: "Get home and decide what to cook",
      constraints: [
        "She has never met the user",
        "She will not share contact details without mutual engagement",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: ["ramen", "bus", "seven minutes", "tote", "recipe", "coffee"],
    supportedOutcomeCodes: allConversationOutcomes,
    fallback: graph(
      ["ramen", "bus", "seven minutes", "tote", "recipe", "coffee"],
      [
        {
          closed: "I’m just trying to get home, sorry.",
          low: "Yeah, the bus is taking its time.",
          neutral: "Ha, it is my emergency ramen tote. The bus delay feels on-brand.",
          warm: "You noticed the ramen? Okay, that earns you one food opinion.",
        },
        {
          closed: "I should get going. Take care.",
          low: "Maybe. I’m pretty tired tonight.",
          neutral: "I’m loyal to spicy miso, but I’ll hear a competing case.",
          warm: "Spicy miso, no contest. What is your extremely serious answer?",
        },
        {
          closed: "No thanks. Have a good night.",
          low: "I’m going to keep tonight quiet, but nice meeting you.",
          neutral: "That was a surprisingly decent bus-stop chat. See you around.",
          warm: "Sure, I’d swap numbers and continue the ramen tribunal.",
        },
      ],
    ),
  },
  {
    id: "spark-open-source",
    module: "spark",
    mode: "in_person",
    difficulty: "easy",
    title: "The open-source hello",
    setting: "An open-source social after demos",
    premise:
      "She is packing up an education-project demo beside yours. You both survived the same chaotic round of presentations.",
    objective: "Open cleanly and find one shared thread without interviewing her.",
    visibleContext: [
      "Her demo helps students practice",
      "The projector failed twice",
      "The snack table is almost empty",
    ],
    boundaries: [
      "Use only event context",
      "Contribute as well as ask",
      "Do not hijack her project story",
    ],
    skills: ["shared context", "reciprocity", "playfulness"],
    opening: { kind: "scene_only" },
    persona: {
      name: "An",
      traits: ["thoughtful", "quietly funny", "proud of her work"],
      currentGoal: "Pack up and meet friends near the exit",
      constraints: [
        "She wants her project understood",
        "Her friends leave after the third turn",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "projector",
      "demo",
      "students",
      "education",
      "open source",
      "coffee",
    ],
    supportedOutcomeCodes: [
      ...allConversationOutcomes,
      "date_invited",
    ],
    fallback: graph(
      ["projector", "demo", "students", "education", "open source", "coffee"],
      [
        {
          closed: "I’m actually trying to finish packing.",
          low: "Yeah, the demos were a lot.",
          neutral: "The projector humbled all of us. Mine helps students practice without feeling watched.",
          warm: "If we survived that projector, we can survive one normal conversation. What did you build?",
        },
        {
          closed: "I need to catch my friends.",
          low: "It’s still early, but I’m hopeful.",
          neutral: "The best part is when a student stops being scared to try. What pulled you into your idea?",
          warm: "That is exactly the thread I care about. Your version sounds chaotic in a useful way.",
        },
        {
          closed: "No, but good luck with the project.",
          low: "Not tonight, but it was nice meeting you.",
          neutral: "My friends are leaving, but I’m glad we talked.",
          warm: "Coffee and a less cursed projector? I’d be up for that. Let’s swap numbers.",
        },
      ],
    ),
  },
  {
    id: "spark-cafe",
    module: "spark",
    mode: "in_person",
    difficulty: "medium",
    title: "The focused café moment",
    setting: "A quiet café beside a public library",
    premise:
      "She closes her book, stretches, and looks toward the pastry case. You are seated at the next shared table.",
    objective: "Test openness without interrupting focus or forcing momentum.",
    visibleContext: [
      "The book is closed",
      "The café is quiet",
      "The last almond croissant is in the case",
    ],
    boundaries: [
      "Do not assume what the book means to her",
      "Respect a short reply",
      "No speech disguised as an opener",
    ],
    skills: ["timing", "brevity", "reading openness"],
    opening: { kind: "scene_only" },
    persona: {
      name: "Leah",
      traits: ["bookish", "direct", "warm after a good read"],
      currentGoal: "Take a break before returning to her book",
      constraints: [
        "She protects her reading time",
        "She answers honestly if the timing is poor",
      ],
      initialState: { engagement: "low", boundary: "none", terminal: false },
    },
    successSignals: ["book", "croissant", "pastry", "cafe", "break", "reading"],
    supportedOutcomeCodes: allConversationOutcomes,
    fallback: graph(
      ["book", "croissant", "pastry", "cafe", "break", "reading"],
      [
        {
          closed: "I’m in the middle of something, sorry.",
          low: "Just taking a quick break.",
          neutral: "I’m deciding whether the last croissant is worth abandoning my chapter.",
          warm: "You noticed the high-stakes pastry situation. What is your ruling?",
        },
        {
          closed: "I’d rather get back to reading.",
          low: "It’s good. I’m keeping the break short.",
          neutral: "The book is winning so far, but the croissant has strong late-game energy.",
          warm: "Okay, that was a good answer. The book is a mystery, and yes, it is actually worth the focus.",
        },
        {
          closed: "Please let me read.",
          low: "I’m heading back to it. Take care.",
          neutral: "Nice chatting. I’m going to reclaim my chapter.",
          warm: "I’m going back to my book, but I’d say hello if I see you here again.",
        },
      ],
    ),
  },
  {
    id: "spark-friend-group",
    module: "spark",
    mode: "in_person",
    difficulty: "medium",
    title: "Enter the friend-group orbit",
    setting: "A friend’s rooftop birthday",
    premise:
      "Your friend Minh introduces you to a group debating the best late-night food. The conversation is already moving.",
    objective: "Join the energy without turning the group into your personal stage.",
    visibleContext: [
      "Minh made the introduction",
      "The group is debating late-night food",
      "Nora just defended breakfast sandwiches",
    ],
    boundaries: [
      "Address the group before isolating one person",
      "Do not dominate",
      "Build on the existing topic",
    ],
    skills: ["group entry", "energy matching", "shared fun"],
    opening: { kind: "scene_only" },
    persona: {
      name: "Nora",
      traits: ["social", "quick-witted", "protective of group flow"],
      currentGoal: "Keep the birthday energy easy",
      constraints: [
        "She dislikes being singled out immediately",
        "She rewards contributions that include the group",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "breakfast sandwich",
      "late night",
      "minh",
      "everyone",
      "group",
      "food",
    ],
    supportedOutcomeCodes: allConversationOutcomes,
    fallback: graph(
      ["breakfast sandwich", "late night", "minh", "everyone", "group", "food"],
      [
        {
          closed: "We were kind of in the middle of this.",
          low: "Sure. Everyone has a food opinion.",
          neutral: "Exactly. Breakfast sandwiches have range. Minh, tell him your terrible pick.",
          warm: "Finally, a person willing to enter the arena. State your case to the council.",
        },
        {
          closed: "I’m going to catch up with my friends.",
          low: "That is one opinion, yeah.",
          neutral: "Okay, respectable. You contributed without giving us a TED Talk.",
          warm: "That story actually earns your choice two bonus points. The council is listening.",
        },
        {
          closed: "No thanks. Enjoy the party.",
          low: "I’m staying with the group, but nice meeting you.",
          neutral: "Good meeting you. Come join the next ridiculous debate.",
          warm: "We are getting food after this. You should come if Minh can behave.",
        },
      ],
    ),
  },
  {
    id: "spark-text-after-meeting",
    module: "spark",
    mode: "messaging",
    difficulty: "medium",
    title: "Text after the chaotic demo",
    setting: "The evening after an open-source meetup",
    premise:
      "You exchanged numbers after talking about the projector failure and her education app.",
    objective: "Reopen the shared moment with personality, not a generic check-in.",
    visibleContext: [
      "You met yesterday",
      "The projector failed twice",
      "She builds an education app",
    ],
    boundaries: [
      "Do not pretend deeper familiarity",
      "One message at a time",
      "Keep the energy proportionate",
    ],
    skills: ["callback", "text rhythm", "personality"],
    opening: {
      kind: "persona_message",
      body: "That demo was chaotic, but I kind of loved it.",
    },
    persona: {
      name: "An",
      traits: ["thoughtful", "quietly funny", "busy builder"],
      currentGoal: "Unwind after work and reply when the thread is worth it",
      constraints: [
        "She remembers the event but does not know the user deeply",
        "She will not reward repeated generic texts",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "projector",
      "demo",
      "chaotic",
      "education",
      "students",
      "coffee",
    ],
    supportedOutcomeCodes: [
      ...allConversationOutcomes,
      "date_invited",
      "date_agreed",
    ],
    fallback: graph(
      ["projector", "demo", "chaotic", "education", "students", "coffee"],
      [
        {
          closed: "Haha. Long day over here.",
          low: "Yeah, it was definitely chaotic.",
          neutral: "The projector was our unpaid comedy act. I’m still laughing at the third reboot.",
          warm: "The projector gave the strongest performance. Your demo recovered pretty well though.",
        },
        {
          closed: "I’m going offline for the night.",
          low: "The app is still a work in progress.",
          neutral: "I’m testing a new practice flow this week. Your story about overthinking made sense.",
          warm: "Okay, now I want the less chaotic version of that story. What happened after you shipped it?",
        },
        {
          closed: "I’m not looking to meet up, but take care.",
          low: "This week is packed, but thanks for asking.",
          neutral: "Coffee could be nice. Send me a day and place and I’ll check.",
          warm: "Thursday coffee sounds good. The projector is not invited.",
        },
      ],
    ),
  },
  {
    id: "connection-keep-thread",
    module: "connection",
    mode: "messaging",
    difficulty: "easy",
    title: "Keep the thread alive",
    setting: "A text thread two days after meeting",
    premise:
      "She mentioned trying to cook one new Vietnamese dish every month.",
    objective: "Balance curiosity with a real contribution of your own.",
    visibleContext: [
      "She is learning one dish a month",
      "Her last attempt was bánh xèo",
      "She said the first pancake looked tragic",
    ],
    boundaries: [
      "Do not fire off an interview",
      "Respond to her actual detail",
      "Share without monologuing",
    ],
    skills: ["listening", "contribution", "follow-up"],
    opening: {
      kind: "persona_message",
      body: "The second bánh xèo was edible. Character development.",
    },
    persona: {
      name: "Mai",
      traits: ["curious", "self-deprecating", "food-motivated"],
      currentGoal: "Share a small win without writing an essay",
      constraints: [
        "She likes mutual stories",
        "She disengages from question barrages",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "bánh xèo",
      "banh xeo",
      "pancake",
      "cooking",
      "recipe",
      "my attempt",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: graph(
      ["bánh xèo", "banh xeo", "pancake", "cooking", "recipe", "my attempt"],
      [
        {
          closed: "Haha, yep.",
          low: "It was better than the first one.",
          neutral: "The first one looked like a folded map. What is your most humbling kitchen attempt?",
          warm: "Character development and fewer smoke alarms. I accept the win.",
        },
        {
          closed: "I’m heading to bed.",
          low: "Cooking is mostly trial and error.",
          neutral: "Okay, that story makes me feel much better. What did you change the second time?",
          warm: "That is worse than my pancake and somehow more impressive. Please continue.",
        },
        {
          closed: "Night.",
          low: "Nice chatting. Talk later.",
          neutral: "I like this exchange of culinary evidence. Send the next disaster when it happens.",
          warm: "Deal. Next month we compare attempts and crown the least chaotic cook.",
        },
      ],
    ),
  },
  {
    id: "connection-callback",
    module: "connection",
    mode: "messaging",
    difficulty: "medium",
    title: "Deploy the callback",
    setting: "A warm text thread after a first coffee",
    premise:
      "At coffee, she joked that every houseplant in her apartment is on a performance-improvement plan.",
    objective: "Create warmth with a callback that does not feel manufactured.",
    visibleContext: [
      "You had coffee yesterday",
      "She owns several struggling houseplants",
      "She has an important presentation today",
    ],
    boundaries: [
      "Keep the joke kind",
      "Do not spam callbacks",
      "Show interest in her real day",
    ],
    skills: ["callback", "warmth", "timing"],
    opening: {
      kind: "persona_message",
      body: "Presentation survived. Barely. My fern showed more confidence than I did.",
    },
    persona: {
      name: "Sofia",
      traits: ["playful", "ambitious", "fond of bad plant jokes"],
      currentGoal: "Decompress after presenting",
      constraints: [
        "She appreciates kind callbacks",
        "She dislikes jokes that dismiss her effort",
      ],
      initialState: { engagement: "warm", boundary: "none", terminal: false },
    },
    successSignals: [
      "fern",
      "plant",
      "performance improvement",
      "presentation",
      "survived",
      "coffee",
    ],
    supportedOutcomeCodes: [
      ...allConversationOutcomes,
      "date_invited",
      "date_agreed",
    ],
    fallback: graph(
      ["fern", "plant", "performance improvement", "presentation", "survived", "coffee"],
      [
        {
          closed: "It was a long day.",
          low: "The fern remains employed.",
          neutral: "The fern passed probation. I’m still waiting on my review.",
          warm: "Exactly. Fern: promoted. Me: requesting a snack and no more slides.",
        },
        {
          closed: "I’m going to rest.",
          low: "It went okay, honestly.",
          neutral: "The hard question was less scary than I expected. Your pre-presentation voice note helped.",
          warm: "I used your ‘pause before answering’ trick. Annoyingly, it worked.",
        },
        {
          closed: "Not tonight. Take care.",
          low: "Maybe another week.",
          neutral: "A victory coffee sounds fair. I’ll check my week.",
          warm: "Victory coffee, round two. Saturday afternoon?",
        },
      ],
    ),
  },
  {
    id: "connection-first-date",
    module: "connection",
    mode: "messaging",
    difficulty: "medium",
    title: "Make the actual invitation",
    setting: "A text thread with steady mutual energy",
    premise:
      "You have traded a few lively messages about bookstores and dumplings. She said her weekend is mostly open.",
    objective: "Make a specific, low-pressure first-date invitation.",
    visibleContext: [
      "She likes used bookstores",
      "You both mentioned dumplings",
      "Her Saturday afternoon is open",
    ],
    boundaries: [
      "Be specific",
      "Offer an easy decline",
      "Do not manufacture urgency",
    ],
    skills: ["clear invitation", "calibration", "logistics"],
    opening: {
      kind: "persona_message",
      body: "Saturday is surprisingly empty. I might finally investigate that used bookstore.",
    },
    persona: {
      name: "Priya",
      traits: ["direct", "curious", "appreciates concrete plans"],
      currentGoal: "Decide how to spend Saturday without overplanning",
      constraints: [
        "She needs a clear time and activity",
        "She may decline without being punished",
      ],
      initialState: { engagement: "warm", boundary: "none", terminal: false },
    },
    successSignals: [
      "bookstore",
      "dumplings",
      "saturday",
      "afternoon",
      "join me",
      "want to",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "date_invited",
      "date_agreed",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: graph(
      ["bookstore", "dumplings", "saturday", "afternoon", "join me", "want to"],
      [
        {
          closed: "I’m actually keeping Saturday to myself.",
          low: "Maybe. I haven’t decided yet.",
          neutral: "The bookstore is tempting. What did you have in mind?",
          warm: "Bookstore plus dumplings is a suspiciously effective proposal.",
        },
        {
          closed: "No, thanks.",
          low: "I might need to play it by ear.",
          neutral: "Two o’clock could work. Which bookstore?",
          warm: "Two at Paper Hound, then dumplings? That works for me.",
        },
        {
          closed: "Please stop asking.",
          low: "I can’t commit, but thanks for the invite.",
          neutral: "Send me the address and I’ll confirm in the morning.",
          warm: "Locked in. I’ll see you at two, and I’m judging your book pick.",
        },
      ],
    ),
  },
  {
    id: "connection-recover",
    module: "connection",
    mode: "messaging",
    difficulty: "hard",
    title: "Recover without the essay",
    setting: "A text thread after an awkward overconfident joke",
    premise:
      "You teased her about always being late. She replied that she was late because she was helping her younger sister.",
    objective: "Acknowledge the miss and reset without making her manage your guilt.",
    visibleContext: [
      "Your joke landed badly",
      "She was helping her younger sister",
      "She has not ended the conversation",
    ],
    boundaries: [
      "Own the specific miss",
      "Do not overexplain intent",
      "Do not demand reassurance",
    ],
    skills: ["repair", "accountability", "emotional steadiness"],
    opening: {
      kind: "persona_message",
      body: "I was late because my little sister needed help, so that joke did not really land.",
    },
    persona: {
      name: "Jules",
      traits: ["fair", "protective of family", "open to concise repair"],
      currentGoal: "See whether the user can hear a correction",
      constraints: [
        "She will not comfort a performative apology",
        "A clean repair can restore warmth",
      ],
      initialState: { engagement: "low", boundary: "soft", terminal: false },
    },
    successSignals: [
      "you are right",
      "you're right",
      "my bad",
      "i'm sorry",
      "i am sorry",
      "that was unfair",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "graceful_exit",
      "low_interest",
      "incompatible",
      "boundary_crossed",
    ],
    fallback: graph(
      ["you are right", "you're right", "my bad", "i'm sorry", "i am sorry", "that was unfair"],
      [
        {
          closed: "I don’t want to keep discussing it.",
          low: "Thanks for saying that.",
          neutral: "I appreciate the clean apology. She had a rough day.",
          warm: "That was all I needed. She is okay now, thankfully.",
        },
        {
          closed: "Please give me space.",
          low: "We can leave it there.",
          neutral: "We are good. How did your evening end up going?",
          warm: "Reset accepted. Now tell me whether your own punctuality record can survive cross-examination.",
        },
        {
          closed: "Take care.",
          low: "I’m going to call it a night.",
          neutral: "Thanks for handling that normally. Talk later.",
          warm: "Okay, we recovered. No apology dissertation required.",
        },
      ],
      {
        boundarySignals: [
          ...commonBoundarySignals,
          "get over it",
          "you are too sensitive",
          "you're too sensitive",
        ],
        lowInterestSignals: [
          ...commonLowInterestSignals,
          "it was just a joke",
          "calm down",
        ],
      },
    ),
  },
  {
    id: "connection-low-interest",
    module: "connection",
    mode: "messaging",
    difficulty: "hard",
    title: "Read the quiet answer",
    setting: "A thread that has cooled after two dates",
    premise:
      "Her replies have become shorter. When you asked about another date, she answered honestly.",
    objective: "Calibrate, clarify once if needed, or exit with dignity.",
    visibleContext: [
      "You went on two dates",
      "Her replies became shorter",
      "She has now stated low interest",
    ],
    boundaries: [
      "Take the answer seriously",
      "Do not negotiate attraction",
      "One graceful close is enough",
    ],
    skills: ["reading interest", "graceful exit", "compatibility clarity"],
    opening: {
      kind: "persona_message",
      body: "I had a good time, but I do not think I feel the connection I am looking for.",
    },
    persona: {
      name: "Elena",
      traits: ["honest", "kind", "decisive"],
      currentGoal: "End the dating thread without ambiguity",
      constraints: [
        "Her answer is an explicit refusal",
        "She will not reverse it under pressure",
      ],
      initialState: { engagement: "closed", boundary: "explicit", terminal: false },
    },
    successSignals: [
      "thanks for being honest",
      "i appreciate",
      "no worries",
      "take care",
      "wish you well",
      "all good",
    ],
    supportedOutcomeCodes: [
      "graceful_exit",
      "low_interest",
      "incompatible",
      "boundary_crossed",
    ],
    fallback: graph(
      ["thanks for being honest", "i appreciate", "no worries", "take care", "wish you well", "all good"],
      [
        {
          closed: "Thank you for understanding. I wish you well too.",
          low: "I appreciate you hearing me.",
          neutral: "Thanks for taking it well. I genuinely wish you the best.",
          warm: "Thank you. That was kind and clear. Take care.",
        },
        {
          closed: "I do not want to keep discussing this.",
          low: "There is not more I can add.",
          neutral: "I think we have clarity. Take care.",
          warm: "We are good. Wishing you the best.",
        },
        {
          closed: "Please stop messaging me.",
          low: "Goodbye.",
          neutral: "Take care.",
          warm: "Take care.",
        },
      ],
      {
        lowInterestSignals: [
          ...commonLowInterestSignals,
          "give me another chance",
          "you owe me",
          "why not",
        ],
        boundarySignals: [
          ...commonBoundarySignals,
          "you will change your mind",
          "you'll change your mind",
          "i won't take no",
          "i will not take no",
        ],
      },
    ),
  },
];

export const scenarioById = new Map(
  scenarios.map((scenario) => [scenario.id, scenario]),
);

export function getScenario(scenarioId: string): Scenario | undefined {
  return scenarioById.get(scenarioId);
}

export const modules = [
  {
    id: "spark" as const,
    name: "Spark",
    eyebrow: "Create the first good moment",
    description:
      "Notice what is real, bring some personality, and test mutual energy without forcing it.",
  },
  {
    id: "connection" as const,
    name: "Connection",
    eyebrow: "Keep something real alive",
    description:
      "Listen, contribute, follow through, invite clearly, and handle mismatches like a grown man.",
  },
];
