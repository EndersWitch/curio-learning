import { describe, expect, it } from 'vitest'
import { parseCross, square } from './genetics'
import { isBlank, punnettLayout, shadingOf } from './layout'
import { COMMON_CROSSES, punnettSettings, readNames, squareOf, withCross, withName, writeNames, type PunnettSettings } from './settings'
import { genotypeLine, phenotypeLines, plainLine } from './summary'

const d = punnettSettings.defaults
const lines = (s: PunnettSettings) => {
  const sq = squareOf(s)
  return [genotypeLine(sq, s.form), ...phenotypeLines(sq, readNames(s.names), s.form)].map(plainLine)
}

describe('Punnett square settings', () => {
  it('start on Mendel’s Tt × Tt, left out of the address', () => {
    expect(d.parents).toBe('Tt × Tt')
    expect(punnettSettings.toQuery(d)).toBe('')
  })

  it('travel in the address', () => {
    const s = { ...d, cross: 'x-linked' as const, parents: 'X^B X^b × X^B Y', cells: 'some' as const, blanks: 6, shade: 'each' }
    expect(punnettSettings.fromParams(new URLSearchParams(punnettSettings.toQuery(s)))).toEqual(s)
  })

  it('replace a cross that doesn’t read with the kind’s starting one', () => {
    expect(punnettSettings.fromParams(new URLSearchParams('parents=Tt+x+Rr')).parents).toBe('Tt × Tt')
    expect(punnettSettings.fromParams(new URLSearchParams('cross=dihybrid')).parents).toBe('RrYy × RrYy')
    expect(punnettSettings.fromParams(new URLSearchParams('cross=x-linked')).parents).toBe('X^H X^h × X^H Y')
  })

  it('keep a dihybrid cross to complete dominance, and blank cells on the square', () => {
    const s = punnettSettings.tidy({ ...d, cross: 'dihybrid', parents: 'AaBb x aabb', dominance: 'incomplete', blanks: 3.2 })
    expect(s.dominance).toBe('complete')
    expect(s.blanks).toBe(3)
    expect(punnettSettings.tidy({ ...d, blanks: 255 }).blanks).toBe(15)
  })

  it('every common cross reads', () => {
    for (const c of COMMON_CROSSES) {
      const s = punnettSettings.tidy(withCross(d, c.settings))
      expect(s.parents, c.name).toBe(c.settings.parents)
      expect(parseCross(s.parents, s.cross, s.dominance).ok, c.name).toBe(true)
    }
  })

  it('keep phenotype names keyed by what they show', () => {
    expect([...readNames('T:tall;t:short')]).toEqual([['T', 'tall'], ['t', 'short']])
    expect(withName('T:tall;t:short', 't', 'dwarf')).toBe('T:tall;t:dwarf')
    expect(writeNames(new Map([['T', 'ta;ll:'], ['t', '  ']]))).toBe('T:tall')
  })
})

