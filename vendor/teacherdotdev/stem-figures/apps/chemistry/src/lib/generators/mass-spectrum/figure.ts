// Lays out a mass spectrum for MassSpectrumFigure.svelte to draw: the grid
// from $shared/graph, a bar at each isotope's mass number as tall as its
// abundance (drawn as Photoelectron Spectrum draws its bars), the
// abundances over them, the element's name above them at the right, and the
// answer key under the graph.
//
// The tallest peaks' labels stand above the grid, so the grid is moved down
// to make room for them under the chart title.

import { MAX_BLOCKS, readAxes } from '$shared/graph/axes'
import { layoutGrid, round, type GridLayout } from '$shared/graph/grid'
import { heightsOf } from './spectrum'
import { answerLines, nameOf, peakTexts, peaksOf, sharedMz, type MassSpectrumSettings } from './settings'

const BAR_W = 10
const LABEL_GAP = 6 // from a peak's top to its label
const STACK_GAP = 4 // between two labels, one over the other
const PAD = 14 // the figure's margin, as the grid's
const MIN_SPAN = 6 // the fewest m/z a fitted x-axis spans
const STEPS = [0.5, 1, 2, 5, 10, 20, 50]

type Text = { x: number; y: number; text: string }
export type Bar = { x: number; y: number; w: number; h: number }

/** An x-axis from a whole number to a whole number around these mass
 *  numbers, at least MIN_SPAN wide, with a block for each half m/z (so the
 *  labels over neighboring peaks have room) unless that's too many. */
export function fitRange(mzs: number[]) {
  const lo = Math.min(...mzs)
  const hi = Math.max(...mzs)
  const span = Math.max(hi - lo + 2, MIN_SPAN)
  // Rounding the ends out to the step can add a block at each end.
  const step = STEPS.find((st) => span / st + 2 <= MAX_BLOCKS) ?? STEPS.at(-1)!
  const from = Math.floor(Math.max(0, Math.floor((lo + hi - span) / 2)) / step) * step
  const to = Math.ceil(Math.max(from + span, hi + 1) / step) * step
  return { xFrom: String(from), xTo: String(to), xStep: String(step) }
}

export type Range = ReturnType<typeof fitRange>

/** The x-axis range drawn: fitted to the peaks, or as typed. */
export const rangeOf = (s: MassSpectrumSettings, fitted: Range): Range => (s.xFit ? fitted : { xFrom: s.xFrom, xTo: s.xTo, xStep: s.xStep })

/** The grid moved down by dy, its chart title (or blank line) left at the top. */
function lowered(g: GridLayout, dy: number): GridLayout {
  if (dy <= 0) return g
  const down = (y: number) => round(y + dy)
  return {
    ...g,
    height: g.height + dy,
    grid: { ...g.grid, y: down(g.grid.y) },
    hLines: g.hLines.map(down),
    minorH: g.minorH.map(down),
    xAxis: { ...g.xAxis, y: down(g.xAxis.y) },
    yAxis: { ...g.yAxis, y1: down(g.yAxis.y1), y2: down(g.yAxis.y2) },
    numbers: g.numbers.map((n) => ({ ...n, y: down(n.y) })),
    labels: g.labels.map((l) => (l.kind === 'title' ? l : { ...l, y: down(l.y) })),
    blanks: g.blanks.map((b) => (b.y1 === b.y2 && b.y1 < g.grid.y ? b : { ...b, y1: down(b.y1), y2: down(b.y2) })),
  }
}

export function buildMassSpectrum(s: MassSpectrumSettings) {
  const peaks = peaksOf(s)
  const fitted = fitRange(peaks.map((p) => p.mz))
  const range = rangeOf(s, fitted)
  const axes = readAxes({ ...s, ...range })
  const { px, box, ...grid } = layoutGrid(s, axes)
  const fs = grid.fs
  const char = fs * 0.6
  const heights = heightsOf(peaks, s.scale)
  const texts = peakTexts(s)
  const problems: Record<string, string | null> = { ...axes.problems }

  // A bar for each peak on the x-axis but the one left out, from the bottom
  // of the grid up to its height, cut at the top of the grid.
  const off: number[] = []
  const bars: Bar[] = []
  const labels: (Text & { w: number })[] = []
  peaks.forEach((p, i) => {
    if (p.mz < box.x0 || p.mz > box.x1) return void off.push(p.mz)
    if (p.mz === s.leaveOut) return
    const x = px({ x: p.mz, y: 0 }).x
    const bottom = px({ x: p.mz, y: box.y0 }).y
    const top = heights[i] > box.y0 ? px({ x: p.mz, y: Math.min(heights[i], box.y1) }).y : bottom
    bars.push({ x: round(x - BAR_W / 2), y: round(top), w: BAR_W, h: round(bottom - top) })
    if (!s.abundances) return
    // Over its bar, raised over any label already in the way.
    const w = texts[i].length * char
    let y = top - LABEL_GAP
    for (let moved = true; moved; ) {
      moved = false
      for (const l of labels) {
        const apart = Math.abs(l.x - x) >= (l.w + w) / 2 + 4
        const clear = y - fs >= l.y + STACK_GAP || y <= l.y - fs - STACK_GAP
        if (!apart && !clear) {
          y = l.y - fs - STACK_GAP
          moved = true
        }
      }
    }
    labels.push({ x: round(x), y: round(y), text: texts[i], w })
  })
  if (off.length) {
    const list = off.length === 1 ? `m/z ${off[0]} is` : `m/z ${off.slice(0, -1).join(', ')} and ${off.at(-1)} are`
    problems.peaks = `${list} off the x-axis, so ${off.length === 1 ? 'its peak isn’t' : 'their peaks aren’t'} drawn. Fit the x-axis to the peaks, or widen it.`
  }
  const shared = sharedMz(s)
  if (shared.length) problems.isotopes = `More than one mass rounds to m/z ${shared.join(' and ')}, so their peaks are drawn on top of each other.`

  // The element's name, above the labels at the right.
  const labelsTop = Math.min(grid.grid.y, ...labels.map((l) => l.y - fs))
  const name = s.names ? { x: grid.grid.x + grid.grid.w, y: round(labelsTop - fs * 0.6), text: nameOf(s) } : null
  const top = name ? name.y - fs * 1.2 : labelsTop

  // Room for all of it under the chart title, or the top of the figure.
  const limit = s.titleMode === 'none' ? PAD : PAD + fs * 1.6 + 10
  const dy = Math.max(0, Math.ceil(limit - top))
  const g = lowered(grid, dy)
  const down = <T extends { y: number }>(t: T): T => ({ ...t, y: round(t.y + dy) })

  // The answer key, a line at a time under the graph.
  const answer = s.answerKey ? answerLines(s) : []
  const lineH = fs * 1.5
  const answerTexts = answer.map((text, i) => ({ x: round(g.width / 2), y: round(g.height + fs * 0.6 + i * lineH), text }))
  const height = answer.length ? g.height + fs * 0.6 + (answer.length - 1) * lineH + PAD : g.height

  return {
    ...g,
    height: round(height),
    bars: bars.map(down),
    /** the abundances over the peaks (the grid's own labels are its titles) */
    peakLabels: labels.map(down),
    name: name && down(name),
    answer: answerTexts,
    problems,
    /** the range the x-axis fits the peaks with, for the settings panel while it's fitted */
    fitted,
  }
}

export type MassSpectrumLayout = ReturnType<typeof buildMassSpectrum>
