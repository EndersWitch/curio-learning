import { describe, expect, test } from 'vitest'
import { looksLikeSummary, niceRange, parseData, summarize, withOutliers } from './stats.js'

describe('reading data', () => {
  test('commas, spaces, semicolons and new lines all separate numbers', () => {
    expect(parseData('12, 15 15;18\n22\t−3').values).toEqual([12, 15, 15, 18, 22, -3])
  })

  test('the first piece that is not a number is reported', () => {
    expect(parseData('1, 2, abc, 4').bad).toBe('abc')
  })
})

describe('five-number summary, the TI-84 way', () => {
  test('an odd count leaves the median out of both halves', () => {
    expect(summarize([11, 14, 15, 18, 20, 21, 24, 27, 30, 35, 42])).toEqual({ min: 11, q1: 15, median: 21, q3: 30, max: 42 })
  })

  test('an even count splits into two halves', () => {
    expect(summarize([1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ min: 1, q1: 2.5, median: 4.5, q3: 6.5, max: 8 })
  })

  test('order typed does not matter', () => {
    expect(summarize([30, 12, 18, 15, 22, 15])).toEqual(summarize([12, 15, 15, 18, 22, 30]))
  })

  test('one value is its own quartiles', () => {
    expect(summarize([7])).toEqual({ min: 7, q1: 7, median: 7, q3: 7, max: 7 })
  })
})

describe('outliers', () => {
  test('values past 1.5 box widths are drawn apart and the whiskers stop short', () => {
    const values = [1, 10, 11, 12, 13, 14, 15, 40]
    const cut = withOutliers(values, summarize(values))
    expect(cut).toEqual({ lo: 10, hi: 15, outliers: [1, 40] })
  })

  test('a value right on the fence stays in', () => {
    // Q1 2, Q3 6, so the fences are at −4 and 12.
    const values = [1, 2, 3, 4, 5, 6, 7, 12]
    expect(withOutliers(values, summarize(values)).outliers).toEqual([])
  })
})

test('five numbers in order read as a summary', () => {
  expect(looksLikeSummary([4, 7, 9, 12, 20])).toBe(true)
  expect(looksLikeSummary([7, 4, 9, 12, 20])).toBe(false)
  expect(looksLikeSummary([4, 7, 9, 12])).toBe(false)
})

describe('a tidy range around the data', () => {
  test('counts by 1, 2 or 5 times a power of ten in 12 steps or fewer', () => {
    expect(niceRange(11, 42)).toEqual({ from: 10, to: 45, step: 5 })
    expect(niceRange(0, 10)).toEqual({ from: 0, to: 10, step: 1 })
    expect(niceRange(0, 100)).toEqual({ from: 0, to: 100, step: 10 })
    expect(niceRange(1.2, 3.9)).toEqual({ from: 1, to: 4, step: 0.5 })
    expect(niceRange(-7, 3)).toEqual({ from: -7, to: 3, step: 1 })
  })

  test('data that is all one number gets room around it', () => {
    expect(niceRange(5, 5)).toEqual({ from: 0, to: 10, step: 1 })
  })
})
