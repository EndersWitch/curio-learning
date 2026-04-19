'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import QuizRunner from '@/components/quiz/QuizRunner'
import ResultsScreen from '@/components/quiz/ResultsScreen'
import { fetchLevelQuestions } from '@/lib/questions'
import {
  saveQuizResult,
  getUserProgress,
  isLevelPassed,
  isSubtopicMasteryUnlocked,
  isBroadTopicMasteryUnlocked,
} from '@/lib/progress'
import { supabase } from '@/lib/supabase'
import type { ShuffledQuestion, QuizResult } from '@/types/quiz'

interface Props {
  params: { broadTopic: string; subtopic: string; level: string }
}

export default function QuizPlayPage({ params }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [levelMeta, setLevelMeta] = useState<any>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [masteryUnlocked, setMasteryUnlocked] = useState(false)
  const [broadMasteryUnlocked, setBroadMasteryUnlocked] = useState(false)
  const [nextLevelHref, setNextLevelHref] = useState<string | undefined>()

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUserId(session?.user?.id ?? null)

        const { data: lvl, error: lvlErr } = await supabase
          .from('quiz_levels')
          .select('*')
          .eq('id', params.level)
          .single()

        if (lvlErr || !lvl) throw new Error('This level could not be found.')
        setLevelMeta(lvl)

        const qs = await fetchLevelQuestions(params.level)
        if (qs.length === 0) throw new Error('No questions are available for this level yet.')
        setQuestions(qs)
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong loading the quiz.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.level])

  const handleComplete = useCallback(async (res: QuizResult) => {
    setResult(res)
    if (!userId || !levelMeta) return

    try {
      // 1. Persist the result
      await saveQuizResult({ userId, levelId: params.level, result: res })

      // 2. Re-fetch fresh progress (includes the result we just saved)
      const allProgress = await getUserProgress(userId)

      // 3. Check subtopic mastery unlock
      if (levelMeta.subtopic_id && levelMeta.section_type === 'level') {
        const { data: subtopicLevels } = await supabase
          .from('quiz_levels')
          .select('id, section_type, level_number')
          .eq('subtopic_id', levelMeta.subtopic_id)
          .order('level_number')

        if (subtopicLevels) {
          const normalIds = subtopicLevels
            .filter((l: any) => l.section_type === 'level')
            .map((l: any) => l.id)

          const subtopicMasteryLevel = subtopicLevels.find(
            (l: any) => l.section_type === 'subtopic_mastery'
          )

          if (isSubtopicMasteryUnlocked(allProgress, normalIds)) {
            // Only announce if mastery wasn't already unlocked before this attempt
            const masteryWasAlreadyPassed = subtopicMasteryLevel
              ? isLevelPassed(allProgress, subtopicMasteryLevel.id)
              : false
            if (!masteryWasAlreadyPassed) setMasteryUnlocked(true)
          }

          // Determine next level href
          if (res.passed) {
            const sorted = [...subtopicLevels].sort(
              (a: any, b: any) => a.level_number - b.level_number
            )
            const idx = sorted.findIndex((l: any) => l.id === params.level)
            if (idx >= 0 && idx < sorted.length - 1) {
              const next = sorted[idx + 1]
              setNextLevelHref(
                `/quiz/${params.broadTopic}/${params.subtopic}/${next.id}/learn`
              )
            } else {
              // Last level in subtopic — point back to subtopic overview
              setNextLevelHref(`/quiz/${params.broadTopic}/${params.subtopic}`)
            }
          }
        }
      }

      // 4. Check broad topic mastery unlock (only after a subtopic_mastery pass)
      if (levelMeta.section_type === 'subtopic_mastery' && res.passed) {
        const { data: allSubtopicMasteries } = await supabase
          .from('quiz_levels')
          .select('id')
          .eq('broad_topic', levelMeta.broad_topic)
          .eq('section_type', 'subtopic_mastery')

        if (allSubtopicMasteries) {
          const masteryIds = allSubtopicMasteries.map((l: any) => l.id)
          if (isBroadTopicMasteryUnlocked(allProgress, masteryIds)) {
            setBroadMasteryUnlocked(true)
          }
        }
        // After subtopic mastery, go to broad topic overview
        setNextLevelHref(`/quiz/${params.broadTopic}`)
      }

      // 5. After broad topic mastery, go to browse
      if (levelMeta.section_type === 'broad_topic_mastery' && res.passed) {
        setNextLevelHref(`/quiz`)
      }

    } catch (e) {
      // Non-fatal — result is already shown
      console.error('[QuizPlay] Failed to save/check progress:', e)
    }
  }, [userId, levelMeta, params])

  const learnHref = `/quiz/${params.broadTopic}/${params.subtopic}/${params.level}/learn`

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a1228" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎯</div>
          <p className="font-semibold text-slate-500 text-sm">Loading your quiz...</p>
          <p className="text-xs text-slate-400 mt-1">Shuffling questions just for you</p>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#1a1228" }}>
        <div className="text-center max-w-sm w-full rounded-3xl p-8" style={{ background: "#231935", border: "1px solid rgba(109,211,206,0.15)" }}>
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-black mb-2" style={{ color: "#F7F7FF" }}>Couldn't load quiz</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#9b8ab0" }}>{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="py-3 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="py-3 rounded-2xl font-semibold text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Results state ────────────────────────────────────────────────────
  if (result) {
    return (
      <ResultsScreen
        result={result}
        levelTitle={levelMeta?.title ?? 'Quiz Complete'}
        sectionType={levelMeta?.section_type ?? 'level'}
        retryHref={learnHref}
        nextHref={nextLevelHref}
        masteryUnlocked={masteryUnlocked}
        broadMasteryUnlocked={broadMasteryUnlocked}
      />
    )
  }

  // ── Quiz running state ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#1a1228" }}>
      {/* Top bar */}
      <div className="backdrop-blur-md sticky top-0 z-30" style={{ background: "rgba(43,30,63,0.95)", borderBottom: "1px solid rgba(109,211,206,0.15)" }}>
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (confirm('Leave quiz? Your progress for this attempt will be lost.')) {
                router.push(learnHref)
              }
            }}
            className="text-xs font-semibold transition-colors flex items-center gap-1" style={{ color: "#9b8ab0" }}
          >
            ✕ Exit
          </button>

          <div className="flex-1 text-center">
            <h1 className="font-black text-sm truncate" style={{ color: "#F7F7FF" }}>
              {levelMeta?.title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#9b8ab0" }}>
            {levelMeta?.section_type === 'subtopic_mastery' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-black">🏆 Mastery</span>
            )}
            {levelMeta?.section_type === 'broad_topic_mastery' && (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-black">👑 Final</span>
            )}
          </div>
        </div>
      </div>

      {/* Runner */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        <QuizRunner
          questions={questions}
          levelId={params.level}
          sectionType={levelMeta?.section_type ?? 'level'}
          baseXP={levelMeta?.xp_reward ?? 50}
          passThreshold={levelMeta?.pass_threshold ?? 0.6}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
