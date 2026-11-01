// Where everything in a Projectile Motion figure goes, before mirroring: the
// ball launched to the right from level ground or from the top of a cliff,
// its path, and the ground it lands on, drawn as a plain line like an axis. The path is the real parabola for the
// launch angle and cliff height (drawn as one exact quadratic curve), as big
// as fits with everything else, then the whole figure is centered. Vectors
// are drawn about the right size, not to scale.
//
// The path is worked out with v₀ = 1 and g = 1, so a cliff height is in units
// of v₀²/g. The ball's middle follows the path. On level ground it starts and
// lands with its middle on the ground line; from a cliff it starts centered on
// the cliff's top corner, its middle the cliff's height above the line.

import { labelRuns, type Label } from '$lib/shared/label'
import { objectHeight } from '$lib/shared/objects'
import { labelPoint, type LabeledVector, type Point, type Segment } from '$lib/shared/vector'
import { launchAngle, type ProjectileSettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 400
export const LABEL_SIZE = 22
export const DOT_R = 6
const MARGIN = 18
const VECTOR_LENGTH = 72
const GRAVITY_LENGTH = 56
/** How far past the ball's edge the angle's arc is. */
const ARC_GAP = 26
const GROUND_OVERHANG = 30
const CLIFF_WIDTH = 90
/** How far below the ground the range mark is, and beside the cliff its height mark. */
const RANGE_GAP = 26
const CLIFF_GAP = 26

export type VectorKind = 'velocity' | 'gravity'

/** A launch velocity component, with dotted guides from the velocity's tip. */
export interface Component {
  v: Segment
  label: Label
  labelAt: Point
}

export interface ProjectileFigure {
  width: number
  height: number
  object: { kind: 'ball' | 'dot'; size: number; r: number }
  /** The ball's middle at the launch, and at each equal time step after it (the last is the landing). */
  launch: Point
  positions: Point[]
  /** Letters on the launch and every position, A first. */
  letters: { label: Label; at: Point }[]
  /** The path as a quadratic curve: start, control point, end. */
  path: { from: Point; control: Point; to: Point }
  /** The part of the path drawn: all of it, or from just past the launch velocity's head, which already shows where it starts. */
  drawnPath: { from: Point; control: Point; to: Point }
  landing: Point
  /** The peak of the path, if it rises above the launch. */
  peak: Point | null
  ground: Segment
  /** The cliff's outline: its foot at the back, up to its top, out to its edge and down to the ground. */
  cliff: Point[] | null
  vectors: LabeledVector<VectorKind>[]
  components: Component[]
  guides: Segment[]
  /** The angle mark: a dashed horizontal line from the ball, and an arc from it to the velocity. */
  angle: { ref: Segment | null; arc: { from: Point; to: Point; r: number }; labelAt: Point } | null
  heightMark: Segment | null
  heightLabelAt: Point | null
  rangeMark: Segment | null
  rangeLabelAt: Point | null
  cliffMark: Segment | null
  cliffLabelAt: Point | null
  /** Short lines from what a mark measures out to it. */
  extensions: Segment[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })
const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })

