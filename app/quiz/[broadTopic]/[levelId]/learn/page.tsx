import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LearnView from '@/components/quiz/LearnView'
import PremiumLearn from '@/components/quiz/PremiumLearn'
import { buildLearningZone } from '@/lib/learningZone'
import { getLevel, getLevelSummaries, subjectGuideFor, type LevelSummary } from '@/lib/content'
import { learnHref, plainText, playHref, prettySlug, subjectLabel, topicHref, truncate } from '@/lib/quizUrls'
import type { QuizLevel } from '@/types/quiz'

export const revalidate = 3600

interface Props {
  params: { broadTopic: string; levelId: string }
}

// Free lessons are prebuilt at deploy; premium ones render on first request.
export async function generateStaticParams() {
  const levels = await getLevelSummaries()
  return levels.filter((l) => !l.is_premium).map((l) => ({ broadTopic: l.broad_topic, levelId: l.id }))
}

function topicName(level: LevelSummary): string {
  return level.broad_topic_display || prettySlug(level.broad_topic)
}

// "Grade 4 English Home Language · Parts of Speech · Nouns"
function contextLine(level: LevelSummary): string {
  const parts = [`Grade ${level.grade} ${subjectLabel(level.subject)}`, topicName(level)]
  if (level.subtopic_display && level.subtopic_display !== topicName(level)) parts.push(level.subtopic_display)
  return parts.join(' · ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = await getLevel(params.levelId)
  if (!level) return {}
  const summary = plainText(level.intro || level.description || '')
  return {
    title: `${level.level_display} · Grade ${level.grade} ${subjectLabel(level.subject)} · ${topicName(level)}`,
    description: truncate(summary || `A short CAPS-aligned lesson, then a ${level.question_count}-question quiz.`, 160),
    alternates: { canonical: learnHref(level) },
    // A premium lesson's body never reaches the HTML, so there's nothing to index.
    ...(level.is_premium && { robots: { index: false, follow: true } }),
  }
}

// Server-rendered so a free lesson's full text is in the page's HTML — it used
// to load in the browser after a spinner, which is all crawlers ever saw.
export default async function LearnPage({ params }: Props) {
  const level = await getLevel(params.levelId)
  if (!level) notFound()

  const guidePage = subjectGuideFor(level.grade, level.subject)
  const guide = guidePage && {
    href: `/subjects/grade-${guidePage.grade}/${guidePage.slug}`,
    label: `Grade ${guidePage.grade} ${guidePage.subjectTitle}`,
  }
  const backHref = topicHref(level)

  if (level.is_premium) {
    return (
      <PremiumLearn
        levelId={level.id}
        broadTopic={level.broad_topic}
        backHref={backHref}
        context={contextLine(level)}
        guide={guide}
      />
    )
  }

  return (
    <LearnView
      title={level.level_display}
      levelOrder={level.level_order}
      questionCount={level.question_count}
      cards={buildLearningZone(level as unknown as QuizLevel)}
      backHref={backHref}
      playHref={playHref(level)}
      context={contextLine(level)}
      guide={guide}
    />
  )
}
