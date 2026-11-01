import { describe, expect, it } from 'vitest'
import { bool, choice, defineSettings, number, text } from './settings'

const example = defineSettings(
  {
    size: choice(['10', '50', '100'] as const, '100'),
    reading: number({ min: 0, max: 100, fallback: 42 }),
    key: bool(false),
    title: text(''),
  },
  // cross-field rule: a reading never exceeds the chosen size
  (s) => ({ ...s, reading: Math.min(s.reading, Number(s.size)) }),
)

describe('settings in the page address', () => {
  it('an address with no settings gives the defaults', () => {
    expect(example.fromParams(new URLSearchParams(''))).toEqual({ size: '100', reading: 42, key: false, title: '' })
  })

  it('reads every kind of setting from the address', () => {
    const s = example.fromParams(new URLSearchParams('size=50&reading=23.5&key=1&title=Lab+2'))
    expect(s).toEqual({ size: '50', reading: 23.5, key: true, title: 'Lab 2' })
  })

  it('ignores values it does not understand and clamps numbers', () => {
    const s = example.fromParams(new URLSearchParams('size=7&reading=abc&key=maybe'))
    expect(s).toEqual({ size: '100', reading: 42, key: false, title: '' })
    expect(example.fromParams(new URLSearchParams('reading=-5')).reading).toBe(0)
  })

  it('applies the cross-field rule', () => {
    expect(example.fromParams(new URLSearchParams('size=10&reading=80')).reading).toBe(10)
  })

  it('writes only the settings that differ from the defaults', () => {
    expect(example.toQuery(example.defaults)).toBe('')
    expect(example.toQuery({ size: '50', reading: 42, key: true, title: 'A & B' })).toBe('size=50&key=1&title=A+%26+B')
  })

  it('round-trips through the address', () => {
    const s = { size: '10' as const, reading: 7.25, key: true, title: 'Quiz' }
    expect(example.fromParams(new URLSearchParams(example.toQuery(s)))).toEqual(s)
  })
})

describe('tidying stored settings', () => {
  it('turns anything stored into valid settings', () => {
    expect(example.tidy(null)).toEqual(example.defaults)
    expect(example.tidy({ size: 5, reading: '3', key: 'yes', title: 9, extra: 1 })).toEqual(example.defaults)
    expect(example.tidy({ size: '10', reading: 55 })).toEqual({ size: '10', reading: 10, key: false, title: '' })
  })

  it('gives equal keys exactly when two settings draw the same figure', () => {
    expect(example.keyOf({ ...example.defaults })).toBe(example.keyOf(example.defaults))
    expect(example.keyOf({ ...example.defaults, key: true })).not.toBe(example.keyOf(example.defaults))
  })
})
