// The genetics behind a pedigree, for one gene with two alleles, fully
// penetrant, and no new mutations: the textbook model (OpenStax Biology 2e,
// chapters 12 and 13).
//
// A genotype is written as the person's sex and how many copies of the
// trait's allele they have: "a1" for an autosomal heterozygote, "f1" for a
// woman with one trait X, "m1" for a man with a trait X (or a trait Y).
// From the people's drawn phenotypes we work out which genotypes each could
// have (genotype elimination, which is exact for a family drawn as a tree),
// and how likely the whole family is under each inheritance mode (adding up
// every way the genes could have been passed down, with the trait's allele
// rare among people who married in).

import { everyone, refKey, type Member, type Person, type Ref, type Sex } from './family'

export const MODES = ['ad', 'ar', 'xr', 'xd', 'y'] as const
export type Mode = (typeof MODES)[number]

export const MODE_NAMES: Record<Mode, string> = {
  ad: 'Autosomal dominant',
  ar: 'Autosomal recessive',
  xr: 'X-linked recessive',
  xd: 'X-linked dominant',
  y: 'Y-linked',
}

export type Genotype = string
export type Phenotype = 'affected' | 'carrier' | 'unaffected'

const autosomal = (mode: Mode) => mode === 'ad' || mode === 'ar'

/** The genotypes a person of this sex can have. Unknown sex could be either. */
export function genotypesFor(mode: Mode, sex: Sex): Genotype[] {
  if (autosomal(mode)) return ['a0', 'a1', 'a2']
  const male = mode === 'y' || mode === 'xr' || mode === 'xd' ? ['m0', 'm1'] : []
  const female = mode === 'y' ? ['f0'] : ['f0', 'f1', 'f2']
  return sex === 'm' ? male : sex === 'f' ? female : [...male, ...female]
}

const copies = (g: Genotype) => Number(g[1])
const sexOf = (g: Genotype) => g[0]

/** What a genotype looks like: affected, a carrier (one copy of a recessive
 *  allele, unaffected), or unaffected with none. */
export function phenotypeOf(mode: Mode, g: Genotype): Phenotype {
  const n = copies(g)
  if (mode === 'ad' || mode === 'xd' || mode === 'y') return n > 0 ? 'affected' : 'unaffected'
  if (mode === 'ar') return n === 2 ? 'affected' : n === 1 ? 'carrier' : 'unaffected'
  // X-linked recessive: a man's one X decides; a woman needs two.
  if (sexOf(g) === 'm') return n === 1 ? 'affected' : 'unaffected'
  return n === 2 ? 'affected' : n === 1 ? 'carrier' : 'unaffected'
}

/** Whether a genotype fits what is drawn for a person. With carriers shown,
 *  an unshaded symbol means not a carrier; with them hidden it could be. */
export function fits(mode: Mode, g: Genotype, p: Person, carriersShown: boolean) {
  const ph = phenotypeOf(mode, g)
  if (p.affected) return ph === 'affected'
  if (carriersShown && p.carrier) return ph === 'carrier'
  return ph === 'unaffected' || (!carriersShown && ph === 'carrier')
}

/** How likely a parent is to pass on the trait allele: half for one copy. */
const passes = (n: number) => n / 2

/** The chance of a child's genotype from these parents (for a child of
 *  unknown sex, its sex is a coin toss). */
export function inherit(mode: Mode, father: Genotype, mother: Genotype, child: Genotype, childSex: Sex): number {
  const f = copies(father)
  const m = copies(mother)
  const n = copies(child)
  const sexChance = childSex === 'u' && !autosomal(mode) ? 0.5 : 1
  if (autosomal(mode)) {
    const pf = passes(f)
    const pm = passes(m)
    return [(1 - pf) * (1 - pm), pf * (1 - pm) + (1 - pf) * pm, pf * pm][n]
  }
  if (mode === 'y') {
    if (sexOf(child) === 'f') return sexChance * (n === 0 ? 1 : 0)
    return sexChance * (n === f ? 1 : 0)
  }
  // X-linked: a son's X is his mother's; a daughter gets her father's X too.
  const pm = passes(m)
  if (sexOf(child) === 'm') return sexChance * (n === 1 ? pm : 1 - pm)
  return sexChance * [(1 - f) * (1 - pm), f * (1 - pm) + (1 - f) * pm, f * pm][n]
}

/** How common each genotype is among people who married in, when one
 *  allele in `q` is the trait's. */
export function founderChance(mode: Mode, g: Genotype, q: number, sex: Sex): number {
  const n = copies(g)
  const sexChance = sex === 'u' && !autosomal(mode) ? 0.5 : 1
  if (autosomal(mode) || sexOf(g) === 'f') {
    if (mode === 'y') return sexChance
    return sexChance * [(1 - q) ** 2, 2 * q * (1 - q), q * q][n]
  }
  return sexChance * (n === 1 ? q : 1 - q)
}

// ---- The family as couples ----

interface Couple {
  father: string
  mother: string
  /** children in birth order, an identical twin pair as one entry */
  draws: string[][]
}

