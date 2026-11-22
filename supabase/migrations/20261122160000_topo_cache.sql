-- Real-terrain practice maps are built once from open data and kept here (service role only).
create table public.topo_cache (
  key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.topo_cache enable row level security;
revoke all on public.topo_cache from anon, authenticated;
grant all on public.topo_cache to service_role;
