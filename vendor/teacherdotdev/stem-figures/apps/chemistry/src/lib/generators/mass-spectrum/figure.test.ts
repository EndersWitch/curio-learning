import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import { buildMassSpectrum, fitRange } from './figure'
import MassSpectrumFigure from './MassSpectrumFigure.svelte'
import { answerLines, figureLabel, massSpectrumSettings, workingLine } from './settings'

const settings = (query: string) => massSpectrumSettings.fromParams(new URLSearchParams(query))
const build = (query: string) => buildMassSpectrum(settings(query))
/** The figure as it's downloaded: the SVG, with its label for screen readers. */
const drawn = (query: string) => render(MassSpectrumFigure, { props: { settings: settings(query) } }).body

describe('a mass spectrum figure', () => {
  it('draws magnesium’s three isotopes, each as tall as its abundance', () => {
    const g = build('')
    expect(g.bars).toHaveLength(3)
    expect(g.peakLabels.map((l) => l.text)).toEqual(['78.99%', '10.00%', '11.01%'])
    expect(g.bars[0].h / g.bars[1].h).toBeCloseTo(7.899, 2)
    expect(g.name?.text).toBe('Magnesium')
  })

  it('stands each bar on its mass number', () => {
    const g = build('element=Cl')
    const step = g.vLines[1] - g.vLines[0]
    expect(g.bars.map((b) => (b.x + b.w / 2 - g.grid.x) / step / 2)).toEqual([2, 4]) // from 33, 35 and 37
  })

  it('draws a monoisotopic element as one peak', () => {
    for (const element of ['F', 'Na', 'Al', 'P']) {
      const g = build(`element=${element}`)
      expect(g.bars, element).toHaveLength(1)
      expect(g.peakLabels[0].text).toBe('100%')
    }
  })

  it('scales the tallest peak to 100', () => {
    expect(build('scale=relative').peakLabels.map((l) => l.text)).toEqual(['100', '12.66', '13.94'])
  })

  it('names the heights in the y-axis title, unless the teacher typed their own', () => {
    const yTitle = (query: string) => build(query).labels.find((l) => l.kind === 'side' && l.rotate)?.text
    expect(yTitle('')).toBe('Abundance (%)')
    expect(yTitle('scale=relative')).toBe('Relative abundance')
    expect(yTitle('scale=relative&yTitle=Abundance%20(%25)')).toBe('Relative abundance')
    expect(yTitle('yTitle=Relative%20abundance')).toBe('Abundance (%)')
    expect(yTitle('scale=relative&yTitle=Intensity')).toBe('Intensity')
  })

  it('keeps the abundances and the name on the figure, under the chart title, and the axis titles', () => {
    for (const query of ['element=F', 'element=F&scale=relative&titleMode=text&title=Fluorine', 'element=Br&scale=relative']) {
      const g = build(query)
      const title = g.labels.find((l) => l.kind === 'title')
      const below = title ? title.y + 4 : 0
      for (const l of [...g.peakLabels, ...(g.name ? [g.name] : [])]) expect(l.y - g.fs * 1.2, query).toBeGreaterThan(below)
      expect(g.labels.filter((l) => l.kind === 'side').map((l) => l.text), query).toEqual(['Mass-to-charge ratio (m/z)', query.includes('relative') ? 'Relative abundance' : 'Abundance (%)'])
      expect(g.grid.y + g.grid.h).toBeLessThan(g.height)
    }
  })

  it('raises a label rather than overlap its neighbor’s', () => {
    const g = build('element=Sn&xFit=0&xFrom=110&xTo=126&xStep=1')
    g.peakLabels.forEach((a, i) =>
      g.peakLabels.slice(i + 1).forEach((b) => {
        const overlap = Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < g.fs
        expect(overlap).toBe(false)
      }),
    )
  })

  it('says when peaks are off a typed x-axis', () => {
    const g = build('element=Cl&xFit=0&xFrom=30&xTo=36&xStep=1')
    expect(g.bars).toHaveLength(1)
    expect(g.problems.peaks).toContain('m/z 37 is off the x-axis')
  })

  it('writes the answer key under the graph', () => {
    const g = build('answerKey=1&leaveOut=25')
    expect(g.answer.map((a) => a.text)).toEqual(['Magnesium (Mg): relative atomic mass 24.31', 'Missing peak: m/z 25, 10.00%'])
    expect(Math.min(...g.answer.map((a) => a.y))).toBeGreaterThan(g.grid.y + g.grid.h)
  })
})

