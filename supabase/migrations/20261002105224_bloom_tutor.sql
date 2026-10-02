-- Bloom: Curio's AI study buddy (Deep Learn), phase 1 storage.
--
-- Everything here is written by the signed-in learner's own session via the
-- Next.js API (app/api/bloom/*), never with the service-role key, so RLS is
-- what keeps each learner to their own rows. Nothing existing is touched.

create table public.bloom_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index bloom_conversations_user_idx on public.bloom_conversations (user_id, created_at desc);

-- One row per question + answer. `reply` holds Claude's content blocks exactly
-- as the API returned them: later turns replay them verbatim, which is what
-- keeps the model's earlier reasoning valid. Rows are append-only.
create table public.bloom_turns (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.bloom_conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  grade smallint not null check (grade between 1 and 12),
  question text not null,
  context text,          -- app note sent as a system message (grade), null when unchanged
  reply jsonb not null,
  reply_text text not null,
  model text,
  usage jsonb,
  created_at timestamptz not null default now()
);
create index bloom_turns_conversation_idx on public.bloom_turns (conversation_id, id);
create index bloom_turns_user_idx on public.bloom_turns (user_id, created_at desc);

-- Daily message allowance, counted per South African calendar day.
create table public.bloom_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  messages integer not null default 0,
  primary key (user_id, day)
);

alter table public.bloom_conversations enable row level security;
alter table public.bloom_turns enable row level security;
alter table public.bloom_usage enable row level security;

-- Logged-out visitors get nothing; learners can never edit or delete history,
-- and can only move their allowance through bloom_use_message().
revoke all on public.bloom_conversations, public.bloom_turns, public.bloom_usage from anon;
revoke update, delete, truncate on public.bloom_conversations, public.bloom_turns, public.bloom_usage from authenticated;
revoke insert on public.bloom_usage from authenticated;

create policy "bloom_conversations: read own" on public.bloom_conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "bloom_conversations: start own" on public.bloom_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "bloom_turns: read own" on public.bloom_turns
  for select to authenticated using (user_id = (select auth.uid()));
create policy "bloom_turns: add to own conversation" on public.bloom_turns
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.bloom_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create policy "bloom_usage: read own" on public.bloom_usage
  for select to authenticated using (user_id = (select auth.uid()));

-- Atomically counts one message against today's allowance. Returns the number
-- used today including this one, or -1 when the limit was already reached.
-- Calling it directly can only ever use up the caller's own allowance.
create or replace function public.bloom_use_message(p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := (now() at time zone 'Africa/Johannesburg')::date;
  v_used integer;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if p_limit is null or p_limit < 1 then
    return -1;
  end if;

  insert into public.bloom_usage as u (user_id, day, messages)
  values (v_uid, v_day, 1)
  on conflict (user_id, day) do update
    set messages = u.messages + 1
    where u.messages < p_limit
  returning u.messages into v_used;

  return coalesce(v_used, -1);
end;
$$;

revoke all on function public.bloom_use_message(integer) from public, anon;
grant execute on function public.bloom_use_message(integer) to authenticated;
