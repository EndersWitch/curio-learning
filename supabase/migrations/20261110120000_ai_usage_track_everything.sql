-- AI usage, round 2: price everything the API can charge for, and let the
-- edge functions (service role) log calls on behalf of a user.
--
-- Prices from platform.claude.com/docs/en/about-claude/pricing (10 Nov 2026).

-- Haiku 5.5 charges 5x on any request whose prompt (input + cache reads +
-- cache writes) is over 100,000 tokens.
alter table public.ai_prices
  add column long_context_threshold integer,
  add column long_context_multiplier numeric not null default 1;

update public.ai_prices set long_context_threshold = 100000, long_context_multiplier = 5
where model_prefix = 'claude-haiku-5-5';

insert into public.ai_prices (model_prefix, input_per_mtok, output_per_mtok, cache_write_per_mtok, cache_read_per_mtok)
values ('claude-sonnet-5-5', 2.00, 10.00, 2.50, 0.10)
on conflict (model_prefix) do nothing;

-- Web search is US$10 per 1,000 searches on top of tokens.
alter table public.ai_usage add column web_searches integer not null default 0;

drop function if exists public.ai_call_cost(text, integer, integer, integer, integer);

create or replace function public.ai_call_cost(
  p_model text, p_input integer, p_output integer, p_cache_write integer, p_cache_read integer,
  p_web_searches integer default 0
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
       * case when p.long_context_threshold is not null
               and coalesce(p_input, 0) + coalesce(p_cache_write, 0) + coalesce(p_cache_read, 0) > p.long_context_threshold
              then p.long_context_multiplier else 1 end
       + coalesce(p_web_searches, 0) * 0.01
  from public.ai_prices p
  where p_model like p.model_prefix || '%'
  order by length(p.model_prefix) desc
  limit 1;
$$;

-- Shared by both loggers below: turns the API's usage object into a row.
create or replace function public.ai_usage_insert(p_user uuid, p_feature text, p_model text, p_usage jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_in integer := least(greatest(coalesce((p_usage->>'input_tokens')::integer, 0), 0), 2000000);
  v_out integer := least(greatest(coalesce((p_usage->>'output_tokens')::integer, 0), 0), 2000000);
  v_cw integer := least(greatest(coalesce((p_usage->>'cache_creation_input_tokens')::integer, 0), 0), 2000000);
  v_cr integer := least(greatest(coalesce((p_usage->>'cache_read_input_tokens')::integer, 0), 0), 2000000);
  v_ws integer := least(greatest(coalesce((p_usage->'server_tool_use'->>'web_search_requests')::integer, 0), 0), 1000);
begin
  insert into public.ai_usage (user_id, feature, model, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, web_searches, cost_usd)
  values (p_user, left(coalesce(p_feature, 'unknown'), 40), left(p_model, 80), v_in, v_out, v_cw, v_cr, v_ws,
          public.ai_call_cost(p_model, v_in, v_out, v_cw, v_cr, v_ws));
end;
$$;

-- Signed-in learners (Bloom): always files the row under the caller.
create or replace function public.log_ai_usage(p_feature text, p_model text, p_usage jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  perform public.ai_usage_insert(auth.uid(), p_feature, p_model, p_usage);
end;
$$;

-- Edge functions running with the service role (paper generator, Millie).
create or replace function public.log_ai_usage_service(p_user uuid, p_feature text, p_model text, p_usage jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  select public.ai_usage_insert(p_user, p_feature, p_model, p_usage);
$$;

revoke all on function public.ai_call_cost(text, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.ai_usage_insert(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.log_ai_usage_service(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.log_ai_usage_service(uuid, text, text, jsonb) to service_role;

-- Per-feature totals for a month, admins only (or the SQL editor).
create or replace function public.ai_usage_by_feature(p_month date default null)
returns table (feature text, calls bigint, web_searches bigint, cost_usd numeric, cost_zar numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := date_trunc('month', coalesce(p_month, (now() at time zone 'Africa/Johannesburg')::date)) at time zone 'Africa/Johannesburg';
begin
  if auth.uid() is not null and not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'admins only';
  end if;
  return query
    select u.feature, count(*), coalesce(sum(u.web_searches), 0)::bigint,
           coalesce(sum(u.cost_usd), 0), round(coalesce(sum(u.cost_usd), 0) * 16.5, 2)
    from public.ai_usage u
    where u.created_at >= v_start and u.created_at < v_start + interval '1 month'
    group by u.feature
    order by 4 desc;
end;
$$;
revoke all on function public.ai_usage_by_feature(date) from public, anon;
grant execute on function public.ai_usage_by_feature(date) to authenticated;
