// The object in the after cylinder, and where it goes. It's drawn plausibly
// sized rather than to scale (the cylinders are drawn taller and narrower
// than real glass, so a true-volume object wouldn't fit): its drawn area
// grows with the displaced volume, and it always rests on the bottom, inside
// the tube and under the water.

export const OBJECTS = ['marbles', 'rock', 'cube', 'cylinder'] as const
export type ObjectKind = (typeof OBJECTS)[number]

export const OBJECT_NAMES: Record<ObjectKind, string> = { marbles: 'Marbles', rock: 'Rock', cube: 'Cube', cylinder: 'Metal cylinder' }

export const MARBLE_COUNTS = [1, 2, 3, 4, 5] as const

/** The object in a sentence: "a marble", "3 marbles", "a rock", "a metal cylinder". */
export const objectName = (kind: ObjectKind, marbles: number) =>
  kind === 'marbles' ? (marbles === 1 ? 'a marble' : `${marbles} marbles`) : `a ${OBJECT_NAMES[kind].toLowerCase()}`

/** The space the object may fill, in drawing units: the inside of the tube
 *  from the bottom up to just under the water's surface. */
export interface Room {
  left: number
  right: number
  top: number
  bottom: number
}

export interface Circle {
  x: number
  y: number
  r: number
}

export type Placed =
  | { kind: 'marbles'; marbles: Circle[] }
  /** the box the rock's outline fills */
  | { kind: 'rock'; x: number; y: number; w: number; h: number }
  /** the top left corner and side. Seen level with the bottom it rests
   *  on, as the pans and the cylinder's base are, and turned a little: a
   *  face `front` wide with a darker face `side` wide beside it, their top
   *  and bottom edges level. */
  | { kind: 'cube'; x: number; y: number; a: number; front: number; side: number }
  /** the box it fills, standing on end: `d` across and `h` high. Seen
   *  level with the bottom it rests on, like the cube, so its top and bottom
   *  edges are straight and its whole base sits on the pan or the glass. */
  | { kind: 'cylinder'; x: number; y: number; d: number; h: number }

/** Drawn area per unit of tube width times the height the water rose, which
 *  makes the classic 2 marbles in 2 mL of a 10 mL cylinder about as wide as
 *  the tube, like the pictures teachers use. */
export const AREA_PER_RISE = 0.5

/** a rock's width over its height, lying down */
export const ROCK_ASPECT = 1.5
/** a rock's height over its width, at most, standing up */
const ROCK_TALLEST = 1.8
/** a rock's outline covers this share of its box */
export const ROCK_FILL = 0.78
/** how far a cube is turned from facing straight out */
const CUBE_TURN = (25 * Math.PI) / 180
const CUBE_FRONT = Math.cos(CUBE_TURN)
const CUBE_SIDE = Math.sin(CUBE_TURN)
/** The area a cube with side `a` covers: its two faces. */
export const cubeArea = (a: number) => a ** 2 * (CUBE_FRONT + CUBE_SIDE)
/** a metal cylinder's height over its width, like the slugs in a density kit */
export const CYLINDER_ASPECT = 2
/** its height over its width, at most, once it's as wide as the tube */
const CYLINDER_LONGEST = 3.5
/** how round its machined edges are, over its width: enough to sit in the
 *  rounded bottom of the glass */
export const CYLINDER_EDGE = 0.1
/** What its rounded edges take off its box, over its width squared */
const CYLINDER_ROUNDING = (4 - Math.PI) * CYLINDER_EDGE ** 2
/** The area a cylinder `d` wide and `h` high covers: its box less the
 *  rounded corners. */
export const cylinderArea = (d: number, h: number) => d * h - CYLINDER_ROUNDING * d ** 2

