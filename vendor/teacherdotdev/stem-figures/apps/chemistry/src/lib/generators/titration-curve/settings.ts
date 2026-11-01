// Titration Curve's settings, as they appear in the page address. The grid
// and axes are $shared/graph's, the same settings as Math's coordinate grid.

import { gridFields, TITLE_MODES } from '$shared/graph/axes'
import { COLORS, type Color } from '$shared/graph/colors'
import { choice, defineSettings, number, text } from '$lib/shared/settings'
import { ANALYTES, equivalenceMl, isBase, keyPointsOf, type Analyte, type Chemistry, type KeyPoints } from './curve'

/** What the curve is worked out from: the chemistry, or the key points on it. */
export const SOURCES = ['chemistry', 'points'] as const
/** How a point on the curve is marked: not at all, a dot, or a dot with dashed lines to both axes. */
export const MARKS = ['guides', 'dot', 'none'] as const
export const MARK_NAMES: Record<(typeof MARKS)[number], string> = { guides: 'Dot and lines to the axes', dot: 'Dot', none: 'Not marked' }

export const ANALYTE_NAMES: Record<Analyte, string> = {
  'strong-acid': 'Strong acid with a strong base',
  'weak-acid': 'Weak acid with a strong base',
  'strong-base': 'Strong base with a strong acid',
  'weak-base': 'Weak base with a strong acid',
}

/** Titrations teachers set most often, each 25.0 mL of 0.100 M titrated with 0.100 M. */
export const COMMON = [
  { id: 'hcl', name: 'HCl with NaOH', analyte: 'strong-acid', titrant: 'NaOH', pK: 0 },
  { id: 'acetic', name: 'CH₃COOH (acetic acid) with NaOH', analyte: 'weak-acid', titrant: 'NaOH', pK: 4.76 },
  { id: 'formic', name: 'HCOOH (formic acid) with NaOH', analyte: 'weak-acid', titrant: 'NaOH', pK: 3.75 },
  { id: 'hf', name: 'HF with NaOH', analyte: 'weak-acid', titrant: 'NaOH', pK: 3.17 },
  { id: 'naoh', name: 'NaOH with HCl', analyte: 'strong-base', titrant: 'HCl', pK: 0 },
  { id: 'nh3', name: 'NH₃ (ammonia) with HCl', analyte: 'weak-base', titrant: 'HCl', pK: 4.75 },
] as const satisfies readonly { id: string; name: string; analyte: Analyte; titrant: string; pK: number }[]

const DEFAULT_CHEMISTRY: Chemistry = { analyte: 'weak-acid', analyteM: 0.1, analyteMl: 25, titrantM: 0.1, pK: 4.76 }
const DEFAULT_END_ML = 50
const DEFAULT_POINTS = keyPointsOf(DEFAULT_CHEMISTRY, DEFAULT_END_ML)
const ph = (fallback: number) => number({ min: 0, max: 14, fallback: Math.round(fallback * 100) / 100 })

export const titrationSettings = defineSettings({
  source: choice(SOURCES, 'chemistry'),
  analyte: choice(ANALYTES, DEFAULT_CHEMISTRY.analyte),
  analyteM: number({ min: 0.0001, max: 10, fallback: DEFAULT_CHEMISTRY.analyteM }),
  analyteMl: number({ min: 0.1, max: 1000, fallback: DEFAULT_CHEMISTRY.analyteMl }),
  titrantM: number({ min: 0.0001, max: 10, fallback: DEFAULT_CHEMISTRY.titrantM }),
  pKa: number({ min: 0, max: 14, fallback: 4.76 }),
  pKb: number({ min: 0, max: 14, fallback: 4.75 }),
  startPH: ph(DEFAULT_POINTS.startPH),
  eqMl: number({ min: 0.01, max: 1000, fallback: DEFAULT_POINTS.eqMl }),
  eqPH: ph(DEFAULT_POINTS.eqPH),
  endPH: ph(DEFAULT_POINTS.endPH),
  eqMark: choice(MARKS, 'guides'),
  eqLabelMode: choice(TITLE_MODES, 'text'),
  eqLabel: text('Equivalence point'),
  halfMark: choice(MARKS, 'none'),
  halfLabelMode: choice(TITLE_MODES, 'text'),
  halfLabel: text('Half-equivalence point'),
  color: choice(Object.keys(COLORS) as Color[], 'blue'),
  ...gridFields({
    xFrom: '0', xTo: String(DEFAULT_END_ML), xStep: '2', xEvery: 5,
    yFrom: '0', yTo: '14', yStep: '1', yEvery: 2,
    title: '', titleMode: 'none',
    xTitle: 'Volume of NaOH added (mL)', xTitleMode: 'text',
    yTitle: 'pH', yTitleMode: 'text',
    xLabel: 'x', xLabelMode: 'none', yLabel: 'y', yLabelMode: 'none',
    xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none',
    minor: 0,
  }),
})

export type TitrationSettings = typeof titrationSettings.defaults

/** The chemistry the settings describe. */
export const chemistryOf = (s: TitrationSettings): Chemistry => ({
  analyte: s.analyte,
  analyteM: s.analyteM,
  analyteMl: s.analyteMl,
  titrantM: s.titrantM,
  pK: isBase(s.analyte) ? s.pKb : s.pKa,
})

export const keyPointsIn = (s: TitrationSettings): KeyPoints => ({ startPH: s.startPH, eqMl: s.eqMl, eqPH: s.eqPH, endPH: s.endPH })

/** The equivalence point's volume either way the curve is worked out. */
export const eqMlOf = (s: TitrationSettings) => (s.source === 'chemistry' ? equivalenceMl(chemistryOf(s)) : s.eqMl)
