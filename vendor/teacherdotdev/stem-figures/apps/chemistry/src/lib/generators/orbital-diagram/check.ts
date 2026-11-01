// The check: how a drawn diagram differs from the ground state, as sentences
// naming the rule each difference breaks (CONTEXT.md "Mistake"). It never
// assumes the diagram was built correctly, and knows nothing about changes.

import { FILLING_ORDER, electronCount, fillingIndex, superscript, type Configuration } from './configuration'
import { diagramConfiguration, type Diagram } from './diagram'

/** A diagram is the ground state, an excited state (allowed, with the right
 *  number of electrons), not allowed (breaking Pauli exclusion), or has the
 *  wrong number of electrons for its atom or ion. */
export type Verdict = 'ground' | 'excited' | 'not-allowed' | 'wrong-count'

export const VERDICT_NAMES: Record<Verdict, string> = {
  ground: 'Ground state',
  excited: 'Excited state',
  'not-allowed': 'Not allowed',
  'wrong-count': 'Wrong number of electrons',
}

export interface Check {
  verdict: Verdict
  mistakes: string[]
}

const list = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)
const written = (config: Configuration, names: string[]) => names.map((n) => `${n}${superscript(String(config[n] ?? 0))}`).join(' ')

export interface CheckTarget {
  /** the ground state the diagram should show */
  ground: Configuration
  /** the neutral atom's ground state, to tell which electrons a cation lost */
  atom: Configuration
  charge: number
  /** "Fe²⁺" */
  species: string
}

export function checkDiagram(diagram: Diagram, target: CheckTarget): Check {
  const { ground, atom, charge, species } = target
  const drawn = diagramConfiguration(diagram, ground)
  const mistakes: string[] = []

  const have = electronCount(drawn)
  const want = electronCount(ground)
  if (have !== want) mistakes.push(`${species} has ${want} electron${want === 1 ? '' : 's'}, not ${have}`)

  let pauli = false
  for (const s of diagram.sublevels) {
    if (s.orbitals.some((fill) => fill === 'uu' || fill === 'dd')) {
      pauli = true
      mistakes.push(`Pauli exclusion principle: a ${s.name} orbital has two electrons with the same spin`)
    }
    if (s.orbitals.length < 2) continue
    const doubles = s.orbitals.filter((fill) => fill.length === 2).length
    const empties = s.orbitals.filter((fill) => fill === '').length
    if (doubles && empties) mistakes.push(`Hund’s rule: ${s.name} has a pair while one of its orbitals is empty`)
    const singles = s.orbitals.filter((fill) => fill.length === 1)
    if (singles.includes('u') && singles.includes('d')) mistakes.push(`Hund’s rule: the unpaired ${s.name} electrons should have the same spin`)
  }

  if (have === want) {
    const names = FILLING_ORDER.map((s) => s.name)
    const more = names.filter((n) => (drawn[n] ?? 0) > (ground[n] ?? 0))
    const fewer = names.filter((n) => (drawn[n] ?? 0) < (ground[n] ?? 0))
    if (more.length) {
      const fromAtom = charge > 0 && names.every((n) => (drawn[n] ?? 0) <= (atom[n] ?? 0))
      const late = more.filter((n) => fewer.some((f) => fillingIndex(n) > fillingIndex(f)))
      if (fromAtom) mistakes.push(`${species} loses its ${list(more)} electrons before its ${list(fewer)} electrons`)
      // every sublevel with too many comes after one that isn't full
      else if (late.length === more.length)
        mistakes.push(`Aufbau principle: ${list(late)} ${late.length === 1 ? 'has' : 'have'} electrons while ${list(fewer)} ${fewer.length === 1 ? 'isn’t' : 'aren’t'} full`)
      else {
        const involved = names.filter((n) => more.includes(n) || fewer.includes(n))
        mistakes.push(`${species}’s ground state has ${written(ground, involved)}, not ${written(drawn, involved)}`)
      }
    }
  }

  const verdict: Verdict = pauli ? 'not-allowed' : have !== want ? 'wrong-count' : mistakes.length ? 'excited' : 'ground'
  return { verdict, mistakes }
}
