// A graph's grid and axes as the teacher sets them: each axis's range (kept as
// the text typed, "-2" or "2pi"), how often it's numbered, its label and end
// caps, the titles, and minor gridlines. The coordinate grid (Math) and the
// titration and heating and cooling curves (Chemistry) draw on this grid;
// layoutGrid() in grid.ts lays it out and Grid.svelte draws it.

import { CAPS, type Cap } from './caps'
import { niceText, numberingOf, type Numbering } from './numbering'
import { choice, text, type Field } from '../settings'
import { LABEL_SIZES, type LabelSize } from '../labelSize'

export const MAX_BLOCKS = 50
export const EVERY = [1, 2, 5, 10, 0] // number every nth line; 0 = no numbers
export const MINOR = [0, 2, 4, 5] // minor gridlines: how many parts each block splits into; 0 = none
export const TITLE_MODES = ['text', 'blank', 'none'] as const // written title, write-on line for students, nothing
export const LABEL_MODES = ['text', 'none'] as const // the letter at an axis arrow, like x or y
export const CAP_KEYS = ['xStartCap', 'xEndCap', 'yStartCap', 'yEndCap'] as const

export type TitleMode = (typeof TITLE_MODES)[number]
export type LabelMode = (typeof LABEL_MODES)[number]
export type AxisName = 'x' | 'y'

/** Each axis's range, as typed. */
export type RangeSettings = {
  xFrom: string
  xTo: string
  xStep: string
  yFrom: string
  yTo: string
  yStep: string
}

/** Everything about the grid besides its ranges. */
export type GridSettings = {
  xEvery: number
  yEvery: number
  title: string
  titleMode: TitleMode
  xTitle: string
  xTitleMode: TitleMode
  yTitle: string
  yTitleMode: TitleMode
  xLabel: string
  xLabelMode: LabelMode
  yLabel: string
  yLabelMode: LabelMode
  xStartCap: Cap
  xEndCap: Cap
  yStartCap: Cap
  yEndCap: Cap
  minor: number
  labelSize: LabelSize
}

/** One axis's range as numbers, and how its numbers are written. */
export type Axis = { start: number; step: number; blocks: number; numbering: Numbering }
export type Axes = { x: Axis; y: Axis }

/** How a site reads the numbers typed into a range, and the examples its messages give. */
export interface NumberReader {
  parse(text: string | null | undefined): number | null
  examples: { From: string; To: string; Step: string }
}

/** Plain decimals: "-2", "0.5", "12". */
export const PLAIN_NUMBERS: NumberReader = {
  parse(text) {
    const typed = String(text ?? '').replace(/−/g, '-').trim()
    if (!typed) return null
    const v = Number(typed)
    return Number.isFinite(v) ? v : null
  },
  examples: { From: '0, −5 or 2.5', To: '10, 50 or 12.5', Step: '1, 5 or 0.5' },
}

/**
 * Each axis's range as numbers, how to write them, and anything the teacher should fix, as
 * messages for the settings panel. An axis whose range can't be used falls
 * back to 0 to 15 by 1, so there is always a figure.
 */
export function readAxes(s: RangeSettings, reader: NumberReader = PLAIN_NUMBERS): Axes & { problems: Record<string, string | null> } {
  const problems: Record<string, string | null> = {}
  const out = {} as Axes
  for (const axis of ['x', 'y'] as const) {
    const key = <K extends 'From' | 'To' | 'Step'>(k: K) => `${axis}${k}` as const
    const from = reader.parse(s[key('From')])
    const to = reader.parse(s[key('To')])
    const step = reader.parse(s[key('Step')])
    const numbering = numberingOf(s[key('From')], s[key('To')], s[key('Step')])
    const n = (v: number) => niceText(v, numbering)
    const p: Record<'From' | 'To' | 'Step', string | null> = { From: null, To: null, Step: null }
    if (from === null) p.From = `Type a number, like ${reader.examples.From}.`
    if (to === null) p.To = `Type a number, like ${reader.examples.To}.`
    if (step === null) p.Step = `Type a number, like ${reader.examples.Step}.`
    else if (step <= 0) p.Step = 'Count by a number bigger than 0.'
    if (from !== null && to !== null && from >= to) p.To = `The axis has to end after it starts, so make this bigger than ${n(from)}.`
    let blocks = 15
    if (!p.From && !p.To && !p.Step) {
      const exact = (to! - from!) / step!
      blocks = Math.ceil(exact - 1e-9)
      if (blocks > MAX_BLOCKS) p.Step = `That makes ${blocks} blocks. Count by a bigger number (${MAX_BLOCKS} blocks at most).`
      else if (Math.abs(exact - Math.round(exact)) > 1e-9) p.To = `Counting by ${n(step!)} from ${n(from!)} doesn't land on ${n(to!)}, so the grid runs on to ${n(from! + blocks * step!)}.`
    }
    const ok = !p.From && !(p.To && !p.To.startsWith('Counting')) && !p.Step
    out[axis] = ok ? { start: from!, step: step!, blocks, numbering } : { start: 0, step: 1, blocks: 15, numbering: 'decimal' }
    for (const [k, v] of Object.entries(p)) problems[`${axis}${k}`] = v
  }
  return { ...out, problems }
}

