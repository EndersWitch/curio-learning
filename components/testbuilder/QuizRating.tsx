'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'

// "How was your quiz?" Five stars and an optional comment. Read by the
// learning loop, so honest comments help the next quiz be better.
export default function QuizRating({ sessionId }: { sessionId: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    sb.from('test_feedback').select('rating').eq('session_id', sessionId).maybeSingle().then(({ data }) => { if (data) { setRating(data.rating as number); setDone(true) } })
  }, [sessionId])

  async function send() {
    if (!rating || busy) return
    setBusy(true); setMsg('')
    const { error } = await sb.from('test_feedback').insert({ session_id: sessionId, rating, comment: comment.trim().slice(0, 1000) || null })
    setBusy(false)
    if (error) return setMsg(error.code === '23505' ? 'Thanks, you already rated this one.' : 'Could not send that. Try again.')
    setDone(true)
  }

  if (done) return <div className="tb-card"><p style={{ margin: 0 }}>Thanks for telling us how your quiz went. It helps the next one be better.</p></div>
  const labels = ['', 'Not good', 'Not great', 'Okay', 'Good', 'Really good']
  return (
    <div className="tb-card tb-stack" style={{ gap: '0.6rem' }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--h)' }}>How was your quiz?</h3>
      <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => setRating(n)}
            style={{ fontSize: '1.8rem', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: n <= rating ? 'var(--ochre, #c98a00)' : 'var(--ink15)' }}>★</button>
        ))}
        {rating > 0 && <span className="tb-muted">{labels[rating]}</span>}
      </div>
      {rating > 0 && (
        <>
          <textarea className="tb-text" rows={3} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder={rating <= 3 ? 'What was wrong or confusing? Name the question if you can.' : 'Anything we could do better? (optional)'} />
          <div><button type="button" className="tb-btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send'}</button></div>
        </>
      )}
      {msg && <p className="tb-muted">{msg}</p>}
    </div>
  )
}
