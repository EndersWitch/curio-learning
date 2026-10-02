import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'

export const metadata: Metadata = {
  title: 'Bloom',
  description: "Chat with Bloom, Curio's AI study buddy.",
  // Testers only for now: keep it out of search results until launch.
  robots: { index: false, follow: false },
}

export default function BloomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bloom-page">
      <QuizNav />
      <main className="bloom-main">{children}</main>
    </div>
  )
}
