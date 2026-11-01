// Lays out a Wave figure for Wave.svelte to draw: the transverse wave on a
// graph from $shared/graph, the longitudinal one as vertical lines bunched at
// its compressions, or the longitudinal one above the transverse one, lined up
// with it. Without axes the graph is still there, just not drawn, so hiding
// the axes never changes the wave.
//
// The wave starts on its rest line at 0 and rises: y = A sin(2πx / λ), its
// crests at λ/4, 5λ/4… and its troughs halfway between. A longitudinal wave
// has its compressions where the transverse one has its crests, and its
// rarefactions at the troughs, the way a sound wave lines up with its
// pressure graph. The axes fit the wave unless the teacher types their own
// ranges.

import { readAxes, type Axes, type GridSettings, type RangeSettings } from '$shared/graph/axes'
import { COLORS } from '$shared/graph/colors'
import { CELL, INK, clipPath, layoutGrid, pathOf, round, type GridLayout, type Point } from '$shared/graph/grid'
import { LABEL_SCALE } from '$shared/labelSize'
import { labelRuns, type Label } from '$lib/shared/label'
import type { Segment } from '$lib/shared/vector'
import { partsOf, repeatOf, type WaveSettings } from './settings'

const PAD = 14 // the figure's margin, as the grid's
const BASE_FS = 14 // the grid's tick-number size, at medium labels
/** How tall the longitudinal wave's lines are. */
export const BAND_H = 64
/** How bunched a compression is: its lines are this much closer than average, a rarefaction's this much farther apart. */
export const BUNCHING = 0.65
/** From a longitudinal wave above the graph down to the graph. */
const BAND_GAP = 16
/** About how far apart a longitudinal wave's lines are on average, in pixels. */
const LINE_SPACING = 11
/** From the wave to a wavelength mark beside it. */
const MARK_GAP = 18
/** How far an extension line runs past its mark, and stops short of the wave. */
const OVERRUN = 6
const SHORT = 4
const TICK = 4

export type MarkKind = 'wavelength' | 'amplitude'

/** A dimension line with its arrowheads, the lines out to it from what it measures, and its label. */
export interface Mark {
  kind: MarkKind
  line: Segment
  extensions: Segment[]
  label: Label
  at: Point
  /** how long its blank line is, when it isn't the usual length */
  blank?: number
}

/** A number on an axis. */
export interface Numeral {
  x: number
  y: number
  text: string
  anchor: 'start' | 'middle' | 'end'
}

/** A word on the figure: crest, trough, compression or rarefaction. */
export interface Note {
  label: Label
  at: Point
}

export interface WaveFigure {
  width: number
  height: number
  /** the size of tick numbers, and of the labels on the wave */
  fs: number
  labelSize: number
  /** the graph's grid, axes, numbers and axis titles, moved down under the chart title and the longitudinal wave; null without axes */
  graph: (Omit<GridLayout, 'numbers'> & { numbers: Numeral[]; gridlines: boolean; yDrawn: boolean; ticks: Segment[] }) | null
  title: { x: number; y: number; text: string } | null
  titleBlank: Segment | null
  /** the dashed rest line a transverse wave drawn without axes swings about */
  rest: Segment | null
  /** the transverse wave, as path data cut to the grid */
  wave: string[]
  /** the longitudinal wave's lines */
  band: Segment[]
  color: string
  marks: Mark[]
  notes: Note[]
  /** where the crests and troughs of the transverse wave are drawn, and the middles of the compressions and rarefactions */
  crests: Point[]
  troughs: Point[]
  compressions: number[]
  rarefactions: number[]
  /** pixels to one unit along each axis */
  unit: { x: number; y: number }
  /** the ranges the axes fit to, and the ranges drawn (typed, or fitted) */
  fitted: RangeSettings
  ranges: RangeSettings
  problems: Record<string, string | null>
}

const NICE = [1, 2, 2.5, 5]
const whole = (v: number) => Math.abs(v - Math.round(v)) < 1e-9
const numText = (v: number) => String(Number(v.toPrecision(12)))

/** Nice steps (1, 2, 2.5 or 5 times a power of ten) within a hundred times of `v` either way. */
function* niceSteps(v: number) {
  const e0 = Math.floor(Math.log10(v))
  for (let e = e0 - 2; e <= e0 + 2; e++) for (const m of NICE) yield { step: Number((m * 10 ** e).toPrecision(12)), m }
}

