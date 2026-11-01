// A digital probe thermometer: a handheld meter showing the temperature to
// 0–2 decimal places, its probe in a beaker. It reads about −50 °C to 150 °C.

import { convertTemperature, roundTo, type TemperatureUnit } from './units'

export const DIGITAL_DECIMALS = [0, 1, 2] as const

const RANGE_C = { min: -50, max: 150 }

export function digitalRange(unit: TemperatureUnit) {
  return {
    min: Math.round(convertTemperature(RANGE_C.min, 'celsius', unit)),
    max: Math.round(convertTemperature(RANGE_C.max, 'celsius', unit)),
  }
}

export function roundDigital(unit: TemperatureUnit, decimals: number, t: number): number {
  const { min, max } = digitalRange(unit)
  return roundTo(Math.min(max, Math.max(min, t)), decimals)
}

/** A temperature a lab might see: ice water to boiling, 0–100 °C. */
export function randomDigitalReading(unit: TemperatureUnit, decimals: number, random: () => number = Math.random) {
  return roundDigital(unit, decimals, convertTemperature(random() * 100, 'celsius', unit))
}

export const DIGITAL_THERMOMETER = { width: 400, height: 300 }
