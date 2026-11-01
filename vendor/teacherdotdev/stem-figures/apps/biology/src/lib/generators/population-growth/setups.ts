// Classic setups: populations teachers graph most often, each a set of
// settings over the defaults. The axes are fitted to each when it's picked.

import type { PopulationSettings } from './settings'
import { titlesFor } from './settings'

type Setup = { id: string; name: string; settings: Partial<PopulationSettings> }

const named = (organism: string, unit: PopulationSettings['unit']) => ({ organism, unit, ...titlesFor(organism, unit) })

export const SETUPS: Setup[] = [
  {
    // Carlson's yeast culture, which Pearl fitted a logistic curve to: about
    // 665 units of yeast, growing about 0.54 an hour at first.
    id: 'yeast',
    name: 'Yeast in a flask',
    settings: {
      model: 'logistic', n0: 10, r: 0.54, k: 665, span: 18, ...named('yeast cells', 'hours'),
      nTitle: 'Yeast cells (thousands)', census: true, censusEvery: 1, noise: 5, phases: true,
    },
  },
  {
    id: 'deer',
    name: 'Deer on an island',
    settings: { model: 'logistic', n0: 20, r: 0.4, k: 500, span: 30, ...named('deer', 'years'), inflection: true },
  },
  {
    // Bacteria doubling every hour (r = ln 2 per hour), with nothing yet holding them back.
    id: 'bacteria',
    name: 'Bacteria doubling every hour',
    settings: { model: 'exponential', n0: 100, r: 0.6931472, span: 10, ...named('bacteria', 'hours'), census: true, censusEvery: 1, table: true },
  },
  {
    id: 'compare',
    name: 'Exponential and logistic growth',
    settings: { model: 'both', n0: 10, r: 0.5, k: 1000, span: 20, ...named('', 'years') },
  },
  {
    id: 'per-capita',
    name: 'Per capita growth rate against N',
    settings: { model: 'both', n0: 10, r: 0.5, k: 1000, span: 20, ...named('', 'years'), graphs: 'percapita-n' },
  },
  {
    id: 'raw-per-capita',
    name: 'Growth rate and per capita rate',
    settings: { model: 'logistic', n0: 10, r: 0.5, k: 1000, span: 20, ...named('', 'years'), graphs: 'rate-percapita-n', inflection: true },
  },
  {
    id: 'size-rate',
    name: 'Population size and growth rate over time',
    settings: { model: 'logistic', n0: 10, r: 0.5, k: 1000, span: 20, ...named('', 'years'), graphs: 'size-rate', inflection: true },
  },
  {
    // rτ = 1.2: the swings around K die away.
    id: 'overshoot',
    name: 'Overshoot and oscillation around K',
    settings: { model: 'overshoot', n0: 20, r: 0.6, k: 1000, lag: 2, span: 40, ...named('', 'years') },
  },
  {
    id: 'crash',
    name: 'Boom and crash',
    settings: { model: 'crash', n0: 30, r: 0.5, k: 6000, span: 30, ...named('reindeer', 'years') },
  },
  {
    id: 'blank',
    name: 'Blank graph for students to draw on',
    settings: { model: 'logistic', curve: false, kLine: true, kLabelMode: 'text', ...named('', 'years') },
  },
]

/** The settings a setup makes, starting from the teacher's look (label size, colors) but nothing else. */
export function settingsFor(setup: Setup, defaults: PopulationSettings, current: PopulationSettings): PopulationSettings {
  return { ...defaults, labelSize: current.labelSize, color: current.color, expColor: current.expColor, ...setup.settings }
}
