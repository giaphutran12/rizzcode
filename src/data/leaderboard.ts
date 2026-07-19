/**
 * RizzCode demo leaderboard.
 *
 * Seeded demo players only. The local player is added dynamically by the
 * progression layer — never hardcoded here.
 */

export interface DemoPlayer {
  id: string;
  displayName: string;
  xp: number;
}

export const demoPlayers: DemoPlayer[] = [
  { id: "demo-goose-diplomat", displayName: "GooseDiplomat", xp: 2380 },
  { id: "demo-cardamom-carl", displayName: "CardamomCarl", xp: 2110 },
  { id: "demo-text-back-terry", displayName: "TextBackTerry", xp: 1760 },
  { id: "demo-plant-namer", displayName: "PlantNamer", xp: 1490 },
  { id: "demo-slow-fade-survivor", displayName: "SlowFadeSurvivor", xp: 1140 },
  { id: "demo-first-rep-freddie", displayName: "FirstRepFreddie", xp: 860 },
  { id: "demo-nervous-norm", displayName: "NervousNorm", xp: 470 },
  { id: "demo-rookie-rep", displayName: "RookieRep", xp: 240 },
];

export const DEMO_LEADERBOARD_LABEL = "Demo leaderboard";

/**
 * Leaderboard XP is app-verified practice XP only: it comes from judged
 * practice attempts. Self-reported real-world milestones never affect it.
 */
export const DEMO_LEADERBOARD_XP_NOTE =
  "All XP is app-verified practice XP only — earned from judged practice attempts. Private real-world milestones never count.";
