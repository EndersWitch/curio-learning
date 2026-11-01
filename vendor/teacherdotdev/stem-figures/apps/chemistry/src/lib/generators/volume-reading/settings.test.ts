import { describe, expect, it } from 'vitest'
import { marks } from '$lib/shared/marks'
import { scaleMarks, volumeScale } from './scale'
import { answerLine, magnifierView, volumeSettings } from './settings'

const fromQuery = (query: string) => volumeSettings.fromParams(new URLSearchParams(query))

describe('the reading in the address', () => {
  it('reaches the top of the 1000 mL cylinder', () => {
    expect(volumeSettings.fromParams(new URLSearchParams('size=1000&reading=870')).reading).toBe(870)
  })
})

describe('the magnifier for each instrument', () => {
  it('a beaker has none unless the teacher turns it on', () => {
    const beaker = volumeSettings.fromParams(new URLSearchParams('instrument=beaker'))
    expect(magnifierView(beaker)).toBe('whole')
    expect(magnifierView({ ...beaker, beakerView: 'both' })).toBe('both')
  })

  it('a cylinder or buret keeps its own, and the beaker’s doesn’t change it', () => {
    const cylinder = volumeSettings.defaults
    expect(magnifierView(cylinder)).toBe('both')
    expect(magnifierView({ ...cylinder, beakerView: 'magnifier' })).toBe('both')
    expect(magnifierView({ ...cylinder, instrument: 'buret', view: 'magnifier' })).toBe('magnifier')
  })

  it('old links without a beaker setting open unchanged', () => {
    expect(volumeSettings.toQuery(volumeSettings.fromParams(new URLSearchParams('view=whole&reading=12')))).toBe('reading=12&view=whole')
  })
})

describe('addresses from before the scale could be chosen', () => {
  // Each instrument's scale as it was drawn: numbered every, marked every,
  // decimal places, lowest mark. Only the 25 mL cylinder changed, on purpose.
  it.each([
    ['', 10, 1, 1, 0],
    ['size=10', 1, 0.1, 2, 0],
    ['size=50', 10, 1, 1, 0],
    ['size=250', 20, 2, 1, 10],
    ['size=1000', 100, 10, 0, 0],
    ['instrument=buret', 1, 0.1, 2, 0],
    ['instrument=beaker&beaker=small', 10, 10, 0, 0],
    ['instrument=beaker', 50, 25, 0, 0],
    ['instrument=beaker&beaker=large', 100, 50, 0, 0],
  ] as const)('"%s" draws the same scale: numbered every %s, marked every %s', (query, labelEvery, minorEvery, decimals, lowest) => {
    const scale = volumeScale(fromQuery(query))
    expect(scale).toMatchObject({ labelEvery, minorEvery, decimals, lowest, numbered: true })
    expect(scaleMarks(scale)).toEqual(marks({ from: lowest, max: scale.capacity, labelEvery, minorEvery }))
  })

  it('beakers keep a medium mark between numbers', () => {
    const kinds = (query: string) => scaleMarks(volumeScale(fromQuery(query))).map((m) => m.kind).slice(0, 3)
    expect(kinds('instrument=beaker')).toEqual(['major', 'medium', 'major'])
    expect(kinds('instrument=beaker&beaker=large')).toEqual(['major', 'medium', 'major'])
  })

  it('the 25 mL cylinder now has 0.5 mL marks numbered every 5 mL, and reads to the same 0.01 mL', () => {
    expect(volumeScale(fromQuery('size=25'))).toMatchObject({ labelEvery: 5, minorEvery: 0.5, decimals: 2 })
    expect(fromQuery('size=25&reading=12.375').reading).toBe(12.38)
  })

  it.each([
    ['', 'Reading: 43.6 mL'],
    ['reading=34.5', 'Reading: 34.5 mL'],
    ['size=10&reading=7.36&tint=blue', 'Reading: 7.36 mL'],
    ['size=50&reading=26&view=magnifier&span=4', 'Reading: 26.0 mL'],
    ['size=1000&reading=640&view=whole&tint=green', 'Reading: 640 mL'],
    ['size=250&reading=4', 'Reading: 10.0 mL'],
    ['instrument=buret&reading=12.35', 'Reading: 12.35 mL'],
    ['instrument=beaker&beaker=small&reading=33.3', 'Reading: 33 mL'],
    ['instrument=beaker&reading=160&tint=red', 'Reading: 160 mL'],
  ])('"%s" keeps its reading and its address', (query, answer) => {
    const s = fromQuery(query)
    expect(answerLine(s)).toBe(answer)
    expect(s).toMatchObject({ marks: 'standard', numbers: 'standard', unit: 'mL', guide: false })
    expect(volumeSettings.toQuery(s)).toBe(query.replace('reading=4', 'reading=10').replace('reading=33.3', 'reading=33'))
  })
})

describe('the scale in the address', () => {
  it('keeps marks and numbers the instrument offers', () => {
    // 0.2 mL marks numbered every 5 would be 25 marks between numbers
    expect(fromQuery('size=25&marks=0.2&numbers=5')).toMatchObject({ marks: '0.2', numbers: 'standard' })
    expect(fromQuery('size=25&marks=1&numbers=1')).toMatchObject({ marks: '1', numbers: '1' })
  })

  it('puts others back to the standard ones, so the address names only what it draws', () => {
    expect(fromQuery('size=100&marks=0.1&numbers=1')).toMatchObject({ marks: 'standard', numbers: 'standard' })
    expect(volumeSettings.toQuery(fromQuery('size=50&marks=1&numbers=10'))).toBe('size=50')
  })

  it('rounds the reading to the marks’ precision', () => {
    expect(fromQuery('size=25&marks=1&reading=18.64').reading).toBe(18.6)
    expect(fromQuery('size=25&marks=0.2&reading=18.643').reading).toBe(18.64)
  })
})

describe('the unit', () => {
  it('is mL unless the teacher picks cm³, and never changes the reading', () => {
    expect(answerLine(fromQuery('reading=43.6&unit=cm3'))).toBe('Reading: 43.6 cm³')
    expect(fromQuery('unit=cm3').reading).toBe(volumeSettings.defaults.reading)
  })
})
