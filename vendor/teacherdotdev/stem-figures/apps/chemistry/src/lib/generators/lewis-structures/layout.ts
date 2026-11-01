// Where a structure's atoms and electrons go. Directions are angles in
// degrees, clockwise from pointing right, since y points down: 90 is down
// and 270 is up.
//
// A built structure's outer atoms go around its central atom: on its four
// sides when flat, as most textbooks draw them, or hinting at the molecule's
// real shape when shaped (see CONTEXT.md "Shape"), with like atoms side by
// side (CH₂Cl₂'s Cl atoms next to each other, not opposite). Lone electrons then go
// on the free sides of each symbol, or into the widest gaps around it,
// whatever the structure, so a changed or impossible one still draws cleanly.
// An atom on its own has its electrons one to a side, then paired.

import { octetOf } from './elements'
import type { Structure } from './structure'

export const SHAPES = ['flat', 'shaped'] as const
export type Shape = (typeof SHAPES)[number]

/** Directions of the outer atoms around a flat central atom, in the order
 *  they're written, before like atoms are put side by side. Past four they
 *  go evenly around, starting at the top. */
function flatDirections(outers: number): number[] {
  if (outers === 2) return [180, 0]
  if (outers === 3) return [180, 0, 90]
  if (outers === 4) return [180, 0, 270, 90]
  return Array.from({ length: outers }, (_, i) => 270 + (360 / outers) * i)
}

/** Directions for a shaped central atom, by how many atoms it bonds to and
 *  how many electron groups it has in all (atoms and lone pairs). */
const SHAPED: Record<string, number[]> = {
  '2,2': [180, 0], // linear
  '2,3': [150, 30], // bent, 120°
  '2,4': [142.25, 37.75], // bent, 104.5°
  '2,5': [180, 0], // linear
  '3,3': [270, 150, 30], // trigonal planar
  '3,4': [145, 35, 90], // trigonal pyramidal, spread below
  '3,5': [270, 90, 180], // T-shaped
  '4,4': [180, 0, 270, 90], // tetrahedral, drawn flat as textbooks do
  '4,5': [270, 90, 150, 210], // seesaw
  '4,6': [180, 0, 270, 90], // square planar
  '5,5': [270, 90, 180, 330, 30], // trigonal bipyramidal
  '5,6': [270, 180, 0, 135, 45], // square pyramidal
  '6,6': [270, 90, 180, 0, 225, 45], // octahedral
}

/** Electron groups: a lone pair, or a lone electron on its own. */
export const groupsOf = (lone: number) => Math.ceil(lone / 2)

const rad = (deg: number) => (deg * Math.PI) / 180

function* permutations(left: number[], picked: number[] = []): Generator<number[]> {
  if (!left.length) {
    yield picked
    return
  }
  for (const n of left) yield* permutations(left.filter((m) => m !== n), [...picked, n])
}

/** Past this many outer atoms they go evenly around, and like atoms are
 *  simply put in a row rather than every order being tried. */
const MAX_TRIED = 6

/** The directions given to outer atoms of these elements, so that like
 *  atoms sit as close together as they can, and otherwise as near the order
 *  they're written in as can be, the first atoms kept in place first. */
function sideBySide(elements: string[], directions: number[]): number[] {
  const n = elements.length
  if (n > MAX_TRIED) {
    const first = (k: number) => elements.indexOf(elements[k])
    const row = elements.map((_, k) => k).sort((a, b) => first(a) - first(b) || a - b)
    const given = [...directions]
    row.forEach((k, j) => (given[k] = directions[j]))
    return given
  }
  let best = directions
  let bestScore = [Infinity, Infinity, Infinity]
  for (const order of permutations(directions.map((_, k) => k))) {
    let spread = 0
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (elements[a] === elements[b]) spread += apart(directions[order[a]], directions[order[b]])
    const moved = order.filter((d, k) => d !== k)
    const earliest = order.reduce((w, d, k) => w + (d !== k ? 2 ** (n - k) : 0), 0)
    const score = [Math.round(spread * 1000), moved.length, earliest]
    if (score[0] < bestScore[0] || (score[0] === bestScore[0] && (score[1] < bestScore[1] || (score[1] === bestScore[1] && score[2] < bestScore[2])))) {
      best = order.map((d) => directions[d])
      bestScore = score
    }
  }
  return best
}

/** The structure with its outer atoms placed around the central one, one
 *  bond length away. A diatomic keeps the order it's written in. */
export function placeStar(s: Structure, central: number, shape: Shape): Structure {
  const outers = s.atoms.map((_, i) => i).filter((i) => i !== central)
  let directions: number[]
  if (outers.length === 1) directions = [outers[0] > central ? 0 : 180]
  else {
    const domains = outers.length + groupsOf(s.atoms[central].lone)
    directions = (shape === 'shaped' && SHAPED[`${outers.length},${domains}`]) || flatDirections(outers.length)
  }
  directions = sideBySide(outers.map((i) => s.atoms[i].element), directions)
  const atoms = s.atoms.map((a) => ({ ...a, x: 0, y: 0 }))
  outers.forEach((i, k) => {
    atoms[i].x = round(Math.cos(rad(directions[k])))
    atoms[i].y = round(Math.sin(rad(directions[k])))
  })
  return { ...s, atoms }
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

/** The direction from one atom to another. */
export const directionTo = (s: Structure, from: number, to: number) => {
  const a = s.atoms[from]
  const b = s.atoms[to]
  return ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 360) % 360
}

