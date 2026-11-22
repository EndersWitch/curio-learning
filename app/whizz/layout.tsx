import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import './tests.css'
import { WHIZZ_FAQ } from '@/lib/testbuilder/whizzFaq'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Whizz by Curio Learning',
      url: 'https://www.curiolearning.co.za/whizz',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      inLanguage: 'en-ZA',
      description: 'A practice-test maker for South African learners in Grades 4 to 12: build a test from your topics, get it marked, and see where the marks went.',
      provider: { '@type': 'Organization', name: 'Curio Learning', url: 'https://www.curiolearning.co.za' },
      audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      areaServed: 'ZA',
    },
    {
      '@type': 'FAQPage',
      mainEntity: WHIZZ_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
}

export const metadata: Metadata = {
  title: 'Whizz | Curio Learning',
  description: 'Tell Whizz what your test covers and get a practice test, marked, with a marked paper to learn from.',
  alternates: { canonical: '/whizz' },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.curiolearning.co.za/whizz',
    siteName: 'curio learning',
    title: 'Whizz: a practice test made for you | Curio Learning',
    description: 'Tell Whizz what your test covers. Get a practice test, marked, with a marked paper that shows where you lost marks. For South African learners, Grades 4 to 12.',
  },
  twitter: { card: 'summary', title: 'Whizz: a practice test made for you', description: 'Tell Whizz what your test covers and get a marked practice test.' },
  robots: { index: true, follow: true },
}

export default function WhizzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bloom-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <QuizNav />
      <main className="bloom-main">
        <div className="tb">{children}</div>
      </main>
    </div>
  )
}
