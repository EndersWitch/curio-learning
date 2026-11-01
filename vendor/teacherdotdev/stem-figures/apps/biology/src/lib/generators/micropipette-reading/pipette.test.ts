import { describe, expect, it } from 'vitest'
import { LABELS, PARTS, anchorOf, partsShown, pipetteLayout, spreadLabels } from './layout'
import { MODELS, canSet, carryVolume, decimalAfter, digitsFor, pipette, randomVolume, readVolume, stepOf, tidyVolume, volumeOf, volumeText } from './pipette'
import { answerLine, digitsText, pipetteSettings, underLine } from './settings'

const P = (m: (typeof MODELS)[number]) => pipette(m)

describe('micropipettes', () => {
  it('are used from a tenth of their largest volume up to it', () => {
    expect(MODELS.map((m) => [P(m).min, P(m).max])).toEqual([
      [0.2, 2], [1, 10], [2, 20], [10, 100], [20, 200], [100, 1000],
    ])
  })

  it('step by one on the bottom wheel', () => {
    expect(MODELS.map((m) => stepOf(P(m)))).toEqual([0.01, 0.1, 0.1, 1, 1, 1])
    expect(MODELS.map((m) => P(m).decimals)).toEqual([2, 1, 1, 0, 0, 0])
  })

  it('have three wheels, or four on a P1000', () => {
    expect(MODELS.map((m) => P(m).places.length)).toEqual([3, 3, 3, 3, 3, 4])
  })

  it('color the wheels as Gilson does: black for µL, red past the decimal point; a P1000 all black', () => {
    expect(P('P2').red).toEqual([false, true, true])
    expect(P('P20').red).toEqual([false, false, true])
    expect(P('P200').red).toEqual([false, false, false])
    expect(P('P1000').red).toEqual([false, false, false, false])
    expect(MODELS.map((m) => decimalAfter(P(m)))).toEqual([1, 2, 2, null, null, null])
  })
})

describe('the volume display', () => {
  // Each model's examples from Gilson's guide and lab manuals: the volume, and its wheels top to bottom.
  const CASES: [(typeof MODELS)[number], number, number[]][] = [
    ['P2', 1.25, [1, 2, 5]],
    ['P2', 0.2, [0, 2, 0]],
    ['P2', 2, [2, 0, 0]],
    ['P2', 0.07 + 0.5, [0, 5, 7]],
    ['P10', 7.5, [0, 7, 5]],
    ['P10', 10, [1, 0, 0]],
    ['P10', 1.1, [0, 1, 1]],
    ['P20', 12.5, [1, 2, 5]],
    ['P20', 2.2, [0, 2, 2]],
    ['P20', 10, [1, 0, 0]],
    ['P20', 20, [2, 0, 0]],
    ['P20', 19.9, [1, 9, 9]],
    ['P100', 75, [0, 7, 5]],
    ['P100', 100, [1, 0, 0]],
    ['P200', 125, [1, 2, 5]],
    ['P200', 95, [0, 9, 5]],
    ['P200', 200, [2, 0, 0]],
    ['P1000', 750, [0, 7, 5, 0]],
    ['P1000', 1000, [1, 0, 0, 0]],
    ['P1000', 200, [0, 2, 0, 0]],
    ['P1000', 755, [0, 7, 5, 5]],
    ['P1000', 101, [0, 1, 0, 1]],
  ]

  it('shows each volume on the right wheels', () => {
    for (const [m, v, d] of CASES) expect(digitsFor(P(m), v), `${m} ${v}`).toEqual(d)
  })

  it('reads back the volume it shows', () => {
    for (const [m, v, d] of CASES) expect(volumeOf(P(m), d), `${m} ${d}`).toBe(Math.round(v * 100) / 100)
  })

  it('round-trips every volume each model can be set to', () => {
    for (const m of MODELS) {
      const p = P(m)
      const count = p.places.length
      for (let n = Math.round(p.min / stepOf(p)); n * stepOf(p) <= p.max + 1e-9; n++) {
        const v = volumeOf(p, p.places.map((_, i) => Math.floor(n / 10 ** (count - 1 - i)) % 10))
        expect(canSet(p, v), `${m} ${v}`).toBe(true)
        expect(volumeOf(p, digitsFor(p, v)), `${m} ${v}`).toBe(v)
      }
    }
  })

  it('writes the volume to the bottom wheel’s place', () => {
    expect(volumeText(P('P2'), 1.25)).toBe('1.25 µL')
    expect(volumeText(P('P20'), 10)).toBe('10.0 µL')
    expect(volumeText(P('P200'), 125)).toBe('125 µL')
    expect(volumeText(P('P1000'), 750)).toBe('750 µL')
  })
})

