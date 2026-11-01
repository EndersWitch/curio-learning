// Magnetic field lines that follow the real shape of the field, so they curve
// the way they should and never cross.
//
// A uniformly magnetized bar magnet's field is the same as if its two end
// faces carried magnetic "charge", + on the north face and − on the south.
// Each face is sampled as a row of point sources whose field falls off as
// 1/r² (the magnet is a real 3D object; the figure is a slice through its
// axis). A coil carrying a current has the same field outside it, so it can
// use the same faces at its ends.

export interface Point {
  x: number
  y: number
}

export type Field = (x: number, y: number) => [number, number]

/** An end face: a vertical segment at x from y0 to y1, with charge +1 (north) or −1 (south). */
export interface Face {
  x: number
  y0: number
  y1: number
  q: number
}

/**
 * The field of charged end faces. A bar magnet's face is sampled along its
 * height; a coil's end is round, so with `disc` each face is a disc (seen
 * edge-on as the segment y0–y1), sampled in rings, which matters for a short
 * coil or a single loop.
 */
export function poleFaceField(faces: Face[], samples = 9, disc = false): Field {
  const sources = faces.flatMap((f) => (disc ? discSources(f, samples) : stripSources(f, samples)))
  return (x, y) => {
    let bx = 0
    let by = 0
    for (const s of sources) {
      const dx = x - s.x
      const dy = y - s.y
      const r2 = dx * dx + dy * dy + s.z * s.z + 1e-6
      const k = s.q / (r2 * Math.sqrt(r2))
      bx += k * dx
      by += k * dy
    }
    return [bx, by]
  }
}

interface Source {
  x: number
  y: number
  z: number
  q: number
}

const stripSources = (f: Face, samples: number): Source[] =>
  Array.from({ length: samples }, (_, i) => ({ x: f.x, y: f.y0 + ((i + 0.5) / samples) * (f.y1 - f.y0), z: 0, q: f.q / samples }))

/** Rings across a disc, with more points on the bigger rings so each point stands for the same area. */
function discSources(f: Face, rings: number): Source[] {
  const cy = (f.y0 + f.y1) / 2
  const radius = Math.abs(f.y1 - f.y0) / 2
  const points: { y: number; z: number }[] = []
  for (let i = 0; i < rings; i++) {
    const rho = ((i + 0.5) / rings) * radius
    const around = Math.max(6, Math.round(6 * (i + 0.5) * 2))
    for (let j = 0; j < around; j++) {
      const phi = ((j + 0.5) / around) * 2 * Math.PI
      points.push({ y: cy + rho * Math.cos(phi), z: rho * Math.sin(phi) })
    }
  }
  // Weight each ring's points by the ring's share of the area.
  return points.map((p) => ({ x: f.x, y: p.y, z: p.z, q: f.q / points.length }))
}

interface TraceOptions {
  /** Stop when the line reaches this (like the south face). */
  stop: (p: Point) => boolean
  /** Stop when the line leaves this box. */
  bounds: { left: number; right: number; top: number; bottom: number }
  step?: number
  maxSteps?: number
}

/** Follow the field from `start`, a small step at a time (fourth-order Runge–Kutta). */
export function traceLine(field: Field, start: Point, { stop, bounds, step = 2.5, maxSteps = 4000 }: TraceOptions): Point[] {
  const dir = (x: number, y: number): [number, number] => {
    const [bx, by] = field(x, y)
    const len = Math.hypot(bx, by) || 1
    return [bx / len, by / len]
  }
  const points: Point[] = [start]
  let { x, y } = start
  for (let i = 0; i < maxSteps; i++) {
    const [k1x, k1y] = dir(x, y)
    const [k2x, k2y] = dir(x + (step / 2) * k1x, y + (step / 2) * k1y)
    const [k3x, k3y] = dir(x + (step / 2) * k2x, y + (step / 2) * k2y)
    const [k4x, k4y] = dir(x + step * k3x, y + step * k3y)
    x += (step / 6) * (k1x + 2 * k2x + 2 * k3x + k4x)
    y += (step / 6) * (k1y + 2 * k2y + 2 * k3y + k4y)
    points.push({ x, y })
    if (stop({ x, y })) break
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) break
  }
  return points
}

/**
 * The whole field line through `through`, from where it leaves a north face
 * to where it reaches a south face: traced backward and forward from there.
 * Choosing lines by where they pass (say, how high above a magnet's middle)
 * gives evenly nested loops, the way textbooks draw them.
 */
export function traceThrough(field: Field, through: Point, options: TraceOptions): Point[] {
  const back = traceLine((x, y) => {
    const [bx, by] = field(x, y)
    return [-bx, -by]
  }, through, options)
  const ahead = traceLine(field, through, options)
  return [...back.reverse(), ...ahead.slice(1)]
}

/** A traced line as an SVG path, keeping every few points (it is smooth anyway). */
export function linePath(points: Point[], every = 3): string {
  const kept = points.filter((_, i) => i % every === 0 || i === points.length - 1)
  return kept.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`).join('')
}

/** Where to put a line's arrowhead: partway along it by length, and which way it points there (in degrees). */
export function arrowAlong(points: Point[], fraction = 0.5): { x: number; y: number; angle: number } | null {
  if (points.length < 3) return null
  const lengths = [0]
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  const target = lengths.at(-1)! * fraction
  const i = Math.max(1, lengths.findIndex((l) => l >= target))
  const a = points[i - 1]
  const b = points[i]
  return { x: b.x, y: b.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const o = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0
}

/** Do two traced lines cross anywhere? (For tests.) */
export function crosses(p: Point[], q: Point[]): boolean {
  for (let i = 1; i < p.length; i++) for (let j = 1; j < q.length; j++) if (segmentsCross(p[i - 1], p[i], q[j - 1], q[j])) return true
  return false
}
