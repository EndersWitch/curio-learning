// Laying out figures drawn from angles, like the Free Body Diagram and the
// Vector Diagram: directions on the page, how big a label is, and moving
// labels to a clear spot when they would land on another label or a line.
//
// Angles are in degrees counterclockwise from the right, the way teachers
// give them; Mirror turns each one into 180° − angle, so a mirrored figure
// is drawn directly and its labels need no special handling.

import { labelRuns, type Label } from './label'
import type { Point, Segment } from './vector'

export const LABEL_SIZE = 22

const r2 = (n: number) => Math.round(n * 100) / 100
export const pt = (x: number, y: number): Point => ({ x: r2(x), y: r2(y) })
export const seg = (a: Point, b: Point): Segment => ({ x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y) })

/** The angle as drawn: mirrored left to right if asked. */
export const drawnAngle = (angle: number, mirror: boolean) => (mirror ? (540 - angle) % 360 : angle)

/** A unit vector on the page (y down) pointing at `angle`. */
export function direction(angle: number): Point {
  const a = (angle * Math.PI) / 180
  // Rounded so that 90° is exactly up, not a hair to the right.
  return { x: Math.round(Math.cos(a) * 1e9) / 1e9, y: -Math.round(Math.sin(a) * 1e9) / 1e9 }
}

/** How wide a label is drawn, roughly. */
export const labelWidth = (l: Label) =>
  l.mode === 'blank' ? LABEL_SIZE * 2.4 : l.mode === 'none' ? 0 : [...labelRuns(l.text).map((r) => r.text).join('')].length * LABEL_SIZE * 0.45

/** A label's box, around its middle. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
export const labelBox = (at: Point, l: Label): Box => ({ x: at.x, y: at.y, w: labelWidth(l) + 6, h: LABEL_SIZE + 4 })

/** A label box's two opposite corners, for fitting the figure; none for a label that's off. */
export const boxCorners = (b: Box) => (b.w <= 6 ? [] : [pt(b.x - b.w / 2, b.y - b.h / 2), pt(b.x + b.w / 2, b.y + b.h / 2)])

/** Do two label boxes overlap? Boxes of labels that are off never do. */
export const overlaps = (a: Box, b: Box, pad = 0) =>
  a.w > 6 && b.w > 6 && Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad

/** Does a segment pass through a box (shrunk by `shrink` on every side)? */
export function crosses(v: Segment, b: Box, shrink = 0) {
  const w = b.w / 2 - shrink
  const h = b.h / 2 - shrink
  if (w <= 0 || h <= 0) return false
  const steps = Math.max(1, Math.ceil(Math.hypot(v.x2 - v.x1, v.y2 - v.y1) / 3))
  for (let i = 0; i <= steps; i++) {
    const x = v.x1 + ((v.x2 - v.x1) * i) / steps
    const y = v.y1 + ((v.y2 - v.y1) * i) / steps
    if (Math.abs(x - b.x) < w && Math.abs(y - b.y) < h) return true
  }
  return false
}

/** A label to place: where it would go, the way it moves out (away from what it labels), and its text.
 *  `alt` is a second place it could go, on the other side of what it labels. */
export interface Placing {
  at: Point
  out: Point
  label: Label
  alt?: Point
}

/**
 * Labels placed one at a time, each at the first spot near where it would go
 * that's clear of the labels already placed, every arrow and line in
 * `lines`, and the body: first farther out, then to either side. A label
 * with no clear spot nearby stays where it would go.
 */
export function placeLabels(labels: Placing[], lines: Segment[], body: Box | null): Point[] {
  const steps: { e: number; l: number; cost: number }[] = []
  for (let e = 0; e <= 96; e += 8) for (const l of [0, 1, -1, 2, -2, 3, -3]) steps.push({ e, l, cost: e + 14 * Math.abs(l) })
  const placed: Box[] = []
  return labels.map((p) => {
    const side = { x: -p.out.y, y: p.out.x }
    const box = (at: Point) => labelBox(at, p.label)
    const clear = (b: Box) =>
      !placed.some((q) => overlaps(q, b, 2)) && !lines.some((v) => crosses(v, b)) && !(body && overlaps(body, b))
    // Spots near where it would go and, a little less wanted, near its other place (moving out the other way).
    const tries = [
      ...steps.map(({ e, l, cost }) => ({ cost, at: pt(p.at.x + p.out.x * e + side.x * l * 12, p.at.y + p.out.y * e + side.y * l * 12) })),
      ...(p.alt ? steps.map(({ e, l, cost }) => ({ cost: cost + 8, at: pt(p.alt!.x - p.out.x * e + side.x * l * 12, p.alt!.y - p.out.y * e + side.y * l * 12) })) : []),
    ].sort((a, b) => a.cost - b.cost)
    const best = labelWidth(p.label) > 0 ? (tries.find((t) => clear(box(t.at)))?.at ?? p.at) : p.at
    placed.push(box(best))
    return best
  })
}

/** An angle mark's arc: its ends, its radius, and its SVG sweep flag. */
export interface Arc {
  from: Point
  to: Point
  r: number
  sweep: 0 | 1
}

/** An arc around `center` as short straight pieces, for keeping labels off it. */
export function arcPieces(center: Point, arc: Arc): Segment[] {
  const a0 = Math.atan2(-(arc.from.y - center.y), arc.from.x - center.x)
  let span = Math.atan2(-(arc.to.y - center.y), arc.to.x - center.x) - a0
  span = ((span + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
  const at = (t: number) => pt(center.x + Math.cos(a0 + span * t) * arc.r, center.y - Math.sin(a0 + span * t) * arc.r)
  return Array.from({ length: 8 }, (_, i) => seg(at(i / 8), at((i + 1) / 8)))
}

/** The unit vector along `p`; (0, 0) stays (0, 0). */
export const unit = (p: Point) => {
  const n = Math.hypot(p.x, p.y) || 1
  return { x: p.x / n, y: p.y / n }
}

export const bounds = (points: Point[]) => ({
  left: Math.min(...points.map((p) => p.x)),
  right: Math.max(...points.map((p) => p.x)),
  top: Math.min(...points.map((p) => p.y)),
  bottom: Math.max(...points.map((p) => p.y)),
})
