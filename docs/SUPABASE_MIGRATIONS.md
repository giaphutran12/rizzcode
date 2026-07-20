# Supabase migration delivery

RizzCode uses the same core database-delivery contract as the Blue Pearl front-end:
a pull-request dry-run gates merge, a serialized main-branch workflow applies
committed migrations, and a scheduled alarm reports migration-history drift.

## Non-negotiable rule

Never change the remote schema through a developer machine, agent tool, Supabase
Dashboard SQL editor, or Table Editor. Never run a remote `supabase db push`
manually.

All remote changes must follow this path:

1. Add a timestamped SQL file under `supabase/migrations/`.
2. Open a pull request to `main`.
3. Let `Supabase migration dry-run` compare local and remote history and run
   `supabase db push --dry-run`.
4. Merge only after that required check passes.
5. Let `Supabase Migrations CD` apply the migration from `main`.
6. Use the workflow run and before/after migration lists as the deployment receipt.

The production workflow refuses a manually dispatched non-`main` ref and serializes
all runs. It deliberately exposes no `--include-all` or migration-repair input.

## Required GitHub configuration

Store these values as GitHub Actions repository secrets so the PR gate, production
deployment, and drift alarm can all read them:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

Use the existing GitHub Actions environment named `Production`. The CD job targets
that environment. If production requires a human approval gate, add required
reviewers to it.

Add `Supabase migration dry-run` as a required status check on `main`. Restrict direct
pushes to `main`.

Do not put secret values in repository files, workflow output, pull-request text, or
screenshots.

## Workflow responsibilities

### Pull requests

`.github/workflows/supabase-migrations-ci.yml`:

- validates 14-digit migration IDs and rejects duplicates;
- rejects UTF-8 BOM bytes;
- links to the configured project without changing it;
- rejects unexplained local/remote migration-history drift;
- allows only migrations added by the current PR to be local-only;
- runs `supabase db push --dry-run`.

### Main branch

`.github/workflows/supabase-migrations-cd.yml`:

- runs only from `main`;
- serializes production migration deploys;
- records migration history before applying;
- applies committed migrations with `supabase db push`;
- records migration history afterward.

### Drift monitoring

`.github/workflows/supabase-migration-drift.yml` runs daily at 13:00 UTC and can also
be dispatched manually. It opens or updates a GitHub issue when the repository and
remote migration histories differ, then fails visibly.

## Failure handling

If CI or CD reports drift, stop. Do not use `supabase migration repair`,
`--include-all`, or a direct Dashboard change as a shortcut.

Investigate the exact local and remote version rows. Restore a missing repository
receipt or add a reviewed corrective migration. Any true history repair requires a
separate incident record, exact version IDs, independent review, and a workflow-only
execution path.

This follows Supabase's production recommendation to deploy migrations through CI/CD
instead of a local machine and its migration rule that remote schema changes must be
represented by version-controlled migration files.

Official references:

- [Managing environments with GitHub Actions](https://supabase.com/docs/guides/deployment/managing-environments)
- [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase CLI `db push`](https://supabase.com/docs/reference/cli/v1/supabase-db-push)
