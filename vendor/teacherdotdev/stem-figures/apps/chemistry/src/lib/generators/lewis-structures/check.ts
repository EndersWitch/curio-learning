// The check: every way a structure is wrong, each written as a sentence for
// the answer key (see CONTEXT.md "Mistake"). It compares the structure with
// the rules and with the correct structures, atom by atom, so it doesn't
// matter how the structure came to be wrong, and a change that leaves it
// correct (another resonance structure) is no mistake at all.

import type { Rule } from './build'
import { canExpand, octetOf } from './elements'
import { chargeText, signed } from './formula'
import {
  electronKey,
  electronsAround,
  electronsShown,
  formalCharge,
  hasBrackets,
  shownCharge,
  valenceElectrons,
  type Structure,
} from './structure'

export interface CheckInput {
  structure: Structure
  /** the correct structures, with the same atoms in the same order */
  correct: Structure[]
  /** the formula as written in sentences, e.g. "CO₂" */
  name: string
  rule: Rule
  /** whether formal charges are drawn, so wrong ones are mistakes */
  formalCharges: boolean
  /** the element that should be in the middle, when a change put another there */
  shouldBeCentral?: string
}

const NUMBERS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
const counted = (n: number) => NUMBERS[n] ?? String(n)
const an = (symbol: string) => ('AEFHILMNORSX'.includes(symbol[0]) ? 'an' : 'a')

/** One sentence per kind of mistake, with the atoms it's on named: "S" when
 *  there's only one, "An O atom" or "Two O atoms" otherwise. */
type Say = (who: { name: string; has: string; it: string; each: string; many: boolean }) => string

function sayAbout(s: Structure, groups: Map<string, { element: string; count: number; say: Say }>) {
  return [...groups.values()].map(({ element, count, say }) => {
    const alone = s.atoms.filter((a) => a.element === element).length === 1
    const many = count > 1
    const name = many ? `${counted(count)} ${element} atoms` : alone ? element : `${an(element)[0].toUpperCase()}${an(element).slice(1)} ${element} atom`
    return say({ name, has: many ? 'have' : 'has', it: many ? 'them' : 'it', each: many ? 'each' : 'it', many })
  })
}

export function findMistakes({ structure: s, correct, name, rule, formalCharges, shouldBeCentral }: CheckInput): string[] {
  const mistakes: string[] = []
  const model = correct[0]
  if (!model) return mistakes
  const lowerFirst = (text: string) => (/^(A|An) /.test(text) ? text[0].toLowerCase() + text.slice(1) : text)

  // Which atoms bond to which.
  const skeletonChanged = shouldBeCentral !== undefined
  if (skeletonChanged) mistakes.push(`${shouldBeCentral} should be the central atom.`)
  else {
    const missing = new Map<string, number>()
    s.bonds.forEach((b, k) => {
      if (b.order > 0 || !model.bonds[k]?.order) return
      const pair = [s.atoms[b.a].element, s.atoms[b.b].element].sort((x, y) => (x === 'H' ? 1 : y === 'H' ? -1 : 0)).join(' and ')
      missing.set(pair, (missing.get(pair) ?? 0) + 1)
    })
    for (const [pair, n] of missing) mistakes.push(n === 1 ? `A bond between ${pair} is missing.` : `${counted(n)} bonds between ${pair} are missing.`)
  }

  // How many electrons it shows in all, and around each atom.
  const shown = electronsShown(s)
  const wanted = valenceElectrons(s)
  if (shown !== wanted) mistakes.push(`It shows ${shown} valence electrons, but ${name} has ${wanted}.`)

  const expected = (i: number) => {
    if (!skeletonChanged) return electronsAround(model, i)
    const same = model.atoms.findIndex((a) => a.element === s.atoms[i].element)
    return electronsAround(model, same)
  }
  const around = new Map<string, { element: string; count: number; say: Say }>()
  s.atoms.forEach((atom, i) => {
    const n = electronsAround(s, i)
    const m = expected(i)
    // An atom on its own: the count of valence electrons already says it.
    if (n === m || s.atoms.length === 1) return
    const el = atom.element
    let say: Say
    if (n > m && !canExpand(el) && n > octetOf(el))
      say = el === 'H' || el === 'He'
        ? (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but ${w.each} only has room for 2.`
        : (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but ${w.many ? 'none' : 'it'} can${w.many ? '' : '’t'} have more than 8.`
    else if (n > m && rule === 'octet' && m === 8) say = (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but under the octet rule ${w.each} should have 8.`
    else if (n < m && m > 8) say = (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but ${w.each} should have ${m}, which makes the formal charges smaller.`
    else if (n < m) say = (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but ${w.each} needs ${m}.`
    else say = (w) => `${w.name} ${w.has} ${n} electrons around ${w.it}, but ${w.each} should have ${m}.`
    const key = `${el}|${n}|${m}`
    const group = around.get(key)
    if (group) group.count++
    else around.set(key, { element: el, count: 1, say })
  })
  mistakes.push(...sayAbout(s, around))

  // Right electron counts everywhere, but not arranged as any correct structure.
  const keys = new Set(correct.map(electronKey))
  if (!mistakes.length && !keys.has(electronKey(s))) {
    const charges = (x: Structure) => x.atoms.reduce((n, _, i) => n + Math.abs(formalCharge(x, i)), 0)
    mistakes.push(
      charges(s) > charges(model)
        ? 'Every atom has the right number of electrons, but the formal charges could be smaller.'
        : `The electrons aren’t arranged the way they are in ${name}.`,
    )
  }

  // What's written beside it: formal charges, brackets and the charge.
  if (formalCharges) {
    const labels = new Map<string, { element: string; count: number; say: Say }>()
    s.atoms.forEach((atom, i) => {
      if (atom.label === undefined) return
      const real = formalCharge(s, i)
      if (atom.label === real) return
      const key = `${atom.element}|${real}`
      const say: Say =
        real === 0
          ? (w) => `${w.name} shouldn’t have a formal charge.`
          : (w) => (w.many ? `The formal charges on ${lowerFirst(w.name)} should be ${signed(real)}.` : `${w.name} should have a formal charge of ${signed(real)}.`)
      const group = labels.get(key)
      if (group) group.count++
      else labels.set(key, { element: atom.element, count: 1, say })
    })
    mistakes.push(...sayAbout(s, labels))
  }
  if (s.charge !== 0 && !hasBrackets(s)) mistakes.push('An ion’s structure goes in square brackets.')
  if (s.charge === 0 && hasBrackets(s)) mistakes.push(`${s.atoms.length === 1 ? 'An atom' : 'A molecule'} with no charge doesn’t go in brackets.`)
  const label = shownCharge(s)
  if (label !== s.charge)
    mistakes.push(
      s.charge === 0 ? `${name} has no charge.` : label === 0 ? `The ion’s charge, ${chargeText(s.charge)}, is missing.` : `The charge should be ${chargeText(s.charge)}.`,
    )
  return mistakes
}
