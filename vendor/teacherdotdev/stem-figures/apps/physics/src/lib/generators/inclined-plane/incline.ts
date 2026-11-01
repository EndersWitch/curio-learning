// Where everything in an Inclined Plane figure goes, before mirroring: a ramp
// rising to the right from its foot, with the angle at the foot, the object
// (or a row of them, tied by strings or touching) resting on the slope, and
// the ground beneath. The ramp is as big as fits with everything else, but
// always long enough for its row, then the whole figure is centered.

import type { Point } from '$lib/shared/field'
import { labelRuns, type Label } from '$lib/shared/label'
import { objectHeight, objectLabelHeight, objectWidth, type ObjectKind } from '$lib/shared/objects'
import { boxAround, boxesMeet, polygonHits, segmentHits, type Box } from '$lib/shared/overlap'
import { labelPoint, numbered, type LabeledVector, type Segment } from '$lib/shared/vector'
import type { InclineSettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 400
const MARGIN = 18
const ARC_R = 46
const LABEL_GAP = 20
/** Room the angle's label needs between the slope and the ground. */
const LABEL_ROOM = 30
const LABEL_SIZE = 22
const HEIGHT_MARK_GAP = 28
const LENGTH_MARK_GAP = 24
const GROUND_OVERHANG = 30
const HATCH_SPACING = 13
const HATCH_LENGTH = 9
/** Vectors are drawn about the right size, not to scale. */
const VECTOR_LENGTH = 72
const MOTION_LENGTH = 56
const MOTION_GAP = 20
const TENSION_LENGTH = 56
const CONTACT_LENGTH = 34
/** The gap between objects tied in a row: room for the tension and friction between them, more up a steep slope, where weight points along it into the gap. */
const TIE_GAP = 130
const STEEP_GAP = 110
/** The least room left on the slope at each end of a row, and how far up the slope a row moves at a time to clear the angle's label. */
const END_ROOM = 20
const ROW_STEP = 8
const LABEL_MARGIN = 8

export type VectorKind = 'gravity' | 'normal' | 'friction' | 'applied' | 'tension' | 'contact' | 'velocity' | 'acceleration'

export type FigureVector = LabeledVector<VectorKind>

export interface PlacedObject {
  kind: ObjectKind
  size: number
  /** Where it rests on the slope (its bottom middle), and its tilt in degrees. */
  at: Point
  tilt: number
  middle: Point
  label: Label
  /** Where its label goes (the middle of its body). */
  labelAt: Point
  height: number
  width: number
}

export interface InclineFigure {
  width: number
  height: number
  ramp: { foot: Point; corner: Point; top: Point }
  /** The objects on the slope, from the foot up, and the strings tying them in a row. */
  objects: PlacedObject[]
  strings: Segment[]
  /** The angle's arc at the foot, and where its label goes (the label's middle). */
  arc: string
  angleLabelAt: Point
  lengthMark: Segment | null
  lengthLabelAt: Point | null
  heightMark: Segment | null
  heightLabelAt: Point | null
  /** Short lines from the ends of the slope or ramp out to a mark. */
  extensions: Segment[]
  /** Hatching under a rough slope. */
  hatches: Segment[]
  ground: Segment
  groundHatches: Segment[]
  vectors: FigureVector[]
  /** Every outermost point drawn, for fitting (and tests). */
  extent: Point[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })
const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })

/** Objects in a row touching, rather than tied? */
export const touching = (s: InclineSettings) => s.objects.length > 1 && s.joined === 'touching'
const gapOf = (s: InclineSettings) => (touching(s) ? 0 : (TIE_GAP + STEEP_GAP * Math.sin((s.angle * Math.PI) / 180)) * s.spacing)
/** How long the row of objects is along the slope, end to end. */
const rowLength = (s: InclineSettings) =>
  s.objects.reduce((sum, o) => sum + objectWidth(o.kind as ObjectKind, o.size), 0) + gapOf(s) * (s.objects.length - 1)

/**
 * The figure with the ramp's foot at (0, 0) and its base `base` long. A row
 * of objects starts at least `back` up the slope from the foot (see
 * buildIncline, which moves it up until it's clear of the angle's label).
 */
