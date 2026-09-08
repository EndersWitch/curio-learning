import { createClient } from '@supabase/supabase-js'

// ─── THE ONE AND ONLY Supabase client for the entire Next.js app ──────────────
// Every file must import { sb } from '@/lib/supabase'.
// NEVER call createClient() anywhere else.

export const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

// "Remember me" support — the flag itself always lives in localStorage (it
// has to survive in order to be readable on the next visit), but it decides
// which store the actual session gets written to. Unchecked → sessionStorage,
// which the browser clears when it closes, so the user is logged out; checked
// (the default, including before the flag is ever set) → localStorage, which
// survives restarts. Call setRememberMe() before sign-in so the session that
// results from that sign-in lands in the right store.
const REMEMBER_KEY = 'curio-remember-me'

export function setRememberMe(remember: boolean) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false') } catch {}
}

function activeStore(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === 'false' ? window.sessionStorage : window.localStorage
  } catch {
    return window.localStorage
  }
}

// Supabase's SupportedStorage interface — reads/writes always go through
// whichever store is currently active, decided fresh on every call (not
// captured once), so flipping the remember-me flag takes effect immediately.
const hybridStorage = {
  getItem: (key: string) => activeStore()?.getItem(key) ?? null,
  setItem: (key: string, value: string) => { activeStore()?.setItem(key, value) },
  removeItem: (key: string) => { activeStore()?.removeItem(key) },
}

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'curio-auth', // single stable key — all pages share this
    storage: hybridStorage,
    detectSessionInUrl: true,
  },
})

// Aliases for backwards compat — always point to the same instance
export const supabase = sb
export function createServerClient() { return sb }
