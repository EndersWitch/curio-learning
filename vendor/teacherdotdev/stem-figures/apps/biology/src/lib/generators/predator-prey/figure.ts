// Lays out a predator–prey graph for PredatorPreyFigure.svelte to draw: the
// grid from $shared/graph, both populations on it (as curves or census
// counts), a right-hand axis when the predators have a scale of their own,
// a key naming each population under the graph, and the peaks, lag and
// period marked if the teacher wants them. The phase plane instead draws predators
// against prey: the closed loop, with arrows for the way it goes round.

import { readAxes } from '$shared/graph/axes'
import { COLORS } from '$shared/graph/colors'
import { CELL, clipPath, layoutGrid, pathOf, round, type Point } from '$shared/graph/grid'
import { fmt } from '$shared/graph/numbering'
import {
  atBalance, balanceOf, censusOf, extremesOf, lagOf, periodOf, simulate, turnsOf, valueAt,
  type Census, type Populations, type Turn,
} from './model'
import { UNIT_ONE } from './pairs'
import { clearance, dense, inside, overlaps, type Box } from './place'
import { ratesOf, type PredatorPreySettings } from './settings'

export type SeriesKey = 'prey' | 'predators'
type Segment = { x1: number; y1: number; x2: number; y2: number }
type Text = { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }

/** The most census counts drawn; a census taken more often is thinned to this. */
export const MAX_COUNTS = 400
/** A predator's line is dashed, so the two read apart in black and white. */
export const PREDATOR_DASH = '10 6'
export const COUNT_DASH = '6 4'
const SAMPLE_W = 26 // the line sample in front of a population's name
const KEY_GAP = 28 // between the key's entries
const PAD = 14 // the figure's margin, as the grid's
const BLANK_W = 60 // a write-on line for a lag or period left blank
const DOT_R = 5

const NICE = [1, 2, 2.5, 5, 10]
const numText = (v: number) => String(Number(v.toPrecision(12)))

/** The smallest nice step (1, 2, 2.5 or 5 times a power of ten) that's at least `v`. */
export function niceCeil(v: number) {
  const e = Math.floor(Math.log10(v))
  for (const m of NICE) {
    const step = Number((m * 10 ** e).toPrecision(12))
    if (step >= v * (1 - 1e-9)) return step
  }
  return 10 ** (e + 1)
}

/** An axis from 0 to `end`, counted by a nice step that makes about `target` blocks. */
export function fitSpan(end: number, target = 20) {
  let pick = { step: niceCeil(end / target), blocks: 0 }
  pick.blocks = Math.ceil(end / pick.step - 1e-9)
  let score = Infinity
  const e0 = Math.floor(Math.log10(end / target))
  for (let e = e0 - 1; e <= e0 + 1; e++) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = Number((m * 10 ** e).toPrecision(12))
      const exact = end / step
      const blocks = Math.ceil(exact - 1e-9)
      if (blocks < 6 || blocks > 40) continue
      // Ending right on the time span matters more than the exact number of blocks.
      const sc = Math.abs(blocks - target) + (Math.abs(exact - blocks) > 1e-9 ? 8 : 0) + (m === 2.5 ? 2 : 0)
      if (sc < score) {
        score = sc
        pick = { step, blocks }
      }
    }
  }
  return pick
}

/**
 * Axes from 0, all with one number of blocks, each counted by a nice step
 * that fits its highest value with `room` blocks to spare above it.
 */
export function fitHeights(highs: number[], room: number, target = 10, lo = 6, hi = 14) {
  let pick = { blocks: target, steps: highs.map((h) => niceCeil(h / (target - room))) }
  let score = Infinity
  for (let n = lo; n <= hi; n++) {
    if (n <= room + 1) continue
    const steps = highs.map((h) => niceCeil(Math.max(h, 1e-9) / (n - room)))
    // The emptier the graph above the lines, the worse.
    const waste = steps.reduce((sum, step, i) => sum + 1 - highs[i] / (n * step), 0)
    const sc = waste + 0.04 * Math.abs(n - target) + (n % 2 ? 0.05 : 0)
    if (sc < score) {
      score = sc
      pick = { blocks: n, steps }
    }
  }
  return pick
}

