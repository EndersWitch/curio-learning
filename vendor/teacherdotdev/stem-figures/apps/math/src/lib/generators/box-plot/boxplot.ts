// Lays out a box plot as plain numbers for BoxPlot.svelte to draw: one box
// per data set, top to bottom, over one shared number line. The line is
// always LINE units long, like the Number Line's, so every figure pastes into
// a worksheet at the same width; the SVG scales to fit wherever it's shown.

import { LABEL_SCALE } from '$shared/labelSize'
import { layoutMath, type MathBox } from '$lib/shared/mathSvg.js'
import { numberLabel, type Label } from '$shared/graph/numbering'
import { SUMMARY_KEYS, fmt, readPlot, type Settings } from './settings.js'

export const LINE = 600
// Font sizes at the medium label size (see labelSize.ts).
const BASE_FS = 16 // numbers
const BASE_LABEL_FS = 18 // part labels
const BASE_NAME_FS = 16 // data set names
const BASE_TITLE_FS = 22
const BASE_AXIS_TITLE_FS = 17
const PAD = 16
const EXT = 22 // how far the line runs past its last tick, to its end cap
const TICK = 9 // half height of a numbered tick
const MINOR = 5 // half height of the ticks between numbers
const BOX_H = 44
const ROW_GAP = 22 // between one box plot and the next
const AXIS_GAP = 24 // from the lowest box down to the line
const LABEL_GAP = 7 // from a box's top up to its labels' baseline
const LABEL_SPACE = 8 // least room between two labels side by side
const R = 4.5 // outlier dot radius
const CAP = BOX_H / 4 // half height of the line across a whisker's end
const EPS = 1e-9


/** A box plot laid out for BoxPlot.svelte to draw. */
export type PlotLayout = ReturnType<typeof buildPlot>

/** A number under the line: on one line of text, or a stacked fraction. */
type LineNumber =
  | { x: number; text: string; y: number; sign?: undefined; num?: undefined; den?: undefined }
  | { x: number; sign: string; num: string; den: string; numY: number; barY: number; denY: number; text?: undefined; y?: undefined }

