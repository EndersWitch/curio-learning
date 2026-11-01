import { describe, expect, it } from 'vitest'
import { correctStructures, findCentral, starSkeleton, type Rule } from './build'
import { findMistakes } from './check'
import { formulaText, parseFormula } from './formula'
import type { Structure } from './structure'

function setup(text: string, rule: Rule = 'octet') {
  const parsed = parseFormula(text)
  if (!parsed.ok) throw new Error(parsed.message)
  const f = parsed.formula
  const central = findCentral(f)
  if (!central.ok) throw new Error(central.reason)
  const correct = correctStructures(starSkeleton(f, central.central), rule)
  const mistakes = (s: Structure, formalCharges = false, shouldBeCentral?: string) =>
    findMistakes({ structure: s, correct, name: formulaText(f), rule, formalCharges, shouldBeCentral })
  return { correct, s: correct[0], mistakes, central: central.central }
}

const withLone = (s: Structure, i: number, lone: number): Structure => ({ ...s, atoms: s.atoms.map((a, k) => (k === i ? { ...a, lone } : a)) })
const withOrder = (s: Structure, k: number, order: number): Structure => ({ ...s, bonds: s.bonds.map((b, j) => (j === k ? { ...b, order } : b)) })
const withLabel = (s: Structure, i: number, label: number): Structure => ({ ...s, atoms: s.atoms.map((a, k) => (k === i ? { ...a, label } : a)) })

describe('a correct structure', () => {
  it('has no mistakes, whatever it is', () => {
    for (const rule of ['octet', 'fewest'] as const)
      for (const text of ['CH4', 'H2O', 'CO2', 'BF3', 'SF6', 'XeF4', 'NO', 'NO2', 'ClO2', 'O3', 'I3-', 'SO4 2-', 'PO4 3-', 'NH4+', 'CN-', 'N2', 'HCl'])
        for (const s of setup(text, rule).correct) expect(setup(text, rule).mistakes(s, true), `${text} ${rule}`).toEqual([])
  })

  it('has none when changed into another of its resonance structures', () => {
    const { correct, mistakes } = setup('NO3-')
    expect(mistakes(correct[2])).toEqual([])
  })
})

describe('the mistakes in a changed structure', () => {
  it('counts the valence electrons', () => {
    const { s, mistakes } = setup('CO2')
    expect(mistakes(withLone(s, 1, 6))[0]).toBe('It shows 18 valence electrons, but CO₂ has 16.')
  })

  it('finds an atom short of an octet', () => {
    const { s, mistakes } = setup('CO2')
    expect(mistakes(withOrder(s, 0, 1))).toContain('C has 6 electrons around it, but it needs 8.')
    expect(mistakes(withOrder(s, 0, 1))).toContain('An O atom has 6 electrons around it, but it needs 8.')
  })

  it('puts matching mistakes on several atoms together', () => {
    const { s, mistakes } = setup('CO2')
    const single = withOrder(withOrder(s, 0, 1), 1, 1)
    expect(mistakes(single)).toContain('Two O atoms have 6 electrons around them, but each needs 8.')
  })

  it('finds period 2 atoms and H past their room', () => {
    const { s, mistakes } = setup('H2O')
    expect(mistakes(withLone(s, 2, 6))).toContain('O has 10 electrons around it, but it can’t have more than 8.')
    const hcl = setup('HCl')
    expect(hcl.mistakes(withLone(hcl.s, 0, 2))).toContain('H has 4 electrons around it, but it only has room for 2.')
  })

  it('follows the structure rule for atoms that can go past an octet', () => {
    const octet = setup('SO4 2-', 'octet')
    const fewest = setup('SO4 2-', 'fewest')
    expect(octet.mistakes(fewest.s)).toContain('S has 12 electrons around it, but under the octet rule it should have 8.')
    expect(fewest.mistakes(octet.s)).toContain('S has 8 electrons around it, but it should have 12, which makes the formal charges smaller.')
  })

  it('finds octets with larger formal charges than they need', () => {
    const { s, mistakes } = setup('CO2')
    const skewed = withLone(withLone(withOrder(withOrder(s, 0, 3), 1, 1), 1, 2), 2, 6)
    expect(mistakes(skewed)).toEqual(['Every atom has the right number of electrons, but the formal charges could be smaller.'])
  })

  it('finds a missing bond', () => {
    const { s, mistakes } = setup('CH4')
    expect(mistakes(withOrder(s, 0, 0))).toContain('A bond between C and H is missing.')
  })

  it('finds a wrong central atom', () => {
    const { mistakes } = setup('CO2')
    const ooc = setup('CO2')
    // O in the middle: C=O=O
    const wrong: Structure = {
      ...ooc.s,
      atoms: [
        { element: 'C', x: 0, y: 0, lone: 4 },
        { element: 'O', x: 1, y: 0, lone: 0 },
        { element: 'O', x: 2, y: 0, lone: 4 },
      ],
      bonds: [
        { a: 1, b: 0, order: 2 },
        { a: 1, b: 2, order: 2 },
      ],
    }
    expect(mistakes(wrong, false, 'C')[0]).toBe('C should be the central atom.')
  })

  it('checks formal charge labels only when they’re drawn', () => {
    const { s, mistakes } = setup('NH4+')
    expect(mistakes(withLabel(s, 0, 0), true)).toEqual(['N should have a formal charge of +1.'])
    expect(mistakes(withLabel(s, 1, -1), true)).toEqual(['An H atom shouldn’t have a formal charge.'])
    expect(mistakes(withLabel(s, 0, 0), false)).toEqual([])
  })

  it('checks an ion’s brackets and charge', () => {
    const { s, mistakes } = setup('SO4 2-')
    expect(mistakes({ ...s, brackets: false })).toEqual(['An ion’s structure goes in square brackets.'])
    expect(mistakes({ ...s, chargeLabel: -1 })).toEqual(['The charge should be 2−.'])
    expect(mistakes({ ...s, chargeLabel: 0 })).toEqual(['The ion’s charge, 2−, is missing.'])
  })
})

describe('an atom or ion on its own', () => {
  it('has no mistakes when correct', () => {
    for (const text of ['N', 'P', 'N 3-', 'Ca 2+', 'Cl-', 'O 2-']) expect(setup(text).mistakes(setup(text).s, true), text).toEqual([])
  })

  it('finds a wrong number of dots once, as the valence electrons', () => {
    expect(setup('N').mistakes(withLone(setup('N').s, 0, 6))).toEqual(['It shows 6 valence electrons, but N has 5.'])
    expect(setup('N 3-').mistakes(withLone(setup('N 3-').s, 0, 5))).toEqual(['It shows 5 valence electrons, but N³⁻ has 8.'])
    expect(setup('Ca 2+').mistakes(withLone(setup('Ca 2+').s, 0, 2))).toEqual(['It shows 2 valence electrons, but Ca²⁺ has 0.'])
  })

  it('checks the brackets and charge', () => {
    const { s, mistakes } = setup('Cl-')
    expect(mistakes({ ...s, brackets: false, chargeLabel: 0 })).toEqual(['An ion’s structure goes in square brackets.', 'The ion’s charge, −, is missing.'])
    const n = setup('N')
    expect(n.mistakes({ ...n.s, brackets: true })).toEqual(['An atom with no charge doesn’t go in brackets.'])
  })
})

