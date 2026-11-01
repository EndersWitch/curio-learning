import { describe, expect, it } from 'vitest'
import { extremesOf, periodOf } from './model'
import { PAIRS, pairNamed } from './pairs'
import { autoTitles, pairSettings, predatorPreySettings, ratesOf, ratesOfPair } from './settings'

describe('the listed pairs', () => {
  it('each cycles as long as it says, with fewer predators than prey', () => {
    for (const p of PAIRS) {
      const start = { prey: p.preyStart, predators: p.predatorStart }
      const r = ratesOfPair(p)
      // Rates rounded to three figures still give the cycle to within a percent.
      expect(periodOf(r, start) / p.period, p.id).toBeCloseTo(1, 1)
      const e = extremesOf(r, start)
      expect(e.predators.high, p.id).toBeLessThan(e.prey.low * (p.scale === 'shared' ? 3 : 1))
      expect(e.prey.low, p.id).toBeGreaterThan(0)
      expect(p.span / p.period, p.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('has the hare and lynx cycling about every 10 years, between about 15 and 110 thousand hares', () => {
    const p = pairNamed('Hares', 'Lynx')!
    const e = extremesOf(ratesOfPair(p), { prey: p.preyStart, predators: p.predatorStart })
    expect(p.period).toBe(10)
    expect(e.prey.low).toBeGreaterThan(10)
    expect(e.prey.high).toBeGreaterThan(100)
    expect(e.prey.high).toBeLessThan(150)
  })

  it('are found by their names', () => {
    expect(pairNamed(' Moose ', 'Wolves')?.id).toBe('moose-wolf')
    expect(pairNamed('Rabbits', 'Hawks')).toBeUndefined()
    expect(new Set(PAIRS.map((p) => `${p.prey}/${p.predators}`)).size).toBe(PAIRS.length)
  })
})

describe('the settings', () => {
  it('start with the hare and lynx, their rates matching their populations', () => {
    const s = predatorPreySettings.defaults
    const simple = ratesOf(s)
    const typed = ratesOf({ ...s, source: 'rates' })
    for (const k of ['alpha', 'beta', 'gamma', 'delta'] as const) expect(typed[k] / simple[k]).toBeCloseTo(1, 2)
  })

  it('leave defaults out of the address, and read back what they wrote', () => {
    expect(predatorPreySettings.toQuery(predatorPreySettings.defaults)).toBe('')
    const s = predatorPreySettings.tidy({ ...predatorPreySettings.defaults, ...pairSettings(PAIRS[3]), lag: true })
    expect(predatorPreySettings.fromParams(new URLSearchParams(predatorPreySettings.toQuery(s)))).toEqual(s)
  })

  it('title the axes from the pair', () => {
    expect(autoTitles({ preyName: 'Hares', predatorName: 'Lynx', units: 'years', scale: 'shared' })).toEqual({
      xTitle: 'Time (years)',
      yTitle: 'Number of animals (thousands)',
      y2Title: 'Lynx (thousands)',
      pxTitle: 'Hares (thousands)',
      pyTitle: 'Lynx (thousands)',
    })
    const own = autoTitles({ preyName: 'Voles', predatorName: 'Weasels', units: 'months', scale: 'two' })
    expect([own.xTitle, own.yTitle, own.y2Title]).toEqual(['Time (months)', 'Voles', 'Weasels'])
    expect(autoTitles({ preyName: 'Voles', predatorName: 'Weasels', units: 'months', scale: 'shared' }).yTitle).toBe('Population size')
  })
})
