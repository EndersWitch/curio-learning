// The genetics behind a Punnett square: reading the cross the teacher types
// ("Tt x tt", "RrYy × RrYy", "X^H X^h × X^H Y", "C^R C^W × C^R C^W",
// "R_1 R_2 × R_1 R_2"), the
// gametes each parent makes, the offspring in each cell, and the genotype
// and phenotype counts they add up to.
//
// Alleles are written the usual classroom way. With complete dominance a
// capital letter is dominant and its small letter recessive (T, t). With
// incomplete dominance or codominance alleles carry superscripts (Cᴿ, Cᵂ) or
// subscripts (R₁, R₂), and a small letter without one is recessive to them
// (i in Iᴬ, Iᴮ, i). An X-linked allele is the superscript on its X (Xᴴ, Xʰ);
// Y carries none.

export const CROSSES = ['monohybrid', 'dihybrid', 'x-linked'] as const
export type Cross = (typeof CROSSES)[number]

export const DOMINANCE = ['complete', 'incomplete', 'codominance'] as const
export type Dominance = (typeof DOMINANCE)[number]

/** One allele: a letter and its subscript or superscript (T, t, Cᴿ, Iᴬ, R₁,
 *  i), or on an X chromosome the X with the allele as its superscript (Xᴴ),
 *  or a Y. */
export interface Allele {
  base: string
  sub: string
  sup: string
  /** on an X-linked cross, the chromosome: an X with this allele, or a Y */
  chromosome?: 'X' | 'Y'
}

/** A genotype, one list of alleles per gene, each in the standard order
 *  (dominant first). A son's X-linked gene is his X and his Y. */
export type Genotype = Allele[][]

/** A gamete: one allele per gene. */
export type Gamete = Allele[]

const script = (mark: string, t: string) => (t ? (t.length > 1 ? `${mark}{${t}}` : mark + t) : '')

/** The allele as the address writes it: T, C^R, X^H, R_1, or C^{AB} for a
 *  longer superscript. */
export const alleleId = (a: Allele) => a.base + script('_', a.sub) + script('^', a.sup)

const isY = (a: Allele) => a.chromosome === 'Y'
const isUpper = (c: string) => c !== c.toLowerCase() || /^\d/.test(c)

/** Dominant (top) alleles are capitals: T, Cᴿ, Iᴬ, and on an X, Xᴴ. */
export const isTop = (a: Allele) => (a.chromosome === 'X' ? isUpper(a.sup) : !isY(a) && isUpper(a.base))

/** The letters that tell an allele apart: T, CR, IA, R1, or for an X allele just H. */
const letters = (a: Allele) => (a.chromosome === 'X' ? a.sup : a.base + a.sub + a.sup)

/** Sorting order for alleles: dominant first, then alphabetical, with Y last. */
const rankKey = (a: Allele) => (isY(a) ? '2' : (isTop(a) ? '0' : '1') + a.sup.toLowerCase() + a.sup + a.sub + a.base)
const byRank = (a: Allele, b: Allele) => (rankKey(a) < rankKey(b) ? -1 : rankKey(a) > rankKey(b) ? 1 : 0)
export const sortAlleles = (alleles: Allele[]) => [...alleles].sort(byRank)

const sameAllele = (a: Allele, b: Allele) => a.base === b.base && a.sub === b.sub && a.sup === b.sup && a.chromosome === b.chromosome

export const isFemale = (g: Genotype) => !g.some((gene) => gene.some(isY))

// ── Reading what the teacher types ──────────────────────────────────────────

/** Superscript letters someone might paste in (Cᴿ, Iᴬ, Xʰ), as plain letters. */
const SUPERSCRIPTS: Record<string, string> = Object.fromEntries(
  [...'ᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ'].map((c, i) => [c, 'ABDEGHIJKLMNOPRTUVW'[i]]).concat(
    [...'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'].map((c, i) => [c, 'abcdefghijklmnoprstuvwxyz'[i]]),
    [...'⁰¹²³⁴⁵⁶⁷⁸⁹'].map((c, i) => [c, String(i)]),
    [['⁺', '+']],
  ),
)

/** Subscripts someone might paste in (R₁, R₂), likewise. */
const SUBSCRIPTS: Record<string, string> = Object.fromEntries(
  [...'₀₁₂₃₄₅₆₇₈₉'].map((c, i) => [c, String(i)]).concat(
    [...'ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ'].map((c, i) => [c, 'aehijklmnoprstuvx'[i]]),
    [['₊', '+']],
  ),
)

