'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase'
import QuizRating from '@/components/testbuilder/QuizRating'
import AskAboutQuestion from '@/components/testbuilder/AskAboutQuestion'
import { useAuth } from '@/lib/auth-context'
import BloomBuddy, { type BloomMood } from '@/components/bloom/BloomBuddy'
import { BloomScore, useBloomReveal } from '@/components/quiz/ResultsScreen'
import { MAX_ANSWER_CHARS, type WrittenType } from '@/lib/testbuilder/written'
import { checkBasics, cleanTips, skipsWritingTips, type WritingTip } from '@/lib/testbuilder/writing'
import ActivityFrame from '@/components/ActivityFrame'
import SymmetryWidget from '@/components/testbuilder/interactive/SymmetryWidget'
import BondWidget from '@/components/testbuilder/interactive/BondWidget'
import SortWidget from '@/components/testbuilder/interactive/SortWidget'
import { FillWidget, MatchWidget, OrderWidget, PickWidget, PlotWidget, ShadeWidget } from '@/components/testbuilder/interactive/AuthoredWidgets'
import { cleanCells, cleanFills, cleanMatch, cleanOrder, cleanPicked, cleanPlot } from '@/lib/testbuilder/authored'
import { AngleWidget, ClockWidget, LabelWidget, LineWidget, PeriodicWidget } from '@/components/testbuilder/interactive/HandsOnWidgets'
import { cleanAngle, cleanClock, cleanElements, cleanLabels, cleanLinePts } from '@/lib/testbuilder/handson'
import GeometryWidget from '@/components/testbuilder/interactive/GeometryWidget'
import MapWidget from '@/components/testbuilder/interactive/MapWidget'
import { cleanGeometry } from '@/lib/testbuilder/geometry'
import { cleanActivity, cleanAssign, cleanLines, cleanMapLine, cleanMoves, cleanPicks, isInteractive, type SortAnswer, type SortSpec } from '@/lib/testbuilder/interactive'

// Taking a test, the mark screen, and the marked paper. Answers save as the
// learner works (straight to the database, held to RLS). The correct answers,
// the memo and the explanations stay on the server until the test is marked.

interface Option { key: string; text: string }
interface Question {
  id: string
  topic_id: string | null
  position: number
  qtype: string
  question_text: string
  marks: number
  options: Option[] | null
  spec: unknown
}
interface Key { question_id: string; mcq_correct: string | null; explanation: string | null; answer_spec: unknown }
interface MarkPoint { id: string; question_id: string; point_text: string }
interface PointFeedback { pointId: string; awarded: boolean; reason: string }
interface Result { answerId: string; marks: number | null; points: PointFeedback[]; tips: WritingTip[] }
interface Topic { id: string; title: string; position: number }
interface Session { id: string; subject: string | null; status: string; marks_total: number | null; marks_awarded: number | null }
type Patch = { mcq_choice: string } | { answer_text: string } | { answer_json: unknown }

const QUESTION_REASONS: [string, string][] = [
  ['wrong_answer', 'The answer is wrong'],
  ['no_right_answer', 'No option is right'],
  ['two_right_answers', 'Two options are right'],
  ['unclear', "I can't understand it"],
  ['other', 'Something else'],
]
const MARK_REASONS: [string, string][] = [
  ['unfair_mark', 'I should have got more marks'],
  ['wrong_answer', 'The memo is wrong'],
  ['other', 'Something else'],
]

type Band = 'strong' | 'mid' | 'weak'
const band = (pct: number): Band => (pct >= 80 ? 'strong' : pct >= 60 ? 'mid' : 'weak')
const BAND_LABEL: Record<Band, string> = { strong: 'Strong', mid: 'Getting there', weak: 'Needs work' }

const PASS_MESSAGES = ['You absolutely smashed it!', "Outstanding work! You're on fire!", 'That was brilliant! Keep it up!', "Wow! You're a real star!"]
const FAIL_MESSAGES = ["So close! Let's find what to practise.", "Don't give up! Every attempt makes you stronger!", 'Nice try! Look at the topics below and go again!']
const CONFETTI_COLORS = ['var(--rust)', 'var(--rust)', 'var(--ochre)', 'var(--moss)']

