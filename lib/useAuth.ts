'use client'

import { useEffect, useState } from 'react'
import { getLocalSession, clearLocalSession, type CurioSession } from './session'

interface AuthState {
  userId: string | null
  session: CurioSession | null
  isLoggedIn: boolean
  isPremium: boolean
  isFounder: boolean
  loading: boolean
}

/**
 * Reads auth state from localStorage (curio_session).
 * Curio does NOT use Supabase's own session persistence —
 * the login page manually stores the session token.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    session: null,
    isLoggedIn: false,
    isPremium: false,
    isFounder: false,
    loading: true,
  })

  useEffect(() => {
    const s = getLocalSession()

    if (!s) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    setState({
      userId: s.user.id,
      session: s,
      isLoggedIn: true,
      isPremium: s.user.user_metadata?.is_premium || false,
      isFounder: false,
      loading: false,
    })
  }, [])

  return state
}
