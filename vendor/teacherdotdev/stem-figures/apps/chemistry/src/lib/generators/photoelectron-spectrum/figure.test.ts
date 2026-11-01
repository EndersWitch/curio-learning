import { describe, expect, it } from 'vitest'
import { buildSpectrum, energyAxis, peakGroups } from './figure'
import { answerLines, pesSettings, type PesSettings } from './settings'
import { peaksOf } from './spectrum'

const build = (changes: Partial<PesSettings> = {}) => buildSpectrum(pesSettings.tidy({ ...pesSettings.defaults, ...changes }))

describe('the energy axis', () => {
  it('runs high on the left to low on the right', () => {
    for (const scale of ['log', 'broken', 'linear'] as const) {
      const xs = build({ z: 21, scale }).peaks.map((p) => p.x)
      expect(xs, scale).toEqual([...xs].sort((a, b) => a - b))
    }
  })

  it('is numbered in powers of ten on a log scale', () => {
    expect(build().xNumbers.map((n) => n.text)).toEqual(['1,000', '100', '10', '1', '0.1'])
    expect(build({ unit: 'eV' }).xNumbers.map((n) => n.text)).toEqual(['10,000', '1,000', '100', '10', '1'])
  })

  it('breaks between groups of peaks, keeping 2s and 2p together', () => {
    expect(peakGroups([84, 4.68, 2.08]).map((g) => g.count)).toEqual([1, 2])
    expect(peakGroups([104, 6.84, 3.67, 0.5]).map((g) => g.count)).toEqual([1, 2, 1])
    const g = build({ scale: 'broken' })
    expect(g.xAxis).toHaveLength(3)
    expect(g.breaks).toHaveLength(4)
  })

  it('numbers each stretch of a broken axis inside it', () => {
    const axis = energyAxis('broken', [104, 6.84, 3.67, 0.5])
    for (const st of axis.stretches) expect(axis.numbers.filter((n) => n.x > st.x0 && n.x < st.x1).length).toBeGreaterThan(0)
  })

  it('puts each peak in its own stretch of a broken axis, which never overlap', () => {
    // Iodine's 5s (1.99 MJ/mol) once fell inside the 4s–4d stretch's padding.
    for (const zs of [[53], [3, 37], [5, 49], [2, 26]]) {
      const es = zs.flatMap((z) => peaksOf(z, 'MJ/mol').map((p) => p.energy))
      const axis = energyAxis('broken', es)
      const groups = peakGroups(es)
      for (const e of es)
        expect(axis.stretches.findIndex((s) => e <= s.top && e >= s.bottom), `${zs} ${e}`).toBe(groups.findIndex((g) => e <= g.high && e >= g.low))
      for (let i = 1; i < axis.stretches.length; i++) expect(axis.stretches[i].top).toBeLessThan(axis.stretches[i - 1].bottom)
    }
  })

  it('starts at 0 on a linear scale', () => {
    expect(build({ scale: 'linear' }).xNumbers.at(-1)?.text).toBe('0')
  })
})

describe('a photoelectron spectrum figure', () => {
  it('draws each peak as tall as its electrons', () => {
    const [s1, , p2] = build({ z: 10 }).peaks
    expect((280 - p2.top) / (280 - s1.top)).toBeCloseTo(3, 6)
  })

  it('labels peaks with their sublevels, counts and energies', () => {
    const g = build({ z: 10, counts: true, energies: true })
    expect(g.labels.map((l) => l.lines)).toEqual([
      [{ text: '1s²' }, { text: '84.0' }],
      [{ text: '2s²' }, { text: '4.68' }],
      [{ text: '2p⁶' }, { text: '2.08' }],
    ])
    expect(build({ sublevels: 'blank' }).labels[0].lines).toEqual([{ blank: 30 }])
    expect(build({ sublevels: 'none' }).labels).toEqual([])
  })

  it('raises a label rather than overlap its neighbor’s', () => {
    const g = build({ z: 26, energies: true })
    const box = (l: (typeof g.labels)[number]) => ({ x0: l.x - l.w / 2, x1: l.x + l.w / 2, y0: l.y - l.lines.length * g.lineH, y1: l.y })
    g.labels.forEach((a, i) =>
      g.labels.slice(i + 1).forEach((b) => {
        const [p, q] = [box(a), box(b)]
        const overlap = p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1
        expect(overlap).toBe(false)
      }),
    )
  })

  it('draws a second element dashed behind, named in the key or called A and B', () => {
    const g = build({ z: 11, compare: 12 })
    expect(g.compared).toHaveLength(4)
    expect(g.key.map((k) => [k.name, k.dashed])).toEqual([['Na', false], ['Mg', true]])
    expect(build({ z: 11, compare: 12, names: false }).key.map((k) => k.name)).toEqual(['Element A', 'Element B'])
    expect(build({ names: false }).key).toEqual([])
  })

  it('shifts the heavier element’s peaks left, to higher energy', () => {
    const g = build({ z: 11, compare: 12 })
    g.peaks.forEach((p, i) => expect(g.compared[i].x).toBeLessThan(p.x))
  })
})

describe('the answer key', () => {
  it('names the element and its configuration', () => {
    expect(answerLines(pesSettings.defaults)).toEqual(['Sodium (Na): 1s² 2s² 2p⁶ 3s¹'])
    expect(answerLines(pesSettings.tidy({ ...pesSettings.defaults, compare: 12, names: false }))).toEqual([
      'A: Sodium (Na): 1s² 2s² 2p⁶ 3s¹',
      'B: Magnesium (Mg): 1s² 2s² 2p⁶ 3s²',
    ])
  })
})

describe('Photoelectron Spectrum settings', () => {
  it('travel through the page address', () => {
    const s = pesSettings.tidy({ ...pesSettings.defaults, z: 26, compare: 27, scale: 'broken', unit: 'eV', counts: true })
    expect(pesSettings.fromParams(new URLSearchParams(pesSettings.toQuery(s)))).toEqual(s)
  })

  it('never compare an element with itself', () => {
    expect(pesSettings.tidy({ ...pesSettings.defaults, z: 11, compare: 11 }).compare).toBe(0)
  })
})
