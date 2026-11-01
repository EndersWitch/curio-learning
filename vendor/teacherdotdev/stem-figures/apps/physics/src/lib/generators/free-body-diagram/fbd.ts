// Where everything in a Free Body Diagram goes: the body alone, with every
// force drawn from its middle and each force's label past its tip (moved to
// a clear spot nearby if it would land on another; arrows never move). Forces
// pointing exactly the same way are drawn side by side instead, each with its
// own length and its label beside its head. The figure is cropped to what's
// drawn, at the same scale every time, so two diagrams pasted side by side
// have arrows of the same size. Angles work as in $lib/shared/layout.
//
// Vector notation is applied here, to every vector's label (forces, their
// components, velocity and acceleration), so the label is sized as it's drawn.

import { asVector, type Label } from '$lib/shared/label'
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
  unit,
  type Arc,
} from '$lib/shared/layout'
import { objectHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import { labelPoint, type LabeledVector, type Point, type Segment } from '$lib/shared/vector'
import { onAxis, type FbdSettings } from './settings'

/** How long a force of length 1 is past the edge of the body. */
export const UNIT = 90
export const DOT_R = 6
/** The dot when forces point the same way: a little bigger, so two arrows side by side start on it, shafts and all. */
export const SIDE_DOT_R = 10
/** How far apart forces pointing the same way are drawn, side by side: a little more than an arrowhead is wide. */
export const SIDE_GAP = 16
/** How far past the body's farthest corner an angle mark's arc is, and how much farther each further arc from the same line. */
const ARC_GAP = 30
const ARC_STEP = 24
/** Velocity and acceleration: how long, and how far beside everything else. */
const MOTION_LENGTH = 64
const MOTION_GAP = 40
const MARGIN = 18
/** The smallest figure, so a body with one short force isn't a sliver. */
const MIN_SIZE = 160

export type BodyKind = 'dot' | ObjectKind

export interface FigureForce extends LabeledVector<'force'> {
  /** Which force in the settings this is. */
  index: number
  /** Its angle as drawn, after Mirror. */
  angle: number
}

/** An angle mark: a dashed reference line from the body, and an arc from it to the force. */
export interface AngleMark {
  index: number
  ref: Segment
  arc: Arc
  label: Label
  labelAt: Point
}

/** A force's components along the horizontal and vertical, with dotted guides from the force's tip. */
export interface Components {
  index: number
  x: Segment
  y: Segment
  guides: Segment[]
  xLabel: Label
  xLabelAt: Point
  yLabel: Label
  yLabelAt: Point
}

export interface FbdFigure {
  width: number
  height: number
  body: {
    kind: BodyKind
    size: number
    /** The body's middle, where every force starts. */
    middle: Point
    /** Where an object's bottom middle goes (objects are drawn from there). */
    at: Point
    width: number
    height: number
  }
  forces: FigureForce[]
  /** Velocity and acceleration, beside the body. */
  motion: LabeledVector<'velocity' | 'acceleration'>[]
  marks: AngleMark[]
  components: Components[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

/** Forces pointing exactly the same way, which are drawn side by side: groups of their indexes. */
export function sameDirection(forces: { angle: number }[]): number[][] {
  const groups = new Map<number, number[]>()
  forces.forEach((f, i) => groups.set(f.angle, [...(groups.get(f.angle) ?? []), i]))
  return [...groups.values()].filter((g) => g.length > 1)
}

/**
 * How far each force's arrow is moved sideways from the middle, along
 * `across`: forces pointing the same way stand side by side, SIDE_GAP apart
 * and centered on the middle, in the order they're listed. Every other force
 * stays on the middle.
 */
function sideOffsets(forces: { angle: number }[]): number[] {
  const offsets = forces.map(() => 0)
  for (const group of sameDirection(forces)) group.forEach((i, k) => (offsets[i] = (k - (group.length - 1) / 2) * SIDE_GAP))
  return offsets
}

/** Sideways from a force set at `angle`: to the right, or down for a level one, and mirrored with the figure. */
function across(angle: number, mirror: boolean): Point {
  const d = direction(angle)
  const side = d.y > 0 || (d.y === 0 && d.x < 0) ? { x: d.y, y: -d.x } : { x: -d.y, y: d.x }
  return { x: mirror ? -side.x : side.x, y: side.y }
}

/** How far from the body's middle its edge is, going in direction `d`. */
function toEdge(kind: BodyKind, w: number, h: number, d: Point) {
  if (kind === 'dot' || kind === 'ball') return h / 2
  return Math.min(Math.abs(d.x) > 1e-9 ? w / 2 / Math.abs(d.x) : Infinity, Math.abs(d.y) > 1e-9 ? h / 2 / Math.abs(d.y) : Infinity)
}

/**
 * Velocity and acceleration in a column beside the diagram (to its right, or
 * its left when mirrored), a clear gap from the body and every force, each
 * with its label beside it on the side away from the diagram or above it.
 */
function motionBeside(s: FbdSettings, around: ReturnType<typeof bounds>): LabeledVector<'velocity' | 'acceleration'>[] {
  const wanted = [
    ['velocity', s.velocity, s.velocityAngle, s.velocityLabel],
    ['acceleration', s.acceleration, s.accelerationAngle, s.accelerationLabel],
  ] as const
  // Each one laid out around its own middle first.
  const cells = wanted
    .filter(([, on]) => on)
    .map(([kind, , angle, written]) => {
      const label = asVector(written, s.notation)
      const d = direction(drawnAngle(angle, s.mirror))
      const half = MOTION_LENGTH / 2
      const v = seg(pt(-d.x * half, -d.y * half), pt(d.x * half, d.y * half))
      const gap = 12 + (labelWidth(label) / 2) * Math.abs(d.y) + 11 * Math.abs(d.x)
      const away = s.mirror ? -1 : 1
      const [labelAt] = ([1, -1] as const)
        .map((side) => labelPoint(v, { at: 'middle', side, gap }))
        .sort((a, b) => b.x * away - b.y - (a.x * away - a.y))
      const box = bounds([pt(v.x1, v.y1), pt(v.x2, v.y2), ...boxCorners(labelBox(labelAt, label))])
      return { kind, v, label, labelAt, box }
    })
  const total = cells.reduce((sum, c) => sum + c.box.bottom - c.box.top, 0) + 16 * Math.max(0, cells.length - 1)
  let top = (around.top + around.bottom) / 2 - total / 2
  return cells.map((c) => {
    const dx = s.mirror ? around.left - MOTION_GAP - c.box.right : around.right + MOTION_GAP - c.box.left
    const dy = top - c.box.top
    top += c.box.bottom - c.box.top + 16
    return {
      kind: c.kind,
      v: seg(pt(c.v.x1 + dx, c.v.y1 + dy), pt(c.v.x2 + dx, c.v.y2 + dy)),
      label: c.label,
      labelAt: pt(c.labelAt.x + dx, c.labelAt.y + dy),
    }
  })
}

/** The figure with the body's middle at (0, 0). */
function layout(s: FbdSettings): FbdFigure {
  const kind = s.body as BodyKind
  const dotR = sameDirection(s.forces).length ? SIDE_DOT_R : DOT_R
  const h = kind === 'dot' ? dotR * 2 : objectHeight(kind, s.bodySize)
  const w = kind === 'dot' ? dotR * 2 : objectWidth(kind, s.bodySize)
  const middle = pt(0, 0)

  const offsets = sideOffsets(s.forces)
  /** The way each force's label moves to find a clear spot: out past the tip, or out to the side. */
  const labelsOut: Point[] = []
  const forces: FigureForce[] = s.forces.map((f, index) => {
    const angle = drawnAngle(f.angle, s.mirror)
    const d = direction(angle)
    // Every tail is at the middle, or beside it for forces pointing the same
    // way; the part past the body's edge is the force's relative length.
    const side = across(f.angle, s.mirror)
    const tail = pt(side.x * offsets[index], side.y * offsets[index])
    const reach = toEdge(kind, w, h, d) + UNIT * f.length
    const v = seg(tail, pt(tail.x + d.x * reach, tail.y + d.y * reach))
    const label = asVector(f.label, s.notation)
    const lw = labelWidth(label)
    // Its label goes past the tip; for a force beside others, beside its head, on the outside.
    const outward = Math.sign(offsets[index])
    const gap = outward * (10 + (lw / 2) * Math.abs(side.x) + 13 * Math.abs(side.y))
    const labelAt = outward
      ? pt(v.x2 - d.x * 10 + side.x * gap, v.y2 - d.y * 10 + side.y * gap)
      : labelPoint(v, { at: 'tip', gap: 12 + (lw / 2) * Math.abs(d.x) + 15 * Math.abs(d.y) })
    labelsOut.push(outward ? { x: side.x * outward, y: side.y * outward } : d)
    return { kind: 'force', index, angle, v, label, labelAt: pt(labelAt.x, labelAt.y) }
  })

  // Angle marks. The arc runs from the nearer half of the reference line to
  // the force, so it's never more than 90°, clear of the body's corners.
  // Arcs from the same half-line step outward so they don't lie on each other.
  const outside = kind === 'dot' || kind === 'ball' ? h / 2 : Math.hypot(w, h) / 2
  // Both are drawn from the force's tail, which is beside the middle for a
  // force beside others pointing the same way.
  const arcsFrom = new Map<number, number>()
  const marks: AngleMark[] = []
  const arcCenters: Point[] = []
  const components: Components[] = []
  for (const f of forces) {
    const setting = s.forces[f.index]
    if (onAxis(setting.angle)) continue
    const d = direction(f.angle)
    const tail = pt(f.v.x1, f.v.y1)
    const at = (x: number, y: number) => pt(tail.x + x, tail.y + y)
    if (setting.arc) {
      const refAngle = setting.from === 'h' ? (d.x > 0 ? 0 : 180) : d.y < 0 ? 90 : 270
      // How far the force is turned from the reference, counterclockwise.
      const delta = ((f.angle - refAngle + 540) % 360) - 180
      const n = arcsFrom.get(refAngle) ?? 0
      arcsFrom.set(refAngle, n + 1)
      const r = outside + ARC_GAP + n * ARC_STEP
      const rd = direction(refAngle)
      // The component along the same half-line already draws part of it.
      const along = setting.parts ? Math.abs(setting.from === 'h' ? f.v.x2 - tail.x : f.v.y2 - tail.y) : 0
      const start = Math.max(toEdge(kind, w, h, rd), along)
      const end = Math.max(start, r + 16)
      const ref = seg(at(rd.x * start, rd.y * start), at(rd.x * end, rd.y * end))
      const mid = direction(refAngle + delta / 2)
      const lw = labelWidth(setting.arcLabel)
      const lr = r + 12 + (lw / 2) * Math.abs(mid.x) + 9 * Math.abs(mid.y)
      marks.push({
        index: f.index,
        ref,
        // On the page y points down, so counterclockwise is SVG's negative sweep.
        arc: { from: at(rd.x * r, rd.y * r), to: at(d.x * r, d.y * r), r, sweep: delta > 0 ? 0 : 1 },
        label: setting.arcLabel,
        labelAt: at(mid.x * lr, mid.y * lr),
      })
      arcCenters.push(tail)
    }
    if (setting.parts) {
      const tip = { x: f.v.x2 - tail.x, y: f.v.y2 - tail.y }
      const xEnd = at(tip.x, 0)
      const yEnd = at(0, tip.y)
      // Each component's label goes on its far side from the force, clear of the body.
      const below = (kind === 'dot' ? 0 : h / 2) + 20
      const yLabel = asVector(setting.yLabel, s.notation)
      const beside = (kind === 'dot' ? 0 : w / 2) + 12 + labelWidth(yLabel) / 2
      components.push({
        index: f.index,
        x: seg(tail, xEnd),
        y: seg(tail, yEnd),
        guides: [seg(at(tip.x, tip.y), xEnd), seg(at(tip.x, tip.y), yEnd)],
        xLabel: asVector(setting.xLabel, s.notation),
        xLabelAt: at(tip.x / 2, tip.y < 0 ? below : -below),
        yLabel,
        yLabelAt: at(tip.x > 0 ? -beside : beside, tip.y / 2),
      })
    }
  }

  // Labels that would land on another label or an arrow (forces pointing
  // almost the same way, an angle mark beside a component) move to a clear
  // spot nearby. No arrow moves.
  const labels = [
    ...forces.map((f, i) => ({ at: f.labelAt, out: labelsOut[i], label: f.label, put: (p: Point) => (f.labelAt = p) })),
    ...marks.map((m) => ({ at: m.labelAt, out: unit(m.labelAt), label: m.label, put: (p: Point) => (m.labelAt = p) })),
    ...components.flatMap((c) => [
      {
        at: c.xLabelAt,
        alt: pt(c.xLabelAt.x, -c.xLabelAt.y),
        out: { x: 0, y: Math.sign(c.xLabelAt.y) || 1 },
        label: c.xLabel,
        put: (p: Point) => (c.xLabelAt = p),
      },
      {
        at: c.yLabelAt,
        alt: pt(-c.yLabelAt.x, c.yLabelAt.y),
        out: { x: Math.sign(c.yLabelAt.x) || 1, y: 0 },
        label: c.yLabel,
        put: (p: Point) => (c.yLabelAt = p),
      },
    ]),
  ]
  const lines = [
    ...forces.map((f) => f.v),
    ...components.flatMap((c) => [c.x, c.y]),
    ...marks.flatMap((m, i) => [m.ref, ...arcPieces(arcCenters[i], m.arc)]),
  ]
  const bodyBox = kind === 'dot' ? null : { x: 0, y: 0, w: w + 4, h: h + 4 }
  placeLabels(labels, lines, bodyBox).forEach((p, i) => labels[i].put(p))

  const diagram = [
    pt(-w / 2, -h / 2),
    pt(w / 2, h / 2),
    ...forces.flatMap((f) => [pt(f.v.x2, f.v.y2), ...boxCorners(labelBox(f.labelAt, f.label))]),
    ...marks.flatMap((m) => [pt(m.ref.x2, m.ref.y2), ...boxCorners(labelBox(m.labelAt, m.label))]),
    ...components.flatMap((c) => [...boxCorners(labelBox(c.xLabelAt, c.xLabel)), ...boxCorners(labelBox(c.yLabelAt, c.yLabel))]),
  ]
  const motion = motionBeside(s, bounds(diagram))
  const extent = [...diagram, ...motion.flatMap((m) => [pt(m.v.x1, m.v.y1), pt(m.v.x2, m.v.y2), ...boxCorners(labelBox(m.labelAt, m.label))])]

  return {
    width: 0,
    height: 0,
    body: { kind, size: s.bodySize, middle, at: pt(0, h / 2), width: w, height: h },
    forces,
    motion,
    marks,
    components,
    extent,
  }
}


function shifted(f: FbdFigure, dx: number, dy: number): FbdFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  return {
    ...f,
    body: { ...f.body, middle: p(f.body.middle), at: p(f.body.at) },
    forces: f.forces.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    motion: f.motion.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    marks: f.marks.map((m) => ({ ...m, ref: sg(m.ref), arc: { ...m.arc, from: p(m.arc.from), to: p(m.arc.to) }, labelAt: p(m.labelAt) })),
    components: f.components.map((c) => ({
      ...c,
      x: sg(c.x),
      y: sg(c.y),
      guides: c.guides.map(sg),
      xLabelAt: p(c.xLabelAt),
      yLabelAt: p(c.yLabelAt),
    })),
    extent: f.extent.map(p),
  }
}

export function buildFbd(s: FbdSettings): FbdFigure {
  const f = layout(s)
  const b = bounds(f.extent)
  const width = Math.ceil(Math.max(MIN_SIZE, b.right - b.left + 2 * MARGIN))
  const height = Math.ceil(Math.max(MIN_SIZE, b.bottom - b.top + 2 * MARGIN))
  return { ...shifted(f, (width - (b.right - b.left)) / 2 - b.left, (height - (b.bottom - b.top)) / 2 - b.top), width, height }
}