/** The populations the settings describe: the cycle, worked out over the graph's time span. */
export function modelOf(s: PredatorPreySettings) {
  const rates = ratesOf(s)
  const start: Populations = { prey: s.prey, predators: s.predators }
  const period = periodOf(rates, start)
  // The phase plane's loop is one cycle round, counted or not; along time, the run spans the graph.
  const run = simulate(rates, start, s.view === 'phase' ? period * 1.002 : s.span)
  const every = Math.max(s.every, s.span / MAX_COUNTS)
  const counts = s.data === 'census' ? censusOf(run, every, s.noise / 100, s.seed) : null
  return { rates, start, period, run, counts, every, thinned: every > s.every }
}

export type Model = ReturnType<typeof modelOf>

/** The ranges the axes fit to: everything drawn, with a little room above. */
export function fitRanges(s: PredatorPreySettings, m: Model) {
  const high = (key: SeriesKey) => Math.max(...m.run[key], ...(m.counts?.map((c) => c[key]) ?? []))
  if (s.view === 'phase') {
    const x = fitHeights([high('prey')], 0.6, 12, 8, 16)
    const y = fitHeights([high('predators')], 0.6, 10, 6, 14)
    return {
      xFrom: '0', xTo: numText(x.blocks * x.steps[0]), xStep: numText(x.steps[0]),
      yFrom: '0', yTo: numText(y.blocks * y.steps[0]), yStep: numText(y.steps[0]),
      y2From: '0', y2Step: numText(y.steps[0]),
    }
  }
  const x = fitSpan(s.span)
  // The lag's and period's arrows may go over the peaks, so they need a block or so more.
  const room = 0.5 + (s.cycle || s.lag ? 1.3 : 0)
  const y = s.scale === 'two' ? fitHeights([high('prey'), high('predators')], room) : fitHeights([Math.max(high('prey'), high('predators'))], room)
  return {
    xFrom: '0', xTo: numText(x.blocks * x.step), xStep: numText(x.step),
    yFrom: '0', yTo: numText(y.blocks * y.steps[0]), yStep: numText(y.steps[0]),
    y2From: '0', y2Step: numText(y.steps[1] ?? y.steps[0]),
  }
}

export type Ranges = ReturnType<typeof fitRanges>

/** The ranges drawn: each axis fitted, or as typed. The phase plane's always fit the loop. */
export function rangesOf(s: PredatorPreySettings, fitted: Ranges): Ranges {
  if (s.view === 'phase') return fitted
  const x = s.xFit ? fitted : s
  const y = s.yFit ? fitted : s
  return { xFrom: x.xFrom, xTo: x.xTo, xStep: x.xStep, yFrom: y.yFrom, yTo: y.yTo, yStep: y.yStep, y2From: y.y2From, y2Step: y.y2Step }
}

const plain = (text: string) => {
  const t = text.replace(/−/g, '-').trim()
  return t && Number.isFinite(Number(t)) ? Number(t) : null
}

/** A census peak near each of the model's: the highest count within a quarter cycle of it. */
function countedPeaks(peaks: Turn[], counts: Census[], key: SeriesKey, period: number): Turn[] {
  const out: Turn[] = []
  for (const p of peaks) {
    const near = counts.filter((c) => Math.abs(c.t - p.t) <= period / 4)
    if (!near.length) continue
    const top = near.reduce((a, b) => (b[key] > a[key] ? b : a))
    if (!out.some((q) => q.t === top.t)) out.push({ t: top.t, value: top[key] })
  }
  return out
}

/** An amount of time as the lag and period labels write it: "1.6 years". */
export function timeText(v: number, units: PredatorPreySettings['units']) {
  const r = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10
  return `${fmt(r)} ${r === 1 ? UNIT_ONE[units] : units}`
}

export type Series = {
  key: SeriesKey
  name: string
  color: string
  /** the curves, or the lines joining census counts, cut to the grid */
  lines: string[]
  /** census counts on the drawing */
  counts: Point[]
}

/** A lag or period: a two-headed arrow between peaks, its label and dotted guides to the peaks. */
export type Span = {
  kind: 'lag' | 'period'
  arrow: Segment
  label: Text
  blank?: Segment
  guides: Segment[]
}

