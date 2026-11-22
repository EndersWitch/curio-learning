'use client'

import { useRef, useState } from 'react'
import { MAPS } from '@/lib/testbuilder/mapData'
import { checkMapLine, cleanMapLine, cleanPicks, type MapDot, type MapId } from '@/lib/testbuilder/interactive'

interface AnswerKey { targets?: string[]; names?: Record<string, string>; from?: string; to?: string }

// Two map questions in one: tap a name then tap its place (maplocate), or press on
// one dot and drag to another (mapline). While answering, regions carry no names.
export default function MapWidget({
  kind, map, targets, dots, value, onChange, locked, answer,
}: {
  kind: 'maplocate' | 'mapline'
  map: MapId
  targets?: { id: string; name: string }[]
  dots?: MapDot[]
  value: unknown
  onChange: (v: unknown) => void
  locked: boolean
  answer?: AnswerKey // only after marking
}) {
  const def = MAPS[map]
  const svg = useRef<SVGSVGElement>(null)
  const ids = (targets ?? []).map(t => t.id)
  const picks = cleanPicks(value, ids)
  const line = cleanMapLine(value)
  const [active, setActive] = useState<string | null>(null)
  const [live, setLive] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const current = active ?? ids.find(t => !picks[t]) ?? null
  const pickedBy = (regionId: string) => ids.find(t => picks[t] === regionId)

  function point(e: React.PointerEvent) {
    const r = svg.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * def.viewBox[0], y: ((e.clientY - r.top) / r.height) * def.viewBox[1] }
  }

  const review = !!answer
  const lineResult = review && dots && answer?.from && answer.to ? checkMapLine(dots, answer.from, answer.to, line) : null

  return (
    <div className="tb-widget">
      {kind === 'maplocate' && (
        <div className="tb-maptargets">
          {(targets ?? []).map(t => {
            const got = picks[t.id]
            const state = review ? (got === t.id ? 'right' : 'wrong') : got ? 'done' : ''
            return (
              <button
                key={t.id}
                type="button"
                disabled={locked}
                className={`tb-maptarget ${current === t.id && !locked ? 'on' : ''} ${state}`}
                onClick={() => setActive(t.id)}
              >
                {got && !review ? '✓ ' : ''}{t.name}
              </button>
            )
          })}
        </div>
      )}

      <svg
        ref={svg}
        viewBox={`0 0 ${def.viewBox[0]} ${def.viewBox[1]}`}
        className={`tb-map ${kind}`}
        role="img"
        aria-label={kind === 'maplocate' ? 'A map. Tap the place that matches the name you chose.' : 'A map with lettered dots. Drag from one dot to another.'}
        style={{ touchAction: kind === 'mapline' ? 'none' : 'manipulation' }}
        onPointerDown={e => {
          if (kind !== 'mapline' || locked) return
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
          if (Math.hypot(live.x2 - live.x1, live.y2 - live.y1) >= 20) onChange({ line: live })
          setLive(null)
        }}
        onPointerCancel={() => setLive(null)}
      >
        <path d={def.context} className="tb-map-context" />
        {def.regions.map(r => {
          const by = kind === 'maplocate' ? pickedBy(r.id) : undefined
          const isTarget = ids.includes(r.id)
          const cls = review
            ? by && by === r.id ? 'right' : by ? 'wrong' : isTarget ? 'answer' : ''
            : by ? 'picked' : ''
          return (
            <path
              key={r.id}
              d={r.d}
              className={`tb-region ${cls} ${kind === 'maplocate' && !locked ? 'click' : ''}`}
              onClick={() => {
                if (kind !== 'maplocate' || locked || !current) return
                const next = { ...picks }
                // A region holds one answer: clear any other name that was sitting on it.
                for (const t of ids) if (next[t] === r.id) delete next[t]
                next[current] = r.id
                onChange({ picks: next })
                setActive(null)
              }}
            />
          )
        })}
        {/* after marking: say where the answers were */}
        {review && kind === 'maplocate' && def.regions.filter(r => ids.includes(r.id) || Object.values(picks).includes(r.id)).map(r => (
          <text key={`t${r.id}`} x={r.cx} y={r.cy} className="tb-map-label" textAnchor="middle">{answer?.names?.[r.id] ?? r.name}</text>
        ))}
        {kind === 'maplocate' && !review && Object.entries(picks).map(([t, regionId]) => {
          const r = def.regions.find(g => g.id === regionId)
          return r ? <text key={t} x={r.cx} y={r.cy} className="tb-map-pin" textAnchor="middle">{ids.indexOf(t) + 1}</text> : null
        })}

        {kind === 'mapline' && (
          <>
            {review && dots && answer?.from && answer.to && (() => {
              const a = dots.find(d => d.letter === answer.from)!
              const b = dots.find(d => d.letter === answer.to)!
              return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="tb-map-answer" />
            })()}
            {line && <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={`tb-map-line ${lineResult ? (lineResult.start && lineResult.end ? 'good' : 'bad') : ''}`} />}
            {live && <line x1={live.x1} y1={live.y1} x2={live.x2} y2={live.y2} className="tb-map-line live" />}
            {(dots ?? []).map(d => (
              <g key={d.letter}>
                <circle cx={d.x} cy={d.y} r={11} className="tb-dot" />
                <text x={d.x} y={d.y + 4} textAnchor="middle" className="tb-dot-letter">{d.letter}</text>
                {review && answer?.names?.[d.letter] && <text x={d.x + 14} y={d.y + 4} className="tb-map-label left">{answer.names[d.letter]}</text>}
              </g>
            ))}
          </>
        )}
      </svg>

      {!locked && kind === 'maplocate' && (
        <p className="tb-muted">{current ? `Now tap where ${(targets ?? []).find(t => t.id === current)?.name} is on the map.` : 'All placed. Tap a name to move it.'}</p>
      )}
      {!locked && kind === 'mapline' && (
        <div className="tb-actions">
          <button type="button" className="tb-link" disabled={!line} onClick={() => onChange({})}>Clear the line</button>
          <span className="tb-muted">{line ? 'Line drawn. Draw again to replace it.' : 'Press on a dot and drag to another dot.'}</span>
        </div>
      )}
      {review && <p className="tb-muted">{kind === 'maplocate' ? 'Green: right. Red: not quite. The answers are named on the map.' : 'The dashed green line joins the right two places.'}</p>}
    </div>
  )
}
