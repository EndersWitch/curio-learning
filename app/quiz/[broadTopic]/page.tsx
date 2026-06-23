'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'

interface LevelProgress {
  best_score: number
  passed: boolean
  xp_earned: number
  attempts: number
}

interface Level {
  id: string                      // UUID — used in URLs
  level_id: string                // slug e.g. "nouns_1"
  level_display: string
  level_order: number
  broad_topic: string
  broad_topic_display: string | null
  subtopic_id: string | null
  subtopic_display: string | null
  section_type: string
  question_count: number
  difficulty: string | null
  is_premium: boolean
  description: string | null
  subject?: string
  grade?: number
}

function difficultyBadge(d: string | null) {
  if (!d) return null
  const map: Record<string, { label: string; color: string }> = {
    'Starter':   { label: '🟢 Starter',   color: '#34D399' },
    'Building':  { label: '🟡 Building',  color: '#F5C842' },
    'Challenge': { label: '🔴 Challenge', color: '#FF5E5B' },
  }
  return map[d] ?? null
}

export default function BroadTopicPage() {
  const params = useParams()
  const broadTopic = decodeURIComponent(params.broadTopic as string)
  const { user, loading: authLoading } = useAuth()
  const isPremium = user?.isPremium || user?.isFounder || false

  const [levels, setLevels] = useState<Level[]>([])
  const [progressMap, setProgressMap] = useState<Map<string, LevelProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { loadLevels() }, [broadTopic])
  useEffect(() => { if (!authLoading) loadProgress() }, [authLoading, user?.id, broadTopic])

  async function loadLevels() {
    const { data, error } = await sb
      .from('quiz_levels')
      .select('*')
      .eq('broad_topic', broadTopic)
      .order('level_order')

    if (error || !data || data.length === 0) {
      setNotFound(true); setLoading(false); return
    }
    setLevels(data)
    setLoading(false)
  }

  async function loadProgress() {
    if (!user) { setProgressMap(new Map()); return }
    const { data } = await sb
      .from('user_level_progress')
      .select('level_id, best_score, passed, xp_earned, attempts')
      .eq('user_id', user.id)
      .eq('topic_id', broadTopic)

    setProgressMap(new Map((data ?? []).map((r: any) => [r.level_id, r])))
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

  const premiumCount = levels.filter(l => l.is_premium).length

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/quiz"
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
            style={{ color: '#6DD3CE' }}>
            ← Back to Topics
          </Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#6DD3CE' }}>
            {subject} · Grade {grade}
          </p>
          <h1 className="text-3xl font-black" style={{ color: '#F7F7FF' }}>{displayName}</h1>
          <p className="text-sm mt-1" style={{ color: '#9b8ab0' }}>
            {levels.length} level{levels.length !== 1 ? 's' : ''} · {levels.filter(l => !l.is_premium).length} free
            {!isPremium && premiumCount > 0 && (
              <span style={{ color: '#F5C842' }}> · {premiumCount} premium 🔒</span>
            )}
          </p>
        </div>
      </div>

      {/* Levels list */}
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
                    progress={progressMap.get(level.level_id)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Premium upsell */}
        {!isPremium && premiumCount > 0 && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}>
            <p className="font-black text-sm mb-1" style={{ color: '#F5C842' }}>
              🔒 {premiumCount} level{premiumCount !== 1 ? 's' : ''} locked
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

function LevelRow({ level, isPremium, broadTopic, progress }: {
  level: Level; isPremium: boolean; broadTopic: string; progress?: LevelProgress
}) {
  const locked = level.is_premium && !isPremium
  // URL uses UUID id — so learn/play pages can fetch by id directly
  const href = `/quiz/${broadTopic}/${level.id}/learn`
  const diff = difficultyBadge(level.difficulty)
  const completed = progress?.passed ?? false

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={locked
        ? { background: 'rgba(255,255,255,0.02)', opacity: 0.6, cursor: 'not-allowed' }
        : completed
        ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }
        : { background: 'rgba(255,255,255,0.04)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={locked
          ? { background: 'rgba(255,255,255,0.04)', color: '#9b8ab0', border: '2px solid rgba(255,255,255,0.08)' }
          : completed
          ? { background: '#34D399', color: '#fff', border: '2px solid #34D399' }
          : { background: 'rgba(109,211,206,0.1)', color: '#6DD3CE', border: '2px solid rgba(109,211,206,0.25)' }}>
        {locked ? '🔒' : completed ? '✓' : level.level_order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: locked ? '#9b8ab0' : '#F7F7FF' }}>
          {level.level_display}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {diff && <span className="text-xs" style={{ color: diff.color }}>{diff.label}</span>}
          {level.description && !diff && !progress && (
            <span className="text-xs truncate" style={{ color: '#9b8ab0' }}>{level.description}</span>
          )}
          {progress && (
            <>
              <span className="text-xs font-bold" style={{ color: completed ? '#34D399' : '#9b8ab0' }}>
                Best: {progress.best_score}%
              </span>
              <span className="text-xs font-bold" style={{ color: '#F5C842' }}>
                ⚡ {progress.xp_earned} XP
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs" style={{ color: '#9b8ab0' }}>{level.question_count}Q</div>
        {locked
          ? <div className="text-xs" style={{ color: '#F5C842' }}>Premium 🔒</div>
          : completed
          ? <div className="text-xs font-bold" style={{ color: '#34D399' }}>Replay ↻</div>
          : <div className="text-xs font-bold" style={{ color: '#6DD3CE' }}>→</div>}
      </div>
    </div>
  )

  if (locked) return <div>{inner}</div>
  return <Link href={href} className="block hover:brightness-110 transition-all">{inner}</Link>
}

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
        <Link href="/quiz" className="inline-block px-5 py-2.5 rounded-xl font-black text-sm mt-2"
          style={{ background: '#6DD3CE', color: '#2B1E3F' }}>← All Topics</Link>
      </div>
    </div>
  )
}
