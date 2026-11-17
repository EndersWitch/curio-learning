'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Row {
  id: string
  status: string
  subject: string | null
  grade: number | null
  marks_total: number | null
  marks_awarded: number | null
  created_at: string
  topics: { title: string; pct: number }[]
}

const medal = (pct: number) => (pct >= 80 ? { label: 'In full bloom', bg: 'var(--moss12)' } : pct >= 60 ? { label: 'Growing', bg: 'var(--ochre12)' } : { label: 'Seedling', bg: 'var(--brick10)' })

// Every test a learner has made, with the marks they earned: the place to
// show them off.
export default function MyTests() {
  const { user, loading } = useAuth()
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    if (loading || !user) return
    void (async () => {
      const { data: sessions } = await sb
        .from('test_sessions')
        .select('id, status, subject, grade, marks_total, marks_awarded, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      const list = (sessions ?? []) as Omit<Row, 'topics'>[]
      const markedIds = list.filter(s => s.status === 'marked').map(s => s.id)
      const byTopic = new Map<string, { title: string; got: number; total: number; session: string }>()
      if (markedIds.length) {
        const [{ data: topics }, { data: qs }, { data: answers }] = await Promise.all([
          sb.from('test_topics').select('id, title, session_id').in('session_id', markedIds),
          sb.from('test_questions').select('id, topic_id, marks, session_id').in('session_id', markedIds),
          sb.from('test_answers').select('question_id, marks_awarded').in('session_id', markedIds),
        ])
        const got = new Map((answers ?? []).map(a => [a.question_id as string, (a.marks_awarded as number | null) ?? 0]))
        for (const t of topics ?? []) byTopic.set(t.id as string, { title: t.title as string, got: 0, total: 0, session: t.session_id as string })
        for (const q of qs ?? []) {
          const t = byTopic.get(q.topic_id as string)
          if (!t) continue
          t.total += q.marks as number
          t.got += got.get(q.id as string) ?? 0
        }
      }
      setRows(
        list.map(s => ({
          ...s,
          topics: [...byTopic.values()]
            .filter(t => t.session === s.id && t.total > 0)
            .map(t => ({ title: t.title, pct: Math.round((t.got / t.total) * 100) })),
        })),
      )
    })()
  }, [loading, user])

  if (loading || rows === null) return null
  if (!user) return <p>Sign in to see your tests.</p>

  const done = rows.filter(r => r.status === 'marked' && r.marks_total)
  const earned = done.reduce((n, r) => n + (r.marks_awarded ?? 0), 0)
  const best = done.reduce((n, r) => Math.max(n, Math.round(((r.marks_awarded ?? 0) / (r.marks_total ?? 1)) * 100)), 0)

  return (
    <div className="tb-stack" style={{ gap: '1.2rem' }}>
      <h1>My tests</h1>
      {done.length > 0 && (
        <div className="tb-stats">
          <div className="tb-stat"><b>{earned}</b><span>marks earned</span></div>
          <div className="tb-stat"><b>{done.length}</b><span>{done.length === 1 ? 'test marked' : 'tests marked'}</span></div>
          <div className="tb-stat"><b>{best}%</b><span>best score</span></div>
        </div>
      )}
      <div className="tb-actions"><Link className="tb-btn" href="/bloom/tests/new">Build a new test</Link></div>
      {rows.length === 0 && <p className="tb-muted">No tests yet. Tell Bloom what you&apos;re studying and it will build one.</p>}
      <div className="tb-list">
        {rows.map(r => {
          const isMarked = r.status === 'marked' && r.marks_total
          const pct = isMarked ? Math.round(((r.marks_awarded ?? 0) / (r.marks_total ?? 1)) * 100) : 0
          const m = medal(pct)
          const resumable = ['ready', 'in_progress', 'submitted'].includes(r.status)
          if (!isMarked && !resumable) return null
          return (
            <Link key={r.id} href={`/bloom/tests/${r.id}`} className="tb-test">
              <div className="tb-trow-top">
                <span className="tb-trow-name">{r.subject || 'Test'}{r.grade ? ` · Grade ${r.grade}` : ''}</span>
                {isMarked ? <span className="tb-medal" style={{ background: m.bg }}>{m.label}</span> : <span className="tb-medal">{r.status === 'submitted' ? 'Waiting for marks' : 'In progress'}</span>}
              </div>
              {isMarked && <div className="tb-trow-score">{r.marks_awarded} / {r.marks_total} · {pct}%</div>}
              <div className="tb-muted">{new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              {r.topics.length > 0 && (
                <div className="tb-chips">
                  {r.topics.slice(0, 6).map(t => {
                    const b = t.pct >= 80 ? 'strong' : t.pct >= 60 ? 'mid' : 'weak'
                    return <span key={t.title} className={`tb-chip ${b}`}>{t.title} {t.pct}%</span>
                  })}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
