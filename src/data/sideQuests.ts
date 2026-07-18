import type { SideQuest } from "../domain/types";

export const sideQuests: SideQuest[] = [
  {
    id: "speak-without-freezing",
    title: "Speak Without Freezing",
    whyItFits:
      "You want to sound natural when the moment arrives, not invent a new personality on demand.",
    personalBenefit:
      "A practiced story is easier to tell clearly at work, with friends, and on dates.",
    socialBenefit:
      "You bring something to the conversation instead of making the other person carry it.",
    starterAction:
      "Record a 60-second story about one small win today. Listen once, then tell it again with half the setup.",
    handoffPrompt:
      "Help me practice telling one true 60-second story naturally. Ask for my rough version, then help me cut the boring setup without making it fake.",
  },
  {
    id: "follow-through",
    title: "Follow Through",
    whyItFits:
      "The relationship you want needs steady action after the exciting opening.",
    personalBenefit:
      "Reliability lowers the background stress created by avoided replies and vague plans.",
    socialBenefit:
      "People can trust that your interest and commitments are real.",
    starterAction:
      "Send one honest reply you have been postponing, or close the loop if the answer is no.",
    handoffPrompt:
      "Help me write one concise, honest follow-up I have been postponing. Keep it direct, kind, and specific.",
  },
];

export function getSideQuest(id?: string): SideQuest {
  return (
    sideQuests.find((quest) => quest.id === id) ?? sideQuests[0]
  );
}
