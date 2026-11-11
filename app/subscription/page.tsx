import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import SubscriptionClient from '@/components/SubscriptionClient'

export const metadata: Metadata = {
  title: 'Premium',
  description: 'Curio Premium unlocks every quiz level and removes ads, for R49 a month. Practice papers and memos stay free.',
  // Checkout page, and SubscriptionClient renders nothing until the auth
  // check finishes, so crawlers get an empty page.
  robots: { index: false, follow: true },
}

export default function SubscriptionPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <QuizNav />
      <SubscriptionClient />
      <Footer />
    </div>
  )
}
