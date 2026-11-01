import { describe, expect, it } from 'vitest'
import { correctStructures, findCentral, starSkeleton } from './build'
import { parseFormula } from './formula'
import { apart, directionTo, labelDirection, loneDirections, placeStar, type Shape } from './layout'

function placed(text: string, shape: Shape = 'flat') {
  const parsed = parseFormula(text)
  if (!parsed.ok) throw new Error(parsed.message)
  const central = findCentral(parsed.formula)
  if (!central.ok) throw new Error(central.reason)
  const [s] = correctStructures(starSkeleton(parsed.formula, central.central), 'octet')
  return { s: placeStar(s, central.central, shape), central: central.central }
}

/** Angles between the central atom's bonds, smallest first. */
function bondAngles(text: string, shape: Shape) {
  const { s, central } = placed(text, shape)
  const directions = s.atoms.map((_, i) => i).filter((i) => i !== central).map((i) => directionTo(s, central, i))
  const angles: number[] = []
  directions.forEach((a, i) => directions.slice(i + 1).forEach((b) => angles.push(Math.round(apart(a, b) * 10) / 10)))
  return angles.sort((a, b) => a - b)
}

describe('flat structures', () => {
  it('put outer atoms on the four sides of the central atom', () => {
    expect(bondAngles('H2O', 'flat')).toEqual([180])
    expect(bondAngles('NH3', 'flat')).toEqual([90, 90, 180])
    expect(bondAngles('CH4', 'flat')).toEqual([90, 90, 90, 90, 180, 180])
  })

  it('spread five or six outer atoms evenly', () => {
    expect(bondAngles('PCl5', 'flat').slice(0, 5)).toEqual([72, 72, 72, 72, 72])
    expect(bondAngles('SF6', 'flat').slice(0, 6)).toEqual([60, 60, 60, 60, 60, 60])
  })

  it('keep a diatomic in the order it’s written', () => {
    const { s } = placed('HCl')
    expect(s.atoms[0].x).toBeLessThan(s.atoms[1].x)
    const oh = placed('OH-').s
    expect(oh.atoms[0].x).toBeLessThan(oh.atoms[1].x)
  })

  it('put lone pairs on the free sides of each symbol', () => {
    const { s, central } = placed('H2O')
    expect(loneDirections(s, central).sort((a, b) => a - b)).toEqual([90, 270])
    const cl = placed('HCl').s
    expect(loneDirections(cl, 1).sort((a, b) => a - b)).toEqual([0, 90, 270])
  })

  it('put a double-bonded atom’s two lone pairs above and below it, not spread out', () => {
    const { s } = placed('CO2')
    expect(loneDirections(s, 1).sort((a, b) => a - b)).toEqual([90, 270])
    expect(loneDirections(s, 2).sort((a, b) => a - b)).toEqual([90, 270])
  })
})

describe('shaped structures', () => {
  it('hint at the real shape', () => {
    expect(bondAngles('H2O', 'shaped')).toEqual([104.5])
    expect(bondAngles('BF3', 'shaped')).toEqual([120, 120, 120])
    expect(bondAngles('CO2', 'shaped')).toEqual([180])
    expect(bondAngles('XeF4', 'shaped')).toEqual([90, 90, 90, 90, 180, 180])
    expect(bondAngles('SO2', 'shaped')).toEqual([120])
  })

  it('put NH3’s H atoms below N and its lone pair above', () => {
    const { s, central } = placed('NH3', 'shaped')
    for (const a of s.atoms.filter((_, i) => i !== central)) expect(a.y).toBeGreaterThan(0)
    expect(loneDirections(s, central)).toEqual([270])
  })

  it('put the central atom’s lone pairs where the shape leaves room', () => {
    const { s, central } = placed('H2O', 'shaped')
    for (const d of loneDirections(s, central)) expect(d > 180 || d === 0).toBe(true)
  })
})

describe('like outer atoms', () => {
  /** Angles at the central atom between outer atoms of one element. */
  function likeAngles(text: string, element: string, shape: Shape) {
    const { s, central } = placed(text, shape)
    const directions = s.atoms.map((a, i) => (i !== central && a.element === element ? directionTo(s, central, i) : -1)).filter((d) => d >= 0)
    const angles: number[] = []
    directions.forEach((a, i) => directions.slice(i + 1).forEach((b) => angles.push(Math.round(apart(a, b)))))
    return angles.sort((a, b) => a - b)
  }

  it('sit side by side, not opposite each other', () => {
    for (const shape of ['flat', 'shaped'] as const) {
      expect(likeAngles('CH2Cl2', 'Cl', shape), shape).toEqual([90])
      expect(likeAngles('CH2Cl2', 'H', shape), shape).toEqual([90])
      expect(likeAngles('SO2Cl2', 'O', shape), shape).toEqual([90])
    }
  })

  it('keep the first atoms where they’re written: CH₂Cl₂ has its H atoms left and down, its Cl atoms up and right', () => {
    const { s } = placed('CH2Cl2')
    // + 0 so that −0 matches 0
    const at = (i: number) => [s.atoms[i].x + 0, s.atoms[i].y + 0]
    expect([at(1), at(2), at(3), at(4)]).toEqual([[-1, 0], [0, 1], [0, -1], [1, 0]])
  })

  it('take three neighbouring sides when there are three, with the odd one out on the fourth', () => {
    for (const shape of ['flat', 'shaped'] as const) {
      expect(likeAngles('CHCl3', 'Cl', shape), shape).toEqual([90, 90, 180])
      const { s, central } = placed('CHCl3', shape)
      expect(s.atoms[1]).toMatchObject({ element: 'H', x: -1, y: 0 })
      expect(s.atoms[central]).toMatchObject({ x: 0, y: 0 })
    }
  })

  it('group around a central atom with five, however they’re written', () => {
    expect(likeAngles('PClFClFCl', 'F', 'flat')).toEqual([72])
    expect(likeAngles('PClFClFCl', 'Cl', 'flat')).toEqual([72, 72, 144])
  })

  it('leave atoms that are all alike in the order they’re written', () => {
    const { s } = placed('CH4')
    expect(s.atoms.slice(1).map((a) => [a.x + 0, a.y + 0])).toEqual([[-1, 0], [1, 0], [0, -1], [0, 1]])
  })
})

describe('electrons on any structure', () => {
  it('place up to four groups around an atom, a lone electron included', () => {
    const { s } = placed('HCl')
    const odd = { ...s, atoms: s.atoms.map((a, i) => (i === 1 ? { ...a, lone: 7 } : a)) }
    expect(loneDirections(odd, 1)).toHaveLength(4)
    const crowded = { ...s, atoms: s.atoms.map((a, i) => (i === 0 ? { ...a, lone: 8 } : a)) }
    const directions = loneDirections(crowded, 0)
    expect(directions).toHaveLength(4)
    for (const d of directions) expect(apart(d, 0)).toBeGreaterThanOrEqual(45)
  })

  it('put a formal charge in a free corner', () => {
    const { s, central } = placed('NH4+')
    expect([315, 225, 45, 135]).toContain(labelDirection(s, central, []))
  })
})
