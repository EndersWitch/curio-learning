import Link from 'next/link'
import { toDisplayName } from '@/lib/displayName'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { isLevelPassed, isSubtopicMasteryUnlocked } from '@/lib/progress'
import { ProgressBar, XPBadge } from '@/components/ui/XPBar'

interface Props {
  params: { broadTopic: string; subtopic: string }
}

export default async function SubtopicPage({ params }: Props) {
  const supabase = createServerClient()
  const subtopicSlug = decodeURIComponent(params.subtopic)

  // Fetch all levels that belong to this subtopic
  const { data: levels, error } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('subtopic_id', subtopicSlug)
    .order('level_number')

  if (error || !levels || levels.length === 0) notFound()

  // Session + progress
  // Session is managed client-side via localStorage (curio_session)
  // Server components cannot read localStorage; auth-dependent UI renders client-side
  const userId: string | undefined = undefined

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

  const isUserPremium = userProfile?.is_premium || userProfile?.is_founder || false

  // Split into normal levels vs mastery
  const normalLevels = levels.filter((l) => l.section_type === 'level')
  const masteryLevel = levels.find((l) => l.section_type === 'subtopic_mastery')

  const normalIds = normalLevels.map((l) => l.id)
  const masteryUnlocked = isSubtopicMasteryUnlocked(userProgress, normalIds)
  const masteryPassed = masteryLevel ? isLevelPassed(userProgress, masteryLevel.id) : false

  // Progress stats
  const passedNormalCount = normalIds.filter((id) => isLevelPassed(userProgress, id)).length
  const progressPercent =
    normalIds.length > 0 ? Math.round((passedNormalCount / normalIds.length) * 100) : 0

  const totalXP = levels.reduce((sum, l) => sum + (l.xp_reward ?? 0), 0)
  const subtopicName = toDisplayName(subtopicSlug)
  const subject = levels[0]?.subject ?? ''
  const grade = levels[0]?.grade ?? ''
  const broadTopicName = decodeURIComponent(params.broadTopic)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)" }} className="text-white">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-violet-300 mb-5 flex-wrap">
            <Link href="/quiz" className="hover:text-white transition-colors">Topics</Link>
            <span>›</span>
            <Link href={`/quiz/${params.broadTopic}`} className="hover:text-white transition-colors">
              {toDisplayName(broadTopicName)}
            </Link>
            <span>›</span>
            <span className="text-white font-semibold">{toDisplayName(subtopicSlug)}</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-1">
                {subject} · Grade {grade}
              </p>
              <h1 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
                {toDisplayName(subtopicSlug)}
              </h1>
              <p className="text-violet-200 text-sm">
                {normalLevels.length} levels{masteryLevel ? ' + Mastery Challenge' : ''}
                {' · '}up to{' '}
                <span className="font-bold text-amber-300">⚡ {totalXP} XP</span>
              </p>
            </div>

            {/* Status badge */}
            {masteryPassed ? (
              <div className="flex-shrink-0 bg-emerald-400/20 border border-emerald-400/40 rounded-2xl px-4 py-2 text-center">
                <div className="text-2xl">🏆</div>
                <div className="text-xs font-black text-emerald-300 mt-1">Mastered!</div>
              </div>
            ) : progressPercent > 0 ? (
              <div className="flex-shrink-0 bg-white/10 rounded-2xl px-4 py-2 text-center">
                <div className="text-2xl font-black">{progressPercent}%</div>
                <div className="text-xs text-violet-300">done</div>
              </div>
            ) : null}
          </div>

          {/* Progress bar */}
          {progressPercent > 0 && (
            <div className="mt-5">
              <ProgressBar
                value={progressPercent}
                color="bg-gradient-to-r from-cyan-400 to-emerald-400"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Learning Path
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Vertical path */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-200 via-cyan-200 to-amber-200 z-0" />

          <div className="space-y-3 relative z-10">
            {normalLevels.map((level, i) => {
              const passed = isLevelPassed(userProgress, level.id)
              // First level always unlocked; subsequent require previous passed
              const unlocked =
                i === 0 ||
                isLevelPassed(userProgress, normalLevels[i - 1].id)
              const locked = !unlocked || (level.is_premium && !isUserPremium)

              return (
                <LevelNode
                  key={level.id}
                  level={level}
                  index={i}
                  passed={passed}
                  locked={locked}
                  isMastery={false}
                  broadTopicSlug={params.broadTopic}
                  subtopicSlug={params.subtopic}
                />
              )
            })}

            {/* Mastery separator */}
            {masteryLevel && (
              <>
                <div className="flex items-center gap-3 py-1 pl-14">
                  <div className="flex-1 border-t-2 border-dashed border-amber-300" />
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider whitespace-nowrap">
                    Beat all levels to unlock →
                  </span>
                  <div className="flex-1 border-t-2 border-dashed border-amber-300" />
                </div>

                <LevelNode
                  level={masteryLevel}
                  index={normalLevels.length}
                  passed={masteryPassed}
                  locked={!masteryUnlocked || (masteryLevel.is_premium && !isUserPremium)}
                  isMastery
                  broadTopicSlug={params.broadTopic}
                  subtopicSlug={params.subtopic}
                />
              </>
            )}
          </div>
        </div>

        {/* Completion callout */}
        {masteryPassed && (
          <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-200 p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-black text-emerald-800 text-lg">
              {toDisplayName(subtopicSlug)} Complete!
            </h3>
            <p className="text-sm text-emerald-600 mt-1">
              You've mastered this entire section. Move on to the next subtopic!
            </p>
            <Link
              href={`/quiz/${params.broadTopic}`}
              className="inline-block mt-4 px-6 py-3 rounded-2xl font-black text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Back to {toDisplayName(broadTopicName)} →
            </Link>
          </div>
        )}

        {/* Premium upsell — tasteful */}
        {!isUserPremium && levels.some((l) => l.is_premium) && (
          <div className="mt-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <p className="font-black text-amber-800 text-sm">
                  Some levels are Premium
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Unlock all levels and the mastery challenge for R49/month
                </p>
              </div>
              <Link
                href="/premium"
                className="flex-shrink-0 px-4 py-2 rounded-xl font-black text-xs bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Upgrade
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Level Node ──────────────────────────────────────────────────────────────

function LevelNode({
  level,
  index,
  passed,
  locked,
  isMastery,
  broadTopicSlug,
  subtopicSlug,
}: {
  level: any
  index: number
  passed: boolean
  locked: boolean
  isMastery: boolean
  broadTopicSlug: string
  subtopicSlug: string
}) {
  const learnHref = `/quiz/${broadTopicSlug}/${subtopicSlug}/${level.id}/learn`

  const nodeColor = passed
    ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200'
    : locked
    ? 'bg-slate-100 border-slate-300 text-slate-400'
    : isMastery
    ? 'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300 text-white shadow-amber-100'
    : 'bg-white border-violet-400 text-violet-600 shadow-violet-100'

  const cardColor = passed
    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
    : locked
    ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-70'
    : isMastery
    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400 hover:shadow-md'
    : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-md'

  const inner = (
    <div className="flex items-center gap-4">
      {/* Circle node */}
      <div
        className={`
          w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center
          text-lg border-2 shadow-sm transition-all duration-200
          ${nodeColor}
        `}
      >
        {passed ? '✓' : locked ? '🔒' : isMastery ? '🏆' : level.level_number ?? index + 1}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {isMastery && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Mastery Challenge
            </span>
          )}
          {level.is_premium && !passed && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              ✨ Premium
            </span>
          )}
        </div>
        <p className={`font-black text-base truncate ${locked ? 'text-slate-400' : 'text-slate-800'}`}>
          {level.title}
        </p>
        {level.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{level.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex-shrink-0 text-right space-y-0.5">
        <div className="text-xs text-slate-400">{level.question_count} Qs</div>
        <div className="text-xs font-bold text-amber-500">+{level.xp_reward} XP</div>
        {passed && <div className="text-xs font-black text-emerald-600">Done ✓</div>}
        {!locked && !passed && (
          <div className="text-xs font-black text-violet-500">Start →</div>
        )}
      </div>
    </div>
  )

  if (locked) {
    return (
      <div className={`rounded-2xl border-2 p-4 transition-all duration-200 ${cardColor}`}>
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={learnHref}
      className={`block rounded-2xl border-2 p-4 transition-all duration-200 ${cardColor}`}
    >
      {inner}
    </Link>
  )
}
