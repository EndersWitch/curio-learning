import { describe, expect, test } from 'vitest'
import { parseInequality, parseNumber, parseSequence, type Interval } from './inequality.js'

// Intervals written the way a teacher would: [ and ] closed, ( and ) open.
const show = ({ set, error }: { set: Interval[] | null; error: string | null }) =>
  error ??
  (set === null
    ? 'blank'
    : set.length
      ? set
          .map(({ lo, hi }) => (lo.v === hi.v ? `{${lo.v}}` : `${lo.closed ? '[' : '('}${lo.v}, ${hi.v}${hi.closed ? ']' : ')'}`))
          .join(' ∪ ')
      : 'empty')

describe('parseInequality', () => {
  test.each([
    ['', 'blank'],
    ['x > 3', '(3, Infinity)'],
    ['3 < x', '(3, Infinity)'],
    ['3 >= x', '(-Infinity, 3]'],
    ['-2 < x <= 5', '(-2, 5]'],
    ['5 >= x > -2', '(-2, 5]'],
    ['x < -1 or x >= 3', '(-Infinity, -1) ∪ [3, Infinity)'],
    ['x > -2 and x <= 5', '(-2, 5]'],
    ['x != 2', '(-Infinity, 2) ∪ (2, Infinity)'],
    ['x = 4', '{4}'],
    ['x<-1 or x>=3 or x=0', '(-Infinity, -1) ∪ {0} ∪ [3, Infinity)'],
    ['x <= 1 or x >= 1', '(-Infinity, Infinity)'],
    ['x < 1 or x > 1', '(-Infinity, 1) ∪ (1, Infinity)'],
    ['x < 1 or x = 1', '(-Infinity, 1]'],
    ['x > 5 and x < 2', 'empty'],
    ['all real numbers', '(-Infinity, Infinity)'],
    ['no solution', 'empty'],
    ['t >= 3pi/2', `[${(3 * Math.PI) / 2}, Infinity)`],
    ['-1/2 < θ < 1/2', '(-0.5, 0.5)'],
    ['3', '{3}'],
    ['4, -1, 2.5', '{-1} ∪ {2.5} ∪ {4}'],
    ['2, 2', '{2}'],
    ['-pi/2', `{${-Math.PI / 2}}`],
  ])('%s', (text, expected) => {
    expect(show(parseInequality(text))).toBe(expected)
  })

  test('tells points from equations', () => {
    expect(parseInequality('-1, 3').points).toBe(true)
    expect(parseInequality('x = 3').points).toBe(false)
  })

  test('reports the letter', () => {
    expect(parseInequality('-2 < t <= 5').variable).toBe('t')
    expect(parseInequality('no solution').variable).toBe(null)
  })

  test.each([
    ['2x + 1 < 7', 'Put the letter on one side'],
    ['x < y', 'Put the letter on one side'],
    ['x < 1 or y > 2', 'Use one letter throughout'],
    ['x <', 'Each side of an equation needs a number'],
    ['hello', 'Try an equation'],
    ['x < 1/0', 'Each side of an equation needs a number'],
    ['(2, 3)', 'A point on a number line is one number'],
  ])('explains what is wrong with %s', (text, start) => {
    expect(parseInequality(text).error).toMatch(new RegExp(`^${start}`))
  })
})

describe('parseNumber', () => {
  test.each([
    ['-2', -2],
    ['2.5', 2.5],
    ['1/3', 1 / 3],
    ['pi/4', Math.PI / 4],
    ['2π', 2 * Math.PI],
    ['', null],
    ['x', null],
    ['1/0', null],
  ])('%s', (text, expected) => {
    expect(parseNumber(text)).toBe(expected)
  })
})

describe('parseSequence', () => {
  const terms = (text: string) => {
    const read = parseSequence(text)
    return read === null ? 'not a sequence' : read.error ?? [1, 2, 3].map((n) => read.term!(n))
  }
  test.each([
    ['a_n = 1/n', [1, 1 / 2, 1 / 3]],
    ['a_{n}=2n+1', [3, 5, 7]],
    ['uₙ = n^2', [1, 4, 9]],
    ['f(n) = (-1)^n', [-1, 1, -1]],
    ['1/n', [1, 1 / 2, 1 / 3]],
    ['n', [1, 2, 3]],
    ['a_n = 4', [4, 4, 4]],
  ])('%s', (text, expected) => {
    expect(terms(text)).toEqual(expected)
  })

  test.each(['3', '-1, 2.5', 'x < 3', 'n < 3', 'n = 2', '2k', ''])('%s is not a sequence', (text) => {
    expect(terms(text)).toBe('not a sequence')
  })

  test.each([
    ['a_n = a_{n-1} + 3', /earlier terms/],
    ['a_n = 2k', /in n, not k/],
    ['a_n =', /after the = sign/],
    ['u_n', /Add = and the rule/],
    ['a_n = n < 3', /one rule/],
  ])('%s', (text, message) => {
    expect(terms(text)).toMatch(message)
  })
})
