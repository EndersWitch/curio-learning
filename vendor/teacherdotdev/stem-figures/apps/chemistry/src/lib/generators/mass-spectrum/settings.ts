// Mass Spectrum's settings, as they appear in the page address: an element
// or isotopes typed in, how abundance is scaled, what's written on the
// figure and what's left for the student. The grid and axes are
// $shared/graph's, as Titration Curve's are.

import { gridFields } from '$shared/graph/axes'
import { bool, choice, defineSettings, number, text, type Field } from '$lib/shared/settings'
import { SYMBOLS, abundanceText, elementOf, elementPeaks, heightsOf, massText, relativeAtomicMass, typedPeaks, type Peak, type Typed } from './spectrum'

/** Where the peaks come from: an element's natural isotopes, or isotopes the teacher types. */
export const SOURCES = ['element', 'custom'] as const
export type Source = (typeof SOURCES)[number]
export const SOURCE_NAMES: Record<Source, string> = { element: 'Element', custom: 'Custom isotopes' }

/** How tall a peak is: its % abundance, or its abundance against the tallest peak's 100. */
export const SCALES = ['percent', 'relative'] as const
export type Scale = (typeof SCALES)[number]
export const SCALE_NAMES: Record<Scale, string> = { percent: 'Percent', relative: 'Relative to the tallest' }
export const Y_TITLES: Record<Scale, string> = { percent: 'Abundance (%)', relative: 'Relative abundance' }

export const MAX_ISOTOPES = 6
export const MAX_MASS = 300

/** Isotopes typed in, written in the address as mass-percent pairs joined
 *  by underscores: "10-20_11-80". There are always 1 to 6. */
function isotopes(fallback: Typed[]): Field<Typed[]> {
  const ok = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
  const accept = (v: unknown) =>
    Array.isArray(v) && v.length >= 1 && v.length <= MAX_ISOTOPES && v.every((i) => i && ok(i.mass, MAX_MASS) && i.mass >= 1 && ok(i.pct, 100))
      ? v.map((i) => ({ mass: i.mass, pct: i.pct }))
      : undefined
  const number = '\\d+(\\.\\d+)?'
  const pair = new RegExp(`^${number}-${number}$`)
  return {
    fallback,
    accept,
    parse: (text) => {
      const pairs = text.split('_')
      if (!pairs.every((p) => pair.test(p))) return undefined
      return accept(pairs.map((p) => ({ mass: Number(p.split('-')[0]), pct: Number(p.split('-')[1]) })))
    },
    format: (v) => v.map((i) => `${i.mass}-${i.pct}`).join('_'),
  }
}

export const DEFAULT_ELEMENT = 'Mg'

export const massSpectrumSettings = defineSettings(
  {
    source: choice(SOURCES, 'element'),
    element: choice(SYMBOLS, DEFAULT_ELEMENT),
    isotopes: isotopes([{ mass: 10, pct: 20 }, { mass: 11, pct: 80 }]),
    name: text('Element X', 40),
    scale: choice(SCALES, 'percent'),
    abundances: bool(true),
    names: bool(true),
    /** the m/z of a peak left out for students to draw, or 0 for none */
    leaveOut: number({ min: 0, max: MAX_MASS, fallback: 0 }),
    answerKey: bool(false),
    /** fit the x-axis to the peaks, rather than use the range typed */
    xFit: bool(true),
    ...gridFields({
      xFrom: '22', xTo: '28', xStep: '0.5', xEvery: 2,
      yFrom: '0', yTo: '100', yStep: '10', yEvery: 1,
      title: '', titleMode: 'none',
      xTitle: 'Mass-to-charge ratio (m/z)', xTitleMode: 'text',
      yTitle: Y_TITLES.percent, yTitleMode: 'text',
      xLabel: 'x', xLabelMode: 'none', yLabel: 'y', yLabelMode: 'none',
      xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none',
      minor: 0,
    }),
  },
  (s) => {
    // Only a peak that's there can be left out.
    const leaveOut = peaksOf(s).some((p) => p.mz === s.leaveOut) ? s.leaveOut : 0
    // The y-axis title names the heights, unless the teacher typed their own.
    const yTitle = Object.values(Y_TITLES).includes(s.yTitle) ? Y_TITLES[s.scale] : s.yTitle
    return { ...s, leaveOut, yTitle }
  },
)

