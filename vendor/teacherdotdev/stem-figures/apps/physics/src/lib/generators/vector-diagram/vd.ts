// Where everything in a Vector Diagram goes: up to three vectors drawn to
// scale head to tail from the first tail (the origin), and the resultant
// from the origin to the last tip. Each arrow's label goes beside its
// middle, on the side away from the rest of the figure (moved to a clear
// spot nearby if it would land on another; arrows never move). An arrow
// that's left off still takes its place in the chain, so students can draw
// it in. Angles work as in $lib/shared/layout.
//
// The grid has one square per unit of magnitude, lined up with the origin,
// so tips land on grid points whenever the numbers allow. With the grid on
// the figure is cropped to whole squares; without it, to what's drawn.

import type { Label } from '$lib/shared/label'
import {
  arcPieces,
  bounds,
  boxCorners,
  direction,
  drawnAngle,
  labelBox,
  labelWidth,
  placeLabels,
  pt,
  seg,
  type Arc,
  type Placing,
} from '$lib/shared/layout'
import { labelPoint, type LabeledVector, type Point, type Segment } from '$lib/shared/vector'
import type { ArrowStyle, VectorSettings } from './settings'

/** One grid square, the length of a vector of magnitude 1. */
export const SQUARE = 30
/** An angle mark's radius, and how much farther a second arc from the same tail and line. */
const ARC_R = 34
const ARC_STEP = 22
/** How far the axes run past everything else. */
const AXIS_PAST = 24
const MARGIN = 18
/** The smallest figure, so one short vector isn't a sliver. */
const MIN_SIZE = 160
/** Magnitudes this close to zero are zero: the vectors cancel. */
const EPSILON = 1e-6

export type Which = number | 'resultant'

export interface FigureArrow extends LabeledVector<'vector' | 'resultant'> {
  /** Which vector in the settings this is, or the resultant. */
  which: Which
  style: Exclude<ArrowStyle, 'none'>
}

/** An angle mark: a dashed reference line from an arrow's tail, and an arc from it to the arrow. */
export interface AngleMark {
  which: Which
  center: Point
  ref: Segment
  arc: Arc
  label: Label
  labelAt: Point
}

/** An arrow's components, drawn head to tail from its tail: along the horizontal, then the vertical to its tip. */
export interface Components {
  which: Which
  x: Segment
  y: Segment
  xLabel: Label
  xLabelAt: Point
  yLabel: Label
  yLabelAt: Point
}

export interface Axes {
  x: Segment
  y: Segment
  xLabelAt: Point
  yLabelAt: Point
}

