import { describe, expect, test } from 'vitest'
import { answerLines, waveSettings } from './settings'
import { buildWave, fitX, fitY, lineXs } from './wave'

const build = (query: string) => buildWave(waveSettings.fromParams(new URLSearchParams(query)))
const settingsOf = (query: string) => waveSettings.fromParams(new URLSearchParams(query))

/** The axis's numbers as drawn: the line each is beside and the value it says. */
function numbersOn(f: ReturnType<typeof build>, axis: 'x' | 'y') {
  const g = f.graph!
  const value = (text: string) => Number(text.replace('−', '-'))
  const line = (x: number) => g.vLines.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a))
  return axis === 'x'
    ? g.numbers.filter((n) => Math.abs(n.y - (g.xAxis.y + g.fs + 6)) < 0.5).map((n) => ({ at: line(n.x), value: value(n.text) }))
    : g.numbers.filter((n) => n.anchor === 'end' && Math.abs(n.x - (g.yAxis.x - 6)) < 0.5).map((n) => ({ at: n.y, value: value(n.text) }))
}

/** Units per pixel along an axis, read off its numbers the way a student would. */
function readScale(f: ReturnType<typeof build>, axis: 'x' | 'y') {
  const ns = numbersOn(f, axis)
  const [a, b] = [ns[0], ns.at(-1)!]
  return Math.abs((b.value - a.value) / (b.at - a.at))
}

const markOf = (f: ReturnType<typeof build>, kind: 'wavelength' | 'amplitude') => f.marks.find((m) => m.kind === kind)!

describe('fitting the axes', () => {
  test('counts the x-axis so the wavelength is a whole number of blocks, in about 16 blocks', () => {
    expect(fitX(8, 4)).toEqual({ step: 0.5, blocks: 16 })
    expect(fitX(6, 3)).toEqual({ step: 0.5, blocks: 12 })
    expect(fitX(1.5, 0.5)).toEqual({ step: 0.1, blocks: 15 })
    expect(fitX(40, 10)).toEqual({ step: 2.5, blocks: 16 })
    for (const [end, repeat] of [[8, 4], [3, 1.5], [0.06, 0.02], [700, 100]]) {
      const { step } = fitX(end, repeat)
      expect(Math.abs(repeat / step - Math.round(repeat / step))).toBeLessThan(1e-9)
    }
  })

  test('makes the amplitude a whole number of blocks, with room above it for the marks', () => {
    expect(fitY(3, 47)).toEqual({ step: 1, half: 5 })
    expect(fitY(3, 8)).toEqual({ step: 1, half: 4 })
    expect(fitY(0.5, 8).step).toBeCloseTo(0.1)
    expect(fitY(250, 8)).toEqual({ step: 50, half: 6 })
  })

  test('fits each axis on its own, and keeps a typed range', () => {
    const fitted = build('').ranges
    expect(build('xFit=0&xFrom=0&xTo=10&xStep=1').ranges).toEqual({ ...fitted, xFrom: '0', xTo: '10', xStep: '1' })
    expect(build('yFit=0&yFrom=-4&yTo=4&yStep=1').ranges).toEqual({ ...fitted, yFrom: '-4', yTo: '4', yStep: '1' })
  })
})

