// Gas Syringe's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { MAGNIFIER_VIEWS } from '$lib/shared/magnify'
import { choice, defineSettings, number } from '$lib/shared/settings'
import { formatReading, roundReading } from '../volume-reading/scale'
import { SETUPS, SYRINGE_SIZES, UNIT_SYMBOLS, VOLUME_UNITS, syringeScale } from './syringe'

export const syringeSettings = defineSettings(
  {
    size: choice(SYRINGE_SIZES, '100'),
    unit: choice(VOLUME_UNITS, 'cm3'),
    reading: number({ min: 0, max: 100, fallback: 43.6 }),
    setup: choice(SETUPS, 'setup'),
    view: choice(MAGNIFIER_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 2 }),
    ...figureTextFields(),
  },
  (s) => ({ ...s, reading: roundReading(syringeScale(s.size), s.reading), span: Math.round(s.span) }),
)

export type SyringeSettings = typeof syringeSettings.defaults

/** The reading with its unit, e.g. "43.6 cm³". */
export const readingText = (s: SyringeSettings) => `${formatReading(syringeScale(s.size), s.reading)} ${UNIT_SYMBOLS[s.unit]}`

/** The answer key line, e.g. "Volume of gas: 43.6 cm³". */
export const answerLine = (s: SyringeSettings) => `Volume of gas: ${readingText(s)}`
