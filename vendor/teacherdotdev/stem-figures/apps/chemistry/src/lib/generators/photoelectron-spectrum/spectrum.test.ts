import { describe, expect, it } from 'vitest'
import { atomConfiguration } from '../orbital-diagram/configuration'
import { MAX_PES_Z, bindingEnergies } from './energies'
import { energyText, peaksOf } from './spectrum'

const shown = (z: number) => peaksOf(z, 'MJ/mol').map((p) => [p.sublevel, p.electrons, energyText(p.energy)])

describe('a photoelectron spectrum', () => {
  it('has the textbook’s peaks for neon and sodium', () => {
    expect(shown(10)).toEqual([['1s', 2, '84.0'], ['2s', 2, '4.68'], ['2p', 6, '2.08']])
    expect(shown(11)).toEqual([['1s', 2, '104'], ['2s', 2, '6.84'], ['2p', 6, '3.67'], ['3s', 1, '0.50']])
  })

  it('has Lotz’s for scandium, 3d above 4s', () => {
    expect(shown(21)).toEqual([
      ['1s', 2, '434'], ['2s', 2, '48.5'], ['2p', 6, '39.0'], ['3s', 2, '5.31'], ['3p', 6, '3.18'], ['3d', 1, '0.77'], ['4s', 2, '0.63'],
    ])
  })

  it('follows real ground states, so chromium has one 4s electron', () => {
    const cr = peaksOf(24, 'MJ/mol')
    expect(cr.find((p) => p.sublevel === '4s')?.electrons).toBe(1)
    expect(cr.find((p) => p.sublevel === '3d')?.electrons).toBe(5)
  })

  it('has a peak for every sublevel with electrons, H to Xe', () => {
    for (let z = 1; z <= MAX_PES_Z; z++) {
      const filled = Object.values(atomConfiguration(z)).filter(Boolean).length
      expect(peaksOf(z, 'MJ/mol'), `Z = ${z}`).toHaveLength(filled)
      expect(peaksOf(z, 'MJ/mol').reduce((sum, p) => sum + p.electrons, 0), `Z = ${z}`).toBe(z)
    }
  })

  it('holds 1s electrons tighter in each heavier element', () => {
    for (let z = 2; z <= MAX_PES_Z; z++) expect(bindingEnergies(z)['1s'], `Z = ${z}`).toBeGreaterThan(bindingEnergies(z - 1)['1s'])
  })

  it('converts to eV', () => {
    expect(peaksOf(10, 'eV')[0].energy).toBeCloseTo(870.6, 1)
    expect(energyText(peaksOf(54, 'eV')[0].energy)).toBe('34,565')
  })
})
