-- A learner's own notes, used as source material when building a Dry Run test.
create table public.test_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 20 and 20000),
  created_at timestamptz not null default now()
);
create index test_notes_user_idx on public.test_notes (user_id, created_at desc);
alter table public.test_notes enable row level security;

create policy "own notes read" on public.test_notes for select to authenticated using (user_id = (select auth.uid()));
create policy "own notes delete" on public.test_notes for delete to authenticated using (user_id = (select auth.uid()));
create policy "own notes insert (max 20)" on public.test_notes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select count(*) from public.test_notes n where n.user_id = (select auth.uid())) < 20);

alter table public.test_sessions add column if not exists note_ids uuid[] not null default '{}';

revoke all on public.test_notes from anon, authenticated;
grant select, insert, delete on public.test_notes to authenticated;
grant all on public.test_notes to service_role;
-- learners may set note_ids when starting a session
grant insert (note_ids) on public.test_sessions to authenticated;
