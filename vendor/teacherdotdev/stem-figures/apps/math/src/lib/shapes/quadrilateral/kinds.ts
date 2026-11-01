// The kinds of quadrilateral the generators draw, and how each one's corners
// follow from the measures the teacher gives for it. Each generator draws a
// family of them (see family.ts).
//
// Corners are always A, B, C and D here, in order counterclockwise, whatever
// the teacher names them; sides are AB, BC, CD and DA. Most kinds stand on
// AB, with A at the bottom left: a trapezoid's bases are AB (bottom) and CD
// (top). A kite stands upright on its line of symmetry instead, with B at the
// top and D at the bottom, its short sides AB and BC and long sides CD and DA.

export type Corner = 'A' | 'B' | 'C' | 'D'
export type Side = 'AB' | 'BC' | 'CD' | 'DA'
/** Anything the teacher can give: an angle (named by its corner), a side, or a trapezoid's height. */
export type Measure = Corner | Side | 'h'
/** A point in the quadrilateral's own coordinates, y up. */
export type Point = [number, number]

export const CORNERS: Corner[] = ['A', 'B', 'C', 'D']
export const SIDES: Side[] = ['AB', 'BC', 'CD', 'DA']
export const isAngle = (m: Measure): m is Corner => (CORNERS as string[]).includes(m)

export type KindId =
  | 'square' | 'rectangle' | 'parallelogram' | 'rhombus'
  | 'trapezoid' | 'isosceles-trapezoid' | 'right-trapezoid' | 'kite'

/** Why a kind's measures don't make its quadrilateral, and the measure to fix when there's one to blame. */
export type Problem = { problem: string; field: Measure | null }

type Kind = {
  id: KindId
  name: string
  /** The measures the teacher gives, and the numbers it starts with. */
  givens: Measure[]
  sample: Partial<Record<Measure, string>>
  /** Sides the kind makes the same length as a given one. */
  equal?: Partial<Record<Side, Side>>
  /** One line on what the kind is, for the settings panel. */
  about: string
  corners: (g: Record<Measure, number>, name: (m: Measure) => string) => Record<Corner, Point> | Problem
}

const RAD = Math.PI / 180
const show = (v: number) => String(Number(v.toFixed(2)))

const onBase = (w: number, h: number, dl: number, dr: number): Record<Corner, Point> => ({ A: [0, 0], B: [w, 0], C: [w - dr, h], D: [dl, h] })
const slanted = (a: number, b: number, angle: number): Record<Corner, Point> => {
  const D: Point = [b * Math.cos(angle * RAD), b * Math.sin(angle * RAD)]
  return { A: [0, 0], B: [a, 0], C: [D[0] + a, D[1]], D }
}
const unequalBases = (g: Record<Measure, number>, name: (m: Measure) => string, same: string): Problem | null =>
  Math.abs(g.AB - g.CD) < 1e-9 ? { problem: `With bases the same length, this is ${same}. Make ${name('AB')} and ${name('CD')} different lengths.`, field: 'CD' } : null

