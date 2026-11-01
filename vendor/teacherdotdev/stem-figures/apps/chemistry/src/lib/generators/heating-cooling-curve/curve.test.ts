import { describe, expect, it } from 'vitest'
import { curveEnd, curvePoints, heatOf, placeSegments, segmentsOf, SUBSTANCES } from './curve'

const WATER = SUBSTANCES[0].properties
const temps = (startT: number, endT: number) => ({ startT, endT, mp: 0, bp: 100 })
const keys = (segs: { key: string }[]) => segs.map((s) => s.key)

describe('the segments a curve passes through', () => {
  it('runs ice to steam through all five, in order', () => {
    expect(keys(segmentsOf('heating', temps(-20, 120)))).toEqual(['solid', 'melt', 'liquid', 'boil', 'gas'])
  })

  it('runs a cooling curve backwards, from the hot end', () => {
    const segs = segmentsOf('cooling', temps(120, -20))
    expect(keys(segs)).toEqual(['gas', 'boil', 'liquid', 'melt', 'solid'])
    expect(segs[0]).toEqual({ key: 'gas', t0: 120, t1: 100 })
    expect(segs.at(-1)).toEqual({ key: 'solid', t0: 0, t1: -20 })
  })

  it('leaves out what the curve never reaches', () => {
    expect(keys(segmentsOf('heating', temps(20, 80)))).toEqual(['liquid'])
    expect(keys(segmentsOf('cooling', temps(60, 20)))).toEqual(['liquid'])
  })

  it('includes a plateau the curve starts or ends right at', () => {
    expect(keys(segmentsOf('heating', temps(0, 50)))).toEqual(['melt', 'liquid'])
    expect(keys(segmentsOf('heating', temps(20, 100)))).toEqual(['liquid', 'boil'])
  })
})

describe('the heat each segment takes', () => {
  it('matches OpenStax Example 10.10: 135 g of ice at −15 °C to steam at 120 °C is 416 kJ', () => {
    const segs = segmentsOf('heating', { startT: -15, endT: 120, mp: 0, bp: 100 })
    const q = segs.map((s) => heatOf(s, 135, WATER))
    expect(q[0]).toBeCloseTo(4.23, 2)
    expect(q[1]).toBeCloseTo(45.0, 1)
    expect(q[2]).toBeCloseTo(56.4, 1)
    expect(q[3]).toBeCloseTo(305, 0)
    expect(q[4]).toBeCloseTo(5.02, 2)
    // OpenStax rounds each step before adding them up.
    expect(Math.abs(q.reduce((a, b) => a + b) - 416)).toBeLessThan(1)
  })

  it('makes water’s boiling plateau about 6.8 times its melting plateau', () => {
    const [melt, boil] = segmentsOf('heating', temps(0, 100)).filter((s) => s.t0 === s.t1)
    expect(heatOf(boil, 1, WATER) / heatOf(melt, 1, WATER)).toBeCloseTo(6.77, 1)
  })
})

describe('the curve’s points', () => {
  const placed = placeSegments(segmentsOf('heating', temps(-20, 120)), () => 2)

  it('lays the segments end to end', () => {
    expect(placed.map((s) => s.x0)).toEqual([0, 2, 4, 6, 8])
    expect(curveEnd(placed)).toBe(10)
    expect(curvePoints(placed)).toEqual([
      { x: 0, y: -20 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 100 }, { x: 8, y: 100 }, { x: 10, y: 120 },
    ])
  })

  it('dips below the freezing point when supercooled, and ends the plateau where it would have', () => {
    const cooling = placeSegments(segmentsOf('cooling', temps(80, -20)), (s) => (s.key === 'melt' ? 10 : 4))
    const pts = curvePoints(cooling, 5)
    expect(pts.map((p) => p.y)).toEqual([80, 0, -5, 0, 0, -20])
    // It keeps cooling at the liquid's rate, 20 °C per unit, for a quarter unit.
    expect(pts[2].x).toBeCloseTo(4.25)
    expect(pts[4].x).toBe(14)
  })

  it('never supercools a heating curve', () => {
    expect(curvePoints(placed, 5)).toHaveLength(6)
  })
})
