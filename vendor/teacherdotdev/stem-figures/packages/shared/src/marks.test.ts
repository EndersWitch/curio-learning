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

  it('numbers from where the scale starts', () => {
    const m = marks({ from: 10, max: 250, labelEvery: 20, minorEvery: 2 })
    expect(m[0]).toEqual({ value: 10, kind: 'major', label: '10' })
    expect(m.flatMap((x) => x.label ?? []).slice(0, 3)).toEqual(['10', '30', '50'])
    expect(m.filter((x) => x.kind === 'medium').map((x) => x.value).slice(0, 3)).toEqual([20, 40, 60])
    expect(m.at(-1)).toEqual({ value: 250, kind: 'major', label: '250' })
  })

  it('numbers below zero on the same steps', () => {
    const labels = marks({ from: -20, max: 20, labelEvery: 10, minorEvery: 1 }).flatMap((x) => x.label ?? [])
    expect(labels).toEqual(['-20', '-10', '0', '10', '20'])
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

  it('judges spacing the same when the scale doesn’t start at 0', () => {
    const list = marks({ from: 10, max: 250, labelEvery: 20, minorEvery: 2 })
    // 2 mL marks 2 units apart are too close, but the medium marks (10 units) aren't
    const shown = legibleMarks(list, 2, 16)
    expect(shown.some((m) => m.kind === 'minor')).toBe(false)
    expect(shown.filter((m) => m.kind === 'medium').map((m) => m.value).slice(0, 2)).toEqual([20, 40])
    expect(shown.flatMap((m) => m.label ?? []).slice(0, 3)).toEqual(['10', '30', '50'])
  })

  it('drops marks too close together and thins the numbers', () => {
    const shown = legibleMarks(buret, 0.4, 20)
    expect(shown.every((m) => m.kind === 'major')).toBe(true)
    expect(shown.flatMap((m) => m.label ?? [])).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'])
  })
})
