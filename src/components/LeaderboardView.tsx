import { Trophy } from "@phosphor-icons/react";
import { AppNav } from "./AppNav";
import { useProgressStore } from "../hooks/useProgress";
import { levelFor } from "../domain/xp";
import {
  DEMO_LEADERBOARD_LABEL,
  DEMO_LEADERBOARD_XP_NOTE,
  demoPlayers,
} from "../data/leaderboard";

export function LeaderboardView() {
  const { progress, profile } = useProgressStore();

  const rows = [
    ...demoPlayers.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      xp: player.xp,
      you: false,
    })),
    {
      id: "local-player",
      displayName: profile.displayName || "You",
      xp: progress.publicXP,
      you: true,
    },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <main className="taste-page taste-app">
      <AppNav />
      <div className="taste-app-main">
        <header className="taste-page-heading">
          <p className="taste-kicker">{DEMO_LEADERBOARD_LABEL}</p>
          <h1>
            Practice XP, <em>ranked.</em>
          </h1>
          <p>
            {DEMO_LEADERBOARD_XP_NOTE} Real dates you log privately never move
            this board — only judged practice does.
          </p>
          <span className="taste-badge taste-badge--oxblood">
            <Trophy size={14} weight="fill" />
            Demo — seeded players plus you
          </span>
        </header>

        <div className="taste-leaderboard" role="table" aria-label={DEMO_LEADERBOARD_LABEL}>
          {rows.map((row, index) => (
            <div
              className="taste-leaderboard__row"
              data-you={row.you}
              key={row.id}
              role="row"
            >
              <span className="taste-leaderboard__rank" role="cell">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="taste-leaderboard__name" role="cell">
                {row.displayName}
                {row.you && <small>You — app-verified practice XP</small>}
              </span>
              <span className="taste-leaderboard__level" role="cell">
                Level {levelFor(row.xp)}
              </span>
              <span className="taste-leaderboard__xp" role="cell">
                {row.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
