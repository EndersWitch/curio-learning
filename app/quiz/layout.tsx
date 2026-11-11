import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  // The root layout's template already adds "· curio learning" to this
  // default, so it must not contain the brand itself (it showed twice). The
  // template is restated so pages below this layout keep the suffix.
  title: { default: 'Quiz', template: '%s · curio learning' },
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
