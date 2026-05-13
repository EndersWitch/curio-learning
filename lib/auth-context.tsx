'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { sb } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurioUser {
  id: string
  email: string
  fullName: string
  grade: string | null
  isPremium: boolean   // profiles.is_premium
  isFounder: boolean   // profiles.is_founder
}

interface AuthState {
  user: CurioUser | null
  loading: boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────
// Wrap the quiz layout with this so every quiz page gets auth for free.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  async function loadUser(userId: string, email: string) {
    // Always fetch fresh from DB — no local cache, no stale data
    const { data: profile } = await sb
      .from('profiles')
      .select('is_premium, is_founder, full_name, grade')
      .eq('id', userId)
      .single()

    setState({
      loading: false,
      user: {
        id: userId,
        email,
        fullName: profile?.full_name ?? email.split('@')[0],
        grade: profile?.grade ?? null,
        isPremium: profile?.is_premium === true,
        isFounder: profile?.is_founder === true,
      },
    })
  }

  useEffect(() => {
    // Check session on mount
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? '')
      } else {
        setState({ user: null, loading: false })
      }
    })

    // Listen for login/logout
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? '')
      } else {
        setState({ user: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
