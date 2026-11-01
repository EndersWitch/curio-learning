-- Optional hands-on aid for a quiz question: a reference such as
-- 'fraction-fun?n=1&d=4&of=20' (see lib/activities.ts). Null for ordinary questions.
-- The app ignores references it does not recognise, so bad values are harmless.
alter table public.questions
  add column if not exists activity text;

comment on column public.questions.activity is
  'Optional interactive aid shown with the question, e.g. fraction-fun?n=1&d=4&of=20';