/** Where an axis ends, in its own numbers. */
export const axisEnd = (a: Axis) => a.start + a.blocks * a.step

// Summaries for the collapsed settings groups.

export function endsSummary(start: Cap, end: Cap) {
  if (start === end) return start === 'none' ? 'plain ends' : `${CAPS[start].toLowerCase()}s`
  return `${CAPS[start].toLowerCase()} / ${CAPS[end].toLowerCase()}`
}

/** How one axis is numbered, labeled and capped. */
export type AxisLook = { every: number; labelMode: LabelMode; label: string; startCap: Cap; endCap: Cap }

/** "−5 to 5 · by 1 · numbered · “x” · triangle arrows"; `extras` go after the step. */
export function axisSummary(read: Axis, look: AxisLook, extras: string[] = []) {
  const { start, step, numbering } = read
  const label = look.label.trim()
  const n = (v: number) => niceText(v, numbering)
  return [
    `${n(start)} to ${n(axisEnd(read))}`,
    `by ${n(step)}`,
    ...extras,
    look.every ? (look.every === 1 ? 'numbered' : `numbered every ${look.every}`) : 'unnumbered',
    look.labelMode === 'text' && label ? `“${label}”` : 'no label',
    endsSummary(look.startCap, look.endCap),
  ]
    .filter(Boolean)
    .join(' · ')
}

// Named the way Excel and Sheets name them: a chart title and axis titles.
export const TITLE_KEYS = ['title', 'xTitle', 'yTitle'] as const
export const TITLE_NAMES = { title: 'Chart title', xTitle: 'x-axis title', yTitle: 'y-axis title' }

export function titlesSummary(s: Pick<GridSettings, (typeof TITLE_KEYS)[number] | `${(typeof TITLE_KEYS)[number]}Mode`>) {
  const parts = TITLE_KEYS.map((key) => {
    const mode = s[`${key}Mode`]
    if (mode === 'blank') return `${TITLE_NAMES[key]}: blank line`
    const shown = mode === 'text' ? s[key].trim() : ''
    return shown ? `“${shown}”` : ''
  })
  return parts.filter(Boolean).join(' · ') || 'None'
}

export const minorSummary = (minor: number) => (minor ? `${minor} minor gridlines per block` : 'No minor gridlines')

// Fields for a generator whose settings use defineSettings() (see ../settings.ts).

function numberChoice(options: readonly number[], fallback: number): Field<number> {
  const accept = (v: unknown) => (options.includes(Number(v)) && String(v).trim() !== '' ? Number(v) : undefined)
  return { fallback, accept, parse: accept, format: (v) => String(v) }
}

/** Every grid and range setting as defineSettings() fields, with this generator's defaults. */
export function gridFields(d: RangeSettings & Omit<GridSettings, 'labelSize'>) {
  const cap = (v: Cap) => choice(Object.keys(CAPS) as Cap[], v)
  return {
    xFrom: text(d.xFrom),
    xTo: text(d.xTo),
    xStep: text(d.xStep),
    yFrom: text(d.yFrom),
    yTo: text(d.yTo),
    yStep: text(d.yStep),
    xEvery: numberChoice(EVERY, d.xEvery),
    yEvery: numberChoice(EVERY, d.yEvery),
    title: text(d.title),
    titleMode: choice(TITLE_MODES, d.titleMode),
    xTitle: text(d.xTitle),
    xTitleMode: choice(TITLE_MODES, d.xTitleMode),
    yTitle: text(d.yTitle),
    yTitleMode: choice(TITLE_MODES, d.yTitleMode),
    xLabel: text(d.xLabel),
    xLabelMode: choice(LABEL_MODES, d.xLabelMode),
    yLabel: text(d.yLabel),
    yLabelMode: choice(LABEL_MODES, d.yLabelMode),
    xStartCap: cap(d.xStartCap),
    xEndCap: cap(d.xEndCap),
    yStartCap: cap(d.yStartCap),
    yEndCap: cap(d.yEndCap),
    minor: numberChoice(MINOR, d.minor),
    labelSize: choice(Object.keys(LABEL_SIZES) as LabelSize[], 'medium'),
  }
}
