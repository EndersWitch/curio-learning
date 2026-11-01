// A liquid-in-glass thermometer: the scale printed on it in each unit, what
// counts as a reading on it (one digit beyond the smallest mark, the
// estimated digit), and where things sit on the drawing.

import { roundTo, type TemperatureUnit } from './units'

export interface GlassScale {
  min: number
  max: number
  /** degrees between numbered marks */
  labelEvery: number
  /** degrees between the smallest marks */
  minorEvery: number
  /** decimal places in a reading */
  decimals: number
}

// Each covers about −10 °C to 110 °C, like a school lab thermometer. There
// isn't room for 1 °F marks over that range, so Fahrenheit is marked every 2 °F.
const SCALES: Record<TemperatureUnit, Omit<GlassScale, 'decimals'>> = {
  celsius: { min: -10, max: 110, labelEvery: 10, minorEvery: 1 },
  kelvin: { min: 260, max: 390, labelEvery: 10, minorEvery: 1 },
  fahrenheit: { min: 10, max: 230, labelEvery: 20, minorEvery: 2 },
}

/** Decimal places that reach one digit past the smallest mark: 1 → 1, 2 → 1, 0.1 → 2. */
const estimatedDecimals = (minorEvery: number) => Math.max(0, Math.ceil(-Math.log10(minorEvery) - 1e-9)) + 1

export function glassScale(unit: TemperatureUnit): GlassScale {
  const s = SCALES[unit]
  return { ...s, decimals: estimatedDecimals(s.minorEvery) }
}

export function roundGlass(scale: GlassScale, t: number): number {
  const clamped = Math.min(scale.max, Math.max(scale.min, t))
  return roundTo(clamped, scale.decimals)
}

/** A reading a teacher might set: somewhere between the bottom and top tenth of the scale. */
export function randomGlassReading(scale: GlassScale, random: () => number = Math.random): number {
  const span = scale.max - scale.min
  return roundGlass(scale, scale.min + span * (0.1 + random() * 0.8))
}

export const TINTS = ['red', 'blue', 'gray'] as const
export type Tint = (typeof TINTS)[number]

/** Red is the alcohol in most school thermometers; gray looks like mercury. */
export const TINT_COLORS: Record<Tint, string> = { red: '#d42a2a', blue: '#1d4ed8', gray: '#555' }

const SCALE_H = 480

/** Where things sit on the drawn thermometer, in drawing units. The scale runs
 *  480 units from its lowest mark to its highest in every unit. The bore
 *  (the fine tube the liquid rises in) runs down the middle, with the marks
 *  on its left and the numbers on its right. Below the scale the stem tapers
 *  in to a pinch, then swells a little into the bulb. */
export function glassLayout(scale: GlassScale) {
  const width = 72
  const left = 4
  const right = width - 4
  const cx = width / 2
  const top = 4
  const yMax = top + 44
  const yMin = yMax + SCALE_H
  const stemBottom = yMin + 28
  const neckY = stemBottom + 34
  const bulbBottom = neckY + 80
  const bore = { x: cx, w: 6 }
  return {
    width,
    height: bulbBottom + 2,
    left,
    right,
    top,
    /** where the stem starts to taper toward the pinch */
    stemBottom,
    /** the pinch, where the tapering stem meets the glass around the bulb */
    neckY,
    /** the bottom of the glass around the bulb */
    bulbBottom,
    /** half the width of the liquid in the bulb */
    bulbHalf: 6,
    /** the glass's thickness around the bore and the bulb */
    wall: 3,
    bore,
    /** where the marks end, just left of the bore; they run leftward from here */
    tickX: bore.x - bore.w / 2 - 2,
    /** where the numbers start, just right of the bore */
    labelX: bore.x + bore.w / 2 + 4,
    /** drawing units per degree */
    perDegree: SCALE_H / (scale.max - scale.min),
    yOf: (t: number) => yMin - ((t - scale.min) / (scale.max - scale.min)) * SCALE_H,
    yMin,
    yMax,
  }
}
