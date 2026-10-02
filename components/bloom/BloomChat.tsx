'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import BloomBuddy, { type BloomMood } from '@/components/bloom/BloomBuddy'
import BloomText from '@/components/bloom/BloomText'
import {
  BLOOM_GRADES,
  DAILY_LIMITS,
  MAX_QUESTION_CHARS,
  MAX_TURNS_PER_CHAT,
  type BloomErrorCode,
  type BloomEvent,
  type BloomSession,
  type BloomTier,
} from '@/lib/bloom/shared'

interface Turn {
  key: number
  question: string
  reply: string
  status: 'waiting' | 'streaming' | 'done' | 'failed'
  note?: string
}

type PageState = 'loading' | 'signin' | 'closed' | 'setup' | 'error' | 'ready'

// Starters per CAPS phase: something to explain, a specific problem (which
// should get coaching, not an answer) and a curious one, so a quick tap-test
// covers both of Bloom's modes.
const STARTERS = {
  intermediate: ['What is photosynthesis?', 'Help me with 3/4 + 1/8', 'Why do we have day and night?'],
  senior: ['What is an ecosystem?', 'How do I solve 3x + 5 = 20?', "What's the difference between a simile and a metaphor?"],
  fet: [
    'Explain photosynthesis',
    '1.2 Calculate the gradient of the line through (2; 3) and (5; 9). (3)',
    "How do I answer a 4-mark 'explain' question?",
  ],
}

function startersFor(grade: number) {
  if (grade <= 6) return STARTERS.intermediate
  if (grade <= 9) return STARTERS.senior
  return STARTERS.fet
}

function meterText(tier: BloomTier, remaining: number, limit: number) {
  if (tier === 'tester') return `Tester · ${remaining} of ${limit} left today`
  if (tier === 'free') return `${remaining} of ${limit} free questions left today`
  return `${remaining} questions left today`
}

let nextKey = 0

async function authHeaders(): Promise<Record<string, string> | null> {
  const { data: { session } } = await sb.auth.getSession()
  return session ? { Authorization: `Bearer ${session.access_token}` } : null
}

async function errorCode(res: Response): Promise<BloomErrorCode | undefined> {
  const body = await res.json().catch(() => null)
  return body?.error
}

