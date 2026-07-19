import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { AppNav } from "./AppNav";
import { navigate } from "../router";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useProgressStore } from "../hooks/useProgress";
import { nextScenarioId } from "../domain/unlocks";
import { scenarios } from "../data/scenarios";
import { MAX_RESPONSE_LENGTH } from "../domain/types";
import { ResultView } from "./ResultView";

const VERDICT_COPY: Record<string, { title: string; body: string }> = {
  ATE: {
    title: "You ate.",
    body: "Warm, specific, and calibrated. That is what practice is supposed to feel like.",
  },
  COOKED: {
    title: "You cooked.",
    body: "A solid rep. One or two moments kept it from being great — they are below.",
  },
  FUMBLED: {
    title: "You fumbled.",
    body: "Happens to literally everyone. The feedback below is the whole point — run it back.",
  },
};

export function PracticeView(props: { scenarioId: string }) {
  const session = usePracticeSession(props.scenarioId);
  const { progress, profile, recordJudgment, reload } = useProgressStore();
  const [started, setStarted] = useState(false);
  const awardedAttemptRef = useRef<string | null>(null);
  const [applied, setApplied] = useState<ReturnType<typeof recordJudgment> | null>(
    null,
  );

  // Award XP exactly once per completed attempt, only for a valid LLM result.
  useEffect(() => {
    if (!session) return;
    const { attempt, scenario } = session;
    if (
      attempt.status === "complete" &&
      attempt.result &&
      awardedAttemptRef.current !== attempt.id
    ) {
      awardedAttemptRef.current = attempt.id;
      setApplied(recordJudgment(scenario, attempt, attempt.result));
    }
  }, [session, recordJudgment]);

  if (!session) {
    return (
      <main className="taste-page taste-app">
        <AppNav />
        <div className="taste-app-main">
          <section className="taste-notfound" aria-labelledby="unknown-scenario">
            <p className="taste-kicker">Unknown scenario</p>
            <h1 id="unknown-scenario">That scenario does not exist.</h1>
            <p>
              The scenario id <code>{props.scenarioId}</code> is not in the
              curriculum. Head back and pick a real one.
            </p>
            <button
              className="taste-button taste-button--ink"
              type="button"
              onClick={() => navigate("/practice")}
            >
              <ArrowLeft size={17} weight="bold" />
              Back to the curriculum
            </button>
          </section>
        </div>
      </main>
    );
  }

  const { scenario, attempt } = session;
  const isInPerson = scenario.mode === "in_person";
  const youLabel = isInPerson ? "You say" : "You";
  const herLabel = isInPerson ? "She says" : scenario.persona.name;
  const promptLabel = isInPerson ? "What would you say?" : "What would you text?";

  if (attempt.status === "complete" && attempt.result) {
    const orderedIds = scenarios.map((item) => item.id);
    const nextId = nextScenarioId(progress.completedScenarioIds, orderedIds);
    return (
      <ResultView
        scenario={scenario}
        attempt={attempt}
        result={attempt.result}
        verdictCopy={VERDICT_COPY[attempt.result.verdict]}
        applied={applied}
        nextScenarioId={nextId}
        displayName={profile.displayName}
        onRetry={() => {
          awardedAttemptRef.current = null;
          setApplied(null);
          session.reset();
        }}
      />
    );
  }

  if (!started) {
    return (
      <main className="taste-page taste-app">
        <AppNav />
        <div className="taste-app-main taste-app-main--dark">
          <div className="taste-app-inner">
            <div className="taste-practice-top">
              <div className="taste-practice-side">
                <p className="taste-kicker">
                  {scenario.module === "spark" ? "Module 01 — Spark" : "Module 02 — Connection"}
                </p>
                <h1>{scenario.title}</h1>
                <p>{scenario.premise}</p>
                <span className="taste-badge taste-badge--lime">
                  {isInPerson ? "In person" : "Messaging"}
                </span>
              </div>

              <div className="taste-panel taste-panel--dark">
                <div className="taste-practice-facts">
                  <div>
                    <span>Setting</span>
                    <p>{scenario.setting}</p>
                  </div>
                  <div>
                    <span>Objective</span>
                    <p>{scenario.objective}</p>
                  </div>
                  <div>
                    <span>Difficulty</span>
                    <p style={{ textTransform: "capitalize" }}>{scenario.difficulty}</p>
                  </div>
                  <div>
                    <span>You can see</span>
                    <p>{scenario.visibleContext.join(" · ")}</p>
                  </div>
                  <div>
                    <span>The floor</span>
                    <p>{scenario.boundaries.join(" · ")}</p>
                  </div>
                </div>
                <div className="taste-result-actions" style={{ marginTop: 26 }}>
                  <button
                    className="taste-button taste-button--lime"
                    type="button"
                    onClick={() => {
                      session.reset();
                      setStarted(true);
                    }}
                  >
                    Begin — three turns
                    <ArrowRight size={18} weight="bold" />
                  </button>
                  <button
                    className="taste-chip"
                    type="button"
                    onClick={() => navigate("/practice")}
                  >
                    <ArrowLeft size={15} weight="bold" /> Curriculum
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const turnsDone = attempt.userTurn;
  const busy = session.isSubmitting || session.isJudging;

  return (
    <main className="taste-page taste-app">
      <AppNav />
      <div className="taste-app-main taste-app-main--dark">
        <div className="taste-app-inner">
          <div className="taste-practice-top">
            <div className="taste-practice-side">
              <p className="taste-kicker">
                {isInPerson ? "In person" : "Messaging"} · {scenario.setting}
              </p>
              <h1>{scenario.title}</h1>
              <p>{scenario.objective}</p>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "rgba(255,248,237,0.64)",
                    fontSize: 11,
                    marginBottom: 12,
                  }}
                >
                  <span>Conversation progress</span>
                  <strong style={{ color: "var(--lime)" }}>
                    {turnsDone} of 3 turns
                  </strong>
                </div>
                <div className="taste-turn-pips" aria-hidden="true">
                  {[1, 2, 3].map((turn) => (
                    <span data-done={turn <= turnsDone} key={turn} />
                  ))}
                </div>
              </div>

              <div className="taste-practice-facts">
                <div>
                  <span>Remember</span>
                  <p>{scenario.boundaries.join(" · ")}</p>
                </div>
              </div>

              <button
                className="taste-chip"
                style={{ justifySelf: "start" }}
                type="button"
                onClick={() => {
                  session.reset();
                  setStarted(false);
                }}
              >
                <ArrowsClockwise size={15} weight="bold" /> Restart scenario
              </button>
            </div>

            <article
              className="taste-practice-card taste-practice-card--conversation"
              aria-label="Practice conversation"
            >
              <div className="taste-practice-card__topline">
                <span>{promptLabel}</span>
                <strong>
                  {session.isJudging
                    ? "Judging"
                    : session.isSubmitting
                      ? `${scenario.persona.name} is typing`
                      : `${turnsDone}/3 turns`}
                </strong>
              </div>

              <div className="taste-conversation" aria-live="polite">
                {attempt.messages.map((message) => (
                  <div
                    className={`taste-message taste-message--${message.speaker}`}
                    key={message.id}
                  >
                    <span>{message.speaker === "you" ? youLabel : herLabel}</span>
                    <p>{message.body}</p>
                  </div>
                ))}
                {session.isSubmitting && (
                  <div className="taste-message">
                    <span>{herLabel}</span>
                    <p className="taste-thinking" aria-label="She is typing">
                      <i />
                      <i />
                      <i />
                    </p>
                  </div>
                )}
              </div>

              {attempt.status === "error" && session.judgeFailure ? (
                <div className="taste-judge-error" role="alert">
                  <strong>
                    <WarningCircle size={18} weight="fill" /> The judge dropped the
                    moment — your conversation is saved.
                  </strong>
                  <p>{session.judgeFailure.message}</p>
                  <div className="taste-judge-error__actions">
                    {session.judgeFailure.retryable && (
                      <button type="button" onClick={session.retryJudgment}>
                        Retry judgment
                      </button>
                    )}
                    <button
                      type="button"
                      style={{ background: "transparent", color: "var(--ink)" }}
                      onClick={session.reset}
                    >
                      Start over
                    </button>
                  </div>
                </div>
              ) : session.isJudging ? (
                <div className="taste-judging" aria-live="polite">
                  <strong>Reading the moment…</strong>
                  <p>
                    The judge is scoring all three turns against the rubric — not
                    vibes. Ten seconds of patience for an honest read.
                  </p>
                </div>
              ) : (
                <form
                  className="taste-response"
                  onSubmit={(event) => {
                    event.preventDefault();
                    session.submit();
                  }}
                >
                  <label htmlFor="practice-response-input">{promptLabel}</label>
                  <textarea
                    id="practice-response-input"
                    value={session.input}
                    onChange={(event) => session.setInput(event.target.value)}
                    rows={4}
                    disabled={busy}
                    aria-invalid={Boolean(session.inputError)}
                    aria-describedby="practice-response-count"
                    placeholder={
                      isInPerson
                        ? "Say it out loud first. If it sounds weird spoken, it is weird."
                        : "Text like you actually text. Lowercase is fine."
                    }
                  />
                  <div>
                    <span id="practice-response-count">
                      {session.inputError ? (
                        <span role="alert" style={{ color: "var(--oxblood)" }}>
                          {session.inputError}
                        </span>
                      ) : (
                        `${session.input.length}/${MAX_RESPONSE_LENGTH}`
                      )}
                    </span>
                    <button type="submit" disabled={busy || !session.input.trim()}>
                      {turnsDone >= 2 ? "Finish and score" : "Send response"}
                      <ArrowRight size={18} weight="bold" />
                    </button>
                  </div>
                </form>
              )}

              {attempt.userTurn === 0 && !session.isSubmitting && (
                <p style={{ color: "#766e61", fontSize: 11, marginTop: 14 }}>
                  <CheckCircle size={13} weight="fill" /> Three turns. She reacts to
                  what you actually write — then the judge scores the whole moment.
                </p>
              )}
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
