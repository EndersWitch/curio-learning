import { describe, expect, it } from 'vitest'
import { marks } from '$lib/shared/marks'
import { answerLine, syringeSettings } from './settings'
import { syringeGeometry, syringeLayout, syringeScale } from './syringe'

describe('the gas syringe scale', () => {
  it('is marked every 1 and numbered every 10 on both sizes, with a medium mark at 5', () => {
    for (const size of ['50', '100'] as const) {
      const scale = syringeScale(size)
      const list = marks({ ...scale, max: scale.capacity })
      expect(list.filter((m) => m.label).map((m) => Number(m.label))).toEqual(
        Array.from({ length: scale.capacity / 10 + 1 }, (_, i) => i * 10),
      )
      expect(list.find((m) => m.value === 5)?.kind).toBe('medium')
      expect(list.find((m) => m.value === 7)?.kind).toBe('minor')
    }
  })

  it('reads to one estimated digit', () => {
    expect(syringeSettings.fromParams(new URLSearchParams('reading=43.66')).reading).toBe(43.7)
  })

  it('keeps the reading within the syringe', () => {
    expect(syringeSettings.fromParams(new URLSearchParams('size=50&reading=80')).reading).toBe(50)
  })
})

describe('the drawing', () => {
  it('puts 0 at the nozzle end and the full mark the same distance along on both sizes', () => {
    const small = syringeGeometry(syringeScale('50'), '50')
    const large = syringeGeometry(syringeScale('100'), '100')
    expect(small.xOf(0)).toBe(large.xOf(0))
    expect(small.xOf(50)).toBe(large.xOf(100))
    expect(small.barrelH).toBeLessThan(large.barrelH)
  })

  it('is wide enough for the plunger pulled out to a full syringe', () => {
    const g = syringeGeometry(syringeScale('100'), '100')
    expect(g.xOf(100) + g.piston + g.stem + g.knob).toBeLessThanOrEqual(g.width)
  })

  it('draws the flask and stand to the left of and below the syringe alone', () => {
    const scale = syringeScale('100')
    const alone = syringeLayout(scale, '100', 'syringe')
    const setUp = syringeLayout(scale, '100', 'setup')
    expect(setUp.width).toBeGreaterThan(alone.width)
    expect(setUp.height).toBeGreaterThan(alone.height)
    expect(setUp.offset.x + setUp.around!.left).toBe(0)
  })
})

describe('the answer key', () => {
  it('names the volume of gas in the chosen unit', () => {
    expect(answerLine(syringeSettings.defaults)).toBe('Volume of gas: 43.6 cm³')
    expect(answerLine({ ...syringeSettings.defaults, unit: 'mL' })).toBe('Volume of gas: 43.6 mL')
  })
})
