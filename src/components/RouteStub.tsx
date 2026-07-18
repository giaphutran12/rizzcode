// Placeholder routes for Task 6b (onboarding, progress, leaderboard). These are
// intentionally minimal styled stubs so the routes resolve and deep links never
// 404 before 6b builds the real views. Each carries a heading and a link back so
// it is a usable dead end, not a blank screen.

import { Link } from "react-router-dom";

interface RouteStubProps {
  eyebrow: string;
  title: string;
  body: string;
}

export function RouteStub({ eyebrow, title, body }: RouteStubProps) {
  return (
    <main className="taste-page taste-stage">
      <div className="taste-stage__wrap taste-stub">
        <p className="taste-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="taste-stub__body">{body}</p>
        <div className="taste-stub__actions">
          <Link className="taste-button taste-button--lime" to="/practice">
            Go practice
          </Link>
          <Link className="taste-button taste-button--ghost" to="/">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

export function OnboardingStub() {
  return (
    <RouteStub
      eyebrow="Onboarding · Coming next"
      title="Four questions, then a plan built for you."
      body="The warm-up that tailors your track is landing in the next drop. For now, jump straight into the curriculum and start repping."
    />
  );
}

export function ProgressStub() {
  return (
    <RouteStub
      eyebrow="Progress · Coming next"
      title="Your streak, badges, and private wins."
      body="Module progress, achievements, and real-world milestones get their own home here soon. Keep practicing — it’s all being tracked."
    />
  );
}

export function LeaderboardStub() {
  return (
    <RouteStub
      eyebrow="Leaderboard · Coming next"
      title="Where you stand — practice XP only."
      body="A seeded, clearly-labeled demo board is on the way. Only app-verified practice XP counts here, never real-world claims."
    />
  );
}
