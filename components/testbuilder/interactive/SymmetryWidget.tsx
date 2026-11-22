'use client'

import { useRef, useState } from 'react'
import { SHAPES, axisLine, checkSymmetry, cleanLines, type Line, type ShapeId } from '@/lib/testbuilder/interactive'

// Draw the lines of symmetry: press on one side of the shape and drag to the other.
export default function SymmetryWidget({
  shape, value, onChange, locked, reveal,
}: { shape: ShapeId; value: unknown; onChange: (v: { lines: Line[] }) => void; locked: boolean; reveal: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const lines = cleanLines((value as { lines?: unknown } | null)?.lines)
  const [live, setLive] = useState<Line | null>(null)
  const def = SHAPES[shape]
  const result = reveal ? checkSymmetry(shape, lines) : null

  function point(e: React.PointerEvent) {
    const r = svg.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 200, y: ((e.clientY - r.top) / r.height) * 200 }
  }

  return (
    <div className="tb-widget">
      <svg
        ref={svg}
        viewBox="0 0 200 200"
        className="tb-sym"
        role="img"
        aria-label={`A ${def.label}. Drag across it to draw a line of symmetry.`}
        style={{ touchAction: 'none', cursor: locked ? 'default' : 'crosshair' }}
        onPointerDown={e => {
          if (locked || lines.length >= 10) return
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = point(e)
          setLive({ x1: p.x, y1: p.y, x2: p.x, y2: p.y })
        }}
        onPointerMove={e => {
          if (!live) return
          const p = point(e)
          setLive({ ...live, x2: p.x, y2: p.y })
        }}
        onPointerUp={() => {
          if (!live) return
          if (Math.hypot(live.x2 - live.x1, live.y2 - live.y1) >= 30) onChange({ lines: [...lines, live] })
          setLive(null)
        }}
        onPointerCancel={() => setLive(null)}
      >
        <polygon points={def.points.map(p => p.join(',')).join(' ')} className="tb-sym-shape" />
        {reveal && def.axes.map((a, i) => {
          const l = axisLine(a)
          return <line key={`a${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="tb-sym-answer" />
        })}
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            className={`tb-sym-line ${result ? (result.strays.includes(i) ? 'bad' : 'good') : ''}`}
          />
        ))}
        {live && <line x1={live.x1} y1={live.y1} x2={live.x2} y2={live.y2} className="tb-sym-line live" />}
      </svg>
      {!locked && (
        <div className="tb-actions">
          <button type="button" className="tb-link" disabled={lines.length === 0} onClick={() => onChange({ lines: lines.slice(0, -1) })}>Undo last line</button>
          <button type="button" className="tb-link" disabled={lines.length === 0} onClick={() => onChange({ lines: [] })}>Clear all</button>
          <span className="tb-muted">{lines.length === 0 ? 'Drag across the shape to draw a line.' : `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} drawn`}</span>
        </div>
      )}
      {reveal && <p className="tb-muted">Green: your correct lines. Red: lines that are not lines of symmetry. Dashed: all the lines of symmetry.</p>}
    </div>
  )
}
