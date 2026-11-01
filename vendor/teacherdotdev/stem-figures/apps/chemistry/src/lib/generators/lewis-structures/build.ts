// Building a correct structure from a skeleton: which atoms bond to which.
// A built structure's skeleton is its central atom joined to every other
// atom (see CONTEXT.md "Built structure"); a listed structure's is stored by
// hand. Either way the electrons are placed the way textbooks teach:
//
//   1. a single bond for every line of the skeleton
//   2. octets for the outer atoms (a duet for H)
//   3. what's left on the atoms in the middle, most electronegative first
//   4. lone pairs turned into double or triple bonds until the atoms in the
//      middle have octets, trying every way and keeping the ways with the
//      smallest formal charges (these are the resonance structures)
//
// Under the fewest-formal-charges rule, step 4 then also lets atoms in
// period 3 and lower go past an octet when that makes the formal charges
// smaller (see CONTEXT.md "Structure rule").
//
// An atom on its own (N, Cl⁻, Ca²⁺) keeps its valence electrons, with the
// ones an anion gains and without the ones a cation loses.

import { ELEMENTS, HALOGENS, canExpand, octetOf } from './elements'
import type { Formula } from './formula'
import type { Structure } from './structure'

export const RULES = ['octet', 'fewest'] as const
export type Rule = (typeof RULES)[number]

export interface Skeleton {
  atoms: string[]
  /** pairs of atoms joined by a bond */
  bonds: [number, number][]
  charge: number
  /** a built structure's central atom */
  central?: number
}

export type Central = { ok: true; central: number } | { ok: false; reason: 'several' | 'acid' }

const electronegativity = (symbol: string) => ELEMENTS[symbol].electronegativity

/** The index of a formula's central atom: the least electronegative atom
 *  other than H, of which there must be only one. An atom on its own is its
 *  own central atom. */
export function findCentral(f: Formula): Central {
  const { atoms } = f
  if (atoms.length === 1) return { ok: true, central: 0 }
  if (atoms.length === 2) {
    const [a, b] = atoms
    if (a === 'H') return { ok: true, central: b === 'H' ? 0 : 1 }
    return { ok: true, central: b !== 'H' && electronegativity(b) < electronegativity(a) ? 1 : 0 }
  }
  if (new Set(atoms).size === 1) return atoms.length === 3 ? { ok: true, central: 1 } : { ok: false, reason: 'several' }

  const count = (symbol: string) => atoms.filter((a) => a === symbol).length
  let central = -1
  atoms.forEach((a, i) => {
    if (a === 'H' || count(a) !== 1) return
    if (central < 0 || electronegativity(a) < electronegativity(atoms[central])) central = i
  })
  if (central < 0) return { ok: false, reason: 'several' }
  // An oxyacid written H first (HNO3, H2SO4) has its H atoms on O. Around
  // C they're on C (H2CO is formaldehyde), and the carbon acids are listed.
  if (f.tokens[0].symbol === 'H' && atoms.includes('O') && !['O', 'C'].includes(atoms[central])) return { ok: false, reason: 'acid' }
  return { ok: true, central }
}

/** The central atom joined to every other atom. */
export const starSkeleton = (f: Formula, central: number): Skeleton => ({
  atoms: f.atoms,
  bonds: f.atoms.flatMap((_, i) => (i === central ? [] : [[central, i] as [number, number]])),
  charge: f.charge,
  central,
})

interface State {
  orders: number[]
  lone: number[]
}

const stateKey = (s: State) => s.orders.join('') + '|' + s.lone.join(',')

/** How many ways of placing the electrons are tried at most, so an odd
 *  formula like SO42 can't freeze the page. */
const MAX_STATES = 5000

/** Every correct structure for a skeleton under the rule, the resonance
 *  structures in order; none when it can't make a correct Lewis structure,
 *  unless `strict` is off, which gives the best it can do anyway (for a
 *  skeleton with the wrong central atom, say). */
