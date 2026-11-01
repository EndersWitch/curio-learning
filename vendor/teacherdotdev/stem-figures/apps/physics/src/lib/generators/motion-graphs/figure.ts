// Lays out a Motion Graph figure for MotionGraphs.svelte to draw: one
// graph, or position, velocity and acceleration stacked on the same time
// axis, each a $shared/graph grid fitted to the motion, with its lines,
// lettered boundaries and the tangent on it. Axis titles are drawn here
// rather than by the grid, so they can have subscripts and superscripts
// (m/s²), the way physics labels do.

import { axisEnd, readAxes, type Axes, type GridSettings, type TitleMode } from '$shared/graph/axes'
import { COLORS, type Color } from '$shared/graph/colors'
import { CELL, INK, clipPath, layoutGrid, pathOf, round, type GridLayout, type Point } from '$shared/graph/grid'
import { labelRuns, type Label } from '$lib/shared/label'
import { aroundPoint, placer, textWidth, type Anchor, type Box } from './labels'
import { boundaries, letterOf, motionOf, positionAt, tangentAt, type Motion, type Piece } from './motion'
import { viewsOf, type AxisKey, type MotionSettings, type View } from './settings'

const PAD = 14
const INSET = 4 // how far inside the grid's border letters stay
const DOT_R = 4.5
/** How far the tangent runs each way from where it touches, on the drawing. */
const TANGENT_REACH = 150
/** Each segment's line style and color, in turn, when segments are told apart. */
export const DASHES = [undefined, '12 6', '2 6', '14 5 2 5', '7 5', '22 6']
const SEGMENT_COLORS: Color[] = ['blue', 'red', 'green', 'orange', 'purple', 'black']

type Segment = { x1: number; y1: number; x2: number; y2: number }
export type Line = { d: string; color: string; dash?: string }
/** Text drawn with its subscripts and superscripts (see TitleText.svelte). */
export type Title = { x: number; y: number; text: string; anchor: Anchor; rotate?: boolean }
export type Letter = { x: number; y: number; anchor: Anchor; text: string }

export type Panel = {
  view: View
  /** where the panel's own SVG sits in the figure */
  at: Point
  layout: GridLayout
  grid: GridSettings
  axes: Axes
  lines: Line[]
  /** dotted joins where a line jumps from one segment to the next */
  joins: Segment[]
  /** tick marks along the axes, when there are no gridlines */
  ticks: Segment[]
  dots: Point[]
  letters: Letter[]
  tangent: { line: Segment; at: Point } | null
}

/** Steps a range counts by: 1, 2, 2.5 and 5 times a power of ten. */
const MULTIPLES = [1, 2, 2.5, 5]

/** A number written without float noise: 0.30000000000000004 is "0.3". */
export const plain = (v: number) => String(Number(v.toPrecision(10)))

/**
 * A round range from 0 (or below, for a negative low) up past `high`, in
 * close to `blocks` squares. (Population Growth's fit.ts works out its axes
 * the same way.)
 */
export function niceRange(low: number, high: number, blocks: number) {
  const lo = Math.min(0, low)
  const hi = Math.max(high, lo + 1e-9)
  const span = hi - lo
  let best = { from: 0, to: 1, step: 1, blocks: 1, miss: Infinity }
  const base = 10 ** Math.floor(Math.log10(span / blocks))
  for (const power of [base / 10, base, base * 10]) {
    for (const m of MULTIPLES) {
      const step = m * power
      const from = Math.floor(lo / step + 1e-9) * step
      const n = Math.ceil((hi - from) / step - 1e-9)
      // 2.5s only when they land on whole tens (25, 50, 75), not 2.5, 7.5.
      if (m === 2.5 && step < 10) continue
      const miss = Math.abs(n - blocks) + (n > 50 ? 100 : 0)
      if (miss < best.miss) best = { from, to: from + n * step, step, blocks: n, miss }
    }
  }
  return { from: plain(best.from), to: plain(best.to), step: plain(best.step), blocks: best.blocks }
}

