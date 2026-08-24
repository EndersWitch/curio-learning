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
import { Target, Zap, Lock, AlertTriangle, X } from '@/components/icons'
import { HoldToConfirm } from '@/components/interior/hold-to-confirm'

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const broadTopic = params.broadTopic as string
  // levelId in URL = quiz_levels.id (UUID)
  const levelUUID = params.levelId as string
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [levelMeta, setLevelMeta] = useState<any>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const learnHref = `/quiz/${broadTopic}/${levelUUID}/learn`

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [levelUUID])

  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, levelUUID])

  async function load() {
    try {
      // Fetch level by UUID
      const { data: lvl, error: lvlErr } = await sb
        .from('quiz_levels')
        .select('*')
        .eq('id', levelUUID)
        .single()

      if (lvlErr || !lvl) throw new Error('Level not found.')

      if (lvl.is_premium && !isPremium) {
        setAccessDenied(true); setLoading(false); return
      }

      setLevelMeta(lvl)

      // fetchLevelQuestions now queries questions.level_id = quiz_levels.id (UUID)
      const qs = await fetchLevelQuestions(levelUUID)
      if (qs.length === 0) throw new Error('No questions available for this level yet.')
      setQuestions(qs)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = useCallback(async (res: QuizResult) => {
    if (!user || !levelMeta) {
      setResult(res)
      return
    }
    setSaving(true)
    try {
      // Server is the sole source of truth for XP, pass/fail and progress —
      // nothing here is trusted from the client-side estimate.
      const server = await saveQuizResult({
        userId: user.id,
        topicId: levelMeta.broad_topic,
        levelId: levelMeta.level_id,
        grade: levelMeta.grade,
        sectionType: levelMeta.section_type ?? 'learning_level',
        passThresholdPercent: 60,
        result: res,
      })
      setResult({ ...res, xpEarned: server.xpEarned, passed: server.passed })
    } catch (e) {
      console.error('[QuizPlay] save failed:', e)
      // Fall back to showing the local result so the user isn't stuck,
      // but XP could not be confirmed by the server.
      setResult({ ...res, xpEarned: 0 })
    } finally {
      setSaving(false)
    }
  }, [user, levelMeta])

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="text-center">
        <Target size={36} className="mb-3 animate-bounce" style={{ color: 'var(--rust)', margin: '0 auto 0.75rem' }} />
        <p className="text-sm" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Loading your quiz...</p>
      </div>
    </div>
  )

  if (accessDenied) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--paper)' }}>
      <div className="text-center max-w-sm">
        <Lock size={40} style={{ color: 'var(--ochre)', margin: '0 auto 0.75rem' }} />
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--ink)' }}>Premium Level</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Upgrade to access this level.</p>
        <a href="/subscription" className="inline-block px-6 py-3 rounded font-black text-sm"
          style={{ background: 'var(--ochre)', color: 'var(--paper)' }}>Get Premium →</a>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--paper)' }}>
      <div className="text-center max-w-sm rounded p-8"
        style={{ background: 'var(--paper-raised)', border: '1px solid rgba(var(--rust-rgb),0.15)' }}>
        <AlertTriangle size={36} style={{ color: 'var(--brick)', margin: '0 auto 0.75rem' }} />
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--ink)' }}>Couldn&apos;t load quiz</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{error}</p>
        <button onClick={() => window.location.reload()}
          className="w-full py-3 rounded font-black text-sm"
          style={{ background: 'var(--rust)', color: 'var(--paper)' }}>Try Again</button>
      </div>
    </div>
  )

  if (saving) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="text-center">
        <Zap size={36} className="animate-bounce" style={{ color: 'var(--ochre)', margin: '0 auto 0.75rem' }} />
        <p className="text-sm" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Saving your XP...</p>
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
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(246,240,226,0.92)', borderBottom: '1px solid rgba(var(--rust-rgb),0.15)' }}>
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <HoldToConfirm
            size="sm"
            duration={900}
            confirmLabel="Leaving…"
            onConfirm={() => router.push(learnHref)}
          >
            <span className="inline-flex items-center gap-1" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
              <X size={12} /> Hold to exit
            </span>
          </HoldToConfirm>
          <h1 className="font-black text-sm truncate" style={{ color: 'var(--ink)' }}>
            {levelMeta?.level_display}
          </h1>
          <div style={{ width: 40 }} />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <QuizRunner
          questions={questions}
          levelId={levelUUID}
          sectionType={levelMeta?.section_type ?? 'learning_level'}
          baseXP={50}
          passThreshold={0.6}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
