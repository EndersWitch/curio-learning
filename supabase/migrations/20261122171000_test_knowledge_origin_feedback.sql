alter table public.test_knowledge drop constraint if exists test_knowledge_origin_check;
alter table public.test_knowledge add constraint test_knowledge_origin_check check (origin in ('seed','flag','cron','admin','feedback'));