/** One parent's genotype as typed, tidied: no spaces or brackets, and pasted
 *  superscripts and subscripts written with ^ and _. */
function clean(text: string) {
  let out = ''
  for (const c of text.normalize('NFC')) {
    if (SUPERSCRIPTS[c]) out += `^${SUPERSCRIPTS[c]}`
    else if (SUBSCRIPTS[c]) out += `_${SUBSCRIPTS[c]}`
    else if (!/[\s,;()[\]]/.test(c)) out += c
  }
  return out
}

type Read<T> = { ok: true; value: T } | { ok: false; error: string }
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

/** The superscript after a ^ at `i`, or the subscript after a _: one
 *  character, or several in braces. */
function readScript(s: string, i: number): { text: string; next: number } | undefined {
  if (s[i + 1] === '{') {
    const end = s.indexOf('}', i + 2)
    if (end < 0 || end === i + 2) return undefined
    return { text: s.slice(i + 2, end), next: end + 1 }
  }
  return s[i + 1] && /[A-Za-z0-9+]/.test(s[i + 1]) ? { text: s[i + 1], next: i + 2 } : undefined
}

/** One parent's alleles, in the order typed. Superscripts are written with
 *  ^ (C^R) and subscripts with _ (R_1), or, outside complete dominance,
 *  straight after the gene's letter: a digit is a subscript (R1), and any
 *  other letter than the one the genotype starts with a superscript (CR, IA,
 *  XH). */
function readAlleles(typed: string, cross: Cross, dominance: Dominance): Read<Allele[]> {
  const s = clean(typed)
  if (!s) return fail('Type a genotype for each parent.')
  const alleles: Allele[] = []
  const gene = s[0].toLowerCase()
  const implicit = cross === 'x-linked' || dominance !== 'complete'
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (!/[A-Za-z]/.test(c)) return fail(`“${typed.trim()}” has “${c}”, which isn’t an allele letter.`)
    if (cross === 'x-linked' && c !== 'X' && c !== 'Y') {
      return fail(`Write each parent with X and Y chromosomes, like X^H X^h or X^H Y.`)
    }
    const a: Allele = cross === 'x-linked' ? { base: c, sub: '', sup: '', chromosome: c as 'X' | 'Y' } : { base: c, sub: '', sup: '' }
    i++
    // A subscript and a superscript, in either order (R_1^A or R^A_1).
    while ((s[i] === '^' && !a.sup) || (s[i] === '_' && !a.sub)) {
      const read = readScript(s, i)
      if (!read) return fail(s[i] === '^' ? `Put the superscript straight after the ^, like C^R.` : `Put the subscript straight after the _, like R_1.`)
      if (s[i] === '^') a.sup = read.text
      else a.sub = read.text
      i = read.next
    }
    if (!a.sub && !a.sup && implicit && c !== 'Y' && s[i] && /[A-Za-z0-9+]/.test(s[i])) {
      // An X takes the next letter as its allele; another letter does unless
      // it starts the next allele of the same gene (the I in IAIB). Away from
      // an X, a digit is a subscript, the way R1 R2 is usually meant.
      const next = s[i]
      const starts = cross === 'x-linked' ? next === 'X' || next === 'Y' : next.toLowerCase() === gene
      if (!starts) {
        if (cross !== 'x-linked' && /\d/.test(next)) a.sub = next
        else a.sup = next
        i++
      }
    }
    alleles.push(a)
  }
  return { ok: true, value: alleles }
}

/** The gene an allele belongs to: its letter (T and t are one gene, so are
 *  Cᴿ and Cᵂ, and Iᴬ and i), or the X and Y on an X-linked cross. */
const geneOf = (a: Allele, cross: Cross) => (cross === 'x-linked' ? 'X' : a.base.toLowerCase())

const shown = (alleles: Allele[]) => alleles.map(alleleId).join('')

/** One parent's genotype, grouped into genes in `order` (the first parent's,
 *  for the second) or in the order typed. */
