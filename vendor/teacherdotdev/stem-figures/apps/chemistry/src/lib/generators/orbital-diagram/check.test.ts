import { describe, expect, it } from 'vitest'
import { checkDiagram } from './check'
import { atomConfiguration, ionConfiguration, speciesName, type ConfigurationRule } from './configuration'
import { buildDiagram, groundOrbitals, tidyChanges, type Changes, type DiagramOptions } from './diagram'
import { ELEMENTS } from './elements'

const OPTIONS: DiagramOptions = { order: 'filling', core: false, extra: 0 }

function check(z: number, charge: number, changes: Changes, options: Partial<DiagramOptions> = {}, rule: ConfigurationRule = 'real') {
  const ground = ionConfiguration(z, charge, rule)
  const diagram = buildDiagram(ground, { ...OPTIONS, ...options }, changes)
  return checkDiagram(diagram, { ground, atom: atomConfiguration(z, rule), charge, species: speciesName(z, charge) })
}

describe('ground-state orbitals', () => {
  it('put one up electron in each orbital before pairing (Hund’s rule)', () => {
    expect(groundOrbitals(3, 2)).toEqual(['u', 'u', ''])
    expect(groundOrbitals(3, 3)).toEqual(['u', 'u', 'u'])
    expect(groundOrbitals(3, 4)).toEqual(['ud', 'u', 'u'])
    expect(groundOrbitals(5, 6)).toEqual(['ud', 'u', 'u', 'u', 'u'])
    expect(groundOrbitals(1, 2)).toEqual(['ud'])
    expect(groundOrbitals(7, 0)).toEqual(['', '', '', '', '', '', ''])
  })
})

describe('the drawn sublevels', () => {
  const names = (z: number, charge = 0, options: Partial<DiagramOptions> = {}) =>
    buildDiagram(ionConfiguration(z, charge), { ...OPTIONS, ...options }).sublevels.map((s) => s.name)

  it('run from 1s to the last filled sublevel', () => {
    expect(names(8)).toEqual(['1s', '2s', '2p'])
  })

  it('keep sublevels an ion has emptied, like Fe²⁺’s 4s', () => {
    expect(names(26, 2)).toEqual(['1s', '2s', '2p', '3s', '3p', '4s', '3d'])
  })

  it('show an empty 5s for Pd', () => {
    expect(names(46, 0, { core: true })).toEqual(['5s', '4d'])
  })

  it('add empty sublevels after the last', () => {
    expect(names(11, 0, { extra: 2 })).toEqual(['1s', '2s', '2p', '3s', '3p', '4s'])
  })

  it('leave out the noble gas core', () => {
    expect(names(26, 0, { core: true, order: 'shell' })).toEqual(['3d', '4s'])
  })

  it('draw an empty 1s for an ion with no electrons', () => {
    expect(buildDiagram(ionConfiguration(1, 1), OPTIONS).sublevels).toEqual([{ name: '1s', orbitals: [''] }])
  })
})

describe('the check', () => {
  it('finds no mistakes in any correct diagram', () => {
    for (const { z } of ELEMENTS)
      for (const rule of ['real', 'filling'] as const) {
        expect(check(z, 0, {}, {}, rule)).toEqual({ verdict: 'ground', mistakes: [] })
        expect(check(z, 0, {}, { core: true, order: 'shell', extra: 1 }, rule).mistakes).toEqual([])
      }
    for (const [z, charge] of [[26, 2], [26, 3], [29, 1], [50, 4], [8, -2], [7, -3], [1, 1], [58, 3]])
      expect(check(z, charge, {}).verdict).toBe('ground')
  })

  it('finds a pair while a 2p orbital is empty (Hund’s rule)', () => {
    expect(check(7, 0, { '2p': ['ud', 'u', ''] })).toEqual({
      verdict: 'excited',
      mistakes: ['Hund’s rule: 2p has a pair while one of its orbitals is empty'],
    })
  })

  it('finds unpaired electrons with opposite spins (Hund’s rule)', () => {
    expect(check(6, 0, { '2p': ['u', 'd', ''] }).mistakes).toEqual(['Hund’s rule: the unpaired 2p electrons should have the same spin'])
  })

  it('finds two electrons with the same spin (Pauli exclusion)', () => {
    expect(check(2, 0, { '1s': ['uu'] })).toEqual({
      verdict: 'not-allowed',
      mistakes: ['Pauli exclusion principle: a 1s orbital has two electrons with the same spin'],
    })
  })

  it('finds an electron moved up before a sublevel is full (aufbau)', () => {
    expect(check(11, 0, { '3s': [''], '3p': ['u', '', ''] }, { extra: 1 })).toEqual({
      verdict: 'excited',
      mistakes: ['Aufbau principle: 3p has electrons while 3s isn’t full'],
    })
    expect(check(8, 0, { '2s': ['u'], '2p': ['ud', 'ud', 'u'] }).mistakes).toEqual(['Aufbau principle: 2p has electrons while 2s isn’t full'])
  })

  it('finds the wrong number of electrons', () => {
    expect(check(8, 0, { '2p': ['ud', 'ud', 'u'] })).toEqual({ verdict: 'wrong-count', mistakes: ['O has 8 electrons, not 9'] })
    expect(check(26, 2, { '4s': ['ud'] }).mistakes[0]).toBe('Fe²⁺ has 24 electrons, not 26')
  })

  it('finds a cation that lost the wrong electrons', () => {
    expect(check(26, 2, { '4s': ['ud'], '3d': ['u', 'u', 'u', 'u', ''] }).mistakes).toEqual([
      'Fe²⁺ loses its 4s electrons before its 3d electrons',
    ])
  })

  it('names the real ground state of an exception drawn by filling order', () => {
    expect(check(24, 0, { '4s': ['ud'], '3d': ['u', 'u', 'u', 'u', ''] }).mistakes).toEqual(['Cr’s ground state has 4s¹ 3d⁵, not 4s² 3d⁴'])
  })

  it('under the filling order rule, calls Cr’s real ground state an aufbau mistake', () => {
    expect(check(24, 0, { '4s': ['u'], '3d': ['u', 'u', 'u', 'u', 'u'] }, {}, 'filling').mistakes).toEqual([
      'Aufbau principle: 3d has electrons while 4s isn’t full',
    ])
  })

  it('counts a changed diagram that is still the ground state as correct', () => {
    expect(check(7, 0, { '2p': ['d', 'd', 'd'] })).toEqual({ verdict: 'ground', mistakes: [] })
  })
})

describe('tidying changes', () => {
  const ground = atomConfiguration(8)

  it('keeps changes to drawn sublevels', () => {
    expect(tidyChanges({ '2p': ['ud', 'ud', ''] }, ground, OPTIONS)).toEqual({ '2p': ['ud', 'ud', ''] })
  })

  it('drops changes back to the ground state, to sublevels not drawn, and bad ones', () => {
    expect(tidyChanges({ '2p': ['ud', 'u', 'u'] }, ground, OPTIONS)).toEqual({})
    expect(tidyChanges({ '3s': ['u'] }, ground, OPTIONS)).toEqual({})
    expect(tidyChanges({ '2p': ['ud', 'u'] }, ground, OPTIONS)).toEqual({})
    expect(tidyChanges({ '2p': ['x', 'u', 'u'] }, ground, OPTIONS)).toEqual({})
    expect(tidyChanges([], ground, OPTIONS)).toEqual({})
    expect(tidyChanges({ '1s': ['u'] }, ground, { ...OPTIONS, core: true })).toEqual({})
  })
})
