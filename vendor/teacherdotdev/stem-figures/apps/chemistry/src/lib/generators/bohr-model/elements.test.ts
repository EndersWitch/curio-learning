import { describe, expect, it } from 'vitest'
import { ELEMENTS, MAX_Z, element, groundStateShells, ionCharge, massNumber } from './elements'

describe('ground-state shells', () => {
  it('knows the arrangements textbooks show', () => {
    const known: [string, number[]][] = [
      ['H', [1]],
      ['He', [2]],
      ['C', [2, 4]],
      ['Na', [2, 8, 1]],
      ['Ar', [2, 8, 8]],
      ['K', [2, 8, 8, 1]],
      ['Ca', [2, 8, 8, 2]],
      ['Fe', [2, 8, 14, 2]],
      ['Cr', [2, 8, 13, 1]],
      ['Cu', [2, 8, 18, 1]],
      ['Br', [2, 8, 18, 7]],
      ['Pd', [2, 8, 18, 18]],
      ['Au', [2, 8, 18, 32, 18, 1]],
      ['U', [2, 8, 18, 32, 21, 9, 2]],
      ['Og', [2, 8, 18, 32, 32, 18, 8]],
    ]
    for (const [symbol, shells] of known) expect(groundStateShells(ELEMENTS.find((e) => e.symbol === symbol)!.z), symbol).toEqual(shells)
  })

  it('adds up to the atomic number with no shell over 2n², for every element', () => {
    for (let z = 1; z <= MAX_Z; z++) {
      const shells = groundStateShells(z)!
      expect(shells.reduce((a, b) => a + b, 0), element(z)!.symbol).toBe(z)
      shells.forEach((e, i) => expect(e).toBeLessThanOrEqual(2 * (i + 1) ** 2))
      expect(shells.length).toBeLessThanOrEqual(7)
    }
  })

  it('has none for a proton count no element has', () => {
    expect(groundStateShells(0)).toBeUndefined()
    expect(groundStateShells(119)).toBeUndefined()
  })
})

const z = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)!.z

describe('an ion’s shells', () => {
  it('loses and gains electrons as textbooks show, leaving out an emptied shell', () => {
    const known: [string, number, number[]][] = [
      ['Na', 1, [2, 8]],
      ['Mg', 2, [2, 8]],
      ['Al', 3, [2, 8]],
      ['Cl', -1, [2, 8, 8]],
      ['O', -2, [2, 8]],
      ['N', -3, [2, 8]],
      ['H', 1, [0]],
      ['H', -1, [2]],
      ['Li', 1, [2]],
      ['Ca', 2, [2, 8, 8]],
    ]
    for (const [symbol, charge, shells] of known) expect(groundStateShells(z(symbol), charge), `${symbol} ${charge}`).toEqual(shells)
  })

  it('takes a transition metal’s 4s electrons before its 3d, as an orbital diagram does', () => {
    expect(groundStateShells(z('Fe'), 2)).toEqual([2, 8, 14])
    expect(groundStateShells(z('Fe'), 3)).toEqual([2, 8, 13])
    expect(groundStateShells(z('Cu'), 1)).toEqual([2, 8, 18])
    expect(groundStateShells(z('Zn'), 2)).toEqual([2, 8, 18])
  })

  it('keeps the charge to one the element can have', () => {
    expect(ionCharge(z('He'), 8)).toBe(2)
    expect(ionCharge(z('O'), -9)).toBe(-4)
    expect(ionCharge(MAX_Z, -2)).toBe(0)
    expect(groundStateShells(z('He'), 5)).toEqual([0])
  })
})

describe('mass numbers', () => {
  it('are the rounded atomic masses periodic tables show', () => {
    const known: [string, number][] = [
      ['H', 1],
      ['C', 12],
      ['Na', 23],
      ['Cl', 35],
      ['Ar', 40],
      ['K', 39],
      ['Fe', 56],
      ['Cu', 64],
      ['Ag', 108],
      ['Au', 197],
      ['Tc', 98],
      ['U', 238],
      ['Og', 294],
    ]
    for (const [symbol, mass] of known) expect(massNumber(z(symbol)), symbol).toBe(mass)
  })

  it('give every element at least as many nucleons as protons', () => {
    for (let n = 1; n <= MAX_Z; n++) expect(massNumber(n)!, element(n)!.symbol).toBeGreaterThanOrEqual(n)
    expect(massNumber(0)).toBeUndefined()
  })
})