function readParent(typed: string, cross: Cross, dominance: Dominance, order?: string[]): Read<Genotype> {
  const read = readAlleles(typed, cross, dominance)
  if (!read.ok) return read
  const alleles = read.value
  const it = `“${typed.trim()}”`

  if (cross === 'x-linked') {
    const xs = alleles.filter((a) => a.chromosome === 'X')
    const ys = alleles.filter(isY)
    if (alleles.some((a) => isY(a) && (a.sup || a.sub))) return fail(`${it}: a Y chromosome carries no allele, so it has no superscript.`)
    if (alleles.some((a) => a.sub)) return fail(`${it}: write each X’s allele as its superscript, like X^H, not a subscript.`)
    if (xs.some((a) => !a.sup)) return fail(`${it}: give each X its allele as a superscript, like X^H or X^h.`)
    if (xs.length + ys.length !== 2 || ys.length > 1) {
      return fail(`${it}: a mother has two X chromosomes (X^H X^h) and a father an X and a Y (X^H Y).`)
    }
    return { ok: true, value: [sortAlleles(alleles)] }
  }

  if (dominance === 'complete' && alleles.some((a) => a.sup || a.sub)) {
    return fail('Superscripts and subscripts are for incomplete dominance and codominance. With complete dominance, use letters like Tt.')
  }
  const genes = new Map<string, Allele[]>()
  for (const a of alleles) genes.set(geneOf(a, cross), [...(genes.get(geneOf(a, cross)) ?? []), a])
  const wanted = cross === 'dihybrid' ? 2 : 1
  if (genes.size !== wanted) {
    if (cross === 'monohybrid' && genes.size === 2) return fail(`${it} has two genes. Choose Dihybrid for a two-gene cross.`)
    if (cross === 'dihybrid' && genes.size === 1) return fail(`${it} has one gene. A dihybrid cross needs two in each parent, like RrYy.`)
    return fail(`${it} has ${genes.size} genes. Each parent needs ${wanted === 1 ? 'one gene, like Tt' : 'two genes, like RrYy'}.`)
  }
  for (const [, g] of genes) {
    if (g.length !== 2) {
      const letter = cross === 'dihybrid' ? ` of ${g[0].base.toUpperCase()}` : ''
      return fail(`${it} has ${g.length === 1 ? 'one allele' : `${g.length} alleles`}${letter}. Each gene has two, like ${cross === 'dihybrid' ? 'RrYy' : 'Tt'}.`)
    }
  }
  const keys = order ?? [...genes.keys()]
  if (keys.length !== genes.size || keys.some((k) => !genes.has(k))) {
    return fail(`Both parents need the same gene${wanted > 1 ? 's' : ''}: ${shown(alleles)} doesn’t match the first parent.`)
  }
  return { ok: true, value: keys.map((k) => sortAlleles(genes.get(k)!)) }
}

export interface ParsedCross {
  cross: Cross
  dominance: Dominance
  /** the first parent, across the top, then the second, down the side */
  parents: [Genotype, Genotype]
}

function readBoth(a: string, b: string, cross: Cross, dominance: Dominance): Read<ParsedCross> {
  const first = readParent(a, cross, dominance)
  if (!first.ok) return first
  const order = cross === 'x-linked' ? undefined : first.value.map((gene) => geneOf(gene[0], cross))
  const second = readParent(b, cross, dominance, order)
  if (!second.ok) return second
  const parents: [Genotype, Genotype] = [first.value, second.value]
  if (cross === 'x-linked' && isFemale(parents[0]) === isFemale(parents[1])) {
    return fail(`An X-linked cross needs a mother (two X chromosomes) and a father (an X and a Y).`)
  }
  if (dominance === 'complete') {
    // With complete dominance each gene has just its two letters, T and t.
    for (let g = 0; g < parents[0].length; g++) {
      const all = parents.flatMap((p) => p[g]).filter((x) => !isY(x))
      const kinds = new Set(all.map((x) => letters(x).toLowerCase()))
      if (kinds.size > 1) {
        const ex = cross === 'x-linked' ? 'X^H and X^h' : 'T and t'
        return fail(`With complete dominance a gene’s alleles share one letter, like ${ex}. For more, choose incomplete dominance or codominance.`)
      }
    }
  }
  return { ok: true, value: { cross, dominance, parents } }
}

/** A cross as typed: two genotypes with an × (or x, or *) between them. It
 *  forgives the order alleles are typed in (aA is Aa), spaces, and a missing
 *  separator when only one split reads as two parents ("TtxTt"). */
