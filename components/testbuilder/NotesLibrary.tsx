'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'

export interface Note { id: string; title: string }

// The learner's saved notes. Ticked notes are used as source material when
// the test is built. Text and markdown files, or pasted text.
export default function NotesLibrary({ picked, onPick }: { picked: string[]; onPick: (ids: string[]) => void }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const { data } = await sb.from('test_notes').select('id, title').order('created_at', { ascending: false })
    setNotes((data ?? []) as Note[])
  }
  useEffect(() => { load() }, [])

  async function onFile(f: File | undefined) {
    if (!f) return
    if (!/\.(txt|md)$/i.test(f.name) && !f.type.startsWith('text/')) { setMsg('Please choose a .txt or .md file, or paste your notes.'); return }
    if (f.size > 200_000) { setMsg('That file is too big. Paste the part you need.'); return }
    setBody((await f.text()).slice(0, 20000))
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 120))
    setMsg('')
  }

  async function save() {
    const t = title.trim(), b = body.trim()
    if (!t) return setMsg('Give the notes a name.')
    if (b.length < 20) return setMsg('Add a bit more text.')
    const { data, error } = await sb.from('test_notes').insert({ title: t.slice(0, 120), body: b.slice(0, 20000) }).select('id').single()
    if (error || !data) return setMsg('Could not save. You can keep up to 20 notes, so delete one first if you are at the limit.')
    setTitle(''); setBody(''); setAdding(false); setMsg('')
    await load()
    onPick([...picked, data.id as string].slice(0, 5))
  }

  async function remove(id: string) {
    await sb.from('test_notes').delete().eq('id', id)
    onPick(picked.filter(p => p !== id))
    load()
  }

  const toggle = (id: string) => onPick(picked.includes(id) ? picked.filter(p => p !== id) : picked.length >= 5 ? picked : [...picked, id])

  return (
    <div className="tb-field">
      <span className="tb-label">My notes (optional)</span>
      {notes.length === 0 && !adding && <p className="tb-muted">Add your class notes and the test will be built from what you were taught.</p>}
      {notes.map(n => (
        <div key={n.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" checked={picked.includes(n.id)} onChange={() => toggle(n.id)} />
            <span>{n.title}</span>
          </label>
          <button type="button" className="tb-link" onClick={() => remove(n.id)}>Delete</button>
        </div>
      ))}
      {adding ? (
        <div className="tb-stack" style={{ gap: '0.5rem' }}>
          <input className="tb-text" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Name, e.g. Term 3 life sciences" />
          <textarea className="tb-text" rows={7} value={body} onChange={e => setBody(e.target.value)} maxLength={20000} placeholder="Paste your notes here" />
          <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={e => onFile(e.target.files?.[0])} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="tb-btn" onClick={save}>Save notes</button>
            <button type="button" className="tb-link" onClick={() => { setAdding(false); setMsg('') }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className="tb-link" onClick={() => setAdding(true)}>Add notes</button>
      )}
      {msg && <p className="tb-muted">{msg}</p>}
    </div>
  )
}
