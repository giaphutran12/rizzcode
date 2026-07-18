# RizzCode MVP implementation notes

This document describes the GPT comparison build on
`codex/rizzcode-mvp-gpt`. The canonical behavior remains
[RIZZCODE_MASTER_PLAN.md](RIZZCODE_MASTER_PLAN.md).

## Judge integrity

The browser calls `POST /api/judge` with `schemaVersion`, `attemptId`,
`scenarioId`, and one to three contiguous user responses. One response is valid
only for an authored early exit or boundary ending.

The server:

1. Parses a strict request schema and rejects extra authority fields.
2. Loads the canonical scenario.
3. Replays the shared deterministic persona engine.
4. Detects hard gates before the provider call.
5. Calls the direct OpenAI provider through Vercel AI SDK v6.
6. Requires atomic structured output through `generateText()` and
   `Output.object()`.
7. Verifies five unique criteria and exact transcript excerpts.
8. Rejects unsupported outcome claims.
9. Recalculates raw score, caps, final score, and verdict.
10. Leaves XP calculation to the application domain.

The provider has no tools, browsing, memory, or client credential access. A
logical judgment operation performs one request and at most one transient
retry. An explicit UI retry starts a new operation over immutable responses.

## Practice state and races

Normal practice moves through:

```text
active
  -> awaiting_reply
  -> active
  -> awaiting_reply
  -> active
  -> awaiting_reply
  -> awaiting_judgment
  -> complete | error
```

The first accepted response is turn one. Submit is guarded synchronously before
the persona delay, so a double click cannot append twice. Reset changes both the
attempt ID and operation token, which discards stale persona or judge results.
A completed attempt rejects further submissions.

## Progress authority

Mastery XP is:

```text
finalScore * 10 + difficultyBonus
```

Only improvement beyond the prior scenario mastery value is added. The first
valid completion adds ten XP. Stop-level results add zero XP and do not unlock
the next scenario. Rewarded attempt IDs prevent duplicate XP when judgment is
retried or a response is replayed.

Private milestones are stored in a separate record and never enter the XP or
demo leaderboard calculation.

## Test boundary

Vitest covers domain rules, canonical scenario replay, hard gates, exact
evidence, server-owned arithmetic, XP anti-farming, unlocks, corrupt storage,
storage failure, mode-specific UI, onboarding skip, provider failure, malformed
provider output, and the required acceptance anchors.

Playwright runs the full UI against the real Express route with a mock provider
selected only in a non-production server process. Production ignores
`RIZZCODE_MOCK_JUDGE`, so the official path remains the configured LLM provider.
