'use client'

import { useRef, useState } from 'react'
import {
  cleanCells, cleanFills, cleanMatch, cleanOrder, cleanPicked, cleanPlot,
  type FillSpec, type MatchSpec, type OrderSpec, type PickSpec, type PlotSpec, type ShadeSpec,
} from '@/lib/testbuilder/authored'

interface Common { value: unknown; onChange: (v: unknown) => void; locked: boolean; answer?: Record<string, unknown> }
const minus = (n: number) => String(Math.round(n * 1000) / 1000).replace('-', '−')

// ---- plot a point or a number --------------------------------------------
export function PlotWidget({ spec, value, onChange, locked, answer }: Common & { spec: PlotSpec }) {
  const svg = useRef<SVGSVGElement>(null)
  const given = cleanPlot(value, spec)
  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect(), vb = svg.current!.viewBox.baseVal
    return { x: ((e.clientX - r.left) / r.width) * vb.width, y: ((e.clientY - r.top) / r.height) * vb.height }
  }
  if (spec.mode === 'grid') {
    const R = spec.range ?? 5, k = 22, c = 20 + R * k, size = 40 + 2 * R * k
    const px = (v: number) => c + v * k, py = (v: number) => c - v * k
    const g = given as { x: number; y: number } | null
    const want = answer as { x: number; y: number } | undefined
    return (
      <div className="tb-widget">
        <svg ref={svg} viewBox={`0 0 ${size} ${size}`} className="tb-plot" style={{ touchAction: 'none' }} role="img" aria-label="Coordinate grid. Click to place a point."
          onPointerDown={e => {
            if (locked) return
            const p = at(e)
            onChange({ x: Math.max(-R, Math.min(R, Math.round((p.x - c) / k))), y: Math.max(-R, Math.min(R, Math.round((c - p.y) / k))) })
          }}>
          <rect width={size} height={size} fill="#fff" />
          {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map(v => (
            <g key={v}>
              <line x1={px(v)} y1={20} x2={px(v)} y2={size - 20} stroke="#ddd" /><line x1={20} y1={py(v)} x2={size - 20} y2={py(v)} stroke="#ddd" />
              {v !== 0 && <text x={px(v)} y={c + 13} textAnchor="middle" fontSize="9.5" fill="#555">{minus(v)}</text>}
              {v !== 0 && <text x={c - 6} y={py(v) + 3} textAnchor="end" fontSize="9.5" fill="#555">{minus(v)}</text>}
            </g>
          ))}
          <line x1={20} y1={c} x2={size - 20} y2={c} stroke="#222" strokeWidth="2" /><line x1={c} y1={20} x2={c} y2={size - 20} stroke="#222" strokeWidth="2" />
          <text x={size - 12} y={c + 4} fontSize="12" fontWeight="700" fill="#222">x</text><text x={c + 6} y={14} fontSize="12" fontWeight="700" fill="#222">y</text>
          {want && <circle cx={px(want.x)} cy={py(want.y)} r="9" fill="none" stroke="#2f8f5b" strokeWidth="3" strokeDasharray="4 3" />}
          {g && <circle cx={px(g.x)} cy={py(g.y)} r="6" fill={want ? (g.x === want.x && g.y === want.y ? '#2f8f5b' : '#b2431f') : '#b2431f'} />}
        </svg>
        <p className="tb-muted">{locked ? (g ? `Your point: (${minus(g.x)}; ${minus(g.y)})` : 'No point placed.') : g ? `Point at (${minus(g.x)}; ${minus(g.y)}). Click again to move it.` : 'Click a spot on the grid.'}</p>
      </div>
    )
  }
  const min = spec.min ?? 0, max = spec.max ?? 10, step = spec.step ?? 1, n = Math.round((max - min) / step)
  const x0 = 30, w = 300, X = (v: number) => x0 + ((v - min) / (max - min)) * w
  const g = given as { v: number } | null
  const want = answer as { v: number } | undefined
  return (
    <div className="tb-widget">
      <svg ref={svg} viewBox="0 0 360 100" className="tb-plot line" style={{ touchAction: 'none' }} role="img" aria-label="Number line. Click to mark a number."
        onPointerDown={e => {
          if (locked) return
          const p = at(e), v = Math.round((((p.x - x0) / w) * (max - min)) / step) * step + min
          onChange({ v: Math.round(Math.max(min, Math.min(max, v)) * 1000) / 1000 })
        }}>
        <rect width="360" height="100" fill="#fff" />
        <line x1={x0} y1={60} x2={x0 + w} y2={60} stroke="#222" strokeWidth="2.4" />
        {Array.from({ length: n + 1 }, (_, i) => min + i * step).map((v, i) => (
          <g key={i}>
            <line x1={X(v)} y1={52} x2={X(v)} y2={68} stroke="#222" strokeWidth="1.6" />
            {(n <= 10 || i % 2 === 0) && <text x={X(v)} y={86} textAnchor="middle" fontSize="11" fontWeight="700" fill="#222">{minus(v)}</text>}
          </g>
        ))}
        {want && <polygon points={`${X(want.v)},56 ${X(want.v) - 8},38 ${X(want.v) + 8},38`} fill="none" stroke="#2f8f5b" strokeWidth="2.5" strokeDasharray="3 2" />}
        {g && <polygon points={`${X(g.v)},56 ${X(g.v) - 8},38 ${X(g.v) + 8},38`} fill={want ? (Math.abs(g.v - want.v) <= step / 2 ? '#2f8f5b' : '#b2431f') : '#b2431f'} />}
      </svg>
      <p className="tb-muted">{locked ? (g ? `You marked ${minus(g.v)}.` : 'Nothing marked.') : g ? `Marked ${minus(g.v)}. Click again to move it.` : 'Click the number line.'}</p>
    </div>
  )
}

