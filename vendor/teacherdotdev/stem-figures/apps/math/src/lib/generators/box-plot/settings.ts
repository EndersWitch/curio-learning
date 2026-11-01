// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a box plot can be bookmarked or shared.
//
// Each data set is kept as the text the teacher typed ("12, 15, 15, 18"), and
// the range as typed too ("0", "" for worked out from the data); readPlot()
// works out what they mean.

import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { CAPS, type Cap } from '$shared/graph/caps'
import { parseNumber } from '$lib/shared/math.js'
import { fmt, niceText, numberingOf, type Numbering } from '$shared/graph/numbering'
import { SUMMARY_KEYS, looksLikeSummary, niceRange, parseData, summarize, withOutliers, type Summary, type SummaryKey } from './stats.js'

export { CAPS, SUMMARY_KEYS, fmt }
export const MAX_TICKS = 100
export const EVERY = [1, 2, 4, 5, 10, 0] // number every nth tick; 0 = no numbers
export const TITLE_MODES = ['text', 'blank', 'none'] as const // written title, write-on line for students, nothing
export const LABEL_MODES = ['none', 'measure', 'text'] as const // a part label: nothing, its value, or typed text
export const INK = '#111827'

export type TitleMode = (typeof TITLE_MODES)[number]
export type LabelMode = (typeof LABEL_MODES)[number]
/** One data set: its numbers as typed, an optional name, and whether five numbers in order are data after all. */
export type DataRow = { text: string; name: string; asData: boolean }

export type Settings = {
  rows: DataRow[]
  from: string
  to: string
  step: string
  every: number
  outliers: boolean
  whiskerCaps: boolean
  title: string
  titleMode: TitleMode
  axisTitle: string
  axisTitleMode: TitleMode
  startCap: Cap
  endCap: Cap
  labelSize: LabelSize
} & { [K in `${SummaryKey}Label`]: LabelMode } & { [K in `${SummaryKey}Text`]: string }
/** Settings as they may arrive: from a form, a link, or a preset stored by an older version. */
export type RawSettings = Record<string, any>

export const DEFAULT_SETTINGS: Settings = {
  rows: [], // the data sets, one box plot each, top to bottom
  from: '', // blank: worked out from the data
  to: '',
  step: '',
  every: 1,
  outliers: false, // whiskers reach the minimum and maximum
  whiskerCaps: true, // a short upright line across each whisker's end
  title: '',
  titleMode: 'none',
  axisTitle: '', // under the number line, e.g. "Height (cm)"
  axisTitleMode: 'none',
  startCap: 'triangle',
  endCap: 'triangle',
  labelSize: 'medium', // how big the numbers and labels are (see labelSize.ts)
  // Nothing on the figure gives the five numbers away unless the teacher asks.
  ...(Object.fromEntries(SUMMARY_KEYS.flatMap((k) => [[`${k}Label`, 'none'], [`${k}Text`, '']])) as any),
}

/** Settings that describe the figure itself, which is what a preset saves. */
export const FIGURE_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

const text = (v: unknown, fallback: string) => (v === undefined || v === null ? fallback : String(v))
const oneOf = <T>(list: readonly T[], v: any, fallback: T): T => (list.includes(v) ? v : fallback)
const bool = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v === true || v === '1' || v === 'true')
// A name is written into the page address after a "|", so it can't hold one.
const tidyName = (v: unknown) => text(v, '').replace(/\|/g, '')

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s: RawSettings): Settings {
  const d = DEFAULT_SETTINGS
  const rows: unknown[] = Array.isArray(s.rows) ? s.rows : d.rows
  const out: RawSettings = {
    rows: rows.map((r: any) => ({ text: text(r?.text, ''), name: tidyName(r?.name), asData: bool(r?.asData, false) })),
    from: text(s.from, d.from),
    to: text(s.to, d.to),
    step: text(s.step, d.step),
    every: oneOf(EVERY, Number(s.every), d.every),
    outliers: bool(s.outliers, d.outliers),
    whiskerCaps: bool(s.whiskerCaps, d.whiskerCaps),
    title: text(s.title, d.title),
    titleMode: oneOf(TITLE_MODES, s.titleMode, d.titleMode),
    axisTitle: text(s.axisTitle, d.axisTitle),
    axisTitleMode: oneOf(TITLE_MODES, s.axisTitleMode, d.axisTitleMode),
    startCap: s.startCap in CAPS ? s.startCap : d.startCap,
    endCap: s.endCap in CAPS ? s.endCap : d.endCap,
    labelSize: cleanLabelSize(s.labelSize),
  }
  for (const k of SUMMARY_KEYS) {
    out[`${k}Label`] = oneOf(LABEL_MODES, s[`${k}Label`], 'none')
    out[`${k}Text`] = text(s[`${k}Text`], '')
  }
  return out as Settings
}

const filled = (rows: DataRow[]) => rows.filter((r) => r.text.trim() || r.name.trim())

/** Do two settings draw the same figure? */
export function sameFigure(a: RawSettings, b: RawSettings): boolean {
  const ca = cleanSettings(a)
  const cb = cleanSettings(b)
  return FIGURE_KEYS.every((k) => (k === 'rows' ? JSON.stringify(filled(ca.rows)) === JSON.stringify(filled(cb.rows)) : ca[k] === cb[k]))
}

