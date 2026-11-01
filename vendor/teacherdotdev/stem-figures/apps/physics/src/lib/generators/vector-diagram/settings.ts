// Every choice the teacher makes on the Vector Diagram Generator, with its
// default: the first vector addition every student does, 4 squares east then
// 3 squares north, with the 5-square resultant dashed on a grid.

import { bool, choice, defineSettings, int, label, list, number, type SettingsOf } from '$lib/shared/settings'

/** How an arrow is drawn: solid, dashed, or left off for students to draw. */
export const ARROW_STYLES = ['solid', 'dashed', 'none'] as const
export type ArrowStyle = (typeof ARROW_STYLES)[number]

/** One vector. New fields go at the end, so old links keep working (see `list`). */
const vector = {
  /** How long it is, in grid squares. */
  magnitude: number(4, 0.5, 12),
  /** Which way it points, in degrees counterclockwise from the right. */
  angle: int(0, 0, 359),
  label: label({ mode: 'text', text: 'A' }),
  style: choice<ArrowStyle>('solid', ARROW_STYLES),
  /** An angle mark from a dashed horizontal or vertical reference line at its tail. */
  arc: bool(false),
  from: choice('h', ['h', 'v']),
  arcLabel: label({ mode: 'text', text: 'theta' }),
  /** Its components along the horizontal and vertical, which often give away the answer. */
  parts: bool(false),
  xLabel: label({ mode: 'text', text: 'A_x' }),
  yLabel: label({ mode: 'text', text: 'A_y' }),
}

export const MAX_VECTORS = 3
/** The labels new vectors get, in order. */
export const NAMES = ['A', 'B', 'C'] as const

const text = (t: string) => ({ mode: 'text' as const, text: t })

/** A vector with every setting at its default. */
const ROW_DEFAULTS = Object.fromEntries(Object.entries(vector).map(([key, f]) => [key, f.default])) as Vector

/** A new vector, named for its place in the list. */
export const newVector = (index: number, magnitude = 3, angle = 45): Vector => ({
  ...structuredClone(ROW_DEFAULTS),
  magnitude,
  angle,
  label: text(NAMES[index] ?? 'V'),
})

/** Is this direction along the horizontal or vertical, so it has no angle to mark and no components? */
export const onAxis = (angle: number) => angle % 90 === 0

export const vectorSettings = defineSettings({
  vectors: list(vector, [newVector(0, 4, 0), newVector(1, 3, 90)], MAX_VECTORS),
  /** The resultant, from the first tail to the last tip. */
  resultant: choice<ArrowStyle>('dashed', ARROW_STYLES),
  resultantLabel: label({ mode: 'text', text: 'R' }),
  resultantArc: bool(false),
  resultantFrom: choice('h', ['h', 'v']),
  resultantArcLabel: label({ mode: 'text', text: 'theta' }),
  resultantParts: bool(false),
  resultantXLabel: label({ mode: 'text', text: 'R_x' }),
  resultantYLabel: label({ mode: 'text', text: 'R_y' }),
  /** Grid squares behind everything, one per unit of magnitude. */
  grid: bool(true),
  /** Plain x and y axes through the first tail, with no tick marks. */
  axes: bool(false),
  mirror: bool(false),
  color: bool(false),
})

export type VectorSettings = typeof vectorSettings.defaults
export type Vector = SettingsOf<typeof vector>
