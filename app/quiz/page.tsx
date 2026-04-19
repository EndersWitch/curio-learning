import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import TopicCard from '@/components/quiz/TopicCard'
import type { BroadTopic } from '@/types/quiz'

export default async function QuizBrowsePage({
  searchParams,
}: {
  searchParams: { grade?: string; subject?: string; phase?: string }
}) {
  const supabase = createServerClient()

  // Fetch user session
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // Fetch user profile for premium status and progress
  let userProfile = null
  let userProgress: string[] = [] // array of passed level ids

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    userProfile = profile

    const { data: progress } = await supabase
      .from('user_progress')
      .select('level_id')
      .eq('user_id', userId)
      .eq('passed', true)
    userProgress = (progress ?? []).map((p: any) => p.level_id)
  }

  // Build query for broad topics
  let query = supabase
    .from('quiz_levels')
    .select('broad_topic, subject, grade, section_type, id, is_premium')
    .neq('broad_topic', null)

  const { data: levelRows } = await query

  // Derive broad topics from levels (since we don't have a separate broad_topics table per original schema)
  // Aggregate unique broad topics with metadata
  const topicMap = new Map<
    string,
    {
      name: string
      subject: string
      grade: number
      is_premium: boolean
      level_ids: string[]
    }
  >()

  for (const row of levelRows ?? []) {
    if (!row.broad_topic) continue
    if (!topicMap.has(row.broad_topic)) {
      topicMap.set(row.broad_topic, {
        name: row.broad_topic,
        subject: row.subject ?? 'Unknown',
        grade: row.grade ?? 0,
        is_premium: row.is_premium ?? false,
        level_ids: [],
      })
    }
    topicMap.get(row.broad_topic)!.level_ids.push(row.id)
    if (row.is_premium) topicMap.get(row.broad_topic)!.is_premium = true
  }

  let topics = Array.from(topicMap.values())

  // Filter
  if (searchParams.grade) {
    topics = topics.filter((t) => t.grade === Number(searchParams.grade))
  }
  if (searchParams.subject) {
    topics = topics.filter((t) =>
      t.subject.toLowerCase().includes(searchParams.subject!.toLowerCase())
    )
  }

  // Compute progress per topic
  function topicProgress(levelIds: string[]): number {
    if (levelIds.length === 0) return 0
    const passed = levelIds.filter((id) => userProgress.includes(id)).length
    return Math.round((passed / levelIds.length) * 100)
  }

  // Icon and color mapping by subject
  const SUBJECT_META: Record<string, { icon: string; color: string }> = {
    'English HL': { icon: '📚', color: 'violet' },
    'Afrikaans FAL': { icon: '🦁', color: 'amber' },
    'Mathematics': { icon: '🔢', color: 'blue' },
    'Natural Sciences': { icon: '🔬', color: 'emerald' },
    'Social Sciences': { icon: '🌍', color: 'cyan' },
    'Life Sciences': { icon: '🧬', color: 'emerald' },
    'Physical Sciences': { icon: '⚛️', color: 'blue' },
    'Accounting': { icon: '📊', color: 'amber' },
    'Geography': { icon: '🗺️', color: 'cyan' },
    'History': { icon: '📜', color: 'coral' },
  }

  const grades = [4, 5, 6, 7, 8, 9, 10, 11, 12]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-700 via-indigo-700 to-violet-800 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 translate-x-24 -translate-y-24" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-400/10 -translate-x-12 translate-y-12" />

        <div className="relative max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎓</span>
            <span className="text-xs font-black uppercase tracking-widest text-violet-300">
              curio learning
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
            Quiz Adventure
          </h1>
          <p className="text-violet-200 text-lg max-w-xl mb-6">
            Choose a topic, learn the concepts, and prove your knowledge. Every question you answer makes you smarter! 🚀
          </p>

          {/* User pill */}
          {userProfile ? (
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 text-sm">
              <span className="text-xl">⚡</span>
              <span className="font-black">{(userProfile as any).total_xp?.toLocaleString()} XP</span>
              {(userProfile as any).streak > 0 && (
                <>
                  <span className="text-white/40">·</span>
                  <span>🔥 {(userProfile as any).streak} day streak</span>
                </>
              )}
            </div>
          ) : (
            <a
              href="/auth/login"
              className="inline-block bg-white text-violet-700 font-black px-5 py-2.5 rounded-2xl text-sm hover:bg-violet-50 transition-colors"
            >
              Sign in to track progress ✨
            </a>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Grade:</span>
          <a
            href="/quiz"
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              !searchParams.grade
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
            }`}
          >
            All
          </a>
          {grades.map((g) => (
            <a
              key={g}
              href={`/quiz?grade=${g}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                searchParams.grade === String(g)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              Gr {g}
            </a>
          ))}
        </div>
      </div>

      {/* Topics grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {topics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-slate-700 mb-2">No topics found</h3>
            <p className="text-slate-400 text-sm">
              Try a different grade or subject filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topics.map((topic) => {
              const meta = Object.entries(SUBJECT_META).find(([k]) =>
                topic.subject.toLowerCase().includes(k.toLowerCase())
              )
              const icon = meta?.[1]?.icon ?? '📖'
              const color = meta?.[1]?.color ?? 'violet'
              const progress = topicProgress(topic.level_ids)
              const isLocked = topic.is_premium && !userProfile?.is_premium

              return (
                <TopicCard
                  key={topic.name}
                  id={topic.name}
                  name={topic.name}
                  subject={topic.subject}
                  grade={topic.grade}
                  description={`${topic.level_ids.length} levels to master`}
                  icon={icon}
                  color={color}
                  progressPercent={progress}
                  isPremium={topic.is_premium}
                  isLocked={isLocked}
                  subtopicCount={topic.level_ids.length}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
