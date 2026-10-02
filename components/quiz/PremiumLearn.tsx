'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import LearnView from '@/components/quiz/LearnView'
import { buildLearningZone } from '@/lib/learningZone'
import { playHref } from '@/lib/quizUrls'
import type { QuizLevel } from '@/types/quiz'
import { Lock } from '@/components/icons'

// Premium lessons are kept out of the server-rendered HTML: the lesson body
// is only fetched here in the browser, once the visitor is confirmed as a
// subscriber. Free lessons are rendered on the server (see the learn page).
export default function PremiumLearn({ levelId, broadTopic, backHref, context, guide }: {
  levelId: string
  broadTopic: string
  backHref: string
  context?: string
  guide?: { href: string; label: string }
}) {
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [level, setLevel] = useState<QuizLevel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [levelId])

  useEffect(() => {
    if (authLoading) return
    if (!isPremium) { setLoading(false); return }
    sb.from('quiz_levels').select('*').eq('id', levelId).single()
      .then(({ data }) => {
        setLevel((data as QuizLevel | null) ?? null)
        setLoading(false)
      })
  }, [authLoading, isPremium, levelId])

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--rust)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!isPremium) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--paper)' }}>
      <div className="text-center max-w-sm">
        <Lock size={40} style={{ color: 'var(--ochre)', margin: '0 auto 0.75rem' }} />
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--ink)' }}>Premium Level</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
          This level is available with Curio Premium for R49/month.
        </p>
        <a href="/subscription" className="inline-block px-6 py-3 rounded font-black text-sm mb-3"
          style={{ background: 'var(--ochre)', color: 'var(--paper)' }}>Get Premium →</a>
        <div>
          <Link href={backHref} className="text-sm" style={{ color: 'var(--rust)' }}>← Back</Link>
        </div>
      </div>
    </div>
  )

  if (!level) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="text-center">
        <p className="font-black" style={{ color: 'var(--ink)' }}>Level not found</p>
        <Link href={backHref} className="text-sm mt-2 block" style={{ color: 'var(--rust)' }}>← Back</Link>
      </div>
    </div>
  )

  const row = level as QuizLevel & { level_display?: string; level_order?: number }
  return (
    <LearnView
      title={row.level_display ?? row.title}
      levelOrder={row.level_order ?? row.level_number}
      questionCount={level.question_count}
      cards={buildLearningZone(level)}
      backHref={backHref}
      playHref={playHref({ broad_topic: broadTopic, id: levelId })}
      context={context}
      guide={guide}
    />
  )
}