export const KINDS: Kind[] = [
  {
    id: 'square', name: 'Square', givens: ['AB'], sample: { AB: '6' }, equal: { BC: 'AB', CD: 'AB', DA: 'AB' },
    about: 'Four equal sides and four right angles.',
    corners: (g) => ({ A: [0, 0], B: [g.AB, 0], C: [g.AB, g.AB], D: [0, g.AB] }),
  },
  {
    id: 'rectangle', name: 'Rectangle', givens: ['AB', 'BC'], sample: { AB: '10', BC: '6' }, equal: { CD: 'AB', DA: 'BC' },
    about: 'Four right angles, with opposite sides equal.',
    corners: (g) => onBase(g.AB, g.BC, 0, 0),
  },
  {
    id: 'parallelogram', name: 'Parallelogram', givens: ['AB', 'DA', 'A'], sample: { AB: '10', DA: '6', A: '60' }, equal: { CD: 'AB', BC: 'DA' },
    about: 'Both pairs of opposite sides parallel.',
    corners: (g) => slanted(g.AB, g.DA, g.A),
  },
  {
    id: 'rhombus', name: 'Rhombus', givens: ['AB', 'A'], sample: { AB: '8', A: '60' }, equal: { BC: 'AB', CD: 'AB', DA: 'AB' },
    about: 'Four equal sides.',
    corners: (g) => slanted(g.AB, g.AB, g.A),
  },
  {
    id: 'trapezoid', name: 'Trapezoid', givens: ['AB', 'CD', 'h', 'A'], sample: { AB: '12', CD: '7', h: '5', A: '65' },
    about: 'Bases AB and CD parallel, legs any length. ∠A sets how far the top leans.',
    corners: (g, name) => unequalBases(g, name, 'a parallelogram') ?? onBase(g.AB, g.h, g.h / Math.tan(g.A * RAD), g.AB - g.CD - g.h / Math.tan(g.A * RAD)),
  },
  {
    id: 'isosceles-trapezoid', name: 'Isosceles trapezoid', givens: ['AB', 'CD', 'h'], sample: { AB: '12', CD: '6', h: '5' },
    about: 'Bases AB and CD parallel, with equal legs.',
    corners: (g, name) => unequalBases(g, name, 'a rectangle') ?? onBase(g.AB, g.h, (g.AB - g.CD) / 2, (g.AB - g.CD) / 2),
  },
  {
    id: 'right-trapezoid', name: 'Right trapezoid', givens: ['AB', 'CD', 'DA'], sample: { AB: '12', CD: '7', DA: '5' },
    about: 'Bases AB and CD parallel, with leg DA at right angles to both.',
    corners: (g, name) => unequalBases(g, name, 'a rectangle') ?? onBase(g.AB, g.DA, 0, g.AB - g.CD),
  },
  {
    id: 'kite', name: 'Kite', givens: ['AB', 'DA', 'B'], sample: { AB: '5', DA: '9', B: '100' }, equal: { BC: 'AB', CD: 'DA' },
    about: 'Two pairs of equal sides next to each other: AB = BC and CD = DA.',
    corners: (g, name) => {
      const half = (g.B / 2) * RAD
      const [w, drop] = [g.AB * Math.sin(half), g.AB * Math.cos(half)]
      if (g.DA <= w + 1e-9) return { problem: `${name('DA')} is too short to reach: with these measures it has to be longer than ${show(w)}.`, field: 'DA' }
      return { A: [w, -drop], B: [0, 0], C: [-w, -drop], D: [0, -drop - Math.sqrt(g.DA ** 2 - w ** 2)] }
    },
  },
]

export const kindOf = (id: string) => KINDS.find((k) => k.id === id) ?? KINDS[0]

/** Does the quadrilateral bulge outward at every corner, going counterclockwise? */
export function convex(p: Record<Corner, Point>): boolean {
  return CORNERS.every((v, i) => {
    const [a, b, c] = [p[v], p[CORNERS[(i + 1) % 4]], p[CORNERS[(i + 2) % 4]]]
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) > 1e-9
  })
}

/** Each corner's angle in degrees, and each side's length. */
export function measure(p: Record<Corner, Point>) {
  const angles = {} as Record<Corner, number>
  const sides = {} as Record<Side, number>
  CORNERS.forEach((v, i) => {
    const [prev, next] = [p[CORNERS[(i + 3) % 4]], p[CORNERS[(i + 1) % 4]]]
    const u = [prev[0] - p[v][0], prev[1] - p[v][1]]
    const w = [next[0] - p[v][0], next[1] - p[v][1]]
    angles[v] = Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))))) / RAD
    sides[SIDES[i]] = Math.hypot(next[0] - p[v][0], next[1] - p[v][1])
  })
  return { angles, sides }
}
