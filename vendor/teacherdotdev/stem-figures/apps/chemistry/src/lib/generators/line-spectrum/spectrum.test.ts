import { describe, expect, it } from 'vitest'
import { wavelengthColor, wavelengthRgb } from './color'
import { ELEMENTS } from './elements'
import { PLOT_W, answerLines, buildSpectrum, describeSpectrum } from './figure'
import { spectrumSettings } from './settings'
import { MIN_STRENGTH, asCustom, linesOf, mixtureAnswer, parseLines, tidyStrips, type MixtureStrip, type Strip } from './strips'

const d = spectrumSettings.defaults
const fromQuery = (query: string) => spectrumSettings.fromParams(new URLSearchParams(query))

describe('the element presets', () => {
  it('have 3 to 8 lines each, in order, to 0.1 nm', () => {
    for (const el of ELEMENTS) {
      expect(el.lines.length, el.symbol).toBeGreaterThanOrEqual(3)
      expect(el.lines.length, el.symbol).toBeLessThanOrEqual(8)
      const nms = el.lines.map(([nm]) => nm)
      expect(nms, el.symbol).toEqual([...nms].sort((a, b) => a - b))
      for (const nm of nms) expect(Math.round(nm * 10) / 10).toBe(nm)
    }
  })

  it('give hydrogen its four visible Balmer lines', () => {
    const h = ELEMENTS.find((e) => e.symbol === 'H')!
    expect(h.lines.map(([nm]) => nm)).toEqual([410.2, 434.0, 486.1, 656.3])
  })
})

describe('wavelength colors', () => {
  it('make sodium’s line yellow-orange and hydrogen’s red one red', () => {
    const [r, g, b] = wavelengthRgb(589)
    expect(r).toBe(1)
    expect(g).toBeGreaterThan(0.75)
    expect(g).toBeLessThan(1)
    expect(b).toBe(0)
    expect(wavelengthColor(656.3)).toBe('#ff0000')
  })

  it('fade toward the ends of the visible and are black past them', () => {
    expect(Math.max(...wavelengthRgb(390))).toBeLessThan(Math.max(...wavelengthRgb(430)))
    expect(Math.max(...wavelengthRgb(760))).toBeLessThan(Math.max(...wavelengthRgb(680)))
    expect(wavelengthColor(300)).toBe('#000000')
    expect(wavelengthColor(900)).toBe('#000000')
  })
})

describe('typed lines', () => {
  it('are read from commas or spaces, sorted, without repeats', () => {
    expect(parseLines('610, 450 520.5;450')).toEqual({ lines: [450, 520.5, 610], bad: [] })
  })

  it('leave out what isn’t a wavelength', () => {
    expect(parseLines('450, abc, 5, 600nm')).toEqual({ lines: [450], bad: ['abc', '5', '600nm'] })
  })
})

describe('strips', () => {
  const strips: Strip[] = [
    { type: 'element', id: 1, element: 'H' },
    { type: 'custom', id: 2, name: 'Element X', lines: '500, 656.3' },
    { type: 'element', id: 3, element: 'Na' },
    { type: 'mixture', id: 4, name: 'Unknown', of: [1, 2] },
  ]
  const mixture = strips[3] as MixtureStrip

  it('mix every line of the strips in them, once each', () => {
    expect(linesOf(mixture, strips).map((l) => l.nm)).toEqual([410.2, 434.0, 486.1, 500, 656.3])
  })

  it('draw lines equally bright, or relative to the element’s strongest', () => {
    expect(linesOf(strips[0], strips).every((l) => l.strength === 1)).toBe(true)
    const na = linesOf(strips[2], strips, true)
    expect(na.find((l) => l.nm === 589.0)!.strength).toBe(1)
    expect(na.find((l) => l.nm === 616.1)!.strength).toBe(MIN_STRENGTH)
  })

  it('name a mixture’s parts for the answer key', () => {
    expect(mixtureAnswer(mixture, strips)).toBe('Unknown: hydrogen and Element X')
    expect(mixtureAnswer({ ...mixture, of: [1, 2, 3] }, strips)).toBe('Unknown: hydrogen, Element X and sodium')
  })

  it('turn an element into its lines to edit', () => {
    expect(asCustom({ type: 'element', id: 7, element: 'Li' })).toEqual({ type: 'custom', id: 7, name: 'Lithium', lines: '460.3, 610.4, 670.8' })
  })

  it('are tidied: unknown ones dropped, ids unique, mixtures only of strips there', () => {
    const tidy = tidyStrips([
      { type: 'element', id: 1, element: 'H' },
      { type: 'element', id: 1, element: 'Xx' },
      { type: 'element', id: 1, element: 'He' },
      { type: 'mixture', id: 5, name: 'Unknown', of: [1, 2, 5, 9, 1] },
      'nonsense',
    ])
    expect(tidy).toEqual([
      { type: 'element', id: 1, element: 'H' },
      { type: 'element', id: 2, element: 'He' },
      { type: 'mixture', id: 5, name: 'Unknown', of: [1, 2] },
    ])
    expect(tidyStrips([])).toBeUndefined()
    expect(tidyStrips('H')).toBeUndefined()
  })
})

