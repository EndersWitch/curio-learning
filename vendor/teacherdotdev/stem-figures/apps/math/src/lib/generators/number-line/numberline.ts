// Lays out a number line as plain numbers for NumberLine.svelte to draw. The
// line is always LINE units long, whatever its range, so every figure pastes
// into a worksheet at the same width; the SVG scales to fit wherever it's shown.

import { niceLabel, niceText, numberLabel, type Label } from '$shared/graph/numbering'
import { LABEL_SCALE } from '$shared/labelSize'
import { COLORS } from '$lib/shared/rowStyle.js'
import { readLine, type Settings } from './settings.js'

export const LINE = 600
const BASE_FS = 16 // number font size, at medium labels
const PAD = 16
const EXT = 22 // how far the line runs past its last tick, to its arrow
const RAY_EXT = 46 // the same where the graph runs off that end, to fit its arrow too
const RAY_GAP = 15 // from the line's arrow tip back to the graph's
const RAY_HEAD = 17 // length of the graph's arrowhead
const RAY_HALF = 9 // half its width
const TICK = 9 // half height of a numbered tick
const MINOR = 5 // half height of the ticks between numbers
const R = 6.5 // endpoint circle radius
const LEVEL_GAP = 4 // between two rows of numbers above the line
const LABEL_GAP = 6 // the least room between two numbers side by side
const EPS = 1e-9

/** A number line laid out for NumberLine.svelte to draw. */
export type LineLayout = ReturnType<typeof buildLine>

/** A number on the line: on one line of text, or a stacked fraction. */
type LineNumber =
  | { x: number; text: string; y: number; sign?: undefined; num?: undefined; den?: undefined }
  | { x: number; sign: string; num: string; den: string; numY: number; barY: number; denY: number; text?: undefined; y?: undefined }

