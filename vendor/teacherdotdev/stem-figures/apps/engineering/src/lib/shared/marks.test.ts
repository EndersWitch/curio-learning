import { describe, expect, it } from 'vitest'
import { legibleMarks, marks } from './marks'

describe('scale marks', () => {
  it('numbers every label step, with a medium mark halfway when it falls on a mark', () => {
    const m = marks({ max: 2, labelEvery: 1, minorEvery: 0.1 })
    expect(m).toHaveLength(21)
    expect(m[0]).toEqual({ value: 0, kind: 'major', label: '0' })
    expect(m[3]).toEqual({ value: 0.3, kind: 'minor' })
    expect(m[5]).toEqual({ value: 0.5, kind: 'medium' })
    expect(m[10]).toEqual({ value: 1, kind: 'major', label: '1' })
  })

  it('has no medium mark when halfway is between marks', () => {
    const m = marks({ max: 10, labelEvery: 5, minorEvery: 1 })
    expect(m.map((x) => x.kind).join(' ')).toBe('major minor minor minor minor major minor minor minor minor major')
  })

  it('labels fractional steps without float noise', () => {
    const labels = marks({ max: 25, labelEvery: 2.5, minorEvery: 0.25 }).flatMap((x) => x.label ?? [])
    expect(labels).toEqual(['0', '2.5', '5', '7.5', '10', '12.5', '15', '17.5', '20', '22.5', '25'])
  })
})

describe('legible marks', () => {
  const buret = marks({ max: 50, labelEvery: 1, minorEvery: 0.1 })

  it('keeps every mark and number when there is room', () => {
    expect(legibleMarks(buret, 10, 20)).toEqual(buret)
  })

  it('drops marks too close together and thins the numbers', () => {
    const shown = legibleMarks(buret, 0.4, 20)
    expect(shown.every((m) => m.kind === 'major')).toBe(true)
    expect(shown.flatMap((m) => m.label ?? [])).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'])
  })
})
