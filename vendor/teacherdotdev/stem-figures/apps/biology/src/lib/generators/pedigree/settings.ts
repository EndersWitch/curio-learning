// Pedigree's settings, as they appear in the page address. The family is
// either the random one for the mode, generations, size and seed, or one
// changed by hand, written out in `family` (see family.ts).

import { bool, choice, defineSettings, number, type Field } from '$shared/settings'
import { figureTextFields } from '$shared/figureText'
import { formatFamily, parseFamily, type Member } from './family'
import { MODES, type Mode } from './genetics'
import { randomFamily, SIZES } from './random'

export const MAX_SEED = 999999

/** How carriers are drawn: not at all, half filled, or with a dot in the middle. */
export const CARRIER_STYLES = ['none', 'half', 'dot'] as const
export type CarrierStyle = (typeof CARRIER_STYLES)[number]

/** The genotype row under each symbol: none, written out as the answers, or blank lines for students. */
export const GENOTYPE_ROWS = ['none', 'answers', 'blank'] as const
export type GenotypeRow = (typeof GENOTYPE_ROWS)[number]

/** A family changed by hand, or '' for the random one. Anything that
 *  doesn't read as a family is the random one. */
function familyField(): Field<string> {
  const accept = (v: unknown) => {
    if (typeof v !== 'string') return undefined
    if (v === '') return ''
    const family = parseFamily(v)
    return family ? formatFamily(family) : undefined
  }
  return { fallback: '', accept, parse: accept, format: (v) => v }
}

/** The allele letter, one letter A to Z, kept in capitals. */
function letterField(fallback: string): Field<string> {
  const accept = (v: unknown) => (typeof v === 'string' && /^[a-z]$/i.test(v) ? v.toUpperCase() : undefined)
  return { fallback, accept, parse: accept, format: (v) => v }
}

export const pedigreeSettings = defineSettings(
  {
    mode: choice(MODES, 'ar'),
    generations: number({ min: 2, max: 4, fallback: 3 }),
    size: choice(SIZES, 'medium'),
    // Seed 5 is a classic-looking default: unaffected carriers whose son and,
    // a generation later, granddaughter are affected.
    seed: number({ min: 1, max: MAX_SEED, fallback: 5 }),
    family: familyField(),
    carriers: choice(CARRIER_STYLES, 'none'),
    genotypes: choice(GENOTYPE_ROWS, 'none'),
    letter: letterField('A'),
    numerals: bool(true),
    numbers: bool(true),
    key: bool(true),
    ...figureTextFields(),
  },
  (s) => ({ ...s, generations: Math.round(s.generations), seed: Math.round(s.seed) }),
)

export type PedigreeSettings = typeof pedigreeSettings.defaults

/** A seed for a new random family. */
export const newSeed = () => 1 + Math.floor(Math.random() * MAX_SEED)

/** The family drawn: the one changed by hand, or the random one. */
export function familyOf(s: Pick<PedigreeSettings, 'family' | 'mode' | 'generations' | 'size' | 'seed'>): Member {
  return (s.family && parseFamily(s.family)) || randomFamily(s.mode as Mode, s.generations, s.size, s.seed)
}
