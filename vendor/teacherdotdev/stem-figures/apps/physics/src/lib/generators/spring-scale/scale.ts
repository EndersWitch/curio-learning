// A spring scale (a newton meter): the sizes a school lab has, each
// color-coded by its capacity, the scale printed on each in newtons and in
// grams, what counts as a reading on it (one digit beyond the smallest mark,
// the estimated digit), and where things sit on the drawing.

/** Capacities in newtons, as the address writes them. */
export const CAPACITIES = ['1', '2.5', '5', '10', '20', '30', '50'] as const
export type Capacity = (typeof CAPACITIES)[number]

/** What the scale is printed in: newtons, grams, or both. Newtons are always
 *  left of the slot and grams right of it. */
export const SCALE_UNITS = ['newtons', 'grams', 'both'] as const
export type ScaleUnits = (typeof SCALE_UNITS)[number]

/** What hangs from the hook. */
export const HANGING = ['none', 'block', 'masses'] as const
export type Hanging = (typeof HANGING)[number]

/** Grams printed per newton. The scales themselves say "100 g / 1 N", taking
 *  g as 10 N/kg, so every gram mark sits level with a newton mark. */
export const GRAMS_PER_NEWTON = 100

export interface SpringScale {
  /** newtons at the bottom mark */
  capacity: number
  /** newtons between numbered marks */
  labelEvery: number
  /** newtons between the smallest marks */
  minorEvery: number
  /** decimal places in a reading in newtons; one in grams has two fewer */
  decimals: number
  /** how far the pointer can sit from zero with nothing hanging, either way */
  maxZero: number
  /** its color, the color name printed on its tag, and the ink for writing on it */
  color: string
  colorName: string
  ink: string
}

// Each scale has from 10 to 15 numbered steps, like the ones in school labs.
const SCALES: Record<Capacity, Omit<SpringScale, 'capacity' | 'decimals' | 'maxZero'>> = {
  '1': { labelEvery: 0.1, minorEvery: 0.01, color: '#f472b6', colorName: 'pink', ink: '#111' },
  '2.5': { labelEvery: 0.25, minorEvery: 0.05, color: '#3b82f6', colorName: 'blue', ink: '#fff' },
  '5': { labelEvery: 0.5, minorEvery: 0.1, color: '#22a55a', colorName: 'green', ink: '#fff' },
  '10': { labelEvery: 1, minorEvery: 0.1, color: '#c69c6d', colorName: 'tan', ink: '#111' },
  '20': { labelEvery: 2, minorEvery: 0.2, color: '#dc2626', colorName: 'red', ink: '#fff' },
  '30': { labelEvery: 2, minorEvery: 0.2, color: '#ffffff', colorName: 'white', ink: '#111' },
  '50': { labelEvery: 5, minorEvery: 0.5, color: '#facc15', colorName: 'yellow', ink: '#111' },
}

/** Decimal places reaching one digit past the smallest mark's place:
 *  0.01 → 3, 0.05 → 3, 0.1 → 2, 0.5 → 2, 1 → 1, 10 → 0, 50 → 0. */
export const estimatedDecimals = (minorEvery: number) => Math.ceil(-Math.log10(minorEvery) - 1e-9) + 1

export function springScale(capacity: Capacity): SpringScale {
  const s = SCALES[capacity]
  const n = Number(capacity)
  return { ...s, capacity: n, decimals: estimatedDecimals(s.minorEvery), maxZero: n / 10 }
}

/** The same scale in grams, for its marks and numbers. */
export const inGrams = (scale: SpringScale) => ({
  capacity: scale.capacity * GRAMS_PER_NEWTON,
  labelEvery: scale.labelEvery * GRAMS_PER_NEWTON,
  minorEvery: scale.minorEvery * GRAMS_PER_NEWTON,
  decimals: Math.max(0, scale.decimals - 2),
})

/** `n` to `decimals` places, halves away from zero, so a reading typed in
 *  grams lands on the same newtons it shows. */