export type MassSpectrumSettings = typeof massSpectrumSettings.defaults

/** Every peak, the one left out included, lightest first. */
export function peaksOf(s: { source: Source; element: string; isotopes: Typed[] }): Peak[] {
  return s.source === 'element' ? elementPeaks(s.element) : typedPeaks(s.isotopes)
}

/** What the figure calls the element: its name, or the name typed for custom isotopes. */
export const nameOf = (s: MassSpectrumSettings) => (s.source === 'element' ? elementOf(s.element).name : s.name.trim() || 'Element X')

/** Masses typed that land on the same whole number, so their peaks would overlap. */
export function sharedMz(s: MassSpectrumSettings): number[] {
  if (s.source !== 'custom') return []
  const mzs = typedPeaks(s.isotopes).map((p) => p.mz)
  return [...new Set(mzs.filter((mz, i) => mzs.indexOf(mz) !== i))]
}

/** The abundances typed, added up, when they don't make 100%. */
export function typedTotal(s: MassSpectrumSettings): number | null {
  if (s.source !== 'custom') return null
  const total = s.isotopes.reduce((sum, i) => sum + i.pct, 0)
  return Math.abs(total - 100) > 0.05 ? Math.round(total * 100) / 100 : null
}

/** A peak's abundance as written over it: a percent, or against the tallest. */
export function peakTexts(s: MassSpectrumSettings): string[] {
  const peaks = peaksOf(s)
  if (s.scale === 'relative') return heightsOf(peaks, 'relative').map(abundanceText)
  return peaks.map((p) => `${s.source === 'custom' ? String(p.pct) : abundanceText(p.pct)}%`)
}

/** "24.31", or null when there are no abundances to average. */
export function atomicMassText(s: MassSpectrumSettings): string | null {
  const m = relativeAtomicMass(peaksOf(s))
  return m === null ? null : m.toFixed(2)
}

/** The answer key's lines: the element and its relative atomic mass, and
 *  the peak left out, if one is. */
export function answerLines(s: MassSpectrumSettings): string[] {
  const m = atomicMassText(s)
  const who = s.source === 'element' ? `${elementOf(s.element).name} (${s.element})` : nameOf(s)
  const out = [`${who}: relative atomic mass ${m ?? 'not known'}`]
  const peaks = peaksOf(s)
  const left = peaks.findIndex((p) => p.mz === s.leaveOut)
  if (left >= 0) out.push(`Missing peak: m/z ${peaks[left].mz}, ${peakTexts(s)[left]}`)
  return out
}

/** The weighted average written out, with each isotope's exact mass:
 *  "(23.985 × 78.99 + 24.986 × 10 + 25.983 × 11.01) ÷ 100 = 24.31". */
export function workingLine(s: MassSpectrumSettings): string | null {
  const m = atomicMassText(s)
  if (m === null) return null
  const peaks = peaksOf(s)
  const total = Math.round(peaks.reduce((sum, p) => sum + p.pct, 0) * 1e6) / 1e6
  return `(${peaks.map((p) => `${massText(p.mass)} × ${p.pct}`).join(' + ')}) ÷ ${total} = ${m}`
}

/** What the figure shows, for screen readers: never the element when it's
 *  hidden, nor the peak left out. */
export function figureLabel(s: MassSpectrumSettings): string {
  const texts = peakTexts(s)
  const shown = peaksOf(s)
    .map((p, i) => ({ p, text: texts[i] }))
    .filter(({ p }) => p.mz !== s.leaveOut)
  const list = shown.map(({ p, text }) => `${p.mz}${s.abundances ? ` (${text})` : ''}`)
  const peaks = list.length === 1 ? `a peak at m/z ${list[0]}` : `peaks at m/z ${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
  const who = !s.names ? 'an unnamed element' : s.source === 'element' ? nameOf(s).toLowerCase() : nameOf(s)
  const missing = s.leaveOut ? ', with one peak left out' : ''
  return `A mass spectrum of ${who}: ${peaks}${missing}.`
}
