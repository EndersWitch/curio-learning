// A random pedigree for an inheritance mode, the same every time for the
// same seed. Its people are given real genotypes, passed down from parents
// to children by Mendel's rules, and are drawn by the phenotype those give,
// so the family always fits its mode. Of the families tried, the first a
// student could diagnose is kept: one where every other mode is ruled out
// or far less likely (see tellsMode). Most seeds give one within a few
// tries; if none does, the first with the trait showing is kept.
//
// A family already drawn can be shaded again for another mode the same way:
// its people stay, and only who is affected (or a carrier) changes.

import { depthOf, MAX_CHILDREN, member, person, type Member, type Person, type Sex } from './family'
import { genotypesFor, inherit, phenotypeOf, tellsMode, type Genotype, type Mode } from './genetics'

export const SIZES = ['small', 'medium', 'large'] as const
export type Size = (typeof SIZES)[number]

/** How many children a couple has: the founders, then a couple further down. */
const CHILDREN: Record<Size, { first: [number, number]; later: [number, number]; widest: number }> = {
  small: { first: [2, 3], later: [1, 3], widest: 8 },
  medium: { first: [3, 4], later: [2, 3], widest: 11 },
  large: { first: [4, 5], later: [2, 4], widest: 14 },
}

/** A small random number generator (mulberry32), so a seed always gives the same family. */
export function randomFrom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rand = () => number
const between = (rand: Rand, [lo, hi]: [number, number]) => lo + Math.floor(rand() * (hi - lo + 1))
const pick = <T>(rand: Rand, options: readonly T[]) => options[Math.floor(rand() * options.length)]

/** A family's shape: who is in it and their sexes, before any genetics. */
interface Shape {
  sex: 'm' | 'f'
  partner?: 'm' | 'f'
  children: Shape[]
}

function randomShape(rand: Rand, generations: number, size: Size, fewest: number): Shape {
  const { later } = CHILDREN[size]
  const first: [number, number] = [Math.max(fewest, CHILDREN[size].first[0]), Math.max(fewest, CHILDREN[size].first[1])]
  const sex = (): 'm' | 'f' => (rand() < 0.5 ? 'm' : 'f')
  const grow = (s: Shape, generation: number) => {
    const n = Math.min(MAX_CHILDREN, between(rand, generation === 1 ? first : later))
    s.partner = s.sex === 'm' ? 'f' : 'm'
    s.children = Array.from({ length: n }, () => ({ sex: sex(), children: [] }))
    if (generation + 1 >= generations) return
    // Some children have families of their own; at least one does, so every
    // generation is drawn.
    const chance = size === 'small' ? 0.4 : size === 'medium' ? 0.5 : 0.6
    const grown = s.children.filter(() => rand() < chance)
    if (!grown.length) grown.push(pick(rand, s.children))
    for (const c of grown) grow(c, generation + 1)
  }
  const root: Shape = { sex: rand() < 0.5 ? 'm' : 'f', children: [] }
  grow(root, 1)
  return root
}

/** The number of people in the widest generation. */
function widest(s: Shape) {
  const rows: number[] = []
  const walk = (x: Shape, g: number) => {
    rows[g] = (rows[g] ?? 0) + 1 + (x.partner ? 1 : 0)
    x.children.forEach((c) => walk(c, g + 1))
  }
  walk(s, 0)
  return Math.max(...rows)
}

/** How a founder's genotype is picked: the trait has to enter the family
 *  somewhere, so the founding couple carries it. The trait allele's copies
 *  (0, 1 or 2) by sex, with a weight each. */
const FOUNDERS: Record<Mode, { m: number; f: number; weight: number }[]> = {
  ad: [{ m: 1, f: 0, weight: 1 }, { m: 0, f: 1, weight: 1 }],
  ar: [{ m: 1, f: 1, weight: 5 }, { m: 2, f: 1, weight: 1 }, { m: 1, f: 2, weight: 1 }],
  xr: [{ m: 0, f: 1, weight: 4 }, { m: 1, f: 0, weight: 1 }],
  xd: [{ m: 1, f: 0, weight: 3 }, { m: 0, f: 1, weight: 2 }],
  y: [{ m: 1, f: 0, weight: 1 }],
}

/** The chance someone marrying in carries the trait allele: only for the
 *  recessive modes, where it's how an affected child can come from parents
 *  who aren't. */
const MARRIED_IN: Record<Mode, { m: number; f: number }> = {
  ad: { m: 0, f: 0 },
  ar: { m: 0.5, f: 0.5 },
  xr: { m: 0, f: 0.1 },
  xd: { m: 0, f: 0 },
  y: { m: 0, f: 0 },
}

const code = (mode: Mode, sex: 'm' | 'f', copies: number): Genotype =>
  mode === 'ad' || mode === 'ar' ? `a${copies}` : `${sex}${copies}`

/** A child's genotype from its parents' genotypes, by chance. */
function childOf(rand: Rand, mode: Mode, father: Genotype, mother: Genotype, sex: Sex): Genotype {
  const options = genotypesFor(mode, sex)
  let r = rand()
  for (const g of options) {
    r -= inherit(mode, father, mother, g, sex)
    if (r < 0) return g
  }
  return options.find((g) => inherit(mode, father, mother, g, sex) > 0)!
}

/** The person drawn for a genotype. */
function drawn(mode: Mode, sex: Sex, g: Genotype): Person {
  const ph = phenotypeOf(mode, g)
  return person(sex, { affected: ph === 'affected', carrier: ph === 'carrier' })
}

