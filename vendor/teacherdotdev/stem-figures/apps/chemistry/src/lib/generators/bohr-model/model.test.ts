import { describe, expect, it } from 'vitest'
import { BALL_R, MAX_BALLS, NUCLEUS_R, electronAngles, modelSide, nucleusBalls, ringRadius, rings } from './model'

describe('the nucleus as balls', () => {
  it('draws one ball for each proton and neutron', () => {
    const balls = nucleusBalls(6, 7, 3)!
    expect(balls.filter((b) => b.component === 'proton')).toHaveLength(6)
    expect(balls.filter((b) => b.component === 'neutron')).toHaveLength(7)
  })

  it('fits 40 balls inside the space kept for the nucleus', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const balls = nucleusBalls(20, 20, seed)!
      for (const b of balls) expect(Math.hypot(b.x, b.y) + BALL_R).toBeLessThanOrEqual(NUCLEUS_R)
    }
  })

  it('never puts two balls in the same place', () => {
    const balls = nucleusBalls(18, 22, 5)!
    const places = new Set(balls.map((b) => `${b.x},${b.y}`))
    expect(places.size).toBe(40)
  })

  it('is decided by the seed', () => {
    expect(nucleusBalls(6, 6, 42)).toEqual(nucleusBalls(6, 6, 42))
    expect(nucleusBalls(6, 6, 42)).not.toEqual(nucleusBalls(6, 6, 43))
  })

  it('centers a small nucleus, and allows an empty one', () => {
    const [a, b] = nucleusBalls(1, 1, 7)!
    expect(a.x + b.x).toBeCloseTo(0)
    expect(a.y + b.y).toBeCloseTo(0)
    expect(nucleusBalls(0, 0, 1)).toEqual([])
  })

  it('has no balls past the limit', () => {
    expect(nucleusBalls(MAX_BALLS, 1, 1)).toBeUndefined()
  })
})

describe('rings and electrons', () => {
  it('sizes the model by its shell count alone', () => {
    expect(modelSide(2)).toBe(2 * (ringRadius(1) + 12))
    expect(modelSide(1)).toBeLessThan(modelSide(2))
    // the innermost ring clears the nucleus
    expect(ringRadius(0) - NUCLEUS_R).toBeGreaterThan(10)
  })

  it('puts every electron on its ring, evenly spaced from the top', () => {
    const drawn = rings([2, 8, 5], 'even', false)
    drawn.forEach((ring) => ring.electrons.forEach((e) => expect(Math.hypot(e.x, e.y)).toBeCloseTo(ring.radius, 2)))
    expect(drawn[0].electrons.map((e) => [e.x, e.y])).toEqual([
      [0, -ringRadius(0)],
      [0, ringRadius(0)],
    ])
    expect(electronAngles(1, 4, 'even', 4)).toEqual([-90, 0, 90, 180])
  })

  it('draws "wrong" shells as set: overfilled, and empty inside filled ones', () => {
    const drawn = rings([5, 0, 3], 'even', false)
    expect(drawn.map((r) => r.electrons.length)).toEqual([5, 0, 3])
  })

  it('shrinks crowded electrons so they don’t overlap', () => {
    const [ring] = rings([32], 'even', true)
    const [a, b] = ring.electrons
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * a.r)
  })

  it('pairs electrons at the compass points in Lewis order', () => {
    const angles = (n: number) => electronAngles(1, n, 'paired', 4).map(Math.round)
    expect(angles(1)).toEqual([-90])
    expect(angles(2)).toEqual([-90, 0])
    expect(angles(4)).toEqual([-90, 0, 90, 180])
    const five = angles(5)
    expect(five).toHaveLength(5)
    // in filling order: the fifth pairs with the first, at the top
    expect([five[0], five[4]].every((a) => Math.abs(a + 90) < 10)).toBe(true)
    expect(five.slice(1, 4)).toEqual([0, 90, 180])
    expect(angles(8)).toHaveLength(8)
  })

  it('places a shell’s electrons the same whether some are gained or lost', () => {
    const at = (ring: { electrons: { x: number; y: number }[] }) => ring.electrons.map((e) => `${e.x},${e.y}`)
    // Cl⁻ against Cl: the gained electron completes the last pair
    const [, , cl] = rings([2, 8, 8], 'paired', false, [2, 8, 7])
    expect(cl.electrons.map((e) => e.change)).toEqual([...Array(7).fill(undefined), 'gained'])
    expect(at(cl)).toEqual(at(rings([2, 8, 8], 'paired', false)[2]))
    // Mg²⁺ against Mg: both of the third shell's electrons lost, their ring kept
    const mg = rings([2, 8], 'even', false, [2, 8, 2])
    expect(mg).toHaveLength(3)
    expect(mg[2].electrons.map((e) => e.change)).toEqual(['lost', 'lost'])
    expect(at(mg[2])).toEqual(at(rings([2, 8, 2], 'even', false)[2]))
    expect(mg.slice(0, 2).every((r) => r.electrons.every((e) => !e.change))).toBe(true)
  })

  it('shows an excited atom losing on one shell and gaining on another', () => {
    const drawn = rings([2, 7, 2], 'even', false, [2, 8, 1])
    expect(drawn[1].electrons.filter((e) => e.change === 'lost')).toHaveLength(1)
    expect(drawn[2].electrons.map((e) => e.change)).toEqual([undefined, 'gained'])
  })

  it('marks nothing without the neutral atom', () => {
    expect(rings([2, 8], 'even', false).flatMap((r) => r.electrons).some((e) => e.change)).toBe(false)
  })

  it('pairs a full first shell at the top, as He is drawn', () => {
    const [a, b] = electronAngles(0, 2, 'paired', 4)
    expect(a).toBeLessThan(-90)
    expect(b).toBeGreaterThan(-90)
    expect(b - a).toBeLessThan(20)
  })

  it('spreads more than eight evenly even when paired', () => {
    expect(electronAngles(2, 9, 'paired', 4)).toEqual(electronAngles(2, 9, 'even', 4))
  })

  it('puts shell labels in a gap between electrons, toward the lower left', () => {
    for (const ring of rings([2, 8, 18, 1], 'even', false)) {
      const angle = (Math.atan2(ring.label.y, ring.label.x) * 180) / Math.PI
      expect(angle).toBeGreaterThan(90)
      expect(angle).toBeLessThanOrEqual(180)
      for (const e of ring.electrons) expect(Math.hypot(e.x - ring.label.x, e.y - ring.label.y)).toBeGreaterThan(e.r + 4)
    }
  })

  it('lines shell labels up at the lower left where the electrons leave room', () => {
    const labels = rings([2, 0, 1], 'even', false).map((r) => Math.round((Math.atan2(r.label.y, r.label.x) * 180) / Math.PI))
    expect(labels).toEqual([135, 135, 135])
  })
})