/** How wide a label is drawn, roughly. */
export const labelWidth = (l: Label) =>
  l.mode === 'blank' ? LABEL_SIZE * 2.4 : l.mode === 'none' ? 0 : [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45

interface Box {
  x: number
  y: number
  w: number
  h: number
}
const boxOf = (at: Point, l: Label): Box => ({ x: at.x, y: at.y, w: labelWidth(l) + 6, h: LABEL_SIZE + 4 })
const overlaps = (a: Box, b: Box) => a.w > 6 && b.w > 6 && Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
const corners = (b: Box) => (b.w <= 6 ? [] : [pt(b.x - b.w / 2, b.y - b.h / 2), pt(b.x + b.w / 2, b.y + b.h / 2)])

/** The figure with the foot of the launch (the cliff's edge, or under the ball) at (0, 0), `k` pixels to a unit of v₀²/g. */
function layout(s: ProjectileSettings, k: number): ProjectileFigure {
  const a = (launchAngle(s) * Math.PI) / 180
  const sin = Math.sin(a)
  const cos = Math.cos(a)
  const cliff = s.start === 'cliff'
  const h = cliff ? s.cliffHeight : 0
  const kind = s.object as 'ball' | 'dot'
  const r = kind === 'ball' ? objectHeight('ball', s.objectSize) / 2 : DOT_R

  // On the ground line, or centered on the cliff's top corner.
  const launch = pt(0, -h * k)
  const top = launch.y
  const flight = sin + Math.sqrt(sin * sin + 2 * h)
  const at = (t: number) => pt(launch.x + k * cos * t, launch.y - k * (sin * t - (t * t) / 2))
  const landing = at(flight)
  const peak = a > 0 ? at(sin) : null
  // A parabola is exactly a quadratic curve whose control point is where the launch velocity would take it by half time.
  const control = pt(launch.x + (k * cos * flight) / 2, launch.y - (k * sin * flight) / 2)
  const times = Array.from({ length: s.positions }, (_, i) => ((i + 1) * flight) / s.positions)
  const positions = times.map(at)

  const back = cliff ? -CLIFF_WIDTH : launch.x - r
  const ground = seg(pt(back - GROUND_OVERHANG - (s.cliffMark && cliff ? CLIFF_GAP : 0), 0), pt(landing.x + r + GROUND_OVERHANG, 0))
  const cliffShape = cliff ? [pt(-CLIFF_WIDTH, 0), pt(-CLIFF_WIDTH, top), pt(0, top), pt(0, 0)] : null

  // Labels are placed in turn; one that lands on an earlier one (or on a
  // ball) steps away from what it labels until it's clear.
  const placed: Box[] = [launch, ...positions].map((p) => ({ x: p.x, y: p.y, w: 2 * r + 8, h: 2 * r + 4 }))
  const place = (want: Point, out: Point, l: Label) => {
    let p = want
    for (let i = 0; i < 16 && placed.some((b) => overlaps(b, boxOf(p, l))); i++) p = pt(p.x + out.x * 6, p.y + out.y * 6)
    placed.push(boxOf(p, l))
    return p
  }
  /** Keeps a label beside the launch clear of the ground or cliff top under it. */
  const aboveSurface = (p: Point) => pt(p.x, Math.min(p.y, (cliff && p.x < 0 ? top : 0) - LABEL_SIZE / 2 - 9))

  // Letters first, as each belongs right beside its ball.
  const letters: ProjectileFigure['letters'] = []
  if (s.letters && s.positions > 0) {
    for (const [i, t] of [0, ...times].entries()) {
      const p = i === 0 ? launch : positions[i - 1]
      // Beside the ball on the outside of the curve: to the left of the way it's moving.
      const vx = cos
      const vy = t - sin
      const len = Math.hypot(vx, vy)
      const out = { x: vy / len, y: -vx / len }
      const label: Label = { mode: 'text', text: String.fromCharCode(65 + i) }
      const gap = r + 14
      letters.push({ label, at: place(pt(p.x + out.x * gap, p.y + out.y * gap), out, label) })
    }
  }

  const d = { x: cos, y: -sin }
  const tip = pt(launch.x + d.x * (r + VECTOR_LENGTH), launch.y + d.y * (r + VECTOR_LENGTH))
  const velocity = s.velocity ? seg(launch, tip) : null
  // The curve's x moves evenly along it (its control point is halfway across), so cutting it at the tip's x is a straight split.
  const cut = velocity ? (tip.x + 4 - launch.x) / (landing.x - launch.x) : 0
  const drawnPath =
    cut > 0 && cut < 0.9
      ? {
          from: pt(
            (1 - cut) ** 2 * launch.x + 2 * cut * (1 - cut) * control.x + cut ** 2 * landing.x,
            (1 - cut) ** 2 * launch.y + 2 * cut * (1 - cut) * control.y + cut ** 2 * landing.y,
          ),
          control: pt((1 - cut) * control.x + cut * landing.x, (1 - cut) * control.y + cut * landing.y),
          to: landing,
        }
      : { from: launch, control, to: landing }
  const showParts = !!velocity && s.components && a > 0

  // The angle mark sits in the wedge between the horizontal and the velocity
  // (a component along the horizontal draws part of its line). On a shallow
  // launch the wedge is too narrow for the label, so it goes past the line's end.
  let angle: ProjectileFigure['angle'] = null
  if (s.angleMark && velocity && a > 0) {
    const arcR = r + ARC_GAP
    const refStart = showParts ? Math.max(r, (r + VECTOR_LENGTH) * cos) : r
    const refEnd = arcR + 14
    const lw = labelWidth(s.angleLabel)
    const lr = arcR + 12 + (lw / 2) * Math.cos(a / 2) + 9 * Math.sin(a / 2)
    const inWedge = lr * Math.sin(a / 2) >= 15
    const want = inWedge
      ? pt(launch.x + Math.cos(a / 2) * lr, launch.y - Math.sin(a / 2) * lr)
      : aboveSurface(pt(launch.x + Math.max(refEnd, refStart) + 8 + lw / 2, launch.y))
    angle = {
      // On level ground the ground line itself is the horizontal.
      ref: cliff && refStart < refEnd ? seg(pt(launch.x + refStart, launch.y), pt(launch.x + refEnd, launch.y)) : null,
      arc: { from: pt(launch.x + arcR, launch.y), to: pt(launch.x + d.x * arcR, launch.y + d.y * arcR), r: arcR },
      labelAt: place(want, { x: 1, y: 0 }, s.angleLabel),
    }
  }

  const vectors: LabeledVector<VectorKind>[] = []
  if (velocity) {
    const lw = labelWidth(s.velocityLabel)
    // Beside its head, on the outside: the path starts along the velocity and
    // bends below it, so past the tip would put the label on the path.
    const gap = 10 + (lw / 2) * sin + 13 * cos
    const want = pt(tip.x + d.x * 6 - sin * gap, tip.y + d.y * 6 - cos * gap)
    // Moving up, clear of the letters and the angle mark.
    vectors.push({ kind: 'velocity', v: velocity, label: s.velocityLabel, labelAt: place(want, { x: 0, y: -1 }, s.velocityLabel) })
  }

  const components: Component[] = []
  const guides: Segment[] = []
  if (showParts) {
    const xEnd = pt(tip.x, launch.y)
    const yEnd = pt(launch.x, tip.y)
    const xw = labelWidth(s.xLabel)
    const yw = labelWidth(s.yLabel)
    // The ground is right under the horizontal one, so its label is past its end; the vertical one's is beside it, away from the launch.
    components.push(
      { v: seg(launch, xEnd), label: s.xLabel, labelAt: place(aboveSurface(pt(xEnd.x + 10 + xw / 2, launch.y)), { x: 1, y: 0 }, s.xLabel) },
      { v: seg(launch, yEnd), label: s.yLabel, labelAt: place(pt(launch.x - 12 - yw / 2, (launch.y + yEnd.y) / 2), { x: -1, y: 0 }, s.yLabel) },
    )
    guides.push(seg(tip, xEnd), seg(tip, yEnd))
  }

  if (s.gravity) {
    // Three quarters of the way through the flight, below the path (a little
    // shorter if it must be, to clear the ground line), or above it if the
    // ground is too close.
    const p = at(flight * 0.75)
    const room = -p.y - r - 12 - 4
    const below = room >= GRAVITY_LENGTH * 0.75
    const length = below ? Math.min(GRAVITY_LENGTH, room) : GRAVITY_LENGTH
    const from = below ? pt(p.x, p.y + r + 12) : pt(p.x, p.y - r - 12 - length)
    const v = seg(from, pt(from.x, from.y + length))
    const lw = labelWidth(s.gravityLabel)
    vectors.push({
      kind: 'gravity',
      v,
      label: s.gravityLabel,
      labelAt: place(pt(from.x + 12 + lw / 2, from.y + length / 2), { x: 1, y: 0 }, s.gravityLabel),
    })
  }

  const extensions: Segment[] = []
  let heightMark: Segment | null = null
  let heightLabelAt: Point | null = null
  if (s.heightMark && peak) {
    // From the ground up to the path's peak, or to the bottom of the ball if there's one at the peak.
    const ballAtPeak = positions.some((p) => Math.abs(p.x - peak.x) < 0.5)
    heightMark = seg(pt(peak.x, 0), pt(peak.x, peak.y + (ballAtPeak ? r : 0)))
    const lw = labelWidth(s.heightLabel)
    heightLabelAt = place(pt(peak.x + 10 + lw / 2, peak.y / 2), { x: 1, y: 0 }, s.heightLabel)
  }
  let rangeMark: Segment | null = null
  let rangeLabelAt: Point | null = null
  if (s.rangeMark) {
    // From the cliff's edge (or the launch) to where the ball lands.
    const from = cliff ? 0 : launch.x
    // Below the balls sitting on the line, with lines down to it from under them.
    const y = r + RANGE_GAP
    const under = (x: number, ball: boolean) => seg(pt(x, ball ? r + 3 : 3), pt(x, y + 6))
    rangeMark = seg(pt(from, y), pt(landing.x, y))
    extensions.push(under(from, !cliff), under(landing.x, s.positions > 0))
    rangeLabelAt = place(pt((from + landing.x) / 2, y + 20), { x: 0, y: 1 }, s.rangeLabel)
  }
  let cliffMark: Segment | null = null
  let cliffLabelAt: Point | null = null
  if (s.cliffMark && cliff) {
    const x = -CLIFF_WIDTH - CLIFF_GAP
    cliffMark = seg(pt(x, 0), pt(x, top))
    extensions.push(seg(pt(-CLIFF_WIDTH - 4, top), pt(x - 6, top)))
    const lw = labelWidth(s.cliffLabel)
    cliffLabelAt = place(pt(x - 10 - lw / 2, top / 2), { x: -1, y: 0 }, s.cliffLabel)
  }

  const labelCorners = (at: Point | null, l: Label) => (at ? corners(boxOf(at, l)) : [])
  const extent = [
    pt(ground.x1, 0),
    pt(ground.x2, 0),
    ...[launch, ...positions].flatMap((p) => [pt(p.x - r, p.y - r), pt(p.x + r, p.y + r)]),
    ...(peak ? [pt(peak.x, peak.y - r)] : []),
    ...(cliffShape ?? []),
    ...vectors.flatMap((v) => [pt(v.v.x1, v.v.y1), pt(v.v.x2, v.v.y2), ...labelCorners(v.labelAt, v.label)]),
    ...components.flatMap((c) => labelCorners(c.labelAt, c.label)),
    ...letters.flatMap((l) => labelCorners(l.at, l.label)),
    ...(angle ? labelCorners(angle.labelAt, s.angleLabel) : []),
    ...(rangeMark ? [pt(rangeMark.x1, rangeMark.y1 + 6)] : []),
    ...labelCorners(heightLabelAt, s.heightLabel),
    ...labelCorners(rangeLabelAt, s.rangeLabel),
    ...(cliffMark ? [pt(cliffMark.x1, cliffMark.y1)] : []),
    ...labelCorners(cliffLabelAt, s.cliffLabel),
  ]

  return {
    width: WIDTH,
    height: HEIGHT,
    object: { kind, size: s.objectSize, r },
    launch,
    positions,
    letters,
    path: { from: launch, control, to: landing },
    drawnPath,
    landing,
    peak,
    ground,
    cliff: cliffShape,
    vectors,
    components,
    guides,
    angle,
    heightMark,
    heightLabelAt,
    rangeMark,
    rangeLabelAt,
    cliffMark,
    cliffLabelAt,
    extensions,
    extent,
  }
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})

