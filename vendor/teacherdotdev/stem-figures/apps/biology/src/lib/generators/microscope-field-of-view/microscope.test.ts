import { describe, expect, it } from 'vitest'
import { FIELD_R, pxPerUm, textWidth, wrap } from './layout'
import { fieldAt, fitAcross, formatFit, formatNumber, lengthText, scaleBarLength, sizeFromFit, totalMagnification } from './microscope'

describe('magnification', () => {
  it('is the eyepiece times the objective', () => {
    expect(totalMagnification('10', '4')).toBe(40)
    expect(totalMagnification('10', '40')).toBe(400)
    expect(totalMagnification('15', '100')).toBe(1500)
  })
})

describe('the field of view', () => {
  it('shrinks in step as magnification grows', () => {
    // a typical school microscope: 4.5 mm at 40×
    expect(fieldAt(4.5, 40, 100)).toBeCloseTo(1.8)
    expect(fieldAt(4.5, 40, 400)).toBeCloseTo(0.45)
    expect(fieldAt(4.5, 40, 1000)).toBeCloseTo(0.18)
    expect(fieldAt(0.45, 400, 40)).toBeCloseTo(4.5)
  })

  it('gives a specimen’s size from how many fit across it, and back', () => {
    expect(fitAcross(1.6, 400)).toBeCloseTo(4)
    expect(sizeFromFit(1.6, 4)).toBeCloseTo(400)
    expect(sizeFromFit(1.8, fitAcross(1.8, 225))).toBeCloseTo(225)
  })
})

describe('numbers in answers', () => {
  it('are written to three significant figures, grouped in thousands', () => {
    expect([0.45, 1.8, 4.5, 0.18, 172.4, 1800, 4500, 12345].map(formatNumber)).toEqual([
      '0.45', '1.8', '4.5', '0.18', '172', '1,800', '4,500', '12,300',
    ])
  })

  it('count specimens across whole, or to as many places as keep the size true', () => {
    expect(formatFit(6)).toBe('6')
    expect(formatFit(4.5)).toBe('4.5')
    expect(formatFit(450 / 220)).toBe('2.05')
  })

  it('label scale bars in µm, and in mm from 1 mm', () => {
    expect(lengthText(200)).toBe('200 µm')
    expect(lengthText(1000)).toBe('1 mm')
  })
})

describe('the scale bar', () => {
  it('is a round length, at most a quarter of the field', () => {
    expect(scaleBarLength(4.5)).toBe(1000)
    expect(scaleBarLength(1.8)).toBe(200)
    expect(scaleBarLength(0.45)).toBe(100)
    expect(scaleBarLength(0.18)).toBe(20)
    for (const f of [0.05, 0.3, 1, 2.5, 7]) expect(scaleBarLength(f)).toBeLessThanOrEqual((f * 1000) / 4 + 1e-9)
  })
})

describe('the drawing’s scale', () => {
  it('makes the field’s diameter its width in µm', () => {
    for (const field of [4.5, 1.8, 0.45, 0.18]) expect(pxPerUm(field) * field * 1000).toBeCloseTo(2 * FIELD_R)
  })

  it('draws a specimen as many times across the field as fit', () => {
    // 6 onion cells of 300 µm across a 1.8 mm field
    expect((2 * FIELD_R) / (300 * pxPerUm(1.8))).toBeCloseTo(6)
  })
})

describe('wrapped text', () => {
  it('breaks at spaces, each line within the width', () => {
    const text = 'The field of view is 1.8 mm across. Estimate the length of one onion cell in micrometers (µm).'
    const lines = wrap(text, 17, 300)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe(text)
    for (const line of lines) expect(textWidth(line, 17)).toBeLessThanOrEqual(300)
  })

  it('leaves room on the first line for a label', () => {
    const lines = wrap('a b c d e f g h', 10, 30, 20)
    expect(textWidth(lines[0], 10)).toBeLessThanOrEqual(10)
  })
})
