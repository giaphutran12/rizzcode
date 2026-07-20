# RizzCode Agent Contract

## Brand system

For any user-facing design or UI work:

1. Read `docs/BRAND_SYSTEM.md`.
2. Use the canonical exports from `@/design-system`.
3. Use `BrandLogo`; never recreate the old `RC` text badge.
4. Use tokens from `src/design-system/tokens.css`. Do not add raw colors,
   one-off spacing scales, fonts, radii, shadows, or motion curves in features.
5. Use Phosphor for standard interface icons.
6. Extend the design system before inventing a feature-only primitive.
7. Check the living inventory at `/brand-system`.
8. Run `npm run check:brand`, `npm run check`, and `npm run build`.

The Rizz Meter is the master identity. The rank chevron is an in-product
progression motif. Patch Notes cursor +1 is a campaign motif. Neither supporting
motif replaces the master logo.

## Product voice

RizzCode is direct, grounded, playful, and respectful. It teaches conversational
skill through realistic reps. It does not coach manipulation, sexual pressure,
pickup tactics, or fake personas.

## Database migrations

Never apply a remote Supabase migration from a developer machine, agent tool,
Dashboard SQL editor, or Table Editor. All remote schema changes must be committed
under `supabase/migrations/`, pass the pull-request migration dry-run, and be applied
by the main-branch Supabase Migrations CD workflow.

Do not use `supabase db push --include-all` or `supabase migration repair` unless a
separate, reviewed incident-recovery change explicitly authorizes the exact versions.
