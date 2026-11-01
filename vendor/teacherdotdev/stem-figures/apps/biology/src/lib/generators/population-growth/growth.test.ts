import { describe, expect, it } from 'vitest'
import { census, checkGrowth, inflection, perCapitaAtN, phases, random, rateAtN, solve, type Growth } from './growth'

const g: Growth = { n0: 20, r: 0.5, k: 1000, lag: 2 }

describe('exponential growth', () => {
  const sol = solve('exponential', g, 20)

  it('grows by e^rt, so it doubles every ln 2 / r', () => {
    expect(sol.n(0)).toBe(20)
    expect(sol.n(Math.LN2 / g.r)).toBeCloseTo(40, 9)
    expect(sol.rate(4)).toBeCloseTo(g.r * sol.n(4), 9)
  })

  it('has the same per capita growth rate, r, at any size', () => {
    expect(sol.perCapita(0)).toBe(0.5)
    expect(sol.perCapita(15)).toBe(0.5)
    expect(perCapitaAtN('exponential', g, 5000)).toBe(0.5)
    expect(rateAtN('exponential', g, 300)).toBe(150)
  })
})

describe('logistic growth', () => {
  const sol = solve('logistic', g, 40)

  it('starts at N₀ and levels off at the carrying capacity', () => {
    expect(sol.n(0)).toBeCloseTo(20, 9)
    expect(sol.n(40)).toBeCloseTo(1000, 1)
    expect(sol.rate(40)).toBeCloseTo(0, 1)
  })

  it('satisfies dN/dt = rN(K − N)/K', () => {
    for (const t of [2, 7, 12]) {
      const n = sol.n(t)
      const slope = (sol.n(t + 1e-5) - sol.n(t - 1e-5)) / 2e-5
      expect(slope).toBeCloseTo((g.r * n * (g.k - n)) / g.k, 3)
      expect(sol.rate(t)).toBeCloseTo(slope, 3)
    }
  })

  it('has a per capita growth rate falling in a straight line from r to 0 at K', () => {
    expect(perCapitaAtN('logistic', g, 0)).toBe(0.5)
    expect(perCapitaAtN('logistic', g, 500)).toBe(0.25)
    expect(perCapitaAtN('logistic', g, 1000)).toBe(0)
    expect(rateAtN('logistic', g, 500)).toBe(125) // rK/4, the fastest it grows
  })

  it('grows fastest at the inflection point, N = K/2', () => {
    const ip = inflection(g)!
    expect(ip.n).toBe(500)
    expect(sol.n(ip.t)).toBeCloseTo(500, 6)
    expect(ip.rate).toBe(125)
    expect(sol.rate(ip.t)).toBeGreaterThan(sol.rate(ip.t - 0.5))
    expect(sol.rate(ip.t)).toBeGreaterThan(sol.rate(ip.t + 0.5))
  })

  it('has no inflection point when it starts at K/2 or above', () => {
    expect(inflection({ ...g, n0: 500 })).toBeNull()
    expect(inflection({ ...g, n0: 1500 })).toBeNull()
  })

  it('puts the phases where the steepest tangent meets N₀ and K', () => {
    const ph = phases(g)!
    const ip = inflection(g)!
    expect(ph.lagEnd).toBeCloseTo(ip.t - (500 - 20) / 125, 9)
    expect(ph.stationary).toBeCloseTo(ip.t + 4, 9)
    // Starting close to K/2, the curve is steep from the start: no lag phase.
    expect(phases({ ...g, n0: 400 })!.lagEnd).toBeNull()
  })
})

describe('overshoot and oscillation', () => {
  it('overshoots K and settles back to it when rτ is under π/2', () => {
    const sol = solve('overshoot', { ...g, r: 0.6, lag: 2 }, 80)
    const ns = Array.from({ length: 801 }, (_, i) => sol.n(i / 10))
    expect(Math.max(...ns)).toBeGreaterThan(1100)
    expect(sol.n(80)).toBeCloseTo(1000, -1)
  })

  it('keeps swinging around K when rτ is over π/2', () => {
    const sol = solve('overshoot', { ...g, r: 0.6, lag: 3 }, 120)
    const late = Array.from({ length: 401 }, (_, i) => sol.n(80 + i / 10))
    expect(Math.max(...late) - Math.min(...late)).toBeGreaterThan(500)
  })

  it('grows like logistic growth with no lag to speak of', () => {
    const lagged = solve('overshoot', { ...g, lag: 0.05 }, 30)
    const logistic = solve('logistic', g, 30)
    expect(Math.abs(lagged.n(10) / logistic.n(10) - 1)).toBeLessThan(0.02)
  })
})

describe('boom and crash', () => {
  it('peaks at the size typed, then crashes', () => {
    const sol = solve('crash', { ...g, n0: 30, r: 0.5, k: 6000 }, 60)
    const ns = Array.from({ length: 601 }, (_, i) => sol.n(i / 10))
    expect(Math.max(...ns)).toBeCloseTo(6000, -2)
    expect(sol.n(60)).toBeLessThan(30)
    // Each individual's growth rate keeps falling, below 0 once past the peak.
    expect(sol.perCapita(0)).toBeCloseTo(0.5, 6)
    expect(sol.perCapita(40)).toBeLessThan(0)
  })
})

describe('what the teacher typed', () => {
  it('needs a starting size and growth rate above 0, and a peak above the start', () => {
    expect(checkGrowth('logistic', g)).toEqual({})
    expect(Object.keys(checkGrowth('logistic', { ...g, n0: 0, r: 0 }))).toEqual(['n0', 'r'])
    expect(checkGrowth('crash', { ...g, k: 10 }).k).toContain('peak')
  })
})

describe('a census', () => {
  const sol = solve('logistic', g, 20)

  it('counts every so often, exactly on the curve with no scatter', () => {
    const c = census(sol, 2, 20, 0, 1)
    expect(c.map((p) => p.t)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    expect(c[0].n).toBe(20)
    expect(c[5].n).toBe(Math.round(sol.n(10)))
  })

  it('scatters counts the same way for the same seed, and differently for another', () => {
    const a = census(sol, 1, 20, 10, 7)
    expect(census(sol, 1, 20, 10, 7)).toEqual(a)
    expect(census(sol, 1, 20, 10, 8)).not.toEqual(a)
    expect(a[0].n).toBe(20)
    for (const p of a) expect(p.n).toBeGreaterThanOrEqual(0)
  })

  it('keeps decimals for small numbers, like millions of cells', () => {
    const small = solve('logistic', { ...g, n0: 0.1, k: 5 }, 20)
    expect(census(small, 5, 20, 0, 1)[2].n).toBe(Math.round(small.n(10) * 100) / 100)
  })

  it('makes random numbers from 0 to 1, repeatably', () => {
    const a = random(3)
    const b = random(3)
    const xs = Array.from({ length: 50 }, () => a())
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()))
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true)
  })
})
