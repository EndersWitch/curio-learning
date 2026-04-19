import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  title: 'Quiz | curio learning',
  description: 'CAPS-aligned quiz adventure for South African learners — Grades 4 to 12.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      <QuizNav />
      <main>{children}</main>
    </div>
  )
}
