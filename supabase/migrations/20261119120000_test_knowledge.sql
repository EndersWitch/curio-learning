-- Verified subject knowledge that every test question writer and checker must follow.
-- Readable only by the service role (the test-builder routes); learners never see it directly.
create table if not exists public.test_knowledge (
  id uuid primary key default gen_random_uuid(),
  subjects text[] not null default '{}',          -- keywords matched against the session's subject and scope; '{*}' = every subject
  grade_min int not null default 1,
  grade_max int not null default 12,
  kind text not null check (kind in ('term','rule','fact','avoid')),
  title text not null,
  body text not null,
  source_url text,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected')),
  origin text not null default 'seed' check (origin in ('seed','flag','cron','admin')),
  note text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, title)
);
alter table public.test_knowledge enable row level security;
-- no policies: only the service role reads or writes this table.

-- A learner's report is triaged by AI; this records what the triage decided.
alter table public.test_flags add column if not exists triage text;
alter table public.test_flags add column if not exists triaged_at timestamptz;
