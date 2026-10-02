import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  // A plain-string title here would drop the root "· curio learning"
  // template for every page below this layout, so restate it.
  title: { default: 'Quiz · curio learning', template: '%s · curio learning' },
  description: 'CAPS-aligned quizzes for South African learners.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <QuizNav />
      <main style={{ paddingTop: '60px' }}>{children}</main>
    </div>
  )
}
