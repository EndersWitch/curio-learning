// Server-side reads of the public study content (papers, quiz levels), so
// pages can put it straight into their HTML. Anything a page only fetches in
// the browser after load is invisible to search engines and to AdSense's site
// review, which judge a page by its first HTML response.
//
// Reads go to Supabase's REST API with the publishable key (same public-read
// policies the browser uses) and are cached for an hour, so papers and levels
// added in the admin panel appear within the hour without a redeploy. A failed
// read throws: during revalidation Next keeps serving the last good page
// rather than caching an empty one.
//
// Server components only — the browser keeps using `sb` from lib/supabase.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { ALL_SUBJECTS, type SubjectPage } from '@/lib/subjectsData'
import { prettySlug } from '@/lib/quizUrls'

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

export interface LevelSummary {
  id: string
  grade: number
  subject: string
  phase: string | null
  broad_topic: string
  broad_topic_display: string | null
  subtopic_id: string | null
  subtopic_display: string | null
  level_id: string
  level_display: string
  level_order: number
  section_type: string
  difficulty: string | null
  is_premium: boolean
  question_count: number
  description: string | null
  created_at: string | null
}

export interface LevelFull extends LevelSummary {
  intro: string | null
  concepts: unknown[] | null
  tested: string[] | null
}

const SUMMARY_COLS =
  'id,grade,subject,phase,broad_topic,broad_topic_display,subtopic_id,subtopic_display,' +
  'level_id,level_display,level_order,section_type,difficulty,is_premium,question_count,description,created_at'

// Every level without its lesson body — small enough to fetch whole and
// filter in code, and one shared URL means one cached request per hour.
export function getLevelSummaries(): Promise<LevelSummary[]> {
  return restGet<LevelSummary[]>(`quiz_levels?select=${SUMMARY_COLS}&order=grade.asc,broad_topic.asc,level_order.asc`)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getLevel(id: string): Promise<LevelFull | null> {
  if (!UUID_RE.test(id)) return null // PostgREST would 400 on a malformed uuid
  const rows = await restGet<LevelFull[]>(`quiz_levels?select=${SUMMARY_COLS},intro,concepts,tested&id=eq.${id}`)
  return rows[0] ?? null
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
