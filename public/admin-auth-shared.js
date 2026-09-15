// Shared admin auth for /admin, /formatter, /quiz-formatter.
//
// Uses a *separate* Supabase Auth session from the main site (distinct
// storageKey, plain localStorage) so it never touches the end-user
// "remember me" hybrid storage adapter in lib/supabase.ts. Real security
// lives in the database RLS policies (only accounts with profiles.is_admin
// can write to questions/quiz_levels/papers/etc) — this file just gates the
// UI and hands out the bearer token those RLS checks need.
(function () {
  const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU';

  const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'curio-admin-auth', persistSession: true, autoRefreshToken: true },
  });

  let currentSession = null;

  async function checkIsAdmin(userId) {
    const { data, error } = await supa
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    if (error) return false;
    return !!(data && data.is_admin);
  }

  // Called on every page load — picks up a still-valid session from a
  // previous visit so admins don't have to re-enter credentials constantly.
  async function trySilentLogin() {
    const { data: { session } } = await supa.auth.getSession();
    if (!session) return null;
    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) {
      await supa.auth.signOut();
      return null;
    }
    currentSession = session;
    return session;
  }

  async function login(email, password) {
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new Error(error ? error.message : 'Login failed.');
    }
    const isAdmin = await checkIsAdmin(data.session.user.id);
    if (!isAdmin) {
      await supa.auth.signOut();
      throw new Error('This account does not have admin access.');
    }
    currentSession = data.session;
    return data.session;
  }

  async function logout() {
    await supa.auth.signOut();
    currentSession = null;
  }

  function authHeaders() {
    if (!currentSession) throw new Error('Not authenticated.');
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + currentSession.access_token,
    };
  }

  window.AdminAuth = {
    trySilentLogin,
    login,
    logout,
    authHeaders,
    get session() { return currentSession; },
  };
})();
