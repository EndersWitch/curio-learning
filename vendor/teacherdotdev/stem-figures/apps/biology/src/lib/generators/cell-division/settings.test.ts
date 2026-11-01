import { describe, expect, it } from 'vitest'
import { cellDivisionFigure, spread, textWidth } from './figure'
import { MEIOSIS_PHASES, MITOSIS_PHASES } from './model'
import { STARTERS } from './presets'
import { STRUCTURES, cellDivisionSettings, columnsFor, figurePhases, shownOrder, type CellDivisionSettings } from './settings'

const d = cellDivisionSettings.defaults
const fromQuery = (query: string) => cellDivisionSettings.fromParams(new URLSearchParams(query))
const make = (over: Partial<CellDivisionSettings> = {}) => cellDivisionSettings.tidy({ ...d, ...over })

describe('settings in the address', () => {
  it('are left out at their defaults', () => {
    expect(cellDivisionSettings.toQuery(d)).toBe('')
  })

  it('write a strip’s phases readably and travel intact', () => {
    const s = make({ process: 'meiosis', meiosisPhases: ['metaphase-1', 'metaphase-2'], crossingOver: true, diploid: '6' })
    const query = cellDivisionSettings.toQuery(s)
    expect(query).toContain('meiosisPhases=metaphase-1.metaphase-2')
    expect(fromQuery(query)).toEqual(s)
  })

  it('keep a strip’s phases in their real order, and ignore ones they can’t read', () => {
    expect(fromQuery('mitosisPhases=anaphase.prophase.nonsense').mitosisPhases).toEqual(['prophase', 'anaphase'])
    expect(fromQuery('mitosisPhases=nonsense').mitosisPhases).toEqual(d.mitosisPhases)
  })

  it('swap a phase from the other process for this one’s metaphase', () => {
    expect(fromQuery('phase=metaphase-2').phase).toBe('metaphase')
    expect(fromQuery('process=meiosis&phase=anaphase').phase).toBe('metaphase-1')
    expect(fromQuery('process=meiosis&phase=anaphase-2').phase).toBe('anaphase-2')
  })
})

describe('the strip', () => {
  it('shuffles from the seed, the same way every time, and never in order', () => {
    const phases = [...MITOSIS_PHASES]
    for (let seed = 1; seed < 40; seed++) {
      const a = shownOrder(phases, 'shuffled', seed)
      expect(a).toEqual(shownOrder(phases, 'shuffled', seed))
      expect([...a].sort()).toEqual([...phases].sort())
      expect(a).not.toEqual(phases)
    }
    expect(shownOrder(phases, 'in-order', 3)).toEqual(phases)
  })

  it('lays out a tidy grid', () => {
    expect(columnsFor(4, 'auto')).toBe(4)
    expect(columnsFor(6, 'auto')).toBe(3)
    expect(columnsFor(9, 'auto')).toBe(3)
    expect(columnsFor(8, 'auto')).toBe(4)
    expect(columnsFor(3, '6')).toBe(3)
  })

  it('answers with the right order when shuffled', () => {
    const s = make({ order: 'shuffled', seed: 7, phaseLabels: 'number' })
    const shown = figurePhases(s)
    const line = cellDivisionFigure(s).answer.split('\n').join(' · ')
    const order = line.match(/In order: ([\d, ]+)/)![1].split(', ').map(Number)
    expect(order.map((n) => shown[n - 1])).toEqual(s.mitosisPhases)
  })
})

