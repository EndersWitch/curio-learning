import { describe, expect, it } from 'vitest'
import { answerLine, cylinderScale, displacementSettings } from './settings'

const fromQuery = (query: string) => displacementSettings.fromParams(new URLSearchParams(query))

describe('Volume by Displacement settings', () => {
  it('start like the classic worksheet: 4 → 6 mL in a 10 mL cylinder, captioned Before / After', () => {
    expect(displacementSettings.defaults).toMatchObject({ size: '10', before: 4, after: 6, beforeCaption: 'Before', afterCaption: 'After' })
    expect(displacementSettings.toQuery(displacementSettings.defaults)).toBe('')
  })

  it('fix readings from the address within the chosen cylinder', () => {
    expect(fromQuery('size=100&before=41.27&after=30')).toMatchObject({ before: 41.3, after: 41.4 })
    expect(fromQuery('size=10&before=40&after=90')).toMatchObject({ before: 9.99, after: 10 })
  })

  it('start with two marbles and no magnifiers, and never show magnifiers alone', () => {
    expect(displacementSettings.defaults).toMatchObject({ object: 'marbles', marbles: 2, view: 'whole' })
    expect(fromQuery('view=magnifier').view).toBe('whole')
    expect(fromQuery('view=both&marbles=3.4').marbles).toBe(3)
  })

  it('keep a cleared caption cleared', () => {
    const s = { ...displacementSettings.defaults, afterCaption: '' }
    expect(fromQuery(displacementSettings.toQuery(s)).afterCaption).toBe('')
  })

  it('write all three volumes in the answer key', () => {
    expect(answerLine(displacementSettings.defaults)).toBe('Before: 4.00 mL · After: 6.00 mL · Object: 2.00 mL')
    expect(answerLine(fromQuery('size=100&before=41.3&after=58.9'))).toBe('Before: 41.3 mL · After: 58.9 mL · Object: 17.6 mL')
  })
})

describe('addresses from before the scale could be chosen', () => {
  it.each([
    ['', 1, 0.1, 2],
    ['size=50&before=20&after=28&object=cube&view=both', 10, 1, 1],
    ['size=100&before=50&after=63.5&object=rock', 10, 1, 1],
  ] as const)('"%s" keeps its cylinders’ scale, readings and address', (query, labelEvery, minorEvery, decimals) => {
    const s = fromQuery(query)
    expect(cylinderScale(s)).toMatchObject({ labelEvery, minorEvery, decimals, numbered: true })
    expect(s).toMatchObject({ marks: 'standard', numbers: 'standard', unit: 'mL', guide: false })
    expect(displacementSettings.toQuery(s)).toBe(query)
  })

  it('the 25 mL cylinders now have 0.5 mL marks numbered every 5 mL, with the same readings', () => {
    const s = fromQuery('size=25&before=12&after=15.5&marbles=3')
    expect(cylinderScale(s)).toMatchObject({ labelEvery: 5, minorEvery: 0.5, decimals: 2 })
    expect(answerLine(s)).toBe('Before: 12.00 mL · After: 15.50 mL · Object: 3.50 mL')
  })
})

describe('the scale, precision and unit', () => {
  it('apply to both cylinders and the answer key', () => {
    const s = fromQuery('size=100&marks=2&numbers=20&unit=cm3&before=46&after=61')
    expect(cylinderScale(s)).toMatchObject({ minorEvery: 2, labelEvery: 20, decimals: 1 })
    expect(answerLine(s)).toBe('Before: 46.0 cm³ · After: 61.0 cm³ · Object: 15.0 cm³')
  })

  it('keep both readings on the chosen precision', () => {
    expect(fromQuery('size=25&marks=1&before=10.37&after=12.42')).toMatchObject({ before: 10.4, after: 12.4 })
  })

  it('go back to the standard ones where the cylinder doesn’t offer them', () => {
    expect(fromQuery('size=10&marks=2&numbers=20')).toMatchObject({ marks: 'standard', numbers: 'standard' })
  })
})
