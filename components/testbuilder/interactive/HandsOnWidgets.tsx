'use client'

import { useRef, useState } from 'react'
import {
  cleanAngle, cleanClock, cleanElements, cleanLabels, cleanLinePts, clockText, onLine,
  type AngleSpec, type ClockSpec, type LabelSpec, type LineSpec,
} from '@/lib/testbuilder/handson'
import { ELEMENTS, ELEMENT_COLS, ELEMENT_ROWS } from '@/lib/testbuilder/periodic'

interface Common { value: unknown; onChange: (v: unknown) => void; locked: boolean; answer?: Record<string, unknown> }
const minus = (n: number) => String(n).replace('-', '−')

function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }) {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal
  return { x: ((e.clientX - r.left) / r.width) * vb.width, y: ((e.clientY - r.top) / r.height) * vb.height }
}

// ---- label a diagram ----
export function LabelWidget({ spec, value, onChange, locked, answer }: Common & { spec: LabelSpec }) {
  const got = cleanLabels(value, spec)
  const want = (answer?.labels ?? undefined) as Record<string, string> | undefined
  const img = `data:image/svg+xml;utf8,${encodeURIComponent(spec.svg)}`
  return (
    <div className="tb-widget">
      <div className="tb-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="A diagram with numbered parts. Choose a name for each number." />
      </div>
      <div className="tb-geo" style={{ marginTop: '0.7rem' }}>
        {spec.pins.map(n => {
          const right = want ? got[String(n)] === want[String(n)] : undefined
          return (
            <label key={n} className={right === undefined ? '' : right ? 'right' : 'wrong'}>
              <span>{n}</span>
              <select disabled={locked} value={got[String(n)] ?? ''} onChange={e => onChange({ labels: { ...got, [String(n)]: e.target.value } })} aria-label={`Name for number ${n}`}>
                <option value="">Choose</option>
                {spec.bank.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          )
        })}
      </div>
      {want && <p className="tb-muted">Answer: {spec.pins.map(n => `${n} ${want[String(n)]}`).join(', ')}.</p>}
    </div>
  )
}

// ---- set a clock ----
export function ClockWidget({ spec, value, onChange, locked, answer }: Common & { spec: ClockSpec }) {
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<'h' | 'm' | null>(null)
  const set = cleanClock(value, spec)
  const [h, m] = set ? [set.h, set.m] : [0, 0]
  const C = 130, R = 112
  const hourA = ((h + m / 60) * 30 * Math.PI) / 180, minA = (m * 6 * Math.PI) / 180
  const tip = (a: number, len: number) => ({ x: C + len * Math.sin(a), y: C - len * Math.cos(a) })
  const hp = tip(hourA, 62), mp = tip(minA, 92)

  const move = (e: React.PointerEvent) => {
    if (!drag.current || locked) return
    const p = svgPoint(svg.current!, e)
    let deg = (Math.atan2(p.x - C, C - p.y) * 180) / Math.PI
    if (deg < 0) deg += 360
    if (drag.current === 'm') {
      const mm = (Math.round(deg / 6 / spec.snap) * spec.snap) % 60
      onChange({ h, m: mm })
    } else {
      const hh = ((Math.round(deg / 30 - m / 60) % 12) + 12) % 12
      onChange({ h: hh, m })
    }
  }
  const down = (e: React.PointerEvent) => {
    if (locked) return
    const p = svgPoint(svg.current!, e)
    const dh = Math.hypot(p.x - hp.x, p.y - hp.y), dm = Math.hypot(p.x - mp.x, p.y - mp.y)
    const d = Math.hypot(p.x - C, p.y - C)
    drag.current = spec.snap >= 30 ? (dh <= dm || d < 70 ? 'h' : 'm') : dm < dh && d > 40 ? 'm' : dh < dm ? 'h' : d < 70 ? 'h' : 'm'
    if (!set) onChange({ h: 0, m: 0 })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    move(e)
  }
  const want = answer as { h?: number; m?: number } | undefined
  return (
    <div className="tb-widget">
      <svg ref={svg} viewBox="0 0 260 260" className="tb-clock" style={{ touchAction: 'none' }} role="img" aria-label="Analogue clock. Drag the hands to set the time."
        onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
        <circle cx={C} cy={C} r={R + 10} fill="#fff" stroke="#222" strokeWidth="4" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180, major = i % 5 === 0
          const p1 = { x: C + (R + 6) * Math.sin(a), y: C - (R + 6) * Math.cos(a) }, p2 = { x: C + (R - (major ? 8 : 3)) * Math.sin(a), y: C - (R - (major ? 8 : 3)) * Math.cos(a) }
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#222" strokeWidth={major ? 2.2 : 1} />
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1, a = (n * 30 * Math.PI) / 180
          return <text key={n} x={C + (R - 24) * Math.sin(a)} y={C - (R - 24) * Math.cos(a) + 6} textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontSize="18" fontWeight="700" fill="#222">{n}</text>
        })}
        <line x1={C} y1={C} x2={hp.x} y2={hp.y} stroke="#222" strokeWidth="7" strokeLinecap="round" opacity={set ? 1 : 0.35} />
        <line x1={C} y1={C} x2={mp.x} y2={mp.y} stroke="#b2431f" strokeWidth="4" strokeLinecap="round" opacity={set ? 1 : 0.35} />
        <circle cx={hp.x} cy={hp.y} r="9" fill="#222" opacity=".25" /><circle cx={mp.x} cy={mp.y} r="9" fill="#b2431f" opacity=".25" />
        <circle cx={C} cy={C} r="6" fill="#222" />
      </svg>
      {!set && !locked && <p className="tb-muted" style={{ textAlign: 'center' }}>Drag the hands to set the time.</p>}
      {want && typeof want.h === 'number' && <p className="tb-muted" style={{ textAlign: 'center' }}>Answer: {clockText(want.h, want.m ?? 0)}.</p>}
    </div>
  )
}

