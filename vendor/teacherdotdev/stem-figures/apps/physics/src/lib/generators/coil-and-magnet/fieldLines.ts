// The bar magnet's field lines. Each loop is chosen by how high it passes over
// the middle of the magnet, evenly spaced up to the top of the figure, and the
// bottom half is the top half reflected, so the loops nest evenly and never
// cross (see $lib/shared/field). Two more lines run along the magnet's axis,
// straight out of the north face and into the south face. Loops keep their
// shape wherever the magnet is, so they are traced once per count, around a
// magnet at the origin, and moved.

import { arrowAlong, poleFaceField, traceLine, traceThrough, type Field, type Point } from '$lib/shared/field'

export interface FieldLine {
  /** Around the magnet, along its axis, or the coil's own: through it, and around outside. */
  kind: 'loop' | 'axis' | 'inside' | 'outside'
  points: Point[]
  arrow: { x: number; y: number; angle: number } | null
}

const cache = new Map<string, Point[][]>()

/** Lines around a magnet `length` × `height` with its north end at x = length and its middle at y = 0. */
function linesNorthRight(length: number, height: number, count: number, reach: number): Point[][] {
  const key = `${length},${height},${count},${reach}`
  const hit = cache.get(key)
  if (hit) return hit
  const field = poleFaceField([
    { x: length, y0: -height / 2, y1: height / 2, q: 1 },
    { x: 0, y0: -height / 2, y1: height / 2, q: -1 },
  ])
  const inside = (p: Point) => p.x > -0.5 && p.x < length + 0.5 && p.y > -height / 2 - 0.5 && p.y < height / 2 + 0.5
  const bounds = { left: -length * 4, right: length * 5, top: -reach * 3, bottom: reach * 3 }
  const top = Array.from({ length: count }, (_, k) => {
    const d = (reach * (k + 1)) / count
    return traceThrough(field, { x: length / 2, y: -height / 2 - d }, { stop: inside, bounds })
  })
  const lines = [...top, ...top.map((line) => line.map((p) => ({ x: p.x, y: -p.y })))]
  cache.set(key, lines)
  return lines
}

interface MagnetBox {
  x: number
  y: number
  length: number
  height: number
  /** The pole at the right-hand end (the one nearer the coil). */
  near: 'N' | 'S'
}

/** How far past the magnet the axis lines run (the figure clips them), and where their arrowheads go. */
const AXIS_LENGTH = 700
const AXIS_ARROW = 48

/** The magnet's field lines in figure coordinates, `reach` being how far above the magnet the outermost loop passes. */
export function magnetFieldLines(m: MagnetBox, count: number, reach: number): FieldLine[] {
  const local = linesNorthRight(m.length, m.height, count, reach)
  const cy = m.y + m.height / 2
  const loops: FieldLine[] = local.map((line) => {
    // With south at the right-hand end, the lines are the same, reflected end to end.
    const points = line.map((p) => ({ x: m.x + (m.near === 'N' ? p.x : m.length - p.x), y: cy + p.y }))
    return { kind: 'loop', points, arrow: arrowAlong(points) }
  })
  const northX = m.near === 'N' ? m.x + m.length : m.x
  const southX = m.near === 'N' ? m.x : m.x + m.length
  const out = Math.sign(northX - southX) // the way out of the north face
  const axis: FieldLine[] = [
    {
      kind: 'axis',
      points: [{ x: northX, y: cy }, { x: northX + out * AXIS_LENGTH, y: cy }],
      arrow: { x: northX + out * AXIS_ARROW, y: cy, angle: out > 0 ? 0 : 180 },
    },
    {
      kind: 'axis',
      points: [{ x: southX - out * AXIS_LENGTH, y: cy }, { x: southX, y: cy }],
      arrow: { x: southX - out * (AXIS_ARROW - 12), y: cy, angle: out > 0 ? 0 : 180 },
    },
  ]
  return [...loops, ...axis]
}

