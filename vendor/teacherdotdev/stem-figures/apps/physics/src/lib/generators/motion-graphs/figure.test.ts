import { describe, expect, test } from 'vitest'
import { CELL } from '$shared/graph/grid'
import { buildMotion, fitAxes, fittedRanges } from './figure'
import { motionOf, positionAt } from './motion'
import { motionSettings, newSegment, type MotionSettings } from './settings'

const from = (query: string) => buildMotion(motionSettings.fromParams(new URLSearchParams(query)))
const make = (over: Partial<MotionSettings> = {}) => buildMotion({ ...motionSettings.defaults, ...over })

/** A panel's point in the graph's own numbers, from the drawing (undoing layoutGrid's px). */
function reader(p: ReturnType<typeof make>['panels'][number]) {
  const g = p.layout.grid
  const { x, y } = p.axes
  return (pt: { x: number; y: number }) => ({ t: x.start + ((pt.x - g.x) / CELL) * x.step, v: y.start + ((g.y + g.h - pt.y) / CELL) * y.step })
}

describe('the settings', () => {
  test('keep the segments in the page address, and read them back', () => {
    const s = { ...motionSettings.defaults, segments: [newSegment({ kind: 'faster', speed: 6, duration: 6, dir: 'back' }), newSegment({ kind: 'rest' })] }
    const query = motionSettings.toQuery(s)
    expect(query).toBe('segments=faster%2C6%2C6%2Cback%3Brest')
    expect(motionSettings.fromParams(new URLSearchParams(query)).segments).toEqual(s.segments)
  })

  test('hold up to six segments, each up to 60 s', () => {
    const s = motionSettings.fromParams(new URLSearchParams(`segments=${Array(8).fill('forward,2,400').join(';')}`))
    expect(s.segments).toHaveLength(6)
    expect(s.segments[0].duration).toBe(60)
  })
})

describe('the graphs', () => {
  test('one by default, the position–time graph; all three stacked on the same time axis', () => {
    expect(make().panels.map((p) => p.view)).toEqual(['x'])
    const f = from('graphs=all')
    expect(f.panels.map((p) => p.view)).toEqual(['x', 'v', 'a'])
    // Lined up on their grids' left edges, the same width, one under the next.
    const left = f.panels.map((p) => p.at.x + p.layout.grid.x)
    expect(new Set(left).size).toBe(1)
    expect(new Set(f.panels.map((p) => p.layout.grid.w)).size).toBe(1)
    for (let i = 1; i < 3; i++) expect(f.panels[i].at.y).toBeGreaterThanOrEqual(f.panels[i - 1].at.y + f.panels[i - 1].layout.height)
  })

  test('only the bottom graph has the time axis title', () => {
    const f = from('graphs=all')
    const flat = f.titles.filter((t) => !t.rotate)
    expect(flat).toHaveLength(1)
    expect(flat[0].y).toBeGreaterThan(f.panels[2].at.y)
    expect(f.titles.filter((t) => t.rotate).map((t) => t.text)).toEqual(['Position (m)', 'Velocity (m/s)', 'Acceleration (m/s^2)'])
  })

  test('fit the motion: every value is on the grid, from 0 to the end of the motion', () => {
    const s = { ...motionSettings.defaults, segments: [newSegment({ kind: 'back', speed: 6, duration: 5 }), newSegment({ kind: 'faster', duration: 4 })], start: 10 }
    const m = motionOf(s.segments, s.start)
    for (const view of ['x', 'v', 'a'] as const) {
      const fit = fitAxes(m, view, 8)
      expect(Number(fit.xTo)).toBeGreaterThanOrEqual(m.end)
      for (const p of m.pieces) {
        const values = view === 'x' ? [p.x0, p.x1] : view === 'v' ? [p.v0, p.v1] : [p.a]
        for (const v of values) {
          expect(v).toBeGreaterThanOrEqual(Number(fit.yFrom))
          expect(v).toBeLessThanOrEqual(Number(fit.yTo))
        }
      }
    }
  })

  test('draw each segment of the position–time graph as the exact parabola', () => {
    const f = make()
    const read = reader(f.panels[0])
    const m = f.motion
    f.panels[0].lines.forEach((line, i) => {
      const p = m.pieces[i]
      const nums = line.d.match(/-?[\d.]+/g)!.map(Number)
      const [a, , b] = p.a ? [{ x: nums[0], y: nums[1] }, { x: nums[2], y: nums[3] }, { x: nums[4], y: nums[5] }] : [{ x: nums[0], y: nums[1] }, null, { x: nums[2], y: nums[3] }]
      expect(read(a).t).toBeCloseTo(p.t0, 1)
      expect(read(a).v).toBeCloseTo(p.x0, 1)
      expect(read(b).t).toBeCloseTo(p.t1, 1)
      expect(read(b).v).toBeCloseTo(p.x1, 1)
      if (p.a) {
        // The Bézier's middle is the parabola's middle.
        const c = { x: nums[2], y: nums[3] }
        const mid = { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 }
        expect(read(mid).v).toBeCloseTo(positionAt(m, (p.t0 + p.t1) / 2), 1)
      }
    })
  })

  test('join a jump in velocity with a dotted line, and never one in position', () => {
    const f = from('graphs=all&segments=forward,4,3;rest,0,2;back')
    const [x, v, a] = f.panels
    expect(x.joins).toEqual([])
    expect(v.joins).toHaveLength(2)
    // Every segment is a constant velocity, so acceleration is zero throughout.
    expect(a.joins).toEqual([])
    const read = reader(v)
    const j = v.joins[0]
    expect([read({ x: j.x1, y: j.y1 }).v, read({ x: j.x2, y: j.y2 }).v].map((n) => Math.round(n))).toEqual([4, 0])
  })

  test('in each segment’s own line style when asked', () => {
    expect(new Set(make().panels[0].lines.map((l) => l.dash)).size).toBe(1)
    const styled = make({ styles: true }).panels[0].lines
    expect(new Set(styled.map((l) => l.dash)).size).toBe(styled.length)
  })
})

