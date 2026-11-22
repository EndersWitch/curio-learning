-- Daily allowance for building Dry Run tests, and the "How was your quiz" rating.
create table public.test_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  builds integer not null default 0,
  primary key (user_id, day)
);
alter table public.test_usage enable row level security;
revoke all on public.test_usage from anon, authenticated;
grant select on public.test_usage to authenticated;
create policy "test_usage: read own" on public.test_usage for select to authenticated using (user_id = (select auth.uid()));

-- Counts one test against today's allowance. Returns builds used today including this one, or -1 at the limit.
create or replace function public.test_use_build(p_limit integer)
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
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_limit is null or p_limit < 1 then return -1; end if;
  insert into public.test_usage as u (user_id, day, builds) values (v_uid, v_day, 1)
  on conflict (user_id, day) do update set builds = u.builds + 1 where u.builds < p_limit
  returning u.builds into v_used;
  return coalesce(v_used, -1);
end;
$$;
revoke all on function public.test_use_build(integer) from public, anon;
grant execute on function public.test_use_build(integer) to authenticated;

create table public.test_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  triage text,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);
alter table public.test_feedback enable row level security;
revoke all on public.test_feedback from anon, authenticated;
grant select on public.test_feedback to authenticated;
grant insert (session_id, rating, comment) on public.test_feedback to authenticated;
grant all on public.test_feedback to service_role;
create policy "test_feedback: read own" on public.test_feedback for select to authenticated using (user_id = (select auth.uid()));
create policy "test_feedback: rate own marked test" on public.test_feedback for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status = 'marked'));
