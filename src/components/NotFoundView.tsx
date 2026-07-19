import { ArrowLeft } from "@phosphor-icons/react";
import { AppNav } from "./AppNav";

export function NotFoundView(props: { path: string }) {
  return (
    <main className="taste-page taste-app">
      <AppNav />
      <section className="taste-notfound" aria-labelledby="notfound-title">
        <p className="taste-kicker">404 — wrong scenario</p>
        <h1 id="notfound-title">
          This page left the conversation early.
        </h1>
        <p>
          <code>{props.path}</code> does not exist. Graceful exit, honestly —
          respect the move.
        </p>
        <a className="taste-button taste-button--ink" href="/">
          <ArrowLeft size={18} weight="bold" />
          Back to the landing
        </a>
      </section>
    </main>
  );
}
