// Population Growth's settings, as they appear in the page address. The
// graphs are $shared/graph grids, stacked when there are two: the x-axis
// (time, or population size) is shared, the top graph's y-axis has the
// usual y fields, and the lower graph's has its own (y2From…).

import { CAPS, type Cap } from '$shared/graph/caps'
import { EVERY, LABEL_MODES, MINOR, TITLE_MODES } from '$shared/graph/axes'
import { COLORS, type Color } from '$shared/graph/colors'
import { LABEL_SIZES, type LabelSize } from '$shared/labelSize'
import { bool, choice, defineSettings, number, text, type Field } from '$shared/settings'
import { MODELS, type Growth, type Model } from './growth'

/** What a graph shows up its side. */
export type View = 'size' | 'rate' | 'percapita'

/** The graphs teachers can pick: one, or two stacked, against time or population size. */
export const GRAPHS = {
  size: { name: 'Population size over time', views: ['size'], against: 'time' },
  rate: { name: 'Growth rate over time', views: ['rate'], against: 'time' },
  percapita: { name: 'Per capita growth rate over time', views: ['percapita'], against: 'time' },
  'size-rate': { name: 'Population size and growth rate', views: ['size', 'rate'], against: 'time' },
  'size-percapita': { name: 'Population size and per capita rate', views: ['size', 'percapita'], against: 'time' },
  'rate-percapita': { name: 'Growth rate and per capita rate', views: ['rate', 'percapita'], against: 'time' },
  'rate-n': { name: 'Growth rate against population size', views: ['rate'], against: 'size' },
  'percapita-n': { name: 'Per capita rate against population size', views: ['percapita'], against: 'size' },
  'rate-percapita-n': { name: 'Both rates against population size', views: ['rate', 'percapita'], against: 'size' },
} as const satisfies Record<string, { name: string; views: readonly View[]; against: 'time' | 'size' }>
export type Graphs = keyof typeof GRAPHS
export const GRAPH_IDS = Object.keys(GRAPHS) as Graphs[]

export const MODEL_NAMES: Record<Model, string> = {
  logistic: 'Logistic (S-curve)',
  exponential: 'Exponential (J-curve)',
  both: 'Exponential and logistic',
  overshoot: 'Overshoot and oscillation',
  crash: 'Boom and crash',
}

/** Units of time, and how one of them is written after "per". */
export const UNITS = { hours: 'hour', days: 'day', weeks: 'week', months: 'month', years: 'year', generations: 'generation' }
export type Unit = keyof typeof UNITS

export const NOISES = [0, 5, 10, 20] as const

/** The axis titles this page writes for an organism and unit, which it rewrites when they change. */
export function titlesFor(organism: string, unit: Unit) {
  const who = organism.trim()
  const per = UNITS[unit]
  return {
    timeTitle: `Time (${unit})`,
    nTitle: who ? `Number of ${who}` : 'Population size (N)',
    rateTitle: `Growth rate (${who || 'individuals'}/${per})`,
    pcTitle: `Per capita growth rate (per ${per})`,
  }
}

export const DEFAULT_GROWTH: Growth = { n0: 20, r: 0.5, k: 1000, lag: 2.5 }
const DEFAULT_TITLES = titlesFor('', 'years')

function numberChoice(options: readonly number[], fallback: number): Field<number> {
  const accept = (v: unknown) => (options.includes(Number(v)) && String(v).trim() !== '' ? Number(v) : undefined)
  return { fallback, accept, parse: accept, format: (v) => String(v) }
}
const cap = (v: Cap) => choice(Object.keys(CAPS) as Cap[], v)
const label = (words: string, mode: (typeof TITLE_MODES)[number] = 'text') => ({ words: text(words), mode: choice(TITLE_MODES, mode) })
const labels = <K extends string>(defaults: Record<K, string>) =>
  Object.fromEntries(
    Object.entries(defaults).flatMap(([k, v]) => {
      const l = label(v as string)
      return [[k, l.words], [`${k}Mode`, l.mode]]
    }),
  ) as Record<K, Field<string>> & Record<`${K}Mode`, Field<(typeof TITLE_MODES)[number]>>

