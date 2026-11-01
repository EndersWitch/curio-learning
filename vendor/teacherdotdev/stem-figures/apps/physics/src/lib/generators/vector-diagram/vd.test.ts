import { describe, expect, test } from 'vitest'
import { searchGenerators } from '$lib/generators'
import { crosses, labelBox, overlaps } from '$lib/shared/layout'
import { newVector, vectorSettings, type Vector, type VectorSettings } from './settings'
import { buildVectorDiagram, resultantOf, SQUARE } from './vd'

const make = (over: Partial<VectorSettings> = {}) => buildVectorDiagram({ ...vectorSettings.defaults, ...over })
const vec = (magnitude: number, angle: number, over: Partial<Vector> = {}, index = 0): Vector => ({ ...newVector(index, magnitude, angle), ...over })
type Seg = { x1: number; y1: number; x2: number; y2: number }
const length = (v: Seg) => Math.hypot(v.x2 - v.x1, v.y2 - v.y1)
const angleOf = (v: Seg) => ((Math.atan2(v.y1 - v.y2, v.x2 - v.x1) * 180) / Math.PI + 360) % 360

describe('the default figure', () => {
  test('is 4 squares right then 3 up, with a dashed 5-square resultant on a grid', () => {
    const f = make()
    expect(f.arrows.map((a) => [a.which, a.style, a.label.text])).toEqual([
      [0, 'solid', 'A'],
      [1, 'solid', 'B'],
      ['resultant', 'dashed', 'R'],
    ])
    const [a, b, r] = f.arrows
    expect(length(a.v)).toBeCloseTo(4 * SQUARE)
    expect(length(b.v)).toBeCloseTo(3 * SQUARE)
    expect(length(r.v)).toBeCloseTo(5 * SQUARE)
    expect(angleOf(r.v)).toBeCloseTo(36.87, 1)
    expect(f.grid.length).toBeGreaterThan(0)
  })
})

describe('head to tail', () => {
  test('each tail is the tip before it, and the resultant runs from the first tail to the last tip', () => {
    const f = make({ vectors: [vec(3, 20), vec(2.5, 110), vec(4, 250)] })
    const [a, b, c, r] = f.arrows
    for (const [before, after] of [[a, b], [b, c]]) {
      expect(after.v.x1).toBeCloseTo(before.v.x2)
      expect(after.v.y1).toBeCloseTo(before.v.y2)
    }
    expect([r.v.x1, r.v.y1]).toEqual([f.origin.x, f.origin.y])
    expect(r.v.x2).toBeCloseTo(c.v.x2)
    expect(r.v.y2).toBeCloseTo(c.v.y2)
  })

  test('the resultant is the sum of the vectors', () => {
    const vectors = [vec(3, 20), vec(2.5, 110), vec(4, 250)]
    const { magnitude, angle } = resultantOf({ ...vectorSettings.defaults, vectors })
    const r = make({ vectors }).arrows.at(-1)!
    expect(length(r.v) / SQUARE).toBeCloseTo(magnitude, 1)
    expect(angleOf(r.v)).toBeCloseTo(angle, 0)
  })

  test('vectors point where they are set, or mirrored', () => {
    expect(angleOf(make({ vectors: [vec(3, 30)] }).arrows[0].v)).toBeCloseTo(30)
    expect(angleOf(make({ vectors: [vec(3, 30)], mirror: true }).arrows[0].v)).toBeCloseTo(150)
  })

  test('an arrow left off still takes its place in the chain, and its label goes with it', () => {
    const f = make({ vectors: [vec(4, 0), vec(3, 90, { style: 'none' }, 1)], resultant: 'solid' })
    expect(f.arrows.map((a) => a.which)).toEqual([0, 'resultant'])
    const r = f.arrows[1]
    expect(length(r.v)).toBeCloseTo(5 * SQUARE)
    expect(f.arrows.every((a) => a.label.text !== 'B')).toBe(true)
  })

  test('the resultant can be left off', () => {
    expect(make({ resultant: 'none' }).arrows.map((a) => a.which)).toEqual([0, 1])
  })

  test('vectors that cancel have no resultant', () => {
    expect(resultantOf({ ...vectorSettings.defaults, vectors: [vec(3, 0), vec(3, 180)] }).magnitude).toBe(0)
    expect(make({ vectors: [vec(3, 0), vec(3, 180)] }).arrows.map((a) => a.which)).toEqual([0, 1])
  })

  test('an empty list draws an empty figure', () => {
    expect(make({ vectors: [] }).arrows).toEqual([])
  })
})