describe('the summary', () => {
  it('Mendel’s ratios', () => {
    expect(lines(d)).toEqual(['Genotype ratio: 1 TT : 2 Tt : 1 tt', 'Phenotype ratio: 3 tall : 1 short'])
  })

  it('reduces a test cross to 1 : 1, and writes one kind as all', () => {
    expect(lines({ ...d, parents: 'Tt x tt' })).toEqual(['Genotype ratio: 1 Tt : 1 tt', 'Phenotype ratio: 1 tall : 1 short'])
    expect(lines({ ...d, parents: 'TT x tt' })).toEqual(['Genotype ratio: all Tt', 'Phenotype ratio: all tall'])
    expect(lines({ ...d, parents: 'TT x tt', form: 'percent' })).toEqual(['Genotypes: 100% Tt', 'Phenotypes: 100% tall'])
  })

  it('a dihybrid’s 9 : 3 : 3 : 1, and as fractions', () => {
    const s = punnettSettings.tidy(withCross(d, COMMON_CROSSES[2].settings))
    expect(lines(s)[1]).toBe('Phenotype ratio: 9 round yellow : 3 round green : 3 wrinkled yellow : 1 wrinkled green')
    expect(lines({ ...s, form: 'fraction' })[1]).toBe('Phenotypes: 9/16 round yellow, 3/16 round green, 3/16 wrinkled yellow, 1/16 wrinkled green')
  })

  it('writes unnamed phenotypes the textbook way', () => {
    expect(lines({ ...d, names: '' })[1]).toBe('Phenotype ratio: 3 T_ : 1 tt')
    expect(lines({ ...d, cross: 'dihybrid', parents: 'AaBb x AaBb', names: '' })[1]).toBe('Phenotype ratio: 9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb')
    const abo = punnettSettings.tidy({ ...d, dominance: 'codominance', parents: 'IAi x IAi', names: '' })
    expect(lines(abo)[1]).toBe('Phenotype ratio: 3 IA_ : 1 ii')
  })

  it('splits X-linked phenotypes into daughters and sons', () => {
    const s = punnettSettings.tidy(withCross(d, COMMON_CROSSES[3].settings))
    expect(lines(s)).toEqual([
      'Genotype ratio: 1 XBXB : 1 XBXb : 1 XBY : 1 XbY',
      'Daughters: all normal vision',
      'Sons: 1 normal vision : 1 color-blind',
    ])
  })

  it('ABO blood types', () => {
    const s = punnettSettings.tidy(withCross(d, COMMON_CROSSES[5].settings))
    expect(lines(s)[1]).toBe('Phenotype ratio: 1 type A : 1 type AB : 1 type B : 1 type O')
  })
})

describe('the figure', () => {
  it('blanks the cells asked for', () => {
    const s = { ...d, cells: 'some' as const, blanks: 0b1001 }
    expect([0, 1, 2, 3].map((i) => isBlank(s, Math.floor(i / 2), i % 2, 2))).toEqual([true, false, false, true])
    const layout = punnettLayout(s, squareOf(s))
    expect(layout.cells.map((c) => c.lines.length)).toEqual([0, 1, 1, 0])
  })

  it('shades each phenotype apart, the most recessive white, and never a blank cell', () => {
    const sq = square((parseCross('RrYy x RrYy', 'dihybrid', 'complete') as { ok: true; value: never }).value)
    const s = { ...d, cross: 'dihybrid' as const, parents: 'RrYy x RrYy', shade: 'each' }
    expect([...shadingOf(s, sq).values()]).toEqual(['gray', 'hatch', 'dots', 'white'])
    const layout = punnettLayout({ ...s, cells: 'some', blanks: 1 }, sq)
    expect(layout.cells[0].fill).toBeUndefined()
    expect(layout.cells[1].fill).toBe('gray')
    expect(layout.key).toHaveLength(4)
  })

  it('draws lines to write on for blank gametes, parents and ratios', () => {
    const s = { ...d, gametes: 'blank' as const, parentGenotypes: 'blank' as const, genotypeRatio: 'blank' as const, phenotypeRatio: 'none' as const }
    const layout = punnettLayout(s, squareOf(s))
    expect(layout.blanks).toHaveLength(4 + 2 + 1)
  })

  it('grows cells to fit, and keeps the summary inside the figure', () => {
    const s = { ...d, cross: 'dihybrid' as const, parents: 'RrYy x RrYy', names: COMMON_CROSSES[2].settings.names!, cellNames: true, labelSize: 'large' as const }
    const layout = punnettLayout(s, squareOf(s))
    expect(layout.grid.cell).toBeGreaterThan(punnettLayout(d, squareOf(d)).grid.cell * 0.9)
    for (const line of layout.text) expect(line.x).toBeGreaterThanOrEqual(0)
    expect(layout.grid.x + 4 * layout.grid.cell).toBeLessThanOrEqual(layout.width + 0.5)
  })
})
