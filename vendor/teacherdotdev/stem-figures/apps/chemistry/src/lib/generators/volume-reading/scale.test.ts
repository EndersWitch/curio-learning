import { describe, expect, it } from 'vitest'
import { marks } from '$lib/shared/marks'
import { fitScale, formatReading, instrumentName, numbersFit, randomReading, roundReading, scaleMarks, scaleOptions, volumeScale, type MarkSpacing, type NumberSpacing, type VolumeInstrument } from './scale'

describe('graduated cylinder marks', () => {
  it.each([
    ['10', 10, 1, 0.1, 2],
    ['25', 25, 5, 0.5, 2],
    ['50', 50, 10, 1, 1],
    ['100', 100, 10, 1, 1],
    ['250', 250, 20, 2, 1],
    ['1000', 1000, 100, 10, 0],
  ] as const)('%s mL: labeled every %s, minor every %s, read to %s decimals', (size, capacity, label, minor, decimals) => {
    const s = volumeScale({ instrument: 'cylinder', size, beaker: 'medium' })
    expect(s).toMatchObject({ capacity, labelEvery: label, minorEvery: minor, decimals, readsDown: false })
  })
})

describe('the 25 mL graduated cylinder', () => {
  it('has 0.5 mL marks numbered every 5 mL, with a medium mark halfway between numbers', () => {
    const list = scaleMarks(volumeScale({ instrument: 'cylinder', size: '25', beaker: 'medium' }))
    expect(list.flatMap((m) => m.label ?? [])).toEqual(['0', '5', '10', '15', '20', '25'])
    expect(list.filter((m) => m.kind === 'medium').map((m) => m.value)).toEqual([2.5, 7.5, 12.5, 17.5, 22.5])
  })

  it('is numbered every 1 mL with 0.2 mL marks, which would leave 25 marks between 5 mL numbers', () => {
    expect(volumeScale({ instrument: 'cylinder', size: '25', beaker: 'medium', marks: '0.2' })).toMatchObject({ minorEvery: 0.2, labelEvery: 1 })
    expect(volumeScale({ instrument: 'cylinder', size: '25', beaker: 'medium', marks: '1' })).toMatchObject({ minorEvery: 1, labelEvery: 5 })
  })
})

describe('the big graduated cylinders', () => {
  const cyl250 = volumeScale({ instrument: 'cylinder', size: '250', beaker: 'medium' })
  const cyl1000 = volumeScale({ instrument: 'cylinder', size: '1000', beaker: 'medium' })

  it('the 250 mL is marked from 10 mL up, numbered 10, 30, 50… 250', () => {
    expect(cyl250.lowest).toBe(10)
    const labels = marks({ from: cyl250.lowest, max: 250, labelEvery: cyl250.labelEvery, minorEvery: cyl250.minorEvery }).flatMap((m) => m.label ?? [])
    expect(labels).toEqual(['10', '30', '50', '70', '90', '110', '130', '150', '170', '190', '210', '230', '250'])
  })

  it('the 250 mL can’t read below its lowest mark', () => {
    expect(roundReading(cyl250, 4)).toBe(10)
    expect(randomReading(cyl250, () => 0)).toBeGreaterThanOrEqual(10)
  })

  it('the 1000 mL is marked from 0, numbered every 100 mL up to 1000', () => {
    expect(cyl1000.lowest).toBe(0)
    expect(marks({ max: 1000, labelEvery: cyl1000.labelEvery, minorEvery: cyl1000.minorEvery }).at(-1)).toMatchObject({ value: 1000, kind: 'major', label: '1000' })
  })

  it('give the 1000 mL a medium mark every 50 mL', () => {
    const list = marks({ max: 1000, labelEvery: cyl1000.labelEvery, minorEvery: cyl1000.minorEvery })
    expect(list.filter((m) => m.kind === 'medium').map((m) => m.value).slice(0, 3)).toEqual([50, 150, 250])
  })

  it('round readings to the estimated digit', () => {
    expect(roundReading(cyl250, 143.27)).toBe(143.3)
    expect(roundReading(cyl1000, 642.6)).toBe(643)
    expect(formatReading(cyl1000, 640)).toBe('640')
  })
})

