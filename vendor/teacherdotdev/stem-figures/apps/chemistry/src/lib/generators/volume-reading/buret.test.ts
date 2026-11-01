import { describe, expect, it } from 'vitest'
import { buretLayout } from './buret'

describe('buret drawing', () => {
  const at = buretLayout()

  it('reads 0 at the top of its scale and 50 toward the bottom', () => {
    expect(at.yOf(0)).toBeLessThan(at.yOf(50))
    expect(at.yOf(0)).toBeGreaterThan(0)
    expect(at.yOf(50)).toBeLessThan(at.height)
  })

  it('spaces its marks evenly, 10 drawing units per mL', () => {
    expect(at.yOf(23.47) - at.yOf(23)).toBeCloseTo(4.7)
    expect(at.yOf(50) - at.yOf(0)).toBe(500)
  })

  it('has its stopcock below the scale', () => {
    expect(at.stopcockY).toBeGreaterThan(at.yOf(50))
  })
})
