import { describe, expect, test } from 'vitest'
import { arrow, labelPoint, numbered, styleOf } from './vector'

describe('numbered', () => {
  const text = (t: string) => ({ mode: 'text' as const, text: t })
  test('adds the number to the subscript, or makes one', () => {
    expect(numbered(text('T'), 1).text).toBe('T_1')
    expect(numbered(text('F_N'), 2).text).toBe('F_{N2}')
    expect(numbered(text('F_{air}'), 3).text).toBe('F_{air3}')
    expect(numbered(text(''), 1).text).toBe('')
  })

  test('keeps a blank line blank', () => {
    expect(numbered({ mode: 'blank', text: 'T' }, 2)).toEqual({ mode: 'blank', text: 'T_2' })
  })
})

describe('arrow', () => {
  test('the shaft ends inside the head, and the head ends at the tip', () => {
    const a = arrow({ x1: 0, y1: 0, x2: 100, y2: 0 }, 12)
    expect(a.shaft).toEqual({ x1: 0, y1: 0, x2: 91.6, y2: 0 })
    expect(a.head[0]).toEqual({ x: 100, y: 0 })
  })

  test('a vector shorter than its head is all head', () => {
    const a = arrow({ x1: 0, y1: 0, x2: 5, y2: 0 }, 12)
    expect(a.shaft.x2).toBe(0)
  })
})

describe('labelPoint', () => {
  test('side 1 is above a vector pointing right', () => {
    const p = labelPoint({ x1: 0, y1: 0, x2: 100, y2: 0 }, { at: 'middle', side: 1, gap: 10 })
    expect(p.x).toBeCloseTo(50)
    expect(p.y).toBeCloseTo(-10)
  })

  test('past the tip', () => {
    const p = labelPoint({ x1: 0, y1: 0, x2: 0, y2: 100 }, { at: 'tip', gap: 15 })
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(115)
  })
})

describe('styleOf', () => {
  test('velocity and acceleration are motion, the rest are forces', () => {
    expect(styleOf('velocity')).toBe('motion')
    expect(styleOf('acceleration')).toBe('motion')
    expect(styleOf('gravity')).toBe('force')
    expect(styleOf('tension')).toBe('force')
  })
})
