import { describe, expect, it } from 'vitest'
import { parseFamily, refKey } from './family'
import {
  compareModes,
  fitsMode,
  genotypeLabel,
  genotypesFor,
  inherit,
  labelText,
  likelihood,
  MODES,
  phenotypeOf,
  possibleGenotypes,
  tellsMode,
  type Mode,
} from './genetics'

const read = (text: string) => parseFamily(text)!
const key = (path: number[], partner = false) => refKey({ path, partner })
const fitting = (text: string, carriers = false) => MODES.filter((m) => fitsMode(read(text), m, carriers))

describe('genotypes and phenotypes', () => {
  it('follow each mode’s dominance', () => {
    expect(['a0', 'a1', 'a2'].map((g) => phenotypeOf('ad', g))).toEqual(['unaffected', 'affected', 'affected'])
    expect(['a0', 'a1', 'a2'].map((g) => phenotypeOf('ar', g))).toEqual(['unaffected', 'carrier', 'affected'])
    expect(['m0', 'm1', 'f0', 'f1', 'f2'].map((g) => phenotypeOf('xr', g))).toEqual(['unaffected', 'affected', 'unaffected', 'carrier', 'affected'])
    expect(['m0', 'm1', 'f0', 'f1', 'f2'].map((g) => phenotypeOf('xd', g))).toEqual(['unaffected', 'affected', 'unaffected', 'affected', 'affected'])
    expect(genotypesFor('y', 'f')).toEqual(['f0'])
  })

  it('are passed down with chances adding to one', () => {
    for (const mode of MODES) {
      for (const father of genotypesFor(mode, 'm')) {
        for (const mother of genotypesFor(mode, 'f')) {
          for (const sex of ['m', 'f', 'u'] as const) {
            const total = genotypesFor(mode, sex).reduce((s, g) => s + inherit(mode, father, mother, g, sex), 0)
            expect(total).toBeCloseTo(1)
          }
        }
      }
    }
  })

  it('pass an X from father to daughter, never to son', () => {
    expect(inherit('xr', 'm1', 'f0', 'f1', 'f')).toBe(1)
    expect(inherit('xr', 'm1', 'f0', 'm1', 'm')).toBe(0)
    expect(inherit('xr', 'm0', 'f1', 'm1', 'm')).toBe(0.5)
    expect(inherit('y', 'm1', 'f0', 'm1', 'm')).toBe(1)
  })
})

describe('which modes a family fits', () => {
  it('rules out dominance when unaffected parents have an affected child', () => {
    expect(fitting('m-f2Mf')).toEqual(['ar', 'xr'])
  })

  it('rules out X-linked recessive for an affected daughter of an unaffected father', () => {
    expect(fitting('m-f2Fm')).toEqual(['ar'])
  })

  it('rules out recessive when affected parents have an unaffected child', () => {
    expect(fitting('M-F2mF')).toEqual(['ad', 'xd'])
  })

  it('rules out X-linked dominant when an affected father has an unaffected daughter', () => {
    expect(fitting('M-f2fM')).not.toContain('xd')
  })

  it('rules out Y-linked for any affected woman, or an affected father’s unaffected son', () => {
    expect(fitting('F-m2fm')).not.toContain('y')
    expect(fitting('M-f2mM')).not.toContain('y')
    expect(fitting('M-f2MM')).toContain('y')
  })

  it('reads carriers as drawn when they are shown', () => {
    // Shown as not carriers, unaffected parents can't have a recessive child.
    expect(fitsMode(read('m-f1F'), 'ar', true)).toBe(false)
    expect(fitsMode(read('mc-fc1F'), 'ar', true)).toBe(true)
    // A man can't carry an X-linked recessive trait.
    expect(fitsMode(read('mc-f1m'), 'xr', true)).toBe(false)
    // Dominant traits have no carriers.
    expect(fitsMode(read('m-fc1m'), 'ad', true)).toBe(false)
  })

  it('can’t follow an X through a couple who aren’t a man and a woman', () => {
    const f = read('m-f1M-f1m')
    f.children[0].partner!.sex = 'm'
    expect(possibleGenotypes(f, 'xr', false)).toBeUndefined()
    expect(likelihood(f, 'xr', false)).toBe(0)
  })
})

describe('what students can work out', () => {
  it('finds carrier parents of an affected child', () => {
    const sets = possibleGenotypes(read('m-f3MfF'), 'ar', false)!
    expect(sets.get(key([]))).toEqual(['a1'])
    expect(sets.get(key([], true))).toEqual(['a1'])
    expect(sets.get(key([1]))).toEqual(['a0', 'a1'])
  })

  it('finds an affected parent heterozygous when a child is unaffected', () => {
    const sets = possibleGenotypes(read('M-f2Mf'), 'ad', false)!
    expect(sets.get(key([]))).toEqual(['a1'])
    expect(sets.get(key([0]))).toEqual(['a1'])
  })

  it('finds an affected man’s daughters carriers of an X-linked recessive trait', () => {
    const sets = possibleGenotypes(read('M-f2fm'), 'xr', false)!
    expect(sets.get(key([0]))).toEqual(['f1'])
    expect(sets.get(key([], true))).toEqual(['f0', 'f1'])
  })

  it('gives identical twins one genotype', () => {
    const sets = possibleGenotypes(read('m-f4MmimF'), 'ar', false)!
    expect(sets.get(key([1]))).toEqual(sets.get(key([2])))
  })

  it('writes genotypes with a blank for an allele that can’t be told', () => {
    const text = (mode: Mode, gs: string[], letter = 'A') => labelText(genotypeLabel(mode, gs, letter)!)
    expect(text('ar', ['a1'])).toBe('Aa')
    expect(text('ar', ['a0', 'a1'])).toBe('A_')
    expect(text('ad', ['a1', 'a2'], 'h')).toBe('H_')
    expect(text('ad', ['a0'], 'h')).toBe('hh')
    expect(text('xr', ['f1'], 'h')).toBe('X^H X^h')
    expect(text('xr', ['f0', 'f1'], 'h')).toBe('X^H X^_')
    expect(text('xr', ['m1'], 'h')).toBe('X^h Y')
    expect(text('xd', ['m1'], 'r')).toBe('X^R Y')
    expect(text('y', ['m1'], 'h')).toBe('X Y^H')
    expect(text('y', ['m0'])).toBe('XY')
    // Unknown sex in a sex-linked mode: nothing sensible to write.
    expect(genotypeLabel('xr', ['m0', 'f0'], 'A')).toBeUndefined()
  })
})

describe('telling modes apart', () => {
  it('rates a family with every affected man’s mother a carrier as X-linked recessive', () => {
    const f = read('m-f4Mfc-m3MmfmM')
    const result = compareModes(f, false)
    expect(result.find((r) => r.mode === 'xr')!.odds).toBe(1)
    expect(result.find((r) => r.mode === 'ar')!.odds).toBeGreaterThan(10)
    expect(tellsMode(f, 'xr')).toBe(true)
  })

  it('can’t tell X-linked dominant from autosomal dominant through affected mothers alone', () => {
    const f = read('m-F4MfFm')
    expect(tellsMode(f, 'xd')).toBe(false)
    expect(tellsMode(f, 'ad')).toBe(false)
  })

  it('tells X-linked dominant from an affected father with only affected daughters and unaffected sons', () => {
    expect(tellsMode(read('M-f5FFmmF'), 'xd')).toBe(true)
    expect(tellsMode(read('M-f2Fm'), 'xd')).toBe(false)
  })
})
