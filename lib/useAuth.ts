'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'

interface AuthState {
  userId: string | null
  isLoggedIn: boolean
  isPremium: boolean
  isFounder: boolean
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoggedIn: false,
    isPremium: false,
    isFounder: false,
    loading: true,
  })

  useEffect(() => {
    // Get current session
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState(prev => ({ ...prev, loading: false }))
        return
      }
      // Fetch premium/founder status from profiles
      sb.from('profiles')
        .select('is_premium, is_founder')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          setState({
            userId: session.user.id,
            isLoggedIn: true,
            isPremium: profile?.is_premium || false,
            isFounder: profile?.is_founder || false,
            loading: false,
          })
        })
    })

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState({ userId: null, isLoggedIn: false, isPremium: false, isFounder: false, loading: false })
        return
      }
      sb.from('profiles')
        .select('is_premium, is_founder')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          setState({
            userId: session.user.id,
            isLoggedIn: true,
            isPremium: profile?.is_premium || false,
            isFounder: profile?.is_founder || false,
            loading: false,
          })
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