export function parseCross(text: string, cross: Cross, dominance: Dominance): Read<ParsedCross> {
  // A dihybrid cross here is always two genes with complete dominance.
  if (cross === 'dihybrid') dominance = 'complete'
  const t = text.trim()
  if (!t) return fail('Type both parents’ genotypes, like Tt × tt.')
  const parts = t.split(/\s*[×✕✖*]\s*|\s+[xX]\s+/).filter((p) => p.trim())
  if (parts.length === 2) return readBoth(parts[0], parts[1], cross, dominance)
  if (parts.length > 2) return fail('A cross has two parents. Put one × between them, like Tt × tt.')
  for (let i = 1; i < t.length - 1; i++) {
    if (t[i] !== 'x' && t[i] !== 'X') continue
    const both = readBoth(t.slice(0, i), t.slice(i + 1), cross, dominance)
    if (both.ok) return both
  }
  return fail('Put an × (or x) between the two parents, like Tt x tt.')
}

/** The cross written back in standard form, as the cross box shows it after
 *  typing: "Aa × aa", "RrYy × RrYy", "X^H X^h × X^H Y", "I^A i × I^B i",
 *  "R_1 R_2 × R_1 R_2". */
export function crossText(p: ParsedCross) {
  const spaced = p.cross === 'x-linked' || p.parents.some((g) => g.some((gene) => gene.some((a) => a.sup || a.sub)))
  const one = (g: Genotype) => g.map((gene) => gene.map(alleleId).join(spaced ? ' ' : '')).join(spaced ? ' ' : '')
  return `${one(p.parents[0])} × ${one(p.parents[1])}`
}

// ── The square ──────────────────────────────────────────────────────────────

/** Each gamete a parent makes, one allele from each gene: Aa → A, a, and
 *  AaBb → AB, Ab, aB, ab (first with first, first with last, and so on). */
export function gametes(g: Genotype): Gamete[] {
  return g.reduce<Gamete[]>((made, gene) => made.flatMap((gamete) => gene.map((a) => [...gamete, a])), [[]])
}

/** The offspring of two gametes, each gene's alleles in standard order. */
export const offspring = (a: Gamete, b: Gamete): Genotype => a.map((allele, i) => sortAlleles([allele, b[i]]))

export interface Square extends ParsedCross {
  top: Gamete[]
  side: Gamete[]
  /** cells[row][column]: row from the side parent's gametes, column from the top's */
  cells: Genotype[][]
}

export function square(p: ParsedCross): Square {
  const top = gametes(p.parents[0])
  const side = gametes(p.parents[1])
  return { ...p, top, side, cells: side.map((s) => top.map((t) => offspring(t, s))) }
}

// ── Phenotypes and counts ───────────────────────────────────────────────────

/** Does dominant allele `top` hide `low` in a heterozygote? Always with
 *  complete dominance. Otherwise only when they're different letters (Iᴬ
 *  hides i), not the same letter in two cases (R and r blend to pink). */
function hides(top: Allele, low: Allele, dominance: Dominance) {
  if (!isTop(top) || isTop(low) || isY(low)) return false
  return dominance === 'complete' || letters(top).toLowerCase() !== letters(low).toLowerCase()
}

/** The alleles a gene's phenotype shows: tall for TT and Tt is just T; pink
 *  is Cᴿ and Cᵂ together; type A is Iᴬ (in IᴬIᴬ and Iᴬi). Y shows nothing. */
export function shownAlleles(gene: Allele[], dominance: Dominance): Allele[] {
  const distinct = sortAlleles(gene.filter((a) => !isY(a))).filter((a, i, all) => i === all.findIndex((b) => sameAllele(a, b)))
  return distinct.filter((low) => !distinct.some((top) => hides(top, low, dominance)))
}

/** A gene's phenotype as a key for its name: "T", "t", "C^R+C^W", "i". */
export const geneClass = (gene: Allele[], dominance: Dominance) => shownAlleles(gene, dominance).map(alleleId).join('+')

/** A whole phenotype's key, one gene's class after another: "R Y". */
export const phenotypeKey = (g: Genotype, dominance: Dominance) => g.map((gene) => geneClass(gene, dominance)).join(' ')

export const genotypeKey = (g: Genotype) => g.map((gene) => gene.map(alleleId).join('')).join('')

/** Every allele in the cross, dominant first: the order genotypes and
 *  phenotypes are listed in (1 TT : 2 Tt : 1 tt). */
function alleleRanks(sq: Square) {
  const all = sortAlleles(sq.parents.flat(2)).filter((a, i, list) => i === list.findIndex((b) => sameAllele(a, b)))
  return (a: Allele) => all.findIndex((b) => sameAllele(a, b))
}

const compareLists = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]
  return a.length - b.length
}

