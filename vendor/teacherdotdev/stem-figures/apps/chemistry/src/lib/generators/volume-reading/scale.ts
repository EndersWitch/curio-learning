// The scale printed on each volume instrument, and what counts as a valid
// reading on it: one digit beyond the smallest mark (the estimated digit).

import { marks, type Mark } from '$lib/shared/marks'

export const INSTRUMENTS = ['cylinder', 'buret', 'beaker'] as const
export type Instrument = (typeof INSTRUMENTS)[number]

export const CYLINDER_SIZES = ['10', '25', '50', '100', '250', '1000'] as const
export type CylinderSize = (typeof CYLINDER_SIZES)[number]

export const BEAKER_SIZES = ['small', 'medium', 'large'] as const
export type BeakerSize = (typeof BEAKER_SIZES)[number]

/** mL and cm³ are the same size, so the unit never changes a reading. */
export const VOLUME_UNITS = ['mL', 'cm3'] as const
export type VolumeUnit = (typeof VOLUME_UNITS)[number]
export const UNIT_SYMBOLS: Record<VolumeUnit, string> = { mL: 'mL', cm3: 'cm³' }

/** The mL between the smallest marks: the instrument's standard ones, or
 *  one of the spacings it offers (see scaleOptions). */
export const MARK_SPACINGS = ['standard', '0.1', '0.2', '0.5', '1', '2', '5', '10', '20', '25', '50', '100'] as const
export type MarkSpacing = (typeof MARK_SPACINGS)[number]

/** The mL between numbered marks, the same way; 'none' leaves the numbers
 *  off the standard numbered marks, for students to work out. */
export const NUMBER_SPACINGS = ['standard', '1', '2', '5', '10', '20', '25', '50', '100', '200', 'none'] as const
export type NumberSpacing = (typeof NUMBER_SPACINGS)[number]

/** Which instrument, and the size of each kind that has sizes. */
export interface VolumeInstrument {
  instrument: Instrument
  size: CylinderSize
  beaker: BeakerSize
}

/** How the instrument's scale is printed and read; each is its standard
 *  when left out. */
export interface ScaleChoice {
  marks: MarkSpacing
  numbers: NumberSpacing
}

export interface Scale {
  capacity: number
  /** mL at the lowest mark; below it the glass is unmarked */
  lowest: number
  /** mL between numbered marks */
  labelEvery: number
  /** mL between the smallest marks */
  minorEvery: number
  /** decimal places in a reading */
  decimals: number
  /** true when 0 is at the top and readings grow downward (a buret) */
  readsDown: boolean
}

export interface VolumeScale extends Scale {
  /** false when the numbered marks are left without their numbers */
  numbered: boolean
}

/** An instrument's standard marks (minorEvery, labelEvery) and the spacings
 *  a teacher may pick instead: marks a step finer or coarser, and numbers
 *  that stay readable on the whole instrument and land on its top mark. */
type Marks = Omit<Scale, 'decimals' | 'readsDown' | 'lowest'> & { lowest?: number; marks: number[]; numbers: number[] }

// Numbered every tenth of capacity, except where real cylinders differ: the
// 25 mL has 0.5 mL marks numbered every 5 mL; the 50 mL has 1 mL marks
// rather than 0.5 mL, and is numbered every 10 mL like the 100 mL so it gets
// the same medium mark halfway between numbers; the 250 mL has 2 mL marks
// from 10 mL up, numbered 10, 30, 50… 250.
const CYLINDERS: Record<CylinderSize, Marks> = {
  '10': { capacity: 10, labelEvery: 1, minorEvery: 0.1, marks: [0.1, 0.2, 0.5], numbers: [1, 2, 5] },
  '25': { capacity: 25, labelEvery: 5, minorEvery: 0.5, marks: [0.2, 0.5, 1], numbers: [1, 5] },
  '50': { capacity: 50, labelEvery: 10, minorEvery: 1, marks: [0.5, 1, 2], numbers: [5, 10] },
  '100': { capacity: 100, labelEvery: 10, minorEvery: 1, marks: [0.5, 1, 2, 5], numbers: [5, 10, 20] },
  '250': { capacity: 250, lowest: 10, labelEvery: 20, minorEvery: 2, marks: [1, 2, 5], numbers: [10, 20] },
  '1000': { capacity: 1000, labelEvery: 100, minorEvery: 10, marks: [5, 10, 20, 50], numbers: [50, 100, 200] },
}

const BURET: Marks = { capacity: 50, labelEvery: 1, minorEvery: 0.1, marks: [0.1, 0.2, 0.5], numbers: [1, 2, 5] }

// Beakers are marked coarsely, like real ones: a line every 10, 25 or 50 mL.
const BEAKERS: Record<BeakerSize, Marks> = {
  small: { capacity: 50, labelEvery: 10, minorEvery: 10, marks: [5, 10], numbers: [10, 25] },
  medium: { capacity: 250, labelEvery: 50, minorEvery: 25, marks: [10, 25, 50], numbers: [25, 50] },
  large: { capacity: 600, labelEvery: 100, minorEvery: 50, marks: [25, 50, 100], numbers: [100, 200] },
}