/** A point `distance` along a line, and which way the line points there. */
function arrowAt(points: Point[], distance: number): FieldLine['arrow'] {
  let walked = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    walked += Math.hypot(b.x - a.x, b.y - a.y)
    if (walked >= distance) return { x: b.x, y: b.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
  }
  return arrowAlong(points)
}

const coilCache = new Map<string, FieldLine[]>()
/** How far outside an end each outside line starts, clear of the end's own sampled points. */
const START = 3

/**
 * The coil's own field lines, for a coil from x = 0 to `length` around y = 0
 * with its north end on the right. Outside, a coil carrying a current has the
 * field of a bar magnet whose ends are the coil's ends; inside, its lines run
 * straight along it from the south end to the north end. Each line starts
 * inside, evenly spaced across the coil, and is traced on round the outside:
 * lines near the wall loop back close by, lines near the middle run off the
 * figure, the way textbooks draw a solenoid.
 */
function coilLinesNorthRight(length: number, r: number, count: number): FieldLine[] {
  const key = `${length},${r},${count}`
  const hit = coilCache.get(key)
  if (hit) return hit
  const field: Field = poleFaceField(
    [
      { x: length, y0: -r, y1: r, q: 1 },
      { x: 0, y0: -r, y1: r, q: -1 },
    ],
    7,
    true,
  )
  const inCoil = (p: Point) => p.x > -0.5 && p.x < length + 0.5 && Math.abs(p.y) < r
  const bounds = { left: -1500, right: 1500 + length, top: -1500, bottom: 1500 }
  const n = count * 2
  const lines: FieldLine[] = []
  for (let j = 0; j < n; j++) {
    const y = ((j + 0.5) / n - 0.5) * 2 * r * 0.84
    const out = traceLine(field, { x: length + START, y }, { stop: inCoil, bounds })
    const end = out.at(-1)!
    if (inCoil(end)) {
      // Back round into the coil: one closed loop. A line near the wall curls
      // round the wire and comes back in through the side, not the south end,
      // so the inside part runs from wherever it came back in.
      const from = end.x < 1 ? { x: 0, y } : end
      lines.push({ kind: 'inside', points: [from, { x: length, y }], arrow: insideArrow(from, { x: length, y }) })
      lines.push({ kind: 'outside', points: out, arrow: arrowAlong(out) })
    } else {
      lines.push({ kind: 'inside', points: [{ x: 0, y }, { x: length, y }], arrow: insideArrow({ x: 0, y }, { x: length, y }) })
      // Off the figure; the line coming back into the south end is its own piece.
      lines.push({ kind: 'outside', points: out, arrow: arrowAt(out, 60) })
      const back = traceLine((px, py) => {
        const [bx, by] = field(px, py)
        return [-bx, -by]
      }, { x: -START, y }, { stop: inCoil, bounds }).reverse()
      lines.push({ kind: 'outside', points: back, arrow: arrowAt(back, Math.max(0, lengthOf(back) - 60)) })
    }
  }
  coilCache.set(key, lines)
  return lines
}

/** An arrowhead partway along a line inside the coil, toward its north end. */
function insideArrow(a: Point, b: Point): FieldLine['arrow'] {
  return { x: a.x + (b.x - a.x) * 0.62, y: a.y + (b.y - a.y) * 0.62, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
}

const lengthOf = (points: Point[]) => points.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0), 0)

/** The coil's own field lines in figure coordinates. A one-turn coil is treated as a short one, so it still has two ends. */
export function coilFieldLines(coil: { left: number; right: number; cy: number; r: number }, count: number, northRight: boolean): FieldLine[] {
  const length = Math.max(coil.right - coil.left, 26)
  const left = (coil.left + coil.right) / 2 - length / 2
  return coilLinesNorthRight(length, coil.r, count).map((line) => {
    const place = (p: Point) => ({ x: left + (northRight ? p.x : length - p.x), y: coil.cy + p.y })
    const arrow = line.arrow && { ...place(line.arrow), angle: northRight ? line.arrow.angle : 180 - line.arrow.angle }
    return { kind: line.kind, points: line.points.map(place), arrow }
  })
}
