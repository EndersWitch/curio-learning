// Laying out a magnifier: an enlarged circle of an instrument's scale around
// its reading, beside the whole instrument or instead of it.

export const MAGNIFIER_VIEWS = ['both', 'magnifier', 'whole'] as const
export type MagnifierView = (typeof MAGNIFIER_VIEWS)[number]

export const MAGNIFIER_VIEW_NAMES: Record<MagnifierView, string> = {
  both: 'Instrument and magnifier',
  magnifier: 'Magnifier only',
  whole: 'Instrument only',
}

/** Radius of the magnifier circle, in figure units. */
const RADIUS = 150
const GAP = 56

export interface Circle {
  x: number
  y: number
  r: number
}

/** A scene drawn inside a magnifier is scaled up, and lines and text scaled
 *  by the full amount look crude; this factor grows them more gently.
 *  Multiply a size meant for the unmagnified figure by it to get the size to
 *  draw at `zoom`. */
export const sizeAt = (zoom: number) => zoom ** 0.4 / zoom

/**
 * Where everything goes for a drawing `width` × `height` whose magnified
 * region is `source` (in drawing units). The drawing sits at `origin`, with
 * the magnifier to its right, level with the region as far as the drawing's
 * height allows. With the magnifier alone, only the magnifier is drawn.
 */
export function magnifierLayout(view: MagnifierView, width: number, height: number, source: Circle) {
  const R = RADIUS
  const atTop = { x: 0, y: 0 }
  if (view === 'whole') return { width, height, origin: atTop, magnifier: null }
  if (view === 'magnifier') return { width: 2 * R, height: 2 * R, origin: null, magnifier: { x: R, y: R, r: R } }
  // Room for the outlined region where it hangs past the drawing's edges (a
  // narrow thermometer is slimmer than the region around its reading).
  const left = Math.max(0, source.r - source.x)
  const above = Math.max(0, source.r - source.y)
  const below = Math.max(0, source.y + source.r - height)
  const tall = above + height + below
  // A drawing shorter than the magnifier is centered beside it.
  const origin = { x: left, y: Math.max(0, R - tall / 2) + above }
  const total = Math.max(tall, 2 * R)
  const y = Math.min(Math.max(origin.y + source.y, R), Math.max(R, total - R))
  return {
    width: left + width + GAP + 2 * R,
    height: total,
    origin,
    magnifier: { x: left + width + GAP + R, y, r: R },
  }
}

/** The two lines touching both circles on the outside, joining the region on
 *  the drawing to the magnifier. */
export function outerTangents(a: Circle, b: Circle): [number, number, number, number][] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  if (d <= Math.abs(a.r - b.r)) return []
  const toward = Math.atan2(dy, dx)
  const spread = Math.acos((a.r - b.r) / d)
  return [toward + spread, toward - spread].map((t) => [
    a.x + a.r * Math.cos(t),
    a.y + a.r * Math.sin(t),
    b.x + b.r * Math.cos(t),
    b.y + b.r * Math.sin(t),
  ])
}
