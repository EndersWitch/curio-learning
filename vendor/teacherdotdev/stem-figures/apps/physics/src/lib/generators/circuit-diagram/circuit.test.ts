import { render } from 'svelte/server'
import { describe, expect, test } from 'vitest'
import { circuitAnswer, plainText } from './circuit'
import CircuitDiagram from './CircuitDiagram.svelte'
import { circuitSettings, newLoad, type CircuitSettings } from './settings'

const settings = (over: Partial<CircuitSettings> = {}) => circuitSettings.clean({ ...circuitSettings.defaults, ...over })
const roundTrip = (s: CircuitSettings) => circuitSettings.fromParams(new URLSearchParams(circuitSettings.toQuery(s)))
const ohms = (t: string) => ({ ...newLoad(0), value: { mode: 'text' as const, text: t } })

describe('the settings', () => {
  test('the default figure leaves the address empty', () => {
    expect(circuitSettings.toQuery(circuitSettings.defaults)).toBe('')
  })

  test('round-trip through the address, every setting changed', () => {
    const s = settings({
      arrangement: 'parallel',
      loads: [
        { kind: 'bulb', name: { mode: 'text', text: 'L_{big}' }, value: { mode: 'blank', text: '4 Omega' } },
        { kind: 'resistor', name: { mode: 'none', text: '' }, value: { mode: 'text', text: 'x, y; z' } },
        newLoad(2),
        newLoad(3),
      ],
      source: 'cell',
      sourceName: { mode: 'text', text: 'epsilon' },
      sourceValue: { mode: 'blank', text: '12 V' },
      switch: 'open',
      ammeter: true,
      ammeterLabel: { mode: 'text', text: '2 A' },
      voltmeter: '3',
      voltmeterLabel: { mode: 'blank', text: '6 V' },
      symbols: 'iec',
      polarity: true,
      title: { mode: 'text', text: 'Question 4' },
      mirror: true,
      color: true,
    })
    expect(roundTrip(s)).toEqual(s)
  })

  test('keeps at least one part and at most four', () => {
    expect(settings({ loads: [] }).loads).toEqual(circuitSettings.defaults.loads)
    expect(circuitSettings.fromParams(new URLSearchParams({ loads: '' })).loads).toEqual(circuitSettings.defaults.loads)
    expect(settings({ loads: Array.from({ length: 6 }, (_, i) => newLoad(i)) }).loads).toHaveLength(4)
  })

  test('a broken value falls back to its default', () => {
    const s = circuitSettings.fromParams(new URLSearchParams({ arrangement: 'ladder', voltmeter: '9', source: 'potato' }))
    expect([s.arrangement, s.voltmeter, s.source]).toEqual(['series', 'none', 'battery'])
  })
})

describe('the answer key', () => {
  test('series: the resistances add', () => {
    expect(circuitAnswer(circuitSettings.defaults)).toEqual([
      'Equivalent resistance: 12 Ω',
      'Current from the battery: 1 A',
      'R₁: 2 V across it, 1 A through it',
      'R₂: 4 V across it, 1 A through it',
      'R₃: 6 V across it, 1 A through it',
    ])
  })

  test('parallel: every branch has the whole potential difference', () => {
    const lines = circuitAnswer(settings({ arrangement: 'parallel', loads: [ohms('3 Omega'), ohms('6 Omega')], sourceValue: { mode: 'text', text: '6 V' } }))
    expect(lines).toEqual(['Equivalent resistance: 2 Ω', 'Current from the battery: 3 A', 'R₁: 6 V across it, 2 A through it', 'R₂: 6 V across it, 1 A through it'])
  })

  test('none when a value is unknown, blank or a bulb’s', () => {
    expect(circuitAnswer(settings({ loads: [ohms('x')] }))).toBeNull()
    expect(circuitAnswer(settings({ sourceValue: { mode: 'blank', text: '12 V' } }))).toBeNull()
    expect(circuitAnswer(settings({ loads: [{ ...newLoad(0), kind: 'bulb' }] }))).toBeNull()
    expect(circuitAnswer(settings({ switch: 'open' }))).toEqual(['The switch is open, so no current flows.'])
  })

  test('labels read as plain text', () => {
    expect(plainText('R_1')).toBe('R₁')
    expect(plainText('4 Omega')).toBe('4 Ω')
  })
})

describe('the symbol style', () => {
  const draw = (over: Partial<CircuitSettings>) => render(CircuitDiagram, { props: { settings: settings(over) } }).body

  test('US: a zigzag resistor and a looped bulb filament', () => {
    const svg = draw({ symbols: 'us', loads: [newLoad(0), { ...newLoad(1), kind: 'bulb' }] })
    expect(svg).toContain('<polyline points="-22,0')
    expect(svg).toContain('C-6,-13 6,-13 6,0')
    expect(svg).not.toContain('<rect x="-20"')
  })

  test('IEC: a box resistor and a crossed bulb', () => {
    const svg = draw({ symbols: 'iec', loads: [newLoad(0), { ...newLoad(1), kind: 'bulb' }] })
    expect(svg).toContain('<rect x="-20"')
    expect(svg).toContain('M-10.6,-10.6 L10.6,10.6')
    expect(svg).not.toContain('<polyline points="-22,0')
  })
})