describe('fitting the x-axis', () => {
  it('spans the peaks with room either side, a block per half m/z', () => {
    expect(fitRange([24, 25, 26])).toEqual({ xFrom: '22', xTo: '28', xStep: '0.5' })
    expect(fitRange([19])).toEqual({ xFrom: '16', xTo: '22', xStep: '0.5' })
    expect(fitRange([1, 2])).toEqual({ xFrom: '0', xTo: '6', xStep: '0.5' })
    expect(fitRange([112, 124])).toEqual({ xFrom: '111', xTo: '125', xStep: '0.5' })
  })

  it('takes bigger blocks for peaks far apart', () => {
    const r = fitRange([10, 200])
    expect((Number(r.xTo) - Number(r.xFrom)) / Number(r.xStep)).toBeLessThanOrEqual(50)
    expect(Number(r.xFrom)).toBeLessThan(10)
    expect(Number(r.xTo)).toBeGreaterThan(200)
  })
})

describe('what’s left for the student', () => {
  it('never names a hidden element on the figure', () => {
    for (const query of ['names=0', 'names=0&scale=relative', 'names=0&source=custom&name=Element%20Q']) {
      const svg = drawn(query)
      expect(svg, query).not.toMatch(/Magnesium|magnesium|Element Q/)
      expect(svg, query).not.toContain('24.31')
      expect(figureLabel(settings(query))).toContain('an unnamed element')
    }
    expect(drawn('')).toContain('Magnesium')
  })

  it('never shows the peak left out', () => {
    const svg = drawn('leaveOut=25')
    expect(svg).not.toContain('10.00%')
    expect(svg).toContain('78.99%')
    expect(build('leaveOut=25').bars).toHaveLength(2)
    expect(figureLabel(settings('leaveOut=25'))).toBe('A mass spectrum of magnesium: peaks at m/z 24 (78.99%) and 26 (11.01%), with one peak left out.')
  })

  it('prints the answers only in the answer key', () => {
    const svg = drawn('names=0&leaveOut=25&answerKey=1')
    expect(svg).toContain('Magnesium (Mg): relative atomic mass 24.31')
    expect(svg).toContain('Missing peak: m/z 25, 10.00%')
  })

  it('leaves out only a peak that’s there', () => {
    expect(settings('leaveOut=25').leaveOut).toBe(25)
    expect(settings('element=Cl&leaveOut=25').leaveOut).toBe(0)
  })
})

describe('isotopes typed in', () => {
  it('draw a made-up element with its name', () => {
    const s = settings('source=custom&name=Element%20Z&isotopes=10.013-19.9_11.009-80.1')
    const g = buildMassSpectrum(s)
    expect(g.bars).toHaveLength(2)
    expect(g.peakLabels.map((l) => l.text)).toEqual(['19.9%', '80.1%'])
    expect(g.name?.text).toBe('Element Z')
    expect(answerLines(s)).toEqual(['Element Z: relative atomic mass 10.81'])
    expect(workingLine(s)).toBe('(10.013 × 19.9 + 11.009 × 80.1) ÷ 100 = 10.81')
  })

  it('say when two masses round to the same peak', () => {
    expect(build('source=custom&isotopes=35-50_35.2-50').problems.isotopes).toContain('m/z 35')
  })

  it('travel through the page address', () => {
    const s = massSpectrumSettings.tidy({ ...massSpectrumSettings.defaults, source: 'custom', isotopes: [{ mass: 34.969, pct: 75.78 }, { mass: 36.966, pct: 24.22 }], leaveOut: 37 })
    expect(massSpectrumSettings.toQuery(s)).toBe('source=custom&isotopes=34.969-75.78_36.966-24.22&leaveOut=37')
    expect(massSpectrumSettings.fromParams(new URLSearchParams(massSpectrumSettings.toQuery(s)))).toEqual(s)
  })

  it('refuse anything but 1 to 6 masses with abundances', () => {
    for (const bad of ['', '10', '10-20_', '0-50', '10-120', 'a-b', Array(7).fill('10-10').join('_')]) {
      expect(settings(`isotopes=${bad}`).isotopes, bad).toEqual(massSpectrumSettings.defaults.isotopes)
    }
  })
})
