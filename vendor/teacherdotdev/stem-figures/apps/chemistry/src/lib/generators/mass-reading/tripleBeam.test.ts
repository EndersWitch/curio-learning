import { describe, expect, it } from 'vitest'
import { randomTripleBeamMass, roundTripleBeam, splitRiders } from './tripleBeam'

describe('triple beam riders', () => {
  it.each([
    [243.57, 200, 40, 3.57],
    [0, 0, 0, 0],
    [9.99, 0, 0, 9.99],
    [300, 300, 0, 0],
    [510.5, 500, 10, 0.5],
    [599.99, 500, 90, 9.99],
    [610, 500, 100, 10],
    [0.07, 0, 0, 0.07],
  ])('%s g sits at %s + %s + %s', (mass, hundreds, tens, front) => {
    expect(splitRiders(mass)).toEqual({ hundreds, tens, front })
  })
})

describe('triple beam mass', () => {
  it('rounds to 0.01 g within 0–610 g', () => {
    expect(roundTripleBeam(243.567)).toBe(243.57)
    expect(roundTripleBeam(700)).toBe(610)
    expect(roundTripleBeam(-1)).toBe(0)
  })

  it('picks random masses readable on the balance', () => {
    for (const r of [0, 0.42, 0.9999]) {
      const m = randomTripleBeamMass(() => r)
      expect(m).toBe(roundTripleBeam(m))
      expect(m).toBeGreaterThan(0)
      expect(m).toBeLessThan(610)
    }
  })
})
