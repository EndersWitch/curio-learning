'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'

interface Level {
  broad_topic_display: string | null
  subject?: string
  grade?: number
  id: string
  level_id: string
  level_display: string
  level_order: number
  subtopic_id: string | null
  subtopic_display: string | null
  section_type: string
  question_count: number
  difficulty: string | null
  is_premium: boolean
  description: string | null
}

function difficultyLabel(d: string | null) {
  if (!d) return null
  const map: Record<string, { label: string; color: string }> = {
    'Starter':   { label: '🟢 Starter',   color: '#34D399' },
    'Building':  { label: '🟡 Building',   color: '#F5C842' },
    'Challenge': { label: '🔴 Challenge',  color: '#FF5E5B' },
  }
  return map[d] ?? null
}

export default function BroadTopicPage() {
  const params = useParams()
  const broadTopic = decodeURIComponent(params.broadTopic as string)
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadLevels()
  }, [broadTopic])

  async function loadLevels() {
    const { data, error } = await sb
      .from('quiz_levels')
      .select('*')
      .eq('broad_topic', broadTopic)
      .order('level_order')

    if (error || !data || data.length === 0) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setLevels(data)
    setLoading(false)
  }

  if (loading || authLoading) return <LoadingScreen />
  if (notFound) return <NotFoundScreen />

  const displayName = levels[0]?.broad_topic_display || broadTopic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const subject = levels[0]?.subject || ''
  const grade = levels[0]?.grade || ''

  // Group by subtopic
  const subtopicMap = new Map<string, Level[]>()
  for (const level of levels) {
    const key = level.subtopic_id ?? '_none'
    if (!subtopicMap.has(key)) subtopicMap.set(key, [])
    subtopicMap.get(key)!.push(level)
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/quiz"
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 transition-opacity hover:opacity-70"
            style={{ color: '#6DD3CE' }}>
            ← Back to Topics
          </Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#6DD3CE' }}>
            {subject} · Grade {grade}
          </p>
          <h1 className="text-3xl font-black" style={{ color: '#F7F7FF' }}>
            {displayName}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9b8ab0' }}>
            {levels.length} level{levels.length !== 1 ? 's' : ''} ·{' '}
            {levels.filter(l => !l.is_premium).length} free
            {!isPremium && levels.some(l => l.is_premium) && (
              <span style={{ color: '#F5C842' }}> · {levels.filter(l => l.is_premium).length} premium 🔒</span>
            )}
          </p>
        </div>
      </div>

      {/* Levels */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {[...subtopicMap.entries()].map(([key, subLevels]) => {
          const subtopicName = subLevels[0]?.subtopic_display || (key === '_none' ? null : key)
          return (
            <div key={key}>
              {subtopicName && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#9b8ab0' }}>
                    {subtopicName}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              )}
              <div className="space-y-2">
                {subLevels.map(level => (
                  <LevelRow
                    key={level.id}
                    level={level}
                    isPremium={isPremium}
                    broadTopic={params.broadTopic as string}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Premium upsell — only show if not premium and there are locked levels */}
        {!isPremium && levels.some(l => l.is_premium) && (
          <div className="rounded-2xl p-5 text-center mt-4"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}>
            <p className="font-black text-sm mb-1" style={{ color: '#F5C842' }}>
              🔒 {levels.filter(l => l.is_premium).length} levels locked
            </p>
            <p className="text-xs mb-3" style={{ color: '#9b8ab0' }}>
              Unlock everything with Curio Premium — R49/month
            </p>
            <a href="/subscription"
              className="inline-block px-5 py-2.5 rounded-xl font-black text-sm"
              style={{ background: '#F5C842', color: '#2B1E3F' }}>
              Get Premium →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Level Row ────────────────────────────────────────────────────────────────

function LevelRow({ level, isPremium, broadTopic }: {
  level: Level
  isPremium: boolean
  broadTopic: string
}) {
  const locked = level.is_premium && !isPremium
  const diff = difficultyLabel(level.difficulty)
  const href = `/quiz/${broadTopic}/${encodeURIComponent(level.level_id)}/learn`

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={locked
        ? { background: 'rgba(255,255,255,0.02)', opacity: 0.6, cursor: 'not-allowed' }
        : { background: 'rgba(255,255,255,0.04)', cursor: 'pointer' }
      }>
      {/* Number / lock */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={locked
          ? { background: 'rgba(255,255,255,0.04)', color: '#9b8ab0', border: '2px solid rgba(255,255,255,0.08)' }
          : { background: 'rgba(109,211,206,0.1)', color: '#6DD3CE', border: '2px solid rgba(109,211,206,0.25)' }
        }>
        {locked ? '🔒' : level.level_order}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: locked ? '#9b8ab0' : '#F7F7FF' }}>
          {level.level_display}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {diff && (
            <span className="text-xs" style={{ color: diff.color }}>{diff.label}</span>
          )}
          {level.description && !diff && (
            <span className="text-xs truncate" style={{ color: '#9b8ab0' }}>{level.description}</span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex-shrink-0 text-right">
        <span className="text-xs" style={{ color: '#9b8ab0' }}>{level.question_count}Q</span>
        {level.is_premium && !locked && (
          <div className="text-xs" style={{ color: '#F5C842' }}>✨ Premium</div>
        )}
        {locked && (
          <div className="text-xs" style={{ color: '#F5C842' }}>Premium</div>
        )}
        {!locked && (
          <div className="text-xs font-bold" style={{ color: '#6DD3CE' }}>→</div>
        )}
      </div>
    </div>
  )

  if (locked) return <div>{inner}</div>
  return (
    <Link href={href}
      className="block hover:brightness-110 transition-all">
      {inner}
    </Link>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
          style={{ borderColor: '#6DD3CE', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: '#9b8ab0' }}>Loading levels...</p>
      </div>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Topic Not Found</h1>
        <Link href="/quiz"
          className="inline-block px-5 py-2.5 rounded-xl font-black text-sm mt-2"
          style={{ background: '#6DD3CE', color: '#2B1E3F' }}>
          ← All Topics
        </Link>
      </div>
    </div>
  )
}