function shifted(f: ProjectileFigure, dx: number, dy: number): ProjectileFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  const maybe = <T,>(v: T | null, fn: (v: T) => T) => (v === null ? null : fn(v))
  return {
    ...f,
    launch: p(f.launch),
    positions: f.positions.map(p),
    letters: f.letters.map((l) => ({ ...l, at: p(l.at) })),
    path: { from: p(f.path.from), control: p(f.path.control), to: p(f.path.to) },
    drawnPath: { from: p(f.drawnPath.from), control: p(f.drawnPath.control), to: p(f.drawnPath.to) },
    landing: p(f.landing),
    peak: maybe(f.peak, p),
    ground: sg(f.ground),
    cliff: maybe(f.cliff, (c) => c.map(p)),
    vectors: f.vectors.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    components: f.components.map((c) => ({ ...c, v: sg(c.v), labelAt: p(c.labelAt) })),
    guides: f.guides.map(sg),
    angle: maybe(f.angle, (m) => ({
      ref: maybe(m.ref, sg),
      arc: { ...m.arc, from: p(m.arc.from), to: p(m.arc.to) },
      labelAt: p(m.labelAt),
    })),
    heightMark: maybe(f.heightMark, sg),
    heightLabelAt: maybe(f.heightLabelAt, p),
    rangeMark: maybe(f.rangeMark, sg),
    rangeLabelAt: maybe(f.rangeLabelAt, p),
    cliffMark: maybe(f.cliffMark, sg),
    cliffLabelAt: maybe(f.cliffLabelAt, p),
    extensions: f.extensions.map(sg),
    extent: f.extent.map(p),
  }
}

export function buildProjectile(s: ProjectileSettings): ProjectileFigure {
  const room = { w: WIDTH - 2 * MARGIN, h: HEIGHT - 2 * MARGIN }
  const fits = (f: ProjectileFigure) => {
    const b = bounds(f.extent)
    return b.right - b.left <= room.w && b.bottom - b.top <= room.h
  }
  // The biggest path that fits with everything around it.
  let lo = 1
  let hi = 4000
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2
    if (fits(layout(s, k))) lo = k
    else hi = k
  }
  const f = layout(s, lo)
  const b = bounds(f.extent)
  return shifted(f, (WIDTH - (b.right - b.left)) / 2 - b.left, (HEIGHT - (b.bottom - b.top)) / 2 - b.top)
}
