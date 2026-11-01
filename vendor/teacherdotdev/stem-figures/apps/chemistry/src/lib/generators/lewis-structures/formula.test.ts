import { describe, expect, it } from 'vitest'
import { chargeText, formulaText, ionMeant, parseFormula, type Formula } from './formula'

const parsed = (text: string) => {
  const result = parseFormula(text)
  if (!result.ok) throw new Error(result.message)
  return result.formula
}
const message = (text: string) => {
  const result = parseFormula(text)
  return result.ok ? '' : result.message
}

describe('reading a typed formula', () => {
  it('lists every atom in the order written', () => {
    expect(parsed('CH4').atoms).toEqual(['C', 'H', 'H', 'H', 'H'])
    expect(parsed('SF6').atoms).toEqual(['S', 'F', 'F', 'F', 'F', 'F', 'F'])
    expect(parsed('CH3COOH').atoms).toEqual(['C', 'H', 'H', 'H', 'C', 'O', 'O', 'H'])
  })

  it('reads a charge written after the formula in any of the usual ways', () => {
    for (const text of ['SO4 2-', 'SO4^2-', 'SO4^-2', 'SO4 -2', 'SO4(2-)', 'SO₄²⁻', 'SO4 2−']) expect(parsed(text).charge, text).toBe(-2)
    for (const text of ['NH4+', 'NH4 +', 'NH4^+', 'NH₄⁺']) expect(parsed(text).charge, text).toBe(1)
    expect(parsed('OH-').charge).toBe(-1)
    expect(parsed('CN−').charge).toBe(-1)
    expect(parsed('PO4 3-').charge).toBe(-3)
    expect(parsed('H2O').charge).toBe(0)
  })

  it('reads digits right before a sign as a count, so a space is needed for a charge of 2 or more', () => {
    const f = parsed('SO42-')
    expect(f.atoms.filter((a) => a === 'O')).toHaveLength(42)
    expect(f.charge).toBe(-1)
  })

  it('ignores spaces inside the formula', () => {
    expect(parsed(' C O2 ').atoms).toEqual(['C', 'O', 'O'])
  })

  it('writes the formula with subscripts and a superscript charge', () => {
    expect(formulaText(parsed('SO4 2-'))).toBe('SO₄²⁻')
    expect(formulaText(parsed('NH4+'))).toBe('NH₄⁺')
    expect(formulaText(parsed('CH3COOH'))).toBe('CH₃COOH')
    expect(formulaText(parsed('C2H5OH'))).toBe('C₂H₅OH')
  })

  it('keeps how the formula was written, for matching the list of structures', () => {
    expect(parsed('SO₄²⁻').written).toBe('SO4 2-')
    expect(parsed('CH3 COO -').written).toBe('CH3COO -')
    expect(parsed('NH4^+').written).toBe('NH4 +')
  })

  it('counts each element, whatever order they are written in', () => {
    const a: Formula = parsed('C2H5OH')
    const b: Formula = parsed('CH3OCH3')
    expect(a.composition).toBe(b.composition)
    expect(parsed('SO4 2-').composition).not.toBe(parsed('SO4').composition)
  })
})

describe('formulas it can’t read', () => {
  it('says what to type when nothing is typed', () => {
    expect(message('  ')).toMatch(/Type a formula/)
  })

  it('asks for capital letters', () => {
    expect(message('co2')).toMatch(/capital/)
  })

  it('names an element it doesn’t know', () => {
    expect(message('Xx4')).toMatch(/Xx/)
  })

  it('explains that transition metals and ionic compounds aren’t drawn', () => {
    expect(message('Fe2O3')).toMatch(/transition metal/)
    expect(message('NaCl')).toBe('Na forms ionic compounds, which Lewis Structures doesn’t draw. Type Na+ for its ion on its own.')
    expect(message('CaCl2')).toMatch(/Type Ca 2\+ for its ion/)
  })

  it('says how to type an ion of a metal that only forms ionic compounds, since Ca2+ is two Ca atoms', () => {
    expect(message('Ca2+')).toBe('Ca2+ is 2 Ca atoms. For the Ca²⁺ ion, type Ca 2+.')
    expect(message('Ca 2+')).toBe('')
  })

  it('rejects anything else it can’t read', () => {
    expect(message('Ca(OH)2')).not.toBe('')
    expect(message('H2O!')).not.toBe('')
  })

})

describe('one atom or ion', () => {
  it('reads a single atom or monatomic ion, metals that only form ionic compounds included', () => {
    expect(parsed('N').atoms).toEqual(['N'])
    expect(parsed('Cl-')).toMatchObject({ atoms: ['Cl'], charge: -1 })
    expect(parsed('N 3-')).toMatchObject({ atoms: ['N'], charge: -3 })
    expect(parsed('O²⁻')).toMatchObject({ atoms: ['O'], charge: -2 })
    expect(parsed('Ca^2+')).toMatchObject({ atoms: ['Ca'], charge: 2 })
    expect(formulaText(parsed('N 3-'))).toBe('N³⁻')
  })

  it('reads N3- as three N atoms, and knows the ion it may have meant', () => {
    const f = parsed('N3-')
    expect(f.atoms).toEqual(['N', 'N', 'N'])
    expect(ionMeant(f.tokens, f.charge)).toEqual({ name: 'N³⁻', typed: 'N 3-' })
    expect(ionMeant(parsed('N 3-').tokens, -3)).toBeUndefined()
    expect(ionMeant(parsed('NO3-').tokens, -1)).toBeUndefined()
  })
})

describe('writing a charge', () => {
  it('leaves out a 1 and uses a true minus sign', () => {
    expect(chargeText(1)).toBe('+')
    expect(chargeText(-1)).toBe('−')
    expect(chargeText(-2)).toBe('2−')
    expect(chargeText(3)).toBe('3+')
    expect(chargeText(0)).toBe('')
  })
})
