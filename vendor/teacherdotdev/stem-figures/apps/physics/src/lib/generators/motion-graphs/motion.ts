// The motion a list of segments describes, worked out from its velocity–time
// graph: each segment is a straight line there, and position and
// acceleration follow from it exactly (position is the area under the line,
// acceleration its slope), so the three graphs always match.
//
// Each segment's speed is typed: the one it moves at, or the one it speeds up
// or slows down to. Speeding up and slowing down start from the velocity the
// segment before ended at, so velocity only jumps going into a constant
// velocity or rest, the instant changes textbook graphs draw.

import type { Segment } from './settings'

/** A segment's motion: its times, velocities and positions at both ends, and its acceleration. */
export interface Piece {
  t0: number
  t1: number
  v0: number
  v1: number
  x0: number
  x1: number
  a: number
}

export interface Motion {
  pieces: Piece[]
  /** When the motion ends. */
  end: number
  /**
   * Segments that can't reach their speed, drawn keeping the speed they start
   * with (by index): speeding up to a speed no faster than that, or slowing
   * down to one no slower.
   */
  unreached: number[]
}

export function motionOf(segments: Segment[], start = 0): Motion {
  const pieces: Piece[] = []
  const unreached: number[] = []
  let t = 0
  let x = start
  let v = 0
  segments.forEach((seg, i) => {
    let v0 = v
    let v1 = v
    if (seg.kind === 'rest') v0 = v1 = 0
    else if (seg.kind === 'forward') v0 = v1 = seg.speed
    else if (seg.kind === 'back') v0 = v1 = -seg.speed
    else if (seg.kind === 'faster' ? seg.speed <= Math.abs(v) : seg.speed >= Math.abs(v)) unreached.push(i)
    // Speeding up from rest goes the way it is set; otherwise it keeps going
    // the way it was. Speeds are never negative, so slowing down stops at rest
    // rather than turning around.
    else v1 = (v === 0 ? (seg.dir === 'back' ? -1 : 1) : Math.sign(v)) * seg.speed
    const d = seg.duration
    const x1 = x + ((v0 + v1) / 2) * d
    pieces.push({ t0: t, t1: t + d, v0, v1, x0: x, x1, a: (v1 - v0) / d })
    t += d
    x = x1
    v = v1
  })
  return { pieces, end: t, unreached }
}

/** The piece moving at time t: the later one at a boundary, the last one at the end. */
export function pieceAt(m: Motion, t: number): Piece | null {
  return m.pieces.find((p) => t < p.t1) ?? m.pieces.at(-1) ?? null
}

/** Where it is at time t. */
export function positionAt(m: Motion, t: number): number {
  const p = pieceAt(m, t)
  if (!p) return 0
  const u = Math.min(Math.max(t, p.t0), p.t1) - p.t0
  return p.x0 + p.v0 * u + (p.a * u * u) / 2
}

/** Its velocity at time t. */
export function velocityAt(m: Motion, t: number): number {
  const p = pieceAt(m, t)
  if (!p) return 0
  return p.v0 + p.a * (Math.min(Math.max(t, p.t0), p.t1) - p.t0)
}

/** The tangent to the position–time graph at time t: the point it touches, and its slope, the velocity. */
export function tangentAt(m: Motion, t: number) {
  const at = Math.min(Math.max(t, 0), m.end)
  return { t: at, x: positionAt(m, at), slope: velocityAt(m, at) }
}

/**
 * What a graph's value is just before and just after each boundary, from
 * the start (A) to the end: equal where the graph is continuous there.
 */
export function boundaries(m: Motion, view: 'x' | 'v' | 'a') {
  const before = (p: Piece) => (view === 'x' ? p.x1 : view === 'v' ? p.v1 : p.a)
  const after = (p: Piece) => (view === 'x' ? p.x0 : view === 'v' ? p.v0 : p.a)
  const { pieces } = m
  return [
    ...pieces.map((p, i) => ({ t: p.t0, before: i ? before(pieces[i - 1]) : after(p), after: after(p) })),
    ...(pieces.length ? [{ t: m.end, before: before(pieces.at(-1)!), after: before(pieces.at(-1)!) }] : []),
  ]
}

/** The letter at boundary i: A at the start, then B, C… */
export const letterOf = (i: number) => String.fromCharCode(65 + i)

/** A number as the answer key writes it: at most two decimals, with a real minus sign. */
export const numberText = (n: number) => String(Math.round(n * 100) / 100 || 0).replace('-', '−')

/** What each segment does, in numbers, from one letter to the next: for the settings panel and the answer key. */
export function segmentLines(m: Motion): string[] {
  const n = numberText
  return m.pieces.map((p, i) => {
    const what =
      p.a === 0
        ? p.v0 === 0
          ? 'at rest'
          : `constant velocity ${n(p.v0)} m/s`
        : `${Math.abs(p.v1) > Math.abs(p.v0) ? 'speeding up' : 'slowing down'} from ${n(p.v0)} to ${n(p.v1)} m/s, a = ${n(p.a)} m/s²`
    const where = p.x0 === p.x1 ? `stays at ${n(p.x0)} m` : `${n(p.x0)} m to ${n(p.x1)} m`
    return `${letterOf(i)} to ${letterOf(i + 1)} (${n(p.t0)}–${n(p.t1)} s): ${what}; ${where}`
  })
}