export default function BloomChat() {
  const { user, loading: authLoading } = useAuth()
  const [page, setPage] = useState<PageState>('loading')
  const [tier, setTier] = useState<BloomTier>('free')
  const [limit, setLimit] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [grade, setGrade] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [chatFull, setChatFull] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [cheering, setCheering] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true)
  const cheerTimer = useRef<number>()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPage('signin')
      return
    }
    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  // Follow the reply as it streams in, unless the learner scrolled up to reread.
  // (The welcome screen has no turns and should start from its top.)
  useEffect(() => {
    const log = logRef.current
    if (log && turns.length && stickToBottom.current) log.scrollTop = log.scrollHeight
  }, [turns])

  // Grow the question box with its text (CSS caps the height).
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  useEffect(() => () => window.clearTimeout(cheerTimer.current), [])

  async function loadSession() {
    setPage('loading')
    try {
      const headers = await authHeaders()
      if (!headers) return setPage('signin')
      const res = await fetch('/api/bloom/session', { headers, cache: 'no-store' })
      if (!res.ok) {
        const code = await errorCode(res)
        return setPage(code === 'signin' || code === 'closed' || code === 'setup' ? code : 'error')
      }
      const session: BloomSession = await res.json()
      setTier(session.tier)
      setLimit(session.limit)
      setRemaining(session.remaining)
      setGrade(session.conversation?.grade ?? session.grade)
      setConversationId(session.conversation?.id ?? null)
      setTurns(
        session.conversation?.turns.map(t => ({ key: ++nextKey, question: t.question, reply: t.reply, status: 'done' as const })) ?? [],
      )
      setChatFull(false)
      setPage('ready')
    } catch {
      setPage('error')
    }
  }

  const full = chatFull || turns.length >= MAX_TURNS_PER_CHAT
  const outOfQuestions = remaining <= 0
  const canAsk = grade !== null && !outOfQuestions && !full

  async function ask(raw: string) {
    const question = raw.trim().slice(0, MAX_QUESTION_CHARS)
    if (!question || busy || !canAsk) return

    const key = ++nextKey
    const update = (patch: (turn: Turn) => Partial<Turn>) =>
      setTurns(ts => ts.map(t => (t.key === key ? { ...t, ...patch(t) } : t)))

    setTurns(ts => [...ts, { key, question, reply: '', status: 'waiting' }])
    setInput('')
    setBusy(true)
    stickToBottom.current = true

    try {
      const headers = await authHeaders()
      if (!headers) return setPage('signin')
      const res = await fetch('/api/bloom/chat', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, grade, message: question }),
      })

      if (!res.ok || !res.body) {
        const code = await errorCode(res)
        if (code === 'signin' || code === 'closed' || code === 'setup') return setPage(code)
        if (code === 'limit') {
          setRemaining(0)
          return update(() => ({ status: 'failed', note: "You've used all of today's questions." }))
        }
        if (code === 'full') {
          setChatFull(true)
          return update(() => ({ status: 'failed', note: 'This chat is full. Start a new one to keep going.' }))
        }
        return update(() => ({ status: 'failed', note: "Bloom couldn't answer that one. Try again." }))
      }

      // The reply streams in as one JSON event per line (see BloomEvent).
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffered = ''
      let finished = false
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffered += decoder.decode(value, { stream: true })
        let newline: number
        while ((newline = buffered.indexOf('\n')) !== -1) {
          const line = buffered.slice(0, newline).trim()
          buffered = buffered.slice(newline + 1)
          if (!line) continue
          const event = JSON.parse(line) as BloomEvent
          switch (event.type) {
            case 'meta':
              setConversationId(event.conversationId)
              setRemaining(event.remaining)
              break
            case 'cheer':
              celebrate()
              break
            case 'text':
              update(t => ({ status: 'streaming', reply: t.reply + event.text }))
              break
            case 'replace':
              update(() => ({ reply: event.text }))
              break
            case 'done':
              finished = true
              update(() => ({ status: 'done', note: event.truncated ? 'Bloom ran out of room there. Ask it to carry on.' : undefined }))
              break
            case 'error':
              finished = true
              update(() => ({ status: 'failed', note: event.message }))
              break
          }
        }
      }
      if (!finished) update(() => ({ status: 'failed', note: 'The connection dropped. Try asking again.' }))
    } catch {
      update(() => ({ status: 'failed', note: "Couldn't reach Bloom. Check your connection and try again." }))
    } finally {
      setBusy(false)
    }
  }

  function celebrate() {
    setCheering(true)
    window.clearTimeout(cheerTimer.current)
    cheerTimer.current = window.setTimeout(() => setCheering(false), 1800)
  }

  // Failed turns were never saved, so retrying just removes the failed one and asks again.
  function retry(turn: Turn) {
    setTurns(ts => ts.filter(t => t.key !== turn.key))
    ask(turn.question)
  }

  function newChat() {
    if (busy) return
    setConversationId(null)
    setTurns([])
    setChatFull(false)
    inputRef.current?.focus()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    ask(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      ask(input)
    }
  }

  function onLogScroll() {
    const log = logRef.current
    if (log) stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80
  }

  if (page !== 'ready') return <BloomStateScreen page={page} onRetry={loadSession} />

  const isEmpty = turns.length === 0
  const last = turns[turns.length - 1]
  const mood: BloomMood = cheering
    ? 'cheer'
    : busy
      ? last?.status === 'streaming' ? 'talking' : 'thinking'
      : input.trim() ? 'listening' : 'idle'

  return (
    <div className="bloom-app">
      <header className="bloom-head">
        {/* While the welcome screen shows its big Bloom, the header one stays still. */}
        <BloomBuddy mood={isEmpty ? 'idle' : mood} still={isEmpty} size={52} />
        <div>
          <div className="bloom-head-name">Bloom</div>
          <div className="bloom-head-sub">Your study buddy</div>
        </div>
        <div className="bloom-head-tools">
          {grade !== null && (
            <label className="bloom-grade">
              <span>Grade</span>
              <select value={grade} onChange={e => setGrade(Number(e.target.value))} disabled={busy}>
                {BLOOM_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          )}
          {!isEmpty && (
            <button type="button" className="bloom-tool-btn" onClick={newChat} disabled={busy}>New chat</button>
          )}
        </div>
      </header>

      <div className="bloom-log" ref={logRef} onScroll={onLogScroll} role="log" aria-live="polite" aria-label="Chat with Bloom">
        {isEmpty ? (
          <div className="bloom-empty">
            <BloomBuddy mood={mood} size={124} entrance />
            <h1 className="bloom-empty-h">Hi, I&apos;m <em>Bloom.</em></h1>
            <p className="bloom-empty-p">
              Ask me anything from your schoolwork. If it&apos;s a test or homework question, I&apos;ll help you work it
              out yourself, one step at a time.
            </p>
            {grade === null ? (
              <>
                <div className="bloom-empty-label">First, which grade are you in?</div>
                <div className="bloom-chips">
                  {BLOOM_GRADES.map(g => (
                    <button key={g} type="button" className="bloom-chip grade" onClick={() => setGrade(g)}>Grade {g}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="bloom-empty-label">Try asking</div>
                <div className="bloom-chips">
                  {startersFor(grade).map(q => (
                    <button key={q} type="button" className="bloom-chip" onClick={() => ask(q)} disabled={!canAsk || busy}>{q}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          turns.map(turn => (
            <div key={turn.key} className="bloom-turn">
              <div className="bloom-q">
                <div className="bloom-q-bubble">{turn.question}</div>
              </div>
              <div className="bloom-a">
                <BloomBuddy size={30} still />
                <div className="bloom-a-body">
                  {turn.reply ? (
                    <div className="bloom-a-card">
                      <BloomText text={turn.reply} />
                      {turn.status === 'streaming' && <span className="bloom-caret" aria-hidden="true" />}
                    </div>
                  ) : turn.status === 'waiting' ? (
                    <div className="bloom-a-card bloom-a-wait" aria-label="Bloom is thinking">
                      <span className="bloom-dots"><i /><i /><i /></span>
                    </div>
                  ) : null}
                  {turn.note && (
                    <div className={`bloom-note${turn.status === 'failed' ? ' bad' : ''}`}>
                      <span>{turn.note}</span>
                      {turn.status === 'failed' && canAsk && !busy && (
                        <button type="button" className="bloom-retry" onClick={() => retry(turn)}>Try again</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="bloom-composer" onSubmit={onSubmit}>
        {outOfQuestions ? (
          <div className="bloom-banner">
            {tier === 'free' ? (
              <>That&apos;s your {limit} free questions for today. Bloom will be back tomorrow, or <a href="/subscription">go Premium</a> for {DAILY_LIMITS.premium} a day.</>
            ) : (
              <>That&apos;s all your questions for today. Bloom will be ready again tomorrow 🌱</>
            )}
          </div>
        ) : full ? (
          <div className="bloom-banner">
            This chat is getting long. <button type="button" onClick={newChat}>Start a new one</button> so Bloom stays quick.
          </div>
        ) : null}
        <div className="bloom-input-row">
          <textarea
            ref={inputRef}
            className="bloom-input"
            rows={1}
            value={input}
            maxLength={MAX_QUESTION_CHARS}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={grade === null ? 'Pick your grade first…' : 'Ask Bloom about your schoolwork…'}
            disabled={!canAsk}
            enterKeyHint="send"
            aria-label="Your question for Bloom"
          />
          <button type="submit" className="bloom-send" disabled={!canAsk || busy || !input.trim()}>Ask</button>
        </div>
        <div className="bloom-meter">
          <span>{meterText(tier, remaining, limit)}</span>
          <span className="bloom-meter-hint">Bloom can make mistakes, so check with your textbook or teacher.</span>
        </div>
      </form>
    </div>
  )
}

function BloomStateScreen({ page, onRetry }: { page: Exclude<PageState, 'ready'>; onRetry: () => void }) {
  if (page === 'loading') {
    return (
      <div className="bloom-state">
        <BloomBuddy mood="thinking" size={92} />
        <p>Waking Bloom up…</p>
      </div>
    )
  }
  if (page === 'signin') {
    return (
      <div className="bloom-state">
        <BloomBuddy size={110} entrance />
        <h1>Sign in to chat with <em>Bloom.</em></h1>
        <p>Bloom is Curio&apos;s study buddy. Sign in and ask it anything from your schoolwork.</p>
        <a href="/login" className="btn-primary">Sign in</a>
      </div>
    )
  }
  if (page === 'closed') {
    return (
      <div className="bloom-state">
        <BloomBuddy size={110} entrance />
        <h1>Bloom is <em>still growing.</em></h1>
        <p>Curio&apos;s AI study buddy is being tested right now. It&apos;s coming soon.</p>
        <a href="/deeplearn" className="btn-soft">What&apos;s Bloom?</a>
      </div>
    )
  }
  if (page === 'setup') {
    return (
      <div className="bloom-state">
        <BloomBuddy mood="thinking" size={92} />
        <h1>Bloom isn&apos;t set up <em>here yet.</em></h1>
        <p>This server is missing Bloom&apos;s Anthropic API key or its database tables.</p>
      </div>
    )
  }
  return (
    <div className="bloom-state">
      <BloomBuddy size={92} />
      <h1>Bloom couldn&apos;t <em>load.</em></h1>
      <p>Something went wrong on our side. Give it another go.</p>
      <button type="button" className="btn-soft" onClick={onRetry}>Try again</button>
    </div>
  )
}
