'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowRight } from '@/components/icons'
import { longDay, premiumEndsAt, shortDay } from '@/lib/billing'

// Shown to Premium members whose last renewal failed. Deliberately has no
// close button: it stays pinned to the bottom of every page until the
// payment goes through (the webhook flips subscription_status back to
// 'active') or Premium runs out. It sits above the phone tab bar and never
// covers page content — body.has-paybar reserves the room.
export default function PaymentBanner() {
  const { user } = useAuth()
  const pathname = usePathname() || '/'

  const show =
    !!user &&
    user.isPremium &&
    user.subscriptionStatus === 'payment_failed' &&
    !pathname.startsWith('/login')

  useEffect(() => {
    document.body.classList.toggle('has-paybar', show)
    return () => document.body.classList.remove('has-paybar')
  }, [show])

  if (!show) return null

  const ends = premiumEndsAt(user.subscriptionExpiresAt)
  const future = ends && ends.getTime() > Date.now()

  return (
    <a href="/subscription#renew" className="paybar" role="status">
      <span className="paybar-dot" aria-hidden="true" />
      <span className="paybar-msg">
        <span className="paybar-wide">
          Your R49 payment didn&apos;t go through.{' '}
          {future ? <>Pay by <strong>{longDay(ends)}</strong> to keep Premium.</> : <>Pay today to keep Premium.</>}
        </span>
        <span className="paybar-narrow">
          Payment failed. Premium ends <strong>{future ? shortDay(ends) : 'today'}</strong>.
        </span>
      </span>
      <span className="paybar-cta">
        Pay now <ArrowRight size={14} aria-hidden="true" />
      </span>
    </a>
  )
}
