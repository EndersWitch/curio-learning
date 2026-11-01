import { describe, expect, it } from 'vitest'
import { CAPACITIES, estimatedDecimals, gramsText, inGrams, maxForce, newtonsText, randomForce, springScale, springLayout, tidyForce, tidyZero } from './scale'
import { answerLines, springScaleSettings } from './settings'

describe('spring scales', () => {
  it('read one digit past the smallest mark', () => {
    expect([0.01, 0.05, 0.1, 0.2, 0.5, 1, 5, 10, 20, 50].map(estimatedDecimals)).toEqual([3, 3, 2, 2, 2, 1, 1, 0, 0, 0])
    expect(CAPACITIES.map((c) => springScale(c).decimals)).toEqual([3, 3, 2, 2, 2, 2, 2])
  })

  it('print grams level with newtons, two places fewer', () => {
    expect(inGrams(springScale('1'))).toEqual({ capacity: 100, labelEvery: 10, minorEvery: 1, decimals: 1 })
    expect(inGrams(springScale('10'))).toEqual({ capacity: 1000, labelEvery: 100, minorEvery: 10, decimals: 0 })
  })

  it('number each scale in 10 to 15 steps', () => {
    for (const c of CAPACITIES) {
      const s = springScale(c)
      const steps = s.capacity / s.labelEvery
      expect(steps).toBeGreaterThanOrEqual(10)
      expect(steps).toBeLessThanOrEqual(15)
      expect(Number.isInteger(Math.round((s.labelEvery / s.minorEvery) * 1e6) / 1e6)).toBe(true)
    }
  })

  it('keep a force on the scale once the zero offset moves the pointer', () => {
    const s = springScale('10')
    expect(tidyZero(s, 2)).toBe(1)
    expect(tidyZero(s, -0.123)).toBe(-0.12)
    expect(maxForce(s, 0.5)).toBe(9.5)
    expect(tidyForce(s, 0.5, 9.9)).toBe(9.5)
    expect(tidyForce(s, -0.5, 9.9)).toBe(9.9)
    expect(tidyForce(s, 0, -1)).toBe(0)
    expect(tidyForce(springScale('1'), 0, 0.34567)).toBe(0.346)
  })

  it('pick random forces within the scale', () => {
    const s = springScale('5')
    expect(randomForce(s, 0, () => 0)).toBe(0.5)
    expect(randomForce(s, 0.5, () => 1)).toBe(4.05)
  })

  it('write forces in newtons and grams', () => {
    const s = springScale('10')
    expect(newtonsText(s, 3.47)).toBe('3.47 N')
    expect(gramsText(s, 3.47)).toBe('347 g')
    expect(newtonsText(s, 0.1, true)).toBe('+0.10 N')
    expect(gramsText(s, -0.1, true)).toBe('−10 g')
    expect(gramsText(springScale('1'), 0.347)).toBe('34.7 g')
  })

  it('puts zero at the top and the capacity 480 units down', () => {
    const at = springLayout(springScale('20'))
    expect(at.yOf(0)).toBe(at.zeroY)
    expect(at.yOf(20) - at.yOf(0)).toBe(480)
    // the pointer resting as far above zero as it can still has spring above it
    expect(at.yOf(-2)).toBeGreaterThan(at.slot.top + 20)
  })
})

describe('spring scale settings', () => {
  it('tidy a force and zero offset from the address', () => {
    const s = springScaleSettings.fromParams(new URLSearchParams('capacity=1&force=0.98765&zero=0.3'))
    expect(s.zero).toBe(0.1)
    expect(s.force).toBe(0.9)
  })

  it('write the answer key in what the scale is printed in', () => {
    const d = springScaleSettings.defaults
    expect(answerLines(d)).toBe('Force: 3.47 N')
    expect(answerLines({ ...d, units: 'grams' })).toBe('Mass: 347 g')
    expect(answerLines({ ...d, units: 'both', zero: 0.1 })).toBe(
      'Reading: 3.57 N (357 g), zero offset: +0.10 N (+10 g)\nForce: 3.47 N (347 g)',
    )
  })
})
