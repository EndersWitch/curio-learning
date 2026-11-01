// Every choice the teacher makes about a quadrilateral, and what those
// choices mean. Which kinds a generator offers and the figure it opens with
// belong to its family (see family.ts), which also reads and writes page
// addresses.
//
// Measures are kept as the text the teacher typed ("12", "3sqrt(2)", "5/2");
// readQuadrilateral() works out what they mean. Only the kind's own measures
// are kept.

import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { parseNumber } from '$lib/shared/math.js'
import {
  LABEL_MODES, LINE_LABEL_MODES, LINE_STYLES, MARKS, ROUNDING,
  cleanAgainst, oneOf, readMoved, writeMoved,
  type LabelMode, type LineLabelMode, type LineStyle, type RawSettings,
} from '$lib/shapes/parts.js'
import { CORNERS, SIDES, isAngle, kindOf, measure, type Corner, type KindId, type Measure, type Point, type Side } from './kinds.js'

export { CORNERS, SIDES, readMoved, writeMoved }
export type { RawSettings }

/** A height: from D or C straight down to AB. */
export type Height = 'hD' | 'hC'
export const HEIGHTS: Height[] = ['hD', 'hC']
/** A diagonal: AC or BD. */
export type Diagonal = 'dAC' | 'dBD'
export const DIAGONALS: Diagonal[] = ['dAC', 'dBD']
type Part = Corner | Side
const PARTS: Part[] = [...CORNERS, ...SIDES]
export const MEASURES: Measure[] = [...SIDES, ...CORNERS, 'h']
/** The side at the bottom: one of the four, or "" for how the kind stands. */
export const BASES = ['', ...SIDES] as const

export type Settings = { kind: KindId } & { [K in `name${Corner}`]: string } & { [K in Measure]: string } & {
  [K in `${Part}Label`]: LabelMode
} & { [K in `${Part}Text`]: string } & { [K in `${Corner}Arcs`]: number } & { [K in `${Side}Ticks` | `${Side}Arrows`]: number } & {
  [K in Height | Diagonal]: boolean
} & { [K in `${Height | Diagonal}Style`]: LineStyle } & { [K in `${Height | Diagonal}Label`]: LineLabelMode } & {
  [K in `${Height | Diagonal}Text` | `${Height}Foot`]: string
} & {
  cross: string
  unit: string
  round: number
  square: boolean
  base: (typeof BASES)[number]
  flip: boolean
  rotate: number
  moved: string
  labelSize: LabelSize
}

const parts = <K extends string>(keys: K[], make: (key: K) => [string, unknown][]) => Object.fromEntries(keys.flatMap(make))

/** A kind with nothing labeled or marked beyond its given measures. */
export function plain(kind: KindId): Settings {
  const k = kindOf(kind)
  return {
    kind,
    ...parts(CORNERS, (v) => [[`name${v}`, v]]),
    ...parts(MEASURES, (m) => [[m, k.sample[m] ?? '']]),
    ...parts(PARTS, (p) => [[`${p}Label`, 'auto'], [`${p}Text`, '']]),
    ...parts(CORNERS, (v) => [[`${v}Arcs`, 0]]),
    ...parts(SIDES, (s) => [[`${s}Ticks`, 0], [`${s}Arrows`, 0]]),
    // A trapezoid's height is one of its measures, so it's drawn, labeled with it.
    ...parts(HEIGHTS, (h) => {
      const shown = h === 'hD' && k.givens.includes('h')
      return [[h, shown], [`${h}Style`, 'dashed'], [`${h}Label`, shown ? 'measure' : 'none'], [`${h}Text`, ''], [`${h}Foot`, '']]
    }),
    ...parts(DIAGONALS, (d) => [[d, false], [`${d}Style`, 'solid'], [`${d}Label`, 'none'], [`${d}Text`, '']]),
    cross: '',
    unit: '',
    round: 1,
    square: true, // right-angle squares
    base: '',
    flip: false,
    rotate: 0,
    moved: '', // labels dragged from their spots: "AB:4,-6;vC:0,3"
    labelSize: 'medium',
  } as Settings
}

