import { describe, expect, it } from 'vitest'
import {
  MEIOSIS_PHASES,
  MITOSIS_PHASES,
  countText,
  countedGroups,
  matchingPhase,
  phaseState,
  type Chromatid,
  type Chromosome,
  type Phase,
} from './model'

const PAIRS = [1, 2, 3, 4]

const chromatids = (list: Chromosome[]) => list.flatMap((c) => c.chromatids)
const key = (t: Chromatid) => `${t.pair}${t.homolog}${t.sister}${t.tip}`
const cellsAt = (phase: Phase, pairs: number, crossing = false) => phaseState(phase, pairs, crossing).cells
const everything = (phase: Phase, pairs: number, crossing = false) => cellsAt(phase, pairs, crossing).flatMap((c) => c.groups.flat())
/** each pair's members in a set of chromosomes, e.g. "0m 0p 1m 1p" */
const members = (list: Chromosome[]) => list.map((c) => `${c.pair}${c.homolog}`).sort().join(' ')

describe('mitosis', () => {
  it('starts with 2n unreplicated chromosomes in G1, and 2n replicated ones in G2', () => {
    for (const pairs of PAIRS) {
      const g1 = everything('g1', pairs)
      expect(g1).toHaveLength(2 * pairs)
      expect(g1.every((c) => c.chromatids.length === 1)).toBe(true)
      const g2 = everything('g2', pairs)
      expect(g2).toHaveLength(2 * pairs)
      expect(g2.every((c) => c.chromatids.length === 2)).toBe(true)
    }
  })

  it('has one centrosome in G1 and two once it has copied it', () => {
    expect(phaseState('g1', 2).centrosomes).toBe(1)
    expect(phaseState('g2', 2).centrosomes).toBe(2)
  })

  it('keeps sister chromatids together until anaphase', () => {
    for (const phase of ['prophase', 'prometaphase', 'metaphase'] as const) {
      const [cell] = cellsAt(phase, 2)
      expect(cell.groups).toHaveLength(1)
      expect(cell.groups[0].every((c) => c.chromatids.length === 2 && c.chromatids[0].sister !== c.chromatids[1].sister)).toBe(true)
    }
  })

  it('separates sister chromatids in anaphase: each pole gets one chromatid of every chromosome', () => {
    for (const pairs of PAIRS) {
      for (const phase of ['anaphase', 'telophase'] as const) {
        const [cell] = cellsAt(phase, pairs)
        const [left, right] = cell.groups
        expect(left).toHaveLength(2 * pairs)
        expect(right).toHaveLength(2 * pairs)
        expect(chromatids(left).every((t) => t.sister === 0)).toBe(true)
        expect(chromatids(right).every((t) => t.sister === 1)).toBe(true)
        // both poles have the whole diploid set, maternal and paternal
        expect(members(left)).toBe(members(everything('g2', pairs)))
        expect(members(right)).toBe(members(left))
      }
    }
  })

  it('ends with two cells identical to the parent, each 2n', () => {
    for (const pairs of PAIRS) {
      const cells = cellsAt('cytokinesis', pairs)
      expect(cells).toHaveLength(2)
      for (const cell of cells) {
        expect(cell.groups).toHaveLength(1)
        expect(members(cell.groups[0])).toBe(members(everything('g1', pairs)))
        expect(cell.groups[0].every((c) => c.chromatids.length === 1)).toBe(true)
      }
    }
  })

  it('never pairs homologs or crosses over', () => {
    for (const phase of MITOSIS_PHASES) {
      expect(phaseState(phase, 3, true).paired).toBe(false)
      expect(everything(phase, 3, true).flatMap((c) => c.chromatids).every((t) => t.tip === t.homolog)).toBe(true)
    }
  })
})

describe('meiosis I', () => {
  it('pairs homologs as tetrads in prophase I through metaphase I', () => {
    for (const phase of ['prophase-1', 'prometaphase-1', 'metaphase-1'] as const) {
      const state = phaseState(phase, 3)
      expect(state.paired).toBe(true)
      const [cell] = state.cells
      expect(cell.groups[0]).toHaveLength(6)
      for (let pair = 0; pair < 3; pair++) expect(chromatids(cell.groups[0]).filter((t) => t.pair === pair)).toHaveLength(4)
    }
    for (const phase of MEIOSIS_PHASES.filter((p) => !['prophase-1', 'prometaphase-1', 'metaphase-1'].includes(p)))
      expect(phaseState(phase, 3).paired, phase).toBe(false)
  })

  it('separates homologs in anaphase I, keeping sister chromatids together', () => {
    for (const pairs of PAIRS) {
      const [cell] = cellsAt('anaphase-1', pairs)
      const [left, right] = cell.groups
      for (const side of [left, right]) {
        // one member of every pair, still two chromatids each
        expect(side.map((c) => c.pair).sort()).toEqual([...Array(pairs).keys()])
        expect(side.every((c) => c.chromatids.length === 2)).toBe(true)
      }
      for (let pair = 0; pair < pairs; pair++) {
        const l = left.find((c) => c.pair === pair)!
        const r = right.find((c) => c.pair === pair)!
        expect(l.homolog).not.toBe(r.homolog)
      }
    }
  })

  it('sends a mix of maternal and paternal chromosomes to each pole', () => {
    const [cell] = cellsAt('anaphase-1', 2)
    for (const side of cell.groups) expect(new Set(side.map((c) => c.homolog)).size).toBe(2)
  })

  it('makes two haploid cells of replicated chromosomes', () => {
    for (const pairs of PAIRS) {
      for (const phase of ['prophase-2', 'prometaphase-2', 'metaphase-2'] as const) {
        const cells = cellsAt(phase, pairs)
        expect(cells).toHaveLength(2)
        for (const cell of cells) {
          expect(cell.groups[0]).toHaveLength(pairs)
          expect(cell.groups[0].every((c) => c.chromatids.length === 2)).toBe(true)
        }
      }
    }
  })
})