export const populationSettings = defineSettings({
  model: choice(MODELS, 'logistic'),
  n0: number({ min: 0.0001, max: 1e9, fallback: DEFAULT_GROWTH.n0 }),
  r: number({ min: 0.0001, max: 100, fallback: DEFAULT_GROWTH.r }),
  k: number({ min: 0.0001, max: 1e10, fallback: DEFAULT_GROWTH.k }),
  /** the overshoot model's lag, in units of time */
  lag: number({ min: 0.05, max: 1000, fallback: DEFAULT_GROWTH.lag }),
  /** how long the curve runs, in units of time */
  span: number({ min: 0.01, max: 10000, fallback: 20 }),
  unit: choice(Object.keys(UNITS) as Unit[], 'years'),
  organism: text('', 40),
  graphs: choice(GRAPH_IDS, 'size'),

  curve: bool(true),
  color: choice(Object.keys(COLORS) as Color[], 'blue'),
  expColor: choice(Object.keys(COLORS) as Color[], 'red'),
  ...labels({ logLabel: 'Logistic growth', expLabel: 'Exponential growth' }),

  census: bool(false),
  censusEvery: number({ min: 0.001, max: 10000, fallback: 1 }),
  noise: numberChoice(NOISES, 0),
  seed: number({ min: 1, max: 999999, fallback: 1 }),
  table: bool(false),

  kLine: bool(true),
  ...labels({ kLabel: 'Carrying capacity (K)' }),
  inflection: bool(false),
  ...labels({ inflLabel: 'Inflection point (N = K/2)', peakLabel: 'Fastest growth (N = K/2)' }),
  phases: bool(false),
  ...labels({ lagLabel: 'Lag phase', expPhaseLabel: 'Exponential phase', statLabel: 'Stationary phase' }),

  title: text(''),
  titleMode: choice(TITLE_MODES, 'none'),
  timeTitle: text(DEFAULT_TITLES.timeTitle),
  timeTitleMode: choice(TITLE_MODES, 'text'),
  nTitle: text(DEFAULT_TITLES.nTitle),
  nTitleMode: choice(TITLE_MODES, 'text'),
  rateTitle: text(DEFAULT_TITLES.rateTitle),
  rateTitleMode: choice(TITLE_MODES, 'text'),
  pcTitle: text(DEFAULT_TITLES.pcTitle),
  pcTitleMode: choice(TITLE_MODES, 'text'),

  xFrom: text('0'),
  xTo: text('20'),
  xStep: text('1'),
  xEvery: numberChoice(EVERY, 2),
  xLabel: text('t'),
  xLabelMode: choice(LABEL_MODES, 'none'),
  xStartCap: cap('none'),
  xEndCap: cap('none'),
  yFrom: text('0'),
  yTo: text('1100'),
  yStep: text('100'),
  yEvery: numberChoice(EVERY, 1),
  yLabel: text('N'),
  yLabelMode: choice(LABEL_MODES, 'none'),
  yStartCap: cap('none'),
  yEndCap: cap('none'),
  y2From: text('0'),
  y2To: text('140'),
  y2Step: text('20'),
  y2Every: numberChoice(EVERY, 1),
  minor: numberChoice(MINOR, 0),
  labelSize: choice(Object.keys(LABEL_SIZES) as LabelSize[], 'medium'),
})

export type PopulationSettings = typeof populationSettings.defaults

export const growthOf = (s: PopulationSettings): Growth => ({ n0: s.n0, r: s.r, k: s.k, lag: s.lag })
export const viewsOf = (s: PopulationSettings) => GRAPHS[s.graphs].views
export const againstOf = (s: PopulationSettings) => GRAPHS[s.graphs].against
