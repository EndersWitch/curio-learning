import { describe, expect, test } from 'vitest'
import { crosses, poleFaceField, traceThrough, type Point } from './field'

// A bar magnet from x = 0 to 150, 46 tall, north at the right-hand end.
const field = poleFaceField([
  { x: 150, y0: -23, y1: 23, q: 1 },
  { x: 0, y0: -23, y1: 23, q: -1 },
])
const insideMagnet = (p: Point) => p.x > -1 && p.x < 151 && p.y > -24 && p.y < 24

describe('poleFaceField', () => {
  test('outside the magnet the field runs from north to south', () => {
    const [bx, by] = field(75, -80)
    expect(bx).toBeLessThan(0) // above the middle it points back toward the south end
    expect(Math.abs(by)).toBeLessThan(Math.abs(bx) * 0.01)
    const [ax] = field(300, 0)
    expect(ax).toBeGreaterThan(0) // straight out of the north end
  })
})

describe('traceThrough', () => {
  // The line passing `d` above the middle of the magnet's top.
  const line = (d: number) =>
    traceThrough(field, { x: 75, y: -23 - d }, { stop: insideMagnet, bounds: { left: -600, right: 750, top: -600, bottom: 600 } })

  test('a line runs from the north face around to the south face', () => {
    const l = line(40)
    expect(l[0].x).toBeGreaterThan(140) // starts at the north (right-hand) end
    expect(l.at(-1)!.x).toBeLessThan(10) // ends at the south end
    expect(Math.min(...l.map((p) => p.y))).toBeCloseTo(-63, 0) // highest over the middle
  })

  test('lines at different heights never cross', () => {
    const lines = [15, 40, 70, 110].map(line)
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) expect(crosses(lines[i], lines[j])).toBe(false)
  })
})
