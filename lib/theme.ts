'use client'

import { sb } from '@/lib/supabase'

const STORAGE_KEY = 'curio-theme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Persists the choice locally (instant, works logged out) and, if signed in,
// to the account so it follows the user to their next device/login.
export async function persistTheme(theme: Theme) {
  applyTheme(theme)
  try { localStorage.setItem(STORAGE_KEY, theme) } catch {}

  const { data: { session } } = await sb.auth.getSession()
  if (session?.user) {
    await sb.from('profiles').update({ theme_preference: theme }).eq('id', session.user.id)
  }
}

// Called once per page load to reconcile theme state: the signed-in
// account's saved preference wins (that's the cross-device source of
// truth), falling back to whatever the blocking head script already
// applied from localStorage/system preference.
export async function syncThemeFromAccount(): Promise<Theme> {
  const { data: { session } } = await sb.auth.getSession()
  if (session?.user) {
    const { data: profile } = await sb
      .from('profiles')
      .select('theme_preference')
      .eq('id', session.user.id)
      .single()
    if (profile?.theme_preference === 'light' || profile?.theme_preference === 'dark') {
      applyTheme(profile.theme_preference)
      try { localStorage.setItem(STORAGE_KEY, profile.theme_preference) } catch {}
      return profile.theme_preference
    }
  }

  const stored = getStoredTheme()
  if (stored) { applyTheme(stored); return stored }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const fallback: Theme = prefersDark ? 'dark' : 'light'
  applyTheme(fallback)
  return fallback
}

// Inlined verbatim into a blocking <script> at the top of <body> so the
// correct class is on <html> before first paint — no flash of the wrong
// theme while React hydrates. Cannot reach the account's saved preference
// (that needs a network round trip); syncThemeFromAccount reconciles that
// once the app mounts.
export const themeBootScript = `
try {
  var t = localStorage.getItem('${STORAGE_KEY}');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`