// The learner's own answer, with the capital letter and full stop that "fell
// off the page" shown literally, and a tap to put them back.
function WordsFallOff({ text }: { text: string }) {
  const basics = useMemo(() => checkBasics(text), [text])
  const [fixedStart, setFixedStart] = useState(false)
  const [fixedEnd, setFixedEnd] = useState(false)
  const trimmed = text.trim()
  const firstAt = trimmed.search(/[A-Za-z]/)
  const startBad = basics.startsLower && !fixedStart
  const endBad = basics.missingEnd && !fixedEnd

  let head = ''
  let first = ''
  let rest = trimmed
  if (firstAt >= 0) {
    head = trimmed.slice(0, firstAt)
    first = trimmed[firstAt]!
    rest = trimmed.slice(firstAt + 1)
  }
  if (basics.startsLower && fixedStart) first = first.toUpperCase()

  // Split off the last word so it can slide off the page when the full stop is missing.
  let middle = rest
  let last = ''
  let tail = ''
  if (basics.missingEnd && basics.lastWord) {
    const at = rest.lastIndexOf(basics.lastWord)
    if (at >= 0) {
      middle = rest.slice(0, at)
      last = basics.lastWord
      tail = rest.slice(at + basics.lastWord.length)
    }
  }

  return (
    <div className="tb-stack" style={{ gap: '0.5rem' }}>
      <div className="tb-page">
        {head}
        {startBad ? <span className="hide">{first}</span> : <span className={basics.startsLower ? 'caught' : undefined}>{first}</span>}
        {middle}
        {last && (endBad ? <span className="fall">{last}</span> : <span>{last}</span>)}
        {last && fixedEnd && <span className="caught">.</span>}
        {tail}
      </div>
      {(startBad || endBad) && (
        <div className="tb-actions">
          <p className="tb-muted" style={{ flex: 1 }}>
            {endBad
              ? `Uh-oh, with no full stop "${basics.lastWord}" is slipping off the page!`
              : 'Your first letter is hiding. Sentences start with a capital letter.'}
          </p>
          {startBad && <button type="button" className="tb-btn soft" onClick={() => setFixedStart(true)}>Add the capital</button>}
          {endBad && <button type="button" className="tb-btn soft" onClick={() => setFixedEnd(true)}>Catch the word!</button>}
        </div>
      )}
      {basics.missingEnd && fixedEnd && <p className="tb-muted">Caught it! A full stop keeps your words safe on the page.</p>}
      {basics.startsLower && fixedStart && <p className="tb-muted">Lovely. A capital letter says &ldquo;a new sentence starts here&rdquo;.</p>}
    </div>
  )
}

