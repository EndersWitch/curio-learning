-- Let a learner start a session and set its topics through RLS only (no service-role key).
-- Status and credit_cost stay out of their reach: only 'draft' and 'topics_ready' can be set.
-- (already applied to the live project)

grant insert (grade, subject, scope_text, length, question_mix, difficulty_mix) on public.test_sessions to authenticated;
grant update (status) on public.test_sessions to authenticated;

create policy "test_sessions: start own" on public.test_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "test_sessions: topics stage" on public.test_sessions for update to authenticated
  using (user_id = (select auth.uid()) and status in ('draft','topics_ready'))
  with check (user_id = (select auth.uid()) and status in ('draft','topics_ready'));

grant insert (session_id, position, title, included), delete on public.test_topics to authenticated;

create policy "test_topics: add before generating" on public.test_topics for insert to authenticated
  with check (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status in ('draft','topics_ready')));
create policy "test_topics: remove before generating" on public.test_topics for delete to authenticated
  using (exists (select 1 from public.test_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status in ('draft','topics_ready')));