/** One try at a family: its shape, then genotypes passed down. */
function tryFamily(rand: Rand, mode: Mode, generations: number, size: Size): Member {
  // An X-linked dominant or Y-linked trait only tells apart from autosomal
  // dominant with enough children: every daughter (or son) of an affected
  // father affected, and none of the others, is then too many to be chance.
  // Over two or three generations the founders need that many.
  const sexLinked = mode === 'xd' || mode === 'y'
  const fewest = sexLinked && generations === 2 ? 5 : sexLinked && generations === 3 ? 4 : 1
  let shape = randomShape(rand, generations, size, fewest)
  for (let i = 0; i < 20 && widest(shape) > CHILDREN[size].widest; i++) shape = randomShape(rand, generations, size, fewest)

  const founders = FOUNDERS[mode]
  let r = rand() * founders.reduce((s, f) => s + f.weight, 0)
  const start = founders.find((f) => (r -= f.weight) < 0) ?? founders[0]

  const marriedIn = (sex: 'm' | 'f') => {
    const chance = MARRIED_IN[mode][sex]
    if (!chance || rand() >= chance) return code(mode, sex, 0)
    // A carrier (or, for X-linked recessive, a carrier woman).
    return code(mode, sex, 1)
  }

  const build = (s: Shape, g: Genotype, partnerG?: Genotype): Member => {
    const m: Member = { ...member(s.sex), ...drawn(mode, s.sex, g), children: [] }
    if (!s.partner) return m
    const pg = partnerG ?? marriedIn(s.partner)
    m.partner = drawn(mode, s.partner, pg)
    const [father, mother] = s.sex === 'm' ? [g, pg] : [pg, g]
    m.children = s.children.map((c) => build(c, childOf(rand, mode, father, mother, c.sex)))
    return m
  }
  const rootG = code(mode, shape.sex, start[shape.sex])
  const partnerG = code(mode, shape.partner!, start[shape.partner!])
  return build(shape, rootG, partnerG)
}

/** Counts of affected people, for keeping families where the trait shows
 *  but doesn't fill the page. */
function affectedShare(m: Member) {
  let all = 0
  let affected = 0
  const walk = (x: Member) => {
    for (const p of [x, x.partner].filter(Boolean) as Person[]) {
      all++
      if (p.affected) affected++
    }
    x.children.forEach(walk)
  }
  walk(m)
  return { all, affected }
}

/** How many families are tried before settling for the best so far. */
const TRIES = 400

/** A random family for `mode`, from `seed`. */
export function randomFamily(mode: Mode, generations: number, size: Size, seed: number): Member {
  const rand = randomFrom(seed)
  let fallback: Member | undefined
  for (let i = 0; i < TRIES; i++) {
    const family = tryFamily(rand, mode, generations, size)
    const { all, affected } = affectedShare(family)
    const enough = affected >= (generations > 2 ? 3 : 2) && affected <= all * 0.6
    if (!enough) continue
    fallback ??= family
    if (tellsMode(family, mode)) return family
  }
  return fallback ?? tryFamily(randomFrom(seed), mode, generations, size)
}

/** One try at shading a family already drawn: genotypes passed down its own
 *  people, the founding couple carrying the trait as a random family's do.
 *  Everything but who's affected or a carrier is kept. */
function tryShading(rand: Rand, mode: Mode, family: Member): Member {
  const founders = FOUNDERS[mode]
  let r = rand() * founders.reduce((s, f) => s + f.weight, 0)
  const start = founders.find((f) => (r -= f.weight) < 0) ?? founders[0]
  // Someone of unknown sex is given one for their genotype.
  const as = (sex: Sex): 'm' | 'f' => (sex === 'u' ? (rand() < 0.5 ? 'm' : 'f') : sex)
  const marriedIn = (sex: 'm' | 'f') => {
    const chance = MARRIED_IN[mode][sex]
    return code(mode, sex, chance && rand() < chance ? 1 : 0)
  }
  const shade = (p: Person, g: Genotype) => {
    const { affected, carrier } = drawn(mode, p.sex, g)
    return { affected, carrier }
  }

  const build = (m: Member, g: Genotype, partnerG?: Genotype): Member => {
    const out: Member = { ...m, ...shade(m, g), children: [] }
    if (!m.partner) return out
    const pg = partnerG ?? marriedIn(as(m.partner.sex))
    out.partner = { ...m.partner, ...shade(m.partner, pg) }
    const [father, mother] = m.sex === 'm' ? [g, pg] : [pg, g]
    let last: Genotype | undefined
    out.children = m.children.map((c, i) => {
      // An identical twin has their twin's genotype.
      const prev = m.children[i - 1]
      last = prev?.twin === 'mz' && prev.sex === c.sex && last ? last : childOf(rand, mode, father, mother, c.sex)
      return build(c, last)
    })
    return out
  }
  const rootSex = as(family.sex)
  const partnerSex = family.partner && as(family.partner.sex)
  return build(family, code(mode, rootSex, start[rootSex]), partnerSex && code(mode, partnerSex, start[partnerSex]))
}

/** The family shaded for `mode`, from `seed`: the first try a student could
 *  diagnose, or else the first with the trait showing. */
export function shadeFamily(family: Member, mode: Mode, seed: number): Member {
  const rand = randomFrom(seed)
  const least = depthOf(family) > 2 ? 3 : 2
  let fallback: Member | undefined
  for (let i = 0; i < TRIES; i++) {
    const shaded = tryShading(rand, mode, family)
    const { all, affected } = affectedShare(shaded)
    if (!affected) continue
    fallback ??= shaded
    if (affected >= Math.min(least, all) && affected <= Math.max(1, all * 0.6) && tellsMode(shaded, mode)) return shaded
  }
  return fallback ?? tryShading(randomFrom(seed), mode, family)
}
