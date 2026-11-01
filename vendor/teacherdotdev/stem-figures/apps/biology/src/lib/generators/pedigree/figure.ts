// Everything the Pedigree figure draws, worked out from the settings: the
// laid-out family, each person's genotype label, and the key below.

import { everyone, type Member, type Person, type Sex } from './family'
import { genotypeLabel, labelText, MODE_NAMES, possibleGenotypes, type Allele, type Mode } from './genetics'
import { GENOTYPE_FONT, layoutPedigree, NUMBER_FONT, textWidth, type PedigreeLayout } from './layout'
import type { PedigreeSettings } from './settings'

/** The width of a blank line for a genotype. */
export const BLANK_WIDTH = 40
/** A superscript's size, as a share of the label's. */
export const SUP_SCALE = 0.7

export const KEY_SYMBOL = 22
export const KEY_FONT = 14
const KEY_PAD = 12
const KEY_ROW = 32
const KEY_GAP = 22
const KEY_TOP = 26

/** How wide a genotype label is written. */
export function labelWidth(label: Allele[], size = GENOTYPE_FONT) {
  return label.reduce((w, a) => w + textWidth(a.text, size) + (a.sup ? textWidth(a.sup, size * SUP_SCALE) + 1 : 0), 0)
}

export interface KeyEntry {
  person: Person
  text: string
}

export interface KeyLayout {
  x: number
  y: number
  width: number
  height: number
  entries: (KeyEntry & { x: number; y: number })[]
}

export interface PedigreeFigure {
  width: number
  height: number
  /** the pedigree's left edge in the figure, when the key is wider */
  dx: number
  layout: PedigreeLayout
  /** each person's genotype label, by refKey; missing when it can't be told */
  labels: Map<string, Allele[]>
  key?: KeyLayout
  /** false when the family can't be explained by the chosen mode */
  fits: boolean
}

/** The key's lines: the symbols for each sex, affected or not, then
 *  whichever other marks the family has. */
export function keyEntries(family: Member, carriersShown: boolean): KeyEntry[] {
  const all = [...everyone(family)].map((e) => e.person)
  const p = (sex: Sex, over: Partial<Person> = {}): Person => ({ sex, affected: false, carrier: false, deceased: false, proband: false, ...over })
  const entries: KeyEntry[] = [
    { person: p('m'), text: 'Unaffected male' },
    { person: p('m', { affected: true }), text: 'Affected male' },
    { person: p('f'), text: 'Unaffected female' },
    { person: p('f', { affected: true }), text: 'Affected female' },
  ]
  if (carriersShown) {
    if (all.some((x) => x.carrier && !x.affected && x.sex === 'm')) entries.push({ person: p('m', { carrier: true }), text: 'Carrier male' })
    if (all.some((x) => x.carrier && !x.affected && x.sex === 'f')) entries.push({ person: p('f', { carrier: true }), text: 'Carrier female' })
  }
  if (all.some((x) => x.sex === 'u')) entries.push({ person: p('u'), text: 'Sex unknown' })
  const deceased = all.find((x) => x.deceased)
  if (deceased) entries.push({ person: p(deceased.sex === 'u' ? 'm' : deceased.sex, { deceased: true }), text: 'Deceased' })
  const proband = all.find((x) => x.proband)
  if (proband) entries.push({ person: p(proband.sex === 'u' ? 'm' : proband.sex, { proband: true }), text: 'Proband' })
  return entries
}

/** The key laid out in as many columns as fit across `width`, two at least. */
function layoutKey(entries: KeyEntry[], width: number): Omit<KeyLayout, 'x' | 'y'> {
  const col = Math.max(...entries.map((e) => KEY_SYMBOL + 10 + textWidth(e.text, KEY_FONT))) + KEY_GAP
  const cols = Math.max(2, Math.min(entries.length, Math.floor((width - 2 * KEY_PAD + KEY_GAP) / col)))
  const rows = Math.ceil(entries.length / cols)
  return {
    width: cols * col - KEY_GAP + 2 * KEY_PAD + 8,
    height: rows * KEY_ROW + 2 * KEY_PAD - 6,
    entries: entries.map((e, i) => ({
      ...e,
      x: KEY_PAD + 4 + (i % cols) * col,
      y: KEY_PAD + KEY_ROW / 2 - 3 + Math.floor(i / cols) * KEY_ROW,
    })),
  }
}

export function pedigreeFigure(s: PedigreeSettings, family: Member): PedigreeFigure {
  const mode = s.mode as Mode
  const carriersShown = s.carriers !== 'none'
  const sets = possibleGenotypes(family, mode, carriersShown)
  const fits = !!sets && [...sets.values()].every((g) => g.length > 0)
  const labels = new Map<string, Allele[]>()
  if (s.genotypes === 'answers' && sets && fits) {
    for (const [key, genotypes] of sets) {
      const label = genotypeLabel(mode, genotypes, s.letter)
      if (label) labels.set(key, label)
    }
  }
  const widest = Math.max(
    s.numbers ? textWidth('99', NUMBER_FONT) : 0,
    s.genotypes === 'blank' ? BLANK_WIDTH : 0,
    ...[...labels.values()].map((l) => labelWidth(l)),
  )
  const layout = layoutPedigree(family, { numbers: s.numbers, numerals: s.numerals, genotypes: s.genotypes !== 'none', labelWidth: widest })

  let width = layout.width
  let height = layout.height
  let key: KeyLayout | undefined
  if (s.key) {
    const k = layoutKey(keyEntries(family, carriersShown), layout.width)
    width = Math.max(width, k.width)
    key = { ...k, x: (width - k.width) / 2, y: height + KEY_TOP }
    height = key.y + k.height
  }
  return { width, height, dx: (width - layout.width) / 2, layout, labels, key, fits }
}

/** The answer key line: the family's inheritance mode. */
export const answerText = (mode: Mode) => `${MODE_NAMES[mode]} inheritance`

/** The figure described for screen readers. */
export function describeFigure(s: PedigreeSettings, fig: PedigreeFigure) {
  const people = fig.layout.people
  const affected = people.filter((p) => p.person.affected).map((p) => p.name)
  const parts = [
    `Pedigree of ${people.length} people over ${Math.max(...people.map((p) => p.generation)) + 1} generations`,
    affected.length ? `affected: ${affected.join(', ')}` : 'no one affected',
  ]
  if (s.carriers !== 'none') {
    const carriers = people.filter((p) => p.person.carrier && !p.person.affected).map((p) => p.name)
    if (carriers.length) parts.push(`carriers: ${carriers.join(', ')}`)
  }
  const deceased = people.filter((p) => p.person.deceased).map((p) => p.name)
  if (deceased.length) parts.push(`deceased: ${deceased.join(', ')}`)
  if (fig.labels.size) {
    parts.push(`genotypes: ${people.map((p) => (fig.labels.get(p.key) ? `${p.name} ${labelText(fig.labels.get(p.key)!)}` : '')).filter(Boolean).join(', ')}`)
  }
  return `${parts.join('; ')}.`
}