interface Flat {
  people: Map<string, { person: Person; ref: Ref }>
  couples: Couple[]
}

/** The family as people and couples. Undefined when a couple with children
 *  isn't a man and a woman, so an X or Y can't be followed. */
function flatten(root: Member, mode: Mode): Flat | undefined {
  const people = new Map<string, { person: Person; ref: Ref }>()
  for (const { ref, person } of everyone(root)) people.set(refKey(ref), { person, ref })
  const couples: Couple[] = []
  let ok = true
  const walk = (m: Member, path: number[]) => {
    if (!m.partner || !m.children.length) return
    const me = refKey({ path, partner: false })
    const them = refKey({ path, partner: true })
    let father = me
    let mother = them
    if (m.sex === 'f' && m.partner.sex === 'm') [father, mother] = [them, me]
    else if (!(m.sex === 'm' && m.partner.sex === 'f') && !autosomal(mode)) ok = false
    const draws: string[][] = []
    m.children.forEach((c, i) => {
      const key = refKey({ path: [...path, i], partner: false })
      const prev = m.children[i - 1]
      if (prev?.twin === 'mz' && prev.sex === c.sex) draws[draws.length - 1].push(key)
      else draws.push([key])
      walk(c, [...path, i])
    })
    couples.push({ father, mother, draws })
  }
  walk(root, [])
  return ok ? { people, couples } : undefined
}

/** For each person (by refKey), the genotypes they could have given
 *  everyone's drawn phenotype, under `mode`. Undefined when the family
 *  can't be read for this mode (a couple that isn't a man and a woman). An
 *  empty list for anyone means the family doesn't fit the mode. */
export function possibleGenotypes(root: Member, mode: Mode, carriersShown: boolean): Map<string, Genotype[]> | undefined {
  const flat = flatten(root, mode)
  if (!flat) return undefined
  const sets = new Map<string, Genotype[]>()
  for (const [key, { person }] of flat.people) {
    sets.set(key, genotypesFor(mode, person.sex).filter((g) => fits(mode, g, person, carriersShown)))
  }
  const sexOfKey = (key: string) => flat.people.get(key)!.person.sex
  let changed = true
  const set = (key: string, next: Genotype[]) => {
    if (next.length !== sets.get(key)!.length) {
      sets.set(key, next)
      changed = true
    }
  }
  while (changed) {
    changed = false
    for (const c of flat.couples) {
      // An identical pair has one genotype between them.
      for (const draw of c.draws) {
        const shared = draw.reduce((acc, k) => acc.filter((g) => sets.get(k)!.includes(g)), sets.get(draw[0])!)
        for (const k of draw) set(k, shared)
      }
      const pairs: [Genotype, Genotype][] = []
      for (const gf of sets.get(c.father)!) {
        for (const gm of sets.get(c.mother)!) {
          const all = c.draws.every((draw) =>
            sets.get(draw[0])!.some((gc) => inherit(mode, gf, gm, gc, sexOfKey(draw[0])) > 0),
          )
          if (all) pairs.push([gf, gm])
        }
      }
      set(c.father, sets.get(c.father)!.filter((g) => pairs.some((p) => p[0] === g)))
      set(c.mother, sets.get(c.mother)!.filter((g) => pairs.some((p) => p[1] === g)))
      for (const draw of c.draws) {
        const kept = sets.get(draw[0])!.filter((gc) => pairs.some(([gf, gm]) => inherit(mode, gf, gm, gc, sexOfKey(draw[0])) > 0))
        for (const k of draw) set(k, kept)
      }
    }
  }
  return sets
}

/** Whether the drawn family could come from `mode` at all. */
export function fitsMode(root: Member, mode: Mode, carriersShown: boolean) {
  const sets = possibleGenotypes(root, mode, carriersShown)
  return !!sets && [...sets.values()].every((s) => s.length > 0)
}

/** The chance of the whole drawn family under `mode`, the trait allele
 *  being `q` of all alleles among people who married in. 0 when it can't
 *  happen, or when the family can't be read for this mode. */
