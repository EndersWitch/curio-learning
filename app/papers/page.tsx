import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import PapersClient from '@/components/PapersClient'

export const metadata: Metadata = {
  title: 'Exam Papers',
  description: 'Browse and download free CAPS exam papers and memos for every grade and subject, Grade 4 to Grade 12.',
}

export default function PapersPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <QuizNav />
      <PapersClient />
      <Footer />
    </div>
  )
}
