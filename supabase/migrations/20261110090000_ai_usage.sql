-- AI usage and cost tracking.
--
-- One row in ai_usage per AI call, with its token counts and its cost in US
-- dollars worked out from ai_prices at the time of the call. Learners write
-- rows only through log_ai_usage(), which always files the row under the
-- caller's own account, so nobody can charge usage to someone else.
--
-- To change a price: update the row in ai_prices. Past rows keep the cost
-- they were logged with; only new calls use the new price.

create table public.ai_prices (
  model_prefix text primary key,            -- matched against the model name, longest prefix wins
  input_per_mtok numeric not null,          -- US$ per million tokens
  output_per_mtok numeric not null,
  cache_write_per_mtok numeric not null,
  cache_read_per_mtok numeric not null,
  updated_at timestamptz not null default now()
);

insert into public.ai_prices (model_prefix, input_per_mtok, output_per_mtok, cache_write_per_mtok, cache_read_per_mtok) values
  ('claude-opus-5-5',  4.00, 20.00, 5.00,  0.20),
  ('claude-haiku-5-5', 0.10,  0.50, 0.125, 0.01),
  ('claude-haiku-4-5', 1.00,  5.00, 1.25,  0.10);

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,  -- null = admin or system job
  feature text not null,                    -- e.g. 'bloom_chat', 'paper_generator'
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric,                         -- null when the model has no price row yet
  created_at timestamptz not null default now()
);
create index ai_usage_user_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_created_idx on public.ai_usage (created_at desc);

alter table public.ai_prices enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.ai_prices, public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

create policy "ai_usage: read own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

-- Cost in US$ of one call, from ai_prices. Null if the model isn't priced.
create or replace function public.ai_call_cost(
  p_model text, p_input integer, p_output integer, p_cache_write integer, p_cache_read integer
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select (coalesce(p_input, 0) * p.input_per_mtok
        + coalesce(p_output, 0) * p.output_per_mtok
        + coalesce(p_cache_write, 0) * p.cache_write_per_mtok
        + coalesce(p_cache_read, 0) * p.cache_read_per_mtok) / 1000000
  from public.ai_prices p
  where p_model like p.model_prefix || '%'
  order by length(p.model_prefix) desc
  limit 1;
$$;

-- Logs one AI call for the signed-in caller. p_usage is the API's usage
-- object as returned (input_tokens, output_tokens, cache_creation_input_tokens,
-- cache_read_input_tokens).
create or replace function public.log_ai_usage(p_feature text, p_model text, p_usage jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_in integer := least(greatest(coalesce((p_usage->>'input_tokens')::integer, 0), 0), 2000000);
  v_out integer := least(greatest(coalesce((p_usage->>'output_tokens')::integer, 0), 0), 2000000);
  v_cw integer := least(greatest(coalesce((p_usage->>'cache_creation_input_tokens')::integer, 0), 0), 2000000);
  v_cr integer := least(greatest(coalesce((p_usage->>'cache_read_input_tokens')::integer, 0), 0), 2000000);
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  insert into public.ai_usage (user_id, feature, model, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, cost_usd)
  values (v_uid, left(coalesce(p_feature, 'unknown'), 40), left(p_model, 80), v_in, v_out, v_cw, v_cr,
          public.ai_call_cost(p_model, v_in, v_out, v_cw, v_cr));
end;
$$;

-- The caller's own AI use this calendar month (South African time).
create or replace function public.ai_usage_this_month()
returns table (calls bigint, cost_usd numeric, cost_zar numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*), coalesce(sum(u.cost_usd), 0), round(coalesce(sum(u.cost_usd), 0) * 16.5, 2)
  from public.ai_usage u
  where u.user_id = auth.uid()
    and u.created_at >= date_trunc('month', now() at time zone 'Africa/Johannesburg') at time zone 'Africa/Johannesburg';
$$;

-- Admins only: every user's AI cost for a month (any day in that month), most expensive first.
-- Rand figure uses R16.50 to the dollar; change it here if the rate moves a lot.
create or replace function public.ai_usage_by_user(p_month date default null)
returns table (user_id uuid, email text, is_premium boolean, calls bigint, cost_usd numeric, cost_zar numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := date_trunc('month', coalesce(p_month, (now() at time zone 'Africa/Johannesburg')::date)) at time zone 'Africa/Johannesburg';
begin
  -- Signed-in callers must be admins. No auth.uid() means the SQL editor or the
  -- service role (anon can't execute this), which may read it too.
  if auth.uid() is not null and not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'admins only';
  end if;
  return query
    select u.user_id, au.email::text, coalesce(p.is_premium, false), count(*),
           coalesce(sum(u.cost_usd), 0), round(coalesce(sum(u.cost_usd), 0) * 16.5, 2)
    from public.ai_usage u
    left join auth.users au on au.id = u.user_id
    left join public.profiles p on p.id = u.user_id
    where u.created_at >= v_start and u.created_at < v_start + interval '1 month'
    group by u.user_id, au.email, p.is_premium
    order by 5 desc;
end;
$$;

revoke all on function public.ai_call_cost(text, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.log_ai_usage(text, text, jsonb) from public, anon;
revoke all on function public.ai_usage_this_month() from public, anon;
revoke all on function public.ai_usage_by_user(date) from public, anon;
grant execute on function public.log_ai_usage(text, text, jsonb) to authenticated;
grant execute on function public.ai_usage_this_month() to authenticated;
grant execute on function public.ai_usage_by_user(date) to authenticated;

-- Backfill: every Bloom reply saved so far already carries its token counts.
insert into public.ai_usage (user_id, feature, model, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, cost_usd, created_at)
select t.user_id, 'bloom_chat', t.model,
       coalesce((t.usage->>'input_tokens')::integer, 0),
       coalesce((t.usage->>'output_tokens')::integer, 0),
       coalesce((t.usage->>'cache_creation_input_tokens')::integer, 0),
       coalesce((t.usage->>'cache_read_input_tokens')::integer, 0),
       public.ai_call_cost(t.model,
         coalesce((t.usage->>'input_tokens')::integer, 0),
         coalesce((t.usage->>'output_tokens')::integer, 0),
         coalesce((t.usage->>'cache_creation_input_tokens')::integer, 0),
         coalesce((t.usage->>'cache_read_input_tokens')::integer, 0)),
       t.created_at
from public.bloom_turns t
where t.usage is not null;