/**
 * An axis from 0 to `end`, counted by a nice step that makes about 16
 * blocks, with `repeat` (the wavelength or period) a whole number of blocks,
 * so the crests land on gridlines, and the axis ending on the wave's end.
 */
export function fitX(end: number, repeat: number) {
  let best = { step: 1, blocks: Math.ceil(end), score: Infinity }
  for (const { step, m } of niceSteps(end / 16)) {
    const exact = end / step
    const blocks = Math.ceil(exact - 1e-9)
    if (blocks < 6 || blocks > 32 || repeat / step < 2) continue
    const score =
      0.3 * Math.abs(blocks - 16) + (whole(repeat / step) ? 0 : 10) + (whole(repeat / step / 4) ? 0 : 1) + (whole(exact) ? 0 : 3) + (m === 2.5 ? 1 : 0)
    if (score < best.score) best = { step, blocks, score }
  }
  return { step: best.step, blocks: best.blocks }
}

/**
 * A displacement axis centered on 0, counted by a nice step that makes the
 * amplitude about 3 or 4 whole blocks, with `room` pixels to spare above the
 * crests and below the troughs for the marks there.
 */
export function fitY(amplitude: number, room: number) {
  let best = { step: amplitude / 3, score: Infinity }
  for (const { step, m } of niceSteps(amplitude / 3.5)) {
    const a = amplitude / step
    if (a < 1.5 || a > 6) continue
    const score = 0.5 * Math.abs(a - 3.5) + (whole(a) ? 0 : 4) + (m === 2.5 ? 1 : 0)
    if (score < best.score) best = { step, score }
  }
  const half = Math.ceil(amplitude / best.step + room / CELL - 1e-9)
  return { step: best.step, half }
}

/** How wide a label is drawn, roughly. */
export function labelWidth(l: Label, size: number) {
  if (l.mode === 'blank') return size * 2.4
  if (l.mode === 'none') return 0
  return [...labelRuns(l.text).map((r) => r.text).join('')].length * size * 0.5
}

const shown = (l: Label) => l.mode !== 'none'

/** The x of every crest and trough in [from, to], `repeat` apart, from a wave starting at 0 that ends at `end`. */
function peaks(repeat: number, end: number, from: number, to: number) {
  const at = (offset: number) => {
    const out: number[] = []
    for (let x = offset * repeat; x <= end + 1e-9; x += repeat) if (x >= from - 1e-9 && x <= to + 1e-9) out.push(x)
    return out
  }
  return { crests: at(0.25), troughs: at(0.75) }
}

/**
 * Where the marks go along the wave, before it's scaled: the wavelength
 * between the first two crests, or the first two troughs, leaving one free
 * for the crest (or trough) label; the labels on the last crest and trough
 * the wavelength mark doesn't use; and the amplitude up to a crest, clear of
 * the x-axis's numbers under the rest line. With too few crests for both,
 * the wavelength mark rises over the crest label.
 */
export function planMarks(s: WaveSettings, crests: number[], troughs: number[], repeat: number) {
  const crestLabel = shown(s.crestLabel)
  const troughLabel = shown(s.troughLabel)
  type Span = { from: number; to: number; side: 'above' | 'below'; over: 'peaks' | 'rest'; raised: boolean }
  let span: Span | null = null
  if (s.wavelengthMark && s.cycles >= 1) {
    if (crests.length >= (crestLabel ? 3 : 2)) span = { from: crests[0], to: crests[1], side: 'above', over: 'peaks', raised: false }
    else if (troughs.length >= (troughLabel ? 3 : 2)) span = { from: troughs[0], to: troughs[1], side: 'below', over: 'peaks', raised: false }
    else if (crests.length >= 2) span = { from: crests[0], to: crests[1], side: 'above', over: 'peaks', raised: crestLabel }
    // Less than a cycle and a quarter has only one crest: from the start to one wavelength on, along the rest line.
    else span = { from: 0, to: repeat, side: 'above', over: 'rest', raised: crestLabel && crests.length > 0 }
  }
  const free = (xs: number[], side: 'above' | 'below') =>
    xs.findLast((x) => !(span?.side === side && span.over === 'peaks' && (x === span.from || x === span.to))) ?? xs.at(-1) ?? null
  const crestAt = crestLabel ? free(crests, 'above') : null
  const troughAt = troughLabel ? free(troughs, 'below') : null
  let amplitude: { x: number; up: boolean } | null = null
  if (s.amplitudeMark) {
    const crest = crests.find((x) => x !== crestAt) ?? crests[0]
    amplitude = crest !== undefined ? { x: crest, up: true } : troughs.length ? { x: troughs[0], up: false } : null
  }
  return { crestAt, troughAt, span, amplitude }
}

