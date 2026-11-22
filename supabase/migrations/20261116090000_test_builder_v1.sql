-- Bloom test builder v1: sessions, topics, questions, secret keys, mark points, answers, flags, verified definitions
-- (already applied to the live project; kept here so the repo matches the database)

create table public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  grade smallint check (grade between 1 and 12),
  subject text,
  scope_text text not null,
  length text not null check (length in ('short','medium','long')),
  question_mix jsonb not null default '{"mcq":true,"short":true,"long":false}'::jsonb,
  difficulty_mix jsonb not null default '{"easy":0.3,"medium":0.5,"hard":0.2}'::jsonb,
  status text not null default 'draft' check (status in ('draft','topics_ready','generating','ready','in_progress','submitted','marked','failed')),
  credit_cost integer not null default 0,
  marks_total integer,
  marks_awarded integer,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  marked_at timestamptz
);
create index test_sessions_user_idx on public.test_sessions (user_id, created_at desc);

create table public.test_topics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  position integer not null,
  title text not null,
  included boolean not null default true
);
create index test_topics_session_idx on public.test_topics (session_id, position);

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  topic_id uuid references public.test_topics(id) on delete set null,
  position integer not null,
  qtype text not null check (qtype in ('mcq','short','long')),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  question_text text not null,
  marks integer not null default 1 check (marks >= 1),
  options jsonb,
  retired boolean not null default false,
  created_at timestamptz not null default now()
);
create index test_questions_session_idx on public.test_questions (session_id, position);
create index test_questions_topic_idx on public.test_questions (topic_id);

-- Secrets: MCQ answer + explanation. Readable by the owner only after marking.
create table public.test_question_keys (
  question_id uuid primary key references public.test_questions(id) on delete cascade,
  mcq_correct text,
  explanation text
);

create table public.verified_definitions (
  id uuid primary key default gen_random_uuid(),
  grade smallint check (grade between 1 and 12),
  subject text not null,
  topic text,
  term text not null,
  definition_text text not null,
  source text,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (subject, grade, term)
);

-- Secrets: one row per mark. mode 'exact' is only allowed for verified wording.
create table public.test_mark_points (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.test_questions(id) on delete cascade,
  position integer not null,
  point_text text not null,
  mode text not null default 'concept' check (mode in ('concept','exact')),
  exact_text text,
  accepted_alternatives text[] not null default '{}',
  verified boolean not null default false,
  source_definition_id uuid references public.verified_definitions(id) on delete set null,
  constraint exact_requires_verified check (mode <> 'exact' or (verified and exact_text is not null))
);
create index test_mark_points_question_idx on public.test_mark_points (question_id, position);
create index test_mark_points_def_idx on public.test_mark_points (source_definition_id);

create table public.test_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answer_text text,
  mcq_choice text,
  marks_awarded integer,
  feedback jsonb,
  marked_by text check (marked_by in ('code','ai','mixed')),
  marking_version text,
  updated_at timestamptz not null default now(),
  unique (session_id, question_id)
);
create index test_answers_question_idx on public.test_answers (question_id);
create index test_answers_user_idx on public.test_answers (user_id);

create table public.test_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  answer_id uuid references public.test_answers(id) on delete set null,
  kind text not null check (kind in ('question','mark')),
  note text,
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);
create index test_flags_user_idx on public.test_flags (user_id);
create index test_flags_question_idx on public.test_flags (question_id);
create index test_flags_answer_idx on public.test_flags (answer_id);
create index test_flags_status_idx on public.test_flags (status);

-- Link Bloom review chats to the answer they explain
alter table public.bloom_conversations
  add column test_answer_id uuid references public.test_answers(id) on delete set null;
create index bloom_conversations_test_answer_idx on public.bloom_conversations (test_answer_id);

-- keep updated_at fresh on autosave
create function public.test_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger test_answers_touch before update on public.test_answers
for each row execute function public.test_touch_updated_at();

-- RLS
alter table public.test_sessions enable row level security;
alter table public.test_topics enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_question_keys enable row level security;
alter table public.test_mark_points enable row level security;
alter table public.test_answers enable row level security;
alter table public.test_flags enable row level security;
alter table public.verified_definitions enable row level security;

-- Lock down default grants, then give back only what is needed
revoke all on public.test_sessions, public.test_topics, public.test_questions, public.test_question_keys,
  public.test_mark_points, public.test_answers, public.test_flags, public.verified_definitions from anon, authenticated;

grant select on public.test_sessions, public.test_topics, public.test_questions,
  public.test_question_keys, public.test_mark_points, public.test_answers to authenticated;
grant update (title, included) on public.test_topics to authenticated;
grant insert (session_id, question_id, answer_text, mcq_choice) on public.test_answers to authenticated;
grant update (answer_text, mcq_choice) on public.test_answers to authenticated;
grant select on public.test_flags to authenticated;
grant insert (question_id, answer_id, kind, note) on public.test_flags to authenticated;
grant update (status, admin_note) on public.test_flags to authenticated;
grant select, insert, update, delete on public.verified_definitions to authenticated;

-- Policies
create policy "test_sessions: read own" on public.test_sessions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "test_topics: read own" on public.test_topics for select to authenticated
  using (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy "test_topics: edit before generating" on public.test_topics for update to authenticated
  using (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status = 'topics_ready'))
  with check (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status = 'topics_ready'));

create policy "test_questions: read own" on public.test_questions for select to authenticated
  using (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid())));

create policy "test_question_keys: read after marking" on public.test_question_keys for select to authenticated
  using (exists (select 1 from public.test_questions q join public.test_sessions s on s.id = q.session_id
    where q.id = question_id and s.user_id = (select auth.uid()) and s.status = 'marked'));

create policy "test_mark_points: read after marking" on public.test_mark_points for select to authenticated
  using (exists (select 1 from public.test_questions q join public.test_sessions s on s.id = q.session_id
    where q.id = question_id and s.user_id = (select auth.uid()) and s.status = 'marked'));

create policy "test_answers: read own" on public.test_answers for select to authenticated
  using (user_id = (select auth.uid()));
create policy "test_answers: write while open" on public.test_answers for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status in ('ready','in_progress')));
create policy "test_answers: edit while open" on public.test_answers for update to authenticated
  using (user_id = (select auth.uid())
    and exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status in ('ready','in_progress')))
  with check (user_id = (select auth.uid()));

create policy "test_flags: read own" on public.test_flags for select to authenticated
  using (user_id = (select auth.uid()) or internal.is_admin((select auth.uid())));
create policy "test_flags: flag own" on public.test_flags for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "test_flags: admin review" on public.test_flags for update to authenticated
  using (internal.is_admin((select auth.uid()))) with check (internal.is_admin((select auth.uid())));

create policy "verified_definitions: admin only" on public.verified_definitions for all to authenticated
  using (internal.is_admin((select auth.uid()))) with check (internal.is_admin((select auth.uid())));