describe('measuring the wave on its axes', () => {
  const cases = [
    '',
    'amplitude=2&wavelength=6&cycles=3',
    'amplitude=0.5&wavelength=0.2&cycles=4&labelSize=large',
    'amplitude=12&wavelength=25&cycles=1.5&labelSize=small',
    'amplitude=3&wavelength=4&yFit=0&yFrom=-6&yTo=6&yStep=2&xFit=0&xFrom=0&xTo=12&xStep=1',
    'xAxis=time&period=0.5&amplitude=4&cycles=5',
    'wave=both&amplitude=1.5&wavelength=2&cycles=2.5&gridlines=0',
  ]

  test('the wavelength (or period) and amplitude read off the numbers match the settings, at every scale', () => {
    for (const q of cases) {
      const s = settingsOf(q)
      const f = buildWave(s)
      const repeat = s.xAxis === 'time' && s.wave === 'transverse' ? s.period : s.wavelength
      const xs = readScale(f, 'x')
      const ys = readScale(f, 'y')
      // Crest to crest, and the rest line (the x-axis) to a crest.
      expect((f.crests[1].x - f.crests[0].x) * xs, q).toBeCloseTo(repeat, 6)
      expect((f.graph!.xAxis.y - f.crests[0].y) * ys, q).toBeCloseTo(s.amplitude, 6)
      expect((f.troughs[0].y - f.graph!.xAxis.y) * ys, q).toBeCloseTo(s.amplitude, 6)
      // The marks measure the same.
      const w = markOf(f, 'wavelength').line
      const a = markOf(f, 'amplitude').line
      expect((w.x2 - w.x1) * xs, q).toBeCloseTo(repeat, 6)
      expect(Math.abs(a.y2 - a.y1) * ys, q).toBeCloseTo(s.amplitude, 6)
    }
  })

  test('the wave starts on the rest line at 0 and rises, its crests a quarter wavelength in', () => {
    const f = build('')
    const [start] = numbersOn(f, 'x').filter((n) => n.value === 0)
    expect(f.wave[0]).toMatch(new RegExp(`^M${f.graph!.yAxis.x},${f.graph!.xAxis.y}L`))
    expect(f.crests[0].x - (start?.at ?? f.graph!.yAxis.x)).toBeCloseTo(f.unit.x * 1, 6)
    expect(f.crests.length).toBe(2)
    expect(f.troughs.length).toBe(2)
  })

  test('the numbered x-axis says distance or time, and the mark is λ or T', () => {
    expect(build('').marks.find((m) => m.kind === 'wavelength')!.label.text).toBe('lambda')
    expect(build('xAxis=time').marks.find((m) => m.kind === 'wavelength')!.label.text).toBe('T')
    // A longitudinal wave is along distance only.
    expect(build('xAxis=time&wave=both').marks.find((m) => m.kind === 'wavelength')!.label.text).toBe('lambda')
  })

  test('hiding the axes keeps the wave the same shape, about a dashed rest line', () => {
    const on = build('cycles=3')
    const off = build('cycles=3&axes=0')
    expect(off.graph).toBeNull()
    expect(off.unit).toEqual(on.unit)
    expect(off.crests[1].x - off.crests[0].x).toBeCloseTo(on.crests[1].x - on.crests[0].x, 6)
    expect(off.rest!.y1).toBe(off.crests[0].y + 3 * on.unit.y)
    expect(on.rest).toBeNull()
  })

  test('a number where the wave crosses the axis moves beside its line, to the side the wave isn’t', () => {
    for (const q of ['', 'xAxis=time&period=0.5&cycles=4&amplitude=4', 'amplitude=0.5&wavelength=0.2&cycles=4', 'wavelength=3&cycles=3&labelSize=large']) {
      const s = settingsOf(q)
      const f = buildWave(s)
      const g = f.graph!
      const repeatPx = f.crests[1].x - f.crests[0].x
      const row = g.numbers.filter((n) => Math.abs(n.y - (g.xAxis.y + g.fs + 6)) < 0.5 && n.anchor !== 'end')
      expect(row.some((n) => n.anchor === 'start'), q).toBe(true)
      for (const n of row) {
        const width = n.text.length * g.fs * 0.6
        const left = n.anchor === 'start' ? n.x : n.x - width / 2
        // Under the axis, the wave never runs through the number's line of text.
        for (let x = left; x <= left + width; x++) {
          const depth = -s.amplitude * f.unit.y * Math.sin((2 * Math.PI * (x - g.yAxis.x)) / repeatPx)
          expect(depth > 6 && depth < g.fs + 6, `${q}: ${n.text} at ${x}`).toBe(false)
        }
        expect(left + width, q).toBeLessThanOrEqual(f.width)
      }
    }
  })

  test('gridlines give way to tick marks', () => {
    expect(build('').graph!.ticks).toEqual([])
    const f = build('gridlines=0')
    expect(f.graph!.gridlines).toBe(false)
    expect(f.graph!.ticks.length).toBe(f.graph!.vLines.length - 1 + f.graph!.hLines.length - 1)
  })
})

