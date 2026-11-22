import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import './tests.css'

export const metadata: Metadata = {
  title: 'Whizz | Curio Learning',
  description: 'Tell Whizz what your test covers and get a practice test, marked, with a marked paper to learn from.',
  // Testers only for now: keep it out of search results until launch.
  robots: { index: false, follow: false },
}

export default function WhizzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bloom-page">
      <QuizNav />
      <main className="bloom-main">
        <div className="tb">{children}</div>
      </main>
    </div>
  )
}
