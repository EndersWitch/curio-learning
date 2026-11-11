import type { Metadata } from 'next'
import QuizBrowse from '@/components/quiz/QuizBrowse'
import { getLevelSummaries, groupTopics } from '@/lib/content'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'CAPS quizzes & lessons',
  description:
    'Free CAPS-aligned English Home Language lessons and quizzes for Grades 4 to 7. Every level starts with a short lesson, then tests what you have learned with instant feedback.',
  alternates: { canonical: '/quiz' },
}

// Rendered on the server so every topic card (and its link) is in the HTML —
// this page used to fetch topics in the browser, and crawlers saw an empty
// "No topics yet" state.
export default async function QuizBrowsePage() {
  const topics = groupTopics(await getLevelSummaries())
  return <QuizBrowse topics={topics} />
}
