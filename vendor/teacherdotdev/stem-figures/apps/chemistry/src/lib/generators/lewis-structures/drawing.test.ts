import { describe, expect, it } from 'vitest'
import { correctStructures, findCentral, starSkeleton } from './build'
import { DOT_R, drawStructure, type Drawing } from './drawing'
import { parseFormula } from './formula'
import { placeStar } from './layout'
import type { Structure } from './structure'

function placed(text: string) {
  const parsed = parseFormula(text)
  if (!parsed.ok) throw new Error(parsed.message)
  const central = findCentral(parsed.formula)
  if (!central.ok) throw new Error(central.reason)
  return placeStar(correctStructures(starSkeleton(parsed.formula, central.central), 'octet')[0], central.central, 'flat')
}

const finite = (d: Drawing) =>
  [d.width, d.height, ...d.symbols.flatMap((t) => [t.x, t.y]), ...d.lines.flatMap((l) => [l.x1, l.y1, l.x2, l.y2]), ...d.dots.flatMap((p) => [p.x, p.y])].every(
    Number.isFinite,
  )

const inside = (d: Drawing) => d.dots.every((p) => p.x > 0 && p.y > 0 && p.x < d.width && p.y < d.height)

describe('drawing a structure', () => {
  it('draws a dot for every lone electron and a line for every bond line', () => {
    const co2 = drawStructure(placed('CO2'))
    expect(co2.dots).toHaveLength(8)
    expect(co2.lines).toHaveLength(4)
    expect(co2.symbols.map((t) => t.text)).toEqual(['C', 'O', 'O'])
    expect(finite(co2) && inside(co2)).toBe(true)
  })

  it('draws each shared pair as two dots between the atoms when bonds are dots', () => {
    const co2 = drawStructure(placed('CO2'), { bondStyle: 'dots' })
    expect(co2.lines).toEqual([])
    expect(co2.dots).toHaveLength(8 + 8)
    expect(finite(co2) && inside(co2)).toBe(true)
    expect(drawStructure(placed('N2'), { bondStyle: 'dots' }).dots).toHaveLength(4 + 6)
  })

  it('keeps bond dots clear of the letters, even for a triple bond', () => {
    for (const f of ['N2', 'CO2', 'HCN', 'CH4']) {
      const d = drawStructure(placed(f), { bondStyle: 'dots' })
      const clear = d.dots.every((p) => d.symbols.every((t) => Math.abs(p.x - t.x) > t.w / 2 + DOT_R || Math.abs(p.y - t.y) > t.h / 2 + DOT_R))
      expect(clear, f).toBe(true)
    }
  })

  it('draws an ion in brackets with its charge', () => {
    const so4 = drawStructure(placed('SO4 2-'))
    expect(so4.brackets).toBeDefined()
    expect(so4.charge?.text).toBe('2−')
    expect(drawStructure(placed('CH4')).brackets).toBeUndefined()
  })

  it('draws formal charges only when asked, and only where they aren’t 0', () => {
    expect(drawStructure(placed('NH4+')).labels).toEqual([])
    expect(drawStructure(placed('NH4+'), { formalCharges: true }).labels.map((l) => l.text)).toEqual(['+1'])
  })

  it('leaves out bonds and electrons for a skeleton', () => {
    const d = drawStructure(placed('CO2'), { bonds: false, electrons: false })
    expect(d.lines).toEqual([])
    expect(d.dots).toEqual([])
    expect(d.symbols).toHaveLength(3)
    expect(d.bondSpots).toHaveLength(2)
  })

  it('draws impossible structures without breaking', () => {
    const ch4 = placed('CH4')
    const odd: Structure = {
      ...ch4,
      atoms: ch4.atoms.map((a, i) => ({ ...a, lone: i === 0 ? 7 : i === 1 ? 3 : 0 })),
      bonds: ch4.bonds.map((b, k) => ({ ...b, order: k === 0 ? 3 : k === 1 ? 0 : 1 })),
    }
    const d = drawStructure(odd, { formalCharges: true })
    expect(finite(d)).toBe(true)
    expect(d.dots).toHaveLength(10)
    expect(d.lines).toHaveLength(5)
  })
})

describe('drawing an atom on its own', () => {
  /** Dots on each side of the symbol: right, left, top, bottom. */
  function sides(text: string) {
    const d = drawStructure(placed(text))
    const [t] = d.symbols
    const count = (on: (p: { x: number; y: number }) => boolean) => d.dots.filter(on).length
    return [
      count((p) => p.x > t.x + t.w / 2),
      count((p) => p.x < t.x - t.w / 2),
      count((p) => p.y < t.y - t.h / 2),
      count((p) => p.y > t.y + t.h / 2),
    ]
  }

  it('puts its electrons one to a side, then pairs them', () => {
    expect(sides('Ca')).toEqual([1, 1, 0, 0])
    expect(sides('C')).toEqual([1, 1, 1, 1])
    expect(sides('N')).toEqual([2, 1, 1, 1])
    expect(sides('P')).toEqual([2, 1, 1, 1])
    expect(sides('O')).toEqual([2, 2, 1, 1])
    expect(sides('Ne')).toEqual([2, 2, 2, 2])
  })

  it('pairs the two electrons of He and of the hydride ion', () => {
    expect(sides('He')).toEqual([2, 0, 0, 0])
    expect(sides('H-')).toEqual([2, 0, 0, 0])
    expect(sides('H')).toEqual([1, 0, 0, 0])
  })

  it('draws an anion with its octet and a cation with no dots, each in brackets with its charge', () => {
    for (const [text, dots, charge] of [
      ['N 3-', 8, '3−'],
      ['Cl-', 8, '−'],
      ['O 2-', 8, '2−'],
      ['Ca 2+', 0, '2+'],
    ] as const) {
      const d = drawStructure(placed(text))
      expect(d.dots, text).toHaveLength(dots)
      expect(d.brackets, text).toBeDefined()
      expect(d.charge?.text, text).toBe(charge)
      expect(finite(d) && inside(d), text).toBe(true)
    }
    expect(drawStructure(placed('N')).brackets).toBeUndefined()
  })
})

