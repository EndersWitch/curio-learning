// Temperature Reading's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { MAGNIFIER_VIEWS } from '$lib/shared/magnify'
import { choice, defineSettings, number } from '$lib/shared/settings'
import { randomDigitalReading, roundDigital, digitalRange } from './digital'
import { TINTS, glassScale, randomGlassReading, roundGlass } from './glass'
import { TEMPERATURE_UNITS, withUnit, type TemperatureUnit } from './units'

export const TEMPERATURE_INSTRUMENTS = ['glass', 'digital'] as const
export type TemperatureInstrument = (typeof TEMPERATURE_INSTRUMENTS)[number]

export const temperatureSettings = defineSettings(
  {
    instrument: choice(TEMPERATURE_INSTRUMENTS, 'glass'),
    unit: choice(TEMPERATURE_UNITS, 'celsius'),
    decimals: number({ min: 0, max: 2, fallback: 1 }),
    reading: number({ min: -100, max: 500, fallback: 23.4 }),
    tint: choice(TINTS, 'red'),
    view: choice(MAGNIFIER_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    ...figureTextFields(),
  },
  (s) => {
    const fixed = { ...s, decimals: Math.round(s.decimals), span: Math.round(s.span) }
    return { ...fixed, reading: temperatureRules(fixed).round(s.reading) }
  },
)

export type TemperatureSettings = typeof temperatureSettings.defaults

interface TemperatureRules {
  min: number
  max: number
  decimals: number
  round: (t: number) => number
  random: () => number
}

/** What counts as a reading on the chosen thermometer in the chosen unit. */
export function temperatureRules(s: { instrument: TemperatureInstrument; unit: TemperatureUnit; decimals: number }): TemperatureRules {
  if (s.instrument === 'glass') {
    const scale = glassScale(s.unit)
    return {
      min: scale.min,
      max: scale.max,
      decimals: scale.decimals,
      round: (t) => roundGlass(scale, t),
      random: () => randomGlassReading(scale),
    }
  }
  return {
    ...digitalRange(s.unit),
    decimals: s.decimals,
    round: (t) => roundDigital(s.unit, s.decimals, t),
    random: () => randomDigitalReading(s.unit, s.decimals),
  }
}

export const readingText = (s: TemperatureSettings) => withUnit(s.reading.toFixed(temperatureRules(s).decimals), s.unit)

/** The answer key line, e.g. "Temperature: 23.4 °C". */
export const answerLine = (s: TemperatureSettings) => `Temperature: ${readingText(s)}`