/** The smaller angle between two directions. */
export const apart = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Directions of the atoms bonded to an atom in the skeleton, whatever the
 *  bond's order, since a bond changed to none still has an atom there. */
export const bondDirections = (s: Structure, i: number) =>
  s.bonds.filter((b) => b.a === i || b.b === i).map((b) => directionTo(s, i, b.a === i ? b.b : b.a))

const CANDIDATES = Array.from({ length: 24 }, (_, i) => i * 15)
const SIDES = [0, 90, 180, 270]

function* choose(from: number[], k: number, start = 0, picked: number[] = []): Generator<number[]> {
  if (picked.length === k) {
    yield picked
    return
  }
  for (let i = start; i <= from.length - (k - picked.length); i++) yield* choose(from, k, i + 1, [...picked, from[i]])
}

/** Directions for an atom's electron groups: on the free sides of the
 *  symbol when its bonds are all on sides, otherwise as far from its bonds
 *  and from each other as they can be. A lone electron on its own goes last. */
export function loneDirections(s: Structure, i: number): number[] {
  const groups = groupsOf(s.atoms[i].lone)
  if (!groups) return []
  const taken = bondDirections(s, i)

  // Bonds only on the sides of the symbol, as in a flat structure: the
  // electrons go on the free sides when there are enough of them.
  const onSide = (d: number) => SIDES.some((side) => apart(d, side) < 1)
  const free = SIDES.filter((side) => taken.every((t) => apart(side, t) >= 1))
  if (taken.every(onSide) && free.length >= groups) {
    let bestSides: number[] = []
    let bestSideScore = [-1, -1]
    for (const picked of choose(free, groups)) {
      let among = 360
      let nearest = 360
      picked.forEach((a, k) => {
        for (const t of taken) nearest = Math.min(nearest, apart(a, t))
        for (const b of picked.slice(k + 1)) among = Math.min(among, apart(a, b))
      })
      if (among > bestSideScore[0] || (among === bestSideScore[0] && nearest > bestSideScore[1])) {
        bestSides = picked
        bestSideScore = [among, nearest]
      }
    }
    return bestSides
  }

  let best: number[] = []
  let bestScore = [-1, -1, -Infinity]
  for (const picked of choose(CANDIDATES, Math.min(groups, CANDIDATES.length))) {
    let nearest = 360
    let among = 360
    for (let a = 0; a < picked.length; a++) {
      for (const t of taken) nearest = Math.min(nearest, apart(picked[a], t))
      for (let b = a + 1; b < picked.length; b++) among = Math.min(among, apart(picked[a], picked[b]))
    }
    const offSides = picked.reduce((n, d) => n + Math.min(d % 90, 90 - (d % 90)), 0)
    const score = [Math.min(nearest, among), among, -offSides]
    if (score[0] > bestScore[0] || (score[0] === bestScore[0] && (score[1] > bestScore[1] || (score[1] === bestScore[1] && score[2] > bestScore[2])))) {
      best = picked
      bestScore = score
    }
  }
  return best
}

/** An atom's electrons by side, `electrons` being 1 or 2. */
export type Group = { direction: number; electrons: number }

/** The sides an atom on its own fills, one electron each before any pairs. */
const FILL_ORDER = [0, 180, 270, 90]

/** An atom's electron groups: its lone pairs, with an odd electron alone
 *  last; or for an atom bonded to nothing, its electrons one to a side
 *  (right, left, top, bottom) and then paired, as textbooks draw N with a
 *  pair and three lone electrons. H and He pair their two. */
export function electronGroups(s: Structure, i: number): Group[] {
  const { element, lone } = s.atoms[i]
  if (s.bonds.some((b) => b.a === i || b.b === i)) {
    const directions = loneDirections(s, i)
    return directions.map((direction, g) => ({ direction, electrons: lone % 2 === 1 && g === directions.length - 1 ? 1 : 2 }))
  }
  const sides = FILL_ORDER.map((direction) => ({ direction, electrons: 0 }))
  for (let e = 0; e < Math.min(lone, 2 * sides.length); e++) sides[octetOf(element) === 2 && e < 2 ? 0 : e % sides.length].electrons++
  return sides.filter((g) => g.electrons)
}

/** Where an atom's formal charge goes: a corner of the symbol clear of its
 *  bonds and electrons, the top right when that's free. */
export function labelDirection(s: Structure, i: number, lone: number[]): number {
  const taken = [...bondDirections(s, i), ...lone]
  const clearance = (d: number) => Math.min(360, ...taken.map((t) => apart(d, t)))
  const options = [315, 225, 45, 135, 270, 0, 180, 90]
  return options.find((d) => clearance(d) >= 40) ?? options.reduce((a, b) => (clearance(b) > clearance(a) ? b : a))
}
