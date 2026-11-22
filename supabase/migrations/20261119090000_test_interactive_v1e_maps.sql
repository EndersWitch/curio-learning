alter table public.test_questions drop constraint if exists test_questions_qtype_check;
alter table public.test_questions add constraint test_questions_qtype_check check (qtype in ('mcq','short','long','symmetry','bond','sort','activity','maplocate','mapline'));
