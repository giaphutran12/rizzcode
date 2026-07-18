export type Speaker = "her" | "you";

export type PracticeMessage = {
  id: number;
  speaker: Speaker;
  body: string;
};

export type RubricItem = {
  label: string;
  score: number;
  note: string;
};

export const scenario = {
  id: "SOC-204",
  title: "The demo-table opening",
  place: "Open-source social, 6:42 PM",
  difficulty: "Medium",
  time: "3 min",
  premise:
    "You met briefly during demos. She is packing up alone near the education projects table, and you have a natural reason to say hello.",
  objective:
    "Start a genuine conversation, find one shared thread, and make a calibrated invitation if the interest feels mutual.",
  context: [
    "Builds tools for student learning",
    "Prefers quiet cafés over loud events",
    "Recently posted about Vietnamese literature",
  ],
  boundaries: [
    "Intentional relationship",
    "Respectful boundaries",
    "No manipulative tactics",
  ],
};

export const initialMessages: PracticeMessage[] = [
  {
    id: 1,
    speaker: "her",
    body: "Your demo was the dating coach one, right? Brave choice for an open-source night.",
  },
  {
    id: 2,
    speaker: "you",
    body: "Brave or a cry for help? I’m Edward. What are you building tonight?",
  },
  {
    id: 3,
    speaker: "her",
    body: "Nothing as chaotic. I’m working on an education tool for students.",
  },
];

export const replySequence = [
  "Mostly helping students practice without feeling judged. What got you interested in conversation coaching?",
  "That actually sounds thoughtful. I would keep talking, but my friends are heading out soon.",
];

export const rubric: RubricItem[] = [
  {
    label: "Respect",
    score: 9,
    note: "You treated her as a person, not a target.",
  },
  {
    label: "Curiosity",
    score: 8,
    note: "Your question made room for a real answer.",
  },
  {
    label: "Calibration",
    score: 8,
    note: "The energy matched the moment.",
  },
  {
    label: "Authenticity",
    score: 9,
    note: "The humor sounded like you.",
  },
  {
    label: "Forward motion",
    score: 7,
    note: "Make the next step specific and low-pressure.",
  },
];

export const curriculum = [
  {
    title: "Open without performing",
    status: "Complete",
    detail: "5 scenarios",
  },
  {
    title: "Turn small talk into a thread",
    status: "Current",
    detail: "3 of 6",
  },
  {
    title: "Read reciprocity",
    status: "Locked",
    detail: "Unlock at level 7",
  },
  {
    title: "Make a clear invitation",
    status: "Locked",
    detail: "Unlock at level 8",
  },
];
