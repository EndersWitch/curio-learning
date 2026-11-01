import { describe, expect, test } from 'vitest'
import { boundaries, letterOf, motionOf, pieceAt, positionAt, segmentLines, tangentAt, velocityAt } from './motion'
import { newSegment, speedFor, type Segment } from './settings'

const seg = (kind: Segment['kind'], speed = speedFor(kind), duration = 3, dir: Segment['dir'] = 'forward') =>
  newSegment({ kind, speed, duration, dir })

// One of everything: from rest, speeding up, cruising, slowing to a stop, back, and turning around.
const MIXED = [
  seg('rest', 0, 2),
  seg('faster', 2, 3),
  seg('faster', 6, 2),
  seg('forward', 6, 2),
  seg('slower', 2, 4),
  seg('back', 2.5, 3),
  // (cut to 6 by the settings, but motionOf takes any number)
  seg('slower', 0, 2),
  seg('faster', 4, 3, 'back'),
]

const times = (end: number) => Array.from({ length: 200 }, (_, k) => (end * (k + 0.5)) / 200)

describe('the graphs are worked out from one motion', () => {
  test('velocity is the slope of position', () => {
    const m = motionOf(MIXED, 5)
    const h = 1e-4
    for (const t of times(m.end)) {
      expect((positionAt(m, t + h) - positionAt(m, t - h)) / (2 * h)).toBeCloseTo(velocityAt(m, t), 3)
    }
  })

  test('acceleration is the slope of velocity', () => {
    const m = motionOf(MIXED)
    const h = 1e-4
    for (const t of times(m.end)) {
      const p = pieceAt(m, t)!
      if (t - h < p.t0 || t + h > p.t1) continue
      expect((velocityAt(m, t + h) - velocityAt(m, t - h)) / (2 * h)).toBeCloseTo(p.a, 6)
    }
  })

  test('position is the area under velocity, from the start', () => {
    const m = motionOf(MIXED, -3)
    const steps = 6000
    let area = 0
    let t = 0
    const dt = m.end / steps
    for (let k = 0; k < steps; k++, t += dt) area += ((velocityAt(m, t) + velocityAt(m, t + dt)) / 2) * dt
    expect(-3 + area).toBeCloseTo(positionAt(m, m.end), 1)
    for (const p of m.pieces) expect(p.x1 - p.x0).toBeCloseTo(((p.v0 + p.v1) / 2) * (p.t1 - p.t0), 9)
  })

  test('each segment is a straight line on the velocity–time graph', () => {
    const m = motionOf(MIXED)
    for (const p of m.pieces) {
      const mid = (p.t0 + p.t1) / 2
      expect(velocityAt(m, mid)).toBeCloseTo((p.v0 + p.v1) / 2, 9)
      expect(p.a).toBeCloseTo((p.v1 - p.v0) / (p.t1 - p.t0), 9)
    }
  })
})

describe('boundaries', () => {
  test('position never jumps', () => {
    for (const e of boundaries(motionOf(MIXED, 4), 'x')) expect(e.before).toBe(e.after)
  })

  test('speeding up and slowing down carry on from the velocity before them', () => {
    const m = motionOf(MIXED)
    MIXED.forEach((s, i) => {
      if (i && (s.kind === 'faster' || s.kind === 'slower')) expect(m.pieces[i].v0).toBe(m.pieces[i - 1].v1)
    })
  })

  test('velocity jumps only going into a constant velocity or rest', () => {
    const m = motionOf(MIXED)
    boundaries(m, 'v').forEach((e, i) => {
      if (e.before !== e.after) expect(['forward', 'back', 'rest']).toContain(MIXED[i].kind)
    })
  })

  test('speeding up to a speed then holding it carries straight on, and slowing down to 0 stops', () => {
    const m = motionOf([seg('faster'), seg('forward'), seg('slower')])
    expect(m.pieces.map((p) => [p.v0, p.v1])).toEqual([[0, 4], [4, 4], [4, 0]])
    for (const e of boundaries(m, 'v')) expect(e.before).toBe(e.after)
  })

  test('constant velocities are the speed typed, forward or back', () => {
    const v = (kind: Segment['kind'], speed: number) => motionOf([seg(kind, speed)]).pieces[0].v0
    expect([v('forward', 3), v('forward', 1.5), v('back', 5)]).toEqual([3, 1.5, -5])
    expect(v('rest', 7)).toBe(0)
  })

  test('speeding up and slowing down go from the velocity before to the speed typed', () => {
    const m = motionOf([seg('forward', 2), seg('faster', 6, 2), seg('slower', 0, 4)])
    expect(m.pieces.map((p) => [p.v0, p.v1, p.a])).toEqual([[2, 2, 0], [2, 6, 2], [6, 0, -1.5]])
    expect(m.unreached).toEqual([])
  })

  test('a speed it can’t speed up or slow down to keeps the speed it had', () => {
    const m = motionOf([seg('forward', 4), seg('faster', 3), seg('slower', 5), seg('faster', 4)])
    expect(m.unreached).toEqual([1, 2, 3])
    for (const p of m.pieces) expect([p.v0, p.v1]).toEqual([4, 4])
  })

  test('slowing down from rest has nothing to slow, and stays at rest', () => {
    const m = motionOf([seg('rest'), seg('slower')])
    expect(m.unreached).toEqual([1])
    expect(m.pieces[1]).toMatchObject({ v0: 0, v1: 0, a: 0 })
  })

  test('speeding up from rest goes the way it is set; once moving, the way it was going', () => {
    expect(motionOf([seg('faster', 4, 3, 'back')]).pieces[0].v1).toBe(-4)
    const m = motionOf([seg('back', 2), seg('faster', 4, 3, 'forward')])
    expect(m.pieces[1].v1).toBe(-4)
  })
})

describe('letters', () => {
  test('go at every boundary, from A at the start to one past the last segment', () => {
    const m = motionOf(MIXED.slice(0, 4))
    const ends = boundaries(m, 'x')
    expect(ends.map((e) => e.t)).toEqual([0, 2, 5, 7, 9])
    expect(ends.map((_, i) => letterOf(i)).join('')).toBe('ABCDE')
  })

  test('name the segments in the settings panel and answer key', () => {
    const lines = segmentLines(motionOf([seg('faster', 4, 4), seg('rest', 0, 2)]))
    expect(lines).toEqual(['A to B (0–4 s): speeding up from 0 to 4 m/s, a = 1 m/s²; 0 m to 8 m', 'B to C (4–6 s): at rest; stays at 8 m'])
  })
})

describe('the tangent', () => {
  test('touches the position graph and has the velocity there for its slope', () => {
    const m = motionOf([seg('faster', 6, 6)])
    const t = tangentAt(m, 4)
    expect(t).toEqual({ t: 4, x: 8, slope: 4 })
  })

  test('stays within the motion', () => {
    const m = motionOf([seg('forward', 4, 3)])
    expect(tangentAt(m, 40).t).toBe(3)
    expect(tangentAt(m, -1).t).toBe(0)
  })
})
