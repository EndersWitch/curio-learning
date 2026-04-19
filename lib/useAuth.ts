'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/quiz'

interface AuthState {
  userId: string | null
  profile: UserProfile | null
  isLoggedIn: boolean
  isPremium: boolean
  isFounder: boolean
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    profile: null,
    isLoggedIn: false,
    isPremium: false,
    isFounder: false,
    loading: true,
  })

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setState((s) => ({ ...s, loading: false }))
        return
      }

      const userId = session.user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setState({
        userId,
        profile: profile as UserProfile | null,
        isLoggedIn: true,
        isPremium: profile?.is_premium || profile?.is_founder || false,
        isFounder: profile?.is_founder || false,
        loading: false,
      })
    }

    loadSession()

    // React to sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setState({
          userId: null,
          profile: null,
          isLoggedIn: false,
          isPremium: false,
          isFounder: false,
          loading: false,
        })
        return
      }

      const userId = session.user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setState({
        userId,
        profile: profile as UserProfile | null,
        isLoggedIn: true,
        isPremium: profile?.is_premium || profile?.is_founder || false,
        isFounder: profile?.is_founder || false,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
