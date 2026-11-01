// Line Spectrum's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { choice, defineSettings, json, number, text } from '$lib/shared/settings'
import { VISIBLE_FROM, VISIBLE_TO } from './color'
import { tidyStrips, type Strip } from './strips'

/** Colored lines on black, dark lines across a rainbow, or black lines on
 *  white for a black-and-white copier (CONTEXT.md "Style"). */
export const STYLES = ['emission', 'absorption', 'print'] as const
export type Style = (typeof STYLES)[number]

/** Every line equally bright, or as bright as NIST says relative to the element's strongest. */
export const STRENGTHS = ['uniform', 'relative'] as const

/** What's written left of each element strip. */
export const LABELS = ['names', 'symbols', 'blank', 'none'] as const
export type Labels = (typeof LABELS)[number]

/** Where the wavelength axis goes: once under the last strip, under every strip, or nowhere. */
export const AXES = ['bottom', 'each', 'none'] as const

/** The nm between tick marks, and between numbers. */
export const TICKS = ['none', '5', '10', '20', '25', '50'] as const
export const NUMBERS = ['10', '20', '25', '50', '100'] as const

/** The narrowest range the axis can show, in nm. */
export const MIN_RANGE = 20

const DEFAULT_STRIPS: Strip[] = [
  { type: 'element', id: 1, element: 'H' },
  { type: 'element', id: 2, element: 'He' },
  { type: 'element', id: 3, element: 'Na' },
  { type: 'mixture', id: 4, name: 'Unknown', of: [1, 3] },
]

const nm = (fallback: number) => number({ min: VISIBLE_FROM, max: VISIBLE_TO, fallback })

export const spectrumSettings = defineSettings(
  {
    strips: json(DEFAULT_STRIPS, tidyStrips),
    style: choice(STYLES, 'emission'),
    strength: choice(STRENGTHS, 'uniform'),
    labels: choice(LABELS, 'names'),
    from: nm(400),
    to: nm(700),
    ticks: choice(TICKS, '10'),
    numbers: choice(NUMBERS, '50'),
    axis: choice(AXES, 'bottom'),
    axisTitleMode: choice(['text', 'none'] as const, 'text'),
    axisTitle: text('Wavelength (nm)', 60),
    ...figureTextFields(),
  },
  (s) => {
    // At least MIN_RANGE nm, shortest wavelength on the left.
    let [from, to] = [Math.min(s.from, s.to), Math.max(s.from, s.to)]
    if (to - from < MIN_RANGE) {
      to = Math.min(VISIBLE_TO, from + MIN_RANGE)
      from = to - MIN_RANGE
    }
    return { ...s, from, to }
  },
)

export type SpectrumSettings = typeof spectrumSettings.defaults
