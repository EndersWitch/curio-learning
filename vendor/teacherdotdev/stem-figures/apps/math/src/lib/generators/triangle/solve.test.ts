import { describe, expect, test } from 'vitest'
import { solveTriangle, type Part, type Solved } from './solve.js'

/** A result as the tests read it: the triangle's parts, or the problem (checked first). */
type Result = Omit<Solved, 'problem'> & { problem: string | null }

const none = { A: null, B: null, C: null, AB: null, BC: null, CA: null }
const solve = (given: Partial<Record<Part, number>>, options?: Parameters<typeof solveTriangle>[1]) =>
  solveTriangle({ ...none, ...given }, options) as Result

describe('enough measures', () => {
  test('two angles and the side between them (the teacher’s example)', () => {
    const t = solve({ A: 24, B: 90, AB: 12 })
    expect(t.problem).toBeNull()
    expect(t.angles.C).toBeCloseTo(66)
    expect(t.sides.BC).toBeCloseTo(12 * Math.tan((24 * Math.PI) / 180))
    expect(t.sides.CA).toBeCloseTo(12 / Math.cos((24 * Math.PI) / 180))
  })

  test('two angles and a side not between them', () => {
    const t = solve({ A: 30, B: 90, BC: 5 })
    expect(t.sides.CA).toBeCloseTo(10)
  })

  test('three sides', () => {
    const t = solve({ AB: 3, BC: 4, CA: 5 })
    expect(t.angles.B).toBeCloseTo(90)
    expect(t.angles.A + t.angles.B + t.angles.C).toBeCloseTo(180)
  })

  test('two sides and the angle between them', () => {
    const t = solve({ AB: 4, BC: 4, B: 60 })
    expect(t.sides.CA).toBeCloseTo(4)
    expect(t.angles.A).toBeCloseTo(60)
  })

  test('only angles: a shape but no size', () => {
    const t = solve({ A: 30, B: 60 })
    expect(t.sized).toBe(false)
    expect(t.angles.C).toBeCloseTo(90)
    expect(Math.max(...Object.values(t.sides))).toBeCloseTo(10)
  })

  test('roots and fractions arrive as numbers', () => {
    const t = solve({ B: 90, AB: 1, BC: Math.sqrt(3) })
    expect(t.angles.A).toBeCloseTo(60)
    expect(t.sides.CA).toBeCloseTo(2)
  })
})

describe('the ambiguous case', () => {
  test('two triangles: the acute one first, the other on request', () => {
    const t = solve({ A: 30, BC: 6, AB: 10 })
    expect(t.ambiguous).toBe(true)
    expect(t.angles.C).toBeCloseTo(Math.asin(10 * 0.5 / 6) * 180 / Math.PI)
    const o = solve({ A: 30, BC: 6, AB: 10 }, { other: true })
    expect(o.angles.C).toBeCloseTo(180 - t.angles.C)
    expect(o.sides.CA).toBeLessThan(t.sides.CA)
  })

  test('the side across is longer: only one', () => {
    expect(solve({ A: 30, BC: 12, AB: 10 }).ambiguous).toBe(false)
  })

  test('the side across just reaches: one right triangle', () => {
    const t = solve({ A: 30, BC: 5, AB: 10 })
    expect(t.ambiguous).toBe(false)
    expect(t.angles.C).toBeCloseTo(90)
  })

  test('the side across is too short', () => {
    expect(solve({ A: 30, BC: 4, AB: 10 }).problem).toMatch(/BC is too short.*at least 5/)
  })

  test('an obtuse angle needs the longest side across from it', () => {
    expect(solve({ A: 120, BC: 5, AB: 10 }).problem).toMatch(/BC has to be the longest side, since ∠A is obtuse/)
  })
})

describe('problems', () => {
  test.each([
    [{ A: 24, B: 90 + 0 }, null],
    [{ A: 24 }, /Give 2 more measures/],
    [{ A: 24, AB: 12 }, /Give one more measure/],
    [{ A: 100, B: 90 }, /∠A \+ ∠B is already 190°/],
    [{ A: 100, B: 50, C: 40 }, /∠A \+ ∠B \+ ∠C is 190°, not 180°/],
    [{ A: 180, B: 1, AB: 2 }, /∠A has to be between 0° and 180°/],
    [{ AB: 0, BC: 1, CA: 1 }, /AB has to be longer than 0/],
    [{ AB: 1, BC: 2, CA: 3 }, /can't make a triangle: AB \+ BC has to be longer than CA/],
  ])('%o', (given, problem) => {
    const t = solve(given)
    if (problem) expect(t.problem).toMatch(problem)
    else expect(t.problem).toBeNull()
  })

  test('extra measures that agree are fine, even rounded', () => {
    expect(solve({ A: 24, B: 90, C: 66, AB: 12 }).problem).toBeNull()
    expect(solve({ A: 24, B: 90, AB: 12, BC: 5.34 }).problem).toBeNull()
    expect(solve({ A: 36.9, B: 90, C: 53.1, AB: 4, BC: 3 }).problem).toBeNull()
  })

  test('extra measures that disagree say what they would be', () => {
    expect(solve({ A: 24, B: 90, AB: 12, BC: 6 }).problem).toBe('With the other measures, BC would be 5.34, not 6.')
    expect(solve({ AB: 3, BC: 4, CA: 5, A: 40 }).problem).toMatch(/∠A would be 53.13°, not 40°/)
  })

  test('messages use the vertex names', () => {
    const t = solve({ A: 100, B: 90 }, { names: { A: 'P', B: 'Q', C: 'R' } })
    expect(t.problem).toMatch(/∠P \+ ∠Q/)
  })
})
