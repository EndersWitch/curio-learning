import { describe, expect, it } from 'vitest'
import { ELEMENTS } from './elements'
import { MAX_ROW, layoutFigure, type LayoutOptions } from './layout'
import { answerLines, configRuns, drawnDiagram, figureLabel, isChanged, orbitalSettings, symbolRuns, type OrbitalSettings } from './settings'

const settings = (changes: Partial<OrbitalSettings> = {}) => orbitalSettings.tidy({ ...orbitalSettings.defaults, ...changes })

const layoutOf = (s: OrbitalSettings, answer: string[] = []) =>
  layoutFigure(drawnDiagram(s), {
    style: s.orbitals,
    arrangement: s.arrangement,
    labels: s.labels,
    symbol: s.symbol,
    symbolRuns: symbolRuns(s),
    configLine: s.configLine,
    configRuns: configRuns(s),
    answer,
  } satisfies LayoutOptions)

describe('Orbital Diagram settings', () => {
  it('start with oxygen', () => {
    expect(orbitalSettings.defaults.z).toBe(8)
    expect(answerLines(orbitalSettings.defaults)).toEqual(['O: 1s² 2s² 2p⁴'])
  })

  it('travel through the page address, changes included', () => {
    const s = settings({ z: 26, charge: 2, core: true, changes: { '4s': ['u'] } })
    const back = orbitalSettings.fromParams(new URLSearchParams(orbitalSettings.toQuery(s)))
    expect(back).toEqual(s)
    expect(isChanged(back)).toBe(true)
  })

  it('never leave fewer than no electrons, or more than 118', () => {
    expect(settings({ z: 1, charge: 5 }).charge).toBe(1)
    expect(settings({ z: 118, charge: -2 }).charge).toBe(0)
  })

  it('drop changes to sublevels that are no longer drawn', () => {
    expect(settings({ z: 26, core: true, changes: { '1s': ['u'] } }).changes).toEqual({})
  })
})

describe('the answer key', () => {
  it('follows the order and core settings', () => {
    expect(answerLines(settings({ z: 26, charge: 2, core: true }))).toEqual(['Fe²⁺: [Ar] 3d⁶'])
    expect(answerLines(settings({ z: 26, order: 'shell' }))).toEqual(['Fe: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s²'])
    expect(answerLines(settings({ z: 1, charge: 1 }))).toEqual(['H⁺: no electrons'])
  })

  it('says what’s wrong with a changed diagram', () => {
    expect(answerLines(settings({ z: 7, changes: { '2p': ['ud', 'u', ''] } }))).toEqual([
      'N: 1s² 2s² 2p³',
      'Excited state',
      'Hund’s rule: 2p has a pair while one of its orbitals is empty',
    ])
  })

  it('leaves out the check when the orbitals are drawn empty', () => {
    expect(answerLines(settings({ z: 7, electrons: false, changes: { '2p': ['ud', 'u', ''] } }))).toEqual(['N: 1s² 2s² 2p³'])
  })
})

describe('the figure', () => {
  it('draws empty orbitals when electrons are hidden, keeping every orbital', () => {
    const d = drawnDiagram(settings({ z: 26, electrons: false }))
    expect(d.sublevels.flatMap((s) => s.orbitals)).toHaveLength(15)
    expect(d.sublevels.every((s) => s.orbitals.every((fill) => fill === ''))).toBe(true)
  })

  it('writes the drawn configuration on its line, with superscripts', () => {
    expect(configRuns(settings({ z: 8 }))).toEqual([
      { text: '1s' },
      { text: '2', sup: true },
      { text: ' 2s' },
      { text: '2', sup: true },
      { text: ' 2p' },
      { text: '4', sup: true },
    ])
    expect(configRuns(settings({ z: 11, extra: 1, changes: { '3s': [''], '3p': ['u', '', ''] } })).map((r) => r.text).join('')).toBe(
      '1s2 2s2 2p6 3p1',
    )
  })

  it('says what is blank for screen readers', () => {
    const label = figureLabel(settings({ symbol: 'blank', labels: 'blank', configLine: 'blank' }))
    expect(label).toContain('blank for the symbol')
    expect(label).toContain('Sublevel labels are blank')
    expect(label).toContain('blank line for the configuration')
    expect(figureLabel(settings())).toBe('An orbital diagram for O: 1s: pair; 2s: pair; 2p: pair, up, up.')
  })

  it('wraps rows between sublevels, never wider than a row', () => {
    for (const { z } of ELEMENTS)
      for (const orbitals of ['squares', 'lines'] as const) {
        const s = settings({ z, orbitals, symbol: 'none' })
        const layout = layoutOf(s)
        for (const sub of layout.sublevels) expect(sub.x + sub.width).toBeLessThanOrEqual(MAX_ROW)
        const tops = [...new Set(layout.sublevels.map((sub) => sub.y))]
        expect(tops).toEqual(layout.rows)
      }
  })

  it('puts short diagrams on one row and long ones on several', () => {
    expect(layoutOf(settings({ z: 8 })).rows).toHaveLength(1)
    expect(layoutOf(settings({ z: 79 })).rows.length).toBeGreaterThan(1)
  })

  it('stacks sublevels by energy, each letter in its own column', () => {
    const layout = layoutOf(settings({ z: 26, arrangement: 'energy', symbol: 'none' }))
    const at = Object.fromEntries(layout.sublevels.map((sub) => [sub.name, sub]))
    const upward = ['1s', '2s', '2p', '3s', '3p', '4s', '3d']
    for (let i = 1; i < upward.length; i++) expect(at[upward[i]].y).toBeLessThan(at[upward[i - 1]].y)
    expect(new Set(layout.sublevels.map((sub) => sub.y)).size).toBe(upward.length)
    expect(at['1s'].x).toBe(at['4s'].x)
    expect(at['2p'].x).toBe(at['3p'].x)
    expect(at['2p'].x).toBeGreaterThan(at['2s'].x + at['2s'].width)
    expect(at['3d'].x).toBeGreaterThan(at['3p'].x + at['3p'].width)
    expect(layout.rows).toHaveLength(upward.length)
  })

  it('stacks by energy the same in shell order, and puts the core at the bottom', () => {
    const tops = (s: OrbitalSettings) => Object.fromEntries(layoutOf(s).sublevels.map((sub) => [sub.name, sub.y]))
    expect(tops(settings({ z: 26, arrangement: 'energy', order: 'shell' }))).toEqual(tops(settings({ z: 26, arrangement: 'energy' })))
    const layout = layoutOf(settings({ z: 26, arrangement: 'energy', core: true }))
    expect(layout.core!.y).toBeGreaterThan(Math.max(...layout.sublevels.map((sub) => sub.y)))
  })

  it('is at least as wide as its answer key', () => {
    const answer = ['A very long answer key line that is much wider than the diagram of hydrogen']
    expect(layoutOf(settings({ z: 1 }), answer).width).toBeGreaterThan(layoutOf(settings({ z: 1 })).width)
  })
})
