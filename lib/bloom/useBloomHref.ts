'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

// Where a "Bloom" link should go for the current visitor: the chat (/bloom)
// when the server says this account may use Bloom right now, otherwise the
// "coming soon" page (/deeplearn).
//
// The decision is the server's, via GET /api/bloom/session, which runs the
// same BLOOM_ACCESS / tester / API-key checks as the chat itself. Nothing
// here grants access: /bloom and /api/bloom/* still check every request, so
// a wrong answer here only changes where a link points.

const COMING_SOON = '/deeplearn'
const CHAT = '/bloom'

// One check per signed-in user per page load, shared by every link on the page.
const cache = new Map<string, Promise<boolean>>()

async function canUseBloom(): Promise<boolean> {
  try {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return false
    const res = await fetch('/api/bloom/session', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

export function useBloomHref(): string {
  const { user } = useAuth()
  const [href, setHref] = useState(COMING_SOON)

  useEffect(() => {
    if (!user?.id) { setHref(COMING_SOON); return }
    let cancelled = false
    if (!cache.has(user.id)) cache.set(user.id, canUseBloom())
    cache.get(user.id)!.then((ok) => { if (!cancelled) setHref(ok ? CHAT : COMING_SOON) })
    return () => { cancelled = true }
  }, [user?.id])

  return href
}
