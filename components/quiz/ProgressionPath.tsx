'use client'

import Link from 'next/link'
import type { QuizLevel, UserProgress } from '@/types/quiz'
import { isLevelPassed } from '@/lib/progress'

interface ProgressionPathProps {
  levels: QuizLevel[]
  userProgress: UserProgress[]
  broadTopicSlug: string
  subtopicSlug: string
  isUserPremium: boolean
}

const SECTION_ICONS: Record<string, string> = {
  level: '📖',
  subtopic_mastery: '🏆',
  broad_topic_mastery: '👑',
  general_practice: '🎯',
}

export default function ProgressionPath({
  levels,
  userProgress,
  broadTopicSlug,
  subtopicSlug,
  isUserPremium,
}: ProgressionPathProps) {
  // Build sequential unlock logic:
  // Each level is unlocked if the previous one is passed (except level 1 which is always open)
  function isUnlocked(index: number): boolean {
    if (index === 0) return true
    const prev = levels[index - 1]
    return isLevelPassed(userProgress, prev.id)
  }

  return (
    <div className="space-y-3 relative">
      {/* Vertical connector line */}
      <div className="absolute left-[1.9rem] top-10 bottom-10 w-0.5 bg-gradient-to-b from-violet-200 via-cyan-200 to-violet-200 z-0" />

      {levels.map((level, i) => {
        const passed = isLevelPassed(userProgress, level.id)
        const unlocked = isUnlocked(i)
        const locked = !unlocked || (level.is_premium && !isUserPremium)
        const isMastery = level.section_type === 'subtopic_mastery' || level.section_type === 'broad_topic_mastery'

        const learnHref = `/quiz/${broadTopicSlug}/${subtopicSlug}/${level.id}/learn`

        return (
          <div key={level.id} className="relative z-10 flex items-center gap-4">
            {/* Node */}
            <div
              className={`
                w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-base
                border-2 transition-all duration-200 shadow-sm
                ${
                  passed
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200'
                    : locked
                    ? 'bg-slate-100 border-slate-300 text-slate-400'
                    : isMastery
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300 text-white shadow-amber-200'
                    : 'bg-white border-violet-400 text-violet-600 shadow-violet-100'
                }
              `}
            >
              {passed ? '✓' : locked ? '🔒' : SECTION_ICONS[level.section_type] ?? '📖'}
            </div>

            {/* Card */}
            {locked ? (
              <div
                className={`
                  flex-1 rounded-2xl border-2 p-4 bg-slate-50 border-slate-200 opacity-70
                  ${isMastery ? 'border-dashed' : ''}
                `}
              >
                <LevelCardContent level={level} passed={passed} locked />
              </div>
            ) : (
              <Link
                href={learnHref}
                className={`
                  flex-1 rounded-2xl border-2 p-4 transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  ${
                    passed
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                      : isMastery
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400'
                      : 'bg-white border-slate-200 hover:border-violet-300'
                  }
                `}
              >
                <LevelCardContent level={level} passed={passed} locked={false} />
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LevelCardContent({
  level,
  passed,
  locked,
}: {
  level: QuizLevel
  passed: boolean
  locked: boolean
}) {
  const isMastery =
    level.section_type === 'subtopic_mastery' || level.section_type === 'broad_topic_mastery'

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full ${
              isMastery
                ? 'bg-amber-100 text-amber-800'
                : level.section_type === 'general_practice'
                ? 'bg-cyan-100 text-cyan-800'
                : 'bg-violet-100 text-violet-800'
            }`}
          >
            {isMastery
              ? level.section_type === 'broad_topic_mastery'
                ? '👑 Final Mastery'
                : '🏆 Mastery'
              : level.section_type === 'general_practice'
              ? '🎯 Practice'
              : `Level ${level.level_number}`}
          </span>
          {level.is_premium && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              ✨
            </span>
          )}
        </div>
        <h4
          className={`font-black text-sm mt-0.5 truncate ${
            locked ? 'text-slate-400' : 'text-slate-800'
          }`}
        >
          {level.title}
        </h4>
        {level.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5 hidden sm:block">
            {level.description}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 text-right text-xs text-slate-400 space-y-0.5">
        <div>{level.question_count} Qs</div>
        <div className="font-semibold text-amber-500">+{level.xp_reward} XP</div>
        {passed && <div className="text-emerald-600 font-black">Done ✓</div>}
      </div>
    </div>
  )
}
