import { describe, expect, it } from 'vitest'
import { correctStructures, findCentral, starSkeleton, type Rule } from './build'
import { parseFormula } from './formula'
import { electronsAround, electronsShown, formalCharge, valenceElectrons, type Structure } from './structure'

function formula(text: string) {
  const parsed = parseFormula(text)
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.formula
}

function build(text: string, rule: Rule = 'octet') {
  const f = formula(text)
  const central = findCentral(f)
  if (!central.ok) throw new Error(`${text}: ${central.reason}`)
  return correctStructures(starSkeleton(f, central.central), rule)
}

const SIGN = ['', '-', '=', '#']

/** Bonds written like "C=O", sorted, so tests read like the structures. */
const bonds = (s: Structure) =>
  s.bonds.map((b) => [s.atoms[b.a].element, s.atoms[b.b].element].sort().join(SIGN[b.order])).sort()

/** Lone electrons by element, e.g. { O: [4, 4], C: [0] }. */
function lone(s: Structure) {
  const out: Record<string, number[]> = {}
  s.atoms.forEach((a) => (out[a.element] ??= []).push(a.lone))
  return out
}

/** The one structure a formula builds; it has no resonance structures. */
function only(text: string, rule: Rule = 'octet') {
  const all = build(text, rule)
  expect(all, text).toHaveLength(1)
  return all[0]
}

describe('the central atom', () => {
  const central = (text: string) => {
    const f = formula(text)
    const c = findCentral(f)
    return c.ok ? f.atoms[c.central] : c.reason
  }

  it('is the least electronegative atom other than H', () => {
    expect(central('CH4')).toBe('C')
    expect(central('H2O')).toBe('O')
    expect(central('PH3')).toBe('P')
    expect(central('SCN-')).toBe('C')
    expect(central('OF2')).toBe('O')
    expect(central('SOCl2')).toBe('S')
    expect(central('H3O+')).toBe('O')
  })

  it('is either atom of a diatomic, the non-H one when there is one', () => {
    expect(central('HCl')).toBe('Cl')
    expect(central('CO')).toBe('C')
    expect(central('OH-')).toBe('O')
    expect(central('N2')).toBe('N')
  })

  it('is the middle one of three atoms of the same element', () => {
    const f = formula('O3')
    expect(findCentral(f)).toEqual({ ok: true, central: 1 })
  })

  it('isn’t there for a formula with more than one central atom', () => {
    expect(central('C2H6')).toBe('several')
    expect(central('H2O2')).toBe('several')
    expect(central('N2H4')).toBe('several')
  })

  it('isn’t trusted for acids, where H bonds to O', () => {
    expect(central('HNO3')).toBe('acid')
    expect(central('H2SO4')).toBe('acid')
    expect(central('HOCl')).toBe('acid')
  })

  it('keeps H on C, written first or not', () => {
    expect(central('H2CO')).toBe('C')
    expect(central('HCHO')).toBe('C')
    expect(bonds(only('H2CO'))).toEqual(['C-H', 'C-H', 'C=O'])
  })
})

