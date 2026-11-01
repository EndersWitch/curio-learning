// Finding room on the graph for a label: each candidate box is kept clear of
// the lines and points already drawn and of the labels placed before it.

import type { Point } from '$shared/graph/grid'

export type Box = { x: number; y: number; w: number; h: number }

/** How far a point is from a box (0 inside it). */
export function distance(b: Box, p: Point) {
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w))
  const dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h))
  return Math.hypot(dx, dy)
}

/** How far the nearest of `points` is from a box. */
export function clearance(b: Box, points: Point[]) {
  let least = Infinity
  for (const p of points) {
    const d = distance(b, p)
    if (d < least) least = d
    if (least === 0) break
  }
  return least
}

export const overlaps = (a: Box, b: Box, pad = 0) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad

/** Whether a box is inside another, at least `pad` in from its edges. */
export const inside = (b: Box, area: Box, pad = 0) =>
  b.x >= area.x + pad && b.y >= area.y + pad && b.x + b.w <= area.x + area.w - pad && b.y + b.h <= area.y + area.h - pad

/** A line drawn through `points` as points no more than `gap` apart, for measuring room against. */
export function dense(points: Point[], gap = 3): Point[] {
  const out: Point[] = []
  for (let k = 0; k < points.length; k++) {
    const p = points[k]
    if (k) {
      const q = points[k - 1]
      const n = Math.ceil(Math.hypot(p.x - q.x, p.y - q.y) / gap)
      for (let i = 1; i < n; i++) out.push({ x: q.x + ((p.x - q.x) * i) / n, y: q.y + ((p.y - q.y) * i) / n })
    }
    out.push(p)
  }
  return out
}

/** The best-scoring candidate, or undefined when none can go anywhere (a null score). */
export function best<T>(candidates: T[], score: (c: T) => number | null): T | undefined {
  let top: T | undefined
  let topScore = -Infinity
  for (const c of candidates) {
    const s = score(c)
    if (s !== null && s > topScore) {
      top = c
      topScore = s
    }
  }
  return top
}
