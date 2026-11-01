// Photoelectron Spectrum's settings, as they appear in the page address: the
// element (and one to compare it with), the energy axis, how peaks are drawn
// and labeled, and what's left for the student.

import { LABEL_SIZES, type LabelSize } from '$shared/labelSize'
import { figureTextFields } from '$lib/shared/figureText'
import { bool, choice, defineSettings, number } from '$lib/shared/settings'
import { writtenConfiguration, atomConfiguration } from '../orbital-diagram/configuration'
import { element } from '../orbital-diagram/elements'
import { MAX_PES_Z } from './energies'
import { UNITS, energyText, peaksOf } from './spectrum'

/** How the energy axis is spaced: in powers of ten, broken into a stretch
 *  for each group of peaks, or evenly from 0. */
export const SCALES = ['log', 'broken', 'linear'] as const
export type Scale = (typeof SCALES)[number]
export const SCALE_NAMES: Record<Scale, string> = { log: 'Logarithmic', broken: 'Broken', linear: 'Linear' }

export const PEAK_STYLES = ['peaks', 'bars'] as const
export type PeakStyle = (typeof PEAK_STYLES)[number]
export const PEAK_NAMES: Record<PeakStyle, string> = { peaks: 'Peaks', bars: 'Bars' }

/** Text on the figure: written out, a blank line for students, or none. */
export const TEXT_MODES = ['text', 'blank', 'none'] as const
export type TextMode = (typeof TEXT_MODES)[number]

export const pesSettings = defineSettings(
  {
    z: number({ min: 1, max: MAX_PES_Z, fallback: 11 }),
    /** a second element drawn dashed behind the first, or 0 for none */
    compare: number({ min: 0, max: MAX_PES_Z, fallback: 0 }),
    unit: choice(UNITS, 'MJ/mol'),
    scale: choice(SCALES, 'log'),
    peaks: choice(PEAK_STYLES, 'peaks'),
    sublevels: choice(TEXT_MODES, 'text'),
    counts: bool(false),
    energies: bool(false),
    yNumbers: bool(true),
    gridlines: bool(true),
    names: bool(true),
    labelSize: choice(Object.keys(LABEL_SIZES) as LabelSize[], 'medium'),
    ...figureTextFields(),
  },
  (s) => {
    const z = Math.round(s.z)
    const compare = Math.round(s.compare)
    return { ...s, z, compare: compare === z ? 0 : compare }
  },
)

export type PesSettings = typeof pesSettings.defaults

/** "Na" */
export const symbolOf = (z: number) => element(z).symbol

/** What the key calls each element: its symbol, or A and B when names are hidden. */
export function keyNames(s: PesSettings): string[] {
  const zs = s.compare ? [s.z, s.compare] : [s.z]
  return zs.map((z, i) => (s.names ? symbolOf(z) : `Element ${'AB'[i]}`))
}

/** The answer key's lines: each element and its configuration, e.g.
 *  "Na: 1s² 2s² 2p⁶ 3s¹", after the key's letter when names are hidden. */
export function answerLines(s: PesSettings): string[] {
  const zs = s.compare ? [s.z, s.compare] : [s.z]
  return zs.map((z, i) => {
    const line = `${element(z).name} (${symbolOf(z)}): ${writtenConfiguration(atomConfiguration(z))}`
    return !s.names && s.compare ? `${'AB'[i]}: ${line}` : line
  })
}

/** What the figure shows, for screen readers. */
export function figureLabel(s: PesSettings): string {
  const describe = (z: number) =>
    peaksOf(z, s.unit)
      .map((p) => `${p.sublevel}, ${p.electrons} electron${p.electrons === 1 ? '' : 's'}, at ${energyText(p.energy)} ${s.unit}`)
      .join('; ')
  const who = (z: number, i: number) => (s.names ? element(z).name.toLowerCase() : s.compare ? `element ${'AB'[i]}` : 'an unnamed element')
  const main = `A photoelectron spectrum of ${who(s.z, 0)}: ${describe(s.z)}.`
  return s.compare ? `${main} Dashed behind it, ${who(s.compare, 1)}: ${describe(s.compare)}.` : main
}
