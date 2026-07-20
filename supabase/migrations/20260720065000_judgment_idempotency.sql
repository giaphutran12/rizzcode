create table public.rizzcode_judgments (
  attempt_id text primary key,
  scenario_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  transcript_hash text not null,
  claim_token uuid not null default gen_random_uuid(),
  status text not null check (status in ('pending', 'completed')),
  result jsonb,
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and result is null)
    or (status = 'completed' and result is not null)
  )
);

create index rizzcode_judgments_user_updated_idx
  on public.rizzcode_judgments (user_id, updated_at desc)
  where user_id is not null;

alter table public.rizzcode_judgments enable row level security;

revoke all on table public.rizzcode_judgments
  from public, anon, authenticated;
grant select, insert, update, delete on table public.rizzcode_judgments
  to service_role;

create or replace function public.claim_rizzcode_judgment(
  p_attempt_id text,
  p_scenario_id text,
  p_transcript_hash text,
  p_user_id uuid default null
)
returns table (claim_status text, stored_result jsonb, lease_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.rizzcode_judgments%rowtype;
  inserted_attempt_id text;
  inserted_claim_token uuid;
begin
  insert into public.rizzcode_judgments (
    attempt_id,
    scenario_id,
    user_id,
    transcript_hash,
    status
  ) values (
    p_attempt_id,
    p_scenario_id,
    p_user_id,
    p_transcript_hash,
    'pending'
  )
  on conflict (attempt_id) do nothing
  returning attempt_id, claim_token
    into inserted_attempt_id, inserted_claim_token;

  if inserted_attempt_id is not null then
    return query select 'claimed'::text, null::jsonb, inserted_claim_token;
    return;
  end if;

  select * into existing
  from public.rizzcode_judgments
  where attempt_id = p_attempt_id
  for update;

  if existing.scenario_id <> p_scenario_id
    or existing.transcript_hash <> p_transcript_hash then
    return query select 'conflict'::text, null::jsonb, null::uuid;
    return;
  end if;

  if existing.status = 'completed' then
    if existing.user_id is null and p_user_id is not null then
      update public.rizzcode_judgments
      set user_id = p_user_id, updated_at = now()
      where attempt_id = p_attempt_id;
    end if;
    return query select 'completed'::text, existing.result, null::uuid;
    return;
  end if;

  if existing.claimed_at < now() - interval '60 seconds' then
    update public.rizzcode_judgments
    set
      user_id = coalesce(user_id, p_user_id),
      claim_token = gen_random_uuid(),
      claimed_at = now(),
      updated_at = now()
    where attempt_id = p_attempt_id;
    select claim_token into inserted_claim_token
    from public.rizzcode_judgments
    where attempt_id = p_attempt_id;
    return query select 'claimed'::text, null::jsonb, inserted_claim_token;
    return;
  end if;

  return query select 'pending'::text, null::jsonb, null::uuid;
end;
$$;

revoke all on function public.claim_rizzcode_judgment(text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_rizzcode_judgment(text, text, text, uuid)
  to service_role;

alter table public.rizzcode_conversation_events
  drop constraint rizzcode_conversation_events_event_type_check;

alter table public.rizzcode_conversation_events
  add constraint rizzcode_conversation_events_event_type_check check (
    event_type in (
      'persona.turn.completed',
      'persona.provider.failed',
      'judge.started',
      'judge.completed',
      'judge.failed',
      'judge.reused'
    )
  );

comment on table public.rizzcode_judgments is
  'Server-owned idempotency and validated result cache for official judgments.';

create table public.rizzcode_practice_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id text not null,
  scenario_id text not null,
  completed_at timestamptz not null,
  local_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, attempt_id)
);

create index rizzcode_practice_activity_user_local_date_idx
  on public.rizzcode_practice_activity (user_id, local_date desc);

alter table public.rizzcode_practice_activity enable row level security;

revoke all on table public.rizzcode_practice_activity from anon;
grant select, insert, update, delete
  on table public.rizzcode_practice_activity
  to authenticated;

create policy "Users can read their own RizzCode practice activity"
  on public.rizzcode_practice_activity
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own RizzCode practice activity"
  on public.rizzcode_practice_activity
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own RizzCode practice activity"
  on public.rizzcode_practice_activity
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own RizzCode practice activity"
  on public.rizzcode_practice_activity
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.rizzcode_practice_activity is
  'Per-attempt activity ledger for cross-device contribution history.';
