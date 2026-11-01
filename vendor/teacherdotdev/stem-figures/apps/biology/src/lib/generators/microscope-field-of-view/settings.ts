// Microscope Field of View's settings, as they appear in the page address.
// Fields are in mm and specimens in µm. A specimen's size is kept in µm
// whatever the magnification, so turning to a higher power makes it bigger
// in the field, as it would.

import { bool, choice, defineSettings, number, text } from '$shared/settings'
import { EYEPIECES, OBJECTIVES, fieldAt, totalMagnification, type Objective } from './microscope'
import { ARRANGEMENTS, MOST_ACROSS, SPECIMENS, SPECIMEN_INFO, arrange } from './specimens'

/** What the caption under each field says about its magnification. */
export const MAG_CAPTIONS = ['total', 'lenses', 'both', 'none'] as const
export type MagCaption = (typeof MAG_CAPTIONS)[number]

/** Where the field's diameter comes from: typed for this objective, or
 *  worked out from one measured at low power. */
export const FIELD_SOURCES = ['low', 'typed'] as const

/** The arrow across the top of the field: its diameter in mm or µm, or blank. */
export const ARROWS = ['none', 'mm', 'um', 'blank'] as const
export type Arrow = (typeof ARROWS)[number]

/** The letter e as seen through the eyepiece (upside down and backwards), or
 *  as it was placed on the slide. */
export const ORIENTATIONS = ['seen', 'slide'] as const

export const QUESTIONS = ['size', 'field', 'magnification', 'count', 'orientation'] as const
export type Question = (typeof QUESTIONS)[number]

export const MAX_SEED = 9999

export const microscopeSettings = defineSettings(
  {
    eyepiece: choice(EYEPIECES, '10'),
    objective: choice(OBJECTIVES, '10'),
    magCaption: choice(MAG_CAPTIONS, 'total'),
    fieldSource: choice(FIELD_SOURCES, 'low'),
    /** the field's diameter at low power, in mm, and the objective it was measured with */
    lowField: number({ min: 0.5, max: 10, fallback: 4.5 }),
    lowObjective: choice(['4', '10'] as const, '4'),
    /** the field's diameter typed for this objective, in mm */
    field: number({ min: 0.05, max: 10, fallback: 1.8 }),
    specimen: choice(SPECIMENS, 'onion'),
    /** its length, diameter or height, in µm */
    size: number({ min: 1, max: 5000, fallback: 300 }),
    arrangement: choice(ARRANGEMENTS, 'scatter'),
    count: number({ min: 1, max: 60, fallback: 8 }),
    edges: bool(true),
    seed: number({ min: 1, max: MAX_SEED, fallback: 1 }),
    orientation: choice(ORIENTATIONS, 'seen'),
    color: bool(true),
    ruler: bool(false),
    scaleBar: bool(false),
    arrow: choice(ARROWS, 'none'),
    /** with two fields, leave the high-power one's arrow blank to work out */
    arrowHighBlank: bool(true),
    /** the same slide at a higher power, beside it */
    compare: bool(false),
    highObjective: choice(OBJECTIVES, '40'),
    question: choice(QUESTIONS, 'size'),
    questionMode: choice(['auto', 'text', 'none'] as const, 'auto'),
    questionText: text('', 300),
    answer: choice(['shown', 'blank', 'none'] as const, 'blank'),
    titleMode: choice(['none', 'text'] as const, 'none'),
    title: text(''),
  },
  (settings) => {
    let s = { ...settings, count: Math.round(settings.count), seed: Math.round(settings.seed) }
    // The second field is always the higher power; from oil immersion
    // there's none higher, so the pair becomes high power and oil.
    if (s.compare && Number(s.highObjective) <= Number(s.objective)) {
      const higher = OBJECTIVES.find((o) => Number(o) > Number(s.objective))
      s = higher ? { ...s, highObjective: higher } : { ...s, objective: '40', highObjective: '100' }
    }
    const info = SPECIMEN_INFO[s.specimen]
    // Each question needs something to ask about.
    let question = s.question
    if (question === 'orientation' && info.kind !== 'letter') question = 'size'
    if (question === 'count' && info.kind === 'letter') question = 'orientation'
    if ((question === 'size' || question === 'count') && info.kind === 'none') question = 'field'
    return { ...s, question }
  },
)

