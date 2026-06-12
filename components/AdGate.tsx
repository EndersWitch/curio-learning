'use client'

import { useEffect } from 'react'
import { sb } from '@/lib/supabase'

const ADSENSE_ID = 'ca-pub-2405111123009991'

/**
 * Loads Google AdSense (Auto Ads) for non-premium visitors only.
 * - Anonymous visitors → ads on
 * - Logged-in free users → ads on
 * - Premium / Founder users → no ads, script never loads
 *
 * Premium status is fetched fresh from profiles — never from cached metadata.
 */
export default function AdGate() {
  useEffect(() => {
    let cancelled = false

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
      if (document.getElementById('curio-adsense')) return

      const s = document.createElement('script')
      s.id = 'curio-adsense'
      s.async = true
      s.crossOrigin = 'anonymous'
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`
      document.head.appendChild(s)
    }

    check()
    return () => { cancelled = true }
  }, [])

  return null
}
