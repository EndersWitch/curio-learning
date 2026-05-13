'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Topic {
  broad_topic: string
  broad_topic_display: string
  subject: string
  grade: number
  phase: string
  level_count: number
  free_level_count: number
}

const SUBJECT_ICON: Record<string, string> = {
  'english': '📚',
  'afrikaans': '🦁',
  'mathematics': '🔢',
  'natural sciences': '🔬',
  'life sciences': '🧬',
  'physical sciences': '⚛️',
  'social sciences': '🌍',
  'accounting': '📊',
  'geography': '🗺️',
  'history': '📜',
  'life orientation': '🌱',
  'business studies': '💼',
  'economics': '📈',
  'technology': '⚙️',
}

function subjectIcon(subject: string) {
  const key = Object.keys(SUBJECT_ICON).find(k => subject.toLowerCase().includes(k))
  return key ? SUBJECT_ICON[key] : '📖'
}

const GRADES = [4,5,6,7,8,9,10,11,12]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizBrowsePage() {
  const { user, loading: authLoading } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<number | null>(null)

  const isPremium = user?.isPremium || user?.isFounder || false

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const g = params.get('grade')
    if (g) setGradeFilter(Number(g))
    loadTopics()
  }, [])

  async function loadTopics() {
    // Fetch all quiz levels from DB — group client-side into topics
    const { data, error } = await sb
      .from('quiz_levels')
      .select('broad_topic, broad_topic_display, subject, grade, phase, is_premium')
      .order('grade')
      .order('broad_topic')

    if (error || !data) { setLoading(false); return }

    // Group into topics
    const map = new Map<string, Topic>()
    for (const row of data) {
      if (!row.broad_topic) continue
      if (!map.has(row.broad_topic)) {
        map.set(row.broad_topic, {
          broad_topic: row.broad_topic,
          broad_topic_display: row.broad_topic_display || row.broad_topic.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          subject: row.subject || '',
          grade: row.grade || 0,
          phase: row.phase || '',
          level_count: 0,
          free_level_count: 0,
        })
      }
      const t = map.get(row.broad_topic)!
      t.level_count++
      if (!row.is_premium) t.free_level_count++
    }

    setTopics(Array.from(map.values()))
    setLoading(false)
  }

  const filtered = gradeFilter
    ? topics.filter(t => t.grade === gradeFilter)
    : topics

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black mb-2" style={{ color: '#F7F7FF' }}>
            Pick a Topic 📖
          </h1>
          <p className="text-base mb-6" style={{ color: '#c4b8d8' }}>
            Choose a subject, work through the levels, and see how much you know.
          </p>

          {/* Auth status */}
          {!authLoading && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {user ? (
                <>
                  <span style={{ color: '#6DD3CE' }}>●</span>
                  <span style={{ color: '#F7F7FF' }}>{user.fullName}</span>
                  {isPremium && <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}>✨ Premium</span>}
                </>
              ) : (
                <>
                  <span style={{ color: '#9b8ab0' }}>Not signed in —</span>
                  <a href="/login" className="font-bold" style={{ color: '#6DD3CE' }}>Sign in to track progress</a>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade filter */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black uppercase tracking-widest mr-1" style={{ color: '#6DD3CE' }}>Grade:</span>
          <button onClick={() => setGradeFilter(null)}
            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
            style={!gradeFilter
              ? { background: '#6DD3CE', color: '#2B1E3F', borderColor: '#6DD3CE' }
              : { background: 'transparent', color: '#c4b8d8', borderColor: 'rgba(255,255,255,0.15)' }}>
            All
          </button>
          {GRADES.map(g => (
            <button key={g} onClick={() => setGradeFilter(g)}
              className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
              style={gradeFilter === g
                ? { background: '#6DD3CE', color: '#2B1E3F', borderColor: '#6DD3CE' }
                : { background: 'transparent', color: '#c4b8d8', borderColor: 'rgba(255,255,255,0.15)' }}>
              Gr {g}
            </button>
          ))}
        </div>
      </div>

      {/* Topics grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ background: '#231935', height: '140px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-black text-lg" style={{ color: '#F7F7FF' }}>No topics yet for this grade</p>
            <p className="text-sm mt-1" style={{ color: '#9b8ab0' }}>More are being added — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(topic => (
              <TopicCard key={topic.broad_topic} topic={topic} isPremium={isPremium} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ topic, isPremium }: { topic: Topic; isPremium: boolean }) {
  const icon = subjectIcon(topic.subject)
  const hasLockedLevels = topic.free_level_count < topic.level_count
  const href = `/quiz/${encodeURIComponent(topic.broad_topic)}`

  return (
    <a href={href}
      className="block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.12)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(109,211,206,0.35)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(109,211,206,0.12)'}
    >
      {/* Coloured top strip */}
      <div className="h-2" style={{ background: 'linear-gradient(90deg, #6DD3CE, #FF5E5B)' }} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(109,211,206,0.12)', color: '#6DD3CE' }}>
            Gr {topic.grade}
          </span>
        </div>

        <h3 className="font-black text-base mb-1 leading-tight" style={{ color: '#F7F7FF' }}>
          {topic.broad_topic_display}
        </h3>
        <p className="text-xs mb-3" style={{ color: '#9b8ab0' }}>{topic.subject}</p>

        <div className="flex items-center justify-between text-xs" style={{ color: '#9b8ab0' }}>
          <span>{topic.level_count} level{topic.level_count !== 1 ? 's' : ''}</span>
          {hasLockedLevels && !isPremium && (
            <span className="flex items-center gap-1"
              style={{ color: '#F5C842' }}>
              🔒 <span>{topic.free_level_count} free</span>
            </span>
          )}
          {(!hasLockedLevels || isPremium) && (
            <span style={{ color: '#6DD3CE' }}>→ Open</span>
          )}
        </div>
      </div>
    </a>
  )
}
