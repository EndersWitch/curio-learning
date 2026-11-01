// Path data for the cell artwork: smooth curves through points, and the
// outlines of the organelles that are more than a circle. All plain numbers,
// so the figure draws the same on the server.

export type Pt = [number, number]

const r1 = (n: number) => Math.round(n * 10) / 10
const pt = ([x, y]: Pt) => `${r1(x)} ${r1(y)}`

/** A smooth curve through the points (Catmull–Rom, as cubic Béziers),
 *  closed back to the first point when `closed`. */
export function smooth(points: Pt[], closed = false): string {
  const n = points.length
  if (n < 2) return ''
  const at = (i: number): Pt => (closed ? points[(i + n) % n] : points[Math.min(n - 1, Math.max(0, i))])
  let d = `M ${pt(points[0])}`
  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return closed ? d + ' Z' : d
}

/** Points along the same curve `smooth` draws, `per` to each segment, for
 *  placing things on an outline (microvilli on a membrane, say). */
export function sample(points: Pt[], closed = false, per = 12): Pt[] {
  const n = points.length
  const at = (i: number): Pt => (closed ? points[(i + n) % n] : points[Math.min(n - 1, Math.max(0, i))])
  const out: Pt[] = []
  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    for (let k = 0; k < per; k++) {
      const t = k / per
      const u = 1 - t
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ])
    }
  }
  if (!closed) out.push(points[n - 1])
  return out
}

/** Points around an ellipse at (cx, cy), each pushed out by `wobble[i]`
 *  (a fraction of the radius), for a cell or vacuole that isn't perfectly round. */
export function blob(cx: number, cy: number, rx: number, ry: number, wobble: number[], turn = 0): Pt[] {
  return wobble.map((w, i) => {
    const a = turn + (i / wobble.length) * 2 * Math.PI
    return [cx + rx * (1 + w) * Math.cos(a), cy + ry * (1 + w) * Math.sin(a)]
  })
}

/** A capsule (a rectangle with fully rounded ends) centred on the origin,
 *  `length` long and `width` wide, along the x axis. */
export function capsule(length: number, width: number): string {
  const r = width / 2
  const x = length / 2 - r
  return `M ${r1(-x)} ${r1(-r)} H ${r1(x)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(x)} ${r1(r)} H ${r1(-x)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(-x)} ${r1(-r)} Z`
}

/** A mitochondrion's inner membrane, centred on the origin: a capsule
 *  `length` × `width` whose top and bottom edges fold in turn into the
 *  middle as cristae, `folds` of them, each reaching `depth` of the way
 *  across. */
export function cristae(length: number, width: number, folds: number, depth = 0.68): string {
  const r = width / 2
  const x = length / 2 - r
  const reach = width * depth
  const w = Math.min(2.4, (2 * x) / (folds * 3)) // half a fold's width
  const step = (2 * x) / (folds + 1)
  const xs = Array.from({ length: folds }, (_, i) => -x + step * (i + 1))
  const top = xs.filter((_, i) => i % 2 === 0)
  const bottom = xs.filter((_, i) => i % 2 === 1).reverse()
  let d = `M ${r1(-x)} ${r1(-r)}`
  for (const fx of top) {
    d += ` H ${r1(fx - w)} V ${r1(-r + reach - w)} A ${r1(w)} ${r1(w)} 0 0 0 ${r1(fx + w)} ${r1(-r + reach - w)} V ${r1(-r)}`
  }
  d += ` H ${r1(x)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(x)} ${r1(r)}`
  for (const fx of bottom) {
    d += ` H ${r1(fx + w)} V ${r1(r - reach + w)} A ${r1(w)} ${r1(w)} 0 0 0 ${r1(fx - w)} ${r1(r - reach + w)} V ${r1(r)}`
  }
  d += ` H ${r1(-x)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(-x)} ${r1(-r)} Z`
  return d
}

/** A point at `angle` degrees and `r` from (cx, cy). */
export const polar = (cx: number, cy: number, r: number, angle: number): Pt => [
  cx + r * Math.cos((angle * Math.PI) / 180),
  cy + r * Math.sin((angle * Math.PI) / 180),
]

/** A wave along the x axis from 0 to `length`, `amplitude` high, with
 *  `waves` full waves, growing from flat at its start (a flagellum). */
export function wave(length: number, amplitude: number, waves: number, steps = 48): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const grow = Math.min(1, t * 3)
    return [t * length, amplitude * grow * Math.sin(t * waves * 2 * Math.PI)] as Pt
  })
}

/** A small pseudo-random number generator, so scattered things (ribosomes)
 *  land in the same places every time. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Scatter `count` points in `box` where `free` allows, at least `gap` apart. */
export function scatter(count: number, box: { x: number; y: number; w: number; h: number }, free: (p: Pt) => boolean, gap: number, seed: number): Pt[] {
  const rand = seeded(seed)
  const out: Pt[] = []
  for (let tries = 0; tries < count * 200 && out.length < count; tries++) {
    const p: Pt = [box.x + rand() * box.w, box.y + rand() * box.h]
    if (!free(p)) continue
    if (out.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < gap)) continue
    out.push([r1(p[0]), r1(p[1])])
  }
  return out
}
