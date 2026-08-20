'use client'

import Link from 'next/link'
import type { QuizLevel, UserProgress } from '@/types/quiz'
import { isLevelPassed } from '@/lib/progress'
import { BookOpen, Trophy, GraduationCap, Target, Check, Lock, type IconProps } from '@/components/icons'

interface ProgressionPathProps {
  levels: QuizLevel[]
  userProgress: UserProgress[]
  broadTopicSlug: string
  subtopicSlug: string
  isUserPremium: boolean
}

const SECTION_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  level: BookOpen,
  subtopic_mastery: Trophy,
  broad_topic_mastery: GraduationCap,
  general_practice: Target,
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
      <div className="absolute left-[1.9rem] top-10 bottom-10 w-px" style={{ background: 'rgba(var(--ink-rgb),0.15)' }} />

      {levels.map((level, i) => {
        const passed = isLevelPassed(userProgress, level.id)
        const unlocked = isUnlocked(i)
        const locked = !unlocked || (level.is_premium && !isUserPremium)
        const isMastery = level.section_type === 'subtopic_mastery' || level.section_type === 'broad_topic_mastery'
        const NodeIcon = passed ? Check : locked ? Lock : (SECTION_ICONS[level.section_type] ?? BookOpen)

        const learnHref = `/quiz/${broadTopicSlug}/${subtopicSlug}/${level.id}/learn`

        return (
          <div key={level.id} className="relative z-10 flex items-center gap-4">
            {/* Node */}
            <div
              className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border transition-all duration-200"
              style={
                passed
                  ? { background: 'var(--moss)', borderColor: 'var(--moss)', color: 'var(--paper)' }
                  : locked
                  ? { background: 'var(--paper-dim)', borderColor: 'rgba(var(--ink-rgb),0.15)', color: 'rgba(var(--ink-rgb),0.35)' }
                  : isMastery
                  ? { background: 'var(--ochre)', borderColor: 'var(--ochre)', color: 'var(--paper)' }
                  : { background: 'var(--paper-raised)', borderColor: 'var(--rust)', color: 'var(--rust)' }
              }
            >
              <NodeIcon size={16} />
            </div>

            {/* Card */}
            {locked ? (
              <div
                className={`flex-1 rounded-lg border p-4 ${isMastery ? 'border-dashed' : ''}`}
                style={{ background: 'var(--paper-dim)', borderColor: 'rgba(var(--ink-rgb),0.15)', opacity: 0.75 }}
              >
                <LevelCardContent level={level} passed={passed} locked />
              </div>
            ) : (
              <Link
                href={learnHref}
                className="flex-1 rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={
                  passed
                    ? { background: '#EEF3ED', borderColor: 'rgba(var(--moss-rgb),0.3)' }
                    : isMastery
                    ? { background: '#F4ECDD', borderColor: 'rgba(var(--ochre-rgb),0.3)' }
                    : { background: 'var(--paper-raised)', borderColor: 'rgba(var(--ink-rgb),0.15)' }
                }
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
            className="text-xs font-black px-2 py-0.5 rounded"
            style={
              isMastery
                ? { background: '#F4ECDD', color: 'var(--ochre)' }
                : level.section_type === 'general_practice'
                ? { background: 'rgba(var(--rust-rgb),0.1)', color: 'var(--rust)' }
                : { background: 'rgba(var(--ink-rgb),0.06)', color: 'rgba(var(--ink-rgb),0.6)' }
            }
          >
            {isMastery
              ? level.section_type === 'broad_topic_mastery'
                ? 'Final Mastery'
                : 'Mastery'
              : level.section_type === 'general_practice'
              ? 'Practice'
              : `Level ${level.level_number}`}
          </span>
          {level.is_premium && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#F4ECDD', color: 'var(--ochre)' }}>
              Premium
            </span>
          )}
        </div>
        <h4
          className="font-black text-sm mt-0.5 truncate"
          style={{ color: locked ? 'rgba(var(--ink-rgb),0.35)' : 'var(--ink)' }}
        >
          {level.title}
        </h4>
        {level.description && (
          <p className="text-xs truncate mt-0.5 hidden sm:block" style={{ color: 'rgba(var(--ink-rgb),0.35)' }}>
            {level.description}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 text-right text-xs space-y-0.5" style={{ color: 'rgba(var(--ink-rgb),0.35)' }}>
        <div>{level.question_count} Qs</div>
        <div className="font-semibold" style={{ color: 'var(--ochre)' }}>+{level.xp_reward} XP</div>
        {passed && <div className="font-black" style={{ color: 'var(--moss)' }}>Done</div>}
      </div>
    </div>
  )
}