/** Where `kind` goes in `room` when drawn with about `area` square units. */
export function placeObject(kind: ObjectKind, count: number, room: Room, area: number): Placed {
  const W = room.right - room.left
  const H = Math.max(0, room.bottom - room.top)
  const cx = (room.left + room.right) / 2
  // The largest a shape of natural size w × h may be drawn at.
  const fit = (w: number, h: number) => Math.min(1, W / w, H / h)

  if (kind === 'marbles') {
    const n = Math.max(1, Math.round(count))
    const wanted = Math.sqrt((4 * area) / (n * Math.PI))
    // The biggest marbles that fit in any number of columns.
    let biggest = 0
    for (let cols = 1; cols <= n; cols++) biggest = Math.max(biggest, Math.min(W / cols, H / Math.ceil(n / cols)))
    const d = Math.min(wanted, biggest)
    const cols = Math.max(1, Math.min(n, Math.floor(W / d + 1e-9)))
    const marbles: Circle[] = []
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols)
      const inRow = Math.min(cols, n - row * cols)
      const col = i % cols
      marbles.push({ x: cx + (col - (inRow - 1) / 2) * d, y: room.bottom - d / 2 - row * d, r: d / 2 })
    }
    return { kind, marbles }
  }

  if (kind === 'rock') {
    // Lying wide, until it's as wide as the tube; then it stands taller, as
    // a long rock would have to, but no taller than the water.
    const w = Math.min(W, Math.sqrt((area * ROCK_ASPECT) / ROCK_FILL))
    const h = Math.min(H, ROCK_TALLEST * w, area / (ROCK_FILL * w))
    return { kind, x: cx - w / 2, y: room.bottom - h, w, h }
  }

  if (kind === 'cylinder') {
    // Standing on end at its usual shape, until it's as wide as the tube;
    // then longer, as a thinner slug of the same metal would be. Too tall
    // for the water, it's drawn smaller all over.
    const d0 = Math.min(W, Math.sqrt(area / cylinderArea(1, CYLINDER_ASPECT)))
    const h0 = Math.min(CYLINDER_LONGEST * d0, area / d0 + CYLINDER_ROUNDING * d0)
    const k = fit(d0, h0)
    const [d, h] = [d0 * k, h0 * k]
    return { kind, x: cx - d / 2, y: room.bottom - h, d, h }
  }

  const a0 = Math.sqrt(area / cubeArea(1))
  const a = a0 * fit(a0 * (CUBE_FRONT + CUBE_SIDE), a0)
  const [front, side] = [a * CUBE_FRONT, a * CUBE_SIDE]
  return { kind, x: cx - (front + side) / 2, y: room.bottom - a, a, front, side }
}

/** The box a placed object fills. */
export function objectBounds(p: Placed): Room {
  if (p.kind === 'marbles') {
    return {
      left: Math.min(...p.marbles.map((m) => m.x - m.r)),
      right: Math.max(...p.marbles.map((m) => m.x + m.r)),
      top: Math.min(...p.marbles.map((m) => m.y - m.r)),
      bottom: Math.max(...p.marbles.map((m) => m.y + m.r)),
    }
  }
  if (p.kind === 'rock') return { left: p.x, right: p.x + p.w, top: p.y, bottom: p.y + p.h }
  if (p.kind === 'cylinder') return { left: p.x, right: p.x + p.d, top: p.y, bottom: p.y + p.h }
  return { left: p.x, right: p.x + p.front + p.side, top: p.y, bottom: p.y + p.a }
}

/** The area a placed object covers, to compare with the area asked for. */
export function drawnArea(p: Placed) {
  if (p.kind === 'marbles') return p.marbles.reduce((sum, m) => sum + Math.PI * m.r ** 2, 0)
  if (p.kind === 'rock') return ROCK_FILL * p.w * p.h
  if (p.kind === 'cylinder') return cylinderArea(p.d, p.h)
  return cubeArea(p.a)
}

// A lumpy outline around its box, as fractions of it from the top left,
// going clockwise, with a flatter bottom where it rests.
const ROCK_OUTLINE: [number, number][] = [
  [0.3, 0.06], [0.55, 0], [0.8, 0.12], [0.97, 0.38], [1, 0.66], [0.9, 0.93],
  [0.62, 1], [0.3, 0.99], [0.07, 0.88], [0, 0.6], [0.1, 0.3],
]

/** The rock's outline: straight-ish between lumps, rounded at them. */
export function rockPath({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const pts = ROCK_OUTLINE.map(([u, v]) => [x + u * w, y + v * h])
  const mid = (i: number) => {
    const [a, b] = [pts[i % pts.length], pts[(i + 1) % pts.length]]
    return `${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}`
  }
  let d = `M ${mid(0)}`
  for (let i = 1; i <= pts.length; i++) {
    const [px, py] = pts[i % pts.length]
    d += ` Q ${px} ${py} ${mid(i)}`
  }
  return `${d} Z`
}