// ---- draw a straight line ----
export function LineWidget({ spec, value, onChange, locked, answer }: Common & { spec: LineSpec }) {
  const svg = useRef<SVGSVGElement>(null)
  const R = spec.range, k = 24, c = 24 + R * k, size = 48 + 2 * R * k
  const px = (v: number) => c + v * k, py = (v: number) => c - v * k
  const pts = cleanLinePts(value, R)
  const key = answer as { m?: number; c?: number } | undefined
  const ext = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    if (a.x === b.x) return [{ x: a.x, y: -R }, { x: a.x, y: R }]
    const m = (b.y - a.y) / (b.x - a.x), q = a.y - m * a.x
    return [{ x: -R, y: m * -R + q }, { x: R, y: m * R + q }]
  }
  const line = pts.length === 2 ? ext(pts[0]!, pts[1]!) : null
  const good = key && typeof key.m === 'number' && typeof key.c === 'number' ? [{ x: -R, y: key.m * -R + key.c }, { x: R, y: key.m * R + key.c }] : null
  const click = (e: React.PointerEvent) => {
    if (locked) return
    const p = svgPoint(svg.current!, e)
    const x = Math.round((p.x - c) / k), y = Math.round((c - p.y) / k)
    if (Math.abs(x) > R || Math.abs(y) > R) return
    if (pts.some(q => q.x === x && q.y === y)) return
    onChange({ pts: [...pts, { x, y }].slice(-2) })
  }
  return (
    <div className="tb-widget">
      <svg ref={svg} viewBox={`0 0 ${size} ${size}`} className="tb-plot" style={{ touchAction: 'none' }} role="img" aria-label="Coordinate grid. Click two points to draw the line." onPointerDown={click}>
        <rect width={size} height={size} fill="#fff" />
        {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map(v => (
          <g key={v}>
            <line x1={px(v)} y1={py(-R)} x2={px(v)} y2={py(R)} stroke={v === 0 ? '#222' : '#ddd'} strokeWidth={v === 0 ? 2 : 1} />
            <line x1={px(-R)} y1={py(v)} x2={px(R)} y2={py(v)} stroke={v === 0 ? '#222' : '#ddd'} strokeWidth={v === 0 ? 2 : 1} />
            {v !== 0 && <text x={px(v)} y={py(0) + 14} textAnchor="middle" fontSize="10" fill="#444" fontFamily="Arial">{minus(v)}</text>}
            {v !== 0 && <text x={px(0) - 6} y={py(v) + 3} textAnchor="end" fontSize="10" fill="#444" fontFamily="Arial">{minus(v)}</text>}
          </g>
        ))}
        <text x={px(R) + 4} y={py(0) - 6} fontSize="12" fontWeight="700" fill="#222" fontFamily="Arial">x</text>
        <text x={px(0) + 8} y={py(R) - 2} fontSize="12" fontWeight="700" fill="#222" fontFamily="Arial">y</text>
        {good && <line x1={px(good[0]!.x)} y1={py(good[0]!.y)} x2={px(good[1]!.x)} y2={py(good[1]!.y)} stroke="#2f8f5b" strokeWidth="3" strokeDasharray="6 5" />}
        {line && <line x1={px(line[0]!.x)} y1={py(line[0]!.y)} x2={px(line[1]!.x)} y2={py(line[1]!.y)} stroke="#b2431f" strokeWidth="2.5" />}
        {pts.map((p, i) => {
          const ok = key && typeof key.m === 'number' && typeof key.c === 'number' ? onLine(key.m, key.c, p) : undefined
          return <circle key={i} cx={px(p.x)} cy={py(p.y)} r="6" fill={ok === undefined ? '#b2431f' : ok ? '#2f8f5b' : '#c0392b'} stroke="#fff" strokeWidth="1.5" />
        })}
      </svg>
      {!locked && <button type="button" className="tb-link" style={{ marginTop: '0.4rem' }} onClick={() => onChange({ pts: [] })}>Clear points</button>}
      {key && <p className="tb-muted">The green dashed line is {spec.equation}.</p>}
    </div>
  )
}