const marksOf = ({ instrument, size, beaker }: VolumeInstrument): Marks =>
  instrument === 'buret' ? BURET : instrument === 'beaker' ? BEAKERS[beaker] : CYLINDERS[size]

/** The mL between the smallest marks and between numbered marks that the
 *  instrument can be printed with, and its standard ones. */
export function scaleOptions(choice: VolumeInstrument) {
  const m = marksOf(choice)
  return { marks: m.marks, numbers: m.numbers, standard: { marks: m.minorEvery, numbers: m.labelEvery } }
}

/** Whether marks `minor` mL apart can be numbered every `numbered` mL: each
 *  number on a mark, with no more than 20 marks from one to the next. */
export function numbersFit(minor: number, numbered: number) {
  const perNumber = numbered / minor
  return Math.abs(perNumber - Math.round(perNumber)) < 1e-9 && Math.round(perNumber) <= 20
}

/** The standard numbers for marks `minor` mL apart: the instrument's own,
 *  or where too many marks would fall between them (a 25 mL cylinder's
 *  0.2 mL marks), the widest it offers that fit. */
function standardNumbers(m: Marks, minor: number) {
  return numbersFit(minor, m.labelEvery) ? m.labelEvery : (m.numbers.findLast((n) => numbersFit(minor, n)) ?? m.labelEvery)
}

/** The marks and numbers kept to what the instrument offers: spacings it
 *  doesn't have, and numbers that don't fall on its marks, go back to its
 *  standard ones, and its standard ones are written 'standard'. */
export function fitScale(c: VolumeInstrument & ScaleChoice): ScaleChoice {
  const m = marksOf(c)
  const minor = c.marks === 'standard' || !m.marks.includes(Number(c.marks)) ? m.minorEvery : Number(c.marks)
  const standard = standardNumbers(m, minor)
  const every = c.numbers === 'standard' || c.numbers === 'none' || !m.numbers.includes(Number(c.numbers)) ? standard : Number(c.numbers)
  return {
    marks: minor === m.minorEvery ? 'standard' : (String(minor) as MarkSpacing),
    numbers: c.numbers === 'none' ? 'none' : !numbersFit(minor, every) || every === standard ? 'standard' : (String(every) as NumberSpacing),
  }
}

/** Decimal places that reach one digit past the smallest mark: 0.1 → 2, 0.5 → 2, 1 → 1, 5 → 1, 10 → 0, 50 → 0. */
const estimatedDecimals = (minorEvery: number) => Math.max(0, Math.ceil(-Math.log10(minorEvery) - 1e-9) + 1)

export function volumeScale(c: VolumeInstrument & Partial<ScaleChoice>): VolumeScale {
  const m = marksOf(c)
  const fitted = fitScale({ ...c, marks: c.marks ?? 'standard', numbers: c.numbers ?? 'standard' })
  const minorEvery = fitted.marks === 'standard' ? m.minorEvery : Number(fitted.marks)
  const labelEvery = fitted.numbers === 'standard' || fitted.numbers === 'none' ? standardNumbers(m, minorEvery) : Number(fitted.numbers)
  return {
    capacity: m.capacity,
    lowest: m.lowest ?? 0,
    labelEvery,
    minorEvery,
    decimals: estimatedDecimals(minorEvery),
    readsDown: c.instrument === 'buret',
    numbered: fitted.numbers !== 'none',
  }
}

/** Every mark printed on the instrument, from its lowest up. */
export function scaleMarks(scale: VolumeScale): Mark[] {
  const list = marks({ ...scale, from: scale.lowest, max: scale.capacity })
  return scale.numbered ? list : list.map(({ value, kind }) => ({ value, kind }))
}

/** The scale in a few words, e.g. "1 mL marks, numbered every 10 mL". */
export function scaleSummary(scale: VolumeScale, unit: VolumeUnit) {
  const u = UNIT_SYMBOLS[unit]
  return `${scale.minorEvery} ${u} marks, ${scale.numbered ? `numbered every ${scale.labelEvery} ${u}` : 'no numbers'}`
}

/** What a figure's instrument is called, e.g. "250 mL beaker". */
export function instrumentName(choice: VolumeInstrument, unit: VolumeUnit = 'mL'): string {
  const { capacity } = volumeScale(choice)
  const kind = { cylinder: 'graduated cylinder', buret: 'buret', beaker: 'beaker' }[choice.instrument]
  return `${capacity} ${UNIT_SYMBOLS[unit]} ${kind}`
}

export function roundReading(scale: Scale, value: number): number {
  const clamped = Math.min(scale.capacity, Math.max(scale.lowest, value))
  return Number(clamped.toFixed(scale.decimals))
}

export const formatReading = (scale: Scale, value: number) => value.toFixed(scale.decimals)

/** A reading a teacher might set: away from the very ends of a buret, and a
 *  cylinder or beaker neither nearly empty nor nearly full. */
export function randomReading(scale: Scale, random: () => number = Math.random): number {
  const [low, high] = scale.readsDown ? [0.01, 0.99] : [0.15, 0.9]
  return roundReading(scale, scale.capacity * (low + random() * (high - low)))
}
