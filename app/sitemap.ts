import type { MetadataRoute } from 'next'
import { ALL_GRADES, ALL_SUBJECTS } from '@/lib/subjectsData'
import { getLevelSummaries, groupTopics } from '@/lib/content'
import { learnHref, topicHref } from '@/lib/quizUrls'

const BASE = 'https://www.curiolearning.co.za'

// Next 14 writes each url into <loc> verbatim, so the ampersands in topic
// URLs' query strings must be escaped here or the XML is invalid.
const loc = (path: string) => BASE + path.replace(/&/g, '&amp;')

export const revalidate = 3600

// Only pages with real content to index: no login, checkout, live-quiz or
// premium-locked lesson pages (those are noindexed in their own metadata).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const levels = await getLevelSummaries()

  return [
    ...['/', '/papers', '/quiz', '/subjects', '/about', '/contact', '/privacy', '/terms'].map((p) => ({ url: loc(p) })),
    ...ALL_GRADES.map((g) => ({ url: loc(`/subjects/grade-${g}`) })),
    ...ALL_SUBJECTS.map((s) => ({ url: loc(`/subjects/grade-${s.grade}/${s.slug}`) })),
    ...groupTopics(levels).map((t) => ({ url: loc(topicHref(t)) })),
    ...levels
      .filter((l) => !l.is_premium)
      .map((l) => ({ url: loc(learnHref(l)), lastModified: l.created_at ?? undefined })),
  ]
}