describe('buret marks', () => {
  it('is 50 mL read downward, labeled every 1 mL, minor every 0.1, read to 0.01', () => {
    expect(volumeScale({ instrument: 'buret', size: '10', beaker: 'medium' })).toEqual({ capacity: 50, lowest: 0, labelEvery: 1, minorEvery: 0.1, decimals: 2, readsDown: true, numbered: true })
  })
})

describe('beaker marks', () => {
  it.each([
    ['small', 50, 10, 10],
    ['medium', 250, 50, 25],
    ['large', 600, 100, 50],
  ] as const)('%s is %s mL, labeled every %s, minor every %s, read to the whole mL', (beaker, capacity, label, minor) => {
    const s = volumeScale({ instrument: 'beaker', size: '100', beaker })
    expect(s).toEqual({ capacity, lowest: 0, labelEvery: label, minorEvery: minor, decimals: 0, readsDown: false, numbered: true })
  })
})

describe('the reading', () => {
  const cyl100 = volumeScale({ instrument: 'cylinder', size: '100', beaker: 'medium' })
  const buret = volumeScale({ instrument: 'buret', size: '100', beaker: 'medium' })
  const beaker = volumeScale({ instrument: 'beaker', size: '100', beaker: 'large' })

  it('rounds to the estimated digit', () => {
    expect(roundReading(cyl100, 43.27)).toBe(43.3)
    expect(roundReading(buret, 23.475)).toBe(23.48)
    expect(roundReading(buret, 0.004)).toBe(0)
    expect(roundReading(beaker, 347.6)).toBe(348)
  })

  it('stays within the instrument', () => {
    expect(roundReading(cyl100, 140)).toBe(100)
    expect(roundReading(buret, -2)).toBe(0)
  })

  it('is written with every decimal place, including trailing zeros', () => {
    expect(formatReading(buret, 23.4)).toBe('23.40')
    expect(formatReading(cyl100, 40)).toBe('40.0')
    expect(formatReading(beaker, 350)).toBe('350')
  })

  it('can be picked at random, always a valid reading', () => {
    for (const r of [0, 0.3, 0.999999]) {
      const v = randomReading(buret, () => r)
      expect(v).toBe(roundReading(buret, v))
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThan(50)
    }
    expect(randomReading(cyl100, () => 0.5)).toBe(52.5)
  })
})

const EVERY: VolumeInstrument[] = [
  ...(['10', '25', '50', '100', '250', '1000'] as const).map((size) => ({ instrument: 'cylinder' as const, size, beaker: 'medium' as const })),
  { instrument: 'buret', size: '100', beaker: 'medium' },
  ...(['small', 'medium', 'large'] as const).map((beaker) => ({ instrument: 'beaker' as const, size: '100' as const, beaker })),
]

