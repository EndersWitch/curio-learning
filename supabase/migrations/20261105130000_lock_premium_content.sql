-- Lock Premium quiz content in the database, not just the browser.
--
-- Before: questions and quiz_levels had "anyone can read everything" policies,
-- so the answers and learning cards of every Premium level could be pulled
-- straight from the API by anyone, signed in or not.
--
-- After:
--   * Free rows stay readable by everyone.
--   * Premium rows are readable only by admins and paid-up Premium members.
--   * quiz_level_catalog() lists every level's name/order/lock state (no
--     content) so locked levels can still be shown with a padlock.
--   * Triggers keep each question's is_premium in step with its level, so
--     marking a level Premium can never leave its questions exposed.

-- ── who may read Premium content right now ─────────────────────────
-- Also checks the paid-through date (+3-day grace, matching the daily job),
-- so access ends on time even if the daily job hasn't run.
create or replace function internal.can_read_premium()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_admin is true
        or (p.is_premium is true
            and (p.subscription_expires_at is null
                 or p.subscription_expires_at > now() - interval '3 days'))
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$$;

revoke all on function internal.can_read_premium() from public;
grant execute on function internal.can_read_premium() to anon, authenticated, service_role;

-- ── no "unknown" premium state ─────────────────────────────────────
update public.questions set is_premium = false where is_premium is null;
update public.quiz_levels set is_premium = false where is_premium is null;
alter table public.questions   alter column is_premium set default false, alter column is_premium set not null;
alter table public.quiz_levels alter column is_premium set default false, alter column is_premium set not null;

-- ── row access ─────────────────────────────────────────────────────
drop policy if exists "Reading Questions" on public.questions;
create policy "Read free questions, premium ones only when paid up"
  on public.questions for select to anon, authenticated
  using (not is_premium or (select internal.can_read_premium()));

drop policy if exists "Public read quiz_levels" on public.quiz_levels;
create policy "Read free levels, premium ones only when paid up"
  on public.quiz_levels for select to anon, authenticated
  using (not is_premium or (select internal.can_read_premium()));

-- ── catalogue: every level, no content ─────────────────────────────
create or replace function public.quiz_level_catalog()
returns table (
  id uuid,
  phase text,
  grade integer,
  subject text,
  broad_topic text,
  broad_topic_display text,
  section_type text,
  subtopic_id text,
  subtopic_display text,
  level_id text,
  level_display text,
  level_order integer,
  difficulty text,
  is_premium boolean,
  question_count integer,
  description text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.phase, l.grade, l.subject, l.broad_topic, l.broad_topic_display,
         l.section_type, l.subtopic_id, l.subtopic_display, l.level_id, l.level_display,
         l.level_order, l.difficulty, l.is_premium, l.question_count, l.description, l.created_at
  from public.quiz_levels l;
$$;

revoke all on function public.quiz_level_catalog() from public;
grant execute on function public.quiz_level_catalog() to anon, authenticated, service_role;

-- ── keep questions' premium flag in step with their level ──────────
-- Questions link to a level by slug+grade+subject (current) or by the
-- level's UUID (legacy).
create or replace function internal.question_premium_from_level()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prem boolean;
begin
  select l.is_premium into v_prem
  from public.quiz_levels l
  where l.id::text = new.level_id
     or (l.level_id = new.level_id and l.grade = new.grade and l.subject = new.subject)
  order by (l.id::text = new.level_id) desc
  limit 1;

  if found then
    new.is_premium := v_prem;
  end if;
  return new;
end;
$$;

drop trigger if exists questions_premium_from_level on public.questions;
create trigger questions_premium_from_level
  before insert or update of is_premium, level_id, grade, subject on public.questions
  for each row execute function internal.question_premium_from_level();

create or replace function internal.level_premium_to_questions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.questions q
  set is_premium = new.is_premium
  where (q.level_id = new.id::text
         or (q.level_id = new.level_id and q.grade = new.grade and q.subject = new.subject))
    and q.is_premium is distinct from new.is_premium;
  return null;
end;
$$;

drop trigger if exists quiz_levels_premium_to_questions on public.quiz_levels;
create trigger quiz_levels_premium_to_questions
  after insert or update of is_premium, level_id, grade, subject on public.quiz_levels
  for each row execute function internal.level_premium_to_questions();

revoke all on function internal.question_premium_from_level() from public, anon, authenticated;
revoke all on function internal.level_premium_to_questions() from public, anon, authenticated;
