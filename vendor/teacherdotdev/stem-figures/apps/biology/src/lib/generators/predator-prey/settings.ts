// Predator–Prey Cycles' settings, as they appear in the page address. The
// grid and axes are $shared/graph's, the same settings as Chemistry's
// titration curve; the right-hand axis, for predators on a scale of their
// own, and the phase plane's axis titles are this generator's.

import { gridFields, TITLE_MODES } from '$shared/graph/axes'
import { bool, choice, defineSettings, number, text } from '$shared/settings'
import { ratesFor, type Rates } from './model'
import { DEFAULT_PAIR as P, UNITS, pairNamed, type Pair, type Units } from './pairs'

/** What the cycle is worked out from: the teacher's populations and cycle length, or the model's four rates. */
export const SOURCES = ['simple', 'rates'] as const
/** Populations against time, or predators against prey. */
export const VIEWS = ['time', 'phase'] as const
/** Which populations are drawn: leaving one or both off gives students axes to sketch on. */
export const SHOWS = ['both', 'prey', 'predators', 'neither'] as const
/** Smooth curves from the model, or census counts taken every so often. */
export const DATA = ['curves', 'census'] as const
export const SCALES = ['shared', 'two'] as const
/** How the lag and period are labeled: with their length, their name only, or a line for students. */
export const MARK_LABELS = ['value', 'name', 'blank'] as const

export const SHOW_NAMES: Record<(typeof SHOWS)[number], string> = {
  both: 'Both',
  prey: 'Prey only',
  predators: 'Predators only',
  neither: 'Neither (blank axes)',
}
export const MARK_LABEL_NAMES: Record<(typeof MARK_LABELS)[number], string> = {
  value: 'Name and length',
  name: 'Name only',
  blank: 'Blank for students',
}

const population = (fallback: number) => number({ min: 0.001, max: 10_000_000, fallback })
const rate = (fallback: number) => number({ min: 1e-9, max: 1_000_000, fallback })
const sig = (v: number) => Number(v.toPrecision(3))

/** The rates for a pair's populations and cycle, to three significant figures. */
export function ratesOfPair(p: Pair): Rates {
  const r = ratesFor({ prey: p.preyAverage, predators: p.predatorAverage }, { prey: p.preyStart, predators: p.predatorStart }, p.period)
  return { alpha: sig(r.alpha), beta: sig(r.beta), gamma: sig(r.gamma), delta: sig(r.delta) }
}

const DEFAULT_RATES = ratesOfPair(P)

/** "Hares (thousands)", or just "Rabbits" for counts of single animals. */
const counted = (name: string, count: string) => `${name.trim()}${count ? ` (${count})` : ''}`

/** The titles this page writes for these names and units, which it keeps up to date until the teacher types their own. */
export function autoTitles(s: { preyName: string; predatorName: string; units: Units; scale: (typeof SCALES)[number] }) {
  const pair = pairNamed(s.preyName, s.predatorName)
  const count = pair?.count ?? ''
  // Names left empty are drawn as Prey and Predators, so they're titled so too.
  const prey = s.preyName.trim() || 'Prey'
  const predators = s.predatorName.trim() || 'Predators'
  return {
    xTitle: `Time (${s.units})`,
    yTitle: s.scale === 'two' ? counted(prey, count) : pair ? counted(`Number of ${pair.kind}`, count) : 'Population size',
    y2Title: counted(predators, count),
    pxTitle: counted(prey, count),
    pyTitle: counted(predators, count),
  }
}

const TITLES = autoTitles({ preyName: P.prey, predatorName: P.predators, units: P.units, scale: P.scale })

export const predatorPreySettings = defineSettings(
  {
    preyName: text(P.prey, 30),
    predatorName: text(P.predators, 30),
    source: choice(SOURCES, 'simple'),
    /** both populations at time 0 */
    prey: population(P.preyStart),
    predators: population(P.predatorStart),
    /** the populations the cycle swings around, which are also their averages over a cycle */
    preyAverage: population(P.preyAverage),
    predatorAverage: population(P.predatorAverage),
    /** how long one cycle takes, in `units` */
    period: number({ min: 0.001, max: 100_000, fallback: P.period }),
    alpha: rate(DEFAULT_RATES.alpha),
    beta: rate(DEFAULT_RATES.beta),
    gamma: rate(DEFAULT_RATES.gamma),
    delta: rate(DEFAULT_RATES.delta),
    /** how much time the graph shows, in `units` */
    span: number({ min: 0.001, max: 100_000, fallback: P.span }),
    units: choice(UNITS, P.units),
    view: choice(VIEWS, 'time'),
    show: choice(SHOWS, 'both'),
    data: choice(DATA, 'curves'),
    /** how often the census is taken, in `units` */
    every: number({ min: 0.001, max: 100_000, fallback: P.every }),
    /** about how far off each count is, in percent */
    noise: number({ min: 0, max: 50, fallback: 10 }),
    seed: number({ min: 1, max: 999_999, fallback: 1 }),
    /** join the census counts with lines */
    connect: bool(true),
    scale: choice(SCALES, P.scale),
    peaks: bool(false),
    lag: bool(false),
    cycle: bool(false),
    markLabels: choice(MARK_LABELS, 'value'),
    color: bool(true),
    /** fit the x-axis to the time shown, rather than use the range typed */
    xFit: bool(true),
    /** fit the y-axes to the populations, rather than use the ranges typed */
    yFit: bool(true),
    /** the right-hand axis, for predators on a scale of their own; it has as many blocks as the left */
    y2From: text('0'),
    y2Step: text('5'),
    y2Title: text(TITLES.y2Title),
    y2TitleMode: choice(TITLE_MODES, 'text'),
    /** the phase plane's axis titles */
    pxTitle: text(TITLES.pxTitle),
    pxTitleMode: choice(TITLE_MODES, 'text'),
    pyTitle: text(TITLES.pyTitle),
    pyTitleMode: choice(TITLE_MODES, 'text'),
    ...gridFields({
      xFrom: '0', xTo: String(P.span), xStep: '2', xEvery: 5,
      yFrom: '0', yTo: '200', yStep: '20', yEvery: 1,
      title: '', titleMode: 'none',
      xTitle: TITLES.xTitle, xTitleMode: 'text',
      yTitle: TITLES.yTitle, yTitleMode: 'text',
      xLabel: 't', xLabelMode: 'none', yLabel: 'N', yLabelMode: 'none',
      xStartCap: 'none', xEndCap: 'none', yStartCap: 'none', yEndCap: 'none',
      minor: 0,
    }),
  },
  (s) => ({ ...s, seed: Math.round(s.seed) }),
)

export type PredatorPreySettings = typeof predatorPreySettings.defaults

/** The model's rates, from whichever the settings work them out from. */
export const ratesOf = (s: PredatorPreySettings): Rates =>
  s.source === 'rates'
    ? { alpha: s.alpha, beta: s.beta, gamma: s.gamma, delta: s.delta }
    : ratesFor({ prey: s.preyAverage, predators: s.predatorAverage }, { prey: s.prey, predators: s.predators }, s.period)

/** Settings for one of the listed pairs: its names, populations, cycle and scale. */
export function pairSettings(p: Pair) {
  const rates = ratesOfPair(p)
  return {
    preyName: p.prey,
    predatorName: p.predators,
    prey: p.preyStart,
    predators: p.predatorStart,
    preyAverage: p.preyAverage,
    predatorAverage: p.predatorAverage,
    period: p.period,
    span: p.span,
    units: p.units,
    every: p.every,
    scale: p.scale,
    ...rates,
  }
}
