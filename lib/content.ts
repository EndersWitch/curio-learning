// Server-side reads of the public study content (papers, quiz levels), so
// pages can put it straight into their HTML. Anything a page only fetches in
// the browser after load is invisible to search engines and to AdSense's site
// review, which judge a page by its first HTML response.
//
// Reads go to Supabase's REST API with the publishable key and no user
// session, so they see exactly what an anonymous visitor may see and are cached for an hour, so papers and levels
// added in the admin panel appear within the hour without a redeploy. A failed
// read throws: during revalidation Next keeps serving the last good page
// rather than caching an empty one.
//
// Server components only — the browser keeps using `sb` from lib/supabase.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { ALL_SUBJECTS, type SubjectPage } from '@/lib/subjectsData'
import { prettySlug } from '@/lib/quizUrls'
import type { CatalogLevel } from '@/lib/levelCatalog'

const REVALIDATE_SECONDS = 3600

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    next: { revalidate: REVALIDATE_SECONDS },
  })
  if (!res.ok) throw new Error(`Supabase read failed (${res.status}) for ${path.split('?')[0]}`)
  return res.json() as Promise<T>
}

// ─── Papers ────────────────────────────────────────────────────────────────

export interface Paper {
  id: number
  grade: number
  subject: string
  title: string
  has_memo: boolean
  file_url: string
  memo_url: string | null
  topic: string | null
  section_type: string | null
}

const byTitle = (a: { title: string }, b: { title: string }) =>
  a.title.localeCompare(b.title, undefined, { numeric: true }) // "Paper 2" before "Paper 10"

export async function getPapers(): Promise<Paper[]> {
  const rows = await restGet<Paper[]>(
    'papers?select=id,grade,subject,title,has_memo,file_url,memo_url,topic,section_type&order=grade.asc,subject.asc'
  )
  return rows.sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject) || byTitle(a, b))
}

// ─── Quiz levels ───────────────────────────────────────────────────────────
//
// Premium content is locked in the database (migration
// 20261105130000_lock_premium_content.sql): quiz_levels and questions only
// return Premium rows to paid-up members. These reads use the publishable key
// with no user session, so they run as an anonymous visitor and can never
// see Premium lesson bodies or questions. Never swap in a service-role key
// here — that would put Premium content into public HTML.
//
// Listings come from quiz_level_catalog(): every level's name, order and lock
// state with no content, so locked levels still show with a padlock.

export type LevelSummary = CatalogLevel

export interface LevelContent {
  intro: string | null
  concepts: unknown[] | null
  tested: string[] | null
}

const SUMMARY_COLS =
  'id,grade,subject,phase,broad_topic,broad_topic_display,subtopic_id,subtopic_display,' +
  'level_id,level_display,level_order,section_type,difficulty,is_premium,question_count,description,created_at'

// Every level's catalogue row — small enough to fetch whole and filter in
// code, and one shared URL means one cached request per hour.
export function getLevelSummaries(): Promise<LevelSummary[]> {
  return restGet<LevelSummary[]>(
    `rpc/quiz_level_catalog?select=${SUMMARY_COLS}&order=grade.asc,broad_topic.asc,level_order.asc`
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// One level's catalogue row (works for Premium levels too; no content).
export async function getLevelMeta(id: string): Promise<LevelSummary | null> {
  if (!UUID_RE.test(id)) return null // PostgREST would 400 on a malformed uuid
  return (await getLevelSummaries()).find((l) => l.id === id) ?? null
}

// The lesson body of a FREE level. Returns null for Premium levels without
// asking the database at all; the database would refuse an anonymous read
// of a Premium row anyway, so this is belt and braces.
export async function getFreeLevelContent(meta: LevelSummary): Promise<LevelContent | null> {
  if (meta.is_premium) return null
  const rows = await restGet<(LevelContent & { is_premium: boolean })[]>(
    `quiz_levels?select=intro,concepts,tested,is_premium&id=eq.${meta.id}&is_premium=is.false`
  )
  const row = rows[0]
  if (!row || row.is_premium) return null
  return { intro: row.intro, concepts: row.concepts, tested: row.tested }
}

export interface TopicSummary {
  broad_topic: string
  broad_topic_display: string
  subject: string
  grade: number
  phase: string
  level_count: number
  free_level_count: number
}

// One card per grade+subject+topic — the same topic name in different
// grades/subjects must not collapse into one.
export function groupTopics(levels: LevelSummary[]): TopicSummary[] {
  const map = new Map<string, TopicSummary>()
  for (const row of levels) {
    if (!row.broad_topic) continue
    const key = `${row.grade}|${row.subject}|${row.broad_topic}`
    if (!map.has(key)) {
      map.set(key, {
        broad_topic: row.broad_topic,
        broad_topic_display: row.broad_topic_display || prettySlug(row.broad_topic),
        subject: row.subject || '',
        grade: row.grade || 0,
        phase: row.phase || '',
        level_count: 0,
        free_level_count: 0,
      })
    }
    const t = map.get(key)!
    t.level_count++
    if (!row.is_premium) t.free_level_count++
  }
  return Array.from(map.values())
}

// Subject guide (/subjects/grade-N/slug) that covers a quiz/papers subject key.
export function subjectGuideFor(grade: number, subjectKey: string): SubjectPage | undefined {
  return ALL_SUBJECTS.find((s) => s.grade === grade && s.papersSubjectKey === subjectKey)
}
