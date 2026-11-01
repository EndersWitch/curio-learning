import { describe, expect, it } from 'vitest'
import { column, crosses, hitsEllipse, stack, textWidth, wrap } from './labels'

describe('a column of labels', () => {
  it('sits each label level with its target when there is room', () => {
    expect(stack([{ target: 10, height: 20 }, { target: 100, height: 20 }], 0, 200, 5)).toEqual([10, 100])
  })

  it('spreads crowded labels evenly round their targets, without overlapping', () => {
    const ys = stack([{ target: 50, height: 20 }, { target: 52, height: 20 }, { target: 54, height: 20 }], -100, 300, 4)
    expect(ys[1] - ys[0]).toBeCloseTo(24)
    expect(ys[2] - ys[1]).toBeCloseTo(24)
    expect((ys[0] + ys[2]) / 2).toBeCloseTo(52)
  })

  it('keeps labels within the column where they fit', () => {
    const ys = stack([{ target: -50, height: 20 }, { target: -40, height: 20 }], 0, 200, 4)
    expect(ys).toEqual([10, 34])
  })

  it('never crosses two leader lines', () => {
    // The deeper target is a little higher, but its leader would cut across the other's.
    const placed = column(
      [
        { key: 'deep', anchor: [300, 100], height: 20 },
        { key: 'shallow', anchor: [20, 104], height: 20 },
      ],
      0,
      0,
      400,
      4,
    )
    const [a, b] = placed
    expect(crosses(a.start, a.anchor, b.start, b.anchor)).toBe(false)
  })
})

describe('geometry', () => {
  it('tells when segments cross', () => {
    expect(crosses([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true)
    expect(crosses([0, 0], [10, 0], [0, 5], [10, 5])).toBe(false)
  })

  it('tells when a segment passes through an ellipse, turned or not', () => {
    const e = { at: [50, 50] as [number, number], rx: 20, ry: 5, angle: 0 }
    expect(hitsEllipse([0, 50], [100, 50], e)).toBe(true)
    expect(hitsEllipse([50, 0], [50, 40], e)).toBe(false)
    expect(hitsEllipse([50, 0], [50, 40], { ...e, angle: 90 })).toBe(true)
  })
})

describe('label text', () => {
  it('wraps long names at spaces', () => {
    expect(wrap('Rough endoplasmic reticulum', 17, 170)).toEqual(['Rough endoplasmic', 'reticulum'])
    expect(wrap('Nucleus', 17, 170)).toEqual(['Nucleus'])
  })

  it('measures wide letters wider', () => {
    expect(textWidth('mmm', 10)).toBeGreaterThan(textWidth('iii', 10))
  })
})