describe('the scales a teacher can pick', () => {
  it.each([
    ['cylinder', '10', 'medium', [0.1, 0.2, 0.5], [1, 2, 5]],
    ['cylinder', '25', 'medium', [0.2, 0.5, 1], [1, 5]],
    ['cylinder', '50', 'medium', [0.5, 1, 2], [5, 10]],
    ['cylinder', '100', 'medium', [0.5, 1, 2, 5], [5, 10, 20]],
    ['cylinder', '250', 'medium', [1, 2, 5], [10, 20]],
    ['cylinder', '1000', 'medium', [5, 10, 20, 50], [50, 100, 200]],
    ['buret', '100', 'medium', [0.1, 0.2, 0.5], [1, 2, 5]],
    ['beaker', '100', 'small', [5, 10], [10, 25]],
    ['beaker', '100', 'medium', [10, 25, 50], [25, 50]],
    ['beaker', '100', 'large', [25, 50, 100], [100, 200]],
  ] as const)('%s %s %s: marks %j, numbered every %j', (instrument, size, beaker, marks, numbers) => {
    expect(scaleOptions({ instrument, size, beaker })).toMatchObject({ marks, numbers })
  })

  it('include each instrument’s standard scale, and numbers that fit every mark it offers', () => {
    for (const choice of EVERY) {
      const { marks, numbers, standard } = scaleOptions(choice)
      expect(marks).toContain(standard.marks)
      expect(numbers).toContain(standard.numbers)
      expect(numbersFit(standard.marks, standard.numbers)).toBe(true)
      for (const minor of marks) {
        const scale = volumeScale({ ...choice, marks: String(minor) as MarkSpacing })
        expect(numbersFit(minor, scale.labelEvery), `${choice.instrument} ${minor}`).toBe(true)
      }
    }
  })

  it('number the top mark and keep the numbers readable on the whole instrument', () => {
    for (const choice of EVERY) {
      for (const numbers of scaleOptions(choice).numbers) {
        const scale = volumeScale({ ...choice, numbers: String(numbers) as NumberSpacing })
        expect(scaleMarks(scale).at(-1)?.label, `${choice.instrument} ${numbers}`).toBe(String(scale.capacity))
      }
    }
  })

  it('draw the marks and numbers picked', () => {
    const scale = volumeScale({ instrument: 'cylinder', size: '100', beaker: 'medium', marks: '2', numbers: '20' })
    expect(scale).toMatchObject({ minorEvery: 2, labelEvery: 20, decimals: 1 })
    const list = scaleMarks(scale)
    expect(list.flatMap((m) => m.label ?? [])).toEqual(['0', '20', '40', '60', '80', '100'])
    expect(list.filter((m) => m.kind === 'medium').map((m) => m.value).slice(0, 2)).toEqual([10, 30])
  })

  it('can leave the numbers off the numbered marks', () => {
    const scale = volumeScale({ instrument: 'cylinder', size: '25', beaker: 'medium', marks: '0.2', numbers: 'none' })
    expect(scale).toMatchObject({ minorEvery: 0.2, labelEvery: 1, numbered: false })
    const list = scaleMarks(scale)
    expect(list.some((m) => m.label)).toBe(false)
    expect(list.filter((m) => m.kind === 'major')).toHaveLength(26)
  })

  it('go back to the standard ones where the instrument doesn’t offer them', () => {
    const cyl10 = { instrument: 'cylinder', size: '10', beaker: 'medium' } as const
    expect(fitScale({ ...cyl10, marks: '5', numbers: '20' })).toEqual({ marks: 'standard', numbers: 'standard' })
    // 0.1 mL marks numbered every 5 mL would be 50 marks between numbers
    expect(fitScale({ ...cyl10, marks: '0.1', numbers: '5' })).toEqual({ marks: 'standard', numbers: 'standard' })
    expect(fitScale({ ...cyl10, marks: '0.5', numbers: '5' })).toEqual({ marks: '0.5', numbers: '5' })
    // the standard ones picked by name are written 'standard'
    expect(fitScale({ ...cyl10, marks: '0.1', numbers: '1' })).toEqual({ marks: 'standard', numbers: 'standard' })
    expect(fitScale({ ...cyl10, marks: '0.2', numbers: 'none' })).toEqual({ marks: '0.2', numbers: 'none' })
  })
})

describe('how far a reading goes', () => {
  const cyl25 = { instrument: 'cylinder', size: '25', beaker: 'medium' } as const

  it('follows the marks: one digit past the smallest', () => {
    expect(volumeScale({ ...cyl25, marks: '0.2' }).decimals).toBe(2)
    expect(volumeScale({ ...cyl25, marks: '1' }).decimals).toBe(1)
    expect(volumeScale({ instrument: 'cylinder', size: '1000', beaker: 'medium', marks: '50' }).decimals).toBe(0)
    expect(volumeScale({ instrument: 'beaker', size: '100', beaker: 'small', marks: '5' }).decimals).toBe(1)
  })

  it('puts every reading on that precision', () => {
    const tenths = volumeScale({ ...cyl25, marks: '1' })
    expect(roundReading(tenths, 18.64)).toBe(18.6)
    expect(formatReading(tenths, 18)).toBe('18.0')
    for (const r of [0, 0.37, 0.999]) {
      const v = randomReading(tenths, () => r)
      expect(v).toBe(roundReading(tenths, v))
    }
  })
})

describe('the instrument’s name', () => {
  it('is in the chosen unit', () => {
    expect(instrumentName({ instrument: 'cylinder', size: '25', beaker: 'medium' })).toBe('25 mL graduated cylinder')
    expect(instrumentName({ instrument: 'beaker', size: '100', beaker: 'large' }, 'cm3')).toBe('600 cm³ beaker')
  })
})
