import { describe, expect, it } from 'vitest'
import { verdicts } from './clues'
import { formatFamily, parseFamily } from './family'
import { familyOf, pedigreeSettings } from './settings'

const d = pedigreeSettings.defaults
const fromQuery = (query: string) => pedigreeSettings.fromParams(new URLSearchParams(query))

describe('settings in the address', () => {
  it('are left out at their defaults', () => {
    expect(pedigreeSettings.toQuery(d)).toBe('')
  })

  it('carry a family changed by hand, readably and intact', () => {
    const s = { ...d, mode: 'xr' as const, family: 'm-fc2Mfc', carriers: 'dot' as const, letter: 'H' }
    const query = pedigreeSettings.toQuery(s)
    expect(query).toContain('family=m-fc2Mfc')
    expect(fromQuery(query)).toEqual(s)
    expect(formatFamily(familyOf(fromQuery(query)))).toBe('m-fc2Mfc')
  })

  it('draw the random family for anything that isn’t a family', () => {
    const s = fromQuery('family=hello&generations=9&letter=7')
    expect(s).toMatchObject({ family: '', generations: 4, letter: 'A' })
    expect(formatFamily(familyOf(s))).toBe(formatFamily(familyOf({ ...d, generations: 4 })))
  })

  it('keep the allele letter one capital', () => {
    expect(fromQuery('letter=h').letter).toBe('H')
    expect(fromQuery('letter=hh').letter).toBe('A')
  })

  it('give the same family for the same seed', () => {
    expect(formatFamily(familyOf(fromQuery('seed=77&mode=ad')))).toBe(formatFamily(familyOf(fromQuery('seed=77&mode=ad'))))
  })
})

describe('how students can tell', () => {
  const read = (text: string) => parseFamily(text)!
  const names = (key: string) => key || 'founder'
  const verdict = (text: string, mode: string) => verdicts(read(text), names, false).find((v) => v.mode === mode)!

  it('names the clue that rules each mode out', () => {
    expect(verdict('m-f2Fm', 'ad').reasons[0]).toBe('founder and p are unaffected but have an affected daughter, 0.')
    expect(verdict('m-f2Fm', 'xr').reasons[0]).toBe('0 is an affected daughter of an unaffected father, founder.')
    expect(verdict('M-F2mF', 'ar').reasons[0]).toBe('founder and p are both affected but have an unaffected son, 0.')
    expect(verdict('m-F2mF', 'xr').reasons[0]).toBe('p is affected but her son 0 isn’t.')
    expect(verdict('M-f2fM', 'xd').reasons[0]).toBe('founder is affected but his daughter 0 isn’t.')
    expect(verdict('M-f2MM', 'xd').reasons[0]).toBe('0 is affected, but his mother, p, isn’t.')
    expect(verdict('M-f2mM', 'y').reasons[0]).toBe('founder is affected but his son 0 isn’t.')
  })

  it('calls a mode that fits but is far less likely unlikely', () => {
    // Every affected man's mother a carrier: autosomal recessive would need
    // carriers marrying in.
    expect(verdict('m-f4Mfc-m3MmfmM', 'ar').verdict).toBe('unlikely')
    expect(verdict('m-f4Mfc-m3MmfmM', 'xr').verdict).toBe('fits')
  })
})
