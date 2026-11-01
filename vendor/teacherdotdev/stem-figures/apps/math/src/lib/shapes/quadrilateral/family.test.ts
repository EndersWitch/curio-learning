import { describe, expect, test } from 'vitest'
import { family as kite } from '$lib/generators/kite/family.js'
import { family as parallelogram } from '$lib/generators/parallelogram/family.js'
import { family as rectangle } from '$lib/generators/rectangle/family.js'
import { family as trapezoid } from '$lib/generators/trapezoid/family.js'
import { readQuadrilateral } from './settings.js'

const FAMILIES = { rectangle, parallelogram, trapezoid, kite }
const params = (q: string) => trapezoid.settingsFromParams(new URLSearchParams(q))

describe('every family', () => {
  test.each(Object.entries(FAMILIES))('%s: every kind opens with a bare address and works out', (_, family) => {
    expect(family.settingsToQuery(family.cleanSettings(family.DEFAULT_SETTINGS))).toBe('')
    for (const kind of family.kinds) {
      const s = family.switchKind(family.DEFAULT_SETTINGS, kind.id)
      expect(readQuadrilateral(s).problem).toBeNull()
      expect(family.settingsFromParams(new URLSearchParams(family.settingsToQuery(s)))).toEqual(s)
    }
  })

  test('a family only draws its own kinds', () => {
    expect(rectangle.settingsFromParams(new URLSearchParams('kind=kite')).kind).toBe('rectangle')
    expect(kite.settingsFromParams(new URLSearchParams('kind=square')).kind).toBe('kite')
  })

  test('rectangles have no heights, since each would be a side', () => {
    const s = rectangle.settingsFromParams(new URLSearchParams('hD=1&hDLabel=text&hDText=h&hC=1'))
    expect([s.hD, s.hC]).toEqual([false, false])
    expect(rectangle.settingsToQuery(s)).toBe('hDLabel=text&hDText=h')
  })
})

describe('the page address', () => {
  test('another kind is just its name until something changes', () => {
    expect(trapezoid.settingsToQuery(trapezoid.defaultsFor('isosceles-trapezoid'))).toBe('kind=isosceles-trapezoid')
    expect(params('kind=trapezoid').A).toBe('65')
  })

  test('a link comes back the same', () => {
    const q = 'kind=trapezoid&nameA=P&AB=3sqrt%282%29&A=70&CDArrows=2&hDLabel=text&hDText=h&dAC=1&cross=E&base=CD&rotate=-15&moved=AB%3A4%2C-6'
    const s = params(q)
    expect([s.kind, s.nameA, s.AB, s.A, s.CDArrows, s.hD, s.dAC, s.cross, s.base, s.rotate, s.moved]).toEqual([
      'trapezoid', 'P', '3sqrt(2)', '70', 2, true, true, 'E', 'CD', -15, 'AB:4,-6',
    ])
    expect(trapezoid.settingsToQuery(s)).toBe(q)
  })

  test('measures a kind doesn’t use are dropped', () => {
    const s = rectangle.settingsFromParams(new URLSearchParams('kind=square&AB=4&BC=9&A=30&h=2'))
    expect([s.AB, s.BC, s.A, s.h]).toEqual(['4', '', '', ''])
    expect(rectangle.settingsToQuery(s)).toBe('kind=square&AB=4')
  })

  test('nonsense falls back to defaults', () => {
    const s = params('kind=blob&round=7&base=XY&ABArrows=9&hDStyle=wavy&rotate=999&ALabel=loud')
    expect([s.kind, s.round, s.base, s.ABArrows, s.hDStyle, s.rotate, s.ALabel]).toEqual(['right-trapezoid', 1, '', 1, 'dashed', 180, 'auto'])
  })
})

describe('switching kinds', () => {
  test('keeps names, unit and position, and starts the new kind’s measures, labels and markings afresh', () => {
    const before = parallelogram.cleanSettings({ ...parallelogram.DEFAULT_SETTINGS, nameA: 'P', unit: 'cm', rotate: 30, flip: true, CDTicks: 2, BCLabel: 'text' })
    const s = parallelogram.switchKind(before, 'rhombus')
    expect([s.kind, s.nameA, s.unit, s.rotate, s.flip]).toEqual(['rhombus', 'P', 'cm', 30, true])
    expect([s.AB, s.A, s.CD, s.CDTicks, s.ABArrows, s.BCLabel]).toEqual(['8', '60', '', 0, 0, 'auto'])
  })

  test('a trapezoid starts with its height drawn and labeled', () => {
    const s = trapezoid.switchKind(trapezoid.DEFAULT_SETTINGS, 'isosceles-trapezoid')
    expect([s.hD, s.hDLabel, s.hC]).toEqual([true, 'measure', false])
  })
})