export function roundTo(n: number, decimals: number) {
  const f = 10 ** decimals
  return (Math.sign(n) * Math.round(Math.abs(n) * f + 1e-6)) / f || 0
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** A zero offset the scale can have, in newtons: rounded, and no further from zero than it allows. */
export const tidyZero = (scale: SpringScale, zero: number) => clamp(roundTo(zero, scale.decimals), -scale.maxZero, scale.maxZero)

/** The most force the scale can show with its zero offset: the pointer stops at the bottom mark. */
export const maxForce = (scale: SpringScale, zero: number) => roundTo(scale.capacity - Math.max(0, zero), scale.decimals)

/** A force the scale can show, in newtons, with its zero offset. */
export const tidyForce = (scale: SpringScale, zero: number, force: number) =>
  clamp(roundTo(force, scale.decimals), 0, maxForce(scale, zero))

/** A force a teacher might set: somewhere between a tenth and nine tenths of what the scale shows. */
export function randomForce(scale: SpringScale, zero: number, random: () => number = Math.random) {
  return tidyForce(scale, zero, maxForce(scale, zero) * (0.1 + random() * 0.8))
}

/** "3.47 N", "347 g": a space before the unit, as SI writes it. A signed
 *  value (a zero offset) gets its + or −. */
export function newtonsText(scale: SpringScale, n: number, signed = false) {
  return `${sign(n, signed)}${Math.abs(n).toFixed(scale.decimals)} N`
}

export function gramsText(scale: SpringScale, n: number, signed = false) {
  const g = roundTo(n * GRAMS_PER_NEWTON, inGrams(scale).decimals)
  return `${sign(g, signed)}${Math.abs(g).toFixed(inGrams(scale).decimals)} g`
}

const sign = (n: number, signed: boolean) => (n < 0 ? '−' : signed && n > 0 ? '+' : '')

const SCALE_H = 480
/** Room above the zero mark for a pointer that sits above it: the largest zero offset. */
const HEADROOM = SCALE_H / 10

/** Where things sit on the drawn spring scale, in drawing units. The scale
 *  runs 480 units from zero down to its capacity, whatever that is. A ring
 *  to hold it by sits on the colored cap, and the body below it has a slot
 *  down the middle where the spring pulls the pointer down. Newtons are
 *  printed left of it and grams right of it, so the body is as wide for one
 *  unit as for both. A rod comes out the bottom to the hook. */
export function springLayout(scale: SpringScale) {
  const half = 66
  const width = 2 * half + 4
  const cx = width / 2
  const capTop = 26
  const bodyTop = capTop + 26
  const headerY = bodyTop + 14
  // below the unit symbols, room for the spring's top coils and the headroom
  const zeroY = bodyTop + 52 + HEADROOM
  const fullY = zeroY + SCALE_H
  const bodyBottom = fullY + 22
  const rodBottom = bodyBottom + 30
  const hookBottom = rodBottom + 36
  const slot = { half: 6, top: headerY + 10, bottom: bodyBottom - 10 }
  return {
    width,
    cx,
    left: cx - half,
    right: cx + half,
    ring: { cy: 14, r: 9 },
    capTop,
    bodyTop,
    /** the unit symbols' line */
    headerY,
    zeroY,
    fullY,
    bodyBottom,
    rodBottom,
    /** the inside of the hook's bend, where a load hangs */
    hookBottom,
    slot,
    /** where every mark starts, just beside the slot; newton marks run left from here, gram marks right */
    tickLeft: cx - slot.half - 2,
    tickRight: cx + slot.half + 2,
    /** drawing units per newton */
    perNewton: SCALE_H / scale.capacity,
    yOf: (newtons: number) => zeroY + (newtons / scale.capacity) * SCALE_H,
  }
}

export type SpringLayout = ReturnType<typeof springLayout>

const BLOCK = { width: 64, height: 52, string: 16 }
const MASS = { width: 56, height: 11, string: 14, base: 5 }

/** Where a load hangs from the hook: a block on a string, or a hanger with
 *  `masses` slotted masses stacked on its base. */
export function loadLayout(at: SpringLayout, hanging: Hanging, masses: number) {
  const top = at.hookBottom
  if (hanging === 'block') {
    const y = top + BLOCK.string
    return { kind: 'block' as const, stringTo: y, box: { x: at.cx - BLOCK.width / 2, y, width: BLOCK.width, height: BLOCK.height }, bottom: y + BLOCK.height }
  }
  if (hanging === 'masses') {
    const stackTop = top + MASS.string
    const discs = Array.from({ length: masses }, (_, i) => ({ x: at.cx - MASS.width / 2, y: stackTop + i * MASS.height, width: MASS.width, height: MASS.height }))
    const baseY = stackTop + masses * MASS.height
    return { kind: 'masses' as const, stringTo: stackTop, discs, base: { x: at.cx - MASS.width / 2 - 4, y: baseY, width: MASS.width + 8, height: MASS.base }, bottom: baseY + MASS.base }
  }
  return { kind: 'none' as const, bottom: at.hookBottom + 2 }
}
