'use client'

import { useEffect } from 'react'
import { sb } from '@/lib/supabase'
import { ADSENSE_CLIENT_ID, isAdFreePath } from '@/lib/ads'

/**
 * Loads Google AdSense (Auto Ads) for non-premium visitors only.
 * - Anonymous visitors → ads on
 * - Logged-in free users → ads on
 * - Premium / Founder users → no ads, script never loads
 * - Visits that land on an ad-free screen (login, checkout, live quiz — see
 *   lib/ads.ts) → script isn't loaded for that page load
 *
 * Premium status is fetched fresh from profiles — never from cached metadata.
 */
export default function AdGate() {
  useEffect(() => {
    let cancelled = false

    // Auto Ads can pin an anchor ad over the Bloom chat's question box.
    if (window.location.pathname.startsWith('/bloom')) return

    async function check() {
      try {
        const { data: { session } } = await sb.auth.getSession()

        if (session?.user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('is_premium, is_founder')
            .eq('id', session.user.id)
            .single()

          if (profile?.is_premium === true || profile?.is_founder === true) return
        }
      } catch {
        // On any failure, fall through and treat as non-premium (free tier)
      }

      if (cancelled) return
      if (isAdFreePath(window.location.pathname)) return
      if (document.getElementById('curio-adsense')) return

      const s = document.createElement('script')
      s.id = 'curio-adsense'
      s.async = true
      s.crossOrigin = 'anonymous'
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
      document.head.appendChild(s)
    }

    check()
    return () => { cancelled = true }
  }, [])

  return null
}
