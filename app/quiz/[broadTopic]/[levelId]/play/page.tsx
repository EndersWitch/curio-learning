'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import QuizRunner from '@/components/quiz/QuizRunner'
import ResultsScreen from '@/components/quiz/ResultsScreen'
import { fetchLevelQuestions } from '@/lib/questions'
import { saveQuizResult } from '@/lib/progress'
import type { ShuffledQuestion, QuizResult } from '@/types/quiz'

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const broadTopic = params.broadTopic as string
  const levelId = decodeURIComponent(params.levelId as string)
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [levelMeta, setLevelMeta] = useState<any>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const learnHref = `/quiz/${broadTopic}/${encodeURIComponent(levelId)}/learn`

  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, levelId])

  async function load() {
    try {
      // Fetch level meta
      const { data: lvl, error: lvlErr } = await sb
        .from('quiz_levels')
        .select('*')
        .eq('level_id', levelId)
        .single()

      if (lvlErr || !lvl) throw new Error('Level not found.')

      // Enforce premium gate
      if (lvl.is_premium && !isPremium) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setLevelMeta(lvl)

      // Fetch questions — always from DB, never cached
      const qs = await fetchLevelQuestions(lvl.id)
      if (qs.length === 0) throw new Error('No questions available for this level yet.')
      setQuestions(qs)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong loading the quiz.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = useCallback(async (res: QuizResult) => {
    setResult(res)
    if (!user || !levelMeta) return
    try {
      await saveQuizResult({
        userId: user.id,
        levelId: levelMeta.id,
        topicId: levelMeta.broad_topic ?? undefined,
        result: res,
      })
    } catch (e) {
      console.error('[QuizPlay] Failed to save result:', e)
    }
  }, [user, levelMeta])

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🎯</div>
        <p className="text-sm font-semibold" style={{ color: '#9b8ab0' }}>Loading your quiz...</p>
      </div>
    </div>
  )

  if (accessDenied) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🔒</div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Premium Level</h2>
        <p className="text-sm mb-5" style={{ color: '#9b8ab0' }}>Upgrade to access this level.</p>
        <a href="/subscription"
          className="inline-block px-6 py-3 rounded-xl font-black text-sm"
          style={{ background: '#F5C842', color: '#2B1E3F' }}>
          Get Premium →
        </a>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
      <div className="text-center max-w-sm rounded-2xl p-8"
        style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.15)' }}>
        <div className="text-4xl mb-3">😕</div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Couldn't load quiz</h2>
        <p className="text-sm mb-5" style={{ color: '#9b8ab0' }}>{error}</p>
        <button onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: '#6DD3CE', color: '#2B1E3F' }}>
          Try Again
        </button>
      </div>
    </div>
  )

  if (result) {
    return (
      <ResultsScreen
        result={result}
        levelTitle={levelMeta?.level_display ?? 'Quiz Complete'}
        sectionType={levelMeta?.section_type ?? 'learning_level'}
        retryHref={learnHref}
        nextHref={`/quiz/${broadTopic}`}
      />
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(43,30,63,0.95)', borderBottom: '1px solid rgba(109,211,206,0.15)' }}>
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (confirm('Leave quiz? Progress for this attempt will be lost.')) {
                router.push(learnHref)
              }
            }}
            className="text-xs font-semibold transition-colors"
            style={{ color: '#9b8ab0' }}>
            ✕ Exit
          </button>
          <h1 className="font-black text-sm truncate" style={{ color: '#F7F7FF' }}>
            {levelMeta?.level_display}
          </h1>
          <div style={{ width: 40 }} /> {/* balance */}
        </div>
      </div>

      {/* Quiz */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        <QuizRunner
          questions={questions}
          levelId={levelMeta?.id ?? ''}
          sectionType={levelMeta?.section_type ?? 'learning_level'}
          baseXP={50}
          passThreshold={0.6}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
