import { describe, expect, it } from 'vitest'
import { digitalRange, randomDigitalReading, roundDigital } from './digital'
import { glassScale, randomGlassReading, roundGlass } from './glass'
import { temperatureSettings } from './settings'
import { TEMPERATURE_UNITS, convertTemperature, roundTo, withUnit } from './units'

describe('temperature units', () => {
  it.each([
    [0, 'celsius', 'kelvin', 273.15],
    [100, 'celsius', 'fahrenheit', 212],
    [-40, 'fahrenheit', 'celsius', -40],
    [300, 'kelvin', 'fahrenheit', 80.33],
  ] as const)('%s %s is %s %s', (t, from, to, expected) => {
    expect(convertTemperature(t, from, to)).toBeCloseTo(expected, 2)
  })

  it('rounds converted halves up, not down through float error', () => {
    expect(roundTo(convertTemperature(25, 'celsius', 'kelvin'), 1)).toBe(298.2)
    expect(roundTo(-4.25, 1)).toBe(-4.3)
    expect(roundTo(-0.01, 1)).toBe(0)
  })

  it('writes kelvin without a degree sign', () => {
    expect(withUnit('23.4', 'celsius')).toBe('23.4 °C')
    expect(withUnit('296.6', 'kelvin')).toBe('296.6 K')
  })
})

describe('liquid-in-glass thermometer', () => {
  it('reads one digit past its smallest mark', () => {
    for (const unit of TEMPERATURE_UNITS) expect(glassScale(unit).decimals).toBe(1)
  })

  it('rounds and keeps readings on its scale, below zero too', () => {
    const c = glassScale('celsius')
    expect(roundGlass(c, 23.46)).toBe(23.5)
    expect(roundGlass(c, -4.23)).toBe(-4.2)
    expect(roundGlass(c, -50)).toBe(-10)
    expect(roundGlass(c, 400)).toBe(110)
  })

  it('picks random readings on its scale', () => {
    for (const unit of TEMPERATURE_UNITS) {
      const scale = glassScale(unit)
      for (const r of [0, 0.5, 0.9999]) {
        const t = randomGlassReading(scale, () => r)
        expect(t).toBe(roundGlass(scale, t))
        expect(t).toBeGreaterThan(scale.min)
        expect(t).toBeLessThan(scale.max)
      }
    }
  })
})

describe('digital thermometer', () => {
  it('reads −50 °C to 150 °C in every unit', () => {
    expect(digitalRange('celsius')).toEqual({ min: -50, max: 150 })
    expect(digitalRange('kelvin')).toEqual({ min: 223, max: 423 })
    expect(digitalRange('fahrenheit')).toEqual({ min: -58, max: 302 })
  })

  it('rounds to the places it shows', () => {
    expect(roundDigital('celsius', 0, 23.5)).toBe(24)
    expect(roundDigital('celsius', 2, 23.456)).toBe(23.46)
    expect(roundDigital('kelvin', 1, 10)).toBe(223)
  })

  it('picks random readings between ice water and boiling', () => {
    for (const r of [0, 0.5, 0.9999]) {
      expect(randomDigitalReading('celsius', 1, () => r)).toBeGreaterThanOrEqual(0)
      expect(randomDigitalReading('celsius', 1, () => r)).toBeLessThanOrEqual(100)
    }
    expect(randomDigitalReading('kelvin', 1, () => 0)).toBe(273.2)
  })
})

describe('temperature settings', () => {
  it('fits a reading from the address to the chosen thermometer', () => {
    expect(temperatureSettings.fromParams(new URLSearchParams('reading=25.37')).reading).toBe(25.4)
    expect(temperatureSettings.fromParams(new URLSearchParams('unit=kelvin&reading=25')).reading).toBe(260)
    expect(temperatureSettings.fromParams(new URLSearchParams('instrument=digital&decimals=2&reading=-3.456')).reading).toBe(-3.46)
  })
})
