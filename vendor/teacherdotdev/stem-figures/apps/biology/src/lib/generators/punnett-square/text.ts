// The text on a Punnett square, as runs of one style each, so alleles can be
// set the way genetics texts set them: italic serif letters (T, t), with the
// allele on an X or a codominant allele as a superscript (Xᴴ, Cᴿ, Iᴬ) or a
// subscript (R₁), and X and Y upright, since they're chromosomes rather than genes. Widths are
// estimated from typical letter widths, since the figure is laid out on the
// server where nothing can be measured.

import { alleleId, type Allele, type Genotype } from './genetics'

export type RunStyle = 'text' | 'bold' | 'allele' | 'sup' | 'sub' | 'chromosome' | 'symbol'

export interface Run {
  text: string
  style: RunStyle
}

/** The serif the alleles are set in. Its italic I is plainly not an l. */
export const ALLELE_FONT = "Georgia, 'Times New Roman', Times, serif"
/** A superscript's or subscript's size, how far a superscript is raised and
 *  how far a subscript is lowered, as fractions of the text size. */
export const SUP_SIZE = 0.62
export const SUP_RISE = 0.38
export const SUB_DROP = 0.2
/** The ♀ and ♂ signs are drawn this much bigger, to stand level with the letters. */
export const SYMBOL_SIZE = 1.25

export const text = (t: string, style: RunStyle = 'text'): Run => ({ text: t, style })

export function alleleRuns(a: Allele): Run[] {
  if (a.chromosome === 'X') return [text('X', 'chromosome'), text(a.sup, 'sup')]
  if (a.chromosome === 'Y') return [text('Y', 'chromosome')]
  return [text(a.base, 'allele'), ...(a.sub ? [text(a.sub, 'sub')] : []), ...(a.sup ? [text(a.sup, 'sup')] : [])]
}

/** Runs set in the serif the alleles are, and those set small. */
export const isSerif = (style: RunStyle) => style === 'allele' || style === 'sup' || style === 'sub' || style === 'chromosome'
export const isScript = (style: RunStyle) => style === 'sup' || style === 'sub'

/** A genotype or gamete, its genes written one after another: AaBb, XᴴY. */
export const allelesRuns = (alleles: Allele[]) => alleles.flatMap(alleleRuns)
export const genotypeRuns = (g: Genotype) => g.flatMap(allelesRuns)

/** Plain text for screen readers and the settings: "C^R C^W" is "CR CW", "R_1" is "R1". */
export const plainAlleles = (alleles: Allele[]) => alleles.map((a) => alleleId(a).replace(/[\^_{}]/g, '')).join('')

// Rough advance widths, in ems, of Arial and of Georgia italic.
const SANS: Record<string, number> = { ' ': 0.28, ':': 0.28, ',': 0.28, '.': 0.28, '/': 0.28, '%': 0.89, '·': 0.33, '_': 0.56, '♀': 0.6, '♂': 0.75, '(': 0.33, ')': 0.33, '–': 0.56, '—': 1 }
const NARROW = new Set([...'fijlrtI'])
const WIDE = new Set([...'mwMW'])

function charWidth(c: string, style: RunStyle) {
  const serif = isSerif(style)
  if (!serif && SANS[c] !== undefined) return SANS[c] * (style === 'bold' && c !== ' ' ? 1.05 : 1)
  if (/\d/.test(c)) return 0.56
  const upper = c !== c.toLowerCase()
  let w = upper ? 0.68 : 0.52
  if (NARROW.has(c)) w = c === 'I' ? (serif ? 0.42 : 0.3) : 0.32
  if (WIDE.has(c)) w = upper ? 0.92 : 0.8
  if (serif) w *= upper ? 1 : 0.96
  return style === 'bold' ? w * 1.06 : w
}

/** A run's width at text size `size` (a superscript or subscript is smaller). */
export const runWidth = (r: Run, size: number) =>
  [...r.text].reduce((sum, c) => sum + charWidth(c, r.style), 0) * size * (isScript(r.style) ? SUP_SIZE : r.style === 'symbol' ? SYMBOL_SIZE : 1)

export const runsWidth = (runs: Run[], size: number) => runs.reduce((sum, r) => sum + runWidth(r, size), 0)

/** A piece of a line that's never broken: a word, or "2 Tt". */
export type Chunk = Run[]

/** Chunks laid into lines no wider than `width`, a space between chunks. */
export function wrap(chunks: Chunk[], size: number, width: number): Run[][] {
  const space = runWidth(text(' '), size)
  const lines: Run[][] = []
  let line: Run[] = []
  let used = 0
  for (const chunk of chunks) {
    const w = runsWidth(chunk, size)
    if (line.length && used + space + w > width) {
      lines.push(line)
      line = []
      used = 0
    }
    if (line.length) {
      line.push(text(' '))
      used += space
    }
    line.push(...chunk)
    used += w
  }
  if (line.length) lines.push(line)
  return lines
}

/** Prose split into words, each a chunk of plain text. */
export const words = (prose: string, style: RunStyle = 'text'): Chunk[] =>
  prose.split(/\s+/).filter(Boolean).map((w) => [text(w, style)])
