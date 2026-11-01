// Mitosis & Meiosis' settings, as they appear in the page address.

import { figureTextFields } from '$shared/figureText'
import { LABEL_SIZES, type LabelSize } from '$shared/labelSize'
import { bool, choice, defineSettings, number, type Field } from '$shared/settings'
import {
  DIPLOID_NUMBERS,
  MEIOSIS_PHASES,
  MITOSIS_PHASES,
  PHASES,
  PROCESSES,
  phasesOf,
  type MeiosisPhase,
  type MitosisPhase,
  type Phase,
} from './model'

/** One phase on its own, or a strip of phases to label or put in order. */
export const LAYOUTS = ['single', 'strip'] as const
export const ORDERS = ['in-order', 'shuffled'] as const
/** How many strip panels go across: "auto" picks a tidy grid. */
export const PER_ROW = ['auto', '1', '2', '3', '4', '5', '6', '8'] as const
export const CELL_TYPES = ['animal', 'plant'] as const
export const INKS = ['color', 'bw'] as const
/** Under each phase: its name, a number, a blank line to write it on, or nothing. */
export const PHASE_LABELS = ['name', 'number', 'blank', 'none'] as const
/** Under each cell: "2n = 4" or "n = 2", "4 chromosomes", or nothing. */
export const COUNT_LABELS = ['none', 'ploidy', 'count'] as const
/** Structure labels: written out, lettered for an answer key, or blank lines. */
export const LABEL_STYLES = ['names', 'letters', 'blank'] as const

/** The structures that can be labeled, in the order they're listed. */
export const STRUCTURES = ['chromosome', 'sisters', 'centromere', 'pair', 'spindle', 'centrioles', 'envelope', 'division'] as const
export type Structure = (typeof STRUCTURES)[number]

export const MAX_SEED = 999999

/** The phases in a strip, in order, written in the address as
 *  "prophase.metaphase.anaphase". At least one, each once. */
function phaseList<P extends Phase>(options: readonly P[], fallback: P[]): Field<P[]> {
  const accept = (v: unknown) => {
    if (!Array.isArray(v)) return undefined
    const list = options.filter((p) => v.includes(p))
    return list.length ? list : undefined
  }
  return { fallback, accept, parse: (text) => accept(text.split('.')), format: (v) => v.join('.') }
}

export const cellDivisionSettings = defineSettings(
  {
    process: choice(PROCESSES, 'mitosis'),
    layout: choice(LAYOUTS, 'strip'),
    phase: choice(PHASES, 'metaphase'),
    mitosisPhases: phaseList<MitosisPhase>(MITOSIS_PHASES, ['g2', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis']),
    meiosisPhases: phaseList<MeiosisPhase>(MEIOSIS_PHASES, [
      'prophase-1',
      'metaphase-1',
      'anaphase-1',
      'telophase-1',
      'prophase-2',
      'metaphase-2',
      'anaphase-2',
      'telophase-2',
      'products',
    ]),
    order: choice(ORDERS, 'in-order'),
    seed: number({ min: 1, max: MAX_SEED, fallback: 1 }),
    perRow: choice(PER_ROW, 'auto'),
    diploid: choice(DIPLOID_NUMBERS, '4'),
    cell: choice(CELL_TYPES, 'animal'),
    crossingOver: bool(false),
    ink: choice(INKS, 'color'),
    phaseLabels: choice(PHASE_LABELS, 'name'),
    countLabels: choice(COUNT_LABELS, 'none'),
    chromosome: bool(false),
    sisters: bool(false),
    centromere: bool(false),
    pair: bool(false),
    spindle: bool(false),
    centrioles: bool(false),
    envelope: bool(false),
    division: bool(false),
    labelStyle: choice(LABEL_STYLES, 'names'),
    key: bool(false),
    labelSize: choice(Object.keys(LABEL_SIZES) as LabelSize[], 'medium'),
    ...figureTextFields(),
  },
  (s) => ({
    ...s,
    seed: Math.round(s.seed),
    // a phase of the other process becomes this one's default
    phase: phasesOf(s.process).includes(s.phase) ? s.phase : s.process === 'mitosis' ? 'metaphase' : 'metaphase-1',
  }),
)

export type CellDivisionSettings = typeof cellDivisionSettings.defaults

/** A seed for a new shuffle. */
export const newSeed = () => 1 + Math.floor(Math.random() * MAX_SEED)

/** The number of homologous pairs, n. */
export const pairsOf = (s: Pick<CellDivisionSettings, 'diploid'>) => Number(s.diploid) / 2

/** The phases a strip shows for a process, in their real order. */
export const stripPhases = (s: Pick<CellDivisionSettings, 'process' | 'mitosisPhases' | 'meiosisPhases'>): Phase[] =>
  s.process === 'mitosis' ? s.mitosisPhases : s.meiosisPhases

/** Crossing over is only part of meiosis. */
export const crossed = (s: Pick<CellDivisionSettings, 'process' | 'crossingOver'>) => s.process === 'meiosis' && s.crossingOver

/** The structures turned on, in their listed order. */
export const structuresOn = (s: CellDivisionSettings) => STRUCTURES.filter((k) => s[k])

/** A small seeded random number generator (mulberry32), so a shuffle is the
 *  same every time the same link is opened. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The phases in the order the strip shows them: as they happen, or shuffled
 *  from the seed. */
export function shownOrder(phases: Phase[], order: (typeof ORDERS)[number], seed: number): Phase[] {
  if (order === 'in-order' || phases.length < 2) return phases
  const random = seededRandom(seed)
  // Shuffle until the order is a different one, so "shuffled" never prints in order.
  for (let attempt = 0; ; attempt++) {
    const list = [...phases]
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    if (list.some((p, i) => p !== phases[i]) || attempt > 20) return list
  }
}

/** The phases a figure draws, in the order it draws them. */
export const figurePhases = (s: CellDivisionSettings): Phase[] =>
  s.layout === 'single' ? [s.phase] : shownOrder(stripPhases(s), s.order, s.seed)

/** Columns for a strip: as asked, or one row of up to five, then a tidy grid
 *  of up to four across (six phases as 3 × 2, nine as 3 × 3). */
export function columnsFor(count: number, perRow: (typeof PER_ROW)[number]) {
  if (perRow !== 'auto') return Math.max(1, Math.min(count, Number(perRow)))
  if (count <= 5) return count
  const rows = Math.ceil(count / 4)
  return Math.ceil(count / rows)
}
