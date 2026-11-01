// What the square adds up to, written out: phenotype names, and the
// genotype and phenotype ratios printed under it (1 TT : 2 Tt : 1 tt; 3 tall
// : 1 short; 9 : 3 : 3 : 1), or as percentages or fractions.

import {
  alleleId,
  fraction,
  geneClasses,
  genotypeCounts,
  percent,
  phenotypeCounts,
  phenotypesBySex,
  reduced,
  type Allele,
  type Square,
  type Tally,
} from './genetics'
import type { Form } from './settings'
import { allelesRuns, genotypeRuns, text, type Chunk, type Run } from './text'

/** A phenotype a gene shows in this cross, for naming: its key, the alleles
 *  it shows, and how it's written without a name (T_ for TT or Tt, tt,
 *  CᴿCᵂ). */
export interface GeneClass {
  key: string
  alleles: Allele[]
  unnamed: Run[]
}

export function classesOf(sq: Square): GeneClass[][] {
  return geneClasses(sq).map((gene) =>
    gene.map((c) => {
      const one = c.alleles.length === 1
      const unnamed = !one
        ? allelesRuns(c.alleles)
        : c.hides
          ? [...allelesRuns(c.alleles), text('_', 'allele')]
          : sq.cross === 'x-linked'
            ? allelesRuns(c.alleles)
            : allelesRuns([c.alleles[0], c.alleles[0]])
      return { key: c.key, alleles: c.alleles, unnamed }
    }),
  )
}

/** A phenotype written out: each gene's name, or how it's written unnamed,
 *  one after another ("round yellow", "T_"). */
export function phenotypeRuns(classes: GeneClass[][], names: Map<string, string>, shown: Allele[][]): Run[] {
  const parts = shown.map((alleles, g) => {
    const key = alleles.map(alleleId).join('+')
    const name = names.get(key)?.trim()
    return { named: !!name, runs: name ? [text(name)] : (classes[g].find((c) => c.key === key)?.unnamed ?? allelesRuns(alleles)) }
  })
  // Names take a space between them (round yellow); unnamed genes run
  // together the way genotypes do (A_B_).
  return parts.flatMap((p, g) => (g && (p.named || parts[g - 1].named) ? [text(' '), ...p.runs] : p.runs))
}

/** Tallies as chunks of one line: "1 TT :", "2 Tt :", "1 tt" for a ratio,
 *  "25% TT,", … for percentages. Just one kind is "all Tt" or "100% Tt". */
function tallyChunks<T>(tallies: Tally<T>[], runsOf: (t: Tally<T>) => Run[], form: Form): Chunk[] {
  const total = tallies.reduce((sum, t) => sum + t.count, 0)
  if (!total) return []
  if (tallies.length === 1) return [[text(form === 'percent' ? '100% ' : 'all '), ...runsOf(tallies[0])]]
  const counts = reduced(tallies.map((t) => t.count))
  return tallies.map((t, i) => {
    const amount = form === 'ratio' ? String(counts[i]) : form === 'percent' ? percent(t.count, total) : fraction(t.count, total)
    const last = i === tallies.length - 1
    return [text(`${amount} `), ...runsOf(t), ...(last ? [] : [text(form === 'ratio' ? ' :' : ',')])]
  })
}

/** One printed summary line: its bold heading, then what it says (or a
 *  blank line for students, when `content` is empty). */
export interface SummaryLine {
  heading: string
  content: Chunk[]
}

export function genotypeLine(sq: Square, form: Form): SummaryLine {
  return {
    heading: form === 'ratio' ? 'Genotype ratio:' : 'Genotypes:',
    content: tallyChunks(genotypeCounts(sq), (t) => genotypeRuns(t.value), form),
  }
}

/** The phenotype line, or for an X-linked cross one for daughters and one
 *  for sons, which is how those crosses are asked about. */
export function phenotypeLines(sq: Square, names: Map<string, string>, form: Form): SummaryLine[] {
  const classes = classesOf(sq)
  const runsOf = (t: Tally<Allele[][]>) => phenotypeRuns(classes, names, t.value)
  if (sq.cross === 'x-linked') {
    const { daughters, sons } = phenotypesBySex(sq)
    return [
      { heading: 'Daughters:', content: tallyChunks(daughters, runsOf, form) },
      { heading: 'Sons:', content: tallyChunks(sons, runsOf, form) },
    ]
  }
  return [{ heading: form === 'ratio' ? 'Phenotype ratio:' : 'Phenotypes:', content: tallyChunks(phenotypeCounts(sq), runsOf, form) }]
}

/** Runs as plain text, for screen readers and tests: "1 TT : 2 Tt : 1 tt". */
export const plain = (runs: Run[]) => runs.map((r) => r.text).join('')
export const plainLine = (line: SummaryLine) => `${line.heading} ${line.content.map(plain).join(' ')}`
