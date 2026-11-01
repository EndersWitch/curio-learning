import { describe, expect, it } from 'vitest'
import { element } from '../orbital-diagram/elements'
import { ISOTOPES, ISOTOPE_ZS } from './isotopes'

// CIAAW's abridged standard atomic weights (2024), ciaaw.org/abridged-atomic-weights.htm:
// symbol, weight, uncertainty.
const ABRIDGED = `H 1.0080 0.0002, He 4.0026 0.0001, Li 6.94 0.06, Be 9.0122 0.0001, B 10.81 0.02, C 12.011 0.002, N 14.007 0.001, O 15.999 0.001,
F 18.998 0.001, Ne 20.180 0.001, Na 22.990 0.001, Mg 24.305 0.002, Al 26.982 0.001, Si 28.085 0.001, P 30.974 0.001, S 32.06 0.02,
Cl 35.45 0.01, Ar 39.95 0.16, K 39.098 0.001, Ca 40.078 0.004, Sc 44.956 0.001, Ti 47.867 0.001, V 50.942 0.001, Cr 51.996 0.001,
Mn 54.938 0.001, Fe 55.845 0.002, Co 58.933 0.001, Ni 58.693 0.001, Cu 63.546 0.003, Zn 65.38 0.02, Ga 69.723 0.001, Ge 72.630 0.008,
As 74.922 0.001, Se 78.971 0.008, Br 79.904 0.003, Kr 83.798 0.002, Rb 85.468 0.001, Sr 87.62 0.01, Y 88.906 0.001, Zr 91.222 0.003,
Nb 92.906 0.001, Mo 95.95 0.01, Ru 101.07 0.02, Rh 102.91 0.01, Pd 106.42 0.01, Ag 107.87 0.01, Cd 112.41 0.01, In 114.82 0.01,
Sn 118.71 0.01, Sb 121.76 0.01, Te 127.60 0.03, I 126.90 0.01, Xe 131.29 0.01, Pt 195.08 0.02, Au 196.97 0.01, Hg 200.59 0.01,
Pb 207.2 1.1, U 238.03 0.01`
const WEIGHTS = new Map(
  ABRIDGED.split(',').map((entry) => {
    const [symbol, weight, uncertainty] = entry.trim().split(' ')
    return [symbol, { weight: Number(weight), uncertainty: Number(uncertainty) }]
  }),
)

const average = (z: number) => ISOTOPES[z].reduce((sum, [, mass, pct]) => sum + mass * pct, 0) / 100

describe('the isotope data', () => {
  it('covers H to Xe but Tc, and Pt, Au, Hg, Pb and U', () => {
    const expected = [...Array.from({ length: 54 }, (_, i) => i + 1).filter((z) => z !== 43), 78, 79, 80, 82, 92]
    expect(ISOTOPE_ZS).toEqual(expected)
  })

  it('adds each element’s abundances up to 100%', () => {
    for (const z of ISOTOPE_ZS) {
      const total = ISOTOPES[z].reduce((sum, [, , pct]) => sum + pct, 0)
      expect(total, element(z).symbol).toBeCloseTo(100, 6)
    }
  })

  it('lists each element’s isotopes lightest first, each mass near its mass number', () => {
    for (const z of ISOTOPE_ZS) {
      const numbers = ISOTOPES[z].map(([a]) => a)
      expect(numbers, element(z).symbol).toEqual([...new Set(numbers)].sort((a, b) => a - b))
      for (const [a, mass, pct] of ISOTOPES[z]) {
        expect(Math.abs(mass - a), `${element(z).symbol}-${a}`).toBeLessThan(0.1)
        expect(pct).toBeGreaterThan(0)
      }
    }
  })

  it('averages to each element’s standard atomic weight, within its uncertainty', () => {
    for (const z of ISOTOPE_ZS) {
      const { weight, uncertainty } = WEIGHTS.get(element(z).symbol)!
      expect(Math.abs(average(z) - weight), element(z).symbol).toBeLessThanOrEqual(uncertainty + 1e-9)
    }
  })

  it('gives the atomic masses on a periodic table', () => {
    const two = (z: number) => average(z).toFixed(2)
    expect([two(17), two(35), two(12), two(29), two(5)]).toEqual(['35.45', '79.90', '24.31', '63.55', '10.81'])
  })

  it('gives a monoisotopic element one isotope', () => {
    const only: Record<number, number> = { 9: 19, 11: 23, 13: 27, 15: 31, 79: 197 }
    for (const [z, a] of Object.entries(only)) expect(ISOTOPES[Number(z)].map(([n, , pct]) => [n, pct])).toEqual([[a, 100]])
  })
})
