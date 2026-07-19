"use client";

import {
  BrandBadge,
  BrandButton,
  BrandKicker,
  BrandLink,
  BrandLogo,
  BrandSurface,
  RizzMeter,
} from "@/design-system";
import "./showcase.css";

const colors = [
  ["Parchment", "Canvas", "var(--rc-color-parchment)"],
  ["Cream", "Raised surface", "var(--rc-color-cream)"],
  ["Ink", "Primary action", "var(--rc-color-ink)"],
  ["Oxblood", "Brand signal", "var(--rc-color-oxblood)"],
  ["Lime", "Progress earned", "var(--rc-color-lime)"],
] as const;

export function BrandSystemView() {
  return (
    <main className="rc-showcase">
      <header className="rc-showcase__hero">
        <a className="rc-brand-link" href="/" aria-label="RizzCode home">
          <BrandLogo className="rc-brand-logo" />
        </a>
        <div>
          <BrandKicker>Brand system · v1.0</BrandKicker>
          <h1>One identity. Every rep.</h1>
          <p>
            The live inventory for RizzCode product surfaces, campaigns, and
            future agent-built features.
          </p>
        </div>
      </header>

      <section className="rc-showcase__section">
        <BrandKicker>01 · Identity</BrandKicker>
        <div className="rc-showcase__logo-grid">
          <BrandSurface className="rc-showcase__logo-card">
            <BrandLogo variant="meter" className="rc-showcase__meter-logo" />
            <p>Hero wordmark</p>
          </BrandSurface>
          <BrandSurface className="rc-showcase__logo-card">
            <BrandLogo className="rc-showcase__lockup" />
            <p>Primary lockup</p>
          </BrandSurface>
          <BrandSurface className="rc-showcase__mark-card" tone="brand">
            <BrandLogo
              variant="mark"
              tone="inverse"
              className="rc-showcase__mark"
            />
            <p>Inverse mark</p>
          </BrandSurface>
        </div>
      </section>

      <section className="rc-showcase__section">
        <BrandKicker>02 · Color</BrandKicker>
        <div className="rc-showcase__swatches">
          {colors.map(([name, role, value]) => (
            <article key={name} className="rc-showcase__swatch">
              <span style={{ background: value }} />
              <strong>{name}</strong>
              <p>{role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rc-showcase__section rc-showcase__type">
        <BrandKicker>03 · Typography</BrandKicker>
        <h2>Practice until it feels natural.</h2>
        <h3>Good reps beat perfect lines.</h3>
        <p>
          Satoshi carries the product. Playfair marks moments of intent. Labels
          stay compact, uppercase, and direct.
        </p>
      </section>

      <section className="rc-showcase__section">
        <BrandKicker>04 · Product language</BrandKicker>
        <div className="rc-showcase__component-grid">
          <BrandSurface className="rc-showcase__component-card">
            <div className="rc-showcase__row">
              <BrandButton>Start practice</BrandButton>
              <BrandButton intent="secondary">See the loop</BrandButton>
              <BrandButton intent="lime">Claim XP</BrandButton>
            </div>
          </BrandSurface>
          <BrandSurface className="rc-showcase__component-card">
            <div className="rc-showcase__row">
              <BrandBadge tone="brand">In person</BrandBadge>
              <BrandBadge>Easy</BrandBadge>
              <BrandBadge tone="lime">+80 XP</BrandBadge>
            </div>
          </BrandSurface>
          <BrandSurface className="rc-showcase__component-card">
            <p className="rc-showcase__meter-label">Conversation calibration</p>
            <RizzMeter value={72} label="Conversation calibration at 72 percent" />
          </BrandSurface>
          <BrandSurface className="rc-showcase__component-card" tone="ink">
            <BrandKicker>Next rep</BrandKicker>
            <h3>Follow the thread.</h3>
            <p>Use what she actually said instead of reaching for a script.</p>
            <BrandLink intent="lime" href="/practice">
              Enter practice
            </BrandLink>
          </BrandSurface>
        </div>
      </section>

      <footer className="rc-showcase__footer">
        <BrandLogo
          className="rc-brand-logo rc-brand-logo--footer"
          tone="inverse"
        />
        <p>Build the reps. Keep the receipts.</p>
      </footer>
    </main>
  );
}
