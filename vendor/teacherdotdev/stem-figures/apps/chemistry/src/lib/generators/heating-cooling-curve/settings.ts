// Heating and Cooling Curve's settings, as they appear in the page address.
// The grid and axes are $shared/graph's, the same settings as Math's
// coordinate grid.

import { gridFields } from '$shared/graph/axes'
import { COLORS, type Color } from '$shared/graph/colors'
import { bool, choice, defineSettings, number } from '$lib/shared/settings'
import { DIRECTIONS, SUBSTANCES, type Direction, type Properties, type SegmentKey, type Substance, type SubstanceId, type Temperatures } from './curve'

/** Which substance: a setup, or the teacher's own (custom), from the points and properties typed. */
export const SUBSTANCE_CHOICES = [...SUBSTANCES.map((x) => x.id), 'custom'] as (SubstanceId | 'custom')[]
/** How long each segment is: typed for a schematic curve, or worked out to scale from the substance's properties. */
export const SOURCES = ['properties', 'lengths'] as const
/** What runs along the x-axis. */
export const X_QUANTITIES = ['time', 'heat'] as const
export type XQuantity = (typeof X_QUANTITIES)[number]
/** What each segment is labeled with: its state, a blank line for students, or nothing. */
export const SEGMENT_LABELS = ['states', 'blank', 'none'] as const
export const SEGMENT_LABEL_NAMES: Record<(typeof SEGMENT_LABELS)[number], string> = { states: 'States', blank: 'Blank lines', none: 'None' }
/** What a plateau is labeled with: both states ("Solid + liquid"), or the change ("Melting"). */
export const PLATEAU_LABELS = ['states', 'change'] as const
/** What's written by each plateau's dashed line at the temperature axis: its temperature, m.p. or b.p., a blank line, or nothing. */
export const POINT_LABELS = ['values', 'names', 'blank', 'none'] as const
export const POINT_LABEL_NAMES: Record<(typeof POINT_LABELS)[number], string> = {
  values: 'Temperatures',
  names: 'm.p. and b.p.',
  blank: 'Blank lines',
  none: 'None',
}

/** The x-axis title this page writes for each direction and quantity. */
export const xTitleFor = (dir: Direction, q: XQuantity) => (q === 'time' ? 'Time (min)' : dir === 'heating' ? 'Heat added (kJ)' : 'Heat removed (kJ)')
export const PAGE_X_TITLES = ['Time (min)', 'Heat added (kJ)', 'Heat removed (kJ)']

const WATER = SUBSTANCES[0]
const temperature = (fallback: number) => number({ min: -273.15, max: 5000, fallback })
const positive = (fallback: number, max: number) => number({ min: 0.001, max, fallback })
const length = (fallback: number) => number({ min: 0, max: 100000, fallback })

export const curveSettings = defineSettings({
  direction: choice(DIRECTIONS, 'heating'),
  substance: choice(SUBSTANCE_CHOICES, 'water'),
  source: choice(SOURCES, 'lengths'),
  xQuantity: choice(X_QUANTITIES, 'time'),
  startT: temperature(WATER.from),
  endT: temperature(WATER.to),
  // To scale: the sample, and how fast it's heated.
  mass: positive(100, 100000),
  rate: positive(10, 100000),
  // A custom substance: its melting and boiling points, and its properties for a curve to scale.
  mp: temperature(WATER.mp),
  bp: temperature(WATER.bp),
  cSolid: positive(WATER.properties.cSolid, 100),
  cLiquid: positive(WATER.properties.cLiquid, 100),
  cGas: positive(WATER.properties.cGas, 100),
  fusH: positive(WATER.properties.fusH, 1000),
  vapH: positive(WATER.properties.vapH, 1000),
  molarMass: positive(WATER.properties.molarMass, 2000),
  // From lengths: how long each segment is along the x-axis, whichever the curve has.
  solidW: length(2),
  meltW: length(3),
  liquidW: length(5),
  boilW: length(8),
  gasW: length(2),
  supercool: bool(false),
  supercoolBy: number({ min: 0.1, max: 1000, fallback: 5 }),
  letters: bool(false),
  segmentLabels: choice(SEGMENT_LABELS, 'states'),
  plateauLabels: choice(PLATEAU_LABELS, 'change'),
  guides: bool(true),
  pointLabels: choice(POINT_LABELS, 'values'),
  color: choice(Object.keys(COLORS) as Color[], 'red'),
  ...gridFields({
    xFrom: '0', xTo: '20', xStep: '1', xEvery: 2,
    yFrom: '-20', yTo: '120', yStep: '10', yEvery: 2,
    title: '', titleMode: 'none',
    xTitle: 'Time (min)', xTitleMode: 'text',
    yTitle: 'Temperature (°C)', yTitleMode: 'text',
    xLabel: 'x', xLabelMode: 'none', yLabel: 'y', yLabelMode: 'none',
    xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none',
    minor: 0,
  }),
})

export type CurveSettings = typeof curveSettings.defaults

/** The settings key holding each segment's typed length. */
export const WIDTH_KEYS = { solid: 'solidW', melt: 'meltW', liquid: 'liquidW', boil: 'boilW', gas: 'gasW' } as const satisfies Record<SegmentKey, keyof CurveSettings>

/** The setup the settings pick, or undefined for a custom substance. */
export const setupOf = (s: Pick<CurveSettings, 'substance'>): Substance | undefined => SUBSTANCES.find((x) => x.id === s.substance)

export const temperaturesOf = (s: CurveSettings): Temperatures => {
  const { mp, bp } = setupOf(s) ?? s
  return { startT: s.startT, endT: s.endT, mp, bp }
}

export const propertiesOf = (s: CurveSettings): Properties =>
  setupOf(s)?.properties ?? {
    cSolid: s.cSolid,
    cLiquid: s.cLiquid,
    cGas: s.cGas,
    fusH: s.fusH,
    vapH: s.vapH,
    molarMass: s.molarMass,
  }

/** The substance's name for titles and answer keys, lowercase as in a sentence; none for a custom one. */
export const substanceName = (s: Pick<CurveSettings, 'substance'>) => {
  const name = setupOf(s)?.name
  return name && name !== 'Substance X' ? name.toLowerCase() : name
}
