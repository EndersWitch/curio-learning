// What counts as a pH reading on each instrument. Every one reads 0 to 14:
// a digital meter to the 1 or 2 places it shows, an analog meter one digit
// past its 0.2 marks (the estimated digit), and pH paper to the whole number
// of the color it matches on the chart.

export const PH_INSTRUMENTS = ['digital', 'analog', 'paper'] as const
export type PhInstrument = (typeof PH_INSTRUMENTS)[number]

export const PH_MIN = 0
export const PH_MAX = 14

export const DIGITAL_DECIMALS = [1, 2] as const

/** The analog dial's marks: numbered every 1, the smallest every 0.2. */
export const ANALOG_SCALE = { labelEvery: 1, minorEvery: 0.2, decimals: 2 }

export interface PhRules {
  decimals: number
  round: (pH: number) => number
  random: () => number
}

/** `pH` to `decimals` places, halves up, kept on the scale. */
export function roundPh(pH: number, decimals: number) {
  const f = 10 ** decimals
  return Math.round(Math.min(PH_MAX, Math.max(PH_MIN, pH)) * f + 1e-6) / f
}

export const phDecimals = (s: { instrument: PhInstrument; decimals: number }) =>
  s.instrument === 'digital' ? s.decimals : s.instrument === 'analog' ? ANALOG_SCALE.decimals : 0

/** What counts as a reading on the chosen instrument. A random one is a pH a
 *  lab might see, 1 to 13, away from the ends of the scale. */
export function phRules(s: { instrument: PhInstrument; decimals: number }, random: () => number = Math.random): PhRules {
  const decimals = phDecimals(s)
  return {
    decimals,
    round: (pH) => roundPh(pH, decimals),
    random: () => roundPh(1 + random() * 12, decimals),
  }
}
