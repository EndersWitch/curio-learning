'use client'

import { useCallback, useState } from 'react'

type Entry = { id: string; kind: string; title: string; body?: string; subjects: string[]; grade_min: number; grade_max: number; source_url?: string | null; origin?: string; note?: string | null; verified_at?: string | null }
type Flag = { id: string; kind: string; reason: string | null; note: string | null; triage: string | null; created_at: string }

const box: React.CSSProperties = { border: '2px solid #222', padding: '0.8rem', margin: '0 0 0.8rem', background: '#fff', color: '#222' }
const btn: React.CSSProperties = { border: '2px solid #222', background: '#fff', padding: '0.35rem 0.7rem', fontWeight: 700, cursor: 'pointer', marginRight: '0.4rem' }

export default function KnowledgeAdmin() {
  const [pw, setPw] = useState('')
  const [proposed, setProposed] = useState<Entry[]>([])
  const [approved, setApproved] = useState<Entry[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [msg, setMsg] = useState('')
  const [def, setDef] = useState({ subject: '', grade: '', term: '', definition: '', source: '' })
  const [form, setForm] = useState({ kind: 'term', title: '', body: '', subjects: '', gradeMin: '1', gradeMax: '12', sourceUrl: '' })

  const call = useCallback(async (method: 'GET' | 'POST', body?: unknown) => {
    const res = await fetch('/api/admin/knowledge', { method, headers: { 'x-admin-password': pw, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    return { ok: res.ok, data: await res.json().catch(() => ({})) }
  }, [pw])

  const load = useCallback(async () => {
    const { ok, data } = await call('GET')
    if (!ok) return setMsg('Wrong password or the server is not set up.')
    setProposed(data.proposed ?? []); setApproved(data.approved ?? []); setFlags(data.flags ?? []); setMsg('')
  }, [call])

  const act = async (action: string, extra: object = {}) => {
    setMsg('Working…')
    const { ok, data } = await call('POST', { action, ...extra })
    setMsg(ok ? (action === 'run' ? `Done: ${JSON.stringify(data)}` : 'Saved.') : data.error ?? 'Failed.')
    await load()
  }

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '1.2rem', fontFamily: 'Arial, sans-serif', color: '#222', background: '#f7f3ea', minHeight: '100vh' }}>
      <h1 style={{ margin: '0 0 0.8rem' }}>Test builder: knowledge review</h1>
      <div style={box}>
        <input type="password" placeholder="Admin password" value={pw} onChange={e => setPw(e.target.value)} style={{ padding: '0.4rem', border: '2px solid #222', marginRight: '0.5rem' }} />
        <button style={btn} onClick={load}>Load</button>
        <button style={btn} onClick={() => act('run')}>Run learning now</button>
        {msg && <p style={{ margin: '0.5rem 0 0' }}>{msg}</p>}
      </div>

      <h2>Proposed lessons ({proposed.length})</h2>
      {proposed.map(p => (
        <div key={p.id} style={box}>
          <strong>[{p.kind}] {p.title}</strong> <small>({p.origin}, grades {p.grade_min} to {p.grade_max}, {p.subjects.join(', ')})</small>
          <p style={{ margin: '0.4rem 0' }}>{p.body}</p>
          {p.note && <p style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>Why: {p.note}</p>}
          {p.source_url && <p style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>Source: <a href={p.source_url} target="_blank" rel="noreferrer">{p.source_url}</a></p>}
          <button style={btn} onClick={() => act('approve', { id: p.id })}>Approve</button>
          <button style={btn} onClick={() => act('reject', { id: p.id })}>Reject</button>
        </div>
      ))}

      <h2>Open learner reports ({flags.length})</h2>
      {flags.map(fl => (
        <div key={fl.id} style={box}>
          <strong>{fl.kind}</strong>: {fl.reason} {fl.note ? `· ${fl.note}` : ''}
          <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>{fl.triage ? `Investigation: ${fl.triage}` : 'Not investigated yet.'}</p>
          <button style={btn} onClick={() => act('flag', { flagId: fl.id, flagStatus: 'accepted' })}>Report was right</button>
          <button style={btn} onClick={() => act('flag', { flagId: fl.id, flagStatus: 'rejected' })}>Report was wrong</button>
        </div>
      ))}

      <h2>Add a lesson yourself</h2>
      <div style={box}>
        <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} style={{ padding: '0.3rem', marginBottom: '0.4rem' }}>
          <option value="term">term</option><option value="rule">rule</option><option value="fact">current fact</option><option value="avoid">does not exist (never use)</option>
        </select>
        {(['title', 'body', 'subjects', 'sourceUrl'] as const).map(k => (
          <input key={k} placeholder={k === 'subjects' ? 'subjects, comma separated (e.g. accounting, ems)' : k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={{ display: 'block', width: '100%', padding: '0.4rem', border: '2px solid #222', marginBottom: '0.4rem', boxSizing: 'border-box' }} />
        ))}
        <input placeholder="grade min" value={form.gradeMin} onChange={e => setForm({ ...form, gradeMin: e.target.value })} style={{ width: 90, padding: '0.4rem', border: '2px solid #222', marginRight: '0.4rem' }} />
        <input placeholder="grade max" value={form.gradeMax} onChange={e => setForm({ ...form, gradeMax: e.target.value })} style={{ width: 90, padding: '0.4rem', border: '2px solid #222', marginRight: '0.4rem' }} />
        <button style={btn} onClick={() => act('add', { entry: form })}>Add (goes live)</button>
      </div>

      <h2>Add an exact definition</h2>
      <div style={box}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>For wording that must be learnt exactly (for example a physical science law). Questions that ask for it will use this wording in the memo.</p>
        {(['subject', 'grade', 'term', 'definition', 'source'] as const).map(k => (
          <input key={k} placeholder={k} value={def[k]} onChange={e => setDef({ ...def, [k]: e.target.value })} style={{ display: 'block', width: '100%', padding: '0.4rem', border: '2px solid #222', marginBottom: '0.4rem', boxSizing: 'border-box' }} />
        ))}
        <button style={btn} onClick={() => act('definition', { entry: def })}>Save definition</button>
      </div>

      <h2>Live reference ({approved.length})</h2>
      {approved.map(a => <div key={a.id} style={{ ...box, padding: '0.4rem 0.6rem' }}>[{a.kind}] {a.title} <small>· grades {a.grade_min}-{a.grade_max} · {a.subjects.join(', ')} · checked {a.verified_at?.slice(0, 10) ?? 'never'}</small></div>)}
    </main>
  )
}
