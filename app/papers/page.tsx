import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import PapersClient from '@/components/PapersClient'
import { getPapers } from '@/lib/content'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Exam Papers',
  description: 'Browse and download free CAPS-aligned practice papers with full marking memos for South African learners.',
  alternates: { canonical: '/papers' },
}

// Papers are fetched here on the server so the whole library is in the HTML;
// PapersClient only adds search and filtering on top.
export default async function PapersPage() {
  const papers = await getPapers()
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <QuizNav />
      <PapersClient papers={papers} />
      <Footer />
    </div>
  )
}
