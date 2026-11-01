import { describe, expect, it } from 'vitest'
import { bohrFigure } from './figure'
import { CHARGE_FONT, modelSide, textWidth } from './model'
import { bohrSettings, chargeOf, drawnNucleus, pairingSkipped } from './settings'

const d = bohrSettings.defaults
const fromQuery = (query: string) => bohrSettings.fromParams(new URLSearchParams(query))

describe('settings in the address', () => {
  it('are left out at their defaults', () => {
    expect(bohrSettings.toQuery(d)).toBe('')
  })

  it('write the electrons readably and travel intact', () => {
    const s = { ...d, protons: 11, neutrons: 12, electrons: [2, 8, 1], electronSymbol: '-' as const, key: true }
    const query = bohrSettings.toQuery(s)
    expect(query).toContain('electrons=2-8-1')
    expect(fromQuery(query)).toEqual(s)
  })

  it('keep counts within their limits', () => {
    const s = fromQuery('protons=500&neutrons=-3&electrons=40-2')
    expect(s).toMatchObject({ protons: 200, neutrons: 0, electrons: [32, 2] })
  })

  it('ignore shells they can’t read', () => {
    expect(fromQuery('electrons=2-8-8-8-8-8-8-8').electrons).toEqual(d.electrons)
    expect(fromQuery('electrons=abc').electrons).toEqual(d.electrons)
    expect(bohrSettings.tidy({ electrons: [] }).electrons).toEqual(d.electrons)
  })
})

describe('the figure', () => {
  it('draws a ball nucleus as text past 40 protons and neutrons', () => {
    expect(drawnNucleus({ ...d, protons: 20, neutrons: 20 })).toBe('balls')
    expect(drawnNucleus({ ...d, protons: 20, neutrons: 21 })).toBe('text')
    expect(bohrFigure({ ...d, protons: 26, neutrons: 30 }).balls).toEqual([])
  })

  it('is the same size for every model with the same number of shells', () => {
    const a = bohrFigure({ ...d, protons: 1, neutrons: 0, electrons: [1, 0] })
    const b = bohrFigure({ ...d, protons: 30, neutrons: 10, electrons: [32, 32], electronSymbol: 'e-', nucleus: 'text' })
    expect([a.width, a.height]).toEqual([modelSide(2), modelSide(2)])
    expect([b.width, b.height]).toEqual([a.width, a.height])
  })

  it('draws empty rings without electrons, still one ring per shell', () => {
    const f = bohrFigure({ ...d, electrons: [2, 8, 1], emptyRings: true })
    expect(f.rings).toHaveLength(3)
    expect(f.rings.every((r) => !r.electrons.length)).toBe(true)
  })

  it('lists in the key only what is drawn as a ball or dot', () => {
    const names = (s: typeof d) => bohrFigure({ ...s, key: true }).key?.lines.map((l) => l.name)
    expect(names(d)).toEqual(['Proton', 'Neutron', 'Electron'])
    expect(names({ ...d, nucleus: 'text' })).toEqual(['Electron'])
    expect(names({ ...d, nucleus: 'blank', emptyRings: true })).toBeUndefined()
    expect(bohrFigure(d).key).toBeUndefined()
  })

  it('puts the key to the right of the model', () => {
    const f = bohrFigure({ ...d, key: true })
    expect(f.key!.x).toBeGreaterThan(modelSide(2))
    expect(f.width).toBe(f.key!.x + f.key!.width)
  })

  it('works out the charge from the counts', () => {
    expect(chargeOf({ protons: 11, electrons: [2, 8] })).toBe(1)
    expect(chargeOf({ protons: 17, electrons: [2, 8, 8] })).toBe(-1)
    expect(chargeOf(d)).toBe(0)
  })

  it('marks gained and lost electrons only when asked, for an element, on filled rings', () => {
    const na = { ...d, protons: 11, neutrons: 12, electrons: [2, 8] }
    const changes = (s: typeof d) => bohrFigure(s).rings.flatMap((r) => r.electrons.map((e) => e.change).filter(Boolean))
    expect(bohrFigure(na).rings).toHaveLength(2)
    expect(changes(na)).toEqual([])
    const marked = bohrFigure({ ...na, gainedLost: true })
    expect(marked.rings).toHaveLength(3)
    expect(changes({ ...na, gainedLost: true })).toEqual(['lost'])
    expect([marked.width, marked.height]).toEqual([modelSide(3), modelSide(3)])
    expect(changes({ ...na, protons: 0, gainedLost: true })).toEqual([])
    expect(bohrFigure({ ...na, gainedLost: true, emptyRings: true }).rings).toHaveLength(2)
  })

  it('lists gained and lost electrons in the key when they are drawn', () => {
    const names = (s: typeof d) => bohrFigure({ ...s, key: true, nucleus: 'text' }).key?.lines.map((l) => l.name)
    expect(names({ ...d, protons: 11, electrons: [2, 8], gainedLost: true })).toEqual(['Electron', 'Lost electron'])
    expect(names({ ...d, protons: 17, electrons: [2, 8, 8], gainedLost: true })).toEqual(['Electron', 'Gained electron'])
    expect(names({ ...d, gainedLost: true })).toEqual(['Electron'])
  })

  it('brackets only an ion, and every ion with the same shells alike', () => {
    expect(bohrFigure({ ...d, brackets: true }).brackets).toBeUndefined()
    const na = bohrFigure({ ...d, protons: 11, electrons: [2, 8], brackets: true })
    const o = bohrFigure({ ...d, protons: 8, electrons: [2, 8], brackets: true })
    expect(na.brackets!.charge.text).toBe('+')
    expect(o.brackets!.charge.text).toBe('2−')
    expect([na.width, na.height]).toEqual([o.width, o.height])
    expect(na.width).toBeGreaterThan(modelSide(2))
    // the brackets and charge stay inside the figure
    const b = na.brackets!
    expect(na.cx + b.x1).toBeGreaterThan(0)
    // the charge's baseline less its cap height
    expect(na.cy + b.charge.y - 0.75 * CHARGE_FONT).toBeGreaterThan(0)
    expect(na.cx + b.charge.x + textWidth('2−', CHARGE_FONT)).toBeLessThanOrEqual(na.width)
  })

  it('says when a shell has too many electrons to pair', () => {
    expect(pairingSkipped({ ...d, placement: 'paired', electrons: [2, 8] })).toBe(false)
    expect(pairingSkipped({ ...d, placement: 'paired', electrons: [2, 9] })).toBe(true)
  })
})
