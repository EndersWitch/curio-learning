/**
 * auth.js — shared auth module for all Curio HTML pages
 *
 * Import this at the top of every public HTML page:
 *   <script src="/auth.js"></script>
 *
 * Then call: initCurioAuth(callbacks)
 *
 * The module:
 *  - Uses the Supabase CDN client with the SAME storageKey as Next.js ('curio-auth')
 *  - Fetches profiles.is_premium + profiles.is_founder fresh from DB on every load
 *  - Never reads from cookies or localStorage for user data
 *  - Exposes window.curioUser for other scripts on the page
 */

const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

// Load Supabase JS if not already present
;(function () {
  if (window.supabase) return
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  s.onload = () => { window._supabaseLoaded = true; window.dispatchEvent(new Event('supabase-ready')) }
  document.head.appendChild(s)
})()

function waitForSupabase() {
  return new Promise(resolve => {
    if (window.supabase || window._supabaseLoaded) return resolve()
    window.addEventListener('supabase-ready', resolve, { once: true })
  })
}

/**
 * @param {object} callbacks
 *   onLoggedIn(user)  — called with user object when session found
 *   onLoggedOut()     — called when no session
 *   onReady()         — called after auth check completes (either way)
 *
 * user = { id, email, fullName, grade, isPremium, isFounder }
 */
window.initCurioAuth = async function (callbacks = {}) {
  await waitForSupabase()

  const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'curio-auth', // must match Next.js storageKey
    }
  })

  // Expose the client so pages can call auth methods (updateUser, signOut, etc.)
  window.curioSb = _sb

  async function fetchAndBroadcast(session) {
    window.curioSession = session || null
    if (!session?.user) {
      window.curioUser = null
      callbacks.onLoggedOut?.()
      callbacks.onReady?.()
      return
    }

    // Always fetch fresh from DB — never trust cached metadata
    const { data: profile } = await _sb
      .from('profiles')
      .select('is_premium, is_founder, full_name, grade')
      .eq('id', session.user.id)
      .single()

    window.curioUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: profile?.full_name || session.user.email.split('@')[0],
      grade: profile?.grade || null,
      isPremium: profile?.is_premium === true,
      isFounder: profile?.is_founder === true,
    }

    callbacks.onLoggedIn?.(window.curioUser)
    callbacks.onReady?.()
  }

  // Initial check
  const { data: { session } } = await _sb.auth.getSession()
  await fetchAndBroadcast(session)

  // Live updates (login/logout while page is open)
  _sb.auth.onAuthStateChange(async (_event, session) => {
    await fetchAndBroadcast(session)
  })

  // Expose signOut globally
  window.curioSignOut = async () => {
    await _sb.auth.signOut()
    window.curioUser = null
    window.location.href = '/'
  }
}