describe('letters', () => {
  test('mark every boundary on every graph, A to one past the last segment', () => {
    const f = from('graphs=all&letters=1')
    for (const p of f.panels) expect(p.letters.map((l) => l.text).join('')).toBe('ABCDE')
  })

  test('sit on a dot where the line runs on, and beside the join where it jumps', () => {
    const f = from('graphs=all&letters=1&segments=forward,4,3;rest,0,2;back')
    expect(f.panels[0].dots).toHaveLength(4)
    // Velocity jumps at B and C, so only A and D have dots.
    expect(f.panels[1].dots).toHaveLength(2)
  })

  test('keep off the lines and each other', () => {
    const f = make({ letters: true })
    const boxes = f.panels[0].letters.map((l) => ({ x0: l.x - 12, x1: l.x + 12, y0: l.y - 14, y1: l.y + 4 }))
    for (let i = 1; i < boxes.length; i++) {
      const a = boxes[i - 1]
      const b = boxes[i]
      expect(a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1, `${i}`).toBe(false)
    }
  })

  test('are off unless asked for', () => {
    expect(make().panels[0].letters).toEqual([])
  })
})

describe('the tangent', () => {
  test('touches the position–time graph with the velocity there as its slope', () => {
    const f = from('segments=faster,6,6&tangent=1&tangentAt=4')
    const p = f.panels[0]
    const read = reader(p)
    const t = p.tangent!
    expect(read(t.at).t).toBeCloseTo(4, 2)
    expect(read(t.at).v).toBeCloseTo(8, 2)
    const a = read({ x: t.line.x1, y: t.line.y1 })
    const b = read({ x: t.line.x2, y: t.line.y2 })
    expect((b.v - a.v) / (b.t - a.t)).toBeCloseTo(4, 1)
  })

  test('is only on a position–time graph', () => {
    expect(from('graphs=vt&tangent=1').panels[0].tangent).toBeNull()
    expect(from('graphs=all&tangent=1').panels.map((p) => !!p.tangent)).toEqual([true, false, false])
  })
})

describe('numbers and gridlines', () => {
  test('hiding the numbers leaves only the shape', () => {
    const f = make({ numbers: false })
    expect(f.panels[0].layout.numbers).toEqual([])
    expect(f.panels[0].layout.vLines.length).toBeGreaterThan(0)
  })

  test('without gridlines, the axes have arrows, and tick marks where the numbers are', () => {
    const f = make({ gridlines: false })
    const p = f.panels[0]
    expect(p.layout.vLines).toEqual([])
    expect(p.layout.hLines).toEqual([])
    expect(p.grid.xEndCap).toBe('triangle')
    expect(p.ticks.length).toBeGreaterThan(0)
    expect(make({ gridlines: false, numbers: false }).panels[0].ticks).toEqual([])
  })
})

