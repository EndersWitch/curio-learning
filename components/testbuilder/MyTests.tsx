'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { WHIZZ_FAQ } from '@/lib/testbuilder/whizzFaq'
import { Zap, PenLine, ListChecks, Trophy } from '@/components/icons'

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

const medal = (pct: number) => (pct >= 80 ? { label: 'Excellent', bg: 'var(--moss12)' } : pct >= 60 ? { label: 'Getting there', bg: 'var(--ochre12)' } : { label: 'Needs work', bg: 'var(--brick10)' })

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

  const hero = (
    <>
      <section className="wz-hero">
        <Zap size={150} className="wz-hero-bolt" aria-hidden="true" />
        <span className="wz-pill"><Zap size={14} /> Whizz</span>
        <h1 className="wz-h">Tell Whizz what your test covers. <em>Get a test made for you.</em></h1>
        <p className="wz-lede">Whizz builds a practice test for exactly what you are writing, marks it, and shows you where every mark went.</p>
        <div className="wz-cta-row">
          <Link className="tb-btn wz-cta" href={user ? '/whizz/new' : '/login'}>{user ? 'Make my test' : 'Log in to start'}</Link>
          <span className="wz-hint">Takes about a minute to build</span>
        </div>
      </section>
      <div className="wz-steps">
        <div className="wz-step s1"><span className="wz-step-ic"><PenLine size={22} /></span><b>1. Tell Whizz</b><span>Type your subject and what the test covers, or add your notes.</span></div>
        <div className="wz-step s2"><span className="wz-step-ic"><ListChecks size={22} /></span><b>2. Write it</b><span>Answer the questions: pick, type, drag, sort, even read a map.</span></div>
        <div className="wz-step s3"><span className="wz-step-ic"><Trophy size={22} /></span><b>3. See your marks</b><span>Get a marked paper with the memo and where you slipped.</span></div>
      </div>
    </>
  )

  const faq = (
    <section className="wz-faq" aria-label="Questions about Whizz">
      <h2 className="wz-h2">Questions</h2>
      {WHIZZ_FAQ.map(f => (
        <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
      ))}
    </section>
  )

  if (loading || rows === null || !user) return <div className="tb-stack" style={{ gap: '1.2rem' }}>{hero}{faq}</div>

  const done = rows.filter(r => r.status === 'marked' && r.marks_total)
  const earned = done.reduce((n, r) => n + (r.marks_awarded ?? 0), 0)
  const best = done.reduce((n, r) => Math.max(n, Math.round(((r.marks_awarded ?? 0) / (r.marks_total ?? 1)) * 100)), 0)

  return (
    <div className="tb-stack" style={{ gap: '1.2rem' }}>
      {hero}
      {rows.length > 0 && <h2 className="wz-h2">My tests</h2>}
      {done.length > 0 && (
        <div className="tb-stats">
          <div className="tb-stat"><b>{earned}</b><span>marks earned</span></div>
          <div className="tb-stat"><b>{done.length}</b><span>{done.length === 1 ? 'test marked' : 'tests marked'}</span></div>
          <div className="tb-stat"><b>{best}%</b><span>best score</span></div>
        </div>
      )}
      {rows.length === 0 && faq}
      <div className="tb-list">
        {rows.map(r => {
          const isMarked = r.status === 'marked' && r.marks_total
          const pct = isMarked ? Math.round(((r.marks_awarded ?? 0) / (r.marks_total ?? 1)) * 100) : 0
          const m = medal(pct)
          const resumable = ['ready', 'in_progress', 'submitted'].includes(r.status)
          if (!isMarked && !resumable) return null
          return (
            <Link key={r.id} href={`/whizz/${r.id}`} className="tb-test">
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
