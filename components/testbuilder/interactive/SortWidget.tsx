'use client'

import { useState } from 'react'
import type { SortAnswer, SortSpec } from '@/lib/testbuilder/interactive'

// Drag each item into its group. On touch screens (or if you prefer) tap an item,
// then tap the group.
export default function SortWidget({
  spec, value, onChange, locked, answer,
}: { spec: SortSpec; value: unknown; onChange: (v: { assign: SortAnswer }) => void; locked: boolean; answer?: SortAnswer }) {
  const assign = ((value as { assign?: SortAnswer } | null)?.assign ?? {}) as SortAnswer
  const [held, setHeld] = useState<string | null>(null)
  const [over, setOver] = useState<number | null>(null)

  function put(id: string, cat: number | null) {
    if (locked) return
    const next = { ...assign }
    if (cat === null) delete next[id]
    else next[id] = cat
    onChange({ assign: next })
    setHeld(null)
    setOver(null)
  }

  const chip = (id: string, text: string) => {
    const right = answer && assign[id] !== undefined ? assign[id] === answer[id] : undefined
    return (
      <button
        key={id}
        type="button"
        draggable={!locked}
        className={`tb-sortchip ${held === id ? 'held' : ''} ${right === true ? 'right' : right === false ? 'wrong' : ''}`}
        onDragStart={e => { e.dataTransfer.setData('text/plain', id); setHeld(id) }}
        onDragEnd={() => { setHeld(null); setOver(null) }}
        onClick={() => !locked && setHeld(h => (h === id ? null : id))}
        disabled={locked && !answer}
      >
        {text}
      </button>
    )
  }

  const unplaced = spec.items.filter(it => assign[it.id] === undefined)
  return (
    <div className="tb-widget tb-sort">
      <div
        className={`tb-sortpool ${over === -1 ? 'over' : ''}`}
        onDragOver={e => { e.preventDefault(); setOver(-1) }}
        onDragLeave={() => setOver(null)}
        onDrop={e => { e.preventDefault(); put(e.dataTransfer.getData('text/plain'), null) }}
        onClick={() => held && put(held, null)}
      >
        {unplaced.length ? unplaced.map(it => chip(it.id, it.text)) : <span className="tb-muted">{locked ? 'Nothing left unplaced.' : 'All sorted. Check the groups, then carry on.'}</span>}
      </div>
      <div className="tb-sortgroups" style={{ gridTemplateColumns: `repeat(${spec.categories.length}, 1fr)` }}>
        {spec.categories.map((name, k) => (
          <div
            key={name}
            className={`tb-sortgroup ${over === k ? 'over' : ''} ${held ? 'ready' : ''}`}
            onDragOver={e => { e.preventDefault(); setOver(k) }}
            onDragLeave={() => setOver(null)}
            onDrop={e => { e.preventDefault(); put(e.dataTransfer.getData('text/plain'), k) }}
            onClick={() => held && put(held, k)}
          >
            <b>{name}</b>
            <div className="tb-sortitems">{spec.items.filter(it => assign[it.id] === k).map(it => chip(it.id, it.text))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
