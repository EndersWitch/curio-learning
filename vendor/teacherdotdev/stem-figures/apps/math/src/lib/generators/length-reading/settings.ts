// Length Reading's settings, as they appear in the page address.

import { figureTextFields } from '$shared/figureText'
import { bool, choice, defineSettings, number } from '$shared/settings'
import { OBJECTS, objectName } from './objectKinds'
import {
  CM_SIZES, IMPERIAL_MARKS, INCH_SIZES, METRIC_MARKS, READS, SYSTEMS, UNITS, formatLength, marksFit, rulerName, rulerScale, shortest, snap,
} from './ruler'

/** A magnifier on each end of the object that isn't lined up with 0. */
export const LENGTH_VIEWS = ['both', 'whole'] as const
export type LengthView = (typeof LENGTH_VIEWS)[number]
export const LENGTH_VIEW_NAMES: Record<LengthView, string> = { both: 'Ruler and magnifiers', whole: 'Ruler only' }

export const lengthSettings = defineSettings(
  {
    system: choice(SYSTEMS, 'metric'),
    cm: choice(CM_SIZES, '15'),
    inches: choice(INCH_SIZES, '6'),
    metricMarks: choice(METRIC_MARKS, 'mm'),
    imperialMarks: choice(IMPERIAL_MARKS, '8'),
    read: choice(READS, 'estimate'),
    object: choice(OBJECTS, 'cylinder'),
    marbles: number({ min: 1, max: 5, fallback: 3 }),
    /** dashed lines from the object's ends down to the ruler, for a round
     *  one whose ends are above where it touches */
    guides: bool(false),
    /** the object's length, in the ruler's cm or inches */
    length: number({ min: 0, max: 100, fallback: 4.37 }),
    /** where its left end is on the ruler; 0 lines it up with the 0 mark */
    start: number({ min: 0, max: 100, fallback: 0 }),
    view: choice(LENGTH_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    ...figureTextFields(),
  },
  (settings) => {
    // 5 cm and 10 cm marks on a short ruler become 1 cm ones.
    const s = marksFit(settings.metricMarks, settings.cm) ? settings : { ...settings, metricMarks: 'cm' as const }
    const scale = rulerScale(s)
    const length = snap(scale, s.length, shortest(scale))
    const start = snap(scale, s.start, 0, scale.size - length)
    return { ...s, length, start, marbles: Math.round(s.marbles), span: Math.round(s.span) }
  },
)

export type LengthSettings = typeof lengthSettings.defaults

/** The object's right end on the ruler. */
export const endOf = (s: LengthSettings) => snap(rulerScale(s), s.start + s.length)

/** A reading with its unit, e.g. "4.37 cm" or "3 3/8 in". */
export const lengthText = (s: LengthSettings, value: number) => `${formatLength(rulerScale(s), value)} ${UNITS[s.system]}`

/** The answer key line: just the length when the object starts at 0,
 *  e.g. "Length: 4.37 cm", and both ends' readings when it doesn't. */
export function answerLine(s: LengthSettings) {
  const length = `Length: ${lengthText(s, s.length)}`
  if (!s.start) return length
  return `Left end: ${lengthText(s, s.start)} · Right end: ${lengthText(s, endOf(s))} · ${length}`
}

/** The figure described for a screen reader. */
export const figureLabel = (s: LengthSettings) => {
  const thing = s.object === 'marbles' ? `a row of ${s.marbles === 1 ? 'one marble' : `${s.marbles} marbles`}` : objectName(s.object, s.marbles)
  return `A ${rulerName(rulerScale(s))}, with ${thing} lying along it from ${lengthText(s, s.start)} to ${lengthText(s, endOf(s))}`
}
