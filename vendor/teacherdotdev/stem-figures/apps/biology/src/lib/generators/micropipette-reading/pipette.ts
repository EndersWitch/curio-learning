// An adjustable micropipette (Gilson Pipetman style): the sizes a lab has,
// what each one's volume display means, and checking a typed volume against
// what that pipette can be set to.
//
// The display is digit wheels read top to bottom: three, or four on the
// P1000. Which places they stand for depends on the model, and red wheels mark
// where the decimal point goes (Gilson's Pipetman guide):
//   P2      1 µL, 0.1 µL, 0.01 µL            red: the bottom two  1-2-5 is 1.25 µL
//   P10/P20 10 µL, 1 µL, 0.1 µL              red: the bottom one  1-2-5 is 12.5 µL
//   P100/P200 100 µL, 10 µL, 1 µL            none                 1-2-5 is 125 µL
//   P1000   1000 µL, 100 µL, 10 µL, 1 µL     none                 0-7-5-0 is 750 µL
// Each is used from a tenth of its largest volume up to it, as lab manuals
// teach (P20: 2 to 20 µL).

/** Models, as the address writes them. Each is shown by its largest volume: "20 µL". */
export const MODELS = ['P2', 'P10', 'P20', 'P100', 'P200', 'P1000'] as const
export type Model = (typeof MODELS)[number]

export interface Pipette {
  model: Model
  /** what it's called on the page and printed on it: its largest volume, "20 µL" */
  name: string
  /** the largest volume it's set to, in µL */
  max: number
  /** the smallest, in µL */
  min: number
  /** what each wheel counts, top to bottom, in µL */
  places: number[]
  /** which wheels are red, top to bottom */
  red: boolean[]
  /** decimal places in a volume in µL: the bottom wheel's place */
  decimals: number
  /** the volume Gilson's guide shows it set to, in µL */
  example: number
  /** how wide its shaft is drawn: the small ones are slim, the P1000 stout */
  shaft: 'slim' | 'medium' | 'wide'
  /** the tip it takes, for the tip's color: clear 10 µL, yellow 200 µL, blue 1000 µL */
  tip: 'clear' | 'yellow' | 'blue'
}

const R = true
const B = false

const PIPETTES: Record<Model, Omit<Pipette, 'model' | 'name' | 'min' | 'decimals'>> = {
  P2: { max: 2, places: [1, 0.1, 0.01], red: [B, R, R], example: 1.25, shaft: 'slim', tip: 'clear' },
  P10: { max: 10, places: [10, 1, 0.1], red: [B, B, R], example: 7.5, shaft: 'slim', tip: 'clear' },
  P20: { max: 20, places: [10, 1, 0.1], red: [B, B, R], example: 12.5, shaft: 'medium', tip: 'yellow' },
  P100: { max: 100, places: [100, 10, 1], red: [B, B, B], example: 75, shaft: 'medium', tip: 'yellow' },
  P200: { max: 200, places: [100, 10, 1], red: [B, B, B], example: 125, shaft: 'medium', tip: 'yellow' },
  P1000: { max: 1000, places: [1000, 100, 10, 1], red: [B, B, B, B], example: 750, shaft: 'wide', tip: 'blue' },
}

export function pipette(model: Model): Pipette {
  const p = PIPETTES[model]
  const decimals = Math.max(0, Math.round(-Math.log10(p.places[p.places.length - 1])))
  return { ...p, model, name: `${p.max} µL`, min: p.max / 10, decimals }
}

/** The smallest step a volume can take on it, in µL: one on the bottom wheel. */
export const stepOf = (p: Pipette) => p.places[p.places.length - 1]

/** Where the line marking the decimal point goes: after this many wheels from
 *  the top, between the black wheels and the red ones. Null with no red wheel. */
export function decimalAfter(p: Pipette): number | null {
  for (let i = 0; i < p.red.length - 1; i++) if (p.red[i] !== p.red[i + 1]) return i + 1
  return null
}

/** How many bottom-wheel steps a volume is, as a whole number. */
const stepsIn = (p: Pipette, volume: number) => Math.round(volume / stepOf(p) + 1e-9 * Math.sign(volume))

/** The digits the wheels show for a volume, top to bottom. */
export function digitsFor(p: Pipette, volume: number): number[] {
  const n = stepsIn(p, volume)
  const count = p.places.length
  return p.places.map((_, i) => Math.floor(n / 10 ** (count - 1 - i)) % 10)
}

/** The volume the wheels' digits stand for, in µL. */
export function volumeOf(p: Pipette, digits: readonly number[]): number {
  const n = digits.reduce((sum, d) => sum * 10 + d, 0)
  return roundTo(n * stepOf(p), p.decimals)
}

/** `n` to `decimals` places. */
export function roundTo(n: number, decimals: number) {
  const f = 10 ** decimals
  return Math.round(n * f + 1e-9) / f
}

/** A volume it can be set to: on a whole step, within its range. */
export function tidyVolume(p: Pipette, volume: number) {
  const v = roundTo(Math.round(volume / stepOf(p) + 1e-9) * stepOf(p), p.decimals)
  return Math.min(p.max, Math.max(p.min, v))
}

/** Whether it can be set to a volume: within its range, on a whole step. */
export const canSet = (p: Pipette, volume: number) =>
  volume >= p.min - 1e-9 && volume <= p.max + 1e-9 && Math.abs(stepsIn(p, volume) * stepOf(p) - volume) < 1e-9

/** "12.5 µL", "1.25 µL", "750 µL": to the bottom wheel's place. */
export const volumeText = (p: Pipette, volume: number) => `${volume.toFixed(p.decimals)} µL`

/** The step written plainly: "0.1 µL", "10 µL". */
const stepText = (p: Pipette) => `${stepOf(p)} µL`

const plain = (n: number) => String(roundTo(n, 6))

/**
 * A volume as the teacher typed it, checked against the pipette: the volume
 * in µL, or why it can't be set, in a sentence. A comma works as the decimal
 * point, and "µL" or "ul" after the number is fine.
 */
export function readVolume(p: Pipette, typed: string): { volume: number; error?: undefined } | { volume?: undefined; error: string } {
  const text = typed.trim().replace(/\s*(µ|u|μ)l$/i, '').replace(',', '.')
  if (text === '') return { error: `Type a volume in µL, like ${plain(p.example)}.` }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(text)) return { error: `“${typed.trim()}” isn’t a volume. Type it in µL, like ${plain(p.example)}.` }
  const v = Number(text)
  if (v < p.min - 1e-9 || v > p.max + 1e-9)
    return { error: `A ${p.name} pipette is set from ${plain(p.min)} to ${plain(p.max)} µL, so it can’t be set to ${plain(v)} µL.` }
  if (!canSet(p, v)) {
    const near = tidyVolume(p, v)
    return { error: `A ${p.name} pipette is set in steps of ${stepText(p)}, so ${plain(v)} µL can’t be dialed. The nearest is ${plain(near)} µL.` }
  }
  return { volume: roundTo(v, p.decimals) }
}

/** A volume a teacher might set: anywhere in its range, on a whole step. */
export function randomVolume(p: Pipette, random: () => number = Math.random) {
  const lo = stepsIn(p, p.min)
  const hi = stepsIn(p, p.max)
  return roundTo(Math.min(hi, lo + Math.floor(random() * (hi - lo + 1))) * stepOf(p), p.decimals)
}

/** A volume carried over to another pipette: kept if it can be set there,
 *  otherwise that pipette's own example volume. */
export const carryVolume = (p: Pipette, volume: number) => (canSet(p, volume) ? roundTo(volume, p.decimals) : p.example)
