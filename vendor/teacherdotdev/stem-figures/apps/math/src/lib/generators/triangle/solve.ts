// Works out a whole triangle from the measures the teacher gives: any three of
// its three angles and three sides, as long as they make a triangle (SSS, SAS,
// ASA, AAS, SSA, or only angles, which fix its shape but not its size).
//
// Vertices are always A, B and C here, whatever the teacher names them; sides
// are AB, BC and CA. `names` only changes how the messages read.

export type Vertex = 'A' | 'B' | 'C'
export type Side = 'AB' | 'BC' | 'CA'
/** An angle (named by its vertex) or a side: anything with a measure. */
export type Part = Vertex | Side

export const ANGLES: Vertex[] = ['A', 'B', 'C']
export const SIDES: Side[] = ['AB', 'BC', 'CA']
/** The side across from each vertex, and the vertex across from each side. */
export const OPPOSITE = { A: 'BC', B: 'CA', C: 'AB', AB: 'C', BC: 'A', CA: 'B' } as const

/** A whole triangle: its angles in degrees and its side lengths. `sized` is false when no side was given. */
export type Solved = { angles: Record<Vertex, number>; sides: Record<Side, number>; sized: boolean; ambiguous: boolean; problem: null }
/** Why the measures don't make a triangle, and the measure to fix when there's one to blame. */
export type Unsolved = { problem: string; field: Part | null }

// How far given measures can be off and still agree, since teachers type rounded values.
const ANGLE_SLACK = 0.5 // degrees
const SIDE_SLACK = 0.01 // 1% of the side
const UNSIZED = 10 // the longest side, when no side is given

const RAD = Math.PI / 180
const sin = (d: number) => Math.sin(d * RAD)
const cos = (d: number) => Math.cos(d * RAD)
const acos = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) / RAD
const asin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) / RAD

/** A number for a message: at most two decimals, a true minus sign. */
const show = (v: number) => String(Number(v.toFixed(2))).replace('-', '−')

/** The side between two vertices, whichever way round it's asked for. */
export const sideOf = (u: Vertex, v: Vertex): Side => SIDES.find((s) => s.includes(u) && s.includes(v))!

/**
 * @param given  angles in degrees (A, B, C) and lengths (AB, BC, CA); null when not given
 * @param options
 *   other: in the ambiguous case (two sides and an angle not between them), draw the second triangle
 */
