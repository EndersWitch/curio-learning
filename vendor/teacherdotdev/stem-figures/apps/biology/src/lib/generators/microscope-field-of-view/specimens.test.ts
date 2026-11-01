import { describe, expect, it } from 'vitest'
import { ROW_STAGGER, arrange, seededRandom, wholeCount, type ArrangeOptions, type LooseItem } from './specimens'

const base: ArrangeOptions = { specimen: 'onion', size: 300, field: 1800, arrangement: 'scatter', count: 8, edges: true, seed: 1 }

describe('seeded random numbers', () => {
  it('are the same for the same seed', () => {
    const a = seededRandom(5)
    const b = seededRandom(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(seededRandom(6)()).not.toBe(seededRandom(5)())
  })

  it('give the same slide for the same settings', () => {
    expect(arrange({ ...base, specimen: 'cheek' })).toEqual(arrange({ ...base, specimen: 'cheek' }))
    expect(arrange(base)).toEqual(arrange(base))
    expect(arrange({ ...base, seed: 2 })).not.toEqual(arrange(base))
  })
})

describe('tissue', () => {
  const cellsOf = (o: ArrangeOptions) => {
    const a = arrange(o)
    if (a.kind !== 'tissue') throw new Error('not tissue')
    return a.cells
  }
  /** where the middle row's end walls cross the diameter */
  const middleWalls = (o: ArrangeOptions) =>
    cellsOf(o)
      .filter((c) => c.corners[0][1] < 0 && c.corners[3][1] > 0)
      .flatMap((c) => [(c.corners[0][0] + c.corners[3][0]) / 2, (c.corners[1][0] + c.corners[2][0]) / 2])

  it('lays the middle row across the diameter from its left edge, one cell length apart', () => {
    for (const [size, field] of [[300, 1800], [400, 1600], [90, 450]]) {
      const walls = [...new Set(middleWalls({ ...base, size, field }).map((x) => Math.round(x * 100) / 100))]
      expect(walls).toContain(-field / 2)
      const inside = walls.filter((x) => x >= -field / 2 - 1e-6 && x <= field / 2 + 1e-6)
      // n cells across the field have n + 1 walls on it
      expect(inside.length).toBe(field / size + 1)
      for (const x of inside) expect(((x + field / 2) / size) % 1).toBeCloseTo(0, 6)
    }
  })

  it('fills the field, with cells the right shape', () => {
    const cells = cellsOf(base)
    expect(cells.length).toBeGreaterThan(50)
    for (const c of cells) expect(c.corners[3][1] - c.corners[0][1]).toBeCloseTo(75)
    const elodea = cellsOf({ ...base, specimen: 'elodea', size: 100, field: 450 })
    expect(elodea.every((c) => c.chloroplasts.length > 8 && !c.nucleus)).toBe(true)
  })

  it('counts a cell whole only when every corner is inside the field', () => {
    const cells = cellsOf(base)
    const R = base.field / 2
    for (const c of cells) expect(c.whole).toBe(c.corners.every(([x, y]) => x * x + y * y <= R * R))
    expect(cells.some((c) => !c.whole)).toBe(true)
  })
})

describe('loose specimens', () => {
  const itemsOf = (o: ArrangeOptions) => {
    const a = arrange(o)
    if (a.kind !== 'loose') throw new Error('not loose')
    return a
  }
  const cheek = { ...base, specimen: 'cheek' as const, size: 60, field: 450, count: 6 }

  it('lie whole in the field as many as asked, none touching', () => {
    const { items, missing } = itemsOf(cheek)
    expect(missing).toBe(0)
    const whole = items.filter((i) => i.whole)
    expect(whole.length).toBe(6)
    for (const i of whole) expect(Math.hypot(i.x, i.y) + 0.54 * cheek.size).toBeLessThanOrEqual(cheek.field / 2)
    for (const a of items) for (const b of items) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1.08 * cheek.size)
  })

  it('put one near the middle, so a higher power still shows it', () => {
    const [first] = itemsOf(cheek).items
    expect(Math.hypot(first.x, first.y)).toBeLessThan(0.25 * cheek.size)
  })

  it('cut more off at the edge, plainly, when asked', () => {
    const cut = itemsOf(cheek).items.filter((i) => !i.whole)
    expect(cut.length).toBeGreaterThan(0)
    for (const i of cut) expect(Math.hypot(i.x, i.y) + 0.39 * i.size).toBeGreaterThan(cheek.field / 2)
    expect(itemsOf({ ...cheek, edges: false }).items.every((i) => i.whole)).toBe(true)
  })

  it('say how many found no room', () => {
    const crowded = itemsOf({ ...cheek, size: 200, count: 20 })
    expect(crowded.items.filter((i) => i.whole).length + crowded.missing).toBe(20)
    expect(crowded.missing).toBeGreaterThan(0)
  })

  it('in a row, lie end to end across the diameter from its left edge', () => {
    const row = itemsOf({ ...base, specimen: 'paramecium', size: 225, field: 1800, arrangement: 'row' }).items
    expect(row.length).toBe(8)
    expect(row.every((i: LooseItem) => i.whole && i.angle === 0 && i.size === 225)).toBe(true)
    // above and below the line by turns, clear of each other
    expect(row.map((i) => Math.sign(i.y))).toEqual([-1, 1, -1, 1, -1, 1, -1, 1])
    for (const i of row) expect(Math.abs(i.y)).toBeCloseTo(ROW_STAGGER * 225)
    expect(2 * ROW_STAGGER).toBeGreaterThan(0.3)
    expect(row[0].x - 225 / 2).toBeCloseTo(-900)
    expect(row[7].x + 225 / 2).toBeCloseTo(900)
    // 4.5 fit: the fifth is cut off by the far edge
    const half = itemsOf({ ...base, specimen: 'circles', size: 400, field: 1800, arrangement: 'row' }).items
    expect(half.length).toBe(5)
    expect(half.every((i) => i.y === 0)).toBe(true)
    expect(wholeCount({ kind: 'loose', items: half, missing: 0 })).toBe(4)
  })
})

describe('the letter e', () => {
  it('is one specimen, its height the size', () => {
    const e = arrange({ ...base, specimen: 'letter', size: 1500 })
    expect(e).toEqual({ kind: 'letter', size: 1500 })
    expect(wholeCount(e)).toBe(1)
  })
})