describe('labels', () => {
  test('go beside each arrow, on the side away from the rest of the figure', () => {
    const [a, b, r] = make().arrows
    // A along the bottom is labeled below, B up the right side to its right, R above and to the left.
    expect(a.labelAt.y).toBeGreaterThan(a.v.y1)
    expect(b.labelAt.x).toBeGreaterThan(b.v.x1)
    const mid = { x: (r.v.x1 + r.v.x2) / 2, y: (r.v.y1 + r.v.y2) / 2 }
    expect(r.labelAt.x).toBeLessThan(mid.x)
    expect(r.labelAt.y).toBeLessThan(mid.y)
  })

  test("don't land on each other or on any arrow, even crowded", () => {
    for (const f of [
      make({ vectors: [vec(4, 30, { arc: true, parts: true }), vec(3, 120, { arc: true, from: 'v' }, 1), vec(2, 200, {}, 2)], resultantArc: true, resultantParts: true, axes: true }),
      make({ vectors: [vec(1, 10), vec(1, 20, {}, 1), vec(1, 30, {}, 2)] }),
    ]) {
      const boxes = [
        ...f.arrows.map((a) => labelBox(a.labelAt, a.label)),
        ...f.marks.map((m) => labelBox(m.labelAt, m.label)),
        ...f.components.flatMap((c) => [labelBox(c.xLabelAt, c.xLabel), labelBox(c.yLabelAt, c.yLabel)]),
      ]
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false)
      for (const a of f.arrows) for (const l of f.arrows) expect(crosses(a.v, labelBox(l.labelAt, l.label))).toBe(false)
    }
  })
})

describe('angle marks and components', () => {
  test('an arc at the tail spans the angle from the nearer half of its reference line', () => {
    for (const angle of [30, 150, 210, 330]) {
      const f = make({ vectors: [vec(4, angle, { arc: true })], resultant: 'none' })
      const [m] = f.marks
      const from = angleOf({ x1: m.center.x, y1: m.center.y, x2: m.arc.from.x, y2: m.arc.from.y })
      const to = angleOf({ x1: m.center.x, y1: m.center.y, x2: m.arc.to.x, y2: m.arc.to.y })
      expect([0, 180]).toContain(Math.round(from) % 360)
      expect(to).toBeCloseTo(angle, 0)
      expect(Math.min(Math.abs(to - from), 360 - Math.abs(to - from))).toBeCloseTo(30, 0)
    }
  })

  test("the first vector's and the resultant's arcs from the same line don't lie on each other", () => {
    const f = make({ vectors: [vec(4, 20, { arc: true }), vec(3, 90, {}, 1)], resultantArc: true })
    const [a, r] = f.marks
    expect(a.center).toEqual(r.center)
    expect(r.arc.r).toBeGreaterThan(a.arc.r)
  })

  test('components run head to tail from the tail, along the horizontal then up to the tip, and add up to the arrow', () => {
    for (const angle of [30, 150, 210, 330]) {
      const f = make({ vectors: [vec(4, angle, { parts: true })], resultant: 'none' })
      const [c] = f.components
      const [a] = f.arrows
      expect(c.x.y1).toBeCloseTo(c.x.y2)
      expect(c.y.x1).toBeCloseTo(c.y.x2)
      expect([c.x.x1, c.x.y1]).toEqual([a.v.x1, a.v.y1])
      expect([c.x.x2, c.x.y2]).toEqual([c.y.x1, c.y.y1])
      expect(c.y.x2).toBeCloseTo(a.v.x2)
      expect(c.y.y2).toBeCloseTo(a.v.y2)
    }
  })

  test("a reference line doesn't lie on a horizontal component from the same tail", () => {
    const f = make({ vectors: [vec(4, 30, { parts: true }), vec(3, 120, {}, 1)], resultantArc: true })
    const [m] = f.marks
    const [c] = f.components
    expect(m.ref.x1).toBeGreaterThanOrEqual(c.x.x2)
  })

  test('a vertical reference line starts at the tail, where no component runs', () => {
    const f = make({ vectors: [vec(4, 60, { parts: true, arc: true, from: 'v' })], resultant: 'none' })
    const [m] = f.marks
    const [a] = f.arrows
    expect([m.ref.x1, m.ref.y1]).toEqual([a.v.x1, a.v.y1])
  })

  test('none for an arrow along an axis', () => {
    const f = make({ vectors: [vec(4, 0, { arc: true, parts: true }), vec(3, 90, { arc: true, parts: true }, 1)] })
    expect(f.marks).toEqual([])
    expect(f.components).toEqual([])
  })

  test("the resultant's are drawn even when its arrow is left off, to ask for it from its parts", () => {
    const f = make({ resultant: 'none', resultantParts: true, resultantArc: true })
    expect(f.components.map((c) => c.which)).toEqual(['resultant'])
    expect(f.marks.map((m) => m.which)).toEqual(['resultant'])
  })
})

