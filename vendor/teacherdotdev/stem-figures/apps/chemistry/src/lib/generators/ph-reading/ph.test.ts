import { describe, expect, it } from 'vitest'
import { ANALOG_METER, angleAt, dialPoint } from './analog'
import { CHART_COLORS, paperColor } from './paper'
import { PH_INSTRUMENTS, phRules, roundPh } from './readings'
import { answerLine, phSettings } from './settings'

describe('pH readings', () => {
  it('reads to 1 or 2 places on a digital meter, 2 on an analog one and whole numbers on paper', () => {
    expect(phRules({ instrument: 'digital', decimals: 1 }).round(4.66)).toBe(4.7)
    expect(phRules({ instrument: 'digital', decimals: 2 }).round(4.666)).toBe(4.67)
    expect(phRules({ instrument: 'analog', decimals: 1 }).round(4.666)).toBe(4.67)
    expect(phRules({ instrument: 'paper', decimals: 2 }).round(4.5)).toBe(5)
  })

  it('keeps readings from 0 to 14', () => {
    expect(roundPh(-1, 2)).toBe(0)
    expect(roundPh(15, 1)).toBe(14)
    expect(roundPh(1.005, 2)).toBe(1.01)
  })

  it('picks random readings from 1 to 13, rounded for the instrument', () => {
    for (const instrument of PH_INSTRUMENTS) {
      for (const r of [0, 0.5, 0.9999]) {
        const rules = phRules({ instrument, decimals: 2 }, () => r)
        const pH = rules.random()
        expect(pH).toBe(rules.round(pH))
        expect(pH).toBeGreaterThanOrEqual(1)
        expect(pH).toBeLessThanOrEqual(13)
      }
    }
  })
})

describe('analog pH meter', () => {
  it('swings its needle evenly from 0 on the left to 14 on the right', () => {
    expect(angleAt(7)).toBeCloseTo(0)
    expect(angleAt(0)).toBeCloseTo(-angleAt(14))
    expect(dialPoint(7).x).toBeCloseTo(ANALOG_METER.pivot.x)
    expect(dialPoint(0).x).toBeLessThan(dialPoint(14).x)
  })

  it('keeps its numbers inside the dial window', () => {
    const w = ANALOG_METER.window
    for (const pH of [0, 7, 14]) {
      const p = dialPoint(pH, ANALOG_METER.labelOut)
      expect(p.x - 8).toBeGreaterThan(w.left)
      expect(p.x + 8).toBeLessThan(w.right)
      expect(p.y - 8).toBeGreaterThan(w.top)
    }
  })
})

describe('pH paper', () => {
  it('has a swatch for every whole pH and colors the strip to match one', () => {
    expect(CHART_COLORS).toHaveLength(15)
    expect(new Set(CHART_COLORS).size).toBe(15)
    expect(paperColor(7)).toBe(CHART_COLORS[7])
    expect(paperColor(14)).toBe(CHART_COLORS[14])
  })
})

describe('pH settings', () => {
  it('fits a reading from the address to the chosen instrument', () => {
    expect(phSettings.fromParams(new URLSearchParams('reading=3.456')).reading).toBe(3.46)
    expect(phSettings.fromParams(new URLSearchParams('instrument=paper&reading=3.6')).reading).toBe(4)
    expect(phSettings.fromParams(new URLSearchParams('decimals=1&reading=20')).reading).toBe(14)
  })

  it('writes the answer key to the instrument’s places', () => {
    expect(answerLine(phSettings.defaults)).toBe('pH: 4.62')
    expect(answerLine(phSettings.tidy({ ...phSettings.defaults, instrument: 'paper' }))).toBe('pH: 5')
    expect(answerLine(phSettings.tidy({ ...phSettings.defaults, decimals: 1, reading: 7 }))).toBe('pH: 7.0')
  })
})