export function buildLine(s: Settings) {
  const FS = BASE_FS * LABEL_SCALE[s.labelSize]
  const CHAR = FS * 0.6 // rough width of one digit
  const labelWidth = (l: Label) => (l.text ?? (l.num!.length > l.den!.length ? l.num : l.den) + l.sign!).length * CHAR
  const { range, numbering, groups, written, problems } = readLine(s)
  const { from, to, step } = range
  const x = (v: number) => L + ((v - from) / (to - from)) * LINE
  const same = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a))
  const onLine = (v: number) => v >= from - EPS && v <= to + EPS

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

  // Each color's graph, clipped to the line. Rows of one color join, so an
  // endpoint shared by two of their parts is drawn once, closed if either is.
  const drawn = groups.map(({ color, set, points }) => {
    const endpoints = new Map<number, boolean>() // value -> closed
    for (const { lo, hi } of set) {
      for (const b of [lo, hi]) if (Number.isFinite(b.v) && onLine(b.v)) endpoints.set(b.v, endpoints.get(b.v) || b.closed)
    }
    // Points are closed dots like x = 3, or crosses.
    const shown = points.filter((p) => onLine(p.v))
    const crosses = shown.filter((p) => p.point === 'cross').map((p) => p.v)
    for (const p of shown) if (p.point !== 'cross') endpoints.set(p.v, true)
    return { color, set, endpoints, crosses, labeled: shown.filter((p) => p.label) }
  })
  const crosses = drawn.flatMap((g) => g.crosses)

  // Above the line: each point's label, and the value of any endpoint or
  // unlabeled point without a number under it, so the figure is never
  // ambiguous (unless the teacher turned values off for its row). A labeled
  // point's value isn't written, since it would give the answer away. Values
  // are written the way their row was typed, so x < π/2 is labeled π/2.
  const pointLabels = drawn
    .flatMap((g) => g.labeled.map((p) => ({ v: p.v, text: p.label!, coords: p.labels === 'coords' ? `(${niceText(p.v, p.numbering)})` : '', ink: COLORS[g.color] })))
    .filter((p, i, all) => all.findIndex((q) => same(q.v, p.v) && q.text === p.text) === i)
  const onNumber = (v: number) => ticks.some((t) => t.label && same(t.v, v))
  const values = written.filter(({ v }, i, all) => onLine(v) && all.findIndex((w) => same(w.v, v)) === i)
  type Above = { v: number; label: Label; point?: undefined } | { v: number; point: (typeof pointLabels)[number]; label?: undefined }
  const above: Above[] = [
    ...values.filter(({ v }) => !onNumber(v) && !pointLabels.some((p) => same(p.v, v))).map(({ v, numbering }) => ({ v, label: niceLabel(v, numbering) })),
    ...pointLabels.map((point) => ({ v: point.v, point })),
  ].sort((a, b) => a.v - b.v)
  const aboveWidth = (a: Above) => (a.label ? labelWidth(a.label) : (a.point.text.length * 1.2 + a.point.coords.length) * CHAR)

  const labels = ticks.filter((t): t is { v: number; major: boolean; label: Label } => !!t.label)
  const stacked = labels.some((l) => l.label.den)
  const aboveStacked = above.some((a) => a.label?.den)
  const numbersH = labels.length ? (stacked ? FS * 2.3 : FS) + 6 : 0

  // A part of the graph that runs off an end has its own arrow there, before
  // the line's arrow, so the line runs on further at that end to fit both.
  const inView = ({ lo, hi }: { lo: { v: number }; hi: { v: number } }) => lo.v !== hi.v && hi.v >= from - EPS && lo.v <= to + EPS
  const allParts = drawn.flatMap((g) => g.set.filter(inView))
  const rayL = allParts.some(({ lo }) => lo.v < from - EPS)
  const rayR = allParts.some(({ hi }) => hi.v > to + EPS)
  const extL = rayL ? RAY_EXT : EXT
  const extR = rayR ? RAY_EXT : EXT

  const first = labels.find((l) => same(l.v, from))
  const last = labels.find((l) => same(l.v, to))
  const L = PAD + Math.max(extL, first ? labelWidth(first.label) / 2 : 0)
  const Rt = PAD + Math.max(extR, last ? labelWidth(last.label) / 2 : 0)

  // Numbers above the line that would overlap sit in rows, each one on the
  // lowest row with room for it, counting up from the line.
  const rowEnds: number[] = []
  const levels = above.map((a) => {
    const { v } = a
    const half = aboveWidth(a) / 2
    let level = rowEnds.findIndex((end) => x(v) - half >= end + LABEL_GAP)
    if (level === -1) level = rowEnds.push(0) - 1
    rowEnds[level] = x(v) + half
    return level
  })
  // A point label is drawn a little larger than the numbers, as on the coordinate grid.
  const LABEL_FS = FS * 1.2
  const levelH = Math.max(aboveStacked ? FS * 2.3 : FS, pointLabels.length ? LABEL_FS : 0)
  const aboveH = rowEnds.length ? rowEnds.length * levelH + (rowEnds.length - 1) * LEVEL_GAP + 8 : 0

  const T = PAD + aboveH + Math.max(TICK, R + 2)
  const axisY = T
  const height = axisY + TICK + 6 + numbersH + PAD
  const width = L + LINE + Rt

  const ends = { left: L - extL, right: L + LINE + extR }
  const tips = { left: ends.left + RAY_GAP, right: ends.right - RAY_GAP }
  const arrow = (tip: number, dir: number) => `M${tip},${axisY} L${tip - dir * RAY_HEAD},${axisY - RAY_HALF} L${tip - dir * RAY_HEAD},${axisY + RAY_HALF} z`

  // Numbers sit in a row starting at `top`; a row with any stacked fraction is taller.
  const row = (list: { v: number; label: Label }[], top: number, tall: boolean) =>
    list.map(({ v, label }): LineNumber =>
      label.den
        ? { x: x(v), sign: label.sign, num: label.num, den: label.den, numY: top + FS * 0.85, barY: top + FS * 1.1, denY: top + FS * 2.05 }
        : { x: x(v), text: label.text!, y: tall ? top + FS * 1.45 : top + FS * 0.85 },
    )
  const aboveTop = (level: number) => axisY - Math.max(TICK, R + 2) - 6 - (level + 1) * levelH - level * LEVEL_GAP
  const numbers = [
    ...row(labels, axisY + TICK + 6, stacked),
    ...rowEnds.flatMap((_, level) =>
      row(above.filter((a, i) => a.label && levels[i] === level) as { v: number; label: Label }[], aboveTop(level), aboveStacked),
    ),
  ]
  // A label sits on the middle of its row, like the numbers beside it.
  const labelY = (level: number) => aboveTop(level) + levelH / 2 + LABEL_FS * 0.35
  const labelsAbove = above.flatMap((a, i) => (a.point ? [{ x: x(a.v), y: labelY(levels[i]), text: a.point.text, coords: a.point.coords, ink: a.point.ink }] : []))

  return {
    width,
    height,
    fs: FS,
    r: R,
    axis: { x1: ends.left, x2: ends.right, y: axisY },
    // A cross replaces the tick it sits on, which would otherwise turn it into a star.
    ticks: ticks
      .filter((t) => !crosses.some((v) => same(t.v, v)))
      .map((t) => ({ x: x(t.v), y1: axisY - (t.major ? TICK : MINOR), y2: axisY + (t.major ? TICK : MINOR) })),
    numbers,
    labelFs: LABEL_FS,
    labels: labelsAbove,
    // Each color's graph, later colors drawn over earlier ones.
    groups: drawn.map((g) => {
      const parts = g.set.filter(inView)
      const segments: { x1: number; x2: number }[] = []
      for (const { lo, hi } of parts) {
        const x1 = lo.v < from - EPS ? tips.left + RAY_HEAD - 1 : x(lo.v)
        const x2 = hi.v > to + EPS ? tips.right - RAY_HEAD + 1 : x(hi.v)
        if (x2 > x1) segments.push({ x1, x2 })
      }
      const left = parts.some(({ lo }) => lo.v < from - EPS)
      const right = parts.some(({ hi }) => hi.v > to + EPS)
      return {
        ink: COLORS[g.color],
        segments,
        arrows: [left && arrow(tips.left, -1), right && arrow(tips.right, 1)].filter((a): a is string => !!a),
        endpoints: [...g.endpoints].map(([v, closed]) => ({ x: x(v), closed })),
        crosses: g.crosses.map((v) => x(v)),
      }
    }),
    problems,
  }
}
