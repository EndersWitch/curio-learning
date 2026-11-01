// Every choice the teacher makes for a regular polygon, with its default. The
// page address carries any non-default values, so a polygon can be
// bookmarked or shared.
//
// The polygon's size comes from one measure the teacher types: its side, its
// radius or its apothem, kept as typed ("8", "4sqrt(3)"). readPolygon()
// works out the rest. The generator opens on a hexagon with side 8, its
// apothem drawn and labeled a, and its center marked.

import { parseNumber } from '$lib/shared/math.js'
import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import {
  LABEL_MODES, LINE_LABEL_MODES, LINE_STYLES, MARKS, ROUNDING,
  cleanAgainst, oneOf, queryAgainst, readMoved, writeMoved,
  type LabelMode, type LineLabelMode, type LineStyle, type RawSettings,
} from '$lib/shapes/parts.js'

export { readMoved, writeMoved }
export type { RawSettings }

export const MIN_SIDES = 3
export const MAX_SIDES = 20
/** What each regular polygon is called, by its number of sides; past 12 it's an n-gon. */
const NAMES: Record<number, string> = {
  3: 'Equilateral triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon',
  9: 'Nonagon', 10: 'Decagon', 11: 'Hendecagon', 12: 'Dodecagon',
}
export const polygonName = (n: number) => NAMES[n] ?? `${n}-gon`

/** Which measure sets the polygon's size. */
export const SIZES = { side: 'Side', radius: 'Radius', apothem: 'Apothem' }
export type SizeBy = keyof typeof SIZES

export type Settings = {
  n: number
  sizeBy: SizeBy
  size: string
  // The bottom side, and the angle at its left corner, stand for them all.
  sideLabel: LabelMode
  sideText: string
  sideTicks: number
  angleLabel: LabelMode
  angleText: string
  angleArcs: number
  letters: boolean
  dot: boolean
  centerName: string
  apothem: boolean
  apothemStyle: LineStyle
  apothemLabel: LineLabelMode
  apothemText: string
  radius: boolean
  radiusStyle: LineStyle
  radiusLabel: LineLabelMode
  radiusText: string
  radii: boolean
  unit: string
  round: number
  square: boolean
  rotate: number
  moved: string
  labelSize: LabelSize
}

export const DEFAULT_SETTINGS: Settings = {
  n: 6,
  sizeBy: 'side',
  size: '8',
  sideLabel: 'auto',
  sideText: '',
  sideTicks: 0,
  angleLabel: 'none',
  angleText: '',
  angleArcs: 0,
  letters: false,
  dot: true,
  centerName: '',
  apothem: true,
  apothemStyle: 'dashed',
  apothemLabel: 'text',
  apothemText: 'a',
  radius: false,
  radiusStyle: 'dashed',
  radiusLabel: 'none',
  radiusText: '',
  radii: false,
  unit: '',
  round: 1,
  square: true,
  rotate: 0,
  moved: '',
  labelSize: 'medium',
}

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s: RawSettings): Settings {
  const d = DEFAULT_SETTINGS
  const out = cleanAgainst(d, s)
  out.n = Math.max(MIN_SIDES, Math.min(MAX_SIDES, Math.round(out.n)))
  out.sizeBy = oneOf(Object.keys(SIZES), out.sizeBy, d.sizeBy)
  for (const k of ['sideLabel', 'angleLabel']) out[k] = oneOf(LABEL_MODES, out[k], d[k as 'sideLabel'])
  for (const k of ['sideTicks', 'angleArcs']) out[k] = oneOf(MARKS, out[k], 0)
  for (const l of ['apothem', 'radius']) {
    out[`${l}Style`] = oneOf(Object.keys(LINE_STYLES), out[`${l}Style`], 'dashed')
    out[`${l}Label`] = oneOf(LINE_LABEL_MODES, out[`${l}Label`], d[`${l}Label` as 'apothemLabel'])
  }
  out.centerName = out.centerName.slice(0, 4)
  out.round = oneOf(ROUNDING, out.round, d.round)
  out.rotate = Math.max(-180, Math.min(180, Math.round(out.rotate)))
  out.moved = writeMoved(readMoved(out.moved))
  out.labelSize = cleanLabelSize(out.labelSize)
  return out as Settings
}

export const settingsToQuery = (s: Settings) => queryAgainst(DEFAULT_SETTINGS, s)

export function settingsFromParams(params: URLSearchParams): Settings {
  const s: RawSettings = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS)) if (params.has(key)) s[key] = params.get(key)
  return cleanSettings(s)
}

/** A regular polygon's measures: its side, radius and apothem lengths, and its interior and central angles in degrees. */
export type Polygon = { n: number; side: number; radius: number; apothem: number; interior: number; central: number }

/** What the settings mean: the polygon, or why its size can't be read, as a message for the settings panel. */
export type PolygonRead = { polygon: Polygon | null; problem: string | null }

export function readPolygon(s: Settings): PolygonRead {
  const typed = s.size.trim()
  const v = typed ? parseNumber(typed) : null
  const what = SIZES[s.sizeBy].toLowerCase()
  if (!typed) return { polygon: null, problem: `Give the ${what} a length.` }
  if (v === null) return { polygon: null, problem: 'Type a number, like 8, 2.5, 5/2 or 4√3.' }
  if (v <= 0) return { polygon: null, problem: `The ${what} has to be more than 0.` }
  const half = Math.PI / s.n // half the central angle
  const side = s.sizeBy === 'side' ? v : s.sizeBy === 'radius' ? 2 * v * Math.sin(half) : 2 * v * Math.tan(half)
  const polygon = {
    n: s.n,
    side,
    radius: side / (2 * Math.sin(half)),
    apothem: side / (2 * Math.tan(half)),
    interior: (180 * (s.n - 2)) / s.n,
    central: 360 / s.n,
  }
  return { polygon, problem: null }
}
