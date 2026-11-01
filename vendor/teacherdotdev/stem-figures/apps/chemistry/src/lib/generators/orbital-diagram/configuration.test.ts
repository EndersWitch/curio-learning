import { describe, expect, it } from 'vitest'
import {
  FILLING_ORDER,
  atomConfiguration,
  electronCount,
  ionConfiguration,
  nobleGasCore,
  speciesName,
  writtenConfiguration,
  type ConfigurationRule,
} from './configuration'
import { ELEMENTS, EXCEPTIONS, MAX_Z, element } from './elements'

const written = (z: number, charge = 0, rule: ConfigurationRule = 'real') => writtenConfiguration(ionConfiguration(z, charge, rule))
const symbolZ = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)!.z

describe('the filling order', () => {
  it('runs 1s to 7p the way textbooks teach it', () => {
    expect(FILLING_ORDER.map((s) => s.name).join(' ')).toBe('1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p')
  })

  it('has room for exactly the 118 elements', () => {
    expect(FILLING_ORDER.reduce((sum, s) => sum + 2 * s.orbitals, 0)).toBe(MAX_Z)
  })
})

describe('neutral atoms', () => {
  it.each([
    ['H', '1s¹'],
    ['He', '1s²'],
    ['C', '1s² 2s² 2p²'],
    ['O', '1s² 2s² 2p⁴'],
    ['Ar', '1s² 2s² 2p⁶ 3s² 3p⁶'],
    ['K', '1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹'],
    ['Fe', '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶'],
    ['Br', '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁵'],
  ])('%s is %s', (symbol, config) => {
    expect(written(symbolZ(symbol))).toBe(config)
  })

  it('every element has as many electrons as its atomic number, under both rules', () => {
    for (const { z } of ELEMENTS) {
      expect(electronCount(atomConfiguration(z, 'real'))).toBe(z)
      expect(electronCount(atomConfiguration(z, 'filling'))).toBe(z)
    }
  })

  it('never puts more than a sublevel holds', () => {
    for (const { z } of ELEMENTS)
      for (const s of FILLING_ORDER) expect(atomConfiguration(z)[s.name] ?? 0).toBeLessThanOrEqual(2 * s.orbitals)
  })
})

describe('exceptions', () => {
  it.each([
    ['Cr', '[Ar] 4s¹ 3d⁵', '[Ar] 4s² 3d⁴'],
    ['Cu', '[Ar] 4s¹ 3d¹⁰', '[Ar] 4s² 3d⁹'],
    ['Ag', '[Kr] 5s¹ 4d¹⁰', '[Kr] 5s² 4d⁹'],
    ['Pd', '[Kr] 4d¹⁰', '[Kr] 5s² 4d⁸'],
    ['Au', '[Xe] 6s¹ 4f¹⁴ 5d¹⁰', '[Xe] 6s² 4f¹⁴ 5d⁹'],
    ['Gd', '[Xe] 6s² 4f⁷ 5d¹', '[Xe] 6s² 4f⁸'],
    ['Lr', '[Rn] 7s² 5f¹⁴ 7p¹', '[Rn] 7s² 5f¹⁴ 6d¹'],
  ])('%s is really %s, and %s by filling order', (symbol, real, filling) => {
    const z = symbolZ(symbol)
    expect(writtenConfiguration(atomConfiguration(z, 'real'), 'filling', true)).toBe(real)
    expect(writtenConfiguration(atomConfiguration(z, 'filling'), 'filling', true)).toBe(filling)
  })

  it('moves electrons between sublevels without adding or losing any', () => {
    for (const z of Object.keys(EXCEPTIONS).map(Number)) {
      const moved = Object.keys(EXCEPTIONS[z])
      const count = (rule: ConfigurationRule) => moved.reduce((sum, n) => sum + (atomConfiguration(z, rule)[n] ?? 0), 0)
      expect(count('real'), element(z).symbol).toBe(count('filling'))
    }
  })

  it('gives the same Cr³⁺ under both rules', () => {
    expect(written(24, 3, 'real')).toBe(written(24, 3, 'filling'))
  })
})

describe('ions', () => {
  it.each([
    ['Fe', 2, '[Ar] 3d⁶'],
    ['Fe', 3, '[Ar] 3d⁵'],
    ['Cu', 1, '[Ar] 3d¹⁰'],
    ['Cr', 3, '[Ar] 3d³'],
    ['Zn', 2, '[Ar] 3d¹⁰'],
    ['Sn', 2, '[Kr] 5s² 4d¹⁰'],
    ['Sn', 4, '[Kr] 4d¹⁰'],
    ['Pb', 2, '[Xe] 6s² 4f¹⁴ 5d¹⁰'],
    ['Ce', 3, '[Xe] 4f¹'],
    ['O', -2, '[He] 2s² 2p⁶'],
    ['N', -3, '[He] 2s² 2p⁶'],
    ['Na', 1, '[He] 2s² 2p⁶'],
    ['K', 1, '[Ne] 3s² 3p⁶'],
    ['Cl', -1, '[Ne] 3s² 3p⁶'],
  ])('%s with charge %i is %s', (symbol, charge, config) => {
    expect(writtenConfiguration(ionConfiguration(symbolZ(symbol), charge), 'filling', true)).toBe(config)
  })

  it('H⁻ fills 1s and H⁺ has no electrons', () => {
    expect(written(1, -1)).toBe('1s²')
    expect(written(1, 1)).toBe('1s⁰')
  })

  it('writes the charge as a superscript with a true minus sign', () => {
    expect(speciesName(26, 2)).toBe('Fe²⁺')
    expect(speciesName(17, -1)).toBe('Cl⁻')
    expect(speciesName(8, -2)).toBe('O²⁻')
    expect(speciesName(8, 0)).toBe('O')
  })
})

describe('the noble gas core', () => {
  it('is the largest noble gas with fewer electrons', () => {
    expect(nobleGasCore(atomConfiguration(18))?.symbol).toBe('Ne')
    expect(nobleGasCore(atomConfiguration(19))?.symbol).toBe('Ar')
    expect(nobleGasCore(atomConfiguration(2))).toBeUndefined()
    expect(nobleGasCore(atomConfiguration(118))?.symbol).toBe('Rn')
  })

  it('is written in brackets', () => {
    expect(writtenConfiguration(atomConfiguration(26), 'filling', true)).toBe('[Ar] 4s² 3d⁶')
  })
})

describe('shell order', () => {
  it('puts 3d before 4s', () => {
    expect(writtenConfiguration(atomConfiguration(26), 'shell', true)).toBe('[Ar] 3d⁶ 4s²')
    expect(writtenConfiguration(atomConfiguration(79), 'shell', true)).toBe('[Xe] 4f¹⁴ 5d¹⁰ 6s¹')
  })
})
