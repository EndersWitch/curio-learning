// The temperature units a teacher can choose, and converting between them.

export const TEMPERATURE_UNITS = ['celsius', 'kelvin', 'fahrenheit'] as const
export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number]

/** The unit as written after a number: "°C", "K" (never "°K"), "°F". */
export const UNIT_SYMBOLS: Record<TemperatureUnit, string> = { celsius: '°C', kelvin: 'K', fahrenheit: '°F' }

export const UNIT_NAMES: Record<TemperatureUnit, string> = { celsius: 'Celsius', kelvin: 'Kelvin', fahrenheit: 'Fahrenheit' }

const toCelsius: Record<TemperatureUnit, (t: number) => number> = {
  celsius: (t) => t,
  kelvin: (t) => t - 273.15,
  fahrenheit: (t) => ((t - 32) * 5) / 9,
}

const fromCelsius: Record<TemperatureUnit, (c: number) => number> = {
  celsius: (c) => c,
  kelvin: (c) => c + 273.15,
  fahrenheit: (c) => (c * 9) / 5 + 32,
}

export const convertTemperature = (t: number, from: TemperatureUnit, to: TemperatureUnit) => fromCelsius[to](toCelsius[from](t))

/** "23.4 °C", "296.6 K": a space before the symbol, as SI writes it. */
export const withUnit = (text: string, unit: TemperatureUnit) => `${text} ${UNIT_SYMBOLS[unit]}`

/** `t` to `decimals` places, halves away from zero. Converted temperatures
 *  land on halves (0 °C is 273.15 K), where toFixed can round the wrong way
 *  because 273.15 is stored as 273.1499…. */
export function roundTo(t: number, decimals: number) {
  const f = 10 ** decimals
  return (Math.sign(t) * Math.round(Math.abs(t) * f + 1e-6)) / f || 0
}