describe('building a structure with the octet rule', () => {
  it('draws simple molecules with single bonds', () => {
    const ch4 = only('CH4')
    expect(bonds(ch4)).toEqual(['C-H', 'C-H', 'C-H', 'C-H'])
    expect(lone(ch4)).toEqual({ C: [0], H: [0, 0, 0, 0] })
    expect(lone(only('H2O'))).toEqual({ H: [0, 0], O: [4] })
    expect(lone(only('NH3'))).toEqual({ N: [2], H: [0, 0, 0] })
    expect(lone(only('HCl'))).toEqual({ H: [0], Cl: [6] })
  })

  it('makes double and triple bonds until the central atom has an octet', () => {
    const co2 = only('CO2')
    expect(bonds(co2)).toEqual(['C=O', 'C=O'])
    expect(lone(co2)).toEqual({ C: [0], O: [4, 4] })
    expect(bonds(only('N2'))).toEqual(['N#N'])
    expect(lone(only('N2'))).toEqual({ N: [2, 2] })
    expect(bonds(only('CO'))).toEqual(['C#O'])
    expect(bonds(only('HCN'))).toEqual(['C#N', 'C-H'])
    expect(bonds(only('O2'))).toEqual(['O=O'])
    expect(bonds(only('CH2O'))).toEqual(['C-H', 'C-H', 'C=O'])
  })

  it('leaves B and Be short of an octet, since F and Cl don’t take double bonds', () => {
    const bf3 = only('BF3')
    expect(bonds(bf3)).toEqual(['B-F', 'B-F', 'B-F'])
    expect(electronsAround(bf3, 0)).toBe(6)
    expect(electronsAround(only('BeCl2'), 0)).toBe(4)
  })

  it('goes past an octet only when there’s no other way', () => {
    expect(electronsAround(only('SF6'), 0)).toBe(12)
    expect(electronsAround(only('PCl5'), 0)).toBe(10)
    expect(lone(only('XeF4')).Xe).toEqual([4])
    expect(lone(only('SF4')).S).toEqual([2])
    expect(lone(only('ClF3')).Cl).toEqual([4])
    expect(lone(only('XeF2')).Xe).toEqual([6])
    expect(lone(only('I3-')).I).toEqual([6, 6, 6])
  })

  it('puts an odd electron on the central atom', () => {
    const no = only('NO')
    expect(bonds(no)).toEqual(['N=O'])
    expect(lone(no)).toEqual({ N: [3], O: [4] })
    expect(build('NO2')).toHaveLength(2)
    expect(build('NO2')[0].atoms[0].lone).toBe(1)
    expect(electronsAround(only('ClO2'), 0)).toBe(7)
  })

  it('draws polyatomic ions with the charge counted in', () => {
    expect(lone(only('NH4+'))).toEqual({ N: [0], H: [0, 0, 0, 0] })
    expect(lone(only('OH-'))).toEqual({ O: [6], H: [0] })
    expect(bonds(only('CN-'))).toEqual(['C#N'])
    const so4 = only('SO4 2-')
    expect(bonds(so4)).toEqual(['O-S', 'O-S', 'O-S', 'O-S'])
    expect(formalCharge(so4, 0)).toBe(2)
    expect(formalCharge(so4, 1)).toBe(-1)
  })

  it('finds every resonance structure with the fewest formal charges', () => {
    expect(build('O3')).toHaveLength(2)
    expect(build('NO3-')).toHaveLength(3)
    expect(build('CO3 2-')).toHaveLength(3)
    expect(build('NO2-')).toHaveLength(2)
    expect(build('SO2')).toHaveLength(2)
    expect(build('SO3')).toHaveLength(3)
    for (const s of build('NO3-')) expect(bonds(s)).toEqual(['N-O', 'N-O', 'N=O'])
  })

  it('keeps every structure’s electron count', () => {
    for (const text of ['CH4', 'CO2', 'SF6', 'NO', 'NO3-', 'SO4 2-', 'I3-', 'XeF4', 'BF3', 'HCN', 'PO4 3-'])
      for (const s of build(text)) expect(electronsShown(s), text).toBe(valenceElectrons(s))
  })

  it('builds nothing for a formula that can’t make a Lewis structure', () => {
    expect(build('CH5')).toEqual([])
    expect(build('He2')).toEqual([])
  })
})

describe('building a structure with the fewest formal charges', () => {
  it('stays quick for a formula with many atoms that could give a pair', () => {
    const start = Date.now()
    for (const text of ['SO24', 'PO43', 'SO42-']) build(text, 'fewest')
    expect(Date.now() - start).toBeLessThan(2000)
  })

  const doubles = (s: Structure) => s.bonds.filter((b) => b.order === 2).length

  it('makes double bonds past an octet in period 3 and lower', () => {
    const so4 = build('SO4 2-', 'fewest')
    expect(so4).toHaveLength(6)
    for (const s of so4) {
      expect(doubles(s)).toBe(2)
      expect(electronsAround(s, 0)).toBe(12)
      expect(formalCharge(s, 0)).toBe(0)
    }
    expect(build('PO4 3-', 'fewest').map(doubles)).toEqual([1, 1, 1, 1])
    expect(build('ClO4-', 'fewest').map(doubles)).toEqual([3, 3, 3, 3])
    expect(bonds(only('SO2', 'fewest'))).toEqual(['O=S', 'O=S'])
    expect(bonds(only('SO3', 'fewest'))).toEqual(['O=S', 'O=S', 'O=S'])
  })

  it('never takes period 2 past an octet', () => {
    expect(build('NO3-', 'fewest')).toEqual(build('NO3-', 'octet'))
    expect(build('CO3 2-', 'fewest')).toEqual(build('CO3 2-', 'octet'))
  })

  it('is the same as the octet rule when nothing can go past an octet', () => {
    for (const text of ['SF6', 'CH4', 'H2S', 'PCl3']) expect(build(text, 'fewest'), text).toEqual(build(text, 'octet'))
  })
})