export function likelihood(root: Member, mode: Mode, carriersShown: boolean, q = 0.01): number {
  if (!flatten(root, mode)) return 0
  const pen = (p: Person, g: Genotype) => (fits(mode, g, p, carriersShown) ? 1 : 0)
  // The chance of everything drawn from this blood relative down, given
  // their genotype: their own phenotype, their partner's, their children's.
  const below = (m: Member, g: Genotype): number => {
    const own = pen(m, g)
    if (!own || !m.partner || !m.children.length) return own * (m.partner ? partnerAlone(m.partner) : 1)
    const partner = m.partner
    const male = m.sex === 'm' || (autosomal(mode) && partner.sex !== 'm')
    let sum = 0
    for (const gp of genotypesFor(mode, partner.sex)) {
      const w = founderChance(mode, gp, q, partner.sex) * pen(partner, gp)
      if (!w) continue
      const [gf, gm] = male ? [g, gp] : [gp, g]
      let kids = 1
      for (let i = 0; i < m.children.length && kids; i++) {
        const c = m.children[i]
        const prev = m.children[i - 1]
        if (prev?.twin === 'mz' && prev.sex === c.sex) continue
        const next = c.twin === 'mz' && m.children[i + 1]?.sex === c.sex ? m.children[i + 1] : undefined
        let s = 0
        for (const gc of genotypesFor(mode, c.sex)) {
          const t = inherit(mode, gf, gm, gc, c.sex)
          if (t) s += t * below(c, gc) * (next ? below(next, gc) : 1)
        }
        kids *= s
      }
      sum += w * kids
    }
    return own * sum
  }
  // A partner with no children drawn: just how likely their own phenotype is.
  const partnerAlone = (p: Person) => genotypesFor(mode, p.sex).reduce((s, g) => s + founderChance(mode, g, q, p.sex) * pen(p, g), 0)
  return genotypesFor(mode, root.sex).reduce((s, g) => s + founderChance(mode, g, q, root.sex) * below(root, g), 0)
}

/** How each inheritance mode compares for the drawn family. `odds` is how
 *  many times likelier the most likely mode is than this one (1 for the
 *  most likely, Infinity when it can't happen). */
export function compareModes(root: Member, carriersShown: boolean) {
  const l = Object.fromEntries(MODES.map((m) => [m, likelihood(root, m, carriersShown)])) as Record<Mode, number>
  const best = Math.max(...Object.values(l))
  return MODES.map((mode) => ({ mode, fits: fitsMode(root, mode, carriersShown), odds: l[mode] ? best / l[mode] : Infinity }))
}

/** How much likelier a family's mode must be than every other for students
 *  to be able to tell which it is. */
export const CLEAR_ODDS = 10

/** Whether students could tell the family's inheritance is `mode`: it fits,
 *  and every other mode either can't happen or is far less likely. */
export function tellsMode(root: Member, mode: Mode, carriersShown = false) {
  if (!fitsMode(root, mode, carriersShown)) return false
  const own = likelihood(root, mode, carriersShown)
  return MODES.every((other) => other === mode || likelihood(root, other, carriersShown) * CLEAR_ODDS <= own)
}

// ---- Genotypes written out ----

/** One allele as written: a letter, a sex chromosome with an allele as its
 *  superscript, or a blank for an allele students can't tell. */
export interface Allele {
  text: string
  sup?: string
}

/** The trait allele's letter and the other allele's: upper case for the dominant one. */
function letters(mode: Mode, letter: string) {
  const up = letter.toUpperCase()
  const low = letter.toLowerCase()
  return mode === 'ad' || mode === 'xd' ? { trait: up, other: low } : { trait: low, other: up }
}

const dominantFirst = (a: string, b: string) => (a === a.toUpperCase() && b !== b.toUpperCase() ? -1 : a === b ? 0 : 1)

/** The two alleles of a genotype, the dominant one first. */
function alleles(mode: Mode, g: Genotype, letter: string): Allele[] {
  const { trait, other } = letters(mode, letter)
  const n = copies(g)
  if (autosomal(mode)) {
    return [n >= 1 ? trait : other, n === 2 ? trait : other].sort(dominantFirst).map((text) => ({ text }))
  }
  if (mode === 'y') {
    return sexOf(g) === 'm' ? [{ text: 'X' }, n ? { text: 'Y', sup: letter.toUpperCase() } : { text: 'Y' }] : [{ text: 'X' }, { text: 'X' }]
  }
  if (sexOf(g) === 'm') return [{ text: 'X', sup: n ? trait : other }, { text: 'Y' }]
  const sups = [n >= 1 ? trait : other, n === 2 ? trait : other].sort(dominantFirst)
  return sups.map((sup) => ({ text: 'X', sup }))
}

/** What a student would write for someone who could have any of
 *  `genotypes`: the genotype, or with a blank for the allele that can't be
 *  told ("A_", "XᴬX_"). Undefined when nothing sensible can be written. */
export function genotypeLabel(mode: Mode, genotypes: Genotype[], letter: string): Allele[] | undefined {
  if (!genotypes.length) return undefined
  if (new Set(genotypes.map(sexOf)).size > 1) return undefined
  const options = genotypes.map((g) => alleles(mode, g, letter))
  const same = (a: Allele, b: Allele) => a.text === b.text && a.sup === b.sup
  if (options.every((o) => same(o[0], options[0][0]) && same(o[1], options[0][1]))) return options[0]
  if (!options.every((o) => same(o[0], options[0][0]))) return undefined
  const second = options[0][1]
  return [options[0][0], second.sup !== undefined ? { text: second.text, sup: '_' } : { text: '_' }]
}

/** A genotype label as plain text, for screen readers: "Aa", or "X^H X^h". */
export const labelText = (label: Allele[]) =>
  label.some((a) => a.sup) ? label.map((a) => (a.sup ? `${a.text}^${a.sup}` : a.text)).join(' ') : label.map((a) => a.text).join('')
