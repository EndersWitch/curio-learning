'use client'

import { useState, type FormEvent } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { BLOOM_GRADES, type BloomErrorCode, type BloomErrorReason } from '@/lib/bloom/shared'
import {
  LENGTH_QUESTIONS,
  MAX_SCOPE_CHARS,
  TEST_LENGTHS,
  type QuestionMix,
  type GenerateResponse,
  type TestLength,
  type TopicsResponse,
} from '@/lib/testbuilder/shared'

// First screen of the test builder: type what the test covers, pick the
// length and question types, then check the topics Bloom found. Question
// generation comes in the next step; this page stops at the topic list.
// Plain markup on purpose: styling follows once the flow works.

// Says why a request was turned away, so the owner is not left guessing.
function describe(data: { error?: BloomErrorCode; reason?: BloomErrorReason }): string {
  if (data.error === 'closed') {
    return data.reason === 'not-tester'
      ? 'Bloom is open to testers only, and this account is not one. Use an admin account, or add this email to BLOOM_TESTERS.'
      : 'Bloom is switched off on this deployment. Set BLOOM_ACCESS to testers (or everyone) for this environment in Vercel, then redeploy.'
  }
  if (data.error === 'setup' && data.reason === 'no-service-key') {
    return 'SUPABASE_SERVICE_ROLE_KEY is not reaching this deployment. Check it is set for this environment, then redeploy.'
  }
  if (data.error === 'setup' && data.reason === 'no-key') return 'ANTHROPIC_API_KEY is not set on this deployment.'
  if (data.error === 'setup' && data.reason === 'no-tables') return 'The test builder database tables are missing.'
  return ERRORS[data.error as BloomErrorCode] ?? 'Something went wrong. Try again.'
}

const ERRORS: Partial<Record<BloomErrorCode, string>> = {
  signin: 'Please sign in to build a test.',
  closed: 'The test builder is not open yet.',
  limit: 'Lots of learners are using Bloom right now. Try again in a minute.',
  invalid: 'Check the details and try again.',
  setup: 'The test builder is not set up on this server yet.',
}

export default function TestBuilderStart() {
  const { user, loading } = useAuth()
  const [scope, setScope] = useState('')
  const [grade, setGrade] = useState<number>(7)
  const [subject, setSubject] = useState('')
  const [length, setLength] = useState<TestLength>('medium')
  const [mix, setMix] = useState<QuestionMix>({ mcq: true, short: true, long: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TopicsResponse | null>(null)
  const [made, setMade] = useState<GenerateResponse | null>(null)

  const noTypes = !mix.mcq && !mix.short && !mix.long

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || noTypes || !scope.trim()) return
    setBusy(true)
    setError(null)
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return setError(ERRORS.signin!)
      const res = await fetch('/api/tests/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ scope, grade, subject, length, questionMix: mix }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.reason === 'no-topics') return setError("I couldn't find any topics in that. Try listing what your test covers.")
        return setError(describe(data))
      }
      setResult(data as TopicsResponse)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    if (busy || !result) return
    setBusy(true)
    setError(null)
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return setError(ERRORS.signin!)
      const res = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ sessionId: result.sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setError(describe(data))
      setMade(data as GenerateResponse)
    } catch {
      setError('Could not make the questions. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  if (!user) return <p style={{ padding: 24 }}>Sign in to build a test.</p>

  if (result) {
    return (
      <section style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <h1>Topics for your test</h1>
        <ol>
          {result.topics.map(t => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ol>
        {made ? (
          <p>
            {made.questionCount} multiple-choice questions are ready.
            {made.writtenPending ? ' Written questions are coming in the next step.' : ''}{' '}
            <a href={`/bloom/tests/${made.sessionId}`}>Start the test</a>
          </p>
        ) : (
          <>
            {error && <p role="alert">{error}</p>}
            <button type="button" onClick={generate} disabled={busy}>
              {busy ? 'Writing questions…' : 'Generate questions'}
            </button>{' '}
          </>
        )}
        <button type="button" onClick={() => { setResult(null); setMade(null); setError(null) }}>Start over</button>
      </section>
    )
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 640, margin: '0 auto', padding: 24, display: 'grid', gap: 16 }}>
      <h1>Build a test</h1>

      <label>
        What is in your test?
        <textarea
          value={scope}
          onChange={e => setScope(e.target.value)}
          maxLength={MAX_SCOPE_CHARS}
          rows={7}
          placeholder="e.g. Fractions, decimals and percentages, then the water cycle"
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <label>
        Grade
        <select value={grade} onChange={e => setGrade(Number(e.target.value))}>
          {BLOOM_GRADES.map(g => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
      </label>

      <label>
        Subject (optional)
        <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={80} />
      </label>

      <fieldset>
        <legend>Length</legend>
        {TEST_LENGTHS.map(l => (
          <label key={l} style={{ marginRight: 16 }}>
            <input type="radio" name="length" checked={length === l} onChange={() => setLength(l)} /> {l} (about {LENGTH_QUESTIONS[l]} questions)
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Question types</legend>
        {([['mcq', 'Multiple choice'], ['short', 'Short answer'], ['long', 'Long answer']] as const).map(([key, label]) => (
          <label key={key} style={{ marginRight: 16 }}>
            <input type="checkbox" checked={mix[key]} onChange={e => setMix({ ...mix, [key]: e.target.checked })} /> {label}
          </label>
        ))}
      </fieldset>

      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy || noTypes || !scope.trim()}>
        {busy ? 'Finding topics…' : 'Find topics'}
      </button>
    </form>
  )
}
