import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { isLevelPassed, isSubtopicMasteryUnlocked, isBroadTopicMasteryUnlocked } from '@/lib/progress'
import { ProgressBar } from '@/components/ui/XPBar'

interface Props {
  params: { broadTopic: string }
}

export default async function BroadTopicPage({ params }: Props) {
  const broadTopicSlug = decodeURIComponent(params.broadTopic)
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // Fetch all levels for this broad topic
  const { data: levels, error } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('broad_topic', broadTopicSlug)
    .order('level_number')

  if (error || !levels || levels.length === 0) notFound()

  // Fetch user progress
  let userProgress: any[] = []
  let userProfile: any = null

  if (userId) {
    const [{ data: prog }, { data: profile }] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ])
    userProgress = prog ?? []
    userProfile = profile
  }

  // Group levels by subtopic_id
  const subtopicMap = new Map<
    string,
    { name: string; levels: any[]; masteryLevel: any | null; normalLevels: any[] }
  >()

  for (const level of levels) {
    if (level.section_type === 'broad_topic_mastery') continue

    const key = level.subtopic_id ?? '_general'
    if (!subtopicMap.has(key)) {
      subtopicMap.set(key, {
        name: level.subtopic_id ?? 'General Practice',
        levels: [],
        masteryLevel: null,
        normalLevels: [],
      })
    }
    const sub = subtopicMap.get(key)!
    if (level.section_type === 'subtopic_mastery') {
      sub.masteryLevel = level
    } else {
      sub.normalLevels.push(level)
    }
    sub.levels.push(level)
  }

  const broadMasteryLevel = levels.find((l) => l.section_type === 'broad_topic_mastery')
  const subtopicMasteryIds = [...subtopicMap.values()]
    .map((s) => s.masteryLevel?.id)
    .filter(Boolean)

  const broadMasteryUnlocked = isBroadTopicMasteryUnlocked(userProgress, subtopicMasteryIds)

  // Overall progress
  const allNormalLevelIds = levels
    .filter((l) => l.section_type === 'level' || l.section_type === 'general_practice')
    .map((l) => l.id)
  const passedCount = allNormalLevelIds.filter((id) =>
    isLevelPassed(userProgress, id)
  ).length
  const overallProgress =
    allNormalLevelIds.length > 0
      ? Math.round((passedCount / allNormalLevelIds.length) * 100)
      : 0

  const subject = levels[0]?.subject ?? 'Subject'
  const grade = levels[0]?.grade ?? ''
  const isUserPremium = userProfile?.is_premium || userProfile?.is_founder || false

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1 text-xs text-violet-300 font-semibold mb-4 hover:text-white transition-colors"
          >
            ← Back to Topics
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-violet-300">
              {subject} · Grade {grade}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{broadTopicSlug}</h1>

          {overallProgress > 0 && (
            <div className="mt-4 max-w-sm">
              <ProgressBar
                value={overallProgress}
                color="bg-gradient-to-r from-cyan-400 to-emerald-400"
                label={`${overallProgress}% complete`}
                showPercent
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Subtopics */}
        {[...subtopicMap.entries()].map(([key, sub]) => {
          const subtopicPassed = sub.normalLevels.every((l) =>
            isLevelPassed(userProgress, l.id)
          )
          const masteryUnlocked = isSubtopicMasteryUnlocked(
            userProgress,
            sub.normalLevels.map((l) => l.id)
          )
          const masteryPassed = sub.masteryLevel
            ? isLevelPassed(userProgress, sub.masteryLevel.id)
            : false

          return (
            <div key={key} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Subtopic header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-800 text-lg">{sub.name}</h2>
                  <p className="text-xs text-slate-400">
                    {sub.normalLevels.length} levels
                    {sub.masteryLevel ? ' + Mastery Challenge' : ''}
                  </p>
                </div>
                {masteryPassed && (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    ✅ Mastered
                  </span>
                )}
              </div>

              {/* Level list */}
              <div className="p-4 space-y-2">
                {sub.normalLevels.map((level, i) => {
                  const passed = isLevelPassed(userProgress, level.id)
                  const unlocked = i === 0 || isLevelPassed(userProgress, sub.normalLevels[i - 1].id)
                  const locked = !unlocked || (level.is_premium && !isUserPremium)

                  return (
                    <LevelRow
                      key={level.id}
                      level={level}
                      passed={passed}
                      locked={locked}
                      broadTopicSlug={params.broadTopic}
                      subtopicSlug={encodeURIComponent(key)}
                    />
                  )
                })}

                {/* Mastery level */}
                {sub.masteryLevel && (
                  <div className="mt-2 pt-2 border-t border-dashed border-amber-200">
                    <LevelRow
                      level={sub.masteryLevel}
                      passed={masteryPassed}
                      locked={!masteryUnlocked || (sub.masteryLevel.is_premium && !isUserPremium)}
                      broadTopicSlug={params.broadTopic}
                      subtopicSlug={encodeURIComponent(key)}
                      isMastery
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Broad Topic Mastery — the final boss */}
        {broadMasteryLevel && (
          <div
            className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 ${
              broadMasteryUnlocked
                ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-lg shadow-violet-100'
                : 'border-dashed border-slate-300 bg-slate-50 opacity-60'
            }`}
          >
            <div className="px-6 py-5 flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  broadMasteryUnlocked
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200'
                    : 'bg-slate-200'
                }`}
              >
                {broadMasteryUnlocked ? '👑' : '🔒'}
              </div>
              <div className="flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-violet-500">
                  Final Boss
                </span>
                <h3 className="font-black text-xl text-slate-800">{broadTopicSlug} Mastery</h3>
                <p className="text-sm text-slate-500">
                  {broadMasteryUnlocked
                    ? `${broadMasteryLevel.question_count} questions · +${broadMasteryLevel.xp_reward} XP · Prove total mastery`
                    : 'Complete all subtopic masteries to unlock'}
                </p>
              </div>
              {broadMasteryUnlocked && (
                <Link
                  href={`/quiz/${params.broadTopic}/_mastery/${broadMasteryLevel.id}/learn`}
                  className="flex-shrink-0 px-5 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
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

function LevelRow({
  level,
  passed,
  locked,
  broadTopicSlug,
  subtopicSlug,
  isMastery = false,
}: {
  level: any
  passed: boolean
  locked: boolean
  broadTopicSlug: string
  subtopicSlug: string
  isMastery?: boolean
}) {
  const learnHref = `/quiz/${broadTopicSlug}/${subtopicSlug}/${level.id}/learn`

  const inner = (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 ${
          passed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : locked
            ? 'bg-slate-100 border-slate-300 text-slate-400'
            : isMastery
            ? 'bg-amber-50 border-amber-400 text-amber-600'
            : 'bg-violet-50 border-violet-400 text-violet-600'
        }`}
      >
        {passed ? '✓' : locked ? '🔒' : isMastery ? '🏆' : level.level_number}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold text-sm truncate ${
            locked ? 'text-slate-400' : 'text-slate-800'
          }`}
        >
          {level.title}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs flex-shrink-0">
        <span className="text-slate-400">{level.question_count}Q</span>
        <span className="font-semibold text-amber-500">+{level.xp_reward} XP</span>
        {!locked && !passed && (
          <span className="text-violet-500 font-black">→</span>
        )}
      </div>
    </div>
  )

  if (locked) {
    return <div className="rounded-xl px-3 py-2.5 bg-slate-50 cursor-not-allowed">{inner}</div>
  }

  return (
    <Link
      href={learnHref}
      className={`block rounded-xl px-3 py-2.5 transition-all duration-150 hover:shadow-sm ${
        passed
          ? 'bg-emerald-50 hover:bg-emerald-100'
          : isMastery
          ? 'bg-amber-50 hover:bg-amber-100'
          : 'bg-slate-50 hover:bg-violet-50'
      }`}
    >
      {inner}
    </Link>
  )
}
