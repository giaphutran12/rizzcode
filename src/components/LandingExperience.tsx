import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Heart,
  ShieldCheck,
  Target,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { curriculum, scenario } from "../data/prototype";
import { scenarioById } from "../data/scenarios";
import { nextRecommendedScenarioId } from "../domain/progression";
import { useProgress } from "../hooks/useProgress";
import { difficultyLabel, modeLanguage } from "./practice/modeLanguage";
import "../styles/taste.css";

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
  "Clarity without pressure",
  "Confidence with character",
];

export function LandingExperience() {
  const pageRef = useRef<HTMLElement>(null);
  const desireRef = useRef<HTMLElement>(null);
  const [activeAccordion, setActiveAccordion] = useState(0);

  const { profile, progress, plan, persistent } = useProgress();
  const nextId = nextRecommendedScenarioId(progress, plan);
  const nextScenario = scenarioById(nextId) ?? scenarioById(scenario.id);
  // Before onboarding, send people through the four-question warm-up; once
  // they've done it, the primary CTA drops them straight into tonight's rep.
  const primaryTarget = profile.onboardingComplete
    ? `/practice/${nextId}`
    : "/onboarding";
  const primaryLabel = profile.onboardingComplete
    ? "Run tonight’s scenario"
    : "Start with four questions";
  const isReturning =
    progress.publicXP > 0 || progress.completedScenarioIds.length > 0;

  const tonight = nextScenario;
  const tonightMode = tonight ? modeLanguage(tonight.mode) : null;

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

  return (
    <main ref={pageRef} className="taste-page">
      <header className="taste-nav">
        <Link className="taste-nav__brand" to="/" aria-label="RizzCode home">
          <span aria-hidden="true">RC</span>
          <strong>RizzCode</strong>
        </Link>
        <nav aria-label="RizzCode navigation">
          <a href="#approach">Approach</a>
          <a href="#practice">Tonight</a>
          <Link to="/practice">Curriculum</Link>
        </nav>
        <Link className="taste-nav__switch" to={primaryTarget}>
          Start practice
          <ArrowUpRight size={17} weight="bold" />
        </Link>
      </header>

      <section className="taste-hero" aria-labelledby="taste-hero-title">
        <div className="taste-hero__wash" aria-hidden="true" />
        <div className="taste-hero__copy">
          <p className="taste-kicker">Relationship practice for men</p>
          <h1 id="taste-hero-title">
            <span>Practice courage.</span>
            <span>Meet someone</span>
            <span className="taste-hero__intent">with intention.</span>
          </h1>
          <p className="taste-hero__lede">
            RizzCode helps men rehearse honest conversations, read reciprocity,
            and make respectful invitations without scripts, games, or
            pretending to be someone else.
          </p>
          {isReturning ? (
            <div className="taste-stat-strip" aria-label="Your progress">
              <div>
                <span>Level</span>
                <strong>{progress.level}</strong>
              </div>
              <div>
                <span>Practice XP</span>
                <strong>{progress.publicXP}</strong>
              </div>
              <div>
                <span>Streak</span>
                <strong>
                  {progress.streak} {progress.streak === 1 ? "day" : "days"}
                </strong>
              </div>
            </div>
          ) : null}
          <div className="taste-hero__actions">
            <Link className="taste-button taste-button--ink" to={primaryTarget}>
              {primaryLabel}
              <ArrowRight size={19} weight="bold" />
            </Link>
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
              <strong>{tonight ? tonight.title : scenario.title}</strong>
            </div>
            <p>{tonight ? tonight.setting : scenario.place}</p>
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
            Practice the whole moment: what you notice, how you listen, and
            whether your invitation honors the person in front of you.
          </p>
        </div>

        <div className="taste-bento">
          <article className="taste-bento__card taste-bento__card--scenario">
            <div className="taste-card-heading">
              <Target size={25} weight="duotone" />
              <span>Practice in context</span>
            </div>
            <div>
              <h3>{scenario.title}</h3>
              <p>{scenario.premise}</p>
            </div>
            <ul>
              {scenario.context.map((item) => (
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
            <h3>Never a tactic.</h3>
            <p>
              Respect, consent, and an honest exit are part of every scenario,
              not fine print after the lesson.
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
              {curriculum.slice(0, 3).map((lesson) => (
                <div key={lesson.title}>
                  <span>{lesson.status}</span>
                  <p>{lesson.title}</p>
                </div>
              ))}
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
            <p className="taste-kicker">Tonight’s rep</p>
            <h2 id="taste-practice-title">
              {isReturning ? "Pick up where you left off." : "You don’t need a perfect line."}
            </h2>
            <p>
              You need enough calm to listen, enough courage to be clear, and
              enough humility to receive her answer. Three turns. RizzCode scores
              the posture behind your words, not a pickup script.
            </p>
            {!persistent ? (
              <p className="taste-storage-note" role="status">
                Heads up: your browser isn’t letting us save progress, so tonight
                stays on this device only. Everything still works.
              </p>
            ) : null}
          </div>

          <div className="taste-desire__practice">
            <article className="taste-tonight" aria-label="Tonight’s scenario">
              <div className="taste-tonight__topline">
                <span className="taste-badge" data-mode={tonight?.mode}>
                  {tonightMode ? tonightMode.badge : "IN PERSON"}
                </span>
                <strong>
                  {tonight ? difficultyLabel(tonight.difficulty) : "Easy"}
                </strong>
              </div>
              <p className="taste-tonight__eyebrow">
                {tonight?.module === "connection" ? "Connection" : "Spark"} · Next up
              </p>
              <h3>{tonight ? tonight.title : scenario.title}</h3>
              <p className="taste-tonight__premise">
                {tonight ? tonight.premise : scenario.premise}
              </p>
              <p className="taste-tonight__objective">
                <span>Your objective</span>
                {tonight ? tonight.objective : scenario.objective}
              </p>
              <div className="taste-tonight__actions">
                <Link className="taste-button taste-button--lime" to={primaryTarget}>
                  {primaryLabel}
                  <ArrowRight size={18} weight="bold" />
                </Link>
                <Link
                  id="curriculum"
                  className="taste-button taste-button--ghost"
                  to="/practice"
                >
                  See the full curriculum
                </Link>
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
          <Link className="taste-button taste-button--lime" to={primaryTarget}>
            {primaryLabel}
            <ArrowRight size={20} weight="bold" />
          </Link>
        </div>
        <div className="taste-footer__bottom">
          <Link className="taste-nav__brand" to="/" aria-label="RizzCode home">
            <span aria-hidden="true">RC</span>
            <strong>RizzCode</strong>
          </Link>
          <p>Respectful relationship practice for men who want something real.</p>
          <div>
            <a href="#approach">Approach</a>
            <Link to="/practice">Curriculum</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
