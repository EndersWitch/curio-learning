'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import BloomBuddy from '@/components/bloom/BloomBuddy'
import { BLOOM_GRADES, type BloomErrorCode, type BloomErrorReason } from '@/lib/bloom/shared'
import {
  perTopicLabel,
  MAX_SCOPE_CHARS,
  MAX_TOPICS,
  MAX_TOPIC_CHARS,
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
  const [mix, setMix] = useState<QuestionMix>({ mcq: true, short: true, long: false, interactive: true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TopicsResponse | null>(null)
  const [made, setMade] = useState<GenerateResponse | null>(null)
  const [topicList, setTopicList] = useState<TopicsResponse['topics']>([])
  const [newTopic, setNewTopic] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (result) setTopicList(result.topics)
  }, [result])
  // Rotates Bloom's line while questions are being written.
  useEffect(() => {
    if (!busy) return
    const t = setInterval(() => setTick(n => n + 1), 3500)
    return () => clearInterval(t)
  }, [busy])

  const noTypes = !mix.mcq && !mix.short && !mix.long && !mix.interactive

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

  async function removeTopic(id: string) {
    if (busy || topicList.length <= 1) return
    const { error: e } = await sb.from('test_topics').delete().eq('id', id)
    if (e) return setError("Couldn't remove that topic. Try again.")
    setTopicList(list => list.filter(t => t.id !== id))
  }

  async function addTopic(e: FormEvent) {
    e.preventDefault()
    const title = newTopic.trim().slice(0, MAX_TOPIC_CHARS)
    if (!title || !result || busy || topicList.length >= MAX_TOPICS) return
    const { data, error: err } = await sb
      .from('test_topics')
      .insert({ session_id: result.sessionId, position: topicList.length + 100, title, included: true })
      .select('id, title, included')
      .single()
    if (err || !data) return setError("Couldn't add that topic. Try again.")
    setTopicList(list => [...list, data as TopicsResponse['topics'][number]])
    setNewTopic('')
  }

  if (loading) return null
  if (!user) return <p>Sign in to build a test.</p>

  const step = made ? 3 : result ? 2 : 1
  const steps = ['What\'s in it', 'Check topics', 'Go!']
  const WRITING = [
    'Reading your scope…',
    'Writing questions, one topic at a time…',
    'Checking every answer twice…',
    'Making sure the memo is right…',
    'Nearly there. Sharpening pencils…',
  ]

  const stepper = (
    <ol className="tb-steps" aria-label="Progress">
      {steps.map((label, i) => (
        <li key={label} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}>
          <span>{i + 1 < step ? '✓' : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  )

  // ---------- Step 2 and 3: topics, then questions ----------
  if (result) {
    return (
      <div className="tb-stack" style={{ gap: '1.2rem' }}>
        {stepper}
        <div className="tb-hello">
          <BloomBuddy mood={busy ? 'thinking' : made ? 'cheer' : 'talking'} size={84} entrance />
          <h1>
            {made ? <>Your test is <em>ready</em></> : busy ? <>Writing your <em>questions</em></> : <>Is this <em>everything</em>?</>}
          </h1>
          <p className="tb-sub">
            {made
              ? `${made.questionCount} questions, worth ${made.marksTotal} marks.`
              : busy
                ? WRITING[tick % WRITING.length]
                : 'Here is what I found in your test. Remove anything that is not in it, or add what I missed.'}
          </p>
        </div>

        {!made && !busy && (
          <>
            <div className="tb-chips big">
              {topicList.map(t => (
                <span key={t.id} className="tb-topic-chip">
                  {t.title}
                  {topicList.length > 1 && (
                    <button type="button" aria-label={`Remove ${t.title}`} onClick={() => removeTopic(t.id)}>×</button>
                  )}
                </span>
              ))}
            </div>
            {topicList.length < MAX_TOPICS && (
              <form onSubmit={addTopic} className="tb-addrow">
                <input className="tb-text" value={newTopic} maxLength={MAX_TOPIC_CHARS} onChange={e => setNewTopic(e.target.value)} placeholder="Add a topic I missed" />
                <button type="submit" className="btn-soft" disabled={!newTopic.trim()}>Add</button>
              </form>
            )}
          </>
        )}

        {busy && <div className="tb-working" aria-hidden="true"><i /><i /><i /></div>}
        {error && <p role="alert" className="tb-error">{error}</p>}

        <div className="tb-actions">
          {made ? (
            <a className="btn-primary" href={`/bloom/tests/${made.sessionId}`}>Start the test</a>
          ) : (
            <button type="button" className="btn-primary" onClick={generate} disabled={busy}>
              {busy ? 'Writing questions…' : 'Make my test'}
            </button>
          )}
          {!busy && (
            <button type="button" className="btn-soft" onClick={() => { setResult(null); setMade(null); setError(null) }}>Start over</button>
          )}
        </div>
      </div>
    )
  }

  // ---------- Step 1: what is in the test ----------
  const LENGTH_INFO: Record<TestLength, [string, string]> = {
    short: ['Quick check', 'A few questions on each topic'],
    medium: ['A proper test', 'A good spread on each topic'],
    long: ['The full works', 'Lots of practice on each topic'],
  }
  const TYPES = [
    ['mcq', 'Multiple choice', 'Pick the right answer'],
    ['short', 'Short answer', 'A word or a few lines'],
    ['long', 'Long answer', 'Explain it properly'],
    ['interactive', 'Hands-on', 'Draw, drag and sort'],
  ] as const

  return (
    <form onSubmit={submit} className="tb-stack" style={{ gap: '1.4rem' }}>
      {stepper}
      <div className="tb-hello">
        <BloomBuddy mood={busy ? 'thinking' : scope ? 'listening' : 'idle'} size={84} entrance />
        <h1>What is your test <em>on</em>?</h1>
        <p className="tb-sub">Type or paste what you need to know. Bloom will turn it into practice questions and mark them for you.</p>
      </div>

      <label className="tb-field">
        <span className="tb-label">Your scope</span>
        <textarea
          className="tb-text"
          value={scope}
          onChange={e => setScope(e.target.value)}
          maxLength={MAX_SCOPE_CHARS}
          rows={6}
          placeholder="e.g. Fractions, decimals and percentages, then the water cycle"
        />
        <span className="tb-count">{scope.length} / {MAX_SCOPE_CHARS}</span>
      </label>

      <div className="tb-two">
        <label className="tb-field">
          <span className="tb-label">Grade</span>
          <select className="tb-text" value={grade} onChange={e => setGrade(Number(e.target.value))}>
            {BLOOM_GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </label>
        <label className="tb-field">
          <span className="tb-label">Subject (optional)</span>
          <input className="tb-text" value={subject} onChange={e => setSubject(e.target.value)} maxLength={80} placeholder="e.g. Mathematics" />
        </label>
      </div>

      <fieldset className="tb-field">
        <legend className="tb-label">How long?</legend>
        <div className="tb-pick three">
          {TEST_LENGTHS.map(l => (
            <label key={l} className={`tb-pickcard ${length === l ? 'on' : ''}`}>
              <input type="radio" name="length" checked={length === l} onChange={() => setLength(l)} />
              <b>{LENGTH_INFO[l][0]}</b>
              <span>{perTopicLabel(l)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="tb-field">
        <legend className="tb-label">What kinds of questions?</legend>
        <div className="tb-pick four">
          {TYPES.map(([key, label, hint]) => (
            <label key={key} className={`tb-pickcard ${mix[key] ? 'on' : ''}`}>
              <input type="checkbox" checked={mix[key] === true} onChange={e => setMix({ ...mix, [key]: e.target.checked })} />
              <b>{label}</b>
              <span>{hint}</span>
            </label>
          ))}
        </div>
        {noTypes && <span className="tb-error">Pick at least one kind of question.</span>}
      </fieldset>

      {error && <p role="alert" className="tb-error">{error}</p>}
      <div className="tb-actions">
        <button type="submit" className="btn-primary" disabled={busy || noTypes || !scope.trim()}>
          {busy ? 'Finding topics…' : 'Find my topics'}
        </button>
        <Link className="tb-link" href="/bloom/tests">My tests</Link>
      </div>
    </form>
  )
}
