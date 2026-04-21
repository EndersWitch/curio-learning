'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://inmrsgujgfktapjnekjs.supabase.co',
  'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

function toDisplay(slug: string) {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Level {
  id: string
  broad_topic: string
  subtopic_id: string | null
  subtopic_display: string | null
  section_type: string
  level_order: number
  level_display: string
  question_count: number
  description: string | null
  subject: string | null
  grade: number | null
  is_premium: boolean
}

export default function BroadTopicPage() {
  const params = useParams()
  const broadTopicSlug = decodeURIComponent(params.broadTopic as string)

  const [levels, setLevels] = useState<Level[]>([])
  const [userProgress, setUserProgress] = useState<string[]>([])
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { loadAll() }, [broadTopicSlug])

  async function loadAll() {
    const [sessionResult, levelsResult] = await Promise.all([
      sb.auth.getSession(),
      sb.from('quiz_levels').select('*').eq('broad_topic', broadTopicSlug).order('level_order'),
    ])

    if (!levelsResult.data || levelsResult.data.length === 0) {
      setNotFound(true); setLoading(false); return
    }
    setLevels(levelsResult.data)

    const session = sessionResult.data.session
    if (session?.user) {
      const [{ data: prog }, { data: profile }] = await Promise.all([
        sb.from('user_level_progress').select('level_id').eq('user_id', session.user.id).eq('passed', true),
        sb.from('profiles').select('is_premium, is_founder').eq('id', session.user.id).single(),
      ])
      setUserProgress((prog ?? []).map((p: any) => p.level_id))
      setIsPremiumUser(profile?.is_premium || profile?.is_founder || false)
    }
    setLoading(false)
  }

  const subtopicMap = new Map<string, Level[]>()
  for (const level of levels) {
    const key = level.subtopic_id ?? '_general'
    if (!subtopicMap.has(key)) subtopicMap.set(key, [])
    subtopicMap.get(key)!.push(level)
  }

  const subject = levels[0]?.subject ?? ''
  const grade = levels[0]?.grade ?? ''

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: '#6DD3CE', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: '#9b8ab0' }}>Loading levels...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1228' }}>
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-black mb-2" style={{ color: '#F7F7FF' }}>Topic Not Found</h1>
        <p className="text-sm mb-6" style={{ color: '#9b8ab0' }}>We couldn&apos;t find that quiz topic.</p>
        <Link href="/quiz" className="inline-block font-black px-6 py-3 rounded-2xl text-sm"
          style={{ background: '#6DD3CE', color: '#2B1E3F' }}>← Browse All Topics</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/quiz"
            className="inline-flex items-center gap-1 text-xs font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: '#6DD3CE' }}>← Back to Topics</Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#6DD3CE' }}>
            {subject} · Grade {grade}
          </p>
          <h1 className="text-3xl md:text-4xl font-black" style={{ color: '#F7F7FF' }}>
            {toDisplay(broadTopicSlug)}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {[...subtopicMap.entries()].map(([key, subLevels]) => {
          const displayName = subLevels[0]?.subtopic_display ?? toDisplay(key === '_general' ? 'General Practice' : key)
          const regularLevels = subLevels.filter(l => l.section_type !== 'subtopic_mastery' && l.section_type !== 'broad_topic_mastery')
          const masteryLevel = subLevels.find(l => l.section_type === 'subtopic_mastery' || l.section_type === 'broad_topic_mastery')
          const masteryUnlocked = regularLevels.every(l => userProgress.includes(l.id))

          return (
            <div key={key} className="rounded-3xl overflow-hidden"
              style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.12)' }}>
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="font-black text-lg" style={{ color: '#F7F7FF' }}>{displayName}</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>
                    {regularLevels.length} levels{masteryLevel ? ' + Mastery' : ''}
                  </p>
                </div>
                {masteryUnlocked && masteryLevel && userProgress.includes(masteryLevel.id) && (
                  <span className="text-xs font-black px-3 py-1 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>✅ Mastered</span>
                )}
              </div>

              <div className="p-4 space-y-2">
                {regularLevels.map((level, i) => {
                  const passed = userProgress.includes(level.id)
                  const unlocked = i === 0 || userProgress.includes(regularLevels[i - 1].id)
                  const locked = !unlocked || (level.is_premium && !isPremiumUser)
                  return <LevelRow key={level.id} level={level} passed={passed} locked={locked}
                    broadTopicSlug={params.broadTopic as string} />
                })}
                {masteryLevel && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(245,200,66,0.3)' }}>
                    <LevelRow level={masteryLevel} passed={userProgress.includes(masteryLevel.id)}
                      locked={!masteryUnlocked || (masteryLevel.is_premium && !isPremiumUser)}
                      broadTopicSlug={params.broadTopic as string} isMastery />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LevelRow({ level, passed, locked, broadTopicSlug, isMastery = false }: {
  level: Level; passed: boolean; locked: boolean; broadTopicSlug: string; isMastery?: boolean
}) {
  const href = `/quiz/${broadTopicSlug}/${encodeURIComponent(level.subtopic_id ?? '_general')}/${level.id}/learn`
  const inner = (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
      style={locked
        ? { background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed', opacity: 0.5 }
        : passed ? { background: 'rgba(52,211,153,0.06)' }
        : isMastery ? { background: 'rgba(245,200,66,0.06)' }
        : { background: 'rgba(255,255,255,0.03)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
        style={passed
          ? { background: '#34D399', borderColor: '#34D399', color: '#fff' }
          : locked ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#9b8ab0' }
          : isMastery ? { background: 'rgba(245,200,66,0.12)', borderColor: 'rgba(245,200,66,0.4)', color: '#F5C842' }
          : { background: 'rgba(109,211,206,0.08)', borderColor: 'rgba(109,211,206,0.3)', color: '#6DD3CE' }}>
        {passed ? '✓' : locked ? '🔒' : isMastery ? '🏆' : level.level_order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: locked ? '#9b8ab0' : '#F7F7FF' }}>
          {level.level_display}
        </p>
        {level.description && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#9b8ab0' }}>{level.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: '#9b8ab0' }}>
        <span>{level.question_count}Q</span>
        {!locked && !passed && <span style={{ color: '#6DD3CE' }}>→</span>}
      </div>
    </div>
  )
  if (locked) return <div>{inner}</div>
  return <Link href={href} className="block hover:brightness-110 transition-all">{inner}</Link>
}
