'use client'

import { useState } from 'react'
import { sb } from '@/lib/supabase'

// A small chat under one question on the marked paper. It uses the same
// daily allowance as the tutor chat, so the limit is shown after each reply.
export default function AskAboutQuestion({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [turns, setTurns] = useState<{ q: string; a: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [left, setLeft] = useState<number | null>(null)

  async function send() {
    const message = text.trim()
    if (!message || busy) return
    setBusy(true); setNote('')
    try {
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token
      if (!token) { setNote('Please sign in again.'); return }
      const res = await fetch('/api/tests/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId, message, history: turns }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 429) { setNote(`You've used today's questions (${j.limit ?? ''}). They come back tomorrow, and Premium gets more.`); return }
      if (!res.ok || typeof j.reply !== 'string') { setNote('Something went wrong. Try again in a moment.'); return }
      setTurns(t => [...t, { q: message, a: j.reply }])
      setLeft(typeof j.remaining === 'number' ? j.remaining : null)
      setText('')
    } catch {
      setNote('Something went wrong. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return <button type="button" className="tb-link" onClick={() => setOpen(true)}>Ask about this question</button>
  return (
    <div className="tb-ask">
      {turns.map((t, i) => (
        <div key={i}>
          <p className="tb-ask-q">{t.q}</p>
          <p className="tb-ask-a">{t.a}</p>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input className="tb-text" style={{ minHeight: 0, flex: 1 }} value={text} maxLength={800} placeholder={turns.length ? 'Ask a follow-up' : 'Why did I lose marks here?'} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} disabled={busy} />
        <button type="button" className="tb-btn" onClick={send} disabled={busy || !text.trim()}>{busy ? 'Thinking…' : 'Ask'}</button>
      </div>
      {note && <p className="tb-muted">{note}</p>}
      {left !== null && <p className="tb-muted">{left} {left === 1 ? 'question' : 'questions'} left today.</p>}
    </div>
  )
}
