// Every choice the teacher makes on the Wave Generator, with its default: a
// transverse wave two cycles long on numbered axes, its wavelength and
// amplitude marked. The grid and axes are $shared/graph's, the same settings
// as Biology's Predator–Prey Cycles; the labels on the wave are Physics' own.

import { gridFields } from '$shared/graph/axes'
import { bool, choice, defineSettings, number, type Field } from '$shared/settings'
import { cleanLabel, decodeLabel, encodeLabel, type Label } from '$lib/shared/label'

/** A transverse wave, a longitudinal one, or the longitudinal one drawn above its matching transverse one. */
export const WAVES = ['transverse', 'longitudinal', 'both'] as const
/** What a transverse wave is drawn against: distance shows its wavelength, time its period. */
export const X_AXES = ['distance', 'time'] as const

export type Wave = (typeof WAVES)[number]
export type XAxis = (typeof X_AXES)[number]

/** A label on the wave ($lib/shared/label): written text, a blank line, or none. */
function label(fallback: Label): Field<Label> {
  return {
    fallback,
    accept: (v) => (v && typeof v === 'object' ? cleanLabel(v, fallback) : undefined),
    parse: (text) => decodeLabel(text, fallback),
    format: encodeLabel,
  }
}

const quantity = (fallback: number) => number({ min: 0.001, max: 100_000, fallback })

/** The axis titles this page writes for each x-axis, kept up to date until the teacher types their own. */
export const X_TITLES: Record<XAxis, string> = { distance: 'Distance (m)', time: 'Time (s)' }

export const waveSettings = defineSettings(
  {
    wave: choice(WAVES, 'transverse'),
    xAxis: choice(X_AXES, 'distance'),
    /** in the y-axis's units */
    amplitude: quantity(3),
    /** in the x-axis's units: the wavelength along distance, the period along time */
    wavelength: quantity(4),
    period: quantity(2),
    /** how many cycles are drawn, from the y-axis, in halves */
    cycles: number({ min: 0.5, max: 8, fallback: 2 }),
    // Marks on the wave. The wavelength mark is the period's along time.
    wavelengthMark: bool(true),
    wavelengthLabel: label({ mode: 'text', text: 'lambda' }),
    periodLabel: label({ mode: 'text', text: 'T' }),
    amplitudeMark: bool(true),
    amplitudeLabel: label({ mode: 'text', text: 'A' }),
    crestLabel: label({ mode: 'none', text: 'crest' }),
    troughLabel: label({ mode: 'none', text: 'trough' }),
    compressionLabel: label({ mode: 'none', text: 'compression' }),
    rarefactionLabel: label({ mode: 'none', text: 'rarefaction' }),
    /** numbered axes to measure on; without them, a plain wave about a dashed rest line */
    axes: bool(true),
    gridlines: bool(true),
    /** fit the x-axis to the cycles drawn, rather than use the range typed */
    xFit: bool(true),
    /** fit the y-axis to the amplitude and the marks, rather than use the range typed */
    yFit: bool(true),
    color: bool(false),
    ...gridFields({
      xFrom: '0', xTo: '8', xStep: '0.5', xEvery: 2,
      yFrom: '-5', yTo: '5', yStep: '1', yEvery: 1,
      title: '', titleMode: 'none',
      xTitle: X_TITLES.distance, xTitleMode: 'text',
      yTitle: 'Displacement (cm)', yTitleMode: 'text',
      xLabel: 'x', xLabelMode: 'none', yLabel: 'y', yLabelMode: 'none',
      xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none',
      minor: 0,
    }),
  },
  (s) => ({ ...s, cycles: Math.round(s.cycles * 2) / 2 }),
)

export type WaveSettings = typeof waveSettings.defaults

/** Is a transverse wave drawn, a longitudinal one, and what is the transverse one drawn against? A longitudinal wave is along distance only. */
export function partsOf(s: Pick<WaveSettings, 'wave' | 'xAxis'>) {
  const transverse = s.wave !== 'longitudinal'
  const longitudinal = s.wave !== 'transverse'
  return { transverse, longitudinal, time: s.wave === 'transverse' && s.xAxis === 'time' }
}

/** How far the wave takes to repeat, in the x-axis's units: its period along time, else its wavelength. */
export const repeatOf = (s: WaveSettings) => (partsOf(s).time ? s.period : s.wavelength)

/** The unit in an axis title's last brackets: "cm" from "Displacement (cm)". */
export function unitOf(title: string, mode: string) {
  if (mode !== 'text') return ''
  return /\(([^()]+)\)\s*$/.exec(title)?.[1].trim() ?? ''
}

const withUnit = (v: number, unit: string) => `${Number(v.toPrecision(12))}${unit ? ` ${unit}` : ''}`
const FREQUENCY_UNITS: Record<string, string> = { s: 'Hz', ms: 'kHz' }

/** The answer key: the amplitude, and the wavelength, or the period and frequency, in the axes' units. */
export function answerLines(s: WaveSettings): string[] {
  const { transverse, time } = partsOf(s)
  const x = unitOf(s.xTitle, s.xTitleMode)
  const lines = transverse ? [`Amplitude: ${withUnit(s.amplitude, unitOf(s.yTitle, s.yTitleMode))}`] : []
  if (!time) return [...lines, `Wavelength: ${withUnit(s.wavelength, x)}`]
  const f = Number((1 / s.period).toPrecision(3))
  const fUnit = FREQUENCY_UNITS[x] ?? (x ? `per ${x}` : '')
  return [...lines, `Period: ${withUnit(s.period, x)}`, `Frequency: ${withUnit(f, fUnit)}`]
}
