import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import TopicLevels from '@/components/quiz/TopicLevels'
import { getLevelSummaries } from '@/lib/content'
import { prettySlug, subjectLabel, topicHref } from '@/lib/quizUrls'

export const revalidate = 3600

interface Props {
  params: { broadTopic: string }
  searchParams: { grade?: string | string[]; subject?: string | string[] }
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}

// The levels for exactly one grade + subject + topic. broad_topic slugs repeat
// across grades, so a URL without grade/subject (old links) resolves to the
// first match and gets redirected to that topic's full URL — one address per
// topic, and nobody lands on a mix of several grades' levels.
async function resolveTopic({ params, searchParams }: Props) {
  const broadTopic = safeDecode(params.broadTopic)
  const grade = Number(searchParams.grade) || null
  const subject = typeof searchParams.subject === 'string' ? searchParams.subject : null

  const matches = (await getLevelSummaries()).filter(
    (l) => l.broad_topic === broadTopic && (!grade || l.grade === grade) && (!subject || l.subject === subject)
  )
  if (matches.length === 0) return null

  const first = matches[0]
  return {
    levels: matches.filter((l) => l.grade === first.grade && l.subject === first.subject),
    href: topicHref(first),
    isExact: grade === first.grade && subject === first.subject,
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const topic = await resolveTopic(props)
  if (!topic) return {}
  const first = topic.levels[0]
  const name = first.broad_topic_display || prettySlug(first.broad_topic)
  const subject = subjectLabel(first.subject)
  const free = topic.levels.filter((l) => !l.is_premium).length
  return {
    title: `${name} · Grade ${first.grade} ${subject}`,
    description:
      `${topic.levels.length} CAPS-aligned ${name} levels for Grade ${first.grade} ${subject}, ${free} of them free. ` +
      'Each level starts with a short lesson, then a quiz with instant feedback.',
    alternates: { canonical: topic.href },
  }
}

export default async function BroadTopicPage(props: Props) {
  const topic = await resolveTopic(props)
  if (!topic) notFound()
  if (!topic.isExact) redirect(topic.href)
  return <TopicLevels levels={topic.levels} />
}
