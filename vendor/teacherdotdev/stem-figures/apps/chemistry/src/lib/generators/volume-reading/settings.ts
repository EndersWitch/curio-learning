// Volume Reading's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { MAGNIFIER_VIEWS } from '$lib/shared/magnify'
import { bool, choice, defineSettings, number } from '$lib/shared/settings'
import { LIQUID_TINTS } from './liquid'
import {
  BEAKER_SIZES, CYLINDER_SIZES, INSTRUMENTS, MARK_SPACINGS, NUMBER_SPACINGS, UNIT_SYMBOLS, VOLUME_UNITS, fitScale, formatReading,
  roundReading, volumeScale,
} from './scale'

export const volumeSettings = defineSettings(
  {
    instrument: choice(INSTRUMENTS, 'cylinder'),
    size: choice(CYLINDER_SIZES, '100'),
    beaker: choice(BEAKER_SIZES, 'medium'),
    marks: choice(MARK_SPACINGS, 'standard'),
    numbers: choice(NUMBER_SPACINGS, 'standard'),
    unit: choice(VOLUME_UNITS, 'mL'),
    reading: number({ min: 0, max: 1000, fallback: 43.6 }),
    /** a dotted line from the bottom of the meniscus across to the scale */
    guide: bool(false),
    view: choice(MAGNIFIER_VIEWS, 'both'),
    // A beaker's coarse marks read fine without a magnifier, so it has its
    // own setting, off unless the teacher turns it on.
    beakerView: choice(MAGNIFIER_VIEWS, 'whole'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    tint: choice(LIQUID_TINTS, 'gray'),
    ...figureTextFields(),
  },
  (settings) => {
    const s = { ...settings, ...fitScale(settings) }
    return { ...s, reading: roundReading(volumeScale(s), s.reading), span: Math.round(s.span) }
  },
)

export type VolumeSettings = typeof volumeSettings.defaults

/** The magnifier view for the chosen instrument. */
export const magnifierView = (s: VolumeSettings) => (s.instrument === 'beaker' ? s.beakerView : s.view)

/** The reading with its unit, e.g. "23.47 mL" or "43.6 cm³". */
export const readingText = (s: VolumeSettings) => `${formatReading(volumeScale(s), s.reading)} ${UNIT_SYMBOLS[s.unit]}`

/** The answer key line, e.g. "Reading: 23.47 mL". */
export const answerLine = (s: VolumeSettings) => `Reading: ${readingText(s)}`