// ---- shade a fraction ------------------------------------------------------
export function ShadeWidget({ spec, value, onChange, locked, answer }: Common & { spec: ShadeSpec }) {
  const cells = cleanCells(value, spec)
  const total = spec.rows * spec.cols
  const want = answer?.count as number | undefined
  return (
    <div className="tb-widget">
      <div className="tb-shade" style={{ gridTemplateColumns: `repeat(${spec.cols}, 1fr)`, maxWidth: spec.cols * 64 }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} type="button" disabled={locked} className={cells.includes(i) ? 'on' : ''} aria-pressed={cells.includes(i)} aria-label={`Square ${i + 1}`}
            onClick={() => onChange({ cells: cells.includes(i) ? cells.filter(c => c !== i) : [...cells, i] })} />
        ))}
      </div>
      <p className="tb-muted">{`Shaded ${cells.length} of ${total} squares.`}{want !== undefined ? ` The answer needed ${want}.` : ''}</p>
    </div>
  )
}

// ---- put in order -----------------------------------------------------------
export function OrderWidget({ spec, value, onChange, locked, answer }: Common & { spec: OrderSpec }) {
  const current = cleanOrder(value, spec) ?? spec.items.map(i => i.id)
  const text = (id: string) => spec.items.find(i => i.id === id)?.text ?? ''
  const refs = useRef<Record<string, HTMLLIElement | null>>({})
  const [drag, setDrag] = useState<string | null>(null)
  const want = answer?.order as string[] | undefined
  const move = (from: number, to: number) => {
    if (to < 0 || to >= current.length || from === to) return
    const next = [...current]; const [x] = next.splice(from, 1); next.splice(to, 0, x!)
    onChange({ order: next })
  }
  return (
    <div className="tb-widget">
      <ol className="tb-order">
        {current.map((id, i) => {
          const state = want ? (want[i] === id ? 'right' : 'wrong') : ''
          return (
            <li key={id} ref={el => { refs.current[id] = el }} className={`${drag === id ? 'drag' : ''} ${state}`}>
              <span className="tb-order-n">{i + 1}</span>
              <span className="tb-order-text">{text(id)}</span>
              {!locked && (
                <span className="tb-order-btns">
                  <button type="button" aria-label={`Move ${text(id)} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>&#9650;</button>
                  <button type="button" aria-label={`Move ${text(id)} down`} disabled={i === current.length - 1} onClick={() => move(i, i + 1)}>&#9660;</button>
                  <span className="tb-grip" role="presentation" style={{ touchAction: 'none' }}
                    onPointerDown={e => { (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrag(id) }}
                    onPointerMove={e => {
                      if (drag !== id) return
                      const y = e.clientY
                      let to = i
                      current.forEach((other, j) => { const r = refs.current[other]?.getBoundingClientRect(); if (r && y > r.top && y < r.bottom) to = j })
                      if (to !== i) move(i, to)
                    }}
                    onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>&#10303;</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {want && <p className="tb-muted">Right order: {want.map(text).join(' → ')}</p>}
    </div>
  )
}

// ---- match pairs --------------------------------------------------------------
const PAIR_COLOURS = ['#b2431f', '#3b7dd8', '#2f8f5b', '#a9752a', '#8a4fb3']
export function MatchWidget({ spec, value, onChange, locked, answer }: Common & { spec: MatchSpec }) {
  const pairs = cleanMatch(value, spec)
  const [sel, setSel] = useState<string | null>(null)
  const want = answer?.pairs as Record<string, string> | undefined
  const colourOfRight = (rid: string) => { const l = Object.keys(pairs).find(k => pairs[k] === rid); return l ? PAIR_COLOURS[spec.left.findIndex(x => x.id === l)] : undefined }
  const rt = (id: string) => spec.right.find(r => r.id === id)?.text ?? ''
  return (
    <div className="tb-widget">
      <div className="tb-match">
        <div>
          {spec.left.map((l, i) => {
            const state = want ? (pairs[l.id] === want[l.id] ? 'right' : 'wrong') : ''
            return (
              <button key={l.id} type="button" disabled={locked} className={`${sel === l.id ? 'on' : ''} ${state}`} style={{ borderColor: pairs[l.id] || sel === l.id ? PAIR_COLOURS[i] : undefined }}
                onClick={() => {
                  if (pairs[l.id]) { const next = { ...pairs }; delete next[l.id]; onChange({ pairs: next }); setSel(null) } else setSel(sel === l.id ? null : l.id)
                }}>
                {pairs[l.id] && <b style={{ background: PAIR_COLOURS[i] }}>{i + 1}</b>}{l.text}
                {want && pairs[l.id] !== want[l.id] && <em>{` → ${rt(want[l.id]!)}`}</em>}
              </button>
            )
          })}
        </div>
        <div>
          {spec.right.map(r => {
            const colour = colourOfRight(r.id)
            return (
              <button key={r.id} type="button" disabled={locked || !!colour} style={{ borderColor: colour }}
                onClick={() => { if (!sel) return; const next = { ...pairs }; for (const k of Object.keys(next)) if (next[k] === r.id) delete next[k]; next[sel] = r.id; onChange({ pairs: next }); setSel(null) }}>
                {colour && <b style={{ background: colour }}>{spec.left.findIndex(l => pairs[l.id] === r.id) + 1}</b>}{r.text}
              </button>
            )
          })}
        </div>
      </div>
      {!locked && <p className="tb-muted">{sel ? 'Now tap its partner on the right.' : 'Tap an item on the left, then its partner. Tap a matched item to undo it.'}</p>}
    </div>
  )
}

// ---- tap the words ---------------------------------------------------------------
export function PickWidget({ spec, value, onChange, locked, answer }: Common & { spec: PickSpec }) {
  const picked = cleanPicked(value, spec)
  const want = answer?.targets as number[] | undefined
  return (
    <div className="tb-widget">
      <p className="tb-pick-text">
        {spec.words.map((w, i) => {
          const on = picked.includes(i)
          const state = want ? (on && want.includes(i) ? 'right' : on ? 'wrong' : want.includes(i) ? 'missed' : '') : on ? 'on' : ''
          return <button key={i} type="button" disabled={locked} className={`tb-word ${state}`} aria-pressed={on} onClick={() => onChange({ picked: on ? picked.filter(p => p !== i) : [...picked, i] })}>{w}</button>
        })}
      </p>
      {!locked && <p className="tb-muted">Tap a word to pick it, tap again to un-pick it.</p>}
    </div>
  )
}

// ---- fill the gaps -----------------------------------------------------------------
export function FillWidget({ spec, value, onChange, locked, answer }: Common & { spec: FillSpec }) {
  const fills = cleanFills(value, spec)
  const blanks = spec.parts.length - 1
  const [sel, setSel] = useState<number | null>(null)
  const want = answer?.answers as string[] | undefined
  const used = new Set(Object.values(fills))
  const place = (word: string) => {
    if (locked) return
    if (used.has(word)) { const next = { ...fills }; for (const k of Object.keys(next)) if (next[k] === word) delete next[k]; onChange({ fills: next }); return }
    const target = sel ?? Array.from({ length: blanks }, (_, i) => i).find(i => !fills[String(i)])
    if (target === undefined || target === null) return
    onChange({ fills: { ...fills, [String(target)]: word } }); setSel(null)
  }
  return (
    <div className="tb-widget">
      <p className="tb-fill-text">
        {spec.parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks && (
              <button type="button" disabled={locked} className={`tb-gap ${sel === i ? 'on' : ''} ${want ? (fills[String(i)] === want[i] ? 'right' : 'wrong') : fills[String(i)] ? 'filled' : ''}`}
                onClick={() => { if (fills[String(i)]) { const next = { ...fills }; delete next[String(i)]; onChange({ fills: next }) } setSel(i) }}>
                {fills[String(i)] ?? '      '}
                {want && fills[String(i)] !== want[i] && <em>{` ${want[i]}`}</em>}
              </button>
            )}
          </span>
        ))}
      </p>
      {!locked && (
        <div className="tb-bank">
          {spec.bank.map(w => <button key={w} type="button" className={`tb-chip ${used.has(w) ? 'used' : ''}`} onClick={() => place(w)}>{w}</button>)}
        </div>
      )}
    </div>
  )
}