/** A grid layout moved `dx` across and `dy` down the drawing. */
function moved(g: GridLayout, dx: number, dy: number): GridLayout {
  const x = (v: number) => round(v + dx)
  const y = (v: number) => round(v + dy)
  return {
    ...g,
    width: round(g.width + dx),
    grid: { ...g.grid, x: x(g.grid.x), y: y(g.grid.y) },
    vLines: g.vLines.map(x),
    hLines: g.hLines.map(y),
    minorV: g.minorV.map(x),
    minorH: g.minorH.map(y),
    xAxis: { x1: x(g.xAxis.x1), x2: x(g.xAxis.x2), y: y(g.xAxis.y) },
    yAxis: { x: x(g.yAxis.x), y1: y(g.yAxis.y1), y2: y(g.yAxis.y2) },
    numbers: g.numbers.map((n) => ({ ...n, x: x(n.x), y: y(n.y) })),
    labels: g.labels.map((l) => ({ ...l, x: x(l.x), y: y(l.y) })),
    blanks: g.blanks.map((b) => ({ x1: x(b.x1), y1: y(b.y1), x2: x(b.x2), y2: y(b.y2) })),
  }
}

/** The ranges the axes are drawn with: the ones typed, or for an axis that fits, the fitted ones. */
export function rangesOf(s: WaveSettings, fitted: RangeSettings): RangeSettings {
  return {
    ...(s.xFit ? { xFrom: fitted.xFrom, xTo: fitted.xTo, xStep: fitted.xStep } : { xFrom: s.xFrom, xTo: s.xTo, xStep: s.xStep }),
    ...(s.yFit ? { yFrom: fitted.yFrom, yTo: fitted.yTo, yStep: fitted.yStep } : { yFrom: s.yFrom, yTo: s.yTo, yStep: s.yStep }),
  }
}

/** The longitudinal wave's lines along x (in the axis's units): evenly spaced, then each moved so they bunch at the crests' places and spread at the troughs'. */
export function lineXs(repeat: number, end: number, perRepeat: number) {
  // From a wavelength before the start to one past the end, so lines move in across both ends as they would mid-wave.
  const gap = repeat / perRepeat
  const out: number[] = []
  for (let i = -perRepeat; i * gap <= end + repeat + 1e-9; i++) {
    const u = i * gap
    const x = u - ((BUNCHING * repeat) / (2 * Math.PI)) * Math.sin((2 * Math.PI * (u - repeat / 4)) / repeat)
    if (x >= -1e-9 && x <= end + 1e-9) out.push(x)
  }
  return out
}

