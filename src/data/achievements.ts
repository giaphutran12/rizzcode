/**
 * RizzCode achievement definitions.
 *
 * Static copy only — the unlock logic lives in the progression layer.
 * Ids are stable and referenced from Progress.achievements.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export const achievements: Achievement[] = [
  {
    id: "first_contact",
    title: "First Contact",
    description: "Completed your first judged practice.",
  },
  {
    id: "made_her_laugh",
    title: "Made Her Laugh",
    description: "Scored a 2 in Playfulness & Personality.",
  },
  {
    id: "smooth_recovery",
    title: "Smooth Recovery",
    description:
      "Owned an awkward message and reset the thread without groveling.",
  },
  {
    id: "asked_her_out",
    title: "Asked Her Out",
    description:
      "Made a clear, low-pressure invitation when the moment supported it.",
  },
  {
    id: "first_date",
    title: "First Date",
    description:
      "Earned a simulated 'date agreed' outcome. Simulated — but it still counts here.",
  },
  {
    id: "callback_king",
    title: "Callback King",
    description: "Landed a callback that felt warm, not forced.",
  },
  {
    id: "read_the_room",
    title: "Read the Room",
    description: "Chose a graceful exit when the moment called for it.",
  },
  {
    id: "graceful_exit",
    title: "Graceful Exit",
    description:
      "Ended a conversation cleanly and kindly when it wasn't clicking.",
  },
  {
    id: "consistent_communicator",
    title: "Consistent Communicator",
    description: "Practiced three days in a row.",
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find((achievement) => achievement.id === id);
}