export interface Tally<T> {
  key: string
  /** one offspring of this kind, to write it from */
  example: Genotype
  /** its alleles (for a genotype) or the alleles its phenotype shows, gene by gene */
  value: T
  count: number
}

/** How many cells hold each genotype, in the standard order: homozygous
 *  dominant, heterozygous, homozygous recessive; daughters before sons. */
export function genotypeCounts(sq: Square, cells = sq.cells.flat()): Tally<Genotype>[] {
  const rank = alleleRanks(sq)
  const tallies = new Map<string, Tally<Genotype>>()
  for (const g of cells) {
    const key = genotypeKey(g)
    const t = tallies.get(key) ?? { key, example: g, value: g, count: 0 }
    t.count++
    tallies.set(key, t)
  }
  const order = (g: Genotype) => [isFemale(g) ? 0 : 1, ...g.flat().map(rank)]
  return [...tallies.values()].sort((a, b) => compareLists(order(a.value), order(b.value)))
}

/** How many cells show each phenotype, dominant first (9 round yellow : 3
 *  round green : 3 wrinkled yellow : 1 wrinkled green). */
export function phenotypeCounts(sq: Square, cells = sq.cells.flat()): Tally<Allele[][]>[] {
  const rank = alleleRanks(sq)
  const tallies = new Map<string, Tally<Allele[][]>>()
  for (const g of cells) {
    const key = phenotypeKey(g, sq.dominance)
    const t = tallies.get(key) ?? { key, example: g, value: g.map((gene) => shownAlleles(gene, sq.dominance)), count: 0 }
    t.count++
    tallies.set(key, t)
  }
  const order = (v: Allele[][]) => v.flatMap((gene) => [...gene.map(rank), -1])
  return [...tallies.values()].sort((a, b) => compareLists(order(a.value), order(b.value)))
}

/** The X-linked phenotypes split by sex, as they're usually asked about:
 *  what share of daughters, and of sons, show each. */
export function phenotypesBySex(sq: Square) {
  const all = sq.cells.flat()
  return {
    daughters: phenotypeCounts(sq, all.filter(isFemale)),
    sons: phenotypeCounts(sq, all.filter((g) => !isFemale(g))),
  }
}

/** Every phenotype a gene can show in this cross, as name keys, in order:
 *  what the teacher names (T: tall, t: short; or C^R: red, C^R+C^W: pink…). */
export function geneClasses(sq: Square): { key: string; alleles: Allele[]; hides: boolean }[][] {
  const rank = alleleRanks(sq)
  return sq.parents[0].map((_, g) => {
    const seen = new Map<string, { key: string; alleles: Allele[]; hides: boolean }>()
    const everyAllele = sq.parents.flatMap((p) => p[g]).filter((a) => !isY(a))
    for (const cell of sq.cells.flat()) {
      const alleles = shownAlleles(cell[g], sq.dominance)
      const key = alleles.map(alleleId).join('+')
      if (seen.has(key)) continue
      // Whether this phenotype can hide another allele (T_ in TT or Tt), for
      // writing it without a name.
      const masks = alleles.length === 1 && everyAllele.some((low) => hides(alleles[0], low, sq.dominance))
      seen.set(key, { key, alleles, hides: masks })
    }
    // A parent's phenotype a cell might not show (TT × TT has no short ones)
    // is still worth naming, so the summary reads the same as the cross changes.
    for (const p of sq.parents) {
      const alleles = shownAlleles(p[g], sq.dominance)
      const key = alleles.map(alleleId).join('+')
      if (!seen.has(key)) seen.set(key, { key, alleles, hides: alleles.length === 1 && everyAllele.some((low) => hides(alleles[0], low, sq.dominance)) })
    }
    return [...seen.values()].sort((a, b) => compareLists(a.alleles.map(rank), b.alleles.map(rank)))
  })
}

// ── Ratios ──────────────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** Counts in lowest terms: 2 : 2 → 1 : 1, 9 : 3 : 3 : 1 stays. */
export function reduced(counts: number[]) {
  const d = counts.reduce(gcd, 0) || 1
  return counts.map((c) => c / d)
}

/** A share of the whole as a percentage: 25%, 12.5%, 6.25%. */
export const percent = (count: number, total: number) => `${Math.round((count / total) * 10000) / 100}%`

/** A share as a fraction in lowest terms: 1/4, 3/16, 1/8. */
export function fraction(count: number, total: number) {
  const d = gcd(count, total) || 1
  return `${count / d}/${total / d}`
}