function ReportBox({ kind, onSend, onCancel }: { kind: 'question' | 'mark'; onSend: (reason: string, note: string) => Promise<boolean>; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const reasons = kind === 'question' ? QUESTION_REASONS : MARK_REASONS
  return (
    <div className="tb-report">
      <strong style={{ fontFamily: 'var(--h)' }}>{kind === 'question' ? "What's wrong with this question?" : "What's wrong with this mark?"}</strong>
      <div className="tb-reasons">
        {reasons.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={reason === value} onClick={() => setReason(value)}>{label}</button>
        ))}
      </div>
      <textarea className="tb-text" rows={2} maxLength={500} placeholder="Tell us more (optional)" value={note} onChange={e => setNote(e.target.value)} />
      {failed && <p role="alert" className="tb-muted">That didn&apos;t send. Try again.</p>}
      <div className="tb-actions">
        <button
          type="button"
          className="tb-btn"
          disabled={!reason || busy}
          onClick={async () => {
            setBusy(true)
            setFailed(!(await onSend(reason, note.trim())))
            setBusy(false)
          }}
        >
          Send report
        </button>
        <button type="button" className="tb-link" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function TestRunner({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<'loading' | 'missing' | 'ready'>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [json, setJson] = useState<Record<string, unknown>>({})
  const [keys, setKeys] = useState<Record<string, Key>>({})
  const [points, setPoints] = useState<Record<string, MarkPoint[]>>({})
  const [results, setResults] = useState<Record<string, Result>>({})
  const [reported, setReported] = useState<Set<string>>(new Set())
  const [reporting, setReporting] = useState<string | null>(null)
  const [view, setView] = useState<'summary' | 'paper'>('summary')
  const [only, setOnly] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [showMissing, setShowMissing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [practising, setPracticing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const known = useRef(new Set<string>())
  const queue = useRef<Record<string, Promise<void>>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const latestText = useRef<Record<string, string>>({})

  const load = useCallback(async () => {
    const { data: s } = await sb.from('test_sessions').select('id, subject, status, marks_total, marks_awarded').eq('id', sessionId).maybeSingle()
    if (!s) return setState('missing')

    const [{ data: qs }, { data: answers }, { data: tps }, { data: flags }] = await Promise.all([
      sb.from('test_questions').select('id, topic_id, position, qtype, question_text, marks, options, spec').eq('session_id', sessionId).order('position'),
      sb.from('test_answers').select('id, question_id, mcq_choice, answer_text, answer_json, marks_awarded, feedback').eq('session_id', sessionId),
      sb.from('test_topics').select('id, title, position').eq('session_id', sessionId).order('position'),
      sb.from('test_flags').select('question_id, kind'),
    ])

    known.current = new Set((answers ?? []).map(a => a.question_id as string))
    setChoices(Object.fromEntries((answers ?? []).filter(a => a.mcq_choice).map(a => [a.question_id as string, a.mcq_choice as string])))
    const savedText = Object.fromEntries((answers ?? []).filter(a => a.answer_text).map(a => [a.question_id as string, a.answer_text as string]))
    setTexts(savedText)
    setJson(Object.fromEntries((answers ?? []).filter(a => a.answer_json).map(a => [a.question_id as string, a.answer_json])))
    latestText.current = { ...savedText }
    setQuestions((qs ?? []) as Question[])
    setTopics((tps ?? []) as Topic[])
    setReported(new Set((flags ?? []).map(f => `${f.kind}:${f.question_id}`)))

    const ids = (qs ?? []).map(q => q.id as string)
    if (s.status === 'marked') {
      const [{ data: k }, { data: p }] = await Promise.all([
        sb.from('test_question_keys').select('question_id, mcq_correct, explanation, answer_spec').in('question_id', ids),
        sb.from('test_mark_points').select('id, question_id, point_text, position').in('question_id', ids).order('position'),
      ])
      setKeys(Object.fromEntries((k ?? []).map(row => [row.question_id as string, row as Key])))
      const grouped: Record<string, MarkPoint[]> = {}
      for (const row of (p ?? []) as MarkPoint[]) (grouped[row.question_id] ??= []).push(row)
      setPoints(grouped)
      setResults(
        Object.fromEntries(
          (answers ?? []).map(a => {
            const fb = a.feedback as { points?: PointFeedback[]; tips?: unknown } | null
            return [a.question_id as string, { answerId: a.id as string, marks: a.marks_awarded as number | null, points: fb?.points ?? [], tips: cleanTips(fb?.tips) }]
          }),
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

  function setAnswer(questionId: string, value: unknown) {
    if (!isOpen) return
    setJson(j => ({ ...j, [questionId]: value }))
    enqueue(questionId, { answer_json: value })
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

  const isBlank = useCallback(
    (q: Question) => {
      if (q.qtype === 'mcq') return !choices[q.id]
      if (!isInteractive(q.qtype)) return !texts[q.id]?.trim()
      const v = json[q.id] as Record<string, unknown> | undefined
      if (q.qtype === 'symmetry') return cleanLines(v?.lines).length === 0
      if (q.qtype === 'bond') return Object.keys(cleanMoves(v?.moves)).length === 0
      if (q.qtype === 'sort') {
        const spec = q.spec as SortSpec
        return Object.keys(cleanAssign(v?.assign, spec)).length < spec.items.length
      }
      if (q.qtype === 'maplocate') {
        const ids = ((q.spec as { targets?: { id: string }[] })?.targets ?? []).map(t => t.id)
        return Object.keys(cleanPicks(v, ids)).length < ids.length
      }
      if (q.qtype === 'mapline') return !cleanMapLine(v)
      if (['plot', 'shade', 'order', 'match', 'pick', 'fill'].includes(q.qtype)) {
        const sp = q.spec as never
        if (q.qtype === 'plot') return !cleanPlot(v, sp)
        if (q.qtype === 'shade') return cleanCells(v, sp).length === 0
        if (q.qtype === 'order') return !(json[q.id] && cleanOrder(v, sp))
        if (q.qtype === 'match') return Object.keys(cleanMatch(v, sp)).length < (sp as { left: unknown[] }).left.length
        if (q.qtype === 'pick') return cleanPicked(v, sp).length === 0
        return Object.keys(cleanFills(v, sp)).length < (sp as { parts: unknown[] }).parts.length - 1
      }
      if (q.qtype === 'label') return Object.keys(cleanLabels(v, q.spec as never)).length < ((q.spec as { pins: unknown[] }).pins.length)
      if (q.qtype === 'clockset') return !cleanClock(v, q.spec as never)
      if (q.qtype === 'linedraw') return cleanLinePts(v, (q.spec as { range: number }).range).length < 2
      if (q.qtype === 'angledraw') return !cleanAngle(v)
      if (q.qtype === 'periodic') return cleanElements(v).length === 0
      if (q.qtype === 'geometry') {
        const sp = q.spec as { fields?: { id: string }[]; reasons?: unknown[] }
        const ids = (sp.fields ?? []).map(f => f.id)
        const g = cleanGeometry(v, ids)
        return !g || ids.some(id => !g.fields[id]) || ((sp.reasons?.length ?? 0) > 0 && !g.reason)
      }
      return !cleanActivity(v)
    },
    [choices, texts, json],
  )
  const missing = questions.filter(isBlank)

  function tryHandIn() {
    if (missing.length > 0) {
      setShowMissing(true)
      setConfirming(true)
      document.getElementById(`q-${missing[0]!.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    void submit()
  }

  async function submit() {
    if (busy) return
    setConfirming(false)
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
      setView('summary')
      await load()
      window.scrollTo({ top: 0 })
    } catch {
      setError('Could not hand in the test. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function report(q: Question, kind: 'question' | 'mark', reason: string, note: string): Promise<boolean> {
    const { error: e } = await sb.from('test_flags').insert({
      question_id: q.id,
      answer_id: kind === 'mark' ? results[q.id]?.answerId ?? null : null,
      kind,
      reason,
      note: note || null,
    })
    if (e && e.code !== '23505') return false
    setReported(r => new Set(r).add(`${kind}:${q.id}`))
    setReporting(null)
    return true
  }

  async function practise(topicIds: string[]) {
    if (practising) return
    setPracticing(true)
    setError(null)
    try {
      const { data: { session: auth } } = await sb.auth.getSession()
      if (!auth) return setError('Please sign in again.')
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.access_token}` }
      const made = await fetch('/api/tests/practice', { method: 'POST', headers, body: JSON.stringify({ sessionId, topicIds }) })
      const { sessionId: next } = (await made.json().catch(() => ({}))) as { sessionId?: string }
      if (made.status === 429) return setError('You have built all your tests for today. They come back tomorrow, and Premium gets more.')
      if (!made.ok || !next) return setError("Couldn't set up the practice test. Try again.")
      const gen = await fetch('/api/tests/generate', { method: 'POST', headers, body: JSON.stringify({ sessionId: next }) })
      if (!gen.ok) return setError("Couldn't write the practice questions. Try again.")
      window.location.href = `/whizz/${next}`
    } catch {
      setError("Couldn't set up the practice test. Try again.")
    } finally {
      setPracticing(false)
    }
  }

  // Marks per topic, for the mark screen.
  const breakdown = useMemo(() => {
    return topics
      .map(t => {
        const qs = questions.filter(q => q.topic_id === t.id)
        const by = (type: string) => {
          const list = qs.filter(q => q.qtype === type)
          return { total: list.reduce((n, q) => n + q.marks, 0), got: list.reduce((n, q) => n + (results[q.id]?.marks ?? 0), 0), count: list.length }
        }
        const total = qs.reduce((n, q) => n + q.marks, 0)
        const got = qs.reduce((n, q) => n + (results[q.id]?.marks ?? 0), 0)
        const handsList = qs.filter(q => isInteractive(q.qtype))
        const hands = { total: handsList.reduce((n, q) => n + q.marks, 0), got: handsList.reduce((n, q) => n + (results[q.id]?.marks ?? 0), 0), count: handsList.length }
        return { topic: t, total, got, pct: total ? Math.round((got / total) * 100) : 0, mcq: by('mcq'), short: by('short'), long: by('long'), hands }
      })
      .filter(b => b.total > 0)
  }, [topics, questions, results])

  const total = session?.marks_total ?? 0
  const awarded = session?.marks_awarded ?? 0
  const overall = total ? Math.round((awarded / total) * 100) : 0
  const reveal = useBloomReveal(session?.status === 'marked' ? overall : 0)
  const passed = overall >= 60
  const message = useMemo(() => {
    const list = passed ? PASS_MESSAGES : FAIL_MESSAGES
    return list[Math.floor(Math.random() * list.length)]
  }, [passed])
  const particles = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ id: i, left: (i * 53) % 100, top: (i * 29) % 70, color: CONFETTI_COLORS[i % 4]!, duration: 0.6 + ((i * 7) % 12) / 10, delay: ((i * 5) % 8) / 10, size: 6 + (i % 8) })),
    [],
  )
  const [showConfetti, setShowConfetti] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500)
    return () => clearTimeout(t)
  }, [])

  if (authLoading || state === 'loading') return null
  if (!user) return <p>Sign in to take this test.</p>
  if (state === 'missing' || !session) return <p>That test was not found.</p>

  const marked = session.status === 'marked'
  const waiting = session.status === 'submitted'
  const answeredCount = questions.length - missing.length
  const pctDone = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0
  const allDone = questions.length > 0 && missing.length === 0
  // The warning only applies while something is still unanswered.
  const showConfirm = confirming && missing.length > 0

  const mood: BloomMood = busy || waiting ? 'thinking' : marked ? (overall >= 60 ? 'cheer' : 'talking') : allDone ? 'cheer' : 'idle'
  const quip = busy
    ? 'Marking your answers. Give me a moment…'
    : marked
      ? overall >= 80 ? "Excellent work!" : overall >= 60 ? 'Good progress. A little more practice and you will get there.' : "Everyone starts somewhere. Let's find what to work on."
      : allDone
        ? 'Every question has an answer. Ready when you are!'
        : pctDone === 0
          ? "Take your time. I'll save everything as you go."
          : pctDone < 50
            ? 'Lovely start. Keep going!'
            : `Over halfway. ${missing.length} to go!`

  const topicOf = (q: Question) => topics.find(t => t.id === q.topic_id)?.title
  const paperQuestions = marked && only ? questions.filter(q => q.topic_id === only) : questions

  const header = (
    <div className="tb-head">
      <BloomBuddy mood={mood} size={64} entrance />
      <div className="tb-bubble">{quip}</div>
    </div>
  )

  // ---------- The mark screen ----------
  if (marked && view === 'summary') {
    const weak = breakdown.filter(b => b.pct < 60).map(b => b.topic.id)
    return (
      <div className="tb-stack" style={{ gap: '1.1rem' }}>
        {passed && showConfetti && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
            {particles.map(p => (
              <span key={p.id} className="absolute rounded-full animate-bounce" style={{ left: `${p.left}%`, top: `${p.top}%`, backgroundColor: p.color, width: p.size, height: p.size, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
            ))}
          </div>
        )}

        <div className="rounded p-8 text-center" style={{ background: 'var(--paper-raised)', border: `2px solid ${overall >= 80 ? 'var(--moss)' : overall >= 60 ? 'var(--ochre)' : 'var(--brick)'}40` }}>
          <div className="flex justify-center mb-3">
            <BloomScore percent={overall} passed={passed} reveal={reveal} />
          </div>
          <div className="mb-1">
            <span className="text-6xl tabular-nums" style={{ color: 'var(--ink)', fontFamily: 'var(--h)', fontWeight: 800, letterSpacing: '-0.03em' }}>{reveal.displayPercent}%</span>
          </div>
          <p className="text-sm font-bold mb-4" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{awarded}/{total} marks</p>
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: i < reveal.revealed ? 'var(--rust)' : 'rgba(var(--rust-rgb),0.15)', boxShadow: i < reveal.revealed ? '0 0 6px rgba(var(--rust-rgb),0.6)' : 'none' }} />
            ))}
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded font-black text-sm mb-4 text-white" style={{ background: passed ? 'var(--moss)' : 'var(--brick)' }}>
            {passed ? '✓ Passed!' : '✕ Not passed yet'}
          </div>
          <h2 className="text-2xl mb-1 leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--h)', fontWeight: 800, letterSpacing: '-0.02em' }}>{message}</h2>
          <p className="text-sm" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Your test</p>
        </div>

        <div className="rounded p-5" style={{ background: 'var(--paper-raised)', border: '1px solid rgba(var(--ink-rgb),0.1)' }}>
          <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: 'rgba(var(--ink-rgb),0.1)' }}>
            {[
              { val: String(awarded), label: 'Marks earned', color: 'var(--moss)' },
              { val: String(total - awarded), label: 'Marks missed', color: 'var(--brick)' },
              { val: String(questions.length), label: 'Questions', color: 'rgba(var(--ink-rgb),0.55)' },
            ].map(({ val, label, color }) => (
              <div key={label} className="text-center px-3">
                <div className="text-2xl font-black" style={{ color }}>{val}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tb-stack">
          <h2>How you did, topic by topic</h2>
          <div className="tb-topics">
            {breakdown.map(b => {
              const bd = band(b.pct)
              return (
                <div key={b.topic.id} className="tb-trow">
                  <div className="tb-trow-top">
                    <span className="tb-trow-name">{b.topic.title}</span>
                    <span className="tb-trow-score">{b.got}/{b.total}</span>
                  </div>
                  <div className="tb-meter"><i className={bd} style={{ ['--w' as string]: `${b.pct}%` }} /></div>
                  <div className="tb-chips">
                    <span className={`tb-chip ${bd}`}>{BAND_LABEL[bd]} · {b.pct}%</span>
                    {b.mcq.count > 0 && <span className="tb-chip">Multiple choice {b.mcq.got}/{b.mcq.total}</span>}
                    {b.short.count > 0 && <span className="tb-chip">Short answers {b.short.got}/{b.short.total}</span>}
                    {b.long.count > 0 && <span className="tb-chip">Long answers {b.long.got}/{b.long.total}</span>}
                    {b.hands.count > 0 && <span className="tb-chip">Hands-on {b.hands.got}/{b.hands.total}</span>}
                  </div>
                  <div className="tb-actions">
                    <button type="button" className="tb-link" onClick={() => { setOnly(b.topic.id); setView('paper'); window.scrollTo({ top: 0 }) }}>
                      See my answers for this topic
                    </button>
                    {b.pct < 80 && (
                      <button type="button" className="tb-link" disabled={practising} onClick={() => practise([b.topic.id])}>
                        {practising ? 'Setting up…' : 'Practise this topic'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
        <div className="tb-actions">
          <button type="button" className="tb-btn" onClick={() => { setOnly(null); setView('paper'); window.scrollTo({ top: 0 }) }}>
            Look through my marked paper
          </button>
          {weak.length > 0 && (
            <button type="button" className="tb-btn soft" disabled={practising} onClick={() => practise(weak)}>
              {practising ? 'Setting up…' : `Practise my ${weak.length === 1 ? 'weak topic' : 'weak topics'}`}
            </button>
          )}
        </div>
        <div className="tb-actions">
          <Link className="tb-link" href="/whizz">My Whizz tests</Link>
          <Link className="tb-link" href="/whizz/new">Start another test</Link>
        </div>
        <QuizRating sessionId={sessionId} />
      </div>
    )
  }

  // ---------- The test itself, and the marked paper ----------
  return (
    <div className="tb-stack" style={{ gap: '1.2rem' }}>
      {header}

      {marked ? (
        <div className="tb-actions">
          <button type="button" className="tb-btn soft" onClick={() => { setView('summary'); window.scrollTo({ top: 0 }) }}>Back to my marks</button>
          {only && <button type="button" className="tb-link" onClick={() => setOnly(null)}>Show all topics</button>}
        </div>
      ) : (
        isOpen && (
          <div className="tb-progress">
            <div className="tb-progress-label"><span>{answeredCount} of {questions.length} answered</span><span>{pctDone}%</span></div>
            <div className={`tb-bar ${allDone ? 'done' : ''}`}><i style={{ width: `${pctDone}%` }} /></div>
          </div>
        )
      )}

      {waiting && (
        <div className="tb-confirm">
          <p>Your test is handed in, but the marking did not finish. Tap the button to try again.</p>
          <div><button type="button" className="tb-btn" onClick={submit} disabled={busy}>{busy ? 'Marking…' : 'Mark my test'}</button></div>
        </div>
      )}

      {paperQuestions.map((q, idx) => {
        const key = keys[q.id]
        const result = results[q.id]
        const memo = points[q.id] ?? []
        const blank = isBlank(q)
        const prevTopic = idx > 0 ? paperQuestions[idx - 1]!.topic_id : undefined
        const text = texts[q.id] ?? ''
        const reportKind: 'question' | 'mark' = marked && q.qtype !== 'mcq' ? 'mark' : 'question'
        return (
          <div key={q.id} className="tb-stack" style={{ gap: '0.4rem' }}>
            {(idx === 0 || q.topic_id !== prevTopic) && topicOf(q) && <div className="tb-topic-label">{topicOf(q)}</div>}
            <div id={`q-${q.id}`} className={`tb-card ${!marked && !blank ? 'answered' : ''} ${showMissing && blank && isOpen ? 'missing' : ''}`} style={{ ['--n' as string]: Math.min(idx, 10) }}>
              <div className="tb-qhead">
                <span className="tb-num">{q.position}</span>
                <span className="tb-qtext">{q.question_text}</span>
                <span className="tb-marks">{marked && result ? `${result.marks ?? 0}/${q.marks}` : `${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}`}</span>
              </div>

              {(() => {
                const fig = (q.spec as { figure?: string } | null)?.figure
                // eslint-disable-next-line @next/next/no-img-element
                return fig ? <div className="tb-figure"><img src={fig} alt="Diagram for this question" /></div> : null
              })()}
              {q.qtype === 'mcq' ? (
                (q.options ?? []).map(o => {
                  const picked = choices[q.id] === o.key
                  const isRight = marked && (key?.mcq_correct?.split(',') ?? []).includes(o.key)
                  const isWrongPick = marked && picked && !isRight
                  return (
                    <label key={o.key} className={`tb-opt ${picked && !marked ? 'picked' : ''} ${isRight ? 'right' : ''} ${isWrongPick ? 'wrong' : ''}`}>
                      <input type="radio" name={q.id} checked={picked} disabled={!isOpen} onChange={() => choose(q.id, o.key)} />
                      <span><span className="tb-letter">{o.key}.</span> {o.text}</span>
                      {isRight && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      {isWrongPick && <span style={{ marginLeft: 'auto' }}>✗ your answer</span>}
                    </label>
                  )
                })
              ) : isInteractive(q.qtype) ? (
                (() => {
                  const locked = !isOpen
                  const spec = (q.spec ?? {}) as Record<string, unknown>
                  const value = json[q.id]
                  if (q.qtype === 'symmetry') return <SymmetryWidget shape={spec.shape as never} value={value} onChange={v => setAnswer(q.id, v)} locked={locked} reveal={marked} />
                  if (q.qtype === 'bond') return <BondWidget compoundId={spec.compound as string} value={value} onChange={v => setAnswer(q.id, v)} locked={locked} reveal={marked} />
                  if (q.qtype === 'sort') {
                    const ans = (keys[q.id]?.answer_spec as { answer?: SortAnswer } | undefined)?.answer
                    return <SortWidget spec={spec as unknown as SortSpec} value={value} onChange={v => setAnswer(q.id, v)} locked={locked} answer={marked ? ans : undefined} />
                  }
                  if (['plot', 'shade', 'order', 'match', 'pick', 'fill'].includes(q.qtype)) {
                    const common = { value, onChange: (v: unknown) => setAnswer(q.id, v), locked, answer: marked ? ((keys[q.id]?.answer_spec as Record<string, unknown>) ?? {}) : undefined }
                    if (q.qtype === 'plot') return <PlotWidget spec={spec as never} {...common} />
                    if (q.qtype === 'shade') return <ShadeWidget spec={spec as never} {...common} />
                    if (q.qtype === 'order') return <OrderWidget spec={spec as never} {...common} />
                    if (q.qtype === 'match') return <MatchWidget spec={spec as never} {...common} />
                    if (q.qtype === 'pick') return <PickWidget spec={spec as never} {...common} />
                    return <FillWidget spec={spec as never} {...common} />
                  }
                  if (['label', 'clockset', 'linedraw', 'angledraw', 'periodic'].includes(q.qtype)) {
                    const common = { value, onChange: (v: unknown) => setAnswer(q.id, v), locked, answer: marked ? ((keys[q.id]?.answer_spec as Record<string, unknown>) ?? {}) : undefined }
                    if (q.qtype === 'label') return <LabelWidget spec={spec as never} {...common} />
                    if (q.qtype === 'clockset') return <ClockWidget spec={spec as never} {...common} />
                    if (q.qtype === 'linedraw') return <LineWidget spec={spec as never} {...common} />
                    if (q.qtype === 'angledraw') return <AngleWidget spec={spec as never} {...common} />
                    return <PeriodicWidget spec={spec as never} {...common} />
                  }
                  if (q.qtype === 'geometry') {
                    return (
                      <GeometryWidget
                        spec={spec as never}
                        value={value}
                        onChange={v => setAnswer(q.id, v)}
                        locked={locked}
                        answer={marked ? (keys[q.id]?.answer_spec as never) ?? {} : undefined}
                      />
                    )
                  }
                  if (q.qtype === 'maplocate' || q.qtype === 'mapline') {
                    const key = keys[q.id]?.answer_spec as { targets?: string[]; names?: Record<string, string>; from?: string; to?: string } | undefined
                    return (
                      <MapWidget
                        kind={q.qtype}
                        map={spec.map as never}
                        targets={spec.targets as never}
                        dots={spec.dots as never}
                        value={value}
                        onChange={v => setAnswer(q.id, v)}
                        locked={locked}
                        answer={marked ? key ?? {} : undefined}
                      />
                    )
                  }
                  // maths activity: the tool reports how it went
                  const done = cleanActivity(value)
                  const tool = (keys[q.id]?.answer_spec as { tool?: string } | undefined)?.tool
                  return (
                    <div className="tb-widget">
                      {isOpen && !done && (
                        <div className="tb-frame">
                          <ActivityFrame
                            activity={spec.ref as string}
                            showDone={false}
                            onComplete={d => setAnswer(q.id, { done: true, correct: d.correct, total: d.total, mistakes: d.mistakes, watch: d.watch, solved: d.solved !== undefined && d.solved !== false && d.solved !== '' })}
                          />
                        </div>
                      )}
                      {done && <p className="tb-muted">{marked && tool === 'rounding' && done.total ? `You got ${done.correct} of ${done.total} right.` : 'Finished. Your answer is saved.'}</p>}
                      {marked && !done && <p className="tb-muted">You didn&apos;t finish this activity.</p>}
                    </div>
                  )
                })()
              ) : marked ? (
                text.trim() ? (skipsWritingTips(session.subject) ? <div className="tb-page">{text.trim()}</div> : <WordsFallOff text={text} />) : <p className="tb-muted">You didn&apos;t answer this one.</p>
              ) : (
                <>
                  <textarea
                    className="tb-text"
                    value={text}
                    disabled={!isOpen}
                    rows={q.qtype === 'long' ? 8 : 3}
                    maxLength={MAX_ANSWER_CHARS[q.qtype as WrittenType] ?? 1500}
                    placeholder="Type your answer here"
                    onChange={e => type(q.id, e.target.value)}
                    onBlur={() => timers.current[q.id] && flushText(q.id)}
                  />
                  {q.qtype === 'long' && <div className="tb-count">{text.length} / {MAX_ANSWER_CHARS.long}</div>}
                </>
              )}

              {marked && q.qtype === 'mcq' && key?.explanation && <div className="tb-expl">{key.explanation}</div>}

              {marked && q.qtype !== 'mcq' && result && (
                <div className="tb-mp">
                  {memo.map(p => {
                    const fb = result.points.find(x => x.pointId === p.id)
                    return (
                      <div key={p.id} style={{ display: 'block' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span className={`tb-tick ${fb?.awarded ? 'y' : 'n'}`}>{fb?.awarded ? '✓' : '✗'}</span>
                          <span>{p.point_text}</span>
                        </div>
                        {fb?.reason && <p className="tb-why">{fb.reason}</p>}
                      </div>
                    )
                  })}
                </div>
              )}

              {marked && q.qtype !== 'mcq' && text.trim() && !skipsWritingTips(session.subject) && (() => {
                const b = checkBasics(text)
                const extra: string[] = []
                if (b.lowerAfterStop > 0) extra.push('A new sentence starts with a capital letter, even in the middle of your answer.')
                if (b.lonelyI > 0) extra.push('When "I" is on its own it always gets a capital letter.')
                const tips = result?.tips ?? []
                const clean = b.isSentence && !b.startsLower && !b.missingEnd && extra.length === 0
                if (tips.length === 0 && extra.length === 0 && !clean) return null
                return (
                  <div className="tb-tips">
                    <h3>Writing tips (these don&apos;t change your marks)</h3>
                    {clean && tips.length === 0 && <p className="tb-tip">Capital letter at the start, full stop at the end. Every word is safe on the page!</p>}
                    {extra.map(e => <p key={e} className="tb-tip">{e}</p>)}
                    {tips.map(t => (
                      <p key={t.said + t.better} className="tb-tip"><s>{t.said}</s> → <b>{t.better}</b>. {t.why}</p>
                    ))}
                  </div>
                )
              })()}

              {marked && <AskAboutQuestion questionId={q.id} />}

              {(marked || isOpen) && (
                <div>
                  {reported.has(`${reportKind}:${q.id}`) ? (
                    <span className="tb-muted">Thanks, reported. We&apos;ll take a look.</span>
                  ) : reporting === `${reportKind}:${q.id}` ? (
                    <ReportBox kind={reportKind} onSend={(r, n) => report(q, reportKind, r, n)} onCancel={() => setReporting(null)} />
                  ) : (
                    <button type="button" className="tb-link" onClick={() => setReporting(`${reportKind}:${q.id}`)}>
                      {reportKind === 'mark' ? 'Report this mark' : 'Report this question'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {error && <p role="alert">{error}</p>}

      {isOpen && (
        <div className="tb-stack">
          {showConfirm && (
            <div className="tb-confirm" role="alert">
              <strong style={{ fontFamily: 'var(--h)' }}>
                {missing.length === 1 ? '1 question has no answer.' : `${missing.length} questions have no answer.`}
              </strong>
              <p>They&apos;re marked in red above. Unanswered questions get no marks. Do you want to go back or hand in anyway?</p>
              <div className="tb-actions">
                <button type="button" className="tb-btn" onClick={() => setConfirming(false)}>Go back and answer</button>
                <button type="button" className="tb-btn soft" onClick={submit} disabled={busy}>Hand in anyway</button>
              </div>
            </div>
          )}
          {!showConfirm && (
            <div className="tb-actions">
              <button type="button" className="tb-btn" onClick={tryHandIn} disabled={busy}>
                {busy ? 'Marking your answers… this can take a little while' : 'Hand in test'}
              </button>
              {missing.length > 0 && <span className="tb-muted">{missing.length} not answered yet</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