function layout(s: InclineSettings, base: number, back = END_ROOM): InclineFigure {
  const a = (s.angle * Math.PI) / 180
  const rise = base * Math.tan(a)
  const foot = pt(0, 0)
  const corner = pt(base, 0)
  const top = pt(base, -rise)
  const slope = base / Math.cos(a)
  // Along the slope (up it), and out of it (away from the ramp).
  const u = { x: Math.cos(a), y: -Math.sin(a) }
  const n = { x: -Math.sin(a), y: -Math.cos(a) }
  const along = (p: Point, d: number, q = u) => pt(p.x + q.x * d, p.y + q.y * d)

  // How far along the slope each object's middle is: the object, or the
  // middle of the row, where the teacher put it, but all of it on the slope.
  const sizes = s.objects.map((o) => ({ w: objectWidth(o.kind as ObjectKind, o.size), h: objectHeight(o.kind as ObjectKind, o.size) }))
  let reaches = [Math.min(Math.max(s.position * slope, sizes[0].w / 2), slope - sizes[0].w / 2)]
  if (sizes.length > 1) {
    const length = rowLength(s)
    let d = Math.min(Math.max(s.position * slope, length / 2 + back), slope - length / 2 - END_ROOM) - length / 2
    reaches = sizes.map(({ w }) => {
      const reach = d + w / 2
      d += w + gapOf(s)
      return reach
    })
  }
  const objects: PlacedObject[] = s.objects.map((o, i) => {
    const kind = o.kind as ObjectKind
    const at = along(foot, reaches[i])
    const { w, h } = sizes[i]
    return { kind, size: o.size, at, tilt: -s.angle, middle: along(at, h / 2, n), label: o.label, labelAt: along(at, objectLabelHeight(kind, o.size), n), height: h, width: w }
  })
  const corners = objects.flatMap((o) => [along(o.at, -o.width / 2), along(o.at, o.width / 2)].flatMap((p) => [p, along(p, o.height, n)]))
  const tallest = Math.max(...sizes.map(({ h }) => h))
  // Strings between the objects in a row, parallel to the slope at the middle of the shorter of each pair.
  const strings = touching(s)
    ? []
    : objects.slice(1).map((o, i) => {
        const back = objects[i]
        const lift = Math.min(back.height, o.height) / 2
        return seg(along(along(back.at, back.width / 2), lift, n), along(along(o.at, -o.width / 2), lift, n))
      })

  // On a shallow ramp the arc and its label move out from the foot, to where
  // the gap between the slope and the ground is tall enough for the label.
  // The label sits past the arc, pushed out by about half its width.
  // A ramp too shallow for that has its label just above the slope instead,
  // beside the end of the arc; with a row of objects the arc stays small, so
  // its label is near the foot and the row has the rest of the slope.
  const labelWidth = [...labelRuns(s.angleLabel.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.5
  const wanted = Math.max(ARC_R + LABEL_GAP, LABEL_ROOM / Math.tan(a))
  const labelR = Math.min(wanted, base * 0.45)
  const arcR = wanted <= labelR || objects.length === 1 ? labelR - LABEL_GAP : ARC_R
  const arc = `M${r2(arcR)},0 A${r2(arcR)},${r2(arcR)} 0 0 0 ${r2(u.x * arcR)},${r2(u.y * arcR)}`
  const half = a / 2
  const angleLabelAt =
    wanted <= labelR
      ? pt(Math.cos(half) * labelR + Math.max(0, labelWidth / 2 - 8), -Math.sin(half) * labelR - 2)
      : along(along(foot, arcR + labelWidth / 2), LABEL_SIZE * 0.8, n)

  const extensions: Segment[] = []
  let lengthMark: Segment | null = null
  let lengthLabelAt: Point | null = null
  if (s.lengthMark) {
    // Parallel to the slope, out past the object, with lines out to it from both ends.
    const off = tallest + LENGTH_MARK_GAP
    const from = along(foot, off, n)
    const to = along(top, off, n)
    lengthMark = seg(from, to)
    extensions.push(seg(along(foot, 6, n), along(foot, off + 6, n)), seg(along(top, 6, n), along(top, off + 6, n)))
    lengthLabelAt = along(along(from, slope / 2), LABEL_GAP, n)
  }
  let heightMark: Segment | null = null
  let heightLabelAt: Point | null = null
  if (s.heightMark) {
    const x = base + HEIGHT_MARK_GAP
    heightMark = seg(pt(x, 0), pt(x, -rise))
    extensions.push(seg(pt(base + 6, -rise), pt(x + 6, -rise)))
    heightLabelAt = pt(x + LABEL_GAP, -rise / 2)
  }

  const hatches: Segment[] = []
  if (s.surface === 'rough') {
    // Slanted ticks just under the slope, inside the ramp, clear of the angle's arc and label.
    for (let d = arcR + LABEL_GAP * 2 + labelWidth; d < slope - 4; d += HATCH_SPACING) {
      const p = along(foot, d)
      hatches.push(seg(p, pt(p.x - n.x * HATCH_LENGTH - u.x * HATCH_LENGTH * 0.7, p.y - n.y * HATCH_LENGTH - u.y * HATCH_LENGTH * 0.7)))
    }
  }

  const ground = seg(pt(-GROUND_OVERHANG, 0), pt(base + GROUND_OVERHANG + (s.heightMark ? HEIGHT_MARK_GAP : 0), 0))
  const groundHatches: Segment[] = []
  for (let x = ground.x1 + 4; x < ground.x2; x += HATCH_SPACING) groundHatches.push(seg(pt(x + HATCH_LENGTH * 0.8, 0), pt(x, HATCH_LENGTH)))

  // Vectors. Forces start at the edge of the object, in the direction they
  // point: gravity straight down, the normal force straight out of the slope,
  // the applied force along the slope at mid-height, and friction along the
  // slope at the contact surface. Velocity and acceleration ride above the
  // object, set off to one side so they don't cross the normal force.
  //
  // In a row, every object has its own gravity, normal force and friction,
  // numbered; tension runs along each string at both ends, toward the other
  // object. The applied force pulls the object in front, or pushes (its tip
  // at the object) the one at the back of objects touching. Objects touching
  // have no room between them, so each one's friction runs under it, just
  // below the slope; the contact forces start where they touch, each pushing
  // into its own object; and they move as one, with one velocity and one
  // acceleration, over the one in front.
  const toEdge = (o: PlacedObject, d: Point) => {
    if (o.kind === 'ball') return o.height / 2
    const du = Math.abs(d.x * u.x + d.y * u.y)
    const dn = Math.abs(d.x * n.x + d.y * n.y)
    return Math.min(du > 1e-9 ? o.width / 2 / du : Infinity, dn > 1e-9 ? o.height / 2 / dn : Infinity)
  }
  const widthOf = (l: Label) => [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45
  const vectors: FigureVector[] = []
  const tipGap = (label: Label, d: Point) => 12 + (widthOf(label) / 2) * Math.abs(d.x) + 11 * Math.abs(d.y)
  const add = (kind: VectorKind, from: Point, d: Point, length: number, label: Label, side?: 1 | -1) => {
    const v = seg(from, along(from, length, d))
    const labelAt = side === undefined ? labelPoint(v, { at: 'tip', gap: tipGap(label, d) }) : labelPoint(v, { at: 'middle', side, gap: 16 })
    vectors.push({ kind, v, label, labelAt: pt(labelAt.x, labelAt.y) })
  }
  const slopeDir = (dir: 'up' | 'down') => (dir === 'up' ? u : { x: -u.x, y: -u.y })
  /** Side 1 or −1 of a vector along the slope: the one out of the slope, or the one into it. */
  const outward = (d: Point, out: boolean) => ((d.x * u.x + d.y * u.y > 0) === out ? 1 : -1)
  const several = objects.length > 1
  const nth = (label: Label, i: number) => (several ? numbered(label, i + 1) : label)
  const inTouch = touching(s)
  /** The object at the front of the row, going this way. */
  const lead = (dir: 'up' | 'down') => (dir === 'up' ? objects.at(-1)! : objects[0])
  if (s.gravity) {
    const d = { x: 0, y: 1 }
    objects.forEach((o, i) => add('gravity', along(o.middle, toEdge(o, d), d), d, VECTOR_LENGTH, nth(s.gravityLabel, i)))
  }
  if (s.normal) objects.forEach((o, i) => add('normal', along(o.middle, toEdge(o, n), n), n, VECTOR_LENGTH, nth(s.normalLabel, i)))
  if (s.tension) {
    strings.forEach((st, i) => {
      const label = strings.length > 1 ? numbered(s.tensionLabel, i + 1) : s.tensionLabel
      const length = Math.min(TENSION_LENGTH, Math.hypot(st.x2 - st.x1, st.y2 - st.y1) * 0.42)
      add('tension', pt(st.x1, st.y1), u, length, label, outward(u, true))
      add('tension', pt(st.x2, st.y2), slopeDir('down'), length, label, outward(slopeDir('down'), true))
    })
  }
  if (s.applied !== 'none') {
    const d = slopeDir(s.applied)
    if (inTouch) {
      // A push, its tip at the back of the row.
      const o = lead(s.applied === 'up' ? 'down' : 'up')
      const at = along(o.middle, -toEdge(o, d), d)
      const v = seg(along(at, -VECTOR_LENGTH, d), at)
      const labelAt = labelPoint({ x1: v.x2, y1: v.y2, x2: v.x1, y2: v.y1 }, { at: 'tip', gap: tipGap(s.appliedLabel, d) })
      vectors.push({ kind: 'applied', v, label: s.appliedLabel, labelAt: pt(labelAt.x, labelAt.y) })
    } else {
      const o = lead(s.applied)
      add('applied', along(o.middle, toEdge(o, d), d), d, VECTOR_LENGTH, s.appliedLabel)
    }
  }
  if (s.friction !== 'none') {
    const d = slopeDir(s.friction)
    objects.forEach((o, i) => {
      if (inTouch) {
        // From under the object's middle, just below the slope, labeled below that.
        add('friction', along(o.at, -9, n), d, Math.min(VECTOR_LENGTH * 0.85, o.width * 0.8), nth(s.frictionLabel, i), outward(d, false))
      } else {
        // Just clear of the slope, so the arrow's white outline doesn't break the slope's line;
        // in a row, short enough to stay clear of the next object.
        const length = several ? Math.min(VECTOR_LENGTH * 0.85, gapOf(s) * 0.6) : VECTOR_LENGTH * 0.85
        add('friction', along(along(o.at, o.width / 2, d), 9, n), d, length, nth(s.frictionLabel, i))
      }
    })
  }
  if (s.contact && inTouch) {
    // Equal and opposite, from the face where two objects touch, near the top of the shorter one;
    // one label for the pair, above that face.
    objects.slice(1).forEach((o, i) => {
      const back = objects[i]
      const face = along(o.at, -o.width / 2)
      const from = along(face, Math.min(back.height, o.height) - (back.kind === 'ball' || o.kind === 'ball' ? Math.min(back.height, o.height) / 2 : 7), n)
      const length = Math.min(CONTACT_LENGTH, back.width * 0.45, o.width * 0.45)
      const label = objects.length > 2 ? numbered(s.contactLabel, i + 1) : s.contactLabel
      const labelAt = along(face, Math.max(back.height, o.height) + 16, n)
      vectors.push({ kind: 'contact', v: seg(from, along(from, length)), label, labelAt })
      vectors.push({ kind: 'contact', v: seg(from, along(from, -length)), label: { ...label, mode: 'none' }, labelAt })
    })
  }
  let k = 0
  for (const [kind, dir, label] of [
    ['velocity', s.velocity, s.velocityLabel],
    ['acceleration', s.acceleration, s.accelerationLabel],
  ] as const) {
    if (dir === 'none') continue
    const d = slopeDir(dir)
    for (const o of inTouch ? [lead(dir)] : objects) {
      // Label on the outer side of the arrow (side 1 is to the left of the way it points).
      add(kind, along(along(o.middle, o.height / 2 + MOTION_GAP + k * (MOTION_GAP + 18), n), 14, d), d, MOTION_LENGTH, label, dir === 'up' ? 1 : -1)
    }
    k++
  }

  const labelBox = (p: Point | null, w = 16) => (p ? [pt(p.x - w, p.y - 14), pt(p.x + w, p.y + 14)] : [])
  const extent = [
    foot,
    corner,
    top,
    pt(ground.x1, HATCH_LENGTH),
    pt(ground.x2, HATCH_LENGTH),
    ...corners,
    ...labelBox(angleLabelAt),
    ...(lengthMark ? [pt(lengthMark.x1, lengthMark.y1), pt(lengthMark.x2, lengthMark.y2)] : []),
    ...labelBox(lengthLabelAt),
    ...labelBox(heightLabelAt, 24),
    ...vectors.flatMap((v) => [pt(v.v.x2, v.v.y2), ...labelBox(v.labelAt, widthOf(v.label) / 2 + 6)]),
  ]

  return {
    width: WIDTH,
    height: HEIGHT,
    ramp: { foot, corner, top },
    objects,
    strings,
    arc,
    angleLabelAt,
    lengthMark,
    lengthLabelAt,
    heightMark,
    heightLabelAt,
    extensions,
    hatches,
    ground,
    groundHatches,
    vectors,
    extent,
  }
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})

function shifted(f: InclineFigure, dx: number, dy: number): InclineFigure {
  const p = (q: Point) => pt(q.x + dx, q.y + dy)
  const sg = (q: Segment) => seg(p({ x: q.x1, y: q.y1 }), p({ x: q.x2, y: q.y2 }))
  return {
    ...f,
    ramp: { foot: p(f.ramp.foot), corner: p(f.ramp.corner), top: p(f.ramp.top) },
    objects: f.objects.map((o) => ({ ...o, at: p(o.at), middle: p(o.middle), labelAt: p(o.labelAt) })),
    strings: f.strings.map(sg),
    arc: f.arc, // drawn relative to the foot
    angleLabelAt: p(f.angleLabelAt),
    lengthMark: f.lengthMark && sg(f.lengthMark),
    lengthLabelAt: f.lengthLabelAt && p(f.lengthLabelAt),
    heightMark: f.heightMark && sg(f.heightMark),
    heightLabelAt: f.heightLabelAt && p(f.heightLabelAt),
    extensions: f.extensions.map(sg),
    hatches: f.hatches.map(sg),
    ground: sg(f.ground),
    groundHatches: f.groundHatches.map(sg),
    vectors: f.vectors.map((v) => ({ ...v, v: sg(v.v), labelAt: p(v.labelAt) })),
    extent: f.extent.map(p),
  }
}

/** The box around the angle's label. */
export function angleLabelBox(f: InclineFigure, s: InclineSettings): Box {
  const width = [...labelRuns(s.angleLabel.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.5
  return boxAround(f.angleLabelAt, width / 2 + 4, 14)
}

/** Is the angle's label clear of every object, string and vector, and the vectors' labels? */
export function angleLabelClear(f: InclineFigure, s: InclineSettings): boolean {
  // With a little room to spare around it.
  const { left, top, right, bottom } = angleLabelBox(f, s)
  const box = { left: left - LABEL_MARGIN, top: top - LABEL_MARGIN, right: right + LABEL_MARGIN, bottom: bottom + LABEL_MARGIN }
  const corners = (o: PlacedObject) => {
    const t = (o.tilt * Math.PI) / 180
    const u = { x: Math.cos(t), y: Math.sin(t) }
    const n = { x: Math.sin(t), y: -Math.cos(t) }
    return [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]].map(([du, dn]) => ({
      x: o.at.x + u.x * du * o.width + n.x * dn * o.height,
      y: o.at.y + u.y * du * o.width + n.y * dn * o.height,
    }))
  }
  const widthOf = (l: Label) => [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45
  return (
    !f.objects.some((o) => polygonHits(box, corners(o))) &&
    !f.strings.some((st) => segmentHits(box, st)) &&
    !f.vectors.some((v) => segmentHits(box, v.v) || (v.label.mode !== 'none' && boxesMeet(box, boxAround(v.labelAt, widthOf(v.label) / 2 + 2, 11))))
  )
}

/**
 * The biggest ramp that fits with everything around it, but long enough for
 * a row of objects that starts at least `back` up the slope; a row too long
 * to fit makes the figure bigger instead.
 */
function fitted(s: InclineSettings, back: number): InclineFigure {
  const room = { w: WIDTH - 2 * MARGIN, h: HEIGHT - 2 * MARGIN }
  const least = s.objects.length > 1 ? (rowLength(s) + back + END_ROOM) * Math.cos((s.angle * Math.PI) / 180) : 0
  let base = Math.max(room.w, least)
  let f = layout(s, base, back)
  for (let i = 0; i < 80 && base > least; i++) {
    const b = bounds(f.extent)
    if (b.right - b.left <= room.w && b.bottom - b.top <= room.h) break
    base = Math.max(least, base * 0.96)
    f = layout(s, base, back)
  }
  return f
}

export function buildIncline(s: InclineSettings): InclineFigure {
  // A row of objects moves up the slope, a little at a time, until it and its
  // vectors are clear of the angle's label (the ramp growing, if it must).
  let f = fitted(s, END_ROOM)
  for (let back = END_ROOM + ROW_STEP; s.objects.length > 1 && !angleLabelClear(f, s) && back < 1000; back += ROW_STEP) f = fitted(s, back)
  const b = bounds(f.extent)
  const width = Math.max(WIDTH, Math.ceil(b.right - b.left + 2 * MARGIN))
  const height = Math.max(HEIGHT, Math.ceil(b.bottom - b.top + 2 * MARGIN))
  return { ...shifted(f, (width - (b.right - b.left)) / 2 - b.left, (height - (b.bottom - b.top)) / 2 - b.top), width, height }
}