describe('grid and axes', () => {
  test('grid lines are a square apart and pass through the origin', () => {
    const f = make()
    const vertical = f.grid.filter((g) => g.x1 === g.x2).map((g) => g.x1)
    const horizontal = f.grid.filter((g) => g.y1 === g.y2).map((g) => g.y1)
    for (const xs of [vertical, horizontal]) for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(SQUARE)
    expect(vertical.some((x) => Math.abs(x - f.origin.x) < 1e-6)).toBe(true)
    expect(horizontal.some((y) => Math.abs(y - f.origin.y) < 1e-6)).toBe(true)
    // edge to edge
    expect(vertical[0]).toBeCloseTo(1)
    expect(vertical.at(-1)).toBeCloseTo(f.width - 1)
  })

  test('no grid when it is off', () => {
    expect(make({ grid: false }).grid).toEqual([])
  })

  test('axes cross at the first tail and run past every arrow', () => {
    const f = make({ axes: true, vectors: [vec(3, 150), vec(4, 60, {}, 1)] })
    const ax = f.axes!
    expect(ax.x.y1).toBe(f.origin.y)
    expect(ax.y.x1).toBe(f.origin.x)
    const xs = f.arrows.flatMap((a) => [a.v.x1, a.v.x2])
    const ys = f.arrows.flatMap((a) => [a.v.y1, a.v.y2])
    expect(ax.x.x1).toBeLessThan(Math.min(...xs))
    expect(ax.x.x2).toBeGreaterThan(Math.max(...xs))
    expect(ax.y.y2).toBeLessThan(Math.min(...ys))
    expect(ax.y.y1).toBeGreaterThan(Math.max(...ys))
    expect(make().axes).toBeNull()
  })

  test('everything fits in the figure, with or without the grid', () => {
    for (const grid of [true, false]) {
      const f = make({ grid, axes: true, vectors: [vec(12, 200, { parts: true, arc: true }), vec(12, 300, {}, 1), vec(0.5, 45, {}, 2)], resultantArc: true })
      for (const p of f.extent) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(f.width)
        expect(p.y).toBeLessThanOrEqual(f.height)
      }
    }
  })
})

describe('settings', () => {
  test('round-trip through the address', () => {
    const s = {
      ...vectorSettings.defaults,
      vectors: [vec(2.5, 37, { style: 'dashed' as const, arc: true, from: 'v' as const }), vec(6, 143, { style: 'none' as const, parts: true }, 1)],
      resultant: 'solid' as const,
      resultantParts: true,
      grid: false,
      axes: true,
    }
    expect(vectorSettings.fromParams(new URLSearchParams(vectorSettings.toQuery(s)))).toEqual(s)
  })

  test('the list is capped at 3 vectors', () => {
    expect(vectorSettings.clean({ vectors: Array.from({ length: 5 }, () => vec(1, 0)) }).vectors).toHaveLength(3)
  })
})

describe('the directory', () => {
  test('vector searches find it', () => {
    for (const q of ['vector', 'head to tail', 'resultant', 'tip to tail']) {
      expect(searchGenerators(q).map((g) => g.id)).toContain('vector-diagram')
    }
  })
})
