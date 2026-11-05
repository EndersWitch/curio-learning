-- Exact, case-insensitive email -> user id lookup for the Paystack webhook.
-- Replaces the old /auth/v1/admin/users?email= call, which Supabase ignores
-- (it returned the whole user list and the webhook took the first row).
create or replace function public.billing_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.billing_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.billing_user_id_by_email(text) to service_role;

-- Atomically give a user a founder slot, once. Returns true if the user is
-- (now or already) a founder, false if slots are full or the user is unknown.
-- Replaces read-then-write slot counting, which re-counted every renewal.
create or replace function public.billing_claim_founder_slot(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_already boolean;
begin
  select is_founder into v_already
  from public.profiles where id = p_user_id
  for update;

  if not found then
    return false;
  end if;
  if coalesce(v_already, false) then
    return true;
  end if;

  update public.founder_slots
  set claimed = claimed + 1
  where id = 1 and claimed < total;

  if found then
    update public.profiles set is_founder = true where id = p_user_id;
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.billing_claim_founder_slot(uuid) from public, anon, authenticated;
grant execute on function public.billing_claim_founder_slot(uuid) to service_role;
