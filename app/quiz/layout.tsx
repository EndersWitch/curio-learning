import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  title: 'Quiz | curio learning',
  description: 'CAPS-aligned quiz for South African learners, Grades 4 to 12.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ background: '#1a1228' }}>
        <QuizNav />
        <main style={{ paddingTop: '60px' }}>{children}</main>
      </div>
    </AuthProvider>
  )
}
