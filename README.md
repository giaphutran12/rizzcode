# RizzCode

RizzCode is LeetCode-style practice for dating and grounded social fluency. This
GPT comparison build implements the approved MVP contract in
[docs/RIZZCODE_MASTER_PLAN.md](docs/RIZZCODE_MASTER_PLAN.md) while preserving
the Taste visual direction.

## What is implemented

- Four-question onboarding, skip path, personalized starting module, two skill
  priorities, Growth Direction, and one optional Side Quest
- Spark and Connection curriculum with locked, available, and complete states
- Exactly ten playable In Person and Messaging scenarios
- Exactly three user-authored responses in a normal attempt
- Canonical deterministic persona reactions after every accepted response
- Server-only LLM judge using Vercel AI SDK v6, `@ai-sdk/openai`, Zod,
  `generateText()`, and `Output.object()`
- Five evidence-backed rubric criteria, deterministic gates and arithmetic, and
  FUMBLED, COOKED, or ATE verdicts
- Likely simulated outcomes, improved-response coaching, XP, levels, streaks,
  personal bests, achievements, and sequential unlocks
- Demo leaderboard choice A using practice XP only
- Private self-reported real-world milestones that add zero public XP
- Versioned local persistence, isolated corrupt-record recovery, storage
  warnings, judge retry, unknown-route handling, and authored persona fallback
- Responsive and keyboard-usable product views at mobile, tablet, and desktop
  sizes, with reduced-motion support

The historical `/control` and `/compare` prototype routes remain available as
visual references. They are not the production product path.

## Run locally

Install dependencies:

```bash
npm install
```

Create a private `.env.local` in this worktree:

```bash
cp .env.example .env.local
```

Set `OPENAI_API_KEY` inside `.env.local`. The optional
`RIZZCODE_JUDGE_MODEL` defaults to `gpt-5.4`.

Then run:

```bash
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

To use the existing ignored environment file in the original checkout without
copying it:

```bash
RIZZCODE_ENV_FILE=/Users/edwardtran/side-projects/leetcode-for-dating/.env.local npm run dev
```

The server loads that file for execution only. It never prints or sends the key
to the browser. Without a server-side key, all product views and persona
reactions still work, but official judgment remains unscored and offers
`Retry judgment`.

## Verification

```bash
npm run test
npm run test:e2e
npm run check
npm run build
```

The Playwright suite starts the server with a server-boundary mock judge. It
checks the full first-visit flow, exactly three turns, double-submit prevention,
persistence after refresh, Messaging mode, unknown routes, judge failure, and
375px, 768px, and 1440px layouts.

An opt-in live provider smoke test is available:

```bash
RIZZCODE_ENV_FILE=/absolute/path/to/.env.local npm run test:live-judge
```

It prints only pass or failure metadata, never the credential or transcript.

## Runtime architecture

- `server/index.ts` serves the Vite app and owns `POST /api/judge`.
- `server/judge/provider.ts` is the only production provider path.
- `server/judge/service.ts` reconstructs the canonical transcript, runs hard
  gates, invokes the provider, validates evidence, recalculates scores, applies
  caps, and derives the verdict.
- `src/engine/conversationEngine.ts` is shared deterministic persona logic used
  by the browser and server replay.
- `src/domain/` owns pure scoring, XP, onboarding, validation, and unlock logic.
- `src/storage/stores.ts` owns the four versioned local records.

Browser requests contain only the scenario ID, attempt ID, and bounded
user-authored responses. Client-supplied persona replies, scores, XP, gates,
outcomes, and leaderboard values are rejected.

## Local persistence

The MVP stores no secrets and uses only:

- `rizzcode.v1.profile`
- `rizzcode.v1.progress`
- `rizzcode.v1.attempts`
- `rizzcode.v1.milestones`

At most 100 attempts are retained. A malformed record resets only itself. If
storage is unavailable, practice continues in memory with a visible warning.

## Deliberately outside this MVP

Authentication, Supabase, TinyFish, profile scraping, voice, avatars, video,
live humans, automated messages, a real global leaderboard, course
infrastructure, attractiveness scoring, therapy, and attachment diagnosis are
not included.
