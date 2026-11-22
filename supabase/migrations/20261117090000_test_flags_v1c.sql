-- Reporting a question or a mark: a reason, one report per learner per question
-- and kind, and a learner may only report their own questions and answers.
-- (already applied to the live project)

alter table public.test_flags
  add column reason text check (reason in ('wrong_answer','no_right_answer','two_right_answers','unclear','unfair_mark','other')),
  add constraint test_flags_note_len check (note is null or char_length(note) <= 500);

create unique index test_flags_once on public.test_flags (user_id, question_id, kind);

grant insert (reason) on public.test_flags to authenticated;

drop policy "test_flags: flag own" on public.test_flags;
create policy "test_flags: flag own" on public.test_flags for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.test_questions q join public.test_sessions s on s.id = q.session_id
      where q.id = question_id and s.user_id = (select auth.uid())
    )
    and (answer_id is null or exists (
      select 1 from public.test_answers a where a.id = answer_id and a.user_id = (select auth.uid()) and a.question_id = test_flags.question_id
    ))
  );
