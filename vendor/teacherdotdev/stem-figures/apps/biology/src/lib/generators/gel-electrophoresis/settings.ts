// Gel Electrophoresis' settings, as they appear in the page address.

import { figureTextFields } from '$shared/figureText'
import { bool, choice, defineSettings, type Field } from '$shared/settings'
import { tidyLanes, type Lane } from './lanes'
import { GELS } from './migration'
import { SCENARIOS } from './scenarios'

/** A white gel with dark bands for photocopying, a pale gel with blue bands
 *  as a classroom stain leaves them, or glowing bands on a dark gel, as
 *  under UV light, for slides. */
export const LOOKS = ['print', 'blue', 'glow'] as const
export type Look = (typeof LOOKS)[number]

/** Each lane's name over its well, a blank line for students, or nothing. */
export const LANE_LABELS = ['text', 'blank', 'none'] as const

/** The ladder's sizes beside its bands, blank lines for students, or nothing. */
export const SIZE_LABELS = ['sizes', 'blank', 'none'] as const
export const SIZE_UNITS = ['bp', 'kb'] as const

/** The − and + electrodes at the gel's ends: their signs, their signs and
 *  names, empty circles for students to mark, or left off. */
export const ELECTRODES = ['signs', 'labeled', 'blank', 'none'] as const

/** A field holding JSON in the address, read back through `tidy`. */
function json<T>(fallback: T, tidy: (v: unknown) => T | undefined): Field<T> {
  return {
    fallback,
    accept: tidy,
    parse: (text) => {
      try {
        return tidy(JSON.parse(text))
      } catch {
        return undefined
      }
    },
    format: (v) => JSON.stringify(v),
  }
}

const START = SCENARIOS[0]

// The lanes are copied whenever settings are read, so editing them never
// changes the defaults or a scenario they came from.
export const gelSettings = defineSettings({
  lanes: json<Lane[]>(START.lanes, tidyLanes),
  gel: choice(GELS, START.gel),
  look: choice(LOOKS, 'print'),
  laneLabels: choice(LANE_LABELS, 'text'),
  laneNumbers: bool(false),
  sizeLabels: choice(SIZE_LABELS, 'sizes'),
  sizeUnits: choice(SIZE_UNITS, 'bp'),
  electrodes: choice(ELECTRODES, 'signs'),
  ruler: bool(false),
  ...figureTextFields(),
}, (s) => ({ ...s, lanes: s.lanes.map((lane) => ({ ...lane })) }))

export type GelSettings = typeof gelSettings.defaults
