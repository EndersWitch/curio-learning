'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'
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
import type { ShuffledQuestion, QuizResult } from '@/types/quiz'

interface Props {
  params: { broadTopic: string; subtopic: string; level: string }
}

export default function QuizPlayPage({ params }: Props) {
  const router = useRouter()
  const [questions, setQuestions]     = useState<ShuffledQuestion[]>([])
  const [levelMeta, setLevelMeta]     = useState<any>(null)
  const [result, setResult]           = useState<QuizResult | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [userId, setUserId]           = useState<string | null>(null)
  const [masteryUnlocked, setMasteryUnlocked]           = useState(false)
  const [broadMasteryUnlocked, setBroadMasteryUnlocked] = useState(false)
  const [nextLevelHref, setNextLevelHref]               = useState<string | undefined>()

  useEffect(() => {
    async function load() {
      try {
        // Get user from Supabase auth (works with persistSession: true)
        const { data: { session } } = await sb.auth.getSession()
        const uid = session?.user?.id ?? null
        setUserId(uid)

        // Fetch level metadata
        const { data: lvl, error: lvlErr } = await sb
          .from('quiz_levels')
          .select('*')
          .eq('id', params.level)
          .single()

        if (lvlErr || !lvl) throw new Error('This level could not be found.')
        setLevelMeta(lvl)

        // Fetch questions
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
      // Save result to user_level_progress
      await saveQuizResult({
        userId,
        levelId: params.level,
        topicId: levelMeta.broad_topic ?? undefined,
        result: res,
      })

      // Re-fetch fresh progress
      const allProgress = await getUserProgress(userId)

      // Check subtopic mastery unlock
      if (levelMeta.subtopic_id && levelMeta.section_type === 'learning_level') {
        const { data: subtopicLevels } = await sb
          .from('quiz_levels')
          .select('id, section_type, level_order')
          .eq('subtopic_id', levelMeta.subtopic_id)
          .order('level_order')

        if (subtopicLevels) {
          const normalIds = subtopicLevels
            .filter((l: any) => l.section_type === 'learning_level')
            .map((l: any) => l.id)

          const subtopicMasteryLevel = subtopicLevels.find(
            (l: any) => l.section_type === 'subtopic_mastery'
          )

          if (isSubtopicMasteryUnlocked(allProgress, normalIds)) {
            const masteryWasAlreadyPassed = subtopicMasteryLevel
              ? isLevelPassed(allProgress, subtopicMasteryLevel.id)
              : false
            if (!masteryWasAlreadyPassed) setMasteryUnlocked(true)
          }

          // Next level href
          if (res.passed) {
            const sorted = [...subtopicLevels].sort((a: any, b: any) => a.level_order - b.level_order)
            const idx = sorted.findIndex((l: any) => l.id === params.level)
            if (idx >= 0 && idx < sorted.length - 1) {
              const next = sorted[idx + 1]
              setNextLevelHref(
                `/quiz/${params.broadTopic}/${params.subtopic}/${next.id}/learn`
              )
            } else {
              setNextLevelHref(`/quiz/${params.broadTopic}`)
            }
          }
        }
      }

      // Check broad topic mastery unlock (after subtopic_mastery pass)
      if (levelMeta.section_type === 'subtopic_mastery' && res.passed) {
        const { data: allSubtopicMasteries } = await sb
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
        setNextLevelHref(`/quiz/${params.broadTopic}`)
      }

      if (levelMeta.section_type === 'broad_topic_mastery' && res.passed) {
        setNextLevelHref('/quiz')
      }

    } catch (e) {
      console.error('[QuizPlay] Failed to save/check progress:', e)
    }
  }, [userId, levelMeta, params])

  const learnHref = `/quiz/${params.broadTopic}/${params.subtopic}/${params.level}/learn`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎯</div>
          <p className="font-semibold text-sm" style={{ color: '#9b8ab0' }}>Loading your quiz...</p>
          <p className="text-xs mt-1" style={{ color: '#6b5f7a' }}>Shuffling questions just for you</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
        <div className="text-center max-w-sm w-full rounded-3xl p-8" style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.15)' }}>
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Couldn't load quiz</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#9b8ab0' }}>{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()}
              className="py-3 rounded-2xl font-black text-sm text-white"
              style={{ background: '#6DD3CE', color: '#2B1E3F' }}>
              Try Again
            </button>
            <button onClick={() => router.back()}
              className="py-3 rounded-2xl font-semibold text-sm"
              style={{ color: '#9b8ab0' }}>
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <ResultsScreen
        result={result}
        levelTitle={levelMeta?.level_display ?? 'Quiz Complete'}
        sectionType={levelMeta?.section_type ?? 'learning_level'}
        retryHref={learnHref}
        nextHref={nextLevelHref}
        masteryUnlocked={masteryUnlocked}
        broadMasteryUnlocked={broadMasteryUnlocked}
      />
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      {/* Top bar */}
      <div className="backdrop-blur-md sticky top-0 z-30"
        style={{ background: 'rgba(43,30,63,0.95)', borderBottom: '1px solid rgba(109,211,206,0.15)' }}>
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (confirm('Leave quiz? Your progress for this attempt will be lost.')) {
                router.push(learnHref)
              }
            }}
            className="text-xs font-semibold transition-colors flex items-center gap-1"
            style={{ color: '#9b8ab0' }}>
            ✕ Exit
          </button>

          <div className="flex-1 text-center">
            <h1 className="font-black text-sm truncate" style={{ color: '#F7F7FF' }}>
              {levelMeta?.level_display}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9b8ab0' }}>
            {levelMeta?.section_type === 'subtopic_mastery' && (
              <span className="px-2 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842' }}>
                🏆 Mastery
              </span>
            )}
            {levelMeta?.section_type === 'broad_topic_mastery' && (
              <span className="px-2 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(109,211,206,0.12)', color: '#6DD3CE' }}>
                🎓 Final
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Runner */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        <QuizRunner
          questions={questions}
          levelId={params.level}
          sectionType={levelMeta?.section_type ?? 'learning_level'}
          baseXP={50}
          passThreshold={0.6}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