/** What carries over when the teacher picks another kind: everything but its measures, labels and markings. */
export const KEPT_ON_SWITCH = ['nameA', 'nameB', 'nameC', 'nameD', 'unit', 'round', 'square', 'base', 'flip', 'rotate', 'labelSize'] as const

/** Tidy raw values (from a form, a link or a stored preset) into usable settings for a kind, whose defaults are `d`. */
export function tidy(kind: KindId, d: Settings, s: RawSettings): Settings {
  const out = cleanAgainst(d, s)
  out.kind = kind
  for (const m of MEASURES) if (!kindOf(kind).givens.includes(m)) out[m] = ''
  const fallback = (key: string, list: readonly unknown[]) => (out[key] = oneOf(list, out[key], (d as RawSettings)[key]))
  for (const p of PARTS) fallback(`${p}Label`, LABEL_MODES)
  for (const v of CORNERS) fallback(`${v}Arcs`, MARKS)
  for (const s of SIDES) for (const m of ['Ticks', 'Arrows']) fallback(`${s}${m}`, MARKS)
  for (const l of [...HEIGHTS, ...DIAGONALS]) {
    fallback(`${l}Style`, Object.keys(LINE_STYLES))
    fallback(`${l}Label`, LINE_LABEL_MODES)
  }
  for (const v of CORNERS) out[`name${v}`] = out[`name${v}`].slice(0, 4)
  out.round = oneOf(ROUNDING, out.round, d.round)
  out.base = oneOf(BASES, out.base, d.base)
  out.rotate = Math.max(-180, Math.min(180, Math.round(out.rotate)))
  out.moved = writeMoved(readMoved(out.moved))
  out.labelSize = cleanLabelSize(out.labelSize)
  return out as Settings
}

export const names = (s: Settings) => Object.fromEntries(CORNERS.map((v) => [v, s[`name${v}`].trim() || v])) as Record<Corner, string>
/** A measure's name as the teacher's corners read: ∠B, AB, or the height. */
export function measureName(s: Settings, m: Measure) {
  const n = names(s)
  if (m === 'h') return 'the height'
  return isAngle(m) ? `∠${n[m]}` : `${n[m[0] as Corner]}${n[m[1] as Corner]}`
}

/** A quadrilateral worked out: its corners (y up, before placing), angles and side lengths. */
export type Shape = { corners: Record<Corner, Point>; angles: Record<Corner, number>; sides: Record<Side, number> }

/**
 * What the settings mean: each measure as a number, the quadrilateral, and
 * anything the teacher should fix, as messages for the settings panel.
 * `shape` is null when the measures don't make one.
 */
export type QuadrilateralRead = {
  shape: Shape | null
  given: Record<Measure, number | null>
  problems: Partial<Record<Measure, string>>
  problem: string | null
  field: Measure | null
}

export function readQuadrilateral(s: Settings): QuadrilateralRead {
  const kind = kindOf(s.kind)
  const problems: Partial<Record<Measure, string>> = {}
  const given = Object.fromEntries(MEASURES.map((m) => [m, null])) as Record<Measure, number | null>
  for (const m of kind.givens) {
    const typed = s[m].trim()
    const v = typed ? parseNumber(typed) : null
    given[m] = v
    if (!typed) problems[m] = isAngle(m) ? `Give ${measureName(s, m)} in degrees.` : `Give ${measureName(s, m)} a length.`
    else if (v === null) problems[m] = isAngle(m) ? 'Type a number of degrees, like 60 or 67.5.' : 'Type a number, like 12, 2.5, 5/2 or 3√2.'
    else if (isAngle(m) && (v <= 0 || v >= 180)) problems[m] = `${measureName(s, m)} has to be between 0° and 180°.`
    else if (!isAngle(m) && v <= 0) problems[m] = `${measureName(s, m)[0].toUpperCase()}${measureName(s, m).slice(1)} has to be more than 0.`
  }
  const none = { shape: null, given, problems }
  if (Object.keys(problems).length) return { ...none, problem: null, field: null }
  const corners = kind.corners(given as Record<Measure, number>, (m) => measureName(s, m))
  if ('problem' in corners) return { ...none, problem: corners.problem, field: corners.field }
  return { shape: { corners, ...measure(corners) }, given, problems, problem: null, field: null }
}