describe('ranges the teacher sets', () => {
  const RANGES = 'ranges=1&tFrom=0&tTo=10&tStep=1&xFrom=0&xTo=20&xStep=2'

  test('are kept in the page address and read back', () => {
    const s = motionSettings.fromParams(new URLSearchParams(`graphs=all&${RANGES}&vFrom=-2&vTo=6&vStep=0.5&aFrom=-3&aTo=3&aStep=1`))
    const query = motionSettings.toQuery(s)
    expect(motionSettings.fromParams(new URLSearchParams(query))).toEqual(s)
    expect(s).toMatchObject({ ranges: true, tTo: 10, xTo: 20, vFrom: -2, vStep: 0.5, aFrom: -3 })
  })

  test('are left out of the address, and change nothing, while off', () => {
    expect(motionSettings.toQuery(motionSettings.defaults)).toBe('')
    expect(from('graphs=all&letters=1&tTo=3&xTo=2')).toEqual(from('graphs=all&letters=1'))
  })

  test('set each graph’s range up its side, with one time range for them all', () => {
    const f = from(`graphs=all&${RANGES}&vFrom=-2&vTo=6&vStep=1&aFrom=-3&aTo=3&aStep=1`)
    for (const p of f.panels) expect([p.axes.x.start, p.axes.x.step, p.axes.x.blocks]).toEqual([0, 1, 10])
    expect(f.panels.map((p) => [p.axes.y.start, p.axes.y.step, p.axes.y.blocks])).toEqual([[0, 2, 10], [-2, 1, 8], [-3, 1, 6]])
  })

  test('cut the lines cleanly at the grid’s edges when the motion runs past them', () => {
    // The default motion runs 15 s and reaches 32 m; these ranges stop at 10 s and 20 m.
    const f = from(`letters=1&tangent=1&tangentAt=13&${RANGES}`)
    const p = f.panels[0]
    const g = p.layout.grid
    for (const l of p.lines) {
      const nums = l.d.match(/-?[\d.]+/g)!.map(Number)
      for (let k = 0; k < nums.length; k += 2) {
        expect(nums[k]).toBeGreaterThanOrEqual(g.x - 0.01)
        expect(nums[k]).toBeLessThanOrEqual(g.x + g.w + 0.01)
        expect(nums[k + 1]).toBeGreaterThanOrEqual(g.y - 0.01)
        expect(nums[k + 1]).toBeLessThanOrEqual(g.y + g.h + 0.01)
      }
    }
    // A and B (4 s, 8 m) are on the grid; C (8 s, 24 m), D and E are past it, and so is the tangent at 13 s.
    expect(p.letters.map((l) => l.text)).toEqual(['A', 'B'])
    expect(p.tangent).toBeNull()
    // The line still reaches the edge: the cut end is on the top of the grid, where it passes 20 m.
    const top = Math.min(...p.lines.flatMap((l) => l.d.match(/,-?[\d.]+/g)!.map((n) => Number(n.slice(1)))))
    expect(top).toBeCloseTo(g.y, 1)
  })

  test('cut a jump in velocity at the grid’s edge', () => {
    const f = from('graphs=vt&segments=forward,6,3;rest&ranges=1&tFrom=0&tTo=6&tStep=1&vFrom=0&vTo=4&vStep=1')
    const p = f.panels[0]
    expect(p.joins).toHaveLength(1)
    expect(p.joins[0].y2).toBeCloseTo(p.layout.grid.y + p.layout.grid.h, 1)
    expect(p.joins[0].y1).toBeCloseTo(p.layout.grid.y, 1)
  })

  test('that can’t be used are explained, and the graph falls back to one that can', () => {
    const f = from('ranges=1&tFrom=5&tTo=2&tStep=1&xStep=0.01')
    expect(f.problems.tTo).toMatch(/end after it starts/)
    expect(f.problems.xStep).toMatch(/blocks/)
    expect(f.panels[0].lines.length).toBeGreaterThan(0)
  })

  test('are kept within what the settings allow', () => {
    const s = motionSettings.fromParams(new URLSearchParams('ranges=1&tStep=-3&xTo=99999&vFrom=abc'))
    expect(s.tStep).toBe(0.01)
    expect(s.xTo).toBe(1000)
    expect(s.vFrom).toBe(motionSettings.defaults.vFrom)
  })

  test('start from the ones fitted to the motion, so the figure doesn’t change', () => {
    const s = { ...motionSettings.defaults, graphs: 'all' as const, letters: true }
    const fitted = buildMotion({ ...s, ranges: true, ...fittedRanges(s) })
    expect(fitted.panels.map((p) => p.lines)).toEqual(buildMotion(s).panels.map((p) => p.lines))
  })
})

describe('titles', () => {
  test('a chart title on top, written or a blank line', () => {
    expect(make().chartTitle).toBeNull()
    expect(make({ title: { mode: 'text', text: 'A cart' } }).chartTitle?.text).toBe('A cart')
    expect(make({ title: { mode: 'blank', text: '' } }).chartBlank).not.toBeNull()
  })

  test('an axis title left blank is a line for students; one turned off is gone', () => {
    const blank = make({ xTitle: { mode: 'blank', text: 'Position (m)' } })
    expect(blank.titles.filter((t) => t.rotate)).toEqual([])
    expect(blank.panels[0].layout.blanks).toHaveLength(1)
    expect(make({ timeTitle: { mode: 'none', text: 'Time (s)' } }).titles.filter((t) => !t.rotate)).toEqual([])
  })
})
