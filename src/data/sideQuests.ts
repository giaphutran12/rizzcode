/**
 * RizzCode Side Quests.
 *
 * Optional, lightweight handoffs toward a hobby or practical skill. RizzCode
 * recommends, hands over one starter action and one copyable prompt, and then
 * gets out of the way — it does not teach or host the subject.
 */

import type { SideQuest } from "../domain/types";

export const sideQuests: SideQuest[] = [
  {
    id: "learn_guitar",
    title: "Learn Guitar",
    whyItFits:
      "You already love music, and you said you want something that is yours outside of work and dating. Guitar fits that without demanding your whole life.",
    personalBenefit:
      "A creative outlet you control: fifteen minutes a day, and within a couple of weeks you can play one simple song your way.",
    socialBenefit:
      "It gives you something genuine to share. Some people find musicians attractive, but the stronger reason is that you would actually enjoy it.",
    starterAction:
      "Search YouTube for 'beginner guitar day one' and play along for 15 minutes today.",
    handoffPrompt:
      "I am a complete guitar beginner who likes [your favorite music]. Create a free 14-day plan using 15 minutes per day. Help me play one simple song by day 14.",
  },
  {
    id: "speak_without_freezing",
    title: "Speak Without Freezing",
    whyItFits:
      "You said you freeze when put on the spot. That is a rep problem, not a personality flaw — and it responds fast to small daily reps.",
    personalBenefit:
      "You learn to tell a 60-second story without your brain buffering, alone, with zero audience pressure.",
    socialBenefit:
      "First conversations, dates, and group settings all get easier when a story comes out of you on the first try.",
    starterAction:
      "Record a 60-second story on your phone, listen once, then tell it again more naturally. Or search YouTube for Vinh Giang's free communication videos.",
    handoffPrompt:
      "I freeze when I have to speak off the cuff. Give me a 7-day practice plan of 10-minute solo speaking drills, starting with recording a 60-second story and retelling it more naturally.",
  },
  {
    id: "follow_through",
    title: "Follow Through",
    whyItFits:
      "You said you sometimes go quiet after good moments. Reliability is a skill you build before a relationship depends on it.",
    personalBenefit:
      "You become someone whose word means something — and you stop carrying the low-grade guilt of unanswered messages.",
    socialBenefit:
      "People trust people who follow through. Dating, friendship, and work all run on the same fuel.",
    starterAction:
      "Send one honest reply you have been postponing. Today. Three sentences, no over-apology.",
    handoffPrompt:
      "I have been postponing a reply to someone because it feels awkward. Help me draft a short, honest, kind reply. Context: [one sentence about the situation]. Keep it under 80 words and do not over-apologize.",
  },
  {
    id: "household_skill",
    title: "Learn One Household Skill",
    whyItFits:
      "You said you want to feel more capable in your own place. One real repair skill beats ten saved videos you never watch.",
    personalBenefit:
      "Personal competence: the next small thing that breaks gets fixed by you, in an afternoon, for a few dollars.",
    socialBenefit:
      "Capable is quietly attractive — but do this for you. There is no single kind of man every woman wants, and that is not the point.",
    starterAction:
      "Pick one basic repair you genuinely want to know — a leaky faucet, a loose cabinet hinge — and find one free beginner tutorial for it.",
    handoffPrompt:
      "I am a total beginner at home repair. Teach me how to fix [one specific problem] with basic tools. Explain what to buy, the exact steps, and how to know when I should call a professional instead.",
  },
  {
    id: "presentation_reset",
    title: "Presentation Reset",
    whyItFits:
      "You said you want to feel sharper in social situations without obsessing. This is about controllable preparation — never about scoring your looks.",
    personalBenefit:
      "You walk in feeling put-together, which removes one whole category of background anxiety.",
    socialBenefit:
      "Showing up clean and considered signals respect for the occasion and for the people in it.",
    starterAction:
      "Before one social event this week, run the checklist: clean clothes that fit, breath, hair, posture. Ten minutes, done.",
    handoffPrompt:
      "Give me a simple 10-minute pre-event checklist for a casual social event: clothes, grooming, and posture. Keep it about cleanliness and fit, not about changing how I look.",
  },
];

export function getSideQuestById(id: string): SideQuest | undefined {
  return sideQuests.find((quest) => quest.id === id);
}

/**
 * The exact boundary line RizzCode uses when asked to teach a Side Quest
 * subject. `{subject}` is replaced with the quest topic at render time.
 */
export const SIDE_QUEST_BOUNDARY_COPY =
  "Bro, I do not teach {subject}. Paste that prompt into ChatGPT or search YouTube. Come back when you unlock your first rep.";
