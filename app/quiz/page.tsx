'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import { Lock, Star, Search } from '@/components/icons'
import Footer from '@/components/Footer'
import QuizNav from '@/components/quiz/QuizNav'
import { SkeletonSwap } from '@/components/interior/skeleton-swap'

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

    // Group into topics — keyed by grade+subject+topic so the same topic name
    // in different grades/subjects doesn't collapse into one card
    const map = new Map<string, Topic>()
    for (const row of data) {
      if (!row.broad_topic) continue
      const key = `${row.grade}|${row.subject}|${row.broad_topic}`
      if (!map.has(key)) {
        map.set(key, {
          broad_topic: row.broad_topic,
          broad_topic_display: row.broad_topic_display || row.broad_topic.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          subject: row.subject || '',
          grade: row.grade || 0,
          phase: row.phase || '',
          level_count: 0,
          free_level_count: 0,
        })
      }
      const t = map.get(key)!
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
    <div style={{ background: 'var(--paper)' }} className="page-wrap">
      <QuizNav />

      <div className="hub-wrap">
        <div className="hub-eyebrow">Quizzes &amp; mastery challenges</div>
        <h1 className="hub-title">Pick a <em>topic</em>.</h1>
        <p className="hub-sub">
          Choose a subject, work through the levels, and see how much you know.
        </p>

        {!authLoading && (
          <div className="quiz-auth-pill">
            {user ? (
              <>
                <span className="quiz-auth-dot" />
                <span>{user.fullName}</span>
                {isPremium && <span className="meta-pill am" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Star size={11} /> Premium</span>}
              </>
            ) : (
              <>
                <span style={{ color: 'var(--ink35)' }}>Not signed in.</span>
                <a href="/login" style={{ color: 'var(--rust)', fontWeight: 600 }}>Sign in to track progress</a>
              </>
            )}
          </div>
        )}

        <div className="qgrade-row">
          <span className="qgrade-row-label">Grade</span>
          <button onClick={() => setGradeFilter(null)} className={`gp${!gradeFilter ? ' on' : ''}`}>All</button>
          {GRADES.map(g => (
            <button key={g} onClick={() => setGradeFilter(g)} className={`gp${gradeFilter === g ? ' on' : ''}`}>
              Gr {g}
            </button>
          ))}
        </div>

        <SkeletonSwap
          ready={!loading}
          label="Topics"
          skeleton={
            <div className="qtopics-skeleton">
              {[...Array(6)].map((_, i) => <div key={i} className="qtopics-skeleton-card" />)}
            </div>
          }
        >
          {filtered.length === 0 ? (
            <div className="qtopics-empty">
              <Search size={32} style={{ margin: '0 auto', display: 'block' }} />
              <p className="qtopics-empty-title">No topics yet for this grade</p>
              <p>More are being added. Check back soon!</p>
            </div>
          ) : (
            <div className="qtopics-grid">
              {filtered.map(topic => (
                <TopicCard key={`${topic.grade}-${topic.broad_topic}`} topic={topic} isPremium={isPremium} />
              ))}
            </div>
          )}
        </SkeletonSwap>
      </div>
      <Footer />
    </div>
  )
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ topic, isPremium }: { topic: Topic; isPremium: boolean }) {
  const hasLockedLevels = topic.free_level_count < topic.level_count
  const href = `/quiz/${encodeURIComponent(topic.broad_topic)}?grade=${topic.grade}&subject=${encodeURIComponent(topic.subject)}`

  return (
    <a href={href} className="qtopic-card">
      <div className="qtopic-top">
        <span className="qtopic-subject">{topic.subject}</span>
        <span className="qtopic-grade">Gr {topic.grade}</span>
      </div>
      <div className="qtopic-title">{topic.broad_topic_display}</div>
      <div className="qtopic-foot">
        <span>{topic.level_count} level{topic.level_count !== 1 ? 's' : ''}</span>
        {hasLockedLevels && !isPremium ? (
          <span className="qtopic-lock"><Lock size={12} /> {topic.free_level_count} free</span>
        ) : (
          <span className="qtopic-open">Open →</span>
        )}
      </div>
    </a>
  )
}