export interface VectorFigure {
  width: number
  height: number
  /** The first tail. */
  origin: Point
  /** The arrows drawn: vectors (not those left off) in order, then the resultant. */
  arrows: FigureArrow[]
  marks: AngleMark[]
  components: Components[]
  axes: Axes | null
  /** Grid lines, edge to edge. */
  grid: Segment[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

/** The sum of the vectors as the teacher gave them (before Mirror): its magnitude in squares and its angle. */
export function resultantOf(s: VectorSettings): { magnitude: number; angle: number } {
  const x = s.vectors.reduce((sum, v) => sum + v.magnitude * Math.cos((v.angle * Math.PI) / 180), 0)
  const y = s.vectors.reduce((sum, v) => sum + v.magnitude * Math.sin((v.angle * Math.PI) / 180), 0)
  const magnitude = Math.hypot(x, y)
  if (magnitude < EPSILON) return { magnitude: 0, angle: 0 }
  return { magnitude, angle: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 }
}

/** Everything about one arrow the layout needs, vector or resultant alike. */
interface Spec {
  which: Which
  tail: Point
  tip: Point
  /** Its angle as drawn, after Mirror. */
  angle: number
  style: ArrowStyle
  label: Label
  arc: boolean
  from: 'h' | 'v'
  arcLabel: Label
  parts: boolean
  xLabel: Label
  yLabel: Label
}

const angleOf = (tail: Point, tip: Point) => ((Math.atan2(tail.y - tip.y, tip.x - tail.x) * 180) / Math.PI + 360) % 360
const alongAxis = (a: Spec) => Math.abs(a.tip.x - a.tail.x) < 0.5 || Math.abs(a.tip.y - a.tail.y) < 0.5

/** Every arrow, drawn or not, with the first tail at `origin`. */
function specs(s: VectorSettings, origin: Point): Spec[] {
  let tail = origin
  const out: Spec[] = s.vectors.map((v, which) => {
    const angle = drawnAngle(v.angle, s.mirror)
    const d = direction(angle)
    const tip = pt(tail.x + d.x * v.magnitude * SQUARE, tail.y + d.y * v.magnitude * SQUARE)
    const spec: Spec = { ...v, which, tail, tip, angle, from: v.from as 'h' | 'v' }
    tail = tip
    return spec
  })
  if (s.vectors.length && Math.hypot(tail.x - origin.x, tail.y - origin.y) > EPSILON) {
    out.push({
      which: 'resultant',
      tail: origin,
      tip: tail,
      angle: angleOf(origin, tail),
      style: s.resultant,
      label: s.resultantLabel,
      arc: s.resultantArc,
      from: s.resultantFrom as 'h' | 'v',
      arcLabel: s.resultantArcLabel,
      parts: s.resultantParts,
      xLabel: s.resultantXLabel,
      yLabel: s.resultantYLabel,
    })
  }
  return out
}

/** The figure with the first tail at `origin`, before it's cropped. */
function layout(s: VectorSettings, origin: Point): Omit<VectorFigure, 'width' | 'height' | 'grid'> {
  const all = specs(s, origin)
  const ends = all.flatMap((a) => [a.tail, a.tip])
  const middle = ends.length ? pt(ends.reduce((t, p) => t + p.x, 0) / ends.length, ends.reduce((t, p) => t + p.y, 0) / ends.length) : origin

  // Each drawn arrow's label beside its middle, on the side away from the middle of the figure.
  const placings: (Placing & { rank: number; put: (p: Point) => void })[] = []
  const arrows: FigureArrow[] = []
  for (const a of all) {
    if (a.style === 'none') continue
    const v = seg(a.tail, a.tip)
    const d = direction(a.angle)
    const gap = 12 + (labelWidth(a.label) / 2) * Math.abs(d.y) + 11 * Math.abs(d.x)
    const mid = { x: (v.x1 + v.x2) / 2 - middle.x, y: (v.y1 + v.y2) / 2 - middle.y }
    // Side 1 is to the left of the arrow's direction, as in labelPoint.
    const side = d.y * mid.x - d.x * mid.y < -EPSILON ? -1 : 1
    const at = labelPoint(v, { at: 'middle', side, gap })
    const alt = labelPoint(v, { at: 'middle', side: side === 1 ? -1 : 1, gap })
    const arrow: FigureArrow = {
      kind: a.which === 'resultant' ? 'resultant' : 'vector',
      which: a.which,
      style: a.style,
      v,
      label: a.label,
      labelAt: pt(at.x, at.y),
    }
    arrows.push(arrow)
    placings.push({ rank: 1, at: arrow.labelAt, alt: pt(alt.x, alt.y), out: { x: d.y * side, y: -d.x * side }, label: a.label, put: (p) => (arrow.labelAt = p) })
  }

  // Angle marks, from the nearer half of the reference line at the arrow's
  // tail, so never more than 90°. The first vector and the resultant share a
  // tail, so a second arc from the same line there goes farther out.
  const marks: AngleMark[] = []
  const components: Components[] = []
  const arcsFrom = new Map<string, number>()
  for (const a of all) {
    if (alongAxis(a)) continue
    const d = direction(a.angle)
    const length = Math.hypot(a.tip.x - a.tail.x, a.tip.y - a.tail.y)
    if (a.arc) {
      const refAngle = a.from === 'h' ? (d.x > 0 ? 0 : 180) : d.y < 0 ? 90 : 270
      // How far the arrow is turned from the reference, counterclockwise.
      const delta = ((a.angle - refAngle + 540) % 360) - 180
      const key = `${a.tail.x},${a.tail.y},${refAngle}`
      const n = arcsFrom.get(key) ?? 0
      arcsFrom.set(key, n + 1)
      const r = Math.min(ARC_R, Math.max(18, length * 0.45)) + n * ARC_STEP
      const rd = direction(refAngle)
      // A horizontal component from the same tail the same way (this arrow's,
      // or the first vector's under the resultant's) already draws part of it.
      // Vertical components start at their corner, never at a tail.
      const along = Math.max(
        0,
        ...all
          .filter((b) => b.parts && !alongAxis(b) && b.tail.x === a.tail.x && b.tail.y === a.tail.y && a.from === 'h')
          .map((b) => (b.tip.x - b.tail.x) * rd.x),
      )
      const end = Math.max(along, r + 16)
      const ref = seg(pt(a.tail.x + rd.x * along, a.tail.y + rd.y * along), pt(a.tail.x + rd.x * end, a.tail.y + rd.y * end))
      const mid = direction(refAngle + delta / 2)
      const lr = r + 12 + (labelWidth(a.arcLabel) / 2) * Math.abs(mid.x) + 9 * Math.abs(mid.y)
      const mark: AngleMark = {
        which: a.which,
        center: a.tail,
        ref,
        // On the page y points down, so counterclockwise is SVG's negative sweep.
        arc: {
          from: pt(a.tail.x + rd.x * r, a.tail.y + rd.y * r),
          to: pt(a.tail.x + d.x * r, a.tail.y + d.y * r),
          r,
          sweep: delta > 0 ? 0 : 1,
        },
        label: a.arcLabel,
        labelAt: pt(a.tail.x + mid.x * lr, a.tail.y + mid.y * lr),
      }
      marks.push(mark)
      placings.push({ rank: 0, at: mark.labelAt, out: mid, label: a.arcLabel, put: (p) => (mark.labelAt = p) })
    }
    if (a.parts) {
      const corner = pt(a.tip.x, a.tail.y)
      // The horizontal one's label on its side away from the tip; the vertical one's on its side away from the tail.
      const up = a.tip.y < a.tail.y ? 1 : -1
      const right = a.tip.x > a.tail.x ? 1 : -1
      const beside = 12 + labelWidth(a.yLabel) / 2
      const c: Components = {
        which: a.which,
        x: seg(a.tail, corner),
        y: seg(corner, a.tip),
        xLabel: a.xLabel,
        xLabelAt: pt((a.tail.x + a.tip.x) / 2, a.tail.y + 20 * up),
        yLabel: a.yLabel,
        yLabelAt: pt(a.tip.x + beside * right, (a.tail.y + a.tip.y) / 2),
      }
      components.push(c)
      placings.push(
        { rank: 2, at: c.xLabelAt, alt: pt(c.xLabelAt.x, a.tail.y - 20 * up), out: { x: 0, y: up }, label: c.xLabel, put: (p) => (c.xLabelAt = p) },
        { rank: 2, at: c.yLabelAt, alt: pt(a.tip.x - beside * right, c.yLabelAt.y), out: { x: right, y: 0 }, label: c.yLabel, put: (p) => (c.yLabelAt = p) },
      )
    }
  }

  // Axes through the origin, past every arrow and mark, with x and y at their far ends.
  let axes: Axes | null = null
  if (s.axes) {
    const b = bounds([origin, ...ends, ...marks.map((m) => pt(m.ref.x2, m.ref.y2))])
    const right = b.right + AXIS_PAST
    const top = b.top - AXIS_PAST
    axes = {
      x: seg(pt(b.left - AXIS_PAST, origin.y), pt(right, origin.y)),
      y: seg(pt(origin.x, b.bottom + AXIS_PAST), pt(origin.x, top)),
      xLabelAt: pt(right + 12, origin.y),
      yLabelAt: pt(origin.x, top - 16),
    }
  }

  // Labels that would land on another label or a line move to a clear spot
  // nearby, angle marks' first since theirs is the tightest spot, then the
  // arrows', then the components'. No arrow moves.
  const lines = [
    ...arrows.map((a) => a.v),
    ...components.flatMap((c) => [c.x, c.y]),
    ...marks.flatMap((m) => [m.ref, ...arcPieces(m.center, m.arc)]),
    ...(axes ? [axes.x, axes.y] : []),
  ]
  placings.sort((a, b) => a.rank - b.rank)
  placeLabels(placings, lines, null).forEach((p, i) => placings[i].put(p))

  const axisLabel = { mode: 'text' as const, text: 'x' }
  const extent = [
    origin,
    ...ends,
    ...arrows.flatMap((a) => boxCorners(labelBox(a.labelAt, a.label))),
    ...marks.flatMap((m) => [pt(m.ref.x2, m.ref.y2), ...boxCorners(labelBox(m.labelAt, m.label))]),
    ...components.flatMap((c) => [...boxCorners(labelBox(c.xLabelAt, c.xLabel)), ...boxCorners(labelBox(c.yLabelAt, c.yLabel))]),
    ...(axes
      ? [pt(axes.x.x1, axes.x.y1), pt(axes.y.x1, axes.y.y1), ...boxCorners(labelBox(axes.xLabelAt, axisLabel)), ...boxCorners(labelBox(axes.yLabelAt, axisLabel))]
      : []),
  ]
  return { origin, arrows, marks, components, axes, extent }
}

export function buildVectorDiagram(s: VectorSettings): VectorFigure {
  const b = bounds(layout(s, pt(0, 0)).extent)
  if (!s.grid) {
    const width = Math.ceil(Math.max(MIN_SIZE, b.right - b.left + 2 * MARGIN))
    const height = Math.ceil(Math.max(MIN_SIZE, b.bottom - b.top + 2 * MARGIN))
    const origin = pt((width - (b.right - b.left)) / 2 - b.left, (height - (b.bottom - b.top)) / 2 - b.top)
    return { ...layout(s, origin), width, height, grid: [] }
  }
  // Whole squares around everything, at least a little clear of it, with
  // squares added on alternate sides until the figure is big enough.
  let left = Math.floor((b.left - MARGIN / 2) / SQUARE)
  let right = Math.ceil((b.right + MARGIN / 2) / SQUARE)
  let top = Math.floor((b.top - MARGIN / 2) / SQUARE)
  let bottom = Math.ceil((b.bottom + MARGIN / 2) / SQUARE)
  for (let i = 0; (right - left) * SQUARE < MIN_SIZE; i++) i % 2 ? left-- : right++
  for (let i = 0; (bottom - top) * SQUARE < MIN_SIZE; i++) i % 2 ? top-- : bottom++
  // A pixel of paper around the grid so its outside lines aren't cut in half.
  const origin = pt(1 - left * SQUARE, 1 - top * SQUARE)
  const width = (right - left) * SQUARE + 2
  const height = (bottom - top) * SQUARE + 2
  const grid: Segment[] = []
  for (let i = 0; i <= right - left; i++) grid.push(seg(pt(1 + i * SQUARE, 1), pt(1 + i * SQUARE, height - 1)))
  for (let j = 0; j <= bottom - top; j++) grid.push(seg(pt(1, 1 + j * SQUARE), pt(width - 1, 1 + j * SQUARE)))
  return { ...layout(s, origin), width, height, grid }
}