export function buildWave(s: WaveSettings): WaveFigure {
  const { transverse, longitudinal } = partsOf(s)
  const stacked = transverse && longitudinal
  const fs = BASE_FS * LABEL_SCALE[s.labelSize]
  const ls = round(fs * 1.5)
  const repeat = repeatOf(s)
  const end = s.cycles * repeat
  const A = s.amplitude
  const color = s.color ? COLORS.blue : INK

  // The x-axis first: which crests are on it decides the marks, and the marks the room the y-axis leaves.
  const fx = fitX(end, repeat)
  const xRead = readAxes({ ...s, ...(s.xFit ? { xFrom: '0', xTo: numText(fx.blocks * fx.step), xStep: numText(fx.step) } : {}) })
  const x0 = xRead.x.start
  const x1 = x0 + xRead.x.blocks * xRead.x.step
  const { crests, troughs } = peaks(repeat, end, Math.max(0, x0), x1)
  const plan = transverse ? planMarks(s, crests, troughs, repeat) : null
  const raise = ls + 8
  const above = plan
    ? Math.max(
        plan.span?.side === 'above' ? MARK_GAP + (plan.span.raised ? raise : 0) + 8 + ls : 0,
        plan.crestAt !== null ? 8 + ls : 0,
        8,
      )
    : 0
  const below = plan
    ? Math.max(plan.span?.side === 'below' ? MARK_GAP + 6 + ls : 0, plan.troughAt !== null ? 6 + ls : 0, 8)
    : 0
  const fy = fitY(A, Math.max(above, below))
  const fitted: RangeSettings = {
    xFrom: '0',
    xTo: numText(fx.blocks * fx.step),
    xStep: numText(fx.step),
    yFrom: numText(-fy.half * fy.step),
    yTo: numText(fy.half * fy.step),
    yStep: numText(fy.step),
  }
  const ranges = rangesOf(s, fitted)
  const read = readAxes(ranges)

  // The compression and rarefaction labels, in rows: a label that would run into the one before it goes on the next row.
  const notesAt: { label: Label; x: number; row: number }[] = []
  let rows = 0
  if (longitudinal) {
    const xUnit = CELL / read.x.step
    const want = [
      shown(s.compressionLabel) && crests.length ? { label: s.compressionLabel, x: crests[0] } : null,
      shown(s.rarefactionLabel) && troughs.length ? { label: s.rarefactionLabel, x: troughs.at(-1)! } : null,
    ].filter((n) => n !== null)
    for (const n of want) {
      const clash = notesAt.some((m) => Math.abs(m.x - n.x) * xUnit < (labelWidth(m.label, ls) + labelWidth(n.label, ls)) / 2 + 10)
      const row = clash ? notesAt.length : 0
      notesAt.push({ ...n, row })
      rows = Math.max(rows, row + 1)
    }
  }
  const rowH = ls + 6
  const wavelengthOnBand = longitudinal && !transverse && s.wavelengthMark && s.cycles >= 1
  // A longitudinal wave alone sits on a grid of its own with only its x-axis: its wavelength mark above it, then the lines, then its labels.
  const bandTop = 10 + (wavelengthOnBand ? MARK_GAP + 8 + ls : 0)
  const content = bandTop + BAND_H + rows * rowH + (rows ? 6 : 0) + 10
  const axes: Axes = transverse ? read : { x: read.x, y: { start: 0, step: 1, blocks: Math.ceil(content / CELL - 1e-9), numbering: 'decimal' } }

  const plain = { xEvery: 0, yEvery: 0, xTitleMode: 'none', yTitleMode: 'none', xLabelMode: 'none', yLabelMode: 'none' } as const
  const capless = { xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none' } as const
  const look: GridSettings = {
    ...s,
    titleMode: 'none',
    ...(!s.axes ? { ...plain, ...capless } : !transverse ? { yEvery: 0, yTitleMode: 'none', yLabelMode: 'none', yStartCap: 'none', yEndCap: 'none' } : {}),
  }
  const g0 = layoutGrid(look, axes)

  // Down the drawing: the chart title, the longitudinal wave when it's above the transverse one, then the graph.
  let cursor = PAD
  const titleText = s.axes && s.titleMode === 'text' ? s.title.trim() : ''
  const titleRow = s.axes && (titleText || s.titleMode === 'blank')
  const titleY = cursor + fs * 1.6
  if (titleRow) cursor += fs * 1.6 + 14
  const stackTop = cursor
  if (stacked) cursor += rows * rowH + BAND_H + BAND_GAP
  const dy = cursor - PAD
  // With no y-axis numbers beside it, the x-axis's first number goes under its line, which may need room on the left.
  const crossed = (n: GridLayout['numbers'][number]) => !transverse && n.anchor === 'end' && Math.abs(n.y - (g0.xAxis.y + g0.fs + 6)) < 0.5
  const first = g0.numbers.find(crossed)
  const dx = first ? Math.max(0, (first.text.length * g0.fs * 0.6) / 2 + 2 - g0.grid.x) : 0
  const g = moved({ ...g0, numbers: g0.numbers.map((n) => (crossed(n) ? { ...n, x: g0.grid.x, anchor: 'middle' as const } : n)) }, dx, dy)
  const X = (v: number) => round(g0.px({ x: v, y: 0 }).x + dx)
  const Y = (v: number) => round(g0.px({ x: 0, y: v }).y + dy)
  const unit = { x: CELL / axes.x.step, y: CELL / axes.y.step }
  const midX = g.grid.x + g.grid.w / 2

  // Under the axis, the wave runs through the x-axis's numbers just before it rises through the axis and just
  // after it falls. A number there moves the least it can, keeping beside its line, to clear it.
  const row = g.xAxis.y + g.fs + 6
  const across = transverse && g.xAxis.y < g.grid.y + g.grid.h - 0.5
  /** How far from where it crosses the axis the wave is `depth` pixels below it. */
  const off = (depth: number) => (Math.asin(Math.min(1, depth / (A * unit.y))) * repeat * unit.x) / (2 * Math.PI)
  const zones: [number, number][] = []
  for (let k = 0; (k * repeat) / 2 <= end + 1e-9; k++) {
    const c = X((k * repeat) / 2)
    const [near, far] = [off(6), off(g.fs + 6)]
    // The wave starts at 0 and ends at `end`, so there's none before or after.
    if (k % 2) zones.push([c + near, Math.min(c + far, X(end))])
    else if (k > 0) zones.push([c - far, c - near])
  }
  const numbers = g.numbers.map((n): Numeral => {
    if (!across || n.anchor !== 'middle' || Math.abs(n.y - row) > 0.5) return n
    const w = n.text.length * g.fs * 0.6
    const left = n.x - w / 2
    const hits = (l: number) => zones.some(([a, b]) => l < b && l + w > a)
    const moves = [0, ...zones.flatMap(([a, b]) => [b + 2 - left, a - 2 - (left + w)])]
      .filter((d) => Math.abs(d) <= w / 2 + 6 && !hits(left + d))
      .sort((a, b) => Math.abs(a) - Math.abs(b))
    const d = moves[0]
    if (!d) return n
    return d > 0 ? { ...n, x: round(left + d), anchor: 'start' } : { ...n, x: round(left + w + d), anchor: 'end' }
  })
  const width = round(Math.max(g.width, ...numbers.map((n) => (n.anchor === 'start' ? n.x + n.text.length * g.fs * 0.6 + 4 : 0))))
  const height = round(g.height + dy)

  const ticks: Segment[] = []
  if (s.axes && (!s.gridlines || !transverse)) {
    for (const x of g.vLines) if (Math.abs(x - g.yAxis.x) > 0.5 || !transverse) ticks.push({ x1: x, y1: g.xAxis.y - TICK, x2: x, y2: g.xAxis.y + TICK })
    if (transverse) for (const y of g.hLines) if (Math.abs(y - g.xAxis.y) > 0.5) ticks.push({ x1: g.yAxis.x - TICK, y1: y, x2: g.yAxis.x + TICK, y2: y })
  }

  // The transverse wave, sampled finely enough to look smooth, and cut to the grid.
  let wave: string[] = []
  let rest: Segment | null = null
  if (transverse) {
    const n = Math.ceil(s.cycles * 96)
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const x = (end * i) / n
      return { x, y: A * Math.sin((2 * Math.PI * x) / repeat) }
    })
    wave = clipPath(pts, g0.box).map((run) => pathOf(run.map((p) => ({ x: X(p.x), y: Y(p.y) }))))
    if (!s.axes) rest = { x1: X(Math.max(0, x0)), y1: Y(0), x2: X(Math.min(end, x1)), y2: Y(0) }
  }

  // The longitudinal wave: above the graph, or on a grid of its own.
  let band: Segment[] = []
  let top = 0
  if (longitudinal) {
    top = stacked ? round(stackTop + rows * rowH) : round(g.grid.y + (g.grid.h - content) / 2 + bandTop)
    const perRepeat = Math.min(20, Math.max(8, Math.round((repeat * unit.x) / LINE_SPACING)))
    band = lineXs(repeat, end, perRepeat)
      .filter((x) => x >= x0 - 1e-9 && x <= x1 + 1e-9)
      .map((x) => ({ x1: X(x), y1: top, x2: X(x), y2: round(top + BAND_H) }))
  }

  const marks: Mark[] = []
  const notes: Note[] = []
  /** A label's x, kept on the drawing. */
  const inside = (x: number, l: Label) => {
    const half = labelWidth(l, ls) / 2 + 4
    return round(Math.min(width - half, Math.max(half, x)))
  }
  const repeatLabel = partsOf(s).time ? s.periodLabel : s.wavelengthLabel

  if (plan) {
    const crestTop = Y(A)
    const troughBottom = Y(-A)
    const { span, amplitude } = plan
    if (span) {
      const up = span.side === 'above'
      const y = up ? crestTop - MARK_GAP - (span.raised ? raise : 0) : troughBottom + MARK_GAP
      const from = span.over === 'rest' ? Y(0) : up ? crestTop : troughBottom
      // Raised over the crest label, its line out from that crest starts above the label.
      const start = (x: number) => (span.raised && x === plan.crestAt ? crestTop - 8 - ls * 0.8 : from)
      const ext = (x: number) => ({ x1: X(x), y1: round(start(x) + (up ? -SHORT : SHORT)), x2: X(x), y2: round(y + (up ? -OVERRUN : OVERRUN)) })
      marks.push({
        kind: 'wavelength',
        line: { x1: X(span.from), y1: round(y), x2: X(span.to), y2: round(y) },
        extensions: [ext(span.from), ext(span.to)],
        label: repeatLabel,
        at: { x: inside((X(span.from) + X(span.to)) / 2, repeatLabel), y: round(up ? y - 8 : y + 6 + ls * 0.8) },
      })
    }
    if (amplitude) {
      const tip = amplitude.up ? crestTop : troughBottom
      // How far it is across from the arrow to the wave, `h` amplitudes up from the rest line.
      const reach = (h: number) => ((repeat * unit.x) / (2 * Math.PI)) * Math.acos(h)
      // Halfway up, or lower where the wave is farther from the arrow, so a long label clears it. A blank line
      // goes low, shortened to fit if the wave is narrow. Heights are in amplitudes.
      const blank = s.amplitudeLabel.mode === 'blank'
      const blankLength = Math.max(ls * 1.4, Math.min(ls * 2.4, reach(0.2) - 14))
      const w = blank ? blankLength : labelWidth(s.amplitudeLabel, ls)
      const clear = Math.cos(Math.min(Math.PI / 2, (2 * Math.PI * (10 + w)) / (repeat * unit.x)))
      const rise = (ls * 0.8) / (A * unit.y)
      const base = A * (blank ? 0.2 : Math.max(0.1, Math.min(0.5 - rise / 2, clear - rise))) * (amplitude.up ? 1 : -1)
      // To the right of the arrow, away from the y-axis, unless that's past the graph's right edge.
      const right = X(amplitude.x) + 8 + w + 4 <= g.grid.x + g.grid.w
      marks.push({
        kind: 'amplitude',
        line: { x1: X(amplitude.x), y1: Y(0), x2: X(amplitude.x), y2: tip },
        extensions: [],
        label: s.amplitudeLabel,
        at: { x: round(X(amplitude.x) + (right ? 1 : -1) * (8 + w / 2)), y: round(Y(base)) },
        blank: round(blankLength),
      })
    }
    if (plan.crestAt !== null) notes.push({ label: s.crestLabel, at: { x: inside(X(plan.crestAt), s.crestLabel), y: round(crestTop - 8) } })
    if (plan.troughAt !== null) notes.push({ label: s.troughLabel, at: { x: inside(X(plan.troughAt), s.troughLabel), y: round(troughBottom + 6 + ls * 0.8) } })
  }

  if (longitudinal) {
    for (const n of notesAt) {
      // Above the lines when the transverse wave is below them, else below.
      const y = stacked ? top - 8 - n.row * rowH : top + BAND_H + 6 + ls * 0.8 + n.row * rowH
      notes.push({ label: n.label, at: { x: inside(X(n.x), n.label), y: round(y) } })
    }
    if (wavelengthOnBand) {
      const pair = crests.length > 1 ? [crests[0], crests[1]] : [0, repeat]
      const y = top - MARK_GAP
      marks.push({
        kind: 'wavelength',
        line: { x1: X(pair[0]), y1: round(y), x2: X(pair[1]), y2: round(y) },
        extensions: pair.map((x) => ({ x1: X(x), y1: round(top - SHORT), x2: X(x), y2: round(y - OVERRUN) })),
        label: s.wavelengthLabel,
        at: { x: inside((X(pair[0]) + X(pair[1])) / 2, s.wavelengthLabel), y: round(y - 8) },
      })
    }
  }

  return {
    width,
    height,
    fs,
    labelSize: ls,
    graph: s.axes ? { ...g, numbers, width, gridlines: s.gridlines && transverse, yDrawn: transverse, ticks } : null,
    title: titleText ? { x: midX, y: titleY, text: titleText } : null,
    titleBlank:
      titleRow && !titleText ? { x1: midX - Math.min(130, g.grid.w / 2), y1: titleY, x2: midX + Math.min(130, g.grid.w / 2), y2: titleY } : null,
    rest,
    wave,
    band,
    color,
    marks,
    notes,
    crests: transverse ? crests.map((x) => ({ x: X(x), y: Y(A) })) : [],
    troughs: transverse ? troughs.map((x) => ({ x: X(x), y: Y(-A) })) : [],
    compressions: longitudinal ? crests.map(X) : [],
    rarefactions: longitudinal ? troughs.map(X) : [],
    unit,
    fitted,
    ranges,
    problems: read.problems,
  }
}
