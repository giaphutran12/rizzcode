import { ArrowUpRight } from "@phosphor-icons/react";
import { navigate } from "../router";

/**
 * Shared navigation for the RizzCode app views. Lives inside the Taste design
 * language: sticky parchment bar, circular brand mark, minimal radius.
 */
export function AppNav(props: { ctaLabel?: string; ctaTo?: string }) {
  const handle = (to: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <header className="taste-nav">
      <a
        className="taste-nav__brand"
        href="/"
        aria-label="RizzCode home"
        onClick={handle("/")}
      >
        <span aria-hidden="true">RC</span>
        <strong>RizzCode</strong>
      </a>
      <nav aria-label="RizzCode navigation">
        <a href="/practice" onClick={handle("/practice")}>
          Practice
        </a>
        <a href="/progress" onClick={handle("/progress")}>
          Progress
        </a>
        <a href="/leaderboard" onClick={handle("/leaderboard")}>
          Leaderboard
        </a>
      </nav>
      <a
        className="taste-nav__switch"
        href={props.ctaTo ?? "/practice"}
        onClick={handle(props.ctaTo ?? "/practice")}
      >
        {props.ctaLabel ?? "Start practice"}
        <ArrowUpRight size={17} weight="bold" />
      </a>
    </header>
  );
}
