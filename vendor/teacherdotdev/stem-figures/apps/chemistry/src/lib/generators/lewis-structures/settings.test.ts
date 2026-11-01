import { describe, expect, it } from 'vitest'
import { figureOf, lewisSettings, type LewisSettings } from './settings'

const d = lewisSettings.defaults
const settings = (over: Partial<LewisSettings>) => lewisSettings.tidy({ ...d, ...over })
const roundTrip = (s: LewisSettings) => lewisSettings.fromParams(new URLSearchParams(lewisSettings.toQuery(s)))

describe('settings in the page address', () => {
  it('are left out at their defaults', () => {
    expect(lewisSettings.toQuery(d)).toBe('')
  })

  it('travel in the address, changes included', () => {
    const s = settings({ formula: 'SO4 2-', rule: 'fewest', shape: 'shaped', formalCharges: true, changes: [{ kind: 'bond', bond: 0, order: 1 }], answerKey: true })
    expect(roundTrip(s)).toEqual(s)
    expect(lewisSettings.toQuery(s)).toContain('changes=b0_1')
  })

  it('keep every resonance structure a formula has', () => {
    expect(settings({ form: 15 }).form).toBe(15)
  })
})

describe('what the figure shows', () => {
  it('never has a scaffold or all resonance structures with changes', () => {
    const f = figureOf(settings({ formula: 'NO3-', scaffold: 'skeleton', resonance: 'all', changes: [{ kind: 'lone', atom: 0, lone: 2 }] }))
    expect(f.settings.scaffold).toBe('full')
    expect(f.settings.resonance).toBe('one')
    expect(f.shown).toHaveLength(1)
    expect(figureOf(settings({ formula: 'CO2', scaffold: 'skeleton', central: 'O' })).settings.scaffold).toBe('full')
    expect(figureOf(settings({ formula: 'CO2', scaffold: 'skeleton' })).settings.scaffold).toBe('skeleton')
  })

  it('ignores a central atom it can’t change to, so nothing is stuck', () => {
    const f = figureOf(settings({ formula: 'C2H5OH', central: 'H', scaffold: 'skeleton' }))
    expect(f.changed).toBe(false)
    expect(f.settings.scaffold).toBe('skeleton')
  })

  it('counts formal charge labels as changes only while they’re drawn', () => {
    const label = [{ kind: 'label' as const, atom: 1, label: -1 }]
    expect(figureOf(settings({ formula: 'CO2', formalCharges: true, changes: label })).changed).toBe(true)
    const hidden = figureOf(settings({ formula: 'CO2', changes: label }))
    expect(hidden.changed).toBe(false)
    expect(hidden.changes).toEqual([])
  })

  it('draws the correct structure, with no answer key', () => {
    const f = figureOf(settings({ formula: 'CO2', answerKey: true }))
    expect(f.shown).toHaveLength(1)
    expect(f.changed).toBe(false)
    expect(f.key).toEqual({ kind: 'none' })
  })

  it('draws one resonance structure, or all of them', () => {
    expect(figureOf(settings({ formula: 'NO3-' })).shown).toHaveLength(1)
    expect(figureOf(settings({ formula: 'NO3-', resonance: 'all' })).shown).toHaveLength(3)
    const [second] = figureOf(settings({ formula: 'NO3-', form: 2 })).shown
    expect(second).toEqual(figureOf(settings({ formula: 'NO3-', resonance: 'all' })).shown[1])
    expect(figureOf(settings({ formula: 'NO3-', form: 9 })).shown[0]).toEqual(figureOf(settings({ formula: 'NO3-', form: 3 })).shown[0])
  })

  it('draws the full structure in the answer key of a scaffold', () => {
    const f = figureOf(settings({ formula: 'NO3-', scaffold: 'skeleton', resonance: 'all', answerKey: true }))
    expect(f.key).toEqual({ kind: 'structures', structures: f.shown })
    expect(f.shown).toHaveLength(3)
  })

  it('lists a changed structure’s mistakes in its answer key', () => {
    const f = figureOf(settings({ formula: 'CO2', changes: [{ kind: 'bond', bond: 0, order: 1 }], answerKey: true }))
    expect(f.changed).toBe(true)
    expect(f.mistakes.length).toBeGreaterThan(0)
    expect(f.key).toEqual({ kind: 'mistakes', mistakes: f.mistakes })
  })

  it('finds no mistakes in a change to another resonance structure', () => {
    // NO3-'s first structure has its double bond to the first O; move it to the second
    const f = figureOf(
      settings({
        formula: 'NO3-',
        changes: [
          { kind: 'bond', bond: 0, order: 1 },
          { kind: 'bond', bond: 1, order: 2 },
          { kind: 'lone', atom: 1, lone: 6 },
          { kind: 'lone', atom: 2, lone: 4 },
        ],
      }),
    )
    expect(f.changed).toBe(true)
    expect(f.mistakes).toEqual([])
  })

  it('rebuilds the skeleton around another central atom', () => {
    const f = figureOf(settings({ formula: 'CO2', central: 'O' }))
    expect(f.changed).toBe(true)
    expect(f.mistakes[0]).toBe('C should be the central atom.')
    expect(figureOf(settings({ formula: 'CO2', central: 'C' })).changed).toBe(false)
    expect(figureOf(settings({ formula: 'CO2', central: 'Xe' })).changed).toBe(false)
  })

  it('draws an atom on its own without bonds or formal charges to give', () => {
    const f = figureOf(settings({ formula: 'N 3-', scaffold: 'bonds', formalCharges: true, answerKey: true }))
    expect(f.settings).toMatchObject({ scaffold: 'skeleton', formalCharges: false })
    expect(f.key).toEqual({ kind: 'structures', structures: f.shown })
  })

  it('changes an atom on its own into a wrong one', () => {
    const f = figureOf(settings({ formula: 'P', changes: [{ kind: 'lone', atom: 0, lone: 3 }], answerKey: true }))
    expect(f.changed).toBe(true)
    expect(f.key).toEqual({ kind: 'mistakes', mistakes: ['It shows 3 valence electrons, but P has 5.'] })
    const ion = figureOf(settings({ formula: 'Ca 2+', changes: [{ kind: 'brackets', on: false }] }))
    expect(ion.mistakes).toEqual(['An ion’s structure goes in square brackets.'])
  })

  it('draws nothing for a formula it has no structure for', () => {
    const f = figureOf(settings({ formula: 'C3H8' }))
    expect(f.resolved.ok).toBe(false)
    expect(f.shown).toEqual([])
  })
})