/** Every nth line numbered, so numbers this wide don't crowd along an axis. */
function everyFor(blocks: number, widest: number, along: boolean) {
  const room = along ? widest * 8.5 + 10 : 0 // a number's width at medium labels
  for (const every of [1, 2, 5, 10]) if (blocks / every <= (along ? 16 : 12) && every * CELL >= room) return every
  return 10
}

/** The values a graph of `view` passes through: position is highest and lowest at a boundary, since it never turns around mid-segment. */
function valuesOf(m: Motion, view: View) {
  return m.pieces.flatMap((p) => (view === 'x' ? [p.x0, p.x1] : view === 'v' ? [p.v0, p.v1] : [p.a]))
}

/** With nothing to show (a motion all at rest), a graph still has room above its line. */
const FALLBACK_HIGH: Record<View, number> = { x: 10, v: 4, a: 1 }

/** The time and value ranges for one graph: the whole motion across, its values up the side with a little room. */
export function fitAxes(m: Motion, view: View, tall: number) {
  const step = [1, 2, 5, 10].find((st) => m.end / st <= 20) ?? 10
  const blocks = Math.max(1, Math.ceil(m.end / step - 1e-9))
  const values = valuesOf(m, view)
  let lo = Math.min(0, ...values)
  let hi = Math.max(0, ...values)
  if (hi - lo < 1e-9) hi = lo === 0 ? FALLBACK_HIGH[view] : Math.max(hi, 0)
  const room = (hi - lo) * 0.06
  const y = niceRange(lo < 0 ? lo - room : 0, hi > 0 ? hi + room : 0, tall)
  return { xFrom: '0', xTo: plain(blocks * step), xStep: plain(step), xBlocks: blocks, yFrom: y.from, yTo: y.to, yStep: y.step, yBlocks: y.blocks }
}

/** How tall a graph is fitted, in squares: shorter when three are stacked. */
const tallFor = (s: Pick<MotionSettings, 'graphs'>) => (viewsOf(s).length > 1 ? 6 : 10)

/** The ranges fitted to the motion, as numbers for the range settings: where a teacher setting them starts from. */
export function fittedRanges(s: MotionSettings) {
  const m = motionOf(s.segments, s.start)
  const out = {} as Record<`${AxisKey}${'From' | 'To' | 'Step'}`, number>
  for (const view of ['x', 'v', 'a'] as const) {
    const fit = fitAxes(m, view, tallFor(s))
    Object.assign(out, { tFrom: Number(fit.xFrom), tTo: Number(fit.xTo), tStep: Number(fit.xStep) })
    Object.assign(out, { [`${view}From`]: Number(fit.yFrom), [`${view}To`]: Number(fit.yTo), [`${view}Step`]: Number(fit.yStep) })
  }
  return out
}

/** A graph's ranges as the teacher set them, as layoutGrid reads them. */
const setRanges = (s: MotionSettings, view: View) => ({
  xFrom: plain(s.tFrom), xTo: plain(s.tTo), xStep: plain(s.tStep),
  yFrom: plain(s[`${view}From`]), yTo: plain(s[`${view}To`]), yStep: plain(s[`${view}Step`]),
})

/** A label as plain text, the way layoutGrid sizes it. */
const plainText = (l: Label) => labelRuns(l.text).map((r) => r.text).join('')
/** A label's mode for the grid: written text with nothing written is no title at all. */
const modeOf = (l: Label): TitleMode => (l.mode === 'text' && !l.text.trim() ? 'none' : l.mode)

const valueAt = (p: Piece, view: View, end: 0 | 1) => (view === 'x' ? (end ? p.x1 : p.x0) : view === 'v' ? (end ? p.v1 : p.v0) : p.a)