describe('the marks', () => {
  type Box = { x: number; y: number; w: number; h: number }
  const overlaps = (a: Box, b: Box) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
  const labelBoxes = (f: ReturnType<typeof build>) =>
    [...f.marks, ...f.notes].map((m) => ({ x: m.at.x, y: m.at.y - f.labelSize * 0.35, w: (m.label.text.length || 2) * f.labelSize * 0.45, h: f.labelSize * 0.9 }))
  const all = 'crestLabel=crest&troughLabel=trough&compressionLabel=compression&rarefactionLabel=rarefaction'

  test('put the crest and trough labels on the last of each, and the wavelength between crests clear of them', () => {
    for (const cycles of [1, 1.5, 2, 2.5, 3, 4, 6, 8]) {
      const f = build(`${all}&cycles=${cycles}`)
      const boxes = labelBoxes(f)
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j]), `${cycles} cycles`).toBe(false)
      // Every label is on the drawing, and nothing is above or below the grid.
      for (const b of boxes) {
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0)
        expect(b.y - b.h / 2).toBeGreaterThanOrEqual(f.graph!.grid.y)
        expect(b.y + b.h / 2).toBeLessThanOrEqual(f.graph!.grid.y + f.graph!.grid.h)
      }
    }
  })

  test('keep the crest label off the wavelength mark’s crests, rising over it only when there are just two', () => {
    for (const cycles of [1, 1.5, 2, 2.5, 3, 4, 6, 8]) {
      const f = build(`crestLabel=crest&troughLabel=trough&cycles=${cycles}`)
      const w = markOf(f, 'wavelength').line
      const crest = f.notes.find((n) => n.label.text === 'crest')!
      const ends = [w.x1, w.x2]
      const raised = w.y1 < crest.at.y - f.labelSize
      if (f.crests.length + f.troughs.length > 4) expect(raised, `${cycles} cycles`).toBe(false)
      if (!raised && w.y1 < f.graph!.xAxis.y) expect(ends, `${cycles} cycles`).not.toContain(crest.at.x)
      // Every extension line stops short of the label.
      for (const e of markOf(f, 'wavelength').extensions) if (e.x1 === crest.at.x) expect(Math.max(e.y1, e.y2)).toBeLessThan(crest.at.y - f.labelSize * 0.8)
    }
  })

  test('point the amplitude up from the rest line, its label away from the y-axis', () => {
    for (const q of ['', 'cycles=4&amplitudeLabel=~', 'cycles=1', 'crestLabel=crest&cycles=3']) {
      const f = build(q)
      const a = markOf(f, 'amplitude')
      expect(a.line.y2, q).toBeLessThan(a.line.y1)
      expect(a.at.x, q).toBeGreaterThan(a.line.x1)
    }
  })

  test('lower the amplitude label until it clears the wave, a blank line too', () => {
    for (const q of ['axes=0&cycles=2.5&amplitudeLabel=~', 'cycles=4&amplitudeLabel=amplitude', 'cycles=8&amplitudeLabel=~']) {
      const f = build(q)
      const a = markOf(f, 'amplitude')
      const s = settingsOf(q)
      const w = a.label.mode === 'blank' ? a.blank! : a.label.text.length * f.labelSize * 0.5
      // The wave's height (in amplitudes) at the label's far end, past the crest.
      const dx = (a.at.x + w / 2 - a.line.x1) / f.unit.x
      const waveAt = Math.cos((2 * Math.PI * dx) / s.wavelength)
      const labelTop = (f.graph?.xAxis.y ?? f.rest!.y1) - (a.at.y - (a.label.mode === 'blank' ? 0 : f.labelSize * 0.8))
      if (waveAt > 0) expect(labelTop / (s.amplitude * f.unit.y), q).toBeLessThan(waveAt)
    }
  })

  test('leave the wavelength off with less than a whole cycle drawn', () => {
    expect(build('cycles=0.5').marks.map((m) => m.kind)).toEqual(['amplitude'])
    expect(build('cycles=1').marks.map((m) => m.kind)).toEqual(['wavelength', 'amplitude'])
  })
})

