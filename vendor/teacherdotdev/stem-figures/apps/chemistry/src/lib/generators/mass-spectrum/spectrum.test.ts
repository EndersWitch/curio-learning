import { describe, expect, it } from 'vitest'
import { abundanceText, elementPeaks, heightsOf, relativeAtomicMass, typedPeaks } from './spectrum'

describe('the relative atomic mass', () => {
  it('averages the exact masses, weighted by abundance', () => {
    expect(relativeAtomicMass(elementPeaks('Cl'))!.toFixed(2)).toBe('35.45')
    expect(relativeAtomicMass(elementPeaks('Br'))!.toFixed(2)).toBe('79.90')
    expect(relativeAtomicMass(elementPeaks('Mg'))!.toFixed(2)).toBe('24.31')
    expect(relativeAtomicMass(elementPeaks('Cu'))!.toFixed(2)).toBe('63.55')
    expect(relativeAtomicMass(elementPeaks('B'))!.toFixed(2)).toBe('10.81')
  })

  it('works out isotopes typed in, whatever their abundances add up to', () => {
    expect(relativeAtomicMass(typedPeaks([{ mass: 10, pct: 20 }, { mass: 11, pct: 80 }]))).toBeCloseTo(10.8, 9)
    expect(relativeAtomicMass(typedPeaks([{ mass: 63, pct: 3 }, { mass: 65, pct: 1 }]))).toBeCloseTo(63.5, 9)
    expect(relativeAtomicMass(typedPeaks([{ mass: 10, pct: 0 }]))).toBeNull()
  })
})

describe('peaks', () => {
  it('sit at whole numbers, lightest first', () => {
    expect(typedPeaks([{ mass: 36.966, pct: 24 }, { mass: 34.969, pct: 76 }]).map((p) => p.mz)).toEqual([35, 37])
    expect(elementPeaks('F')).toEqual([{ mz: 19, mass: 18.99840316273, pct: 100 }])
  })

  it('are as tall as their abundance, or against the tallest as 100', () => {
    const mg = elementPeaks('Mg')
    expect(heightsOf(mg, 'percent')).toEqual([78.99, 10, 11.01])
    expect(heightsOf(mg, 'relative').map((h) => h.toFixed(2))).toEqual(['100.00', '12.66', '13.94'])
  })

  it('write their abundance to two places, or three figures when tiny', () => {
    expect([78.99, 10, 100, 0.364, 0.0115, 0.0002, 1 / 30].map(abundanceText)).toEqual(['78.99', '10.00', '100', '0.36', '0.0115', '0.0002', '0.0333'])
  })
})
