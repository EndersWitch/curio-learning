'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import { Lock, Search, Check, Zap } from '@/components/icons'
import Footer from '@/components/Footer'

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
    'Starter':   { label: 'Starter',   color: '#3F6B3D' },
    'Building':  { label: 'Building',  color: '#A9752A' },
    'Challenge': { label: 'Challenge', color: '#9C3428' },
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
  // Wait for levels so we know which grade's progress to load — level_id slugs
  // (e.g. "nouns_1") are reused across grades, so progress must be grade-scoped too.
  useEffect(() => { if (!authLoading && levels.length > 0) loadProgress() }, [authLoading, user?.id, levels])

  async function loadLevels() {
    // broad_topic slugs (e.g. "parts_of_speech") are reused across grades/subjects —
    // grade+subject from the link disambiguate which one the user actually picked.
    const sp = new URLSearchParams(window.location.search)
    const gradeParam = sp.get('grade')
    const subjectParam = sp.get('subject')

    let query = sb
      .from('quiz_levels')
      .select('*')
      .eq('broad_topic', broadTopic)

    if (gradeParam) query = query.eq('grade', Number(gradeParam))
    if (subjectParam) query = query.eq('subject', subjectParam)

    const { data, error } = await query.order('level_order')

    if (error || !data || data.length === 0) {
      setNotFound(true); setLoading(false); return
    }
    setLevels(data)
    setLoading(false)
  }

  async function loadProgress() {
    if (!user) { setProgressMap(new Map()); return }
    const grade = levels[0]?.grade
    const { data } = await sb
      .from('user_level_progress')
      .select('level_id, best_score, passed, xp_earned, attempts')
      .eq('user_id', user.id)
      .eq('topic_id', broadTopic)
      .eq('grade', grade)

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
    <div className="min-h-screen" style={{ background: '#F6F0E2' }}>

      {/* Header */}
      <div style={{ background: '#EAE0C6' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/quiz"
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
            style={{ color: '#B8451F' }}>
            ← Back to Topics
          </Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#B8451F' }}>
            {subject} · Grade {grade}
          </p>
          <h1 className="text-3xl font-black" style={{ color: '#211A13' }}>{displayName}</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(33,26,19,0.55)' }}>
            {levels.length} level{levels.length !== 1 ? 's' : ''} · {levels.filter(l => !l.is_premium).length} free
            {!isPremium && premiumCount > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: '#A9752A' }}> · {premiumCount} premium <Lock size={11} /></span>
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
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(33,26,19,0.55)' }}>
                    {subtopicName}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(33,26,19,0.1)' }} />
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
            style={{ background: 'rgba(169,117,42,0.06)', border: '1px solid rgba(169,117,42,0.2)' }}>
            <p className="inline-flex items-center gap-1.5 justify-center font-black text-sm mb-1" style={{ color: '#A9752A' }}>
              <Lock size={14} /> {premiumCount} level{premiumCount !== 1 ? 's' : ''} locked
            </p>
            <p className="text-xs mb-3" style={{ color: 'rgba(33,26,19,0.55)' }}>
              Get the rest with Curio Premium for R49/month
            </p>
            <a href="/subscription"
              className="inline-block px-5 py-2.5 rounded-xl font-black text-sm"
              style={{ background: '#A9752A', color: '#F6F0E2' }}>
              Get Premium →
            </a>
          </div>
        )}
      </div>
      <Footer />
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
        ? { background: 'rgba(33,26,19,0.03)', opacity: 0.6, cursor: 'not-allowed' }
        : completed
        ? { background: 'rgba(63,107,61,0.06)', border: '1px solid rgba(63,107,61,0.2)' }
        : { background: 'rgba(33,26,19,0.04)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={locked
          ? { background: 'rgba(33,26,19,0.04)', color: 'rgba(33,26,19,0.55)', border: '2px solid rgba(33,26,19,0.1)' }
          : completed
          ? { background: '#3F6B3D', color: '#F6F0E2', border: '2px solid #3F6B3D' }
          : { background: 'rgba(184,69,31,0.1)', color: '#B8451F', border: '2px solid rgba(184,69,31,0.25)' }}>
        {locked ? <Lock size={15} /> : completed ? <Check size={16} /> : level.level_order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: locked ? 'rgba(33,26,19,0.55)' : '#211A13' }}>
          {level.level_display}
        </p>
        {level.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(33,26,19,0.55)' }}>
            {level.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {diff && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: diff.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: diff.color, display: 'inline-block' }} />
              {diff.label}
            </span>
          )}
          {progress && (
            <>
              <span className="text-xs font-bold" style={{ color: completed ? '#3F6B3D' : 'rgba(33,26,19,0.55)' }}>
                Best: {progress.best_score}%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#A9752A' }}>
                <Zap size={11} /> {progress.xp_earned} XP
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs" style={{ color: 'rgba(33,26,19,0.55)' }}>{level.question_count}Q</div>
        {locked
          ? <div className="inline-flex items-center gap-1 text-xs" style={{ color: '#A9752A' }}>Premium <Lock size={11} /></div>
          : completed
          ? <div className="text-xs font-bold" style={{ color: '#3F6B3D' }}>Replay ↻</div>
          : <div className="text-xs font-bold" style={{ color: '#B8451F' }}>→</div>}
      </div>
    </div>
  )

  if (locked) return <div>{inner}</div>
  return <Link href={href} className="block hover:brightness-110 transition-all">{inner}</Link>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F0E2' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
          style={{ borderColor: '#B8451F', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'rgba(33,26,19,0.55)' }}>Loading levels...</p>
      </div>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F0E2' }}>
      <div className="text-center">
        <Search size={40} style={{ color: 'rgba(33,26,19,0.3)', margin: '0 auto 0.75rem' }} />
        <h1 className="text-xl font-black mb-2" style={{ color: '#211A13' }}>Topic Not Found</h1>
        <Link href="/quiz" className="inline-block px-5 py-2.5 rounded-xl font-black text-sm mt-2"
          style={{ background: '#B8451F', color: '#F6F0E2' }}>← All Topics</Link>
      </div>
    </div>
  )
}
