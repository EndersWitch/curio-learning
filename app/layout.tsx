import type { Metadata } from 'next'
import { Poppins, DM_Sans } from 'next/font/google'
import './globals.css'
import AdGate from '@/components/AdGate'
import { AccountDrawerProvider } from '@/components/AccountDrawerProvider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.curiolearning.co.za'),
  title: {
    default: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    template: '%s · curio learning',
  },
  description:
    'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners, Grades 4–12. Practise smarter with curio learning.',
  keywords: [
    'CAPS', 'exam papers', 'practice papers', 'memos', 'South Africa',
    'Grade 4', 'Grade 12', 'quizzes', 'study', 'DBE',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.curiolearning.co.za',
    siteName: 'curio learning',
    title: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    description:
      'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners, Grades 4–12.',
  },
  twitter: {
    card: 'summary',
    title: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    description:
      'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <AccountDrawerProvider>{children}</AccountDrawerProvider>
        <AdGate />
      </body>
    </html>
  )
}
