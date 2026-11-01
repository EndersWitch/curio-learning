import { describe, expect, it } from 'vitest'
import {
  balanceOf, censusOf, conserved, extremesOf, lagOf, periodOf, ratesFor, simulate, smallCyclePeriod, turnsOf, valueAt, type Rates,
} from './model'

// The hare and lynx: a 10-year cycle around 50 thousand hares and 20 thousand lynx.
const balance = { prey: 50, predators: 20 }
const start = { prey: 20, predators: 12 }
const rates = ratesFor(balance, start, 10)

describe('the Lotka–Volterra model', () => {
  it('keeps its conserved quantity the same, cycle after cycle', () => {
    const run = simulate(rates, start, 50)
    const v0 = conserved(rates, start)
    const drift = run.prey.map((x, k) => Math.abs(conserved(rates, { prey: x, predators: run.predators[k] }) - v0))
    expect(Math.max(...drift)).toBeLessThan(1e-8)
  })

  it('closes each cycle on the one before, without drifting', () => {
    const run = simulate(rates, start, 50)
    for (const t of [10, 20, 30, 40, 50]) {
      expect(valueAt(run.t, run.prey, t) / start.prey).toBeCloseTo(1, 3)
      expect(valueAt(run.t, run.predators, t) / start.predators).toBeCloseTo(1, 3)
    }
    const peaks = turnsOf(rates, run).preyPeaks.map((p) => p.value)
    expect(Math.max(...peaks) - Math.min(...peaks)).toBeLessThan(1e-3)
  })

  it('has the predators peak after the prey, before the prey peak again', () => {
    const turns = turnsOf(rates, simulate(rates, start, 50))
    expect(turns.preyPeaks.length).toBeGreaterThanOrEqual(4)
    turns.preyPeaks.slice(0, -1).forEach((prey, k) => {
      const predator = turns.predatorPeaks.find((p) => p.t > prey.t)!
      expect(predator.t).toBeLessThan(turns.preyPeaks[k + 1].t)
      // A year or two behind, as for the real hare and lynx.
      expect(predator.t - prey.t).toBeGreaterThan(1)
      expect(predator.t - prey.t).toBeLessThan(2.5)
    })
    expect(lagOf(rates, start)).toBeCloseTo(turns.predatorPeaks.find((p) => p.t > turns.preyPeaks[0].t)!.t - turns.preyPeaks[0].t, 2)
  })

  it('peaks and bottoms out where the conserved quantity says, exactly', () => {
    const run = simulate(rates, start, 20)
    const e = extremesOf(rates, start)
    expect(Math.max(...run.prey)).toBeCloseTo(e.prey.high, 2)
    expect(Math.min(...run.prey)).toBeCloseTo(e.prey.low, 2)
    expect(Math.max(...run.predators)).toBeCloseTo(e.predators.high, 2)
    expect(Math.min(...run.predators)).toBeCloseTo(e.predators.low, 2)
    // The predators are always fewer than their prey's peak.
    expect(e.predators.high).toBeLessThan(e.prey.high)
  })

  it('works rates out for the averages and cycle length asked for', () => {
    expect(periodOf(rates, start)).toBeCloseTo(10, 4)
    expect(balanceOf(rates).prey).toBeCloseTo(50, 9)
    expect(balanceOf(rates).predators).toBeCloseTo(20, 9)
    // The averages over a cycle are the balance point.
    const run = simulate(rates, start, 10)
    const mean = (v: number[]) => v.slice(1).reduce((a, b) => a + b, 0) / (v.length - 1)
    expect(mean(run.prey)).toBeCloseTo(50, 0)
    expect(mean(run.predators)).toBeCloseTo(20, 0)
  })

  it('cycles at 2π/√(αγ) close to the balance point, and slower further out', () => {
    const r: Rates = { alpha: 1, beta: 0.1, gamma: 0.5, delta: 0.02 }
    const b = balanceOf(r)
    expect(periodOf(r, { prey: b.prey * 1.01, predators: b.predators })).toBeCloseTo(smallCyclePeriod(r), 2)
    expect(periodOf(r, { prey: b.prey * 0.2, predators: b.predators })).toBeGreaterThan(smallCyclePeriod(r) * 1.05)
    expect(periodOf(r, b)).toBe(smallCyclePeriod(r))
  })

  it('keeps big swings positive and closed', () => {
    const wild = ratesFor({ prey: 100, predators: 10 }, { prey: 5, predators: 2 }, 12)
    const run = simulate(wild, { prey: 5, predators: 2 }, 48)
    expect(Math.min(...run.prey, ...run.predators)).toBeGreaterThan(0)
    expect(periodOf(wild, { prey: 5, predators: 2 })).toBeCloseTo(12, 3)
    const v0 = conserved(wild, { prey: 5, predators: 2 })
    expect(Math.abs(conserved(wild, { prey: run.prey.at(-1)!, predators: run.predators.at(-1)! }) - v0)).toBeLessThan(1e-6)
  })
})

describe('a census', () => {
  const run = simulate(rates, start, 40)

  it('counts every so often, exactly when there is no noise', () => {
    const counts = censusOf(run, 1, 0, 1)
    expect(counts).toHaveLength(41)
    expect(counts[10].prey).toBeCloseTo(valueAt(run.t, run.prey, 10), 9)
  })

  it('is off by about the noise asked for, the same for the same seed', () => {
    const a = censusOf(run, 1, 0.1, 7)
    expect(censusOf(run, 1, 0.1, 7)).toEqual(a)
    expect(censusOf(run, 1, 0.1, 8)).not.toEqual(a)
    const off = a.map((c) => Math.abs(Math.log(c.prey / valueAt(run.t, run.prey, c.t))))
    expect(Math.max(...off)).toBeLessThan(0.45)
    expect(off.reduce((x, y) => x + y, 0) / off.length).toBeGreaterThan(0.03)
    expect(Math.min(...a.map((c) => c.predators))).toBeGreaterThan(0)
  })
})