export type MicroscopeSettings = typeof microscopeSettings.defaults

type FieldSettings = Pick<MicroscopeSettings, 'eyepiece' | 'objective' | 'fieldSource' | 'lowField' | 'lowObjective' | 'field'>

/** The magnification and field diameter (mm) the field's diameter is known
 *  from: the low-power one measured, or the one typed for this objective. */
export function knownField(s: FieldSettings) {
  return s.fieldSource === 'low'
    ? { magnification: totalMagnification(s.eyepiece, s.lowObjective), field: s.lowField }
    : { magnification: totalMagnification(s.eyepiece, s.objective), field: s.field }
}

/** The field's diameter in mm with this objective. */
export function fieldOf(s: FieldSettings, objective: Objective) {
  const known = knownField(s)
  return fieldAt(known.field, known.magnification, totalMagnification(s.eyepiece, objective))
}

/** One field drawn in the figure: its objective, total magnification and
 *  diameter in mm. */
export interface View {
  objective: Objective
  magnification: number
  field: number
}

/** The fields drawn: the one set, and the higher power beside it. */
export function viewsOf(s: MicroscopeSettings): View[] {
  const objectives = s.compare ? [s.objective, s.highObjective] : [s.objective]
  return objectives.map((objective) => ({
    objective,
    magnification: totalMagnification(s.eyepiece, objective),
    field: fieldOf(s, objective),
  }))
}

/** Everything on the slide, placed across the widest field drawn. */
export const slideOf = (s: MicroscopeSettings) =>
  arrange({
    specimen: s.specimen,
    size: s.size,
    field: fieldOf(s, s.objective) * 1000,
    arrangement: s.arrangement,
    count: s.count,
    edges: s.edges,
    seed: s.seed,
  })

/** Whether tissue is too small to draw to scale in the widest field: more
 *  than MOST_ACROSS cells across it, which are drawn that many across. */
export const tooSmall = (s: MicroscopeSettings) =>
  SPECIMEN_INFO[s.specimen].kind === 'tissue' && (fieldOf(s, s.objective) * 1000) / s.size > MOST_ACROSS

/** A seed for a new random arrangement. */
export const newSeed = () => 1 + Math.floor(Math.random() * MAX_SEED)

/** Starting points for the questions most often asked, each the default
 *  settings with a few changed. */
export const SETUPS: { name: string; changes: Partial<MicroscopeSettings> }[] = [
  { name: 'Estimate cell size', changes: {} },
  {
    name: 'Measure the field with a ruler',
    changes: { objective: '4', specimen: 'none', ruler: true, question: 'field' },
  },
  {
    name: 'Field at high power',
    changes: { compare: true, objective: '10', highObjective: '40', arrow: 'mm', arrowHighBlank: true, question: 'field' },
  },
  {
    name: 'Total magnification',
    changes: { objective: '40', specimen: 'cheek', size: 60, count: 5, magCaption: 'lenses', question: 'magnification' },
  },
  {
    name: 'Count the cells',
    changes: { objective: '100', specimen: 'blood', size: 8, count: 15, question: 'count' },
  },
  {
    name: 'How many fit across',
    changes: { specimen: 'paramecium', size: 225, arrangement: 'row', question: 'size' },
  },
  { name: 'The letter e', changes: { objective: '4', specimen: 'letter', size: 1500, question: 'orientation' } },
]

/** A setup's settings: the defaults with its changes. */
export const setupSettings = (changes: Partial<MicroscopeSettings>) =>
  microscopeSettings.tidy({ ...microscopeSettings.defaults, ...changes })