describe('settings in the address', () => {
  it('are left out at their defaults', () => {
    expect(spectrumSettings.toQuery(d)).toBe('')
  })

  it('travel intact, strips and all', () => {
    const s = { ...d, strips: [{ type: 'custom' as const, id: 1, name: 'Star', lines: '486.1, 656.3' }], style: 'print' as const, answerKey: true }
    expect(fromQuery(spectrumSettings.toQuery(s))).toEqual(s)
  })

  it('keep the range in order and at least 20 nm wide', () => {
    expect(fromQuery('from=700&to=400')).toMatchObject({ from: 400, to: 700 })
    expect(fromQuery('from=770&to=775')).toMatchObject({ from: 760, to: 780 })
    expect(fromQuery('from=100')).toMatchObject({ from: 380 })
  })
})

describe('the figure', () => {
  it('puts a wavelength at the same place on every strip', () => {
    const f = buildSpectrum({ ...d, strips: [{ type: 'element', id: 1, element: 'H' }, { type: 'custom', id: 2, name: '', lines: '656.3' }] })
    const a = f.strips[0].lines.find((l) => l.nm === 656.3)!
    const b = f.strips[1].lines[0]
    expect(a.x).toBe(b.x)
    expect(a.x).toBeCloseTo(f.x0 + ((656.3 - 400) / 300) * PLOT_W)
  })

  it('leaves out lines past the axis and counts them', () => {
    const f = buildSpectrum({ ...d, strips: [{ type: 'element', id: 1, element: 'K' }] })
    expect(f.strips[0].lines.map((l) => l.nm)).toEqual([404.4, 404.7, 580.2, 583.2, 691.1, 693.9])
    expect(f.strips[0].outside).toBe(2)
  })

  it('numbers the axis at multiples inside the range', () => {
    const f = buildSpectrum({ ...d, from: 380, to: 720 })
    expect(f.ticks.filter((t) => t.number).map((t) => t.number)).toEqual(['400', '450', '500', '550', '600', '650', '700'])
    expect(f.ticks).toHaveLength(35)
    expect(buildSpectrum({ ...d, ticks: 'none' }).ticks.every((t) => t.major)).toBe(true)
  })

  it('numbers every multiple even when ticks don’t land on it', () => {
    const f = buildSpectrum({ ...d, ticks: '20', numbers: '50' })
    expect(f.ticks.filter((t) => t.number).map((t) => t.number)).toEqual(['400', '450', '500', '550', '600', '650', '700'])
    expect(f.ticks.filter((t) => !t.major)).toHaveLength(12) // 420, 440, 460, 480, 520… not on a number
    const g = buildSpectrum({ ...d, ticks: '10', numbers: '25' })
    expect(g.ticks.filter((t) => t.number)).toHaveLength(13)
  })

  it('draws the axis under the last strip, under each, or not at all', () => {
    expect(buildSpectrum(d).strips.map((s) => s.axis)).toEqual([false, false, false, true])
    expect(buildSpectrum({ ...d, axis: 'each' }).strips.every((s) => s.axis)).toBe(true)
    expect(buildSpectrum({ ...d, axis: 'none' }).strips.some((s) => s.axis)).toBe(false)
  })

  it('colors emission lines and blackens the others', () => {
    expect(buildSpectrum(d).strips[2].lines[1].color).toBe(wavelengthColor(589.0))
    expect(buildSpectrum({ ...d, style: 'absorption' }).strips[2].lines[1].color).toBe('#000')
  })

  it('labels strips by name, symbol, a blank line, or not at all', () => {
    expect(buildSpectrum(d).strips.map((s) => s.label)).toEqual([{ text: 'Hydrogen' }, { text: 'Helium' }, { text: 'Sodium' }, { text: 'Unknown' }])
    expect(buildSpectrum({ ...d, labels: 'symbols' }).strips[0].label).toEqual({ text: 'H' })
    expect(buildSpectrum({ ...d, labels: 'blank' }).strips.map((s) => s.label)).toEqual([{ blank: true }, { blank: true }, { blank: true }, { text: 'Unknown' }])
    expect(buildSpectrum({ ...d, labels: 'none' }).strips.every((s) => s.label === null)).toBe(true)
  })

  it('answers what’s in each mixture, and blank labels top to bottom', () => {
    expect(answerLines(d)).toEqual(['Unknown: hydrogen and sodium'])
    expect(answerLines({ ...d, labels: 'blank' })).toEqual(['Top to bottom: Hydrogen, Helium, Sodium', 'Unknown: hydrogen and sodium'])
  })

  it('doesn’t give away a mixture’s parts to screen readers', () => {
    const text = describeSpectrum(d, buildSpectrum(d))
    expect(text).toContain('Unknown: lines at 410.2, 434, 486.1, 568.8, 589, 589.6, 616.1, 656.3 nm')
    expect(text).not.toMatch(/Unknown: hydrogen/)
  })
})
