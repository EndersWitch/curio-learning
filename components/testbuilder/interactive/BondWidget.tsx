'use client'

import { useRef, useState } from 'react'
import { COMPOUNDS, ELEMENTS, needs, valence, cleanMoves, solveBond, type BondMoves } from '@/lib/testbuilder/interactive'

// Ionic bonding: drag outer electrons from the metal to the empty spaces in the
// non-metal's outer shell. Everything is drawn from the element data, so every
// atom is correct.
const R = (shell: number) => 20 + shell * 13
const ang = (k: number, n: number) => -Math.PI / 2 + (2 * Math.PI * k) / n
const pos = (cx: number, cy: number, r: number, k: number, n: number) => ({ x: cx + r * Math.cos(ang(k, n)), y: cy + r * Math.sin(ang(k, n)) })
const sup = (n: number) => (n === 0 ? '' : `${n === 1 ? '' : n}${n > 0 ? '+' : '−'}`)

export default function BondWidget({
  compoundId, value, onChange, locked, reveal,
}: { compoundId: string; value: unknown; onChange: (v: { moves: BondMoves }) => void; locked: boolean; reveal: boolean }) {
  const c = COMPOUNDS[compoundId]!
  const svg = useRef<SVGSVGElement>(null)
  const moves = cleanMoves((value as { moves?: unknown } | null)?.moves)
  const shown = reveal && Object.keys(moves).length === 0 ? solveBond(c) : moves
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null)

  const rows = Math.max(c.metals.length, c.nonmetals.length)
  const H = rows * 150 + 20
  const centre = (side: 'm' | 'n', i: number) => {
    const count = side === 'm' ? c.metals.length : c.nonmetals.length
    return { x: side === 'm' ? 110 : 350, y: (H / count) * (i + 0.5) }
  }

  const slotPos = (n: number, s: number) => {
    const ctr = centre('n', n)
    const shells = ELEMENTS[c.nonmetals[n]!]!.shells.length
    return pos(ctr.x, ctr.y, R(shells - 1), s, 8)
  }
  const outerPos = (m: number, e: number) => {
    const ctr = centre('m', m)
    const sym = c.metals[m]!
    return pos(ctr.x, ctr.y, R(ELEMENTS[sym]!.shells.length - 1), e, valence(sym))
  }
  const taken = new Set(Object.values(shown))
  const gaveOf = (m: number) => Object.keys(shown).filter(k => k.startsWith(`${m}:`)).length
  const gotOf = (n: number) => Object.values(shown).filter(v => v.startsWith(`${n}:`)).length

  function point(e: React.PointerEvent) {
    const r = svg.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 460, y: ((e.clientY - r.top) / r.height) * H }
  }
  function drop(key: string, x: number, y: number) {
    let best: { to: string; d: number } | null = null
    c.nonmetals.forEach((nm, n) => {
      for (let s = valence(nm); s < 8; s++) {
        const to = `${n}:${s}`
        if (taken.has(to)) continue
        const p = slotPos(n, s)
        const d = Math.hypot(p.x - x, p.y - y)
        if (d <= 26 && (!best || d < best.d)) best = { to, d }
      }
    })
    const next = { ...moves }
    delete next[key]
    if (best) next[key] = (best as { to: string }).to
    onChange({ moves: next })
  }

  return (
    <div className="tb-widget">
      <svg
        ref={svg}
        viewBox={`0 0 460 ${H}`}
        className="tb-bond"
        role="img"
        aria-label={`Atoms of ${c.name}. Drag electrons from the metal to the non-metal.`}
        style={{ touchAction: 'none' }}
        onPointerMove={e => { if (drag) { const p = point(e); setDrag({ ...drag, x: p.x, y: p.y }) } }}
        onPointerUp={e => { if (drag) { const p = point(e); drop(drag.key, p.x, p.y); setDrag(null) } }}
        onPointerCancel={() => setDrag(null)}
      >
        {/* Atoms */}
        {[...c.metals.map((s, i) => ({ s, i, side: 'm' as const })), ...c.nonmetals.map((s, i) => ({ s, i, side: 'n' as const }))].map(({ s, i, side }) => {
          const ctr = centre(side, i)
          const el = ELEMENTS[s]!
          const outer = el.shells.length - 1
          const charge = side === 'm' ? gaveOf(i) : -gotOf(i)
          const done = side === 'm' ? gaveOf(i) === valence(s) : gotOf(i) === needs(s)
          return (
            <g key={`${side}${i}`}>
              {el.shells.map((n, k) => <circle key={k} cx={ctr.x} cy={ctr.y} r={R(k)} className={`tb-shell ${k === outer ? 'outer' : ''}`} />)}
              <circle cx={ctr.x} cy={ctr.y} r={13} className="tb-nucleus" />
              <text x={ctr.x} y={ctr.y + 4} textAnchor="middle" className="tb-sym-text">{s}</text>
              {/* inner shells */}
              {el.shells.slice(0, -1).flatMap((n, k) => Array.from({ length: n }, (_, j) => {
                const p = pos(ctr.x, ctr.y, R(k), j, n)
                return <circle key={`${k}-${j}`} cx={p.x} cy={p.y} r={3.2} className="tb-e inner" />
              }))}
              {/* a non-metal's own outer electrons, and its empty spaces */}
              {side === 'n' && Array.from({ length: 8 }, (_, sl) => {
                const p = slotPos(i, sl)
                return sl < valence(s)
                  ? <circle key={sl} cx={p.x} cy={p.y} r={3.6} className="tb-e own" />
                  : <circle key={sl} cx={p.x} cy={p.y} r={5} className={`tb-slot ${drag ? 'hot' : ''}`} />
              })}
              {charge !== 0 && (
                <text x={ctr.x + R(outer) * 0.7 + 8} y={ctr.y - R(outer) * 0.7 - 2} className={`tb-charge ${done ? 'done' : ''}`}>{s}{sup(charge)}</text>
              )}
            </g>
          )
        })}
        {/* the metals' outer electrons: drag these */}
        {c.metals.flatMap((m, mi) => Array.from({ length: valence(m) }, (_, e) => {
          const key = `${mi}:${e}`
          const to = shown[key]
          const home = outerPos(mi, e)
          const [tn, ts] = to ? (to.split(':').map(Number) as [number, number]) : [0, 0]
          const at = drag?.key === key ? { x: drag.x, y: drag.y } : to ? slotPos(tn, ts) : home
          return (
            <circle
              key={key}
              cx={at.x}
              cy={at.y}
              r={drag?.key === key ? 8 : 6.5}
              className={`tb-e move ${to ? 'placed' : ''} ${locked ? 'locked' : ''}`}
              style={{ cursor: locked ? 'default' : 'grab', transition: drag?.key === key ? 'none' : 'cx .2s, cy .2s' }}
              onPointerDown={ev => {
                if (locked) return
                ev.preventDefault()
                svg.current?.setPointerCapture(ev.pointerId)
                const p = point(ev)
                setDrag({ key, x: p.x, y: p.y })
              }}
            />
          )
        }))}
      </svg>
      {!locked && (
        <div className="tb-actions">
          <button type="button" className="tb-link" disabled={Object.keys(moves).length === 0} onClick={() => onChange({ moves: {} })}>Start again</button>
          <span className="tb-muted">Drag the glowing electrons from the metal into the empty circles on the non-metal.</span>
        </div>
      )}
      {reveal && <p className="tb-muted">{Object.keys(moves).length === 0 ? 'This is how it should look.' : 'Your electrons are shown as you left them.'}</p>}
    </div>
  )
}
