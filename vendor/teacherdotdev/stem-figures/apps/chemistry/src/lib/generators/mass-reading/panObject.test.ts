import { describe, expect, it } from 'vitest'
import { objectBounds } from '../volume-by-displacement/objects'
import { DIGITAL_PAN, digitalBalanceSize } from './digital'
import { objectOnPan } from './panObject'
import { massSettings } from './settings'

const fromQuery = (query: string) => massSettings.fromParams(new URLSearchParams(query))
// The triple beam's pan, which is narrower than the digital balance's.
const tripleBeamPan = { cx: 98, top: 142, width: 160 }

describe('an object on the pan', () => {
  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('%s rests on the pan, within its edges', (kind) => {
    for (const marbles of [1, 3, 5]) {
      const b = objectBounds(objectOnPan(kind, marbles, tripleBeamPan))
      expect(b.bottom).toBeCloseTo(tripleBeamPan.top)
      expect(b.left).toBeGreaterThanOrEqual(tripleBeamPan.cx - tripleBeamPan.width / 2)
      expect(b.right).toBeLessThanOrEqual(tripleBeamPan.cx + tripleBeamPan.width / 2)
    }
  })

  it('is the same size however many marbles there are', () => {
    const one = objectOnPan('marbles', 1, DIGITAL_PAN)
    const five = objectOnPan('marbles', 5, DIGITAL_PAN)
    if (one.kind !== 'marbles' || five.kind !== 'marbles') throw new Error('expected marbles')
    expect(five.marbles).toHaveLength(5)
    expect(five.marbles.every((m) => Math.abs(m.r - one.marbles[0].r) < 1e-9)).toBe(true)
  })

  it.each(['marbles', 'rock', 'cube', 'cylinder'] as const)('makes room above a digital balance for %s', (kind) => {
    const top = objectBounds(objectOnPan(kind, 2, DIGITAL_PAN)).top
    expect(digitalBalanceSize(false, 'boat', top).top).toBeLessThan(top)
  })
})

describe('Mass Reading settings', () => {
  it('start with nothing on the pan but the balance’s own, so older links draw the same figure', () => {
    expect(massSettings.defaults).toMatchObject({ pan: 'boat', object: 'none' })
    expect(massSettings.toQuery(massSettings.defaults)).toBe('')
  })

  it('read an object and whole marbles from the address', () => {
    expect(fromQuery('object=marbles&marbles=3.4')).toMatchObject({ object: 'marbles', marbles: 3 })
    expect(fromQuery('object=teapot').object).toBe('none')
  })
})