describe('the longitudinal wave', () => {
  const gaps = (xs: number[]) => xs.slice(1).map((x, i) => ({ at: (x + xs[i]) / 2, gap: x - xs[i] }))

  test('bunches its lines at the compressions and spreads them at the rarefactions', () => {
    const xs = lineXs(4, 8, 14)
    const mean = 8 / 28
    for (const c of [1, 5]) {
      const near = gaps(xs).filter((g) => Math.abs(g.at - c) < 0.25)
      for (const g of near) expect(g.gap).toBeLessThan(mean * 0.6)
    }
    for (const r of [3, 7]) {
      const near = gaps(xs).filter((g) => Math.abs(g.at - r) < 0.25)
      for (const g of near) expect(g.gap).toBeGreaterThan(mean * 1.4)
    }
  })

  test('above a transverse wave, has its compressions over the crests and its rarefactions over the troughs', () => {
    for (const q of ['wave=both', 'wave=both&cycles=3.5&wavelength=2', 'wave=both&axes=0&cycles=1.5', 'wave=both&labelSize=large&amplitude=7']) {
      const f = build(q)
      expect(f.compressions, q).toEqual(f.crests.map((c) => c.x))
      expect(f.rarefactions, q).toEqual(f.troughs.map((t) => t.x))
      const xs = f.band.map((l) => l.x1)
      const g = gaps(xs)
      const closest = (x: number) => g.reduce((a, b) => (Math.abs(b.at - x) < Math.abs(a.at - x) ? b : a))
      const mean = g.reduce((sum, b) => sum + b.gap, 0) / g.length
      for (const c of f.compressions) expect(closest(c).gap, q).toBeLessThan(mean * 0.6)
      for (const r of f.rarefactions) expect(closest(r).gap, q).toBeGreaterThan(mean * 1.4)
      // The densest pair of lines in each wavelength straddles a crest.
      const densest = g.reduce((a, b) => (b.gap < a.gap ? b : a))
      expect(Math.min(...f.crests.map((c) => Math.abs(c.x - densest.at))), q).toBeLessThan(densest.gap)
      // Above the graph, clear of it.
      expect(Math.max(...f.band.map((l) => l.y2)), q).toBeLessThan(Math.min(...f.crests.map((c) => c.y)) - 20)
    }
  })

  test('on its own, has only an x-axis, with tick marks, and its wavelength from compression to compression', () => {
    const f = build('wave=longitudinal&compressionLabel=C&rarefactionLabel=R')
    expect(f.graph!.yDrawn).toBe(false)
    expect(f.graph!.gridlines).toBe(false)
    expect(f.graph!.ticks.length).toBe(f.graph!.vLines.length)
    expect(f.wave).toEqual([])
    const w = markOf(f, 'wavelength').line
    expect([w.x1, w.x2]).toEqual(f.compressions.slice(0, 2))
    expect((w.x2 - w.x1) * readScale(f, 'x')).toBeCloseTo(4, 6)
    // Everything sits above the x-axis.
    for (const n of f.notes) expect(n.at.y).toBeLessThan(f.graph!.xAxis.y)
    for (const l of f.band) expect(l.y2).toBeLessThan(f.graph!.xAxis.y)
  })
})

describe('the settings', () => {
  test('round-trip through the page address, labels and all', () => {
    const s = settingsOf('wave=both&cycles=2.5&wavelengthLabel=~&crestLabel=crest&amplitudeLabel=&title=Sound&titleMode=text')
    expect(s.wavelengthLabel).toEqual({ mode: 'blank', text: 'lambda' })
    expect(s.amplitudeLabel).toEqual({ mode: 'none', text: 'A' })
    expect(s.crestLabel).toEqual({ mode: 'text', text: 'crest' })
    expect(waveSettings.keyOf(settingsOf(waveSettings.toQuery(s)))).toBe(waveSettings.keyOf(s))
  })

  test('draw whole and half cycles', () => {
    expect(settingsOf('cycles=2.3').cycles).toBe(2.5)
    expect(settingsOf('cycles=0.1').cycles).toBe(0.5)
  })

  test('give an answer key in the axes’ units', () => {
    expect(answerLines(settingsOf(''))).toEqual(['Amplitude: 3 cm', 'Wavelength: 4 m'])
    expect(answerLines(settingsOf('xAxis=time&xTitle=Time (s)&period=0.25'))).toEqual(['Amplitude: 3 cm', 'Period: 0.25 s', 'Frequency: 4 Hz'])
    expect(answerLines(settingsOf('wave=longitudinal&xTitle=Distance (cm)&wavelength=3'))).toEqual(['Wavelength: 3 cm'])
    expect(answerLines(settingsOf('yTitleMode=blank&xTitleMode=none'))).toEqual(['Amplitude: 3', 'Wavelength: 4'])
  })
})
