// The predator–prey pairs teachers pick from, each with populations and a
// cycle length that look right for those animals. The snowshoe hare and
// Canada lynx are the textbook example (OpenStax Biology 2e, 45.6): hares
// swing between about 10 and 150 thousand on a cycle of about 10 years, with
// the lynx a year or two behind. The others are classroom pairs, with
// believable numbers rather than real counts: a predator is far fewer than
// its prey, and small, fast-breeding animals cycle faster than big, slow ones.

export const UNITS = ['years', 'months', 'weeks', 'days'] as const
export type Units = (typeof UNITS)[number]
/** One of each unit, for "1 year" and the like. */
export const UNIT_ONE: Record<Units, string> = { years: 'year', months: 'month', weeks: 'week', days: 'day' }

export type Pair = {
  id: string
  /** as the pair is listed: "Snowshoe hare and Canada lynx" */
  name: string
  /** each population's name on the graph, as a plural */
  prey: string
  predators: string
  /** what both are, for a shared axis: "Number of animals" */
  kind: string
  /** what the counts are in, like "thousands", or '' for single animals */
  count: string
  /** the populations' averages over a cycle, and where they start */
  preyAverage: number
  predatorAverage: number
  preyStart: number
  predatorStart: number
  /** how long a cycle takes, and how much time the graph shows, in `units` */
  period: number
  span: number
  units: Units
  /** how often a census is taken, in `units` */
  every: number
  /** a shared y-axis, or prey on the left and predators on the right */
  scale: 'shared' | 'two'
}

export const PAIRS: Pair[] = [
  {
    id: 'hare-lynx', name: 'Snowshoe hare and Canada lynx', prey: 'Hares', predators: 'Lynx', kind: 'animals', count: 'thousands',
    preyAverage: 50, predatorAverage: 20, preyStart: 20, predatorStart: 12, period: 10, span: 40, units: 'years', every: 1, scale: 'shared',
  },
  {
    id: 'rabbit-wolf', name: 'Rabbit and wolf', prey: 'Rabbits', predators: 'Wolves', kind: 'animals', count: '',
    preyAverage: 600, predatorAverage: 30, preyStart: 300, predatorStart: 20, period: 8, span: 32, units: 'years', every: 1, scale: 'two',
  },
  {
    id: 'rabbit-fox', name: 'Rabbit and red fox', prey: 'Rabbits', predators: 'Foxes', kind: 'animals', count: '',
    preyAverage: 400, predatorAverage: 40, preyStart: 200, predatorStart: 30, period: 5, span: 20, units: 'years', every: 0.5, scale: 'two',
  },
  {
    id: 'moose-wolf', name: 'Moose and wolf (Isle Royale)', prey: 'Moose', predators: 'Wolves', kind: 'animals', count: '',
    preyAverage: 1000, predatorAverage: 25, preyStart: 600, predatorStart: 20, period: 30, span: 90, units: 'years', every: 1, scale: 'two',
  },
  {
    id: 'sealion-orca', name: 'Sea lion and orca', prey: 'Sea lions', predators: 'Orcas', kind: 'animals', count: '',
    preyAverage: 2000, predatorAverage: 20, preyStart: 1200, predatorStart: 14, period: 20, span: 60, units: 'years', every: 1, scale: 'two',
  },
  {
    id: 'snake-eagle', name: 'Snake and eagle', prey: 'Snakes', predators: 'Eagles', kind: 'animals', count: '',
    preyAverage: 300, predatorAverage: 12, preyStart: 150, predatorStart: 9, period: 12, span: 48, units: 'years', every: 1, scale: 'two',
  },
  {
    id: 'mouse-owl', name: 'Mouse and owl', prey: 'Mice', predators: 'Owls', kind: 'animals', count: '',
    preyAverage: 500, predatorAverage: 20, preyStart: 250, predatorStart: 14, period: 4, span: 16, units: 'years', every: 0.25, scale: 'two',
  },
  {
    id: 'aphid-ladybug', name: 'Aphid and ladybug', prey: 'Aphids', predators: 'Ladybugs', kind: 'insects', count: '',
    preyAverage: 2000, predatorAverage: 100, preyStart: 1000, predatorStart: 70, period: 30, span: 120, units: 'days', every: 3, scale: 'two',
  },
]

export const DEFAULT_PAIR = PAIRS[0]

/** The listed pair with these names, if they're one. */
export const pairNamed = (prey: string, predators: string) => PAIRS.find((p) => p.prey === prey.trim() && p.predators === predators.trim())
