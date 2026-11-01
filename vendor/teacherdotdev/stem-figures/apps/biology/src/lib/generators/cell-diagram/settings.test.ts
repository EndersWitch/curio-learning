import { describe, expect, it } from 'vitest'
import { QUICK, cellSettings, isQuick, withLabel, withPart } from './settings'
import type { PartId } from './structures'

const d = cellSettings.defaults
const fromQuery = (query: string) => cellSettings.fromParams(new URLSearchParams(query))

describe('settings in the address', () => {
  it('are left out at their defaults', () => {
    expect(cellSettings.toQuery(d)).toBe('')
  })

  it('write the structures taken out, put in and left unlabeled as lists, and travel intact', () => {
    const s = cellSettings.tidy({
      ...d,
      without: ['golgi', 'lysosomes'] as PartId[],
      with: ['microvilli'] as PartId[],
      unlabeled: ['ribosomes'] as PartId[],
      labels: 'numbers',
    })
    const query = cellSettings.toQuery(s)
    expect(query).toContain('without=golgi%2Clysosomes')
    expect(query).toContain('with=microvilli')
    expect(fromQuery(query)).toEqual(s)
  })

  it('ignore structures they don’t know, and ones the cell doesn’t have', () => {
    expect(fromQuery('without=golgi,banana').without).toEqual(d.without)
    expect(fromQuery('cell=plant&without=lysosomes,vacuole').without).toEqual(['vacuole'])
    expect(fromQuery('cell=bacterium&with=microvilli').with).toEqual([])
  })

  it('only add optional structures, and only take out standard ones', () => {
    expect(fromQuery('with=golgi').with).toEqual([])
    expect(fromQuery('without=microvilli').without).toEqual([])
  })
})

describe('changing the structures', () => {
  it('takes a standard one out and puts it back', () => {
    const out = { ...d, ...withPart(d, 'golgi', false) }
    expect(out.without).toEqual(['golgi'])
    expect(withPart(out, 'golgi', true).without).toEqual([])
  })

  it('puts an optional one in', () => {
    expect(withPart(d, 'cytoskeleton', true).with).toEqual(['cytoskeleton'])
  })

  it('turns a label off and on', () => {
    const off = withLabel(d, 'nucleus', false)
    expect(off).toEqual(['nucleus'])
    expect(withLabel({ ...d, unlabeled: off }, 'nucleus', true)).toEqual([])
  })

  it('recognises a quick start once applied', () => {
    for (const q of QUICK) expect(isQuick({ ...d, ...q.set }, q)).toBe(true)
    expect(isQuick(d, QUICK[1])).toBe(false)
  })
})