describe('typing a volume', () => {
  it('takes one the pipette can be set to', () => {
    expect(readVolume(P('P20'), '12.5')).toEqual({ volume: 12.5 })
    expect(readVolume(P('P20'), ' 12,5 µL ')).toEqual({ volume: 12.5 })
    expect(readVolume(P('P2'), '.75')).toEqual({ volume: 0.75 })
    expect(readVolume(P('P1000'), '1000ul')).toEqual({ volume: 1000 })
  })

  it('says why it can’t take one outside its range', () => {
    expect(readVolume(P('P20'), '25').error).toBe('A 20 µL pipette is set from 2 to 20 µL, so it can’t be set to 25 µL.')
    expect(readVolume(P('P1000'), '50').error).toBe('A 1000 µL pipette is set from 100 to 1000 µL, so it can’t be set to 50 µL.')
  })

  it('says why it can’t take one between steps, and the nearest it can', () => {
    expect(readVolume(P('P20'), '12.53').error).toBe('A 20 µL pipette is set in steps of 0.1 µL, so 12.53 µL can’t be dialed. The nearest is 12.5 µL.')
    expect(readVolume(P('P1000'), '755.4').error).toBe('A 1000 µL pipette is set in steps of 1 µL, so 755.4 µL can’t be dialed. The nearest is 755 µL.')
    expect(readVolume(P('P200'), '99.5').error).toContain('The nearest is 100 µL.')
  })

  it('says what to type for something that isn’t a number', () => {
    expect(readVolume(P('P20'), '').error).toBe('Type a volume in µL, like 12.5.')
    expect(readVolume(P('P20'), 'twelve').error).toBe('“twelve” isn’t a volume. Type it in µL, like 12.5.')
    expect(readVolume(P('P20'), '-5').error).toContain('isn’t a volume')
  })
})

describe('volumes for a pipette', () => {
  it('tidy one to a step within range', () => {
    expect(tidyVolume(P('P20'), 12.53)).toBe(12.5)
    expect(tidyVolume(P('P20'), 50)).toBe(20)
    expect(tidyVolume(P('P1000'), 755.6)).toBe(756)
    expect(tidyVolume(P('P1000'), 0)).toBe(100)
  })

  it('pick random ones it can be set to', () => {
    for (const m of MODELS) {
      const p = P(m)
      expect(randomVolume(p, () => 0)).toBe(p.min)
      expect(randomVolume(p, () => 0.999999)).toBe(p.max)
      expect(randomVolume(p, () => 1)).toBe(p.max)
      expect(canSet(p, randomVolume(p))).toBe(true)
    }
  })

  it('carry one over to another pipette only if it can be set there', () => {
    expect(carryVolume(P('P200'), 20)).toBe(20)
    expect(carryVolume(P('P200'), 12.5)).toBe(125)
    expect(carryVolume(P('P1000'), 12.5)).toBe(750)
    expect(carryVolume(P('P1000'), 200)).toBe(200)
  })
})

describe('micropipette settings', () => {
  it('start on a P20 at 12.5 µL', () => {
    const d = pipetteSettings.defaults
    expect([d.model, d.volume, digitsText(d)]).toEqual(['P20', 12.5, '1-2-5'])
  })

  it('tidy a volume from the address to one the pipette can be set to', () => {
    expect(pipetteSettings.fromParams(new URLSearchParams('model=P1000&volume=755.6')).volume).toBe(756)
    expect(pipetteSettings.fromParams(new URLSearchParams('model=P2&volume=5')).volume).toBe(2)
    expect(pipetteSettings.fromParams(new URLSearchParams('model=P200&volume=125')).volume).toBe(125)
  })

  it('print the answer, a write-in line, or nothing under the figure', () => {
    const d = pipetteSettings.defaults
    expect(answerLine(d)).toBe('Volume: 12.5 µL')
    expect(underLine(d)).toBe('')
    expect(underLine({ ...d, writeIn: true })).toBe('Volume: ____________ µL')
    expect(underLine({ ...d, writeIn: true, answerKey: true })).toBe('Volume: 12.5 µL')
    expect(answerLine({ ...d, model: 'P1000', volume: 1000 })).toBe('Volume: 1000 µL')
  })
})

describe('the drawn micropipette', () => {
  it('puts the tip below the shaft’s end, longer for bigger pipettes', () => {
    const lengths = (['P10', 'P200', 'P1000'] as const).map((m) => {
      const at = pipetteLayout(P(m), true)
      expect(at.tip.top).toBeLessThan(at.shaft.bottom)
      return at.tip.bottom - at.tip.top
    })
    expect(lengths[0]).toBeLessThan(lengths[1])
    expect(lengths[1]).toBeLessThan(lengths[2])
  })

  it('labels every part, leaving out the tip when there’s none', () => {
    expect(partsShown(pipetteLayout(P('P20'), true))).toEqual([...PARTS])
    expect(partsShown(pipetteLayout(P('P20'), false))).not.toContain('tip')
  })

  it('points labels at their parts top to bottom', () => {
    for (const m of MODELS) {
      const at = pipetteLayout(P(m), true)
      const ys = PARTS.map((part) => anchorOf(at, part).y)
      expect([...ys].sort((a, b) => a - b), m).toEqual(ys)
    }
  })

  it('spreads labels so none overlap, moving each as little as it can', () => {
    expect(spreadLabels([10, 20, 100], 22, 0, 200)).toEqual([10, 32, 100])
    expect(spreadLabels([180, 190, 195], 22, 0, 200)).toEqual([156, 178, 200])
    for (const m of MODELS) {
      const at = pipetteLayout(P(m), true)
      const ys = spreadLabels(PARTS.map((part) => anchorOf(at, part).y), LABELS.gap, 10, at.height - 6)
      for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(LABELS.gap - 1e-9)
    }
  })
})
