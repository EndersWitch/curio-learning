'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import LearningCard from '@/components/quiz/LearningCard'
import { buildLearningZone } from '@/lib/learningZone'
import type { QuizLevel } from '@/types/quiz'

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const broadTopic = params.broadTopic as string
  const levelId = decodeURIComponent(params.levelId as string)
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [level, setLevel] = useState<QuizLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (authLoading) return
    loadLevel()
  }, [authLoading, levelId])

  async function loadLevel() {
    const { data, error } = await sb
      .from('quiz_levels')
      .select('*')
      .eq('level_id', levelId)
      .single()

    if (error || !data) { setLoading(false); return }

    // Check access
    if (data.is_premium && !isPremium) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    setLevel(data as QuizLevel)
    setLoading(false)
  }

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#6DD3CE', borderTopColor: 'transparent' }} />
    </div>
  )

  if (accessDenied) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🔒</div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Premium Level</h2>
        <p className="text-sm mb-5" style={{ color: '#9b8ab0' }}>
          This level is available with Curio Premium — R49/month.
        </p>
        <a href="/subscription"
          className="inline-block px-6 py-3 rounded-xl font-black text-sm mb-3"
          style={{ background: '#F5C842', color: '#2B1E3F' }}>
          Get Premium →
        </a>
        <div>
          <Link href={`/quiz/${broadTopic}`} className="text-sm" style={{ color: '#6DD3CE' }}>
            ← Back
          </Link>
        </div>
      </div>
    </div>
  )

  if (!level) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <p className="font-black" style={{ color: '#F7F7FF' }}>Level not found</p>
        <Link href={`/quiz/${broadTopic}`} className="text-sm mt-2 block" style={{ color: '#6DD3CE' }}>← Back</Link>
      </div>
    </div>
  )

  const cards = buildLearningZone(level)
  const playHref = `/quiz/${broadTopic}/${encodeURIComponent(levelId)}/play`

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href={`/quiz/${broadTopic}`}
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
            style={{ color: '#6DD3CE' }}>
            ← Back
          </Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#6DD3CE' }}>
            Level {level.level_number} · {level.question_count} questions
          </p>
          <h1 className="text-2xl font-black" style={{ color: '#F7F7FF' }}>{level.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Learning zone divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: '#6DD3CE', background: 'rgba(109,211,206,0.08)', border: '1px solid rgba(109,211,206,0.2)' }}>
            📖 Learning Zone
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Cards */}
        <div className="space-y-4 mb-8">
          {cards.map((card, i) => (
            <LearningCard key={i} concept={card} index={i} />
          ))}
        </div>

        {/* Start CTA */}
        <div className="rounded-2xl p-7 text-center"
          style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.15)' }}>
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Ready to quiz?</h2>
          <p className="text-sm mb-6" style={{ color: '#9b8ab0' }}>
            {level.question_count} questions · You can retry as many times as you like
          </p>
          <Link href={playHref}
            className="inline-block w-full py-4 rounded-2xl font-black text-lg text-white"
            style={{ background: '#FF5E5B', boxShadow: '0 6px 24px rgba(255,94,91,0.35)' }}>
            Let's Go! →
          </Link>
        </div>
      </div>
    </div>
  )
}
