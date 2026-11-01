import { describe, expect, it } from 'vitest'
import { applyChanges, changesField, formatChanges, parseChanges, setChange, type Change } from './changes'
import { resolve } from './resolve'
import { electronsAround, hasBrackets, shownCharge, shownFormalCharge } from './structure'

const base = (formula: string) => {
  const r = resolve({ formula, which: '', rule: 'octet', shape: 'flat' })
  if (!r.ok) throw new Error(r.message)
  return r.correct[0]
}

const EVERY_KIND: Change[] = [
  { kind: 'bond', bond: 1, order: 0 },
  { kind: 'lone', atom: 0, lone: 7 },
  { kind: 'label', atom: 2, label: -1 },
  { kind: 'brackets', on: false },
  { kind: 'charge', label: -2 },
]

describe('changes in the page address', () => {
  it('round-trip, every kind of change', () => {
    const text = formatChanges(EVERY_KIND)
    expect(text).toMatch(/^[\w.~-]+$/)
    expect(parseChanges(text)).toEqual(parseChanges(formatChanges(parseChanges(text))))
    expect(parseChanges(text)).toHaveLength(EVERY_KIND.length)
    for (const c of EVERY_KIND) expect(parseChanges(text)).toContainEqual(c)
  })

  it('go through the settings field', () => {
    const field = changesField()
    expect(field.parse(field.format(EVERY_KIND))).toEqual(field.accept(EVERY_KIND))
    expect(field.format(field.fallback)).toBe('')
  })

  it('skip anything that isn’t a change, and keep only the last change to each thing', () => {
    expect(parseChanges('b1_2.nonsense.l0_99.b1_3.x')).toEqual([{ kind: 'bond', bond: 1, order: 3 }])
    expect(changesField().accept([{ kind: 'lone', atom: -1, lone: 2 }, 'x', { kind: 'bond', bond: 0, order: 2 }])).toEqual([{ kind: 'bond', bond: 0, order: 2 }])
  })
})

describe('changing a structure', () => {
  it('applies each change', () => {
    const so4 = base('SO4 2-')
    const changed = applyChanges(so4, EVERY_KIND)
    expect(changed.bonds[1].order).toBe(0)
    expect(changed.atoms[0].lone).toBe(7)
    expect(shownFormalCharge(changed, 2)).toBe(-1)
    expect(hasBrackets(changed)).toBe(false)
    expect(shownCharge(changed)).toBe(-2)
    expect(electronsAround(so4, 0)).toBe(8)
  })

  it('ignores changes to atoms or bonds the structure doesn’t have', () => {
    const co = base('CO')
    expect(applyChanges(co, [{ kind: 'bond', bond: 5, order: 1 }, { kind: 'lone', atom: 9, lone: 1 }])).toEqual(co)
  })

  it('forgets a change set back to how the structure was', () => {
    const co2 = base('CO2')
    let changes = setChange([], { kind: 'bond', bond: 0, order: 1 }, co2)
    expect(changes).toHaveLength(1)
    changes = setChange(changes, { kind: 'bond', bond: 0, order: 3 }, co2)
    expect(changes).toEqual([{ kind: 'bond', bond: 0, order: 3 }])
    expect(setChange(changes, { kind: 'bond', bond: 0, order: 2 }, co2)).toEqual([])
    expect(setChange([], { kind: 'brackets', on: true }, co2)).toHaveLength(1)
    expect(setChange([], { kind: 'brackets', on: false }, co2)).toEqual([])
    expect(setChange([], { kind: 'charge', label: 0 }, co2)).toEqual([])
  })
})
