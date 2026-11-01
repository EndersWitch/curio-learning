import { describe, expect, it } from 'vitest'
import { digitalBalance, displayText, randomMass, roundMass } from './digital'

describe('digital balance', () => {
  it('holds less the more decimal places it shows', () => {
    expect(digitalBalance(1)).toEqual({ decimals: 1, capacity: 1000, analytical: false })
    expect(digitalBalance(2)).toEqual({ decimals: 2, capacity: 400, analytical: false })
    expect(digitalBalance(3)).toEqual({ decimals: 3, capacity: 200, analytical: true })
    expect(digitalBalance(4)).toEqual({ decimals: 4, capacity: 200, analytical: true })
  })

  it('rounds the mass to the places it shows and keeps it within capacity', () => {
    expect(roundMass(digitalBalance(2), 12.345)).toBe(12.35)
    expect(roundMass(digitalBalance(4), 0.123456)).toBe(0.1235)
    expect(roundMass(digitalBalance(2), 999)).toBe(400)
    expect(roundMass(digitalBalance(1), -3)).toBe(0)
  })

  it('shows every decimal place, as a real display does', () => {
    expect(displayText(digitalBalance(2), 12.3)).toBe('12.30')
    expect(displayText(digitalBalance(4), 0)).toBe('0.0000')
  })

  it('picks random masses that are valid on the balance', () => {
    for (const d of [1, 2, 3, 4] as const) {
      for (const r of [0, 0.5, 0.9999]) {
        const b = digitalBalance(d)
        const m = randomMass(b, () => r)
        expect(m).toBe(roundMass(b, m))
        expect(m).toBeGreaterThan(0)
        expect(m).toBeLessThan(b.capacity)
      }
    }
  })
})
