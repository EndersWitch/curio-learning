'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Lock, Star, Search } from '@/components/icons'
import Footer from '@/components/Footer'
import Bloom from '@/components/Bloom'
import type { TopicSummary } from '@/lib/content'
import { topicHref } from '@/lib/quizUrls'

// Topics come from the server (app/quiz/page.tsx), so the whole list is in
// the page's HTML; this component only layers the grade filter and the
// signed-in pill on top.
export default function QuizBrowse({ topics }: { topics: TopicSummary[] }) {
  const { user, loading: authLoading } = useAuth()
  const [gradeFilter, setGradeFilter] = useState<number | null>(null)

  const isPremium = user?.isPremium || user?.isFounder || false

  // Only grades that actually have quizzes — an empty grade is a dead end.
  const grades = [...new Set(topics.map((t) => t.grade))].sort((a, b) => a - b)

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get('grade')
    if (g) setGradeFilter(Number(g))
  }, [])

  const filtered = gradeFilter
    ? topics.filter(t => t.grade === gradeFilter)
    : topics

  return (
    <div style={{ background: 'var(--paper)' }}>
      <div className="hub-wrap">
        <div className="spread-deco o1" style={{ top: '-50px', right: '-20px' }}>
          <Bloom size={260} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '5%', left: '-40px' }}>
          <Bloom size={160} />
        </div>
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
          {grades.map(g => (
            <button key={g} onClick={() => setGradeFilter(g)} className={`gp${gradeFilter === g ? ' on' : ''}`}>
              Gr {g}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="qtopics-empty">
            <Search size={32} style={{ margin: '0 auto', display: 'block' }} />
            <p className="qtopics-empty-title">No topics yet for this grade</p>
            <p>More are being added. Check back soon!</p>
          </div>
        ) : (
          <div className="qtopics-grid">
            {filtered.map(topic => (
              <TopicCard key={`${topic.grade}-${topic.subject}-${topic.broad_topic}`} topic={topic} isPremium={isPremium} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function TopicCard({ topic, isPremium }: { topic: TopicSummary; isPremium: boolean }) {
  const hasLockedLevels = topic.free_level_count < topic.level_count

  return (
    <a href={topicHref(topic)} className="qtopic-card">
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
