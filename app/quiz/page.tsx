import { createServerClient } from '@/lib/supabase'
import { toDisplayName } from '@/lib/displayName'
import TopicCard from '@/components/quiz/TopicCard'

export default async function QuizBrowsePage({
  searchParams,
}: {
  searchParams: { grade?: string; subject?: string }
}) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  let userProfile: any = null
  let userProgress: string[] = []

  if (userId) {
    const [{ data: profile }, { data: progress }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_progress').select('level_id').eq('user_id', userId).eq('passed', true),
    ])
    userProfile = profile
    userProgress = (progress ?? []).map((p: any) => p.level_id)
  }

  // Fetch all levels to derive broad topics
  const { data: levelRows } = await supabase
    .from('quiz_levels')
    .select('broad_topic, subject, grade, id, is_premium, section_type')

  // Aggregate unique broad topics
  const topicMap = new Map<string, {
    slug: string
    subject: string
    grade: number
    is_premium: boolean
    level_ids: string[]
  }>()

  for (const row of levelRows ?? []) {
    if (!row.broad_topic) continue
    if (!topicMap.has(row.broad_topic)) {
      topicMap.set(row.broad_topic, {
        slug: row.broad_topic,
        subject: row.subject ?? 'Unknown',
        grade: row.grade ?? 0,
        is_premium: false,
        level_ids: [],
      })
    }
    const t = topicMap.get(row.broad_topic)!
    t.level_ids.push(row.id)
    if (row.is_premium) t.is_premium = true
    // Use lowest grade if multiple rows
    if (row.grade && row.grade < t.grade) t.grade = row.grade
  }

  let topics = Array.from(topicMap.values())

  if (searchParams.grade) {
    topics = topics.filter(t => t.grade === Number(searchParams.grade))
  }
  if (searchParams.subject) {
    topics = topics.filter(t =>
      t.subject.toLowerCase().includes(searchParams.subject!.toLowerCase())
    )
  }

  function topicProgress(levelIds: string[]): number {
    if (!levelIds.length) return 0
    const passed = levelIds.filter(id => userProgress.includes(id)).length
    return Math.round((passed / levelIds.length) * 100)
  }

  // Subject → icon + Curio colour name
  const SUBJECT_META: Record<string, { icon: string; color: string }> = {
    'english hl':          { icon: '📚', color: 'coral' },
    'afrikaans fal':       { icon: '🦁', color: 'cyan' },
    'afrikaans hl':        { icon: '🦁', color: 'cyan' },
    'english fal':         { icon: '📖', color: 'plum' },
    'mathematics':         { icon: '🔢', color: 'amber' },
    'natural sciences':    { icon: '🔬', color: 'cyan' },
    'life sciences':       { icon: '🧬', color: 'cyan' },
    'physical sciences':   { icon: '⚛️',  color: 'plum' },
    'social sciences':     { icon: '🌍', color: 'coral' },
    'accounting':          { icon: '📊', color: 'amber' },
    'geography':           { icon: '🗺️', color: 'cyan' },
    'history':             { icon: '📜', color: 'coral' },
    'life orientation':    { icon: '🌱', color: 'cyan' },
    'business studies':    { icon: '💼', color: 'amber' },
    'economics':           { icon: '📈', color: 'amber' },
    'technology':          { icon: '⚙️',  color: 'plum' },
  }

  const grades = [4,5,6,7,8,9,10,11,12]

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#6DD3CE', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10"
          style={{ background: '#FF5E5B', transform: 'translate(-30%, 30%)' }} />

        <div className="relative max-w-4xl mx-auto px-6 py-14">
          {/* Bloom logo + wordmark */}
          <div className="flex items-center gap-3 mb-5">
            <svg width="36" height="36" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE"/>
              <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(72 100 100)"/>
              <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(144 100 100)"/>
              <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(216 100 100)"/>
              <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(288 100 100)"/>
              <circle cx="100" cy="100" r="22" fill="#FF5E5B"/>
            </svg>
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
              curio learning
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight" style={{ color: '#F7F7FF' }}>
            Quiz Adventure 🚀
          </h1>
          <p className="text-lg mb-7 max-w-xl" style={{ color: '#c4b8d8' }}>
            Choose a topic, learn the concepts, then prove what you know.
            Every question makes you smarter!
          </p>

          {/* Auth / XP pill */}
          {userProfile ? (
            <div className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span>⚡</span>
              <span className="font-black" style={{ color: '#F5C842' }}>
                {(userProfile.total_xp ?? 0).toLocaleString()} XP
              </span>
              {(userProfile.streak ?? 0) > 0 && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={{ color: '#F7F7FF' }}>🔥 {userProfile.streak} day streak</span>
                </>
              )}
              {userProfile.is_premium && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={{ color: '#F5C842' }}>✨ Premium</span>
                </>
              )}
            </div>
          ) : (
            <a
              href="/login.html"
              className="inline-block font-black px-6 py-3 rounded-2xl text-sm transition-all hover:-translate-y-0.5"
              style={{ background: '#FF5E5B', color: '#fff', boxShadow: '0 4px 20px rgba(255,94,91,0.4)' }}
            >
              Sign in to track progress ✨
            </a>
          )}
        </div>
      </div>

      {/* ── Grade filter bar ─────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black uppercase tracking-widest mr-1" style={{ color: '#6DD3CE' }}>
            Grade:
          </span>
          <a href="/quiz"
            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
            style={!searchParams.grade
              ? { background: '#6DD3CE', color: '#2B1E3F', borderColor: '#6DD3CE' }
              : { background: 'transparent', color: '#c4b8d8', borderColor: 'rgba(255,255,255,0.15)' }
            }
          >
            All
          </a>
          {grades.map(g => (
            <a key={g} href={`/quiz?grade=${g}`}
              className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
              style={searchParams.grade === String(g)
                ? { background: '#6DD3CE', color: '#2B1E3F', borderColor: '#6DD3CE' }
                : { background: 'transparent', color: '#c4b8d8', borderColor: 'rgba(255,255,255,0.15)' }
              }
            >
              Gr {g}
            </a>
          ))}
        </div>
      </div>

      {/* ── Topics grid ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {topics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>No topics found</h3>
            <p className="text-sm" style={{ color: '#c4b8d8' }}>Try a different grade filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topics.map(topic => {
              const subjectKey = Object.keys(SUBJECT_META).find(k =>
                topic.subject.toLowerCase().includes(k)
              )
              const icon  = subjectKey ? SUBJECT_META[subjectKey].icon  : '📖'
              const color = subjectKey ? SUBJECT_META[subjectKey].color : 'coral'
              const progress = topicProgress(topic.level_ids)
              const isLocked = topic.is_premium && !userProfile?.is_premium && !userProfile?.is_founder

              return (
                <TopicCard
                  key={topic.slug}
                  id={topic.slug}
                  name={toDisplayName(topic.slug)}
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
