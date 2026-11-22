-- Security review fixes.
-- 1. A build is charged once per session, in the generate route (the step that spends the money).
alter table public.test_sessions add column if not exists build_charged boolean not null default false;

-- 2. Size limits the browser used to be the only guard for.
alter table public.test_sessions add constraint test_sessions_scope_len check (char_length(scope_text) <= 6000) not valid;
alter table public.test_topics add constraint test_topics_title_len check (char_length(title) <= 90) not valid;
alter table public.test_answers add constraint test_answers_text_len check (answer_text is null or char_length(answer_text) <= 6000) not valid;

create or replace function public.test_topics_cap() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.test_topics where session_id = new.session_id) >= 25 then
    raise exception 'too many topics for one test';
  end if;
  return new;
end;
$$;
create trigger test_topics_cap before insert on public.test_topics for each row execute function public.test_topics_cap();

-- 3. Learners must not read the investigation text (it can quote the hidden memo).
revoke select on public.test_flags from authenticated;
grant select (id, user_id, question_id, answer_id, kind, note, reason, status, created_at) on public.test_flags to authenticated;

-- 4. A generation that was cut off can be picked up again after ten minutes.
alter table public.test_sessions add column if not exists generating_since timestamptz;
