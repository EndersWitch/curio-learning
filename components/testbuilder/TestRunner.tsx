'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { SubmitResponse } from '@/lib/testbuilder/shared'

// Taking a test and seeing the marks. Answers save as the learner picks them
// (straight to the database, held to RLS). The correct answers and
// explanations stay on the server until the test is marked.
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

interface Session {
  id: string
  status: string
  marks_total: number | null
  marks_awarded: number | null
}

export default function TestRunner({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<'loading' | 'missing' | 'ready'>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [keys, setKeys] = useState<Record<string, Key>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Which questions already have an answer row, and each question's save queue
  // so quick changes land in the order they were made.
  const known = useRef(new Set<string>())
  const queue = useRef<Record<string, Promise<void>>>({})

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
      .select('question_id, mcq_choice')
      .eq('session_id', sessionId)

    known.current = new Set((answers ?? []).map(a => a.question_id as string))
    setChoices(
      Object.fromEntries((answers ?? []).filter(a => a.mcq_choice).map(a => [a.question_id as string, a.mcq_choice as string])),
    )
    setQuestions((qs ?? []) as Question[])

    if (s.status === 'marked') {
      const { data: k } = await sb
        .from('test_question_keys')
        .select('question_id, mcq_correct, explanation')
        .in('question_id', (qs ?? []).map(q => q.id as string))
      setKeys(Object.fromEntries((k ?? []).map(row => [row.question_id as string, row as Key])))
    }
    setSession(s as Session)
    setState('ready')
  }, [sessionId])

  useEffect(() => {
    if (!authLoading && user) void load()
  }, [authLoading, user, load])

  async function save(questionId: string, choice: string) {
    if (known.current.has(questionId)) {
      const { error: e } = await sb
        .from('test_answers')
        .update({ mcq_choice: choice })
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
      if (e) throw e
      return
    }
    const { error: e } = await sb.from('test_answers').insert({ session_id: sessionId, question_id: questionId, mcq_choice: choice })
    if (e && e.code !== '23505') throw e
    known.current.add(questionId)
    // A row already existed (a quick second tap): write this choice over it.
    if (e) {
      const { error: u } = await sb
        .from('test_answers')
        .update({ mcq_choice: choice })
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
      if (u) throw u
    }
  }

  function choose(questionId: string, key: string) {
    if (session?.status !== 'ready' && session?.status !== 'in_progress') return
    setChoices(c => ({ ...c, [questionId]: key }))
    setError(null)
    queue.current[questionId] = (queue.current[questionId] ?? Promise.resolve())
      .then(() => save(questionId, key))
      .catch(() => setError("That answer didn't save. Check your connection and tap it again."))
  }

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await Promise.all(Object.values(queue.current))
      const { data: { session: auth } } = await sb.auth.getSession()
      if (!auth) return setError('Please sign in again.')
      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.access_token}` },
        body: JSON.stringify({ sessionId }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<SubmitResponse>
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
  const open = session.status === 'ready' || session.status === 'in_progress'
  const unanswered = questions.filter(q => q.qtype === 'mcq' && !choices[q.id]).length

  return (
    <section style={{ maxWidth: 680, margin: '0 auto', padding: 24, display: 'grid', gap: 20 }}>
      {marked ? (
        <h1>
          Your mark: {session.marks_awarded} / {session.marks_total}
        </h1>
      ) : (
        <h1>Your test</h1>
      )}

      {!open && !marked && <p>This test has been handed in and is waiting to be marked.</p>}

      {questions.map(q => {
        const key = keys[q.id]
        return (
          <div key={q.id} style={{ display: 'grid', gap: 6 }}>
            <strong>
              {q.position}. {q.question_text} ({q.marks} {q.marks === 1 ? 'mark' : 'marks'})
            </strong>
            {q.qtype !== 'mcq' ? (
              <em>Written questions are coming soon.</em>
            ) : (
              (q.options ?? []).map(o => {
                const picked = choices[q.id] === o.key
                const isRight = marked && key?.mcq_correct === o.key
                const isWrongPick = marked && picked && !isRight
                return (
                  <label key={o.key} style={{ display: 'block' }}>
                    <input
                      type="radio"
                      name={q.id}
                      checked={picked}
                      disabled={!open}
                      onChange={() => choose(q.id, o.key)}
                    />{' '}
                    {o.key}. {o.text}
                    {isRight ? '  ✓ correct' : ''}
                    {isWrongPick ? '  ✗ your answer' : ''}
                  </label>
                )
              })
            )}
            {marked && key?.explanation && <p>{key.explanation}</p>}
          </div>
        )
      })}

      {error && <p role="alert">{error}</p>}
      {open && (
        <div>
          {unanswered > 0 && <p>{unanswered} not answered yet.</p>}
          <button type="button" onClick={submit} disabled={busy}>
            {busy ? 'Handing in…' : 'Hand in test'}
          </button>
        </div>
      )}
      {(marked || !open) && <a href="/bloom/tests/new">Build another test</a>}
    </section>
  )
}
