import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  title: 'Quiz Adventure | curio learning',
  description: 'Master your subjects with gamified quiz challenges — CAPS-aligned for South African learners.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <QuizNav />
      <main>{children}</main>
    </div>
  )
}
