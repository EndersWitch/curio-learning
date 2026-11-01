import { describe, expect, it } from 'vitest'
import {
  alleleId,
  crossText,
  fraction,
  gametes,
  genotypeCounts,
  genotypeKey,
  parseCross,
  percent,
  phenotypeCounts,
  phenotypesBySex,
  reduced,
  square,
  type Cross,
  type Dominance,
  type Genotype,
} from './genetics'

const read = (text: string, cross: Cross = 'monohybrid', dominance: Dominance = 'complete') => {
  const r = parseCross(text, cross, dominance)
  if (!r.ok) throw new Error(r.error)
  return r.value
}
const error = (text: string, cross: Cross = 'monohybrid', dominance: Dominance = 'complete') => {
  const r = parseCross(text, cross, dominance)
  if (r.ok) throw new Error(`${text} read as ${crossText(r.value)}`)
  return r.error
}
const ids = (g: Genotype[]) => g.map(genotypeKey)
const counts = (text: string, cross: Cross = 'monohybrid', dominance: Dominance = 'complete') =>
  genotypeCounts(square(read(text, cross, dominance))).map((t) => `${t.count} ${t.key}`)
const phenotypes = (text: string, cross: Cross = 'monohybrid', dominance: Dominance = 'complete') =>
  phenotypeCounts(square(read(text, cross, dominance))).map((t) => `${t.count} ${t.key}`)

describe('reading a cross', () => {
  it('reads the usual ways of writing one', () => {
    for (const t of ['Tt x tt', 'Tt × tt', 'Tt X tt', 'Tt*tt', 'tT x tt', '  Tt   x  tt ', 'TtXtt', 'Ttxtt']) {
      expect(crossText(read(t))).toBe('Tt × tt')
    }
  })

  it('writes the dominant allele first', () => {
    expect(crossText(read('aA x Aa'))).toBe('Aa × Aa')
    expect(crossText(read('yYrR × RrYy', 'dihybrid'))).toBe('YyRr × YyRr')
  })

  it('keeps genes in the first parent’s order', () => {
    expect(crossText(read('RrYy x yyrr', 'dihybrid'))).toBe('RrYy × rryy')
    expect(crossText(read('R r Y y x r r y y', 'dihybrid'))).toBe('RrYy × rryy')
  })

  it('reads superscripts written with ^, straight after, or pasted', () => {
    for (const t of ['C^R C^W x C^R C^W', 'CRCW x CRCW', 'CᴿCᵂ × CᴿCᵂ', 'CWCR x C^{R}C^W']) {
      expect(crossText(read(t, 'monohybrid', 'incomplete'))).toBe('C^R C^W × C^R C^W')
    }
    expect(crossText(read('IAi x iIB', 'monohybrid', 'codominance'))).toBe('I^A i × I^B i')
    expect(crossText(read('IAIB x ii', 'monohybrid', 'codominance'))).toBe('I^A I^B × i i')
  })

  it('reads subscripts written with _, as a digit straight after, or pasted', () => {
    for (const t of ['R_1 R_2 x R_1 R_2', 'R1R2 x R1R2', 'R₁R₂ × R₁R₂', 'R_2R_1 x R_{1}R_2']) {
      expect(crossText(read(t, 'monohybrid', 'incomplete'))).toBe('R_1 R_2 × R_1 R_2')
    }
    expect(crossText(read('A_{12} A_3 x A_3 A_3', 'monohybrid', 'codominance'))).toBe('A_{12} A_3 × A_3 A_3')
    // A subscript and a superscript on one allele, in either order.
    expect(crossText(read('C^R_1 C_2^R x C_1^R C_1^R', 'monohybrid', 'incomplete'))).toBe('C_1^R C_2^R × C_1^R C_1^R')
  })

  it('reads X-linked crosses in either order', () => {
    expect(crossText(read('XHXh x XHY', 'x-linked'))).toBe('X^H X^h × X^H Y')
    expect(crossText(read('X^hY × X^hX^H', 'x-linked'))).toBe('X^h Y × X^H X^h')
    expect(crossText(read('XʰXᴴ x YXᴴ', 'x-linked'))).toBe('X^H X^h × X^H Y')
    expect(crossText(read('XHXhxXHY', 'x-linked'))).toBe('X^H X^h × X^H Y')
  })

  it('explains what’s wrong', () => {
    expect(error('')).toMatch(/both parents/)
    expect(error('Tt')).toMatch(/×/)
    expect(error('Tt x tt x TT')).toMatch(/two parents/)
    expect(error('Tt3 x tt')).toMatch(/“3”/)
    expect(error('TTt x tt')).toMatch(/3 alleles/)
    expect(error('T x tt')).toMatch(/one allele/)
    expect(error('Tt x Rr')).toMatch(/same gene/)
    expect(error('RrYy x RrYy')).toMatch(/Dihybrid/)
    expect(error('Rr x Rr', 'dihybrid')).toMatch(/one gene/)
    expect(error('RrYy x Rrss', 'dihybrid')).toMatch(/same genes/)
    expect(error('C^RC^W x C^RC^W')).toMatch(/Superscripts/)
    expect(error('R_1R_2 x R_1R_2')).toMatch(/subscripts/)
    expect(error('R_{}R_2 x R_1R_2', 'monohybrid', 'incomplete')).toMatch(/after the _/)
    expect(error('X_1X_2 x X_1Y', 'x-linked', 'incomplete')).toMatch(/not a subscript/)
    expect(error('XHXh x XHXh', 'x-linked')).toMatch(/mother .* father/)
    expect(error('XX x XY', 'x-linked')).toMatch(/give each X its allele/)
    expect(error('Tt x tt', 'x-linked')).toMatch(/X and Y/)
    expect(error('XHXhY x XHY', 'x-linked')).toMatch(/two X chromosomes/)
    expect(error('XHXb x XHY', 'x-linked')).toMatch(/share one letter/)
  })
})