export function solveTriangle(
  given: Record<Part, number | null>,
  { other = false, names = {} }: { other?: boolean; names?: Partial<Record<Vertex, string>> } = {},
): Solved | Unsolved {
  const n = (v: Vertex) => names[v] || v
  const sideName = (s: Side) => `${n(s[0] as Vertex)}${n(s[1] as Vertex)}`
  const angleName = (v: Vertex) => `∠${n(v)}`
  const fail = (problem: string, field: Part | null = null): Unsolved => ({ problem, field })

  for (const v of ANGLES) {
    if (given[v] != null && !(given[v]! > 0 && given[v]! < 180)) return fail(`${angleName(v)} has to be between 0° and 180°.`, v)
  }
  for (const s of SIDES) {
    if (given[s] != null && !(given[s]! > 0)) return fail(`${sideName(s)} has to be longer than 0.`, s)
  }

  const angs = ANGLES.filter((v) => given[v] != null)
  const sides = SIDES.filter((s) => given[s] != null)
  const count = angs.length + sides.length
  if (angs.length < 2 && count < 3) {
    const more = 3 - count
    return fail(`Give ${more === 1 ? 'one more measure' : `${more} more measures`} to draw the triangle.`)
  }

  let angles: Record<Vertex, number>
  let sized = true
  let ambiguous = false

  if (angs.length >= 2) {
    // Two angles fix the third, and then any one side fixes the size.
    const sum = angs.reduce((t, v) => t + given[v]!, 0)
    if (angs.length === 3) {
      if (Math.abs(sum - 180) > ANGLE_SLACK) return fail(`${ANGLES.map(angleName).join(' + ')} is ${show(sum)}°, not 180°.`, angs.at(-1))
      angles = Object.fromEntries(ANGLES.map((v) => [v, (given[v]! * 180) / sum])) as Record<Vertex, number>
    } else {
      const missing = ANGLES.find((v) => !angs.includes(v))!
      if (sum >= 180) return fail(`${angs.map(angleName).join(' + ')} is already ${show(sum)}°, and a triangle's angles add up to 180°.`, angs[1])
      angles = { ...Object.fromEntries(angs.map((v) => [v, given[v]])), [missing]: 180 - sum } as Record<Vertex, number>
    }
    if (!sides.length) sized = false
  } else if (sides.length === 3) {
    const bad = inequality(given as Record<Side, number>, sideName)
    if (bad) return fail(bad, 'CA')
    angles = fromSides(given as Record<Side, number>)
  } else {
    // One angle and two sides: between them (SAS), or not (SSA).
    const v = angs[0]
    const across = OPPOSITE[v]
    if (given[across] == null) {
      const [p, q] = sides.map((s) => given[s]!)
      const a = Math.sqrt(p * p + q * q - 2 * p * q * cos(given[v]!))
      angles = fromSides({ ...given, [across]: a } as Record<Side, number>)
    } else {
      // The side across from v is given, and so is one next to it, b. The angle
      // across from b is w: sin w = b sin v / a, which may have two answers.
      const a = given[across]!
      const bSide = sides.find((s) => s !== across)!
      const b = given[bSide]!
      const w = OPPOSITE[bSide]
      const u = ANGLES.find((x) => x !== v && x !== w)!
      const reach = b * sin(given[v]!)
      if (given[v]! >= 90 && a <= b * (1 + 1e-9)) {
        return fail(`${sideName(across)} has to be the longest side, since ${angleName(v)} is ${given[v]! > 90 ? 'obtuse' : 'right'}.`, across)
      }
      if (a < reach * (1 - 1e-9)) {
        return fail(`${sideName(across)} is too short to close the triangle: with these measures it has to be at least ${show(reach)}.`, across)
      }
      const w1 = asin(reach / a)
      const w2 = 180 - w1
      ambiguous = a < b * (1 - 1e-9) && reach < a * (1 - 1e-9) && given[v]! + w2 < 180
      const wAngle = ambiguous && other ? w2 : w1
      angles = { [v]: given[v], [w]: wAngle, [u]: 180 - given[v]! - wAngle } as Record<Vertex, number>
    }
  }

  // Sides from the angles by the law of sines, scaled to a given side.
  const first = sides[0]
  const k = first ? given[first]! / sin(angles[OPPOSITE[first]]) : UNSIZED / Math.max(...ANGLES.map((v) => sin(angles[v])))
  const lengths = Object.fromEntries(SIDES.map((s) => [s, k * sin(angles[OPPOSITE[s]])])) as Record<Side, number>

  // Every given measure has to agree with the triangle they make.
  for (const s of sides) {
    if (Math.abs(lengths[s] - given[s]!) > SIDE_SLACK * given[s]!) {
      return fail(`With the other measures, ${sideName(s)} would be ${show(lengths[s])}, not ${show(given[s]!)}.`, s)
    }
  }
  if (angs.length < 3) {
    for (const v of angs) {
      if (Math.abs(angles[v] - given[v]!) > ANGLE_SLACK) {
        return fail(`With the other measures, ${angleName(v)} would be ${show(angles[v])}°, not ${show(given[v]!)}°.`, v)
      }
    }
  }

  return { angles, sides: lengths, sized, ambiguous, problem: null }
}

/** Angles from three sides, by the law of cosines. */
function fromSides(s: Record<Side, number>): Record<Vertex, number> {
  const len = { A: s.BC, B: s.CA, C: s.AB }
  const at = (v: Vertex) => {
    const [p, q] = ANGLES.filter((x) => x !== v).map((x) => len[x])
    return acos((p * p + q * q - len[v] * len[v]) / (2 * p * q))
  }
  return { A: at('A'), B: at('B'), C: at('C') }
}

/** Why three sides can't meet, or null when they can. */
function inequality(s: Record<Side, number>, sideName: (s: Side) => string): string | null {
  const [short1, short2, long] = [...SIDES].sort((x, y) => s[x] - s[y])
  if (s[short1] + s[short2] > s[long] * (1 + 1e-9)) return null
  return `These sides can't make a triangle: ${sideName(short1)} + ${sideName(short2)} has to be longer than ${sideName(long)}.`
}