export function buildMotion(s: MotionSettings) {
  const m = motionOf(s.segments, s.start)
  const views = viewsOf(s)
  const ink = (i: number) => (s.styles ? COLORS[SEGMENT_COLORS[i % SEGMENT_COLORS.length]] : COLORS.blue)
  const colorOf = (i: number) => (s.color ? ink(i) : INK)
  const dashOf = (i: number) => (s.styles ? DASHES[i % DASHES.length] : undefined)
  const titleOf: Record<View, Label> = { x: s.xTitle, v: s.vTitle, a: s.aTitle }

  // Each graph's grid, fitted to the motion unless the teacher set the
  // ranges. Only the bottom one has the time axis title.
  const problems: Record<string, string | null> = {}
  type Building = Panel & { px: (v: Point) => Point; box: { x0: number; x1: number; y0: number; y1: number } }
  const panels: Building[] = views.map((view, i) => {
    const last = i === views.length - 1
    const { problems: found, ...axes } = readAxes(s.ranges ? setRanges(s, view) : fitAxes(m, view, tallFor(s)))
    // Problems with a range as the teacher's settings name them: tTo, vStep…
    for (const [key, problem] of Object.entries(found)) if (problem) problems[key.replace(/^x/, 't').replace(/^y/, view)] ??= problem
    const widest = (a: Axes['x']) => Math.max(plain(a.start).length, plain(axisEnd(a)).length)
    const grid: GridSettings = {
      xEvery: s.numbers ? everyFor(axes.x.blocks, widest(axes.x), true) : 0,
      yEvery: s.numbers ? everyFor(axes.y.blocks, widest(axes.y), false) : 0,
      title: '', titleMode: 'none',
      xTitle: plainText(s.timeTitle), xTitleMode: last ? modeOf(s.timeTitle) : 'none',
      yTitle: plainText(titleOf[view]), yTitleMode: modeOf(titleOf[view]),
      xLabel: 't', xLabelMode: 'none', yLabel: view, yLabelMode: 'none',
      // Without gridlines, arrows show which way each axis runs.
      xStartCap: 'none', xEndCap: s.gridlines ? 'none' : 'triangle', yStartCap: 'none', yEndCap: s.gridlines ? 'none' : 'triangle',
      minor: 0, labelSize: s.labelSize,
    }
    const { px, box, ...layout } = layoutGrid(grid, axes)
    return { view, at: { x: 0, y: 0 }, layout, grid, axes, lines: [], joins: [], ticks: [], dots: [], letters: [], tangent: null, px, box }
  })

  const fs = panels[0].layout.fs
  const LETTER_FS = fs * 1.15

  for (const p of panels) {
    const { px, box, view, layout } = p
    const g = layout.grid
    const place = placer({ x0: g.x + INSET, y0: g.y + INSET, x1: g.x + g.w - INSET, y1: g.y + g.h - INSET })
    for (const n of layout.numbers) {
      const w = textWidth(n.text, fs)
      const x0 = n.anchor === 'end' ? n.x - w : n.x - w / 2
      place.box({ x0: x0 - 2, y0: n.y - fs * 0.8, x1: x0 + w + 2, y1: n.y + fs * 0.25 })
    }
    // Labels keep off the axes too, which can run through the grid at 0.
    place.line([{ x: layout.xAxis.x1, y: layout.xAxis.y }, { x: layout.xAxis.x2, y: layout.xAxis.y }])

    const onGrid = (v: Point) => v.x >= box.x0 - 1e-9 && v.x <= box.x1 + 1e-9 && v.y >= box.y0 - 1e-9 && v.y <= box.y1 + 1e-9

    // Each segment's line: a parabola on the position graph (exactly, as a
    // quadratic Bézier whose control point is where the starting tangent
    // reaches halfway across), a straight line on the others. A segment that
    // runs off ranges the teacher set is cut at the grid's edges instead.
    m.pieces.forEach((piece, i) => {
      const curved = view === 'x' && piece.a !== 0
      const pts = curved
        ? Array.from({ length: 33 }, (_, k) => {
            const t = piece.t0 + ((piece.t1 - piece.t0) * k) / 32
            return { x: t, y: positionAt(m, Math.min(t, piece.t1 - 1e-9)) }
          })
        : [{ x: piece.t0, y: valueAt(piece, view, 0) }, { x: piece.t1, y: valueAt(piece, view, 1) }]
      if (curved) pts[32] = { x: piece.t1, y: piece.x1 }
      if (!pts.every(onGrid)) {
        const runs = clipPath(pts, box).map((run) => run.map(px))
        if (runs.length) p.lines.push({ d: runs.map(pathOf).join(''), color: colorOf(i), dash: dashOf(i) })
        for (const run of runs) place.line(run)
        return
      }
      const a = px({ x: piece.t0, y: valueAt(piece, view, 0) })
      const b = px({ x: piece.t1, y: valueAt(piece, view, 1) })
      let d = `M${round(a.x)},${round(a.y)}L${round(b.x)},${round(b.y)}`
      let along = [a, b]
      if (curved) {
        const half = (piece.t1 - piece.t0) / 2
        const c = px({ x: piece.t0 + half, y: piece.x0 + piece.v0 * half })
        d = `M${round(a.x)},${round(a.y)}Q${round(c.x)},${round(c.y)} ${round(b.x)},${round(b.y)}`
        along = Array.from({ length: 17 }, (_, k) => {
          const u = k / 16
          return { x: (1 - u) ** 2 * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, y: (1 - u) ** 2 * a.y + 2 * u * (1 - u) * c.y + u * u * b.y }
        })
      }
      p.lines.push({ d, color: colorOf(i), dash: dashOf(i) })
      place.line(along)
    })

    // Where velocity or acceleration jumps between segments, a dotted line
    // joins the two, as much of it as is on the grid.
    const ends = boundaries(m, view)
    const clamp = (v: number) => Math.min(Math.max(v, box.y0), box.y1)
    ends.forEach((e, i) => {
      if (i === 0 || i === ends.length - 1 || Math.abs(e.before - e.after) < 1e-9) return
      if (e.t < box.x0 || e.t > box.x1 || clamp(e.before) === clamp(e.after)) return
      const a = px({ x: e.t, y: clamp(e.before) })
      const b = px({ x: e.t, y: clamp(e.after) })
      p.joins.push({ x1: round(a.x), y1: round(a.y), x2: round(b.x), y2: round(b.y) })
      place.line([a, b])
    })

    // Without gridlines, a tick at every line the grid would have had.
    if (!s.gridlines && s.numbers) {
      const { xAxis, yAxis } = layout
      for (const x of layout.vLines) if (Math.abs(x - yAxis.x) > 0.5) p.ticks.push({ x1: x, y1: xAxis.y - 4, x2: x, y2: xAxis.y + 4 })
      for (const y of layout.hLines) if (Math.abs(y - xAxis.y) > 0.5) p.ticks.push({ x1: yAxis.x - 4, y1: y, x2: yAxis.x + 4, y2: y })
      p.layout = { ...p.layout, vLines: [], hLines: [] }
    } else if (!s.gridlines) {
      p.layout = { ...p.layout, vLines: [], hLines: [] }
    }

    // The tangent, on the position graph: through the point it touches, at the slope of the velocity there.
    if (view === 'x' && s.tangent && m.pieces.length) {
      const t = tangentAt(m, s.tangentAt)
      const kx = CELL / p.axes.x.step
      const ky = CELL / p.axes.y.step
      const h = TANGENT_REACH / Math.hypot(kx, t.slope * ky)
      const run = clipPath([{ x: t.t - h, y: t.x - t.slope * h }, { x: t.t + h, y: t.x + t.slope * h }], box)[0]
      const at = px({ x: t.t, y: t.x })
      if (run && onGrid({ x: t.t, y: t.x })) {
        const [a, b] = run.map(px)
        p.tangent = { line: { x1: round(a.x), y1: round(a.y), x2: round(b.x), y2: round(b.y) }, at: { x: round(at.x), y: round(at.y) } }
        place.line([a, b])
        place.box({ x0: at.x - DOT_R, y0: at.y - DOT_R, x1: at.x + DOT_R, y1: at.y + DOT_R })
      }
    }

    // Letters at the boundaries: on the line with a dot where it runs on
    // through, and halfway up the join where it jumps. One off the grid is
    // left off, and the rest keep their letters.
    if (s.letters && m.pieces.length) {
      const spots = ends.map((e) => {
        const jump = Math.abs(e.before - e.after) > 1e-9
        const mid = { x: e.t, y: (e.before + e.after) / 2 }
        if (!onGrid(mid)) return null
        const at = px(mid)
        if (!jump) {
          p.dots.push({ x: round(at.x), y: round(at.y) })
          place.box({ x0: at.x - DOT_R, y0: at.y - DOT_R, x1: at.x + DOT_R, y1: at.y + DOT_R })
        }
        return at
      })
      spots.forEach((at, i) => {
        if (!at) return
        const text = letterOf(i)
        const spot = place.place(aroundPoint(at, LETTER_FS, DOT_R), textWidth(text, LETTER_FS) + 2, LETTER_FS)
        p.letters.push({ x: round(spot.x), y: round(spot.y), anchor: spot.anchor, text })
      })
    }
  }

  // The figure: the chart title on top, then the graphs lined up on their
  // grids' left edges. Each graph's axis titles are drawn here, where
  // layoutGrid put them, and the graphs move apart to keep a long y-axis
  // title off the next one's.
  const chart = modeOf(s.title)
  const titleRow = chart !== 'none' ? fs * 1.6 + 20 : 0
  const gx = Math.max(...panels.map((p) => p.layout.grid.x))
  const titles: Title[] = []
  let y = titleRow
  let titleBottom = -Infinity
  for (const p of panels) {
    const side = p.layout.labels.filter((l) => l.kind === 'side')
    p.layout = { ...p.layout, labels: p.layout.labels.filter((l) => l.kind !== 'side') }
    const yTitle = side.find((l) => l.rotate)
    let at = y
    if (yTitle) {
      const half = textWidth(yTitle.text, fs * 1.2) / 2
      at += Math.max(0, Math.max(titleBottom + 10, titleRow + 4) - (at + yTitle.y - half))
      titleBottom = at + yTitle.y + half
    }
    p.at = { x: gx - p.layout.grid.x, y: at }
    for (const l of side) {
      const text = (l.rotate ? titleOf[p.view] : s.timeTitle).text.trim()
      titles.push({ x: round(p.at.x + l.x), y: round(at + l.y), text, anchor: 'middle', rotate: l.rotate })
    }
    y = at + p.layout.height
  }
  const width = Math.max(...panels.map((p) => p.at.x + p.layout.width))
  const height = Math.max(y, titleBottom + 4)
  const titleX = gx + panels[0].layout.grid.w / 2
  const titleY = PAD + fs * 1.6

  return {
    width: round(width),
    height: round(height),
    fs,
    letterFs: LETTER_FS,
    r: DOT_R,
    motion: m,
    /** What's wrong with ranges the teacher set, by setting (tTo, vStep…), for the settings panel. */
    problems,
    panels: panels.map(({ px: _px, box: _box, ...p }): Panel => p),
    titles,
    chartTitle: chart === 'text' ? { x: titleX, y: titleY, text: s.title.text.trim(), anchor: 'middle' as const } : null,
    chartBlank: chart === 'blank' ? { x1: titleX - 130, y1: titleY, x2: titleX + 130, y2: titleY } : null,
  }
}

export type MotionLayout = ReturnType<typeof buildMotion>
