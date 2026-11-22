-- Interactive question types (draw, drag, sort, maths activity).
-- spec: what the learner sees to build their answer. answer_spec: the hidden
-- answer. answer_json: what the learner did.

alter table public.test_questions drop constraint test_questions_qtype_check;
alter table public.test_questions add constraint test_questions_qtype_check
  check (qtype in ('mcq','short','long','symmetry','bond','sort','activity'));
alter table public.test_questions add column spec jsonb;

alter table public.test_question_keys add column answer_spec jsonb;

alter table public.test_answers add column answer_json jsonb;
grant insert (answer_json) on public.test_answers to authenticated;
grant update (answer_json) on public.test_answers to authenticated;