describe('the figure', () => {
  const all = [
    ...MITOSIS_PHASES.map((phase) => ({ process: 'mitosis' as const, phase })),
    ...MEIOSIS_PHASES.map((phase) => ({ process: 'meiosis' as const, phase })),
  ]
  const labeled = Object.fromEntries(STRUCTURES.map((k) => [k, true]))

  it('keeps structure labels apart and inside the figure', () => {
    for (const { process, phase } of all)
      for (const cell of ['animal', 'plant'] as const)
        for (const labelStyle of ['names', 'letters', 'blank'] as const) {
          const f = cellDivisionFigure(make({ process, phase, cell, labelStyle, layout: 'single', labelSize: 'large', ...labeled }))
          for (const side of ['left', 'right'] as const) {
            const ys = f.labels.filter((l) => l.side === side).map((l) => l.y).sort((a, b) => a - b)
            for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1], `${phase} ${side}`).toBeGreaterThanOrEqual(f.fonts.label * 1.2)
          }
          for (const l of f.labels) {
            const w = l.text ? textWidth(l.text, f.fonts.label) : 96
            expect(l.side === 'left' ? l.x - w : l.x + w, `${phase} ${l.structure}`).toBeGreaterThanOrEqual(0)
            expect(l.side === 'left' ? l.x - w : l.x + w, `${phase} ${l.structure}`).toBeLessThanOrEqual(f.width)
            expect(l.y).toBeGreaterThan(0)
            expect(l.y).toBeLessThan(f.height)
          }
        }
  })

  it('names every structure a phase has, and lists the rest as missing', () => {
    const f = cellDivisionFigure(make({ layout: 'single', phase: 'metaphase', ...labeled }))
    expect(f.labels.map((l) => l.structure).sort()).toEqual(['centrioles', 'centromere', 'chromosome', 'pair', 'sisters', 'spindle'].sort())
    expect(f.missing.sort()).toEqual(['division', 'envelope'])
    expect(cellDivisionFigure(make({ layout: 'single', phase: 'metaphase-1', process: 'meiosis', pair: true })).labels[0].text).toBe('Tetrad')
    expect(cellDivisionFigure(make({ layout: 'single', phase: 'telophase', cell: 'plant', division: true })).labels[0].text).toBe('Cell plate')
  })

  it('keeps count labels under each cell from touching', () => {
    for (const process of ['mitosis', 'meiosis'] as const)
      for (const countLabels of ['ploidy', 'count'] as const)
        for (const diploid of ['2', '8'] as const) {
          const f = cellDivisionFigure(make({ process, countLabels, diploid, labelSize: 'large' }))
          const counts = f.panels.flatMap((p) => p.counts)
          for (let i = 0; i < counts.length; i++)
            for (let j = i + 1; j < counts.length; j++) {
              const [a, b] = [counts[i], counts[j]]
              if (Math.abs(a.y - b.y) > f.fonts.count) continue
              const gap = Math.abs(a.x - b.x) - (textWidth(a.text, f.fonts.count) + textWidth(b.text, f.fonts.count)) / 2
              expect(gap, `${a.text} / ${b.text}`).toBeGreaterThan(0)
            }
        }
  })

  it('draws every panel of a strip at the same scale, within the figure', () => {
    const f = cellDivisionFigure(make({ process: 'meiosis', meiosisPhases: [...MEIOSIS_PHASES], countLabels: 'ploidy', key: true }))
    expect(new Set(f.panels.map((p) => p.scale)).size).toBe(1)
    for (const p of f.panels) {
      expect(p.x - (p.picture.box.x2 - p.picture.box.x1) * p.scale * 0.5).toBeGreaterThanOrEqual(-1)
      expect(p.label!.y).toBeLessThanOrEqual(f.height)
    }
  })

  it('has a starting point for each common use, all valid settings', () => {
    for (const starter of STARTERS) expect(() => cellDivisionFigure(make(starter.settings))).not.toThrow()
    expect(new Set(STARTERS.map((p) => cellDivisionSettings.keyOf(make(p.settings)))).size).toBe(STARTERS.length)
  })
})

describe('spreading labels', () => {
  it('keeps them a gap apart, in order, within bounds where they fit', () => {
    expect(spread([10, 12, 14], 10, 0, 100)).toEqual([10, 20, 30])
    expect(spread([90, 95, 99], 10, 0, 100)).toEqual([80, 90, 100])
  })
})
