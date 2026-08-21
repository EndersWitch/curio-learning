import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import SubscriptionClient from '@/components/SubscriptionClient'

export const metadata: Metadata = {
  title: 'Premium',
  description: 'Upgrade to Curio Premium for AI-powered quizzes, Deep Learn explanations, custom tests and progress tracking.',
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
