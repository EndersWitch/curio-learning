import { describe, expect, test } from 'vitest'
import { niceLabel, numberingOf, type Label, type Numbering } from './numbering'

describe('niceLabel', () => {
  test.each<[number, Numbering, Label]>([
    [(3 * Math.PI) / 2, 'decimal', { sign: '', num: '3π', den: '2' }],
    [2.5, 'decimal', { text: '2.5' }],
    [1 / 3, 'decimal', { sign: '', num: '1', den: '3' }],
    [Math.SQRT2, 'decimal', { text: '1.41' }],
    [0.5, 'fraction', { sign: '', num: '1', den: '2' }],
  ])('%s in %s', (v, numbering, expected) => {
    expect(niceLabel(v, numbering)).toEqual(expected)
  })
})

describe('numbering follows how the range is typed', () => {
  test.each([
    [['0', '2pi', 'pi/4'], 'pi'],
    [['-π', 'π', '1'], 'pi'],
    [['0', '1', '1/4'], 'fraction'],
    [['0', '1', '0.25'], 'decimal'],
    [['-10', '10', '1'], 'decimal'],
  ])('%j', (texts, expected) => {
    expect(numberingOf(...texts)).toBe(expected)
  })
})