/** A population's name in the key, after a sample of its line. */
export type KeyEntry = { key: SeriesKey; sample: Segment; text: Text }

export function buildPredatorPrey(s: PredatorPreySettings) {
  const m = modelOf(s)
  const phase = s.view === 'phase'
  const two = !phase && s.scale === 'two'
  const fitted = fitRanges(s, m)
  const ranges = rangesOf(s, fitted)
  const problems: Record<string, string | null> = {}

  // The grid's settings: in the phase plane, its own axis titles.
  const gs = {
    ...s,
    ...ranges,
    // The phase plane's axes always fit the loop, numbered every line or every other.
    ...(phase
      ? {
          xTitle: s.pxTitle, xTitleMode: s.pxTitleMode, yTitle: s.pyTitle, yTitleMode: s.pyTitleMode,
          xEvery: Number(ranges.xTo) / Number(ranges.xStep) > 10 ? 2 : 1,
          yEvery: Number(ranges.yTo) / Number(ranges.yStep) > 10 ? 2 : 1,
        }
      : {}),
  }
  const axes = readAxes(gs)
  Object.assign(problems, axes.problems)
  const { px, box, ...grid } = layoutGrid(gs, axes)
  const fs = grid.fs
  const area: Box = grid.grid

  // The right-hand axis, as typed or fitted.
  let y2 = { start: plain(ranges.y2From) ?? 0, step: plain(ranges.y2Step) ?? 1 }
  if (two && !s.yFit) {
    if (plain(s.y2From) === null) problems.y2From = 'Type a number, like 0 or 10.'
    if (plain(s.y2Step) === null) problems.y2Step = 'Type a number, like 1, 5 or 10.'
    else if (plain(s.y2Step)! <= 0) problems.y2Step = 'Count by a number bigger than 0.'
    if (problems.y2From || problems.y2Step) y2 = { start: 0, step: plain(fitted.y2Step) ?? 1 }
  }
  if (m.thinned) problems.every = `That’s more than ${MAX_COUNTS} counts, so the census is taken every ${timeText(m.every, s.units)} instead.`

  /** A population's value on the left-hand scale the grid is drawn in. */
  const onGrid = (key: SeriesKey, v: number) => (two && key === 'predators' ? axes.y.start + ((v - y2.start) * axes.y.step) / y2.step : v)
  const at = (key: SeriesKey, t: number, v: number) => px({ x: t, y: onGrid(key, v) })
  const inBox = (p: Point) => p.x >= box.x0 - 1e-9 && p.x <= box.x1 + 1e-9 && p.y >= box.y0 - 1e-9 && p.y <= box.y1 + 1e-9

  /** Points of the graph, cut to the grid, as paths and the points on the drawing they pass through. */
  function lineOf(pts: Point[]) {
    const paths: string[] = []
    const drawn: Point[] = []
    for (const run of clipPath(pts, box)) {
      // Leave out points too close to the last one kept to see.
      const onPage = run.map(px)
      const kept = [onPage[0]]
      for (let k = 1; k < onPage.length; k++) {
        const last = kept[kept.length - 1]
        if (k === onPage.length - 1 || Math.hypot(onPage[k].x - last.x, onPage[k].y - last.y) > 0.5) kept.push(onPage[k])
      }
      paths.push(pathOf(kept))
      drawn.push(...dense(kept))
    }
    return { paths, drawn }
  }

  const color = (key: SeriesKey) => (s.color ? COLORS[key === 'prey' ? 'blue' : 'red'] : COLORS.black)
  const names: Record<SeriesKey, string> = { prey: s.preyName.trim() || 'Prey', predators: s.predatorName.trim() || 'Predators' }
  const drawnKeys: SeriesKey[] = phase
    ? []
    : s.show === 'both' ? ['prey', 'predators'] : s.show === 'prey' ? ['prey'] : s.show === 'predators' ? ['predators'] : []

  // Everything drawn, on the drawing, for keeping labels clear of it.
  const pixels: Record<SeriesKey, Point[]> = { prey: [], predators: [] }
  const series: Series[] = drawnKeys.map((key) => {
    const out: Series = { key, name: names[key], color: color(key), lines: [], counts: [] }
    if (m.counts) {
      const pts = m.counts.map((c) => ({ x: c.t, y: onGrid(key, c[key]) }))
      out.counts = pts.filter(inBox).map(px)
      pixels[key].push(...out.counts)
      if (s.connect) {
        const line = lineOf(pts)
        out.lines = line.paths
        pixels[key].push(...line.drawn)
      }
    } else {
      const line = lineOf(m.run.t.map((t, k) => ({ x: t, y: onGrid(key, m.run[key][k]) })))
      out.lines = line.paths
      pixels[key].push(...line.drawn)
    }
    return out
  })

  // The phase plane: predators against prey, round the loop.
  let loop: { lines: string[]; counts: Point[]; arrows: { tip: Point; angle: number }[] } | null = null
  if (phase && s.show !== 'neither') {
    const pts = m.counts ? m.counts.map((c) => ({ x: c.prey, y: c.predators })) : m.run.prey.map((x, k) => ({ x, y: m.run.predators[k] }))
    const counts = m.counts ? pts.filter(inBox).map(px) : []
    const line = m.counts && !s.connect ? { paths: [], drawn: [] } : lineOf(pts)
    // Arrows a quarter cycle apart, pointing the way the populations move.
    const arrows: { tip: Point; angle: number }[] = []
    const r = m.rates
    const towards = (x: number, y: number) => {
      const dx = (r.alpha * x - r.beta * x * y) / axes.x.step
      const dy = -(r.delta * x * y - r.gamma * y) / axes.y.step
      return (Math.atan2(dy, dx) * 180) / Math.PI
    }
    if (!atBalance(r, m.start)) {
      for (let k = 0; k < 4; k++) {
        const t = m.period * (k / 4 + 1 / 8)
        if (m.counts) {
          // Counts go round by straight lines, so an arrow sits halfway along one.
          const a = m.counts[Math.floor(t / m.every)]
          const b = m.counts[Math.floor(t / m.every) + 1]
          if (!s.connect || !a || !b) continue
          const mid = { x: (a.prey + b.prey) / 2, y: (a.predators + b.predators) / 2 }
          const [p, q] = [px({ x: a.prey, y: a.predators }), px({ x: b.prey, y: b.predators })]
          if (inBox(mid) && Math.hypot(q.x - p.x, q.y - p.y) > 16) arrows.push({ tip: px(mid), angle: round((Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI) })
        } else {
          const x = valueAt(m.run.t, m.run.prey, t)
          const y = valueAt(m.run.t, m.run.predators, t)
          if (inBox({ x, y })) arrows.push({ tip: px({ x, y }), angle: round(towards(x, y)) })
        }
      }
    }
    loop = { lines: line.paths, counts, arrows }
  }

  // The right-hand axis: its line, numbers and title, in room added to the right of the grid.
  let right: { line: Segment; numbers: Text[]; title?: Text; blank?: Segment } | null = null
  let width = grid.width
  if (two) {
    const x = area.x + area.w
    const numbers: Text[] = []
    if (s.yEvery) {
      for (let j = 0; j <= axes.y.blocks; j += s.yEvery) {
        numbers.push({ x: x + 6, y: area.y + area.h - j * CELL + fs * 0.35, text: fmt(Number((y2.start + j * y2.step).toPrecision(12))), anchor: 'start' })
      }
    }
    const numW = numbers.length ? Math.max(...numbers.map((n) => n.text.length)) * fs * 0.6 + 10 : 4
    const title = s.y2TitleMode === 'text' ? s.y2Title.trim() : ''
    const side = title || s.y2TitleMode === 'blank'
    const titleX = x + numW + fs * 0.9
    const midY = area.y + area.h / 2
    width = Math.max(grid.width, x + numW + (side ? fs * 1.2 + 12 : 0) + 14)
    right = {
      line: { x1: x, y1: area.y + area.h, x2: x, y2: area.y },
      numbers,
      title: title ? { x: titleX, y: midY, text: title, anchor: 'middle' } : undefined,
      blank: !title && side ? { x1: titleX, y1: midY - Math.min(100, area.h / 2), x2: titleX, y2: midY + Math.min(100, area.h / 2) } : undefined,
    }
  }

  // Peaks, from the model, or from the counts when it's a census.
  const turns = phase ? null : turnsOf(m.rates, m.run)
  const peaksOf = (key: SeriesKey): (Turn & { p: Point })[] => {
    if (!turns) return []
    const model = key === 'prey' ? turns.preyPeaks : turns.predatorPeaks
    const peaks = m.counts ? countedPeaks(model, m.counts, key, m.period) : model
    return peaks.filter((q) => inBox({ x: q.t, y: onGrid(key, q.value) })).map((q) => ({ ...q, p: at(key, q.t, q.value) }))
  }
  const peaks = drawnKeys.flatMap((key) => (s.peaks ? peaksOf(key).map((q) => ({ key, ...q })) : []))
  const axisY = area.y + area.h
  const drops: Segment[] = peaks.map((q) => ({ x1: q.p.x, y1: q.p.y, x2: q.p.x, y2: axisY }))

  // Everything placed so far, for the labels after it to keep clear of.
  // A marked peak takes up a circle around it.
  const rings = peaks.flatMap((q) => Array.from({ length: 12 }, (_, k) => ({ x: q.p.x + 9 * Math.cos((k * Math.PI) / 6), y: q.p.y + 9 * Math.sin((k * Math.PI) / 6) })))
  const curves = [...pixels.prey, ...pixels.predators, ...rings]
  const placed: Box[] = []
  const lh = fs * 1.15
  const textW = (text: string) => text.length * fs * 1.05 * 0.6
  const wording = (name: string, v: number) => (s.markLabels === 'value' ? `${name}: ${timeText(v, s.units)}` : s.markLabels === 'name' ? name : `${name}:`)
  const labelBox = (text: string, cx: number, top: number): Box => {
    const w = textW(text) + (s.markLabels === 'blank' ? BLANK_W + 6 : 0)
    return { x: cx - w / 2, y: top, w, h: lh }
  }
  /** A label's text (and blank line) from its box. */
  const labelIn = (b: Box, text: string): { label: Text; blank?: Segment } => {
    const base = b.y + lh * 0.8
    const label: Text = { x: b.x, y: base, text, anchor: 'start' }
    if (s.markLabels !== 'blank') return { label }
    const x1 = b.x + textW(text) + 6
    return { label, blank: { x1, y1: base + 2, x2: x1 + BLANK_W, y2: base + 2 } }
  }

  type Peak = Turn & { p: Point }
  const spans: Span[] = []
  /**
   * A two-headed arrow across from peak a to peak b, at whatever height keeps
   * it and its label clear of the lines and of what's placed, with dotted
   * guides from each peak up or down to it; or, when `force`d, over the peaks.
   */
  function span(kind: Span['kind'], a: Peak, b: Peak, text: string, force = false): Span | null {
    const mid = (a.p.x + b.p.x) / 2
    // A short arrow's heads point in from outside it (see PredatorPreyFigure.svelte).
    const out = b.p.x - a.p.x < 24 ? 14 : 0
    const arrowAt = (y: number): Box => ({ x: a.p.x - out, y: y - 4, w: b.p.x - a.p.x + 2 * out, h: 8 })
    let top: { score: number; y: number; label: Box } | null = null
    for (let y = area.y + lh + 8; y <= axisY - 6; y += 3) {
      const arrow = arrowAt(y)
      if (placed.some((p) => overlaps(p, arrow, 2))) continue
      const arrowClear = clearance(arrow, curves)
      if (arrowClear < 3) continue
      for (const label of [labelBox(text, mid, y - 7 - lh), labelBox(text, mid, y + 7)]) {
        if (!inside(label, area, 2) || placed.some((p) => overlaps(p, label, 4))) continue
        const clear = Math.min(arrowClear, clearance(label, curves))
        if (clear < 3) continue
        // Short guides read best, and a label over its arrow.
        const reach = Math.abs(y - a.p.y) + Math.abs(y - b.p.y)
        const score = Math.min(clear, 14) - reach * 0.02 + (label.y < y ? 3 : 0)
        if (!top || score > top.score) top = { score, y, label }
      }
    }
    if (!top && !force) return null
    if (!top) {
      const y = Math.max(area.y + lh + 8, Math.min(a.p.y, b.p.y) - 14)
      top = { score: 0, y, label: labelBox(text, mid, y - 7 - lh) }
    }
    const y = top.y
    placed.push(arrowAt(y), top.label)
    return {
      kind,
      arrow: { x1: a.p.x, y1: y, x2: b.p.x, y2: y },
      ...labelIn(top.label, text),
      guides: [a.p, b.p].map((p) => ({ x1: p.x, y1: p.y, x2: p.x, y2: y })),
    }
  }
  /** A span for the first of these pairs of peaks with room for one, or else forced in over the first. */
  function firstSpan(kind: Span['kind'], pairs: [Peak, Peak][], name: string) {
    for (const [a, b] of pairs) {
      const sp = span(kind, a, b, wording(name, b.t - a.t))
      if (sp) return sp
    }
    const [a, b] = pairs[0] ?? []
    return a && b ? span(kind, a, b, wording(name, b.t - a.t), true) : null
  }

  // The lag: from a prey peak to the predator peak after it.
  if (s.lag && drawnKeys.length === 2) {
    const predatorPeaks = peaksOf('predators')
    const pairs = peaksOf('prey').flatMap((a): [Peak, Peak][] => {
      const b = predatorPeaks.find((q) => q.t > a.t && q.t - a.t < m.period * 0.75)
      return b ? [[a, b]] : []
    })
    const sp = firstSpan('lag', pairs, 'Lag')
    if (sp) spans.push(sp)
  }

  // The period: from one peak to the next, starting from another peak than the lag, if there's one.
  if (s.cycle && drawnKeys.length) {
    const list = peaksOf(drawnKeys[0])
    const pairs = list.slice(1).map((b, k): [Peak, Peak] => [list[k], b])
    const lagFrom = spans[0]?.arrow.x1
    const apart = pairs.filter(([a]) => Math.abs(a.p.x - (lagFrom ?? -1)) > 1)
    const sp = firstSpan('period', apart.length ? apart : pairs, 'Period')
    if (sp) spans.push(sp)
  }

  // The key: each population's line and name in a row under the x-axis
  // title, centered under the grid. The lines cross every cycle, so names
  // written beside them would be hard to tell apart.
  const keyEntries: KeyEntry[] = []
  let height = grid.height
  if (drawnKeys.length) {
    const textW = (text: string) => text.length * fs * 1.05 * 0.6
    const entryW = (key: SeriesKey) => SAMPLE_W + 6 + textW(names[key])
    const rowW = drawnKeys.reduce((w, key, k) => w + entryW(key) + (k ? KEY_GAP : 0), 0)
    const y = grid.height + fs * 0.2
    let x = Math.max(PAD, area.x + area.w / 2 - rowW / 2)
    for (const key of drawnKeys) {
      keyEntries.push({
        key,
        sample: { x1: x, y1: y, x2: x + SAMPLE_W, y2: y },
        text: { x: x + SAMPLE_W + 6, y: y + fs * 0.38, text: names[key], anchor: 'start' },
      })
      x += entryW(key) + KEY_GAP
    }
    width = Math.max(width, x - KEY_GAP + PAD)
    height = y + fs * 0.7 + PAD
  }

  const ex = extremesOf(m.rates, m.start)
  return {
    ...grid,
    width,
    height,
    series,
    loop,
    right,
    peaks,
    drops,
    spans,
    keyEntries,
    census: !!m.counts,
    color,
    r: DOT_R,
    /** the ranges the axes would fit to, for the settings panel while they're fitted */
    fitted,
    problems,
    /** what the cycle works out to, for the settings panel */
    readout: {
      period: m.period,
      lag: lagOf(m.rates, m.start, m.period),
      balance: balanceOf(m.rates),
      prey: ex.prey,
      predators: ex.predators,
      rates: m.rates,
      cycles: s.span / m.period,
      still: atBalance(m.rates, m.start),
    },
  }
}

export type PredatorPreyLayout = ReturnType<typeof buildPredatorPrey>
