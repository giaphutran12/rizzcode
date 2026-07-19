import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Fire,
  Heart,
  ShieldCheck,
  Target,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { navigate } from "../router";
import { useProgressStore } from "../hooks/useProgress";
import { scenarios } from "../data/scenarios";
import { nextScenarioId } from "../domain/unlocks";
import "../styles/taste.css";
import "../styles/app.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const accordionStories = [
  {
    title: "Open with presence",
    copy: "Notice what is already true in the moment. A shared table is enough reason to begin.",
    image: "https://picsum.photos/seed/open-source-demo-table/1200/1500",
  },
  {
    title: "Follow the thread",
    copy: "Ask one question you genuinely want answered, then let her response change the conversation.",
    image: "https://picsum.photos/seed/quiet-cafe-conversation/1200/1500",
  },
  {
    title: "Invite with clarity",
    copy: "When interest feels mutual, make a specific, low-pressure invitation that leaves room for an honest answer.",
    image: "https://picsum.photos/seed/courtyard-coffee-invitation/1200/1500",
  },
];

const marqueePhrases = [
  "Respect before performance",
  "Curiosity without tactics",
  "Humor without pressure",
  "Confidence with character",
];

export function TasteExperience() {
  const pageRef = useRef<HTMLElement>(null);
  const desireRef = useRef<HTMLElement>(null);
  const [activeAccordion, setActiveAccordion] = useState(0);
  const { progress, profile, warning } = useProgressStore();

  const featured = scenarios[1]; // open-source social — the hero flavor
  const firstScenario = scenarios[0];
  const orderedIds = scenarios.map((scenario) => scenario.id);
  const nextId = nextScenarioId(progress.completedScenarioIds, orderedIds);
  const nextScenario =
    scenarios.find((scenario) => scenario.id === nextId) ?? firstScenario;
  const isReturning = progress.completedScenarioIds.length > 0 || progress.publicXP > 0;
  const ctaTarget = profile.onboardingComplete
    ? `/practice/${nextScenario.id}`
    : "/onboarding";

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(min-width: 960px)", () => {
        ScrollTrigger.create({
          trigger: desireRef.current,
          start: "top top+=112",
          end: "bottom bottom-=80",
          pin: ".taste-desire__narrative",
          pinSpacing: false,
        });
      });

      gsap.utils
        .toArray<HTMLElement>(".taste-reveal-image")
        .forEach((image) => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: image,
                start: "top 92%",
                end: "bottom 8%",
                scrub: 0.7,
              },
            })
            .fromTo(
              image,
              { scale: 0.82, opacity: 0.42 },
              { scale: 1, opacity: 1, ease: "none", duration: 0.55 },
            )
            .to(image, {
              scale: 1.055,
              opacity: 0.2,
              ease: "none",
              duration: 0.45,
            });
        });

      return () => media.revert();
    },
    { scope: pageRef },
  );

  const go = (to: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <main ref={pageRef} className="taste-page">
      <header className="taste-nav">
        <a
          className="taste-nav__brand"
          href="/"
          aria-label="RizzCode home"
          onClick={go("/")}
        >
          <span aria-hidden="true">RC</span>
          <strong>RizzCode</strong>
        </a>
        <nav aria-label="RizzCode navigation">
          <a href="#approach">Approach</a>
          <a href="/practice" onClick={go("/practice")}>
            Practice
          </a>
          <a href="/leaderboard" onClick={go("/leaderboard")}>
            Leaderboard
          </a>
        </nav>
        <a className="taste-nav__switch" href={ctaTarget} onClick={go(ctaTarget)}>
          Start practice
          <ArrowUpRight size={17} weight="bold" />
        </a>
      </header>

      <section className="taste-hero" aria-labelledby="taste-hero-title">
        <div className="taste-hero__wash" aria-hidden="true" />
        <div className="taste-hero__copy">
          <p className="taste-kicker">LeetCode-style reps for dating</p>
          <h1 id="taste-hero-title">
            <span>Practice courage.</span>
            <span>Meet someone</span>
            <span className="taste-hero__intent">with intention.</span>
          </h1>
          <p className="taste-hero__lede">
            RizzCode is three-turn practice for real social moments: what you
            notice, how you listen, and whether your invitation honors the
            person in front of you. No scripts, no games, no pretending.
          </p>
          <div className="taste-hero__actions">
            <a
              className="taste-button taste-button--ink"
              href={ctaTarget}
              onClick={go(ctaTarget)}
            >
              {isReturning ? "Resume practice" : "Enter your first scenario"}
              <ArrowRight size={19} weight="bold" />
            </a>
            <a className="taste-button taste-button--quiet" href="#approach">
              See how practice works
            </a>
          </div>
        </div>

        <figure className="taste-hero__figure">
          <div className="taste-hero__image-wrap">
            <img
              className="taste-hero__image"
              src="https://picsum.photos/seed/open-source-social-evening/1500/1800"
              alt="A warm evening gathering with space for a thoughtful conversation"
            />
          </div>
          <figcaption>
            <div>
              <span>Tonight’s scenario</span>
              <strong>{featured.title}</strong>
            </div>
            <p>{featured.setting}</p>
          </figcaption>
        </figure>
      </section>

      <section
        id="approach"
        className="taste-interest"
        aria-labelledby="taste-interest-title"
      >
        <div className="taste-section-heading">
          <p className="taste-kicker">Build relational fluency</p>
          <h2 id="taste-interest-title">
            The soft skills behind{" "}
            <span
              className="taste-inline-image taste-inline-image--books"
              aria-hidden="true"
            />{" "}
            a brave first move.
          </h2>
          <p>
            Two modules. Spark teaches the first moment; Connection teaches
            everything after. Every scenario is judged on evidence, not vibes.
          </p>
        </div>

        <div className="taste-bento">
          <article className="taste-bento__card taste-bento__card--scenario">
            <div className="taste-card-heading">
              <Target size={25} weight="duotone" />
              <span>Practice in context</span>
            </div>
            <div>
              <h3>{firstScenario.title}</h3>
              <p>{firstScenario.premise}</p>
            </div>
            <ul>
              {firstScenario.visibleContext.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="taste-bento__card taste-bento__card--image">
            <img
              className="taste-reveal-image"
              src="https://picsum.photos/seed/vietnamese-literature-table/1200/1400"
              alt="Books and notes arranged for an attentive conversation"
            />
            <div>
              <BookOpen size={24} weight="duotone" />
              <p>
                Learn to follow what matters to her, not the line you planned
                before the conversation began.
              </p>
            </div>
          </article>

          <article className="taste-bento__card taste-bento__card--principle">
            <ShieldCheck size={27} weight="duotone" />
            <h3>Fun is the game. Respect is the floor.</h3>
            <p>
              Humor and forward motion raise your score. Pressure, deception,
              or an ignored boundary ends the attempt — every time.
            </p>
          </article>

          <article className="taste-bento__card taste-bento__card--character">
            <Heart size={27} weight="duotone" />
            <h3>Character shapes the posture.</h3>
            <p>
              Good dating starts with dignity, honesty, and the self-control to
              choose clarity over pressure.
            </p>
          </article>

          <article className="taste-bento__card taste-bento__card--progress">
            <div className="taste-card-heading">
              <CheckCircle size={25} weight="duotone" />
              <span>Practice that compounds</span>
            </div>
            <h3>One honest rep at a time.</h3>
            <div className="taste-mini-curriculum">
              <div>
                <span>Module 01</span>
                <p>Spark — openers, banter, calibrated asks</p>
              </div>
              <div>
                <span>Module 02</span>
                <p>Connection — threads, callbacks, invitations</p>
              </div>
              <div>
                <span>Judged</span>
                <p>Five criteria, real evidence, XP that means something</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="taste-accordion-section" aria-label="Practice method">
        <div className="taste-accordion">
          {accordionStories.map((story, index) => {
            const isActive = activeAccordion === index;

            return (
              <button
                className="taste-accordion__panel"
                data-active={isActive}
                key={story.title}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveAccordion(index)}
                onMouseEnter={() => setActiveAccordion(index)}
                onFocus={() => setActiveAccordion(index)}
              >
                <img src={story.image} alt="" />
                <span className="taste-accordion__shade" />
                <span className="taste-accordion__content">
                  <strong>{story.title}</strong>
                  <span className="taste-accordion__copy">{story.copy}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="taste-marquee" aria-label="RizzCode principles">
        <div className="taste-marquee__track">
          {[...marqueePhrases, ...marqueePhrases].map((phrase, index) => (
            <span key={`${phrase}-${index}`}>
              {phrase}
              <span aria-hidden="true">+</span>
            </span>
          ))}
        </div>
      </div>

      <section
        ref={desireRef}
        id="practice"
        className="taste-desire"
        aria-labelledby="taste-practice-title"
      >
        <div className="taste-desire__grid">
          <div className="taste-desire__narrative">
            <p className="taste-kicker">Your next rep</p>
            <h2 id="taste-practice-title">
              You do not need a perfect line.
            </h2>
            <p>
              You need enough calm to listen, enough courage to be clear, and
              enough humility to receive her answer. Three turns. Then an
              honest judge tells you exactly what landed.
            </p>
            <div className="taste-desire__progress">
              <div>
                <span>Your progress</span>
                <strong>
                  {progress.completedScenarioIds.length}/{scenarios.length} scenarios ·{" "}
                  Level {progress.level}
                </strong>
              </div>
              <div className="taste-progress-track" aria-hidden="true">
                <span
                  style={{
                    width: `${(progress.completedScenarioIds.length / scenarios.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            {isReturning && (
              <div className="taste-stat-row" style={{ marginTop: 22 }}>
                <span className="taste-stat">
                  XP <strong>{progress.publicXP}</strong>
                </span>
                <span className="taste-stat">
                  <Fire size={15} weight="fill" /> Streak{" "}
                  <strong>{progress.streak}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="taste-desire__practice">
            <article className="taste-practice-card taste-practice-card--context">
              <div className="taste-practice-card__topline">
                <span>{isReturning ? "Up next for you" : "Start here"}</span>
                <strong>{nextScenario.difficulty}</strong>
              </div>
              <h3>{nextScenario.title}</h3>
              <p>{nextScenario.objective}</p>
              <div className="taste-context-list">
                <span>
                  <CheckCircle size={17} weight="fill" />
                  {nextScenario.mode === "in_person" ? "In person" : "Messaging"}
                </span>
                {nextScenario.boundaries.map((boundary) => (
                  <span key={boundary}>
                    <CheckCircle size={17} weight="fill" />
                    {boundary}
                  </span>
                ))}
              </div>
              <div className="taste-result-actions" style={{ marginTop: 30 }}>
                <a
                  className="taste-button taste-button--lime"
                  href={ctaTarget}
                  onClick={go(ctaTarget)}
                >
                  {profile.onboardingComplete
                    ? "Enter the scenario"
                    : "Start with four questions"}
                  <ArrowRight size={18} weight="bold" />
                </a>
                <a
                  className="taste-button taste-button--quiet"
                  style={{ color: "#fff8ed", borderColor: "rgba(255,248,237,0.5)" }}
                  href="/practice"
                  onClick={go("/practice")}
                >
                  Browse all ten
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer className="taste-footer">
        <div className="taste-footer__ambient" aria-hidden="true" />
        <div className="taste-footer__copy">
          <p>Practice for the relationship you actually want.</p>
          <h2>
            Less performance.
            <br />
            More courage.
          </h2>
          <a
            className="taste-button taste-button--lime"
            href={ctaTarget}
            onClick={go(ctaTarget)}
          >
            Begin the conversation
            <ArrowRight size={20} weight="bold" />
          </a>
        </div>
        <div className="taste-footer__bottom">
          <a
            className="taste-nav__brand"
            href="/"
            aria-label="RizzCode home"
            onClick={go("/")}
          >
            <span aria-hidden="true">RC</span>
            <strong>RizzCode</strong>
          </a>
          <p>Respectful relationship practice for men who want something real.</p>
          <div>
            <a href="#approach">Approach</a>
            <a href="/practice" onClick={go("/practice")}>
              Practice
            </a>
          </div>
        </div>
      </footer>
      {warning && (
        <div className="taste-storage-warning" role="status">
          {warning}
        </div>
      )}
    </main>
  );
}
