// Does a label's box run into anything drawn: an object (as its corners), a
// line or arrow, or another label's box? For keeping a label clear of what's
// placed after it, like a ramp's angle label and a row of objects.

import type { Point, Segment } from './vector'

/** A label's box, around its middle. */
export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

export const boxAround = (p: Point, halfWidth: number, halfHeight: number): Box => ({
  left: p.x - halfWidth,
  top: p.y - halfHeight,
  right: p.x + halfWidth,
  bottom: p.y + halfHeight,
})

export const boxesMeet = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/** Does the segment cross the box, or lie in it? (Liang–Barsky clipping.) */
export function segmentHits(b: Box, s: Segment): boolean {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  let t0 = 0
  let t1 = 1
  for (const [p, q] of [
    [-dx, s.x1 - b.left],
    [dx, b.right - s.x1],
    [-dy, s.y1 - b.top],
    [dy, b.bottom - s.y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false
    } else {
      const t = q / p
      if (p < 0) t0 = Math.max(t0, t)
      else t1 = Math.min(t1, t)
      if (t0 > t1) return false
    }
  }
  return true
}

/** Does a convex polygon (its corners in order) meet the box? */
export function polygonHits(b: Box, corners: Point[]): boolean {
  const edges = corners.map((p, i) => ({ x1: p.x, y1: p.y, x2: corners[(i + 1) % corners.length].x, y2: corners[(i + 1) % corners.length].y }))
  if (edges.some((e) => segmentHits(b, e))) return true
  // Or the box is wholly inside it: its middle is on the same side of every edge.
  const mid = { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 }
  const sides = edges.map((e) => Math.sign((e.x2 - e.x1) * (mid.y - e.y1) - (e.y2 - e.y1) * (mid.x - e.x1)))
  return sides.every((side) => side === sides[0])
}
