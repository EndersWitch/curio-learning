import { describe, expect, test } from 'vitest'
import { DEFAULT_SETTINGS, cleanSettings, readMoved, readTriangle, settingsFromParams, settingsToQuery } from './settings.js'

const params = (q: string) => settingsFromParams(new URLSearchParams(q))

describe('the page address', () => {
  test('the opening triangle has a bare address', () => {
    expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe('')
  })

  test('a link comes back the same', () => {
    const q = 'nameA=P&A=30&B=&AB=3sqrt%282%29&hB=1&round=2&rotate=-15&moved=AB%3A4%2C-6'
    const s = params(q)
    expect([s.nameA, s.A, s.B, s.AB, s.hB, s.round, s.rotate, s.moved]).toEqual(['P', '30', '', '3sqrt(2)', true, 2, -15, 'AB:4,-6'])
    expect(settingsToQuery(s)).toBe(q)
  })

  test('nonsense falls back to defaults', () => {
    const s = params('round=7&base=XY&ABTicks=9&hAStyle=wavy&rotate=999&ALabel=loud')
    expect([s.round, s.base, s.ABTicks, s.hAStyle, s.rotate, s.ALabel]).toEqual([1, 'AB', 0, 'dashed', 180, 'auto'])
  })
})

describe('moved labels', () => {
  test('round to whole units and drop ones back in place', () => {
    expect(cleanSettings({ moved: 'vC:0.4,3.6;AB:0,0;junk' }).moved).toBe('vC:0,4')
    expect(readMoved('AB:4,-6;hA:-2,1')).toEqual({ AB: [4, -6], hA: [-2, 1] })
  })
})

describe('readTriangle', () => {
  test('the opening triangle', () => {
    const r = readTriangle(cleanSettings(DEFAULT_SETTINGS))
    expect(r.triangle!.angles.C).toBeCloseTo(66)
  })

  test('a measure that isn’t a number', () => {
    const r = readTriangle(cleanSettings({ ...DEFAULT_SETTINGS, AB: 'x+' }))
    expect(r.triangle).toBeNull()
    expect(r.problems.AB).toMatch(/Type a number/)
  })

  test('roots, fractions and π are numbers', () => {
    const r = readTriangle(cleanSettings({ ...DEFAULT_SETTINGS, A: '', AB: '5/2', BC: '5sqrt(3)/2' }))
    expect(r.triangle!.angles.A).toBeCloseTo(60)
  })
})