// ---- draw an angle ----
export function AngleWidget({ spec, value, onChange, locked, answer }: Common & { spec: AngleSpec }) {
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef(false)
  const V = { x: 40, y: 170 }, L = 240, PR = 118
  const given = cleanAngle(value)
  const rad = (d: number) => (d * Math.PI) / 180
  const end = (d: number, len = L) => ({ x: V.x + len * Math.cos(rad(d)), y: V.y - len * Math.sin(rad(d)) })
  const move = (e: React.PointerEvent) => {
    if (!drag.current || locked) return
    const p = svgPoint(svg.current!, e)
    let d = (Math.atan2(V.y - p.y, p.x - V.x) * 180) / Math.PI
    if (d < 0) d = p.x < V.x ? 180 : 0
    onChange({ a: Math.min(180, Math.max(0, Math.round(d))) })
  }
  const a = given?.a ?? 0, tip = end(a), want = answer as { a?: number } | undefined
  return (
    <div className="tb-widget">
      <svg ref={svg} viewBox="0 0 300 200" className="tb-angle" style={{ touchAction: 'none' }} role="img" aria-label="Protractor with a base line. Drag the arm to draw the angle."
        onPointerDown={e => { if (locked) return; drag.current = true; if (!given) onChange({ a: 0 }); ;(e.target as Element).setPointerCapture?.(e.pointerId); move(e) }}
        onPointerMove={move} onPointerUp={() => { drag.current = false }} onPointerCancel={() => { drag.current = false }}>
        <rect width="300" height="200" fill="#fff" />
        <path d={`M ${V.x - PR} ${V.y} A ${PR} ${PR} 0 0 1 ${V.x + PR} ${V.y} Z`} fill="#eaf3fb" stroke="#3b7dd8" strokeWidth="1.5" />
        {Array.from({ length: 37 }, (_, i) => i * 5).map(d => {
          const big = d % 10 === 0, p1 = end(d, PR), p2 = end(d, PR - (big ? 10 : 5))
          return <line key={d} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b7dd8" strokeWidth={big ? 1.2 : 0.7} />
        })}
        {Array.from({ length: 19 }, (_, i) => i * 10).map(d => { const p = end(d, PR - 20); return <text key={d} x={p.x} y={p.y + 3} textAnchor="middle" fontSize="8" fill="#3b7dd8" fontFamily="Arial">{d}</text> })}
        <line x1={V.x} y1={V.y} x2={V.x + L} y2={V.y} stroke="#222" strokeWidth="2.5" />
        {want && typeof want.a === 'number' && <line x1={V.x} y1={V.y} x2={end(want.a).x} y2={end(want.a).y} stroke="#2f8f5b" strokeWidth="2.5" strokeDasharray="6 5" />}
        <line x1={V.x} y1={V.y} x2={tip.x} y2={tip.y} stroke="#b2431f" strokeWidth="3" strokeLinecap="round" opacity={given ? 1 : 0.35} />
        <circle cx={tip.x} cy={tip.y} r="9" fill="#b2431f" opacity=".3" />
        <circle cx={V.x} cy={V.y} r="4" fill="#222" />
      </svg>
      {!given && !locked && <p className="tb-muted" style={{ textAlign: 'center' }}>Drag the end of the arm.</p>}
      {want && typeof want.a === 'number' && <p className="tb-muted">Answer: {want.a}{'°'}. {given ? `Yours: ${given.a}°.` : ''}</p>}
    </div>
  )
}

// ---- periodic table ----
export function PeriodicWidget({ value, onChange, locked, answer }: Common & { spec: unknown }) {
  const sel = cleanElements(value)
  const targets = ((answer?.targets ?? undefined) as number[] | undefined)
  const toggle = (z: number) => {
    if (locked) return
    onChange({ sel: sel.includes(z) ? sel.filter(x => x !== z) : [...sel, z] })
  }
  return (
    <div className="tb-widget">
      <div className="tb-pt" style={{ gridTemplateColumns: `repeat(${ELEMENT_COLS}, 1fr)`, gridTemplateRows: `repeat(${ELEMENT_ROWS}, auto)` }} role="group" aria-label="Periodic table, periods 1 to 5">
        {ELEMENTS.map(e => {
          const on = sel.includes(e.z)
          const state = targets ? (targets.includes(e.z) ? (on ? 'right' : 'missed') : on ? 'wrong' : '') : on ? 'on' : ''
          return (
            <button key={e.z} type="button" className={`tb-ptcell ${state}`} style={{ gridRow: e.row, gridColumn: e.col }} onClick={() => toggle(e.z)} aria-pressed={on} aria-label={`${e.name}, symbol ${e.sym}, atomic number ${e.z}`} disabled={locked}>
              <small>{e.z}</small><b>{e.sym}</b>
            </button>
          )
        })}
      </div>
      {targets && <p className="tb-muted">Answer: {targets.map(z => ELEMENTS.find(e => e.z === z)?.name).join(', ')}.</p>}
    </div>
  )
}