export function correctStructures(sk: Skeleton, rule: Rule, strict = true): Structure[] {
  const { atoms, bonds } = sk
  const degree = atoms.map((_, i) => bonds.filter(([a, b]) => a === i || b === i).length)
  const inner = (i: number) => degree[i] >= 2 || i === sk.central
  const total = atoms.reduce((n, a) => n + ELEMENTS[a].valence, 0) - sk.charge
  if (atoms.length === 1)
    return total >= 0 && total <= octetOf(atoms[0]) ? [{ atoms: [{ element: atoms[0], x: 0, y: 0, lone: total }], bonds: [], charge: sk.charge }] : []

  // Steps 1 to 3.
  let left = total - 2 * bonds.length
  if (left < 0) return []
  const lone = atoms.map(() => 0)
  const give = (i: number, need: number) => {
    const given = Math.max(0, Math.min(need, left))
    lone[i] += given
    left -= given
  }
  const indexes = atoms.map((_, i) => i)
  const inners = indexes.filter(inner).sort((a, b) => electronegativity(atoms[b]) - electronegativity(atoms[a]))
  for (const i of indexes) if (!inner(i)) give(i, octetOf(atoms[i]) - 2 * degree[i])
  for (const i of inners) give(i, octetOf(atoms[i]) - 2 * degree[i])
  if (left > 0) {
    const roomy = inners.filter((i) => canExpand(atoms[i])).sort((a, b) => electronegativity(atoms[a]) - electronegativity(atoms[b]))
    lone[roomy[0] ?? sk.central ?? inners[0] ?? 0] += left
  }

  const around = (s: State, i: number) => s.lone[i] + 2 * bonds.reduce((n, [a, b], k) => n + (a === i || b === i ? s.orders[k] : 0), 0)
  const formal = (s: State, i: number) => ELEMENTS[atoms[i]].valence - s.lone[i] - (around(s, i) - s.lone[i]) / 2
  const canGive = (s: State, i: number) => atoms[i] !== 'H' && s.lone[i] >= 2 && !(HALOGENS.has(atoms[i]) && !inner(i))

  /** Every state reachable by turning a lone pair on one atom into a bond
   *  to its neighbour, where `takes` says the neighbour may have it. */
  function explore(starts: State[], takes: (s: State, taker: number, giver: number, k: number) => boolean) {
    const seen = new Map<string, State>()
    const stack = [...starts]
    while (stack.length && seen.size < MAX_STATES) {
      const s = stack.pop()!
      const key = stateKey(s)
      if (seen.has(key)) continue
      seen.set(key, s)
      bonds.forEach(([a, b], k) => {
        for (const [taker, giver] of [
          [a, b],
          [b, a],
        ]) {
          if (!canGive(s, giver) || !takes(s, taker, giver, k)) continue
          const next = { orders: [...s.orders], lone: [...s.lone] }
          next.orders[k]++
          next.lone[giver] -= 2
          stack.push(next)
        }
      })
    }
    return [...seen.values()]
  }

  // Step 4: towards octets, never past one.
  const start = { orders: bonds.map(() => 1), lone }
  const toOctet = explore([start], (s, i, _, k) => atoms[i] !== 'H' && s.orders[k] < 3 && around(s, i) + 2 <= octetOf(atoms[i]))
  const short = (s: State) => indexes.reduce((n, i) => n + Math.max(0, octetOf(atoms[i]) - around(s, i)), 0)
  const fewestShort = Math.min(...toOctet.map(short))
  let candidates = toOctet.filter((s) => short(s) === fewestShort)
  // Past an octet, a bond is only worth making when it takes a positive
  // formal charge down and a negative one up, which also keeps the search
  // small however many atoms could give a pair.
  if (rule === 'fewest')
    candidates = explore(
      candidates,
      (s, i, giver, k) => inner(i) && canExpand(atoms[i]) && s.orders[k] < 2 && around(s, i) >= octetOf(atoms[i]) && formal(s, i) > 0 && formal(s, giver) < 0,
    )

  // Keep the smallest formal charges, then (past an octet) the fewest electrons.
  const charges = (s: State) => indexes.reduce((n, i) => n + Math.abs(formal(s, i)), 0)
  const past = (s: State) => indexes.reduce((n, i) => n + Math.max(0, around(s, i) - octetOf(atoms[i])), 0)
  const least = (list: State[], score: (s: State) => number) => {
    const best = Math.min(...list.map(score))
    return list.filter((s) => score(s) === best)
  }
  const best = least(least(candidates, charges), past).sort((x, y) => (x.orders.join('') < y.orders.join('') ? 1 : -1))
  if (!best.length || (strict && !correct(best[0]))) return []
  return best.map((s) => ({
    atoms: atoms.map((element, i) => ({ element, x: 0, y: 0, lone: s.lone[i] })),
    bonds: bonds.map(([a, b], k) => ({ a, b, order: s.orders[k] })),
    charge: sk.charge,
  }))

  /** Whether a state follows the rules any correct structure does: no more
   *  than an octet in period 2 (a duet for H), and short of one only for
   *  B, Be and Al in the middle, or the one odd electron of a radical. */
  function correct(s: State) {
    let odd = total % 2
    return indexes.every((i) => {
      const n = around(s, i)
      const room = octetOf(atoms[i])
      if (n > room) return canExpand(atoms[i])
      if (n === room) return true
      if (inner(i) && ['B', 'Be', 'Al'].includes(atoms[i])) return true
      if (odd && n === room - 1) return odd-- > 0
      return false
    })
  }
}
