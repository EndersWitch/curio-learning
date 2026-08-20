'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import LearningCard from '@/components/quiz/LearningCard'
import { buildLearningZone } from '@/lib/learningZone'
import type { QuizLevel } from '@/types/quiz'
import { Lock, BookOpen, ArrowRight } from '@/components/icons'

export default function LearnPage() {
  const params = useParams()
  const broadTopic = params.broadTopic as string
  // levelId in URL is the quiz_levels UUID (primary key)
  const levelUUID = params.levelId as string
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [level, setLevel] = useState<QuizLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (authLoading) return
    loadLevel()
  }, [authLoading, levelUUID])

  async function loadLevel() {
    // Fetch by UUID id — the primary key
    const { data, error } = await sb
      .from('quiz_levels')
      .select('*')
      .eq('id', levelUUID)
      .single()

    if (error || !data) { setLoading(false); return }

    // Premium gate — only block if level is premium AND user is not premium
    if (data.is_premium && !isPremium) {
      setAccessDenied(true); setLoading(false); return
    }

    setLevel(data as QuizLevel)
    setLoading(false)
  }

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F0E2' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#B8451F', borderTopColor: 'transparent' }} />
    </div>
  )

  if (accessDenied) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F6F0E2' }}>
      <div className="text-center max-w-sm">
        <Lock size={40} style={{ color: '#A9752A', margin: '0 auto 0.75rem' }} />
        <h2 className="text-xl font-black mb-2" style={{ color: '#211A13' }}>Premium Level</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(33,26,19,0.55)' }}>
          This level is available with Curio Premium for R49/month.
        </p>
        <a href="/subscription" className="inline-block px-6 py-3 rounded-xl font-black text-sm mb-3"
          style={{ background: '#A9752A', color: '#F6F0E2' }}>Get Premium →</a>
        <div>
          <Link href={`/quiz/${broadTopic}`} className="text-sm" style={{ color: '#B8451F' }}>← Back</Link>
        </div>
      </div>
    </div>
  )

  if (!level) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F0E2' }}>
      <div className="text-center">
        <p className="font-black" style={{ color: '#211A13' }}>Level not found</p>
        <Link href={`/quiz/${broadTopic}`} className="text-sm mt-2 block" style={{ color: '#B8451F' }}>← Back</Link>
      </div>
    </div>
  )

  const cards = buildLearningZone(level)
  const playHref = `/quiz/${broadTopic}/${levelUUID}/play`

  return (
    <div className="min-h-screen" style={{ background: '#F6F0E2' }}>
      <div style={{ background: '#EAE0C6' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href={`/quiz/${broadTopic}`}
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
            style={{ color: '#B8451F' }}>← Back</Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#B8451F' }}>
            Level {(level as any).level_order} · {level.question_count} questions
          </p>
          <h1 className="text-2xl font-black" style={{ color: '#211A13' }}>{(level as any).level_display}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(33,26,19,0.1)' }} />
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: '#B8451F', background: 'rgba(184,69,31,0.08)', border: '1px solid rgba(184,69,31,0.2)' }}>
            <BookOpen size={13} /> Learning Zone
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(33,26,19,0.1)' }} />
        </div>

        <div className="space-y-4 mb-8">
          {cards.map((card, i) => <LearningCard key={i} concept={card} index={i} />)}
        </div>

        <div className="rounded-2xl p-7 text-center"
          style={{ background: '#FBF8EF', border: '1px solid rgba(184,69,31,0.15)' }}>
          <h2 className="text-xl font-black mb-2" style={{ color: '#211A13' }}>Ready to quiz?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(33,26,19,0.55)' }}>
            {level.question_count} questions · You can retry as many times as you like
          </p>
          <Link href={playHref}
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-lg text-white"
            style={{ background: '#B8451F' }}>
            Let&apos;s Go <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  )
}
