import { describe, expect, it } from 'vitest'
import { drawnArea, objectBounds, placeObject, type Room } from './objects'

// Inside a 10 mL cylinder: 36 units wide, 40 units per mL.
const room = (height: number): Room => ({ left: 0, right: 36, bottom: 500, top: 500 - height })
const deep = room(400)

const heightOf = (b: ReturnType<typeof objectBounds>) => b.bottom - b.top
const widthOf = (b: ReturnType<typeof objectBounds>) => b.right - b.left

describe('an object in the cylinder', () => {
  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s rests on the bottom, inside the tube', (kind) => {
    const b = objectBounds(placeObject(kind, 2, deep, 1500))
    expect(b.bottom).toBeCloseTo(deep.bottom)
    expect(b.left).toBeGreaterThanOrEqual(deep.left)
    expect(b.right).toBeLessThanOrEqual(deep.right)
  })

  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s grows with the displaced volume', (kind) => {
    const small = objectBounds(placeObject(kind, 1, deep, 300))
    const big = objectBounds(placeObject(kind, 1, deep, 700))
    expect(heightOf(big) * widthOf(big)).toBeGreaterThan(heightOf(small) * widthOf(small))
  })

  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s never pokes out of the water or the tube', (kind) => {
    for (const height of [10, 40, 120, 400])
      for (const area of [50, 800, 5000, 40000])
        for (const count of [1, 3, 5]) {
          const b = objectBounds(placeObject(kind, count, room(height), area))
          expect(b.top).toBeGreaterThanOrEqual(room(height).top - 1e-9)
          expect(widthOf(b)).toBeLessThanOrEqual(36 + 1e-9)
        }
  })
})

describe('marbles', () => {
  const marbles = (count: number, area: number, r = deep) => {
    const shape = placeObject('marbles', count, r, area)
    if (shape.kind !== 'marbles') throw new Error('expected marbles')
    return shape.marbles
  }

  it('come in the number asked for, all the same size', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const m = marbles(n, 1500)
      expect(m).toHaveLength(n)
      expect(new Set(m.map((c) => c.r)).size).toBe(1)
    }
  })

  it('never overlap', () => {
    for (const n of [2, 3, 4, 5])
      for (const area of [200, 1500, 20000])
        for (const height of [30, 400]) {
          const m = marbles(n, area, room(height))
          for (let i = 0; i < m.length; i++)
            for (let j = i + 1; j < m.length; j++)
              expect(Math.hypot(m[i].x - m[j].x, m[i].y - m[j].y)).toBeGreaterThanOrEqual(m[i].r + m[j].r - 1e-9)
        }
  })

  it('sit side by side when small enough, stacking otherwise', () => {
    const small = marbles(2, 300)
    expect(small[0].y).toBeCloseTo(small[1].y)
    const big = marbles(2, 1500)
    expect(big[0].x).toBeCloseTo(big[1].x)
  })
})

describe('a rock', () => {
  it('lies wide when small, and stands taller once it is as wide as the tube', () => {
    const small = objectBounds(placeObject('rock', 1, deep, 300))
    expect(widthOf(small)).toBeGreaterThan(heightOf(small))
    const big = placeObject('rock', 1, deep, 1500)
    expect(heightOf(objectBounds(big))).toBeGreaterThan(widthOf(objectBounds(big)))
    expect(drawnArea(big)).toBeCloseTo(1500)
  })
})

describe('a metal cylinder', () => {
  it('stands on end, and grows longer rather than wider once it is as wide as the tube', () => {
    const small = objectBounds(placeObject('cylinder', 1, deep, 300))
    expect(heightOf(small)).toBeGreaterThan(widthOf(small))
    const big = placeObject('cylinder', 1, deep, 4000)
    expect(widthOf(objectBounds(big))).toBeCloseTo(36)
    expect(heightOf(objectBounds(big)) / widthOf(objectBounds(big))).toBeGreaterThan(2)
    expect(drawnArea(big)).toBeCloseTo(4000)
  })
})

describe('the drawn area', () => {
  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s is about the area asked for when there is room', (kind) => {
    expect(drawnArea(placeObject(kind, 2, deep, 600))).toBeCloseTo(600)
  })

  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s is smaller when the water is too shallow to cover it', (kind) => {
    // Under 60% of the area asked for, the page says it was drawn smaller.
    expect(drawnArea(placeObject(kind, 2, room(12), 600))).toBeLessThan(600 * 0.6)
  })
})