describe('gametes', () => {
  it('one allele from each gene', () => {
    const [p] = read('AaBb x aabb', 'dihybrid').parents
    expect(gametes(p).map((g) => g.map(alleleId).join(''))).toEqual(['AB', 'Ab', 'aB', 'ab'])
    const [q] = read('AABb x aabb', 'dihybrid').parents
    expect(gametes(q).map((g) => g.map(alleleId).join(''))).toEqual(['AB', 'Ab', 'AB', 'Ab'])
  })

  it('an X or a Y from a father', () => {
    const [, father] = read('XHXh x XhY', 'x-linked').parents
    expect(gametes(father).map((g) => g.map(alleleId).join(''))).toEqual(['X^h', 'Y'])
  })
})

describe('the square', () => {
  it('fills each cell from its row’s and column’s gametes', () => {
    const sq = square(read('Tt x tt'))
    expect(sq.cells.map(ids)).toEqual([
      ['Tt', 'tt'],
      ['Tt', 'tt'],
    ])
  })

  it('a dihybrid cross is four by four', () => {
    const sq = square(read('RrYy x RrYy', 'dihybrid'))
    expect(sq.cells).toHaveLength(4)
    expect(sq.cells[0].map(genotypeKey)).toEqual(['RRYY', 'RRYy', 'RrYY', 'RrYy'])
    expect(sq.cells[3].map(genotypeKey)).toEqual(['RrYy', 'Rryy', 'rrYy', 'rryy'])
  })

  it('writes sons with their X before their Y', () => {
    const sq = square(read('XHXh x XHY', 'x-linked'))
    expect(sq.cells.map(ids)).toEqual([
      ['X^HX^H', 'X^HX^h'],
      ['X^HY', 'X^hY'],
    ])
  })
})

describe('counting', () => {
  it('Mendel’s 1 : 2 : 1 and 3 : 1', () => {
    expect(counts('Tt x Tt')).toEqual(['1 TT', '2 Tt', '1 tt'])
    expect(phenotypes('Tt x Tt')).toEqual(['3 T', '1 t'])
  })

  it('a dihybrid’s 9 : 3 : 3 : 1', () => {
    expect(phenotypes('RrYy x RrYy', 'dihybrid')).toEqual(['9 R Y', '3 R y', '3 r Y', '1 r y'])
    expect(counts('RrYy x RrYy', 'dihybrid')).toEqual(['1 RRYY', '2 RRYy', '1 RRyy', '2 RrYY', '4 RrYy', '2 Rryy', '1 rrYY', '2 rrYy', '1 rryy'])
  })

  it('incomplete dominance gives every genotype its own phenotype', () => {
    expect(phenotypes('C^R C^W x C^R C^W', 'monohybrid', 'incomplete')).toEqual(['1 C^R', '2 C^R+C^W', '1 C^W'])
    expect(phenotypes('Rr x Rr', 'monohybrid', 'incomplete')).toEqual(['1 R', '2 R+r', '1 r'])
    expect(phenotypes('R_1 R_2 x R_1 R_2', 'monohybrid', 'incomplete')).toEqual(['1 R_1', '2 R_1+R_2', '1 R_2'])
    expect(counts('R_1 R_2 x R_1 R_2', 'monohybrid', 'incomplete')).toEqual(['1 R_1R_1', '2 R_1R_2', '1 R_2R_2'])
  })

  it('ABO: Iᴬ and Iᴮ codominant, both dominant to i', () => {
    expect(phenotypes('IAi x IBi', 'monohybrid', 'codominance')).toEqual(['1 I^A', '1 I^A+I^B', '1 I^B', '1 i'])
    expect(counts('IAi x IBi', 'monohybrid', 'codominance')).toEqual(['1 I^AI^B', '1 I^Ai', '1 I^Bi', '1 ii'])
    expect(phenotypes('IAi x IAi', 'monohybrid', 'codominance')).toEqual(['3 I^A', '1 i'])
  })

  it('X-linked phenotypes by sex', () => {
    const { daughters, sons } = phenotypesBySex(square(read('XBXb x XBY', 'x-linked')))
    expect(daughters.map((t) => `${t.count} ${t.key}`)).toEqual(['2 X^B'])
    expect(sons.map((t) => `${t.count} ${t.key}`)).toEqual(['1 X^B', '1 X^b'])
    expect(counts('XBXb x XBY', 'x-linked')).toEqual(['1 X^BX^B', '1 X^BX^b', '1 X^BY', '1 X^bY'])
  })

  it('in lowest terms, as percentages and as fractions', () => {
    expect(reduced([2, 2])).toEqual([1, 1])
    expect(reduced([9, 3, 3, 1])).toEqual([9, 3, 3, 1])
    expect(reduced([4])).toEqual([1])
    expect([percent(1, 4), percent(2, 16), percent(1, 16), percent(9, 16)]).toEqual(['25%', '12.5%', '6.25%', '56.25%'])
    expect([fraction(2, 4), fraction(3, 16), fraction(4, 16)]).toEqual(['1/2', '3/16', '1/4'])
  })
})
