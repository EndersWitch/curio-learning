import { describe, expect, test } from 'vitest'
import { KINDS, convex } from './kinds.js'
import { plain, readQuadrilateral, tidy, type Settings } from './settings.js'

const read = (s: Partial<Settings> & Pick<Settings, 'kind'>) => readQuadrilateral(tidy(s.kind, plain(s.kind), { ...plain(s.kind), ...s }))
const sample = (kind: Settings['kind']) => readQuadrilateral(plain(kind))

describe('every kind', () => {
  test.each(KINDS.map((k) => k.id))('%s: its sample numbers make a convex quadrilateral', (kind) => {
    const r = sample(kind)
    expect(r.problem).toBeNull()
    expect(convex(r.shape!.corners)).toBe(true)
    const { angles } = r.shape!
    expect(angles.A + angles.B + angles.C + angles.D).toBeCloseTo(360)
  })
})

describe('the measures each kind gives', () => {
  test('a rectangle has four right angles and opposite sides equal', () => {
    const { angles, sides } = sample('rectangle').shape!
    for (const a of Object.values(angles)) expect(a).toBeCloseTo(90)
    expect([sides.CD, sides.DA]).toEqual([sides.AB, sides.BC])
  })

  test('a parallelogram keeps its angle and its sides', () => {
    const { angles, sides } = read({ kind: 'parallelogram', AB: '10', DA: '6', A: '60' }).shape!
    expect([angles.A, angles.B, angles.C]).toEqual([expect.closeTo(60), expect.closeTo(120), expect.closeTo(60)])
    expect([sides.BC, sides.CD]).toEqual([expect.closeTo(6), expect.closeTo(10)])
  })

  test('a trapezoid leans by ∠A, with its bases parallel', () => {
    const { corners, angles } = read({ kind: 'trapezoid', AB: '12', CD: '7', h: '5', A: '65' }).shape!
    expect(corners.C[1]).toBeCloseTo(5)
    expect(corners.D[1]).toBeCloseTo(5)
    expect(angles.A).toBeCloseTo(65)
    expect(angles.A + angles.D).toBeCloseTo(180)
  })

  test('a trapezoid can lean out past its base', () => {
    const r = read({ kind: 'trapezoid', AB: '4', CD: '9', h: '3', A: '30' })
    expect(r.shape!.angles.B).toBeGreaterThan(90)
  })

  test('an isosceles trapezoid has equal legs and base angles', () => {
    const { angles, sides } = read({ kind: 'isosceles-trapezoid', AB: '12', CD: '6', h: '4' }).shape!
    expect(sides.BC).toBeCloseTo(sides.DA)
    expect(angles.A).toBeCloseTo(angles.B)
    expect(sides.DA).toBeCloseTo(5)
  })

  test('a right trapezoid is square at A and D, with BC slanted', () => {
    const { angles, sides } = read({ kind: 'right-trapezoid', AB: '12', CD: '7', DA: '5' }).shape!
    expect([angles.A, angles.D]).toEqual([expect.closeTo(90), expect.closeTo(90)])
    expect(sides.BC).toBeCloseTo(Math.hypot(5, 5))
  })

  test('a kite has two pairs of equal sides next to each other', () => {
    const { angles, sides } = read({ kind: 'kite', AB: '5', DA: '9', B: '100' }).shape!
    expect(sides.BC).toBeCloseTo(5)
    expect(sides.CD).toBeCloseTo(9)
    expect(angles.B).toBeCloseTo(100)
    expect(angles.A).toBeCloseTo(angles.C)
  })
})

describe('measures that don’t make the kind', () => {
  test('equal bases make a parallelogram, not a trapezoid', () => {
    expect(read({ kind: 'trapezoid', AB: '7', CD: '7', h: '5', A: '65' })).toMatchObject({ shape: null, field: 'CD', problem: expect.stringMatching(/parallelogram/) })
    expect(read({ kind: 'right-trapezoid', AB: '7', CD: '7' }).problem).toMatch(/rectangle/)
  })

  test('a kite whose long sides can’t reach', () => {
    expect(read({ kind: 'kite', AB: '5', DA: '2', B: '100' })).toMatchObject({ shape: null, field: 'DA' })
  })

  test('empty, unreadable and impossible measures', () => {
    const r = read({ kind: 'parallelogram', AB: '', DA: 'x+', A: '200' })
    expect(r.problems).toEqual({ AB: 'Give AB a length.', DA: expect.stringMatching(/Type a number/), A: '∠A has to be between 0° and 180°.' })
    expect(read({ kind: 'square', AB: '-2' }).problems.AB).toBe('AB has to be more than 0.')
  })

  test('messages use the teacher’s corner names', () => {
    expect(read({ kind: 'trapezoid', nameA: 'P', nameB: 'Q', nameC: 'R', nameD: 'S', AB: '7', CD: '7', h: '5', A: '65' }).problem).toMatch(/PQ and RS/)
  })
})
