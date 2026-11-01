// pH Reading's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { MAGNIFIER_VIEWS } from '$lib/shared/magnify'
import { choice, defineSettings, number } from '$lib/shared/settings'
import { PH_INSTRUMENTS, PH_MAX, PH_MIN, phRules } from './readings'

export const phSettings = defineSettings(
  {
    instrument: choice(PH_INSTRUMENTS, 'digital'),
    decimals: number({ min: 1, max: 2, fallback: 2 }),
    reading: number({ min: PH_MIN, max: PH_MAX, fallback: 4.62 }),
    view: choice(MAGNIFIER_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    ...figureTextFields(),
  },
  (s) => {
    const fixed = { ...s, decimals: Math.round(s.decimals), span: Math.round(s.span) }
    return { ...fixed, reading: phRules(fixed).round(s.reading) }
  },
)

export type PhSettings = typeof phSettings.defaults

export const readingText = (s: PhSettings) => s.reading.toFixed(phRules(s).decimals)

/** The answer key line, e.g. "pH: 4.62". */
export const answerLine = (s: PhSettings) => `pH: ${readingText(s)}`
