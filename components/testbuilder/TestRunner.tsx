'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { MAX_ANSWER_CHARS, type WrittenType } from '@/lib/testbuilder/written'

// Taking a test and seeing the marks. Answers save as the learner works
// (straight to the database, held to RLS). The correct answers, the memo and
// the explanations stay on the server until the test is marked.
// Plain markup on purpose: styling follows once the flow works.

interface Option {
  key: string
  text: string
}

interface Question {
  id: string
  position: number
  qtype: string
  question_text: string
  marks: number
  options: Option[] | null
}

interface Key {
  question_id: string
  mcq_correct: string | null
  explanation: string | null
}

interface MarkPoint {
  id: string
  question_id: string
  point_text: string
}

interface PointFeedback {
  pointId: string
  awarded: boolean
  reason: string
}

interface Result {
  marks: number | null
  points: PointFeedback[]
}

interface Session {
  id: string
  status: string
  marks_total: number | null
  marks_awarded: number | null
}

type Patch = { mcq_choice: string } | { answer_text: string }

export default function TestRunner({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<'loading' | 'missing' | 'ready'>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [keys, setKeys] = useState<Record<string, Key>>({})
  const [points, setPoints] = useState<Record<string, MarkPoint[]>>({})
  const [results, setResults] = useState<Record<string, Result>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Which questions already have an answer row, each question's save queue so
  // quick changes land in the order they were made, and pending typing timers.
  const known = useRef(new Set<string>())
  const queue = useRef<Record<string, Promise<void>>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const latestText = useRef<Record<string, string>>({})

  const load = useCallback(async () => {
    const { data: s } = await sb
      .from('test_sessions')
      .select('id, status, marks_total, marks_awarded')
      .eq('id', sessionId)
      .maybeSingle()
    if (!s) return setState('missing')

    const { data: qs } = await sb
      .from('test_questions')
      .select('id, position, qtype, question_text, marks, options')
      .eq('session_id', sessionId)
      .order('position')
    const { data: answers } = await sb
      .from('test_answers')
      .select('question_id, mcq_choice, answer_text, marks_awarded, feedback')
      .eq('session_id', sessionId)

    known.current = new Set((answers ?? []).map(a => a.question_id as string))
    setChoices(Object.fromEntries((answers ?? []).filter(a => a.mcq_choice).map(a => [a.question_id as string, a.mcq_choice as string])))
    const savedText = Object.fromEntries((answers ?? []).filter(a => a.answer_text).map(a => [a.question_id as string, a.answer_text as string]))
    setTexts(savedText)
    latestText.current = { ...savedText }
    setQuestions((qs ?? []) as Question[])

    const ids = (qs ?? []).map(q => q.id as string)
    if (s.status === 'marked') {
      const [{ data: k }, { data: p }] = await Promise.all([
        sb.from('test_question_keys').select('question_id, mcq_correct, explanation').in('question_id', ids),
        sb.from('test_mark_points').select('id, question_id, point_text, position').in('question_id', ids).order('position'),
      ])
      setKeys(Object.fromEntries((k ?? []).map(row => [row.question_id as string, row as Key])))
      const grouped: Record<string, MarkPoint[]> = {}
      for (const row of (p ?? []) as MarkPoint[]) (grouped[row.question_id] ??= []).push(row)
      setPoints(grouped)
      setResults(
        Object.fromEntries(
          (answers ?? []).map(a => [
            a.question_id as string,
            { marks: a.marks_awarded as number | null, points: ((a.feedback as { points?: PointFeedback[] } | null)?.points ?? []) as PointFeedback[] },
          ]),
        ),
      )
    }
    setSession(s as Session)
    setState('ready')
  }, [sessionId])

  useEffect(() => {
    if (!authLoading && user) void load()
  }, [authLoading, user, load])

  async function save(questionId: string, patch: Patch) {
    if (known.current.has(questionId)) {
      const { error: e } = await sb.from('test_answers').update(patch).eq('session_id', sessionId).eq('question_id', questionId)
      if (e) throw e
      return
    }
    const { error: e } = await sb.from('test_answers').insert({ session_id: sessionId, question_id: questionId, ...patch })
    if (e && e.code !== '23505') throw e
    known.current.add(questionId)
    // A row already existed (a quick second change): write this over it.
    if (e) {
      const { error: u } = await sb.from('test_answers').update(patch).eq('session_id', sessionId).eq('question_id', questionId)
      if (u) throw u
    }
  }

  function enqueue(questionId: string, patch: Patch) {
    queue.current[questionId] = (queue.current[questionId] ?? Promise.resolve())
      .then(() => save(questionId, patch))
      .then(() => setError(null))
      .catch(() => setError("An answer didn't save. Check your connection, then tap or type it again."))
  }

  const isOpen = session?.status === 'ready' || session?.status === 'in_progress'

  function choose(questionId: string, key: string) {
    if (!isOpen) return
    setChoices(c => ({ ...c, [questionId]: key }))
    enqueue(questionId, { mcq_choice: key })
  }

  function flushText(questionId: string) {
    clearTimeout(timers.current[questionId])
    delete timers.current[questionId]
    enqueue(questionId, { answer_text: latestText.current[questionId] ?? '' })
  }

  function type(questionId: string, value: string) {
    if (!isOpen) return
    setTexts(t => ({ ...t, [questionId]: value }))
    latestText.current[questionId] = value
    clearTimeout(timers.current[questionId])
    timers.current[questionId] = setTimeout(() => flushText(questionId), 800)
  }

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      for (const id of Object.keys(timers.current)) flushText(id)
      await Promise.all(Object.values(queue.current))
      const { data: { session: auth } } = await sb.auth.getSession()
      if (!auth) return setError('Please sign in again.')
      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.access_token}` },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) return setError('Could not hand in the test. Try again.')
      await load()
    } catch {
      setError('Could not hand in the test. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (authLoading || state === 'loading') return null
  if (!user) return <p style={{ padding: 24 }}>Sign in to take this test.</p>
  if (state === 'missing' || !session) return <p style={{ padding: 24 }}>That test was not found.</p>

  const marked = session.status === 'marked'
  const waiting = session.status === 'submitted'
  const unanswered = questions.filter(q => (q.qtype === 'mcq' ? !choices[q.id] : !texts[q.id]?.trim())).length

  return (
    <section style={{ maxWidth: 680, margin: '0 auto', padding: 24, display: 'grid', gap: 20 }}>
      {marked ? (
        <h1>
          Your mark: {session.marks_awarded} / {session.marks_total}
        </h1>
      ) : (
        <h1>Your test</h1>
      )}

      {waiting && (
        <p>
          Your test is handed in, but the marking did not finish. Tap the button to try again.{' '}
          <button type="button" onClick={submit} disabled={busy}>
            {busy ? 'Marking…' : 'Mark my test'}
          </button>
        </p>
      )}

      {questions.map(q => {
        const key = keys[q.id]
        const result = results[q.id]
        const memo = points[q.id] ?? []
        return (
          <div key={q.id} style={{ display: 'grid', gap: 6 }}>
            <strong>
              {q.position}. {q.question_text} ({q.marks} {q.marks === 1 ? 'mark' : 'marks'})
            </strong>

            {q.qtype === 'mcq' ? (
              (q.options ?? []).map(o => {
                const picked = choices[q.id] === o.key
                const isRight = marked && (key?.mcq_correct?.split(',') ?? []).includes(o.key)
                const isWrongPick = marked && picked && !isRight
                return (
                  <label key={o.key} style={{ display: 'block' }}>
                    <input type="radio" name={q.id} checked={picked} disabled={!isOpen} onChange={() => choose(q.id, o.key)} /> {o.key}. {o.text}
                    {isRight ? '  ✓ correct' : ''}
                    {isWrongPick ? '  ✗ your answer' : ''}
                  </label>
                )
              })
            ) : (
              <textarea
                value={texts[q.id] ?? ''}
                disabled={!isOpen}
                rows={q.qtype === 'long' ? 8 : 3}
                maxLength={MAX_ANSWER_CHARS[q.qtype as WrittenType] ?? 1500}
                placeholder="Type your answer here"
                onChange={e => type(q.id, e.target.value)}
                onBlur={() => timers.current[q.id] && flushText(q.id)}
                style={{ width: '100%' }}
              />
            )}

            {marked && q.qtype === 'mcq' && key?.explanation && <p>{key.explanation}</p>}

            {marked && q.qtype !== 'mcq' && result && (
              <div style={{ display: 'grid', gap: 4 }}>
                <em>
                  You got {result.marks ?? 0} / {q.marks}
                </em>
                {memo.map(p => {
                  const fb = result.points.find(x => x.pointId === p.id)
                  return (
                    <div key={p.id}>
                      {fb?.awarded ? '✓' : '✗'} {p.point_text}
                      {fb?.reason ? <div>{fb.reason}</div> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {error && <p role="alert">{error}</p>}
      {isOpen && (
        <div>
          {unanswered > 0 && <p>{unanswered} not answered yet.</p>}
          <button type="button" onClick={submit} disabled={busy}>
            {busy ? 'Marking your answers… this can take a little while' : 'Hand in test'}
          </button>
        </div>
      )}
      {marked && <a href="/bloom/tests/new">Build another test</a>}
    </section>
  )
}
