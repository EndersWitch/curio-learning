-- Applied to production (inmrsgujgfktapjnekjs) on 2026-10-01 via the Supabase
-- MCP; this file records it. Earlier migrations were applied the same way and
-- only exist in the project's migration history, not in this repo.
--
-- Users could previously UPDATE every column of their own profiles row
-- (policy "Users can update own profile" has no column list), including
-- is_admin, is_premium, is_founder and subscription_*. Any signed-in user
-- could make themselves an admin (internal.is_admin() reads profiles.is_admin)
-- or grant themselves Premium.
--
-- The site only writes these three columns from the browser. XP and streaks go
-- through award_quiz_xp() (security definer), subscription fields through the
-- Paystack webhook (service role), and new rows through handle_new_user()
-- (security definer) -- none of which are affected by these grants.
--
-- A new column that users should edit themselves needs its own
-- `grant update (<column>) on public.profiles to authenticated;`.
revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, grade, theme_preference) on public.profiles to authenticated;