describe('meiosis II', () => {
  it('separates sister chromatids in each haploid cell, as in mitosis', () => {
    for (const pairs of PAIRS) {
      const before = cellsAt('metaphase-2', pairs)
      const after = cellsAt('anaphase-2', pairs)
      after.forEach((cell, i) => {
        const [left, right] = cell.groups
        expect(members(left)).toBe(members(before[i].groups[0]))
        expect(members(right)).toBe(members(left))
        expect(chromatids(left).every((t) => t.sister === 0)).toBe(true)
        expect(chromatids(right).every((t) => t.sister === 1)).toBe(true)
      })
    }
  })

  it('ends with four haploid cells, each with one chromatid of every pair', () => {
    for (const pairs of PAIRS) {
      const cells = cellsAt('products', pairs)
      expect(cells).toHaveLength(4)
      for (const cell of cells) {
        const list = cell.groups[0]
        expect(list.map((c) => c.pair).sort()).toEqual([...Array(pairs).keys()])
        expect(list.every((c) => c.chromatids.length === 1)).toBe(true)
      }
    }
  })

  it('shares out all four chromatids of each tetrad, one to each cell', () => {
    for (const crossing of [false, true]) {
      const tetrads = chromatids(everything('metaphase-1', 3, crossing)).map(key).sort()
      const products = chromatids(everything('products', 3, crossing)).map(key).sort()
      expect(products).toEqual(tetrads)
    }
  })
})

describe('crossing over', () => {
  it('swaps the tips of the two inner, nonsister chromatids of each tetrad', () => {
    const tetrad = chromatids(everything('prophase-1', 2, true)).filter((t) => t.pair === 0)
    const swapped = tetrad.filter((t) => t.tip !== t.homolog).map((t) => `${t.homolog}${t.sister}`)
    expect(swapped.sort()).toEqual(['m1', 'p0'])
  })

  it('carries the swapped tips into every later phase', () => {
    for (const phase of MEIOSIS_PHASES.slice(MEIOSIS_PHASES.indexOf('prophase-1'))) {
      const list = chromatids(everything(phase, 3, true))
      expect(list.filter((t) => t.tip !== t.homolog), phase).toHaveLength(6)
    }
  })

  it('gives each pair one recombinant chromatid in two of the four cells', () => {
    const cells = cellsAt('products', 4, true)
    for (let pair = 0; pair < 4; pair++) {
      const recombinant = cells.map((cell) => cell.groups[0].find((c) => c.pair === pair)!.chromatids[0]).map((t) => t.tip !== t.homolog)
      expect(recombinant.filter(Boolean)).toHaveLength(2)
    }
  })

  it('leaves interphase and, when off, every phase unchanged', () => {
    expect(chromatids(everything('interphase', 2, true)).every((t) => t.tip === t.homolog)).toBe(true)
    for (const phase of MEIOSIS_PHASES) expect(chromatids(everything(phase, 2)).every((t) => t.tip === t.homolog)).toBe(true)
  })
})

describe('chromosome counts', () => {
  const labels = (phase: Phase, pairs: number, mode: 'ploidy' | 'count') =>
    countedGroups(phaseState(phase, pairs)).map((cell) => cell.map((group) => countText(group, pairs, mode)))

  it('are 2n through mitosis, for each cell to be', () => {
    expect(labels('g1', 2, 'ploidy')).toEqual([['2n = 4']])
    expect(labels('metaphase', 2, 'ploidy')).toEqual([['2n = 4']])
    expect(labels('anaphase', 2, 'ploidy')).toEqual([['2n = 4', '2n = 4']])
    expect(labels('cytokinesis', 3, 'ploidy')).toEqual([['2n = 6'], ['2n = 6']])
  })

  it('halve in meiosis I and stay haploid through meiosis II', () => {
    expect(labels('metaphase-1', 2, 'ploidy')).toEqual([['2n = 4']])
    expect(labels('anaphase-1', 2, 'ploidy')).toEqual([['n = 2', 'n = 2']])
    expect(labels('metaphase-2', 2, 'ploidy')).toEqual([['n = 2'], ['n = 2']])
    expect(labels('telophase-2', 2, 'ploidy')).toEqual([['n = 2', 'n = 2'], ['n = 2', 'n = 2']])
    expect(labels('products', 4, 'ploidy')).toEqual([['n = 4'], ['n = 4'], ['n = 4'], ['n = 4']])
  })

  it('count chromosomes by their centromeres', () => {
    expect(labels('metaphase', 2, 'count')).toEqual([['4 chromosomes']])
    expect(labels('metaphase-2', 1, 'count')).toEqual([['1 chromosome'], ['1 chromosome']])
  })
})

describe('switching process', () => {
  it('keeps to the same moment', () => {
    expect(matchingPhase('metaphase', 'meiosis')).toBe('metaphase-1')
    expect(matchingPhase('metaphase-2', 'mitosis')).toBe('metaphase')
    expect(matchingPhase('g1', 'meiosis')).toBe('interphase')
    expect(matchingPhase('products', 'mitosis')).toBe('cytokinesis')
    for (const phase of MITOSIS_PHASES) expect(MEIOSIS_PHASES).toContain(matchingPhase(phase, 'meiosis'))
    for (const phase of MEIOSIS_PHASES) expect(MITOSIS_PHASES).toContain(matchingPhase(phase, 'mitosis'))
  })
})
