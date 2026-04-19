import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { toDisplayName } from '@/lib/displayName'
import { isLevelPassed, isSubtopicMasteryUnlocked, isBroadTopicMasteryUnlocked } from '@/lib/progress'

interface Props { params: { broadTopic: string } }

export default async function BroadTopicPage({ params }: Props) {
  const supabase = createServerClient()
  const broadTopicSlug = decodeURIComponent(params.broadTopic)

  const { data: levels, error } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('broad_topic', broadTopicSlug)
    .order('level_number')

  if (error || !levels || levels.length === 0) notFound()

  let userProgress: any[] = []
  let userProfile: any    = null
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user?.id) {
    const [{ data: prog }, { data: profile }] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', session.user.id),
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    ])
    userProgress = prog ?? []
    userProfile  = profile
  }

  const isUserPremium = userProfile?.is_premium || userProfile?.is_founder || false
  const subject = levels[0]?.subject ?? ''
  const grade   = levels[0]?.grade   ?? ''

  // Group by subtopic
  const subtopicMap = new Map<string, { normalLevels: any[]; masteryLevel: any | null }>()
  let broadMasteryLevel: any = null

  for (const level of levels) {
    if (level.section_type === 'broad_topic_mastery') { broadMasteryLevel = level; continue }
    const key = level.subtopic_id ?? '_general'
    if (!subtopicMap.has(key)) subtopicMap.set(key, { normalLevels: [], masteryLevel: null })
    const sub = subtopicMap.get(key)!
    if (level.section_type === 'subtopic_mastery') sub.masteryLevel = level
    else sub.normalLevels.push(level)
  }

  const subtopicMasteryIds = [...subtopicMap.values()].map(s => s.masteryLevel?.id).filter(Boolean)
  const broadMasteryUnlocked = isBroadTopicMasteryUnlocked(userProgress, subtopicMasteryIds)

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/quiz"
            className="inline-flex items-center gap-1 text-xs font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: '#6DD3CE' }}>
            ← Back to Topics
          </Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#6DD3CE' }}>
            {subject} · Grade {grade}
          </p>
          <h1 className="text-3xl md:text-4xl font-black" style={{ color: '#F7F7FF' }}>
            {toDisplayName(broadTopicSlug)}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Subtopic sections */}
        {[...subtopicMap.entries()].map(([key, sub]) => {
          const masteryUnlocked = isSubtopicMasteryUnlocked(userProgress, sub.normalLevels.map(l => l.id))
          const masteryPassed   = sub.masteryLevel ? isLevelPassed(userProgress, sub.masteryLevel.id) : false

          return (
            <div key={key} className="rounded-3xl overflow-hidden"
              style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.12)' }}>

              {/* Subtopic header */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="font-black text-lg" style={{ color: '#F7F7FF' }}>
                    {toDisplayName(key === '_general' ? 'General Practice' : key)}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>
                    {sub.normalLevels.length} levels{sub.masteryLevel ? ' + Mastery' : ''}
                  </p>
                </div>
                {masteryPassed && (
                  <span className="text-xs font-black px-3 py-1 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
                    ✅ Mastered
                  </span>
                )}
              </div>

              {/* Level rows */}
              <div className="p-4 space-y-2">
                {sub.normalLevels.map((level, i) => {
                  const passed   = isLevelPassed(userProgress, level.id)
                  const unlocked = i === 0 || isLevelPassed(userProgress, sub.normalLevels[i-1].id)
                  const locked   = !unlocked || (level.is_premium && !isUserPremium)
                  return (
                    <LevelRow key={level.id} level={level} passed={passed} locked={locked}
                      broadTopicSlug={params.broadTopic} subtopicSlug={encodeURIComponent(key)} />
                  )
                })}

                {sub.masteryLevel && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(245,200,66,0.3)' }}>
                    <LevelRow level={sub.masteryLevel} passed={isLevelPassed(userProgress, sub.masteryLevel.id)}
                      locked={!masteryUnlocked || (sub.masteryLevel.is_premium && !isUserPremium)}
                      broadTopicSlug={params.broadTopic} subtopicSlug={encodeURIComponent(key)} isMastery />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Final boss — broad topic mastery */}
        {broadMasteryLevel && (
          <div className="rounded-3xl overflow-hidden transition-all duration-300"
            style={{
              background: broadMasteryUnlocked
                ? 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)'
                : '#231935',
              border: broadMasteryUnlocked
                ? '2px solid rgba(109,211,206,0.4)'
                : '2px dashed rgba(255,255,255,0.1)',
              opacity: broadMasteryUnlocked ? 1 : 0.6,
            }}>
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: broadMasteryUnlocked ? 'rgba(109,211,206,0.15)' : 'rgba(255,255,255,0.05)',
                  border: broadMasteryUnlocked ? '1px solid rgba(109,211,206,0.3)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                {broadMasteryUnlocked ? '👑' : '🔒'}
              </div>
              <div className="flex-1">
                <span className="text-xs font-black uppercase tracking-wider"
                  style={{ color: '#6DD3CE' }}>Final Boss</span>
                <h3 className="font-black text-xl" style={{ color: '#F7F7FF' }}>
                  {toDisplayName(broadTopicSlug)} Mastery
                </h3>
                <p className="text-sm mt-0.5" style={{ color: '#9b8ab0' }}>
                  {broadMasteryUnlocked
                    ? `${broadMasteryLevel.question_count} questions · +${broadMasteryLevel.xp_reward} XP`
                    : 'Complete all subtopic masteries to unlock'}
                </p>
              </div>
              {broadMasteryUnlocked && (
                <Link href={`/quiz/${params.broadTopic}/_mastery/${broadMasteryLevel.id}/learn`}
                  className="flex-shrink-0 px-5 py-3 rounded-2xl font-black text-sm text-white transition-all hover:-translate-y-0.5"
                  style={{ background: '#FF5E5B', boxShadow: '0 4px 16px rgba(255,94,91,0.35)' }}>
                  Enter →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LevelRow({ level, passed, locked, broadTopicSlug, subtopicSlug, isMastery = false }: {
  level: any; passed: boolean; locked: boolean
  broadTopicSlug: string; subtopicSlug: string; isMastery?: boolean
}) {
  const learnHref = `/quiz/${broadTopicSlug}/${subtopicSlug}/${level.id}/learn`

  const rowStyle: React.CSSProperties = locked
    ? { background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed', opacity: 0.5 }
    : passed
    ? { background: 'rgba(52,211,153,0.06)' }
    : isMastery
    ? { background: 'rgba(245,200,66,0.06)' }
    : { background: 'rgba(255,255,255,0.03)' }

  const inner = (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
      style={rowStyle}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
        style={passed
          ? { background: '#34D399', borderColor: '#34D399', color: '#fff' }
          : locked
          ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#9b8ab0' }
          : isMastery
          ? { background: 'rgba(245,200,66,0.12)', borderColor: 'rgba(245,200,66,0.4)', color: '#F5C842' }
          : { background: 'rgba(109,211,206,0.08)', borderColor: 'rgba(109,211,206,0.3)', color: '#6DD3CE' }
        }>
        {passed ? '✓' : locked ? '🔒' : isMastery ? '🏆' : level.level_number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate"
          style={{ color: locked ? '#9b8ab0' : '#F7F7FF' }}>
          {level.title}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: '#9b8ab0' }}>
        <span>{level.question_count}Q</span>
        <span className="font-semibold" style={{ color: '#F5C842' }}>+{level.xp_reward} XP</span>
        {!locked && !passed && <span style={{ color: '#6DD3CE' }}>→</span>}
      </div>
    </div>
  )

  if (locked) return <div>{inner}</div>
  return <Link href={learnHref} className="block hover:brightness-110 transition-all">{inner}</Link>
}