// A row in the page address: its numbers, then any name and "data" flag, as
// data=12, 15, 18|name=Class A|as=data
const rowToParam = (r: DataRow) => [r.text.trim(), r.name.trim() && `name=${r.name.trim()}`, r.asData && 'as=data'].filter(Boolean).join('|')
function rowFromParam(p: string): DataRow {
  const [numbers, ...extras] = p.split('|')
  const row: DataRow = { text: numbers, name: '', asData: false }
  for (const e of extras) {
    if (e.startsWith('name=')) row.name = e.slice(5)
    else if (e === 'as=data') row.asData = true
  }
  return row
}

export function settingsToQuery(s: Settings): string {
  const params = new URLSearchParams()
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = s[key as keyof Settings]
    if (key === 'rows' || v === def || v === null || v === undefined) continue
    params.set(key, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
  }
  // One data= per row that has something in it.
  for (const r of filled(s.rows ?? [])) params.append('data', rowToParam(r))
  return params.toString()
}

export function settingsFromParams(params: URLSearchParams): Settings {
  const s: RawSettings = { ...DEFAULT_SETTINGS, rows: params.getAll('data').map(rowFromParam) }
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (key === 'rows' || !params.has(key)) continue
    const raw = params.get(key)
    s[key] = typeof def === 'number' ? Number(raw) : raw
  }
  return cleanSettings(s)
}

/**
 * One data set read: its five-number summary (or null when it has nothing
 * usable), whether it was typed as the summary itself, where its whiskers end
 * and which values are drawn apart as outliers, and anything to fix.
 */
export type PlotRow = {
  name: string
  summary: Summary | null
  count: number
  isSummary: boolean
  /** five numbers in order that could be either, so the teacher can switch */
  couldBeData: boolean
  whiskers: { lo: number; hi: number } | null
  outliers: number[]
  problem: string | null
} | null

export type RangeKey = 'from' | 'to' | 'step'

/**
 * What the settings mean: each row's numbers, the number line's range (worked
 * out from the data for any part left blank), how to write its numbers, and
 * anything the teacher should fix, as messages for the settings panel. When
 * the range can't be used, the figure falls back to one worked out from the
 * data so there is always a box plot.
 */
export function readPlot(s: Settings): {
  rows: PlotRow[]
  range: { from: number; to: number; step: number }
  auto: { from: number; to: number; step: number }
  numbering: Numbering
  problems: Record<RangeKey, string | null>
} {
  const rows = s.rows.map((r): PlotRow => {
    const { values, bad } = parseData(r.text)
    if (!values.length && !bad) return r.name.trim() ? { name: r.name.trim(), summary: null, count: 0, isSummary: false, couldBeData: false, whiskers: null, outliers: [], problem: null } : null
    const base = { name: r.name.trim(), count: values.length, couldBeData: false, outliers: [] as number[] }
    if (bad) return { ...base, summary: null, isSummary: false, whiskers: null, problem: `“${bad}” isn't a number. Separate numbers with commas, like 12, 15, 18.` }
    if (looksLikeSummary(values) && !r.asData) {
      const [min, q1, median, q3, max] = values
      return { ...base, summary: { min, q1, median, q3, max }, isSummary: true, couldBeData: true, whiskers: { lo: min, hi: max }, problem: null }
    }
    const summary = summarize(values)
    const cut = s.outliers ? withOutliers(values, summary) : { lo: summary.min, hi: summary.max, outliers: [] }
    return { ...base, summary, isSummary: false, couldBeData: looksLikeSummary(values), whiskers: { lo: cut.lo, hi: cut.hi }, outliers: cut.outliers, problem: null }
  })

  const all = rows.flatMap((r) => (r?.summary ? [r.summary.min, r.summary.max] : []))
  const auto = all.length ? niceRange(Math.min(...all), Math.max(...all)) : { from: 0, to: 10, step: 1 }

  const problems: Record<RangeKey, string | null> = { from: null, to: null, step: null }
  const typed = (key: RangeKey) => s[key].trim()
  const read = (key: RangeKey) => (typed(key) ? parseNumber(s[key]) : auto[key])
  const from = read('from')
  const to = read('to')
  const step = read('step')
  const numbering = numberingOf(typed('from'), typed('to'), typed('step'))
  if (from === null) problems.from = 'Type a number, like 0, 2.5 or 1/2, or leave it empty to fit the data.'
  if (to === null) problems.to = 'Type a number, like 50, 2.5 or 1/2, or leave it empty to fit the data.'
  if (step === null) problems.step = 'Type a number, like 1, 5 or 0.5, or leave it empty to fit the data.'
  else if (step <= 0) problems.step = 'Count by a number bigger than 0.'
  if (from !== null && to !== null && from >= to) problems.to = `The line has to end after it starts, so make this bigger than ${niceText(from, numbering)}.`
  const ticks = !problems.from && !problems.to && !problems.step ? Math.floor((to! - from!) / step! + 1e-9) : 0
  if (ticks > MAX_TICKS) problems.step = `That makes ${ticks} ticks. Count by a bigger number (${MAX_TICKS} ticks at most).`
  const rangeOk = !problems.from && !problems.to && !problems.step
  const range = rangeOk ? { from: from!, to: to!, step: step! } : auto

  // A box plot that runs past the ends of the line says so on its row.
  for (const r of rows) {
    if (!r?.summary || r.problem) continue
    const past = [r.summary.min, r.summary.max].find((v) => v < range.from - 1e-9 || v > range.to + 1e-9)
    if (past !== undefined) r.problem = `${fmt(past)} is past the end of the line. Widen the range to show it.`
  }

  return { rows, range, auto, numbering, problems }
}
