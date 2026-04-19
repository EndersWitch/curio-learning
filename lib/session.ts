/**
 * Shared session helper.
 * Curio stores sessions manually in localStorage as 'curio_session'
 * (not via Supabase's own auth persistence), so we read from there.
 *
 * This is used by both the homepage and the quiz system so they
 * always agree on whether the user is logged in.
 */

export interface CurioSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      grade?: string
      is_premium?: boolean
    }
  }
}

/** Read the session from localStorage. Returns null if missing / expired. */
export function getLocalSession(): CurioSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('curio_session')
    if (!raw) return null
    const s: CurioSession = JSON.parse(raw)
    if (!s?.access_token) return null
    if (s.expires_at < Date.now() / 1000) {
      localStorage.removeItem('curio_session')
      return null
    }
    return s
  } catch {
    return null
  }
}

export function clearLocalSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('curio_session')
  }
}

/** User ID from session, or null */
export function getLocalUserId(): string | null {
  return getLocalSession()?.user?.id ?? null
}
