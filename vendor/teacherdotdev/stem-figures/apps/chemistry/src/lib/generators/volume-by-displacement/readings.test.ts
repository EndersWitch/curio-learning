import { describe, expect, it } from 'vitest'
import { displacedVolume, fixReadings, randomReadings } from './readings'
import { cylinderScale } from './settings'

const cyl10 = cylinderScale({ size: '10' })
const cyl25 = cylinderScale({ size: '25' })
const cyl100 = cylinderScale({ size: '100' })

describe('the before and after readings', () => {
  it('round to the estimated digit', () => {
    expect(fixReadings(cyl100, 41.27, 58.94)).toEqual({ before: 41.3, after: 58.9 })
    expect(fixReadings(cyl10, 4.004, 6.126)).toEqual({ before: 4, after: 6.13 })
  })

  it('push the after reading one step above the before reading when it is not higher', () => {
    expect(fixReadings(cyl100, 40, 40)).toEqual({ before: 40, after: 40.1 })
    expect(fixReadings(cyl100, 40, 12)).toEqual({ before: 40, after: 40.1 })
    expect(fixReadings(cyl25, 10.5, 3)).toEqual({ before: 10.5, after: 10.51 })
  })

  it('stay within the cylinder, leaving room for the after reading', () => {
    expect(fixReadings(cyl100, 100, 100)).toEqual({ before: 99.9, after: 100 })
    expect(fixReadings(cyl100, 20, 140)).toEqual({ before: 20, after: 100 })
    expect(fixReadings(cyl10, -3, 5)).toEqual({ before: 0, after: 5 })
  })
})

describe('the displaced volume', () => {
  it('is the after reading minus the before reading, without float noise', () => {
    expect(displacedVolume(cyl10, { before: 4.1, after: 6.3 })).toBe(2.2)
    expect(displacedVolume(cyl100, { before: 41.3, after: 58.9 })).toBe(17.6)
  })
})

describe('a random pair', () => {
  const sequence = (...values: number[]) => () => values.shift()!

  it('starts 20–60% full and rises 5–30% of capacity', () => {
    expect(randomReadings(cyl100, sequence(0, 0))).toEqual({ before: 20, after: 25 })
    expect(randomReadings(cyl100, sequence(0.5, 0.5))).toEqual({ before: 40, after: 57.5 })
    expect(randomReadings(cyl100, sequence(1, 1))).toEqual({ before: 60, after: 90 })
  })

  it('is always a valid pair', () => {
    for (const scale of [cyl10, cyl25, cyl100]) {
      for (let i = 0; i < 200; i++) {
        const pair = randomReadings(scale)
        expect(fixReadings(scale, pair.before, pair.after)).toEqual(pair)
        expect(pair.after).toBeGreaterThan(pair.before)
      }
    }
  })
})
