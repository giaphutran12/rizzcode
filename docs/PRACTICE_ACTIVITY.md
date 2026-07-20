# Practice activity contributions

## Definition

One contribution is one practice attempt that reached a schema-validated official
judgment. Provider failures, malformed output, timeouts, and other unscored states do
not count. Stop-level results do count as completed practice, even though they award
zero XP.

Activity is grouped by the user's local calendar date captured when the judgment
completes. The progress surface shows the latest 53 calendar weeks with these visible
intensity levels:

- 0 completed attempts
- 1 completed attempt
- 2 completed attempts
- 3 completed attempts
- 4 or more completed attempts

Every day exposes an accessible date-and-count label. Future cells are visually empty,
the grid scrolls horizontally on narrow screens and initially positions the current
week in view, and the legend states the intensity semantics.

## Guest persistence and account inheritance

Guests store a schema-validated `rizzcode.v1.activity` ledger locally. Each entry
contains only attempt ID, scenario ID, completion timestamp, and captured local date;
it does not duplicate conversation text.

On sign-in, the existing account sync merges guest and Supabase account activity by
stable attempt ID. The same attempt present on both sides contributes once. The merged
ledger is upserted into `rizzcode_practice_activity` under an RLS-protected
`(user_id, attempt_id)` primary key and also included in the versioned account state.
Independent device writes cannot erase another device's contribution rows, and a
fresh signed-in device restores their union. The dedicated ledger is not truncated
with the 100 most recent attempt transcripts.

The browser tags its local cache as guest-owned or with the authenticated user ID.
Signing out clears the account-owned cache before guest practice begins. Switching
directly between two accounts also discards the prior account cache instead of
inheriting it into the next account. Account deletion removes the activity key and
ownership marker along with the other local records.

Legacy completed attempts are backfilled into the ledger when their stored result and
completion timestamp are valid. A damaged activity record is reset independently
without discarding XP, profile, attempts, or milestones.

This is personal progress history, not a public or tamper-proof leaderboard claim.
