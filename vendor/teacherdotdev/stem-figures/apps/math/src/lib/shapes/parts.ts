// What every shape's settings share: how a part is labeled and marked, how an
// extra line is drawn, and where dragged labels have been moved to. Each
// generator names its own parts (AB, ∠C, the height from D) and keeps these
// choices under keys built from those names: `ABLabel`, `ABText`, `ABTicks`,
// `ABArrows`, `CArcs`, `hDStyle` and so on.

/** How a side or angle is labeled. "auto" is its measure when given, and nothing when solved. */
export const LABEL_MODES = ['auto', 'measure', 'text', 'none'] as const
/** How an extra line is labeled. */
export const LINE_LABEL_MODES = ['measure', 'text', 'none'] as const
export const LINE_STYLES = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted' }
export const ROUNDING = [0, 1, 2] // decimal places for solved measures
export const ROUND_NAMES = ['whole numbers', 'tenths', 'hundredths']
export const MARKS = [0, 1, 2, 3] // congruence ticks, parallel arrows or congruence arcs on a part
export const UNITS = ['', 'cm', 'm', 'mm', 'in', 'ft', 'yd', 'units']
export const INK = '#111827'

export type LabelMode = (typeof LABEL_MODES)[number]
export type LineLabelMode = (typeof LINE_LABEL_MODES)[number]
export type LineStyle = keyof typeof LINE_STYLES

/** Settings as they may arrive: from a form, a link, or a preset stored by an older version. */
export type RawSettings = Record<string, any>

export const text = (v: unknown, fallback: string) => (v === undefined || v === null ? fallback : String(v))
export const oneOf = <T>(list: readonly T[], v: any, fallback: T): T => (list.includes(v) ? v : fallback)
export const bool = (v: unknown, fallback: boolean) =>
  typeof v === 'boolean' ? v : v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : fallback

/**
 * Tidy raw values against a set of defaults: each key takes its default's
 * type, and anything unreadable falls back to the default.
 */
export function cleanAgainst(defaults: Record<string, unknown>, s: RawSettings): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, def] of Object.entries(defaults)) {
    const v = s[key]
    if (typeof def === 'boolean') out[key] = bool(v, def)
    else if (typeof def === 'number') out[key] = Number.isFinite(Number(v)) && v !== '' && v !== null && v !== undefined ? Number(v) : def
    else out[key] = text(v, def as string)
  }
  return out
}

/** A page address holding only the settings that differ from the defaults. */
export function queryAgainst(defaults: Record<string, unknown>, s: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, def] of Object.entries(defaults)) {
    const v = s[key]
    if (v === def || v === null || v === undefined) continue
    params.set(key, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
  }
  return params.toString()
}

/** A dragged label's offset: along and across its part (see layout.ts). */
export type Offset = [number, number]

/** Dragged labels, as { part: [along, across] } offsets in the part's own directions (see layout.ts). */
export function readMoved(text: string): Record<string, Offset> {
  const out: Record<string, Offset> = {}
  for (const item of String(text ?? '').split(';')) {
    const m = item.match(/^([A-Za-z]+):(-?[\d.]+),(-?[\d.]+)$/)
    if (m && (Number(m[2]) || Number(m[3]))) out[m[1]] = [Number(m[2]), Number(m[3])]
  }
  return out
}

export function writeMoved(moved: Record<string, Offset>): string {
  const r = (v: number) => String(Math.round(v))
  return Object.entries(moved)
    .filter(([, [x, y]]) => Math.round(x) || Math.round(y))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, [x, y]]) => `${k}:${r(x)},${r(y)}`)
    .join(';')
}

/** Stored math, the way it reads in the settings panel: sqrt(2) as √2, pi as π. */
export const pretty = (t: string | undefined) =>
  String(t ?? '').replace(/sqrt\(([^()]*)\)/g, '√$1').replace(/sqrt/g, '√').replace(/pi/g, 'π').replace(/-/g, '−')

/** A solved measure as a label writes it: rounded, with no trailing zeros. */
export const roundTo = (v: number, places: number) => String(Number(v.toFixed(places)))
