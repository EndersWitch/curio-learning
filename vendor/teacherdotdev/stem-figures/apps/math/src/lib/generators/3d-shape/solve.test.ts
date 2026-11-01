import { describe, expect, test } from 'vitest'
import { KINDS, kindOf, settingsFor } from './settings.js'
import { formOf, readShape } from './solve.js'

const params = (q: string) => {
  const p = new URLSearchParams(q)
  return settingsFor(kindOf(p.get('shape'))).settingsFromParams(p)
}
const toQuery = (q: string) => settingsFor(kindOf(new URLSearchParams(q).get('shape'))).settingsToQuery(params(q))
const read = (q: string) => readShape(params(q))

describe('the page address', () => {
  test.each(KINDS)('the opening %s has a bare address', (kind) => {
    const { DEFAULT_SETTINGS, cleanSettings, settingsToQuery } = settingsFor(kind)
    expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe('')
    expect(readShape(cleanSettings(DEFAULT_SETTINGS)).values).not.toBeNull()
  })

  test('a link comes back the same', () => {
    // The Cone Generator only draws cones, so its links don't say so.
    const cone = settingsFor('cone')
    const q = 'radius=3sqrt%282%29&height=&slant=7&diameter=1&names=1&nameList=P+Q&moved=slant%3A4%2C-6'
    expect(cone.settingsToQuery(cone.settingsFromParams(new URLSearchParams(q)))).toBe(q)
    expect(toQuery('shape=cone&radius=2')).toBe('radius=2')
    expect(toQuery('shape=hemisphere&bowl=1')).toBe('shape=hemisphere&bowl=1')
  })

  test('nonsense falls back to defaults', () => {
    const s = params('shape=torus&base=star&sides=12&pose=float&round=7&heightLabel=loud')
    expect([s.shape, s.base, s.sides, s.pose, s.round, s.heightLabel]).toEqual(['prism', 'rectangle', 6, 'auto', 1, 'auto'])
  })
})

describe('the form a shape takes', () => {
  test('a triangular prism lies down unless told to stand', () => {
    expect(formOf(params('base=right')).lie).toBe(true)
    expect(formOf(params('base=right&pose=stand')).lie).toBe(false)
    expect(formOf(params('base=regular')).lie).toBe(false)
    expect(formOf(params('pose=lie')).lie).toBe(false) // a box looks the same either way
  })

  test('a prism lying down can’t lean', () => {
    expect(formOf(params('base=right&oblique=1')).oblique).toBe(false)
    expect(formOf(params('base=right&pose=stand&oblique=1')).oblique).toBe(true)
  })

  test('a pyramid on a triangle stands on a rectangle instead', () => {
    expect(formOf(params('shape=pyramid&base=right')).base).toBe('rectangle')
    expect(params('shape=pyramid&base=right').base).toBe('rectangle')
  })

  test('each generator draws only its own shapes', () => {
    expect(settingsFor('cone').settingsFromParams(new URLSearchParams('shape=prism')).shape).toBe('cone')
    expect(settingsFor('sphere').settingsFromParams(new URLSearchParams('shape=hemisphere')).shape).toBe('hemisphere')
  })

  test('spheres don’t lean or have a height', () => {
    expect(formOf(params('shape=sphere&oblique=1')).parts).toEqual(['radius'])
  })
})

describe('worked-out measures', () => {
  test('the opening prism', () => {
    expect(read('').values).toMatchObject({ length: 5, width: 3, height: 4 })
  })

  test('an oblique prism from any two of height, lean and slanted edge', () => {
    expect(read('oblique=1&height=4&lean=3').values).toMatchObject({ edge: 5 })
    expect(read('oblique=1&height=&lean=3&edge=5').values).toMatchObject({ height: 4 })
    expect(read('oblique=1&height=4&lean=&edge=5').values).toMatchObject({ lean: 3 })
    expect(read('oblique=1&height=4&lean=3&edge=5').problem).toBeNull()
  })

  test('an oblique prism that doesn’t fit together', () => {
    expect(read('oblique=1&height=4&lean=3&edge=6').problem).toMatch(/don’t fit/)
    expect(read('oblique=1&height=4&lean=&edge=3').problem).toMatch(/longer/)
    expect(read('oblique=1&height=4&lean=').problem).toMatch(/Give two/)
  })

  test('a pyramid from its height or its slant height', () => {
    expect(read('shape=pyramid&height=4').values).toMatchObject({ slant: 5 })
    expect(read('shape=pyramid&height=&slant=5').values).toMatchObject({ height: 4 })
    expect(read('shape=pyramid&height=&slant=2').problem).toMatch(/half the width/)
    expect(read('shape=pyramid&height=').problem).toMatch(/height or the slant height/)
  })

  test('a cone typed by its diameter', () => {
    const r = read('shape=cone&radius=6&diameter=1&height=4')
    expect(r.values).toMatchObject({ radius: 6, slant: 5 })
  })

  test('a regular base’s apothem', () => {
    expect(read('base=regular&sides=4&side=6').values!.apothem).toBeCloseTo(3)
    expect(read('base=regular&sides=6&side=2').values!.apothem).toBeCloseTo(Math.sqrt(3))
  })

  test('a triangle base’s third side', () => {
    expect(read('base=right&triBase=3&triHeight=4').values!.hyp).toBeCloseTo(5)
    expect(read('base=isosceles&triBase=6&triHeight=4').values!.hyp).toBeCloseTo(5)
  })

  test('measures that aren’t numbers, or aren’t more than 0', () => {
    expect(read('length=x%2B').problems.length).toMatch(/Type a number/)
    expect(read('width=0').problems.width).toMatch(/more than 0/)
    expect(read('length=').problem).toBe('Give the length.')
  })
})
