import { describe, expect, test } from 'vitest'
import { DEFAULT_SETTINGS, cleanSettings, polygonName, readPolygon, settingsFromParams, settingsToQuery } from './settings.js'

const params = (q: string) => settingsFromParams(new URLSearchParams(q))
const read = (q: string) => readPolygon(params(q))

describe('the page address', () => {
  test('the opening hexagon has a bare address', () => {
    expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe('')
  })

  test('a link comes back the same', () => {
    const q = 'n=8&sizeBy=apothem&size=3sqrt%283%29&sideTicks=2&centerName=O&radius=1&radiusLabel=text&radiusText=r&rotate=20'
    expect(settingsToQuery(params(q))).toBe(q)
  })

  test('nonsense falls back to defaults, and the number of sides stays 3 to 20', () => {
    const s = params('n=99&sizeBy=diagonal&sideTicks=7&apothemStyle=wavy&rotate=999')
    expect([s.n, s.sizeBy, s.sideTicks, s.apothemStyle, s.rotate]).toEqual([20, 'side', 0, 'dashed', 180])
    expect(params('n=1').n).toBe(3)
  })
})

describe('readPolygon', () => {
  test('a hexagon’s side and radius are equal, its apothem √3/2 of them', () => {
    const { polygon } = read('')
    expect(polygon).toMatchObject({ side: 8, radius: expect.closeTo(8), apothem: expect.closeTo(4 * Math.sqrt(3)), interior: 120, central: 60 })
  })

  test('any one measure gives the other two', () => {
    const bySide = read('n=5&size=6').polygon!
    expect(read(`n=5&sizeBy=radius&size=${bySide.radius}`).polygon!.side).toBeCloseTo(6)
    expect(read(`n=5&sizeBy=apothem&size=${bySide.apothem}`).polygon!.side).toBeCloseTo(6)
  })

  test('a square’s apothem is half its side', () => {
    expect(read('n=4&size=10').polygon!.apothem).toBeCloseTo(5)
  })

  test('a size that can’t be read', () => {
    expect(read('size=').problem).toBe('Give the side a length.')
    expect(read('size=x%2B').problem).toMatch(/Type a number/)
    expect(read('sizeBy=radius&size=-1').problem).toBe('The radius has to be more than 0.')
  })

  test('names up to 12 sides, then n-gons', () => {
    expect([polygonName(3), polygonName(7), polygonName(12), polygonName(15)]).toEqual(['Equilateral triangle', 'Heptagon', 'Dodecagon', '15-gon'])
  })
})
