'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { sb } from '@/lib/supabase'

export interface CurioUser {
  id: string
  email: string
  fullName: string
  grade: string | null
  isPremium: boolean
  isFounder: boolean
}

interface AuthState {
  user: CurioUser | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  async function loadUser(session: any) {
    if (!session?.user) {
      setState({ user: null, loading: false })
      return
    }

    const userId = session.user.id
    const email = session.user.email ?? ''

    // Always fetch fresh from DB — no stale data
    const { data: profile } = await sb
      .from('profiles')
      .select('is_premium, is_founder, full_name, grade')
      .eq('id', userId)
      .single()

    // Name priority: profiles.full_name → user_metadata.full_name → email prefix
    const metaName = session.user.user_metadata?.full_name ?? ''
    const fullName =
      (profile?.full_name && profile.full_name.trim()) ||
      (metaName && metaName.trim()) ||
      email.split('@')[0]

    setState({
      loading: false,
      user: {
        id: userId,
        email,
        fullName,
        grade: profile?.grade ?? null,
        isPremium: profile?.is_premium === true,
        isFounder: profile?.is_founder === true,
      },
    })
  }

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => loadUser(session))

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      loadUser(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