export function buildPlot(s: Settings) {
  const scale = LABEL_SCALE[s.labelSize]
  const FS = BASE_FS * scale
  const LABEL_FS = BASE_LABEL_FS * scale
  const NAME_FS = BASE_NAME_FS * scale
  const TITLE_FS = BASE_TITLE_FS * scale
  const AXIS_TITLE_FS = BASE_AXIS_TITLE_FS * scale
  const CHAR = FS * 0.6 // rough width of one digit
  const labelWidth = (l: Label) => (l.text ?? (l.num!.length > l.den!.length ? l.num : l.den) + l.sign!).length * CHAR
  const nameWidth = (name: string) => name.length * NAME_FS * 0.56
  const { rows, range, numbering } = readPlot(s)
  const { from, to, step } = range

  // Ticks, numbering every nth one counting from the tick at 0 when there is
  // one, so "every 5" gives 0, 5, 10…
  const count = Math.floor((to - from) / step + EPS)
  const zero = -from / step
  const z = Math.round(zero)
  const ref = Math.abs(zero - z) < EPS && z >= 0 && z <= count ? z : 0
  const ticks: { v: number; major: boolean; label: Label | null }[] = []
  for (let i = 0; i <= count; i++) {
    const v = from + i * step
    const numbered = !!s.every && (i - ref) % s.every === 0
    ticks.push({ v, major: numbered || !s.every, label: numbered ? numberLabel(v, numbering) : null })
  }
  const labels = ticks.filter((t): t is { v: number; major: boolean; label: Label } => !!t.label)
  const stacked = labels.some((l) => l.label.den)
  const numbersH = labels.length ? (stacked ? FS * 2.3 : FS) + 6 : 0

  // Box plots to draw: rows with a summary, in order.
  const plots = rows.filter((r) => !!r?.summary).map((r) => r!)
  const names = plots.some((p) => p.name)
  const nameW = names ? Math.max(...plots.map((p) => nameWidth(p.name))) + 14 : 0

  const first = labels.find((l) => Math.abs(l.v - from) < EPS * Math.max(1, Math.abs(from)))
  const last = labels.find((l) => Math.abs(l.v - to) < EPS * Math.max(1, Math.abs(to)))
  const L = PAD + nameW + Math.max(EXT, first ? labelWidth(first.label) / 2 : 0)
  const Rt = PAD + Math.max(EXT, last ? labelWidth(last.label) / 2 : 0)
  const clamp = (v: number) => Math.min(to, Math.max(from, v))
  const x = (v: number) => L + ((clamp(v) - from) / (to - from)) * LINE

  // Titles are written text, a blank write-on line for students, or nothing.
  const title = s.titleMode === 'text' ? s.title.trim() : ''
  const titleRow = title || s.titleMode === 'blank'
  const axisTitle = s.axisTitleMode === 'text' ? s.axisTitle.trim() : ''
  const axisTitleRow = axisTitle || s.axisTitleMode === 'blank'

  // Each box's part labels sit above it, lifted onto a higher row wherever
  // two would run into each other (a median close to Q1, say).
  const partBoxes = (p: (typeof plots)[number]) => {
    const placed: { x: number; box: MathBox; level: number }[] = []
    for (const k of SUMMARY_KEYS) {
      const mode = s[`${k}Label`]
      const v = k === 'min' ? p.whiskers!.lo : k === 'max' ? p.whiskers!.hi : p.summary![k]
      const box = mode === 'measure' ? layoutMath(fmt(v).replace('−', '-'), LABEL_FS) : mode === 'text' ? layoutMath(s[`${k}Text`], LABEL_FS) : null
      if (!box) continue
      const cx = x(v)
      let level = 0
      while (placed.some((q) => q.level === level && Math.abs(q.x - cx) < (q.box.w + box.w) / 2 + LABEL_SPACE)) level++
      placed.push({ x: cx, box, level })
    }
    return placed
  }
  const labelRow = LABEL_FS + 4

  let y = PAD + (titleRow ? TITLE_FS * 1.3 + 12 : 0)
  const titleY = PAD + TITLE_FS
  const boxes = plots.map((p) => {
    const parts = partBoxes(p)
    const levels = parts.length ? Math.max(...parts.map((q) => q.level)) + 1 : 0
    const top = y + levels * labelRow + (levels ? LABEL_GAP : 0)
    const mid = top + BOX_H / 2
    y = top + BOX_H + ROW_GAP
    const { q1, median, q3 } = p.summary!
    return {
      name: p.name ? { x: PAD + nameW - 14, y: mid + NAME_FS * 0.35, text: p.name } : null,
      box: { x: x(q1), y: top, w: x(q3) - x(q1), h: BOX_H },
      median: x(median),
      whiskers: [
        { x1: x(p.whiskers!.lo), x2: x(q1) },
        { x1: x(q3), x2: x(p.whiskers!.hi) },
      ],
      mid,
      // Upright lines across the whiskers' ends, at the minimum and maximum
      // (or the last values short of the outliers).
      caps: s.whiskerCaps ? [x(p.whiskers!.lo), x(p.whiskers!.hi)].map((cx) => ({ x: cx, y1: mid - CAP, y2: mid + CAP })) : [],
      outliers: p.outliers.map((v) => x(v)),
      labels: parts.map((q) => ({ x: q.x - q.box.w / 2, y: top - LABEL_GAP - q.box.desc - q.level * labelRow, box: q.box })),
    }
  })

  const axisY = plots.length ? y - ROW_GAP + AXIS_GAP : y + TICK
  const numbersTop = axisY + TICK + 6
  const axisTitleY = numbersTop + numbersH + AXIS_TITLE_FS + 4
  const height = (axisTitleRow ? axisTitleY + 6 : numbersTop + numbersH) + PAD
  const width = L + LINE + Rt
  const midX = L + LINE / 2

  const numbers = labels.map(({ v, label }): LineNumber =>
    label.den
      ? { x: x(v), sign: label.sign, num: label.num, den: label.den, numY: numbersTop + FS * 0.85, barY: numbersTop + FS * 1.1, denY: numbersTop + FS * 2.05 }
      : { x: x(v), text: label.text!, y: stacked ? numbersTop + FS * 1.45 : numbersTop + FS * 0.85 },
  )

  const texts: { x: number; y: number; text: string; size: number }[] = []
  const blanks: { x1: number; x2: number; y: number }[] = []
  if (title) texts.push({ x: midX, y: titleY, text: title, size: TITLE_FS })
  else if (s.titleMode === 'blank') blanks.push({ x1: midX - 130, x2: midX + 130, y: titleY })
  if (axisTitle) texts.push({ x: midX, y: axisTitleY, text: axisTitle, size: AXIS_TITLE_FS })
  else if (s.axisTitleMode === 'blank') blanks.push({ x1: midX - 100, x2: midX + 100, y: axisTitleY })

  return {
    width,
    height,
    fs: FS,
    nameFs: NAME_FS,
    r: R,
    axis: { x1: L - EXT, x2: L + LINE + EXT, y: axisY },
    ticks: ticks.map((t) => ({ x: x(t.v), y1: axisY - (t.major ? TICK : MINOR), y2: axisY + (t.major ? TICK : MINOR) })),
    numbers,
    boxes,
    texts,
    blanks,
  }
}
