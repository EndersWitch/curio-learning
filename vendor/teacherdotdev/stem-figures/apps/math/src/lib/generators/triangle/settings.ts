// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a triangle can be bookmarked or shared.
//
// Measures are kept as the text the teacher typed ("12", "3sqrt(2)", "5/2");
// readTriangle() works out what they mean. The defaults are the triangle the
// generator opens with: ∠B = 90°, ∠A = 24°, AB = 12, and BC labeled x.

import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { parseNumber } from '$lib/shared/math.js'
import {
  LABEL_MODES, LINE_LABEL_MODES, LINE_STYLES, MARKS, ROUNDING,
  cleanAgainst, oneOf, queryAgainst, readMoved, writeMoved,
  type LabelMode, type LineLabelMode, type LineStyle, type RawSettings,
} from '$lib/shapes/parts.js'
import { ANGLES, SIDES, solveTriangle, type Part, type Side, type Solved, type Vertex } from './solve.js'

export { ANGLES, SIDES, readMoved, writeMoved }
export type { LineStyle, RawSettings }
export type { Offset } from '$lib/shapes/parts.js'
export type Height = 'hA' | 'hB' | 'hC'
export const HEIGHTS: Height[] = ['hA', 'hB', 'hC'] // the height from each vertex

export type Settings = { [K in `name${Vertex}`]: string } & { [K in Part]: string } & { [K in `${Part}Label`]: LabelMode } & {
  [K in `${Part}Text`]: string
} & { [K in `${Vertex}Arcs`]: number } & { [K in `${Side}Ticks`]: number } & { [K in Height]: boolean } & {
  [K in `${Height}Style`]: LineStyle
} & { [K in `${Height}Label`]: LineLabelMode } & { [K in `${Height}Text` | `${Height}Foot`]: string } & {
  unit: string
  round: number
  square: boolean
  base: Side
  flip: boolean
  rotate: number
  other: boolean
  moved: string
  labelSize: LabelSize
}
const parts = <K extends string>(keys: K[], make: (key: K) => [string, unknown][]) => Object.fromEntries(keys.flatMap(make))

export const DEFAULT_SETTINGS = {
  nameA: 'A',
  nameB: 'B',
  nameC: 'C',
  A: '24',
  B: '90',
  C: '',
  AB: '12',
  BC: '',
  CA: '',
  ...parts([...ANGLES, ...SIDES], (k) => [[`${k}Label`, k === 'BC' ? 'text' : 'auto'], [`${k}Text`, k === 'BC' ? 'x' : '']]),
  ...parts(ANGLES, (v) => [[`${v}Arcs`, 0]]),
  ...parts(SIDES, (s) => [[`${s}Ticks`, 0]]),
  ...parts(HEIGHTS, (h) => [[h, false], [`${h}Style`, 'dashed'], [`${h}Label`, 'none'], [`${h}Text`, ''], [`${h}Foot`, '']]),
  unit: '',
  round: 1,
  square: true, // right-angle squares
  base: 'AB',
  flip: false,
  rotate: 0,
  other: false, // the ambiguous case's second triangle
  moved: '', // labels dragged from their spots: "AB:4,-6;vC:0,3"
  labelSize: 'medium', // how big the labels are (see labelSize.ts)
} as Settings

/** Settings that describe the figure itself, which is what a preset saves. */
export const FIGURE_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s: RawSettings): Settings {
  const d = DEFAULT_SETTINGS
  const out = cleanAgainst(d, s)
  for (const k of [...ANGLES, ...SIDES]) out[`${k}Label`] = oneOf(LABEL_MODES, out[`${k}Label`], 'auto')
  for (const v of ANGLES) out[`${v}Arcs`] = oneOf(MARKS, out[`${v}Arcs`], 0)
  for (const s of SIDES) out[`${s}Ticks`] = oneOf(MARKS, out[`${s}Ticks`], 0)
  for (const h of HEIGHTS) {
    out[`${h}Style`] = oneOf(Object.keys(LINE_STYLES), out[`${h}Style`], 'dashed')
    out[`${h}Label`] = oneOf(LINE_LABEL_MODES, out[`${h}Label`], 'none')
  }
  for (const v of ANGLES) out[`name${v}`] = out[`name${v}`].slice(0, 4)
  out.round = oneOf(ROUNDING, out.round, d.round)
  out.base = oneOf(SIDES, out.base, d.base)
  out.rotate = Math.max(-180, Math.min(180, Math.round(out.rotate)))
  out.moved = writeMoved(readMoved(out.moved))
  out.labelSize = cleanLabelSize(out.labelSize)
  return out as Settings
}

/** Do two settings draw the same figure? */
export function sameFigure(a: RawSettings, b: RawSettings): boolean {
  const ca = cleanSettings(a)
  const cb = cleanSettings(b)
  return FIGURE_KEYS.every((k) => ca[k] === cb[k])
}

export function settingsToQuery(s: Settings): string {
  return queryAgainst(DEFAULT_SETTINGS, s)
}

export function settingsFromParams(params: URLSearchParams): Settings {
  const s: RawSettings = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS)) if (params.has(key)) s[key] = params.get(key)
  return cleanSettings(s)
}

const names = (s: Settings) => Object.fromEntries(ANGLES.map((v) => [v, s[`name${v}`].trim()]))

/**
 * What the settings mean: each measure as a number, the solved triangle, and
 * anything the teacher should fix, as messages for the settings panel.
 * `triangle` is null when the measures don't make one.
 */
export type TriangleRead = {
  triangle: Solved | null
  given: Record<Part, number | null>
  problems: Partial<Record<Part, string>>
  problem: string | null
  field: Part | null
}

export function readTriangle(s: Settings): TriangleRead {
  const problems: Partial<Record<Part, string>> = {}
  const given = {} as Record<Part, number | null>
  for (const k of [...ANGLES, ...SIDES]) {
    const typed = s[k].trim()
    given[k] = typed ? parseNumber(typed) : null
    if (typed && given[k] === null) problems[k] = ANGLES.includes(k as Vertex) ? 'Type a number of degrees, like 24 or 67.5.' : 'Type a number, like 12, 2.5, 5/2 or 3√2.'
  }
  if (Object.keys(problems).length) return { triangle: null, given, problems, problem: null, field: null }
  const solved = solveTriangle(given, { other: s.other, names: names(s) })
  if (solved.problem) return { triangle: null, given, problems, problem: solved.problem, field: solved.field }
  return { triangle: solved as Solved, given, problems, problem: null, field: null }
}
