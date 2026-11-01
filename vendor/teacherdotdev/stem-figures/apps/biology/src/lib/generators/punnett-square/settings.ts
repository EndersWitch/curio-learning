// Punnett Square's settings, as they appear in the page address, and the
// common crosses the teacher can start from. The cross is kept as typed
// (only a cross that reads correctly is ever kept), with the phenotype names
// the teacher gave each allele or blend.

import { bool, choice, defineSettings, number, text } from '$shared/settings'
import { CROSSES, DOMINANCE, parseCross, square, type Cross, type Dominance, type Square } from './genetics'

export const PARENT_LABELS = ['genotype', 'sex', 'mother', 'none'] as const
export type ParentLabels = (typeof PARENT_LABELS)[number]

export const SHOWN_BLANK = ['shown', 'blank'] as const
export const CELLS = ['filled', 'blank', 'some'] as const
export const SUMMARY_LINE = ['shown', 'blank', 'none'] as const
export const FORMS = ['ratio', 'percent', 'fraction'] as const
export type Form = (typeof FORMS)[number]
export const LABEL_SIZES = ['small', 'medium', 'large'] as const

/** The cross each kind starts with when the teacher switches to it. */
export const STARTING_CROSS: Record<Cross, { parents: string; names: string }> = {
  monohybrid: { parents: 'Tt × Tt', names: 'T:tall;t:short' },
  dihybrid: { parents: 'RrYy × RrYy', names: 'R:round;r:wrinkled;Y:yellow;y:green' },
  'x-linked': { parents: 'X^H X^h × X^H Y', names: 'X^H:unaffected;X^h:hemophilia' },
}

/** What a monohybrid cross switches to with each kind of dominance. */
export const STARTING_BLEND: Record<Dominance, { parents: string; names: string }> = {
  complete: STARTING_CROSS.monohybrid,
  incomplete: { parents: 'C^R C^W × C^R C^W', names: 'C^R:red;C^R+C^W:pink;C^W:white' },
  codominance: { parents: 'I^A i × I^B i', names: 'I^A:type A;I^A+I^B:type AB;I^B:type B;i:type O' },
}

/** The cross a kind starts with: a monohybrid one by its dominance, and an
 *  X-linked one without complete dominance a tortoiseshell cat's coat. */
export function startingCross(cross: Cross, dominance: Dominance) {
  if (cross === 'monohybrid') return STARTING_BLEND[dominance]
  if (cross === 'x-linked' && dominance !== 'complete') {
    return { parents: 'X^B X^O × X^O Y', names: 'X^B:black;X^B+X^O:tortoiseshell;X^O:orange' }
  }
  return STARTING_CROSS[cross]
}

export const punnettSettings = defineSettings(
  {
    cross: choice(CROSSES, 'monohybrid'),
    dominance: choice(DOMINANCE, 'complete'),
    /** the two parents as typed: the first across the top, the second down the side */
    parents: text(STARTING_CROSS.monohybrid.parents, 60),
    /** each phenotype's name, keyed by the alleles it shows: "T:tall;t:short" */
    names: text(STARTING_CROSS.monohybrid.names, 300),
    parentLabels: choice(PARENT_LABELS, 'genotype'),
    parentGenotypes: choice(SHOWN_BLANK, 'shown'),
    gametes: choice(SHOWN_BLANK, 'shown'),
    cells: choice(CELLS, 'filled'),
    /** with some cells blank, which: bit (row × size + column) of this number */
    blanks: number({ min: 0, max: 65535, fallback: 0 }),
    /** each cell's phenotype written under its genotype */
    cellNames: bool(false),
    /** shading: '' for none, 'each' for every phenotype its own pattern, or one phenotype's key */
    shade: text('', 60),
    genotypeRatio: choice(SUMMARY_LINE, 'shown'),
    phenotypeRatio: choice(SUMMARY_LINE, 'shown'),
    form: choice(FORMS, 'ratio'),
    labelSize: choice(LABEL_SIZES, 'medium'),
    titleMode: choice(['none', 'text'] as const, 'none'),
    title: text(''),
    /** a question or instructions above the square */
    question: text('', 300),
  },
  (s) => {
    const dominance = s.cross === 'dihybrid' ? 'complete' : s.dominance
    // A cross that doesn't read (from an edited link, say) is the kind's starting one.
    const parents = parseCross(s.parents, s.cross, dominance).ok ? s.parents : startingCross(s.cross, dominance).parents
    const size = s.cross === 'dihybrid' ? 4 : 2
    const blanks = Math.round(s.blanks) & (2 ** (size * size) - 1)
    return { ...s, dominance, parents, blanks }
  },
)

export type PunnettSettings = typeof punnettSettings.defaults

/** The square for a set of settings. Tidied settings always hold a cross
 *  that reads; anything else draws Mendel's Tt × Tt. */
export function squareOf(s: PunnettSettings): Square {
  const read = parseCross(s.parents, s.cross, s.dominance)
  if (read.ok) return square(read.value)
  const start = parseCross(STARTING_CROSS.monohybrid.parents, 'monohybrid', 'complete')
  if (!start.ok) throw new Error(start.error)
  return square(start.value)
}

// ── Phenotype names ─────────────────────────────────────────────────────────

/** The names as a map from key to name. */
export function readNames(names: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const pair of names.split(';')) {
    const at = pair.indexOf(':')
    if (at > 0) map.set(pair.slice(0, at), pair.slice(at + 1))
  }
  return map
}

/** The names written for the address, leaving out empty ones. A name can't
 *  hold ; or :, which separate them. */
export function writeNames(map: Map<string, string>): string {
  return [...map]
    .map(([k, v]) => [k, v.replace(/[;:]/g, '').slice(0, 40)])
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

/** One name set, keeping the rest. */
export const withName = (names: string, key: string, name: string) => writeNames(new Map(readNames(names)).set(key, name))

// ── Common crosses ──────────────────────────────────────────────────────────

/** The crosses most units start from. Each sets the cross and its names and
 *  starts the square filled in and unshaded, keeping how the rest is shown. */
export const COMMON_CROSSES: { name: string; settings: Partial<PunnettSettings> }[] = [
  { name: 'Mendel’s pea plants', settings: { cross: 'monohybrid', dominance: 'complete', parents: 'Tt × Tt', names: 'T:tall;t:short' } },
  { name: 'Test cross', settings: { cross: 'monohybrid', dominance: 'complete', parents: 'Tt × tt', names: 'T:tall;t:short' } },
  {
    name: 'Dihybrid cross',
    settings: { cross: 'dihybrid', dominance: 'complete', parents: 'RrYy × RrYy', names: 'R:round;r:wrinkled;Y:yellow;y:green' },
  },
  {
    name: 'Color blindness',
    settings: { cross: 'x-linked', dominance: 'complete', parents: 'X^B X^b × X^B Y', names: 'X^B:normal vision;X^b:color-blind', parentLabels: 'sex' },
  },
  {
    name: 'Snapdragon color',
    settings: { cross: 'monohybrid', dominance: 'incomplete', parents: 'C^R C^W × C^R C^W', names: 'C^R:red;C^R+C^W:pink;C^W:white' },
  },
  {
    name: 'ABO blood type',
    settings: { cross: 'monohybrid', dominance: 'codominance', parents: 'I^A i × I^B i', names: STARTING_BLEND.codominance.names },
  },
]

/** The settings with a common cross applied. */
export const withCross = (s: PunnettSettings, cross: Partial<PunnettSettings>): PunnettSettings => ({
  ...s,
  cells: 'filled',
  blanks: 0,
  shade: '',
  ...cross,
})
