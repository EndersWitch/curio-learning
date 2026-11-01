// Which chromosomes, and which chromatids, are in which cell at each phase of
// mitosis and meiosis. This is the biology; ./layout.ts decides where things
// go on the drawing.
//
// A cell starts with n homologous pairs (2n chromosomes). Each pair has a
// maternal (m) and a paternal (p) member. After DNA replication each
// chromosome is two sister chromatids, 0 and 1, joined at the centromere.
// Crossing over (prophase I) swaps the far end of one arm between the two
// inner, nonsister chromatids of a tetrad: maternal chromatid 1 and paternal
// chromatid 0. Each chromatid remembers whose DNA its tip is, so the swap is
// carried into every later cell. Checked against OpenStax Biology 2e, 10.2
// and 11.1.

export const PROCESSES = ['mitosis', 'meiosis'] as const
export type Process = (typeof PROCESSES)[number]

export const MITOSIS_PHASES = ['g1', 'g2', 'prophase', 'prometaphase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis'] as const
export const MEIOSIS_PHASES = [
  'interphase',
  'prophase-1',
  'prometaphase-1',
  'metaphase-1',
  'anaphase-1',
  'telophase-1',
  'prophase-2',
  'prometaphase-2',
  'metaphase-2',
  'anaphase-2',
  'telophase-2',
  'products',
] as const
export type MitosisPhase = (typeof MITOSIS_PHASES)[number]
export type MeiosisPhase = (typeof MEIOSIS_PHASES)[number]
export type Phase = MitosisPhase | MeiosisPhase
export const PHASES = [...MITOSIS_PHASES, ...MEIOSIS_PHASES] as const

export const phasesOf = (process: Process): readonly Phase[] => (process === 'mitosis' ? MITOSIS_PHASES : MEIOSIS_PHASES)

/** Each phase's name in the settings and the answer key. */
export const PHASE_NAMES: Record<Phase, string> = {
  g1: 'Interphase (G1)',
  g2: 'Interphase (G2)',
  prophase: 'Prophase',
  prometaphase: 'Prometaphase',
  metaphase: 'Metaphase',
  anaphase: 'Anaphase',
  telophase: 'Telophase',
  cytokinesis: 'Cytokinesis',
  interphase: 'Interphase',
  'prophase-1': 'Prophase I',
  'prometaphase-1': 'Prometaphase I',
  'metaphase-1': 'Metaphase I',
  'anaphase-1': 'Anaphase I',
  'telophase-1': 'Telophase I',
  'prophase-2': 'Prophase II',
  'prometaphase-2': 'Prometaphase II',
  'metaphase-2': 'Metaphase II',
  'anaphase-2': 'Anaphase II',
  'telophase-2': 'Telophase II',
  products: 'Four haploid cells',
}

/** The name printed under a phase on the figure: both interphases are just
 *  "Interphase", as a student would label them. */
export const phaseLabel = (phase: Phase) => (phase === 'g1' || phase === 'g2' ? 'Interphase' : PHASE_NAMES[phase])

/** The same moment in the other process, for switching between them. */
export function matchingPhase(phase: Phase, process: Process): Phase {
  const list = phasesOf(process)
  if (list.includes(phase)) return phase
  if (process === 'meiosis') {
    if (phase === 'g1' || phase === 'g2') return 'interphase'
    if (phase === 'cytokinesis') return 'telophase-1'
    return `${phase}-1` as Phase
  }
  if (phase === 'interphase') return 'g2'
  if (phase === 'products') return 'cytokinesis'
  return phase.replace(/-[12]$/, '') as Phase
}

export type Origin = 'm' | 'p'

export interface Chromatid {
  /** which homologous pair, 0 the largest */
  pair: number
  /** whose chromosome it belongs to, by its centromere */
  homolog: Origin
  sister: 0 | 1
  /** whose DNA the far end of its long arm is: not its homolog's after crossing over */
  tip: Origin
}

export interface Chromosome {
  pair: number
  homolog: Origin
  /** two sister chromatids once replicated, one before replication or once separated */
  chromatids: Chromatid[]
}

/** How the chromosomes look and what the cell is doing, which the drawing follows. */
export type Stage = 'interphase' | 'prophase' | 'prometaphase' | 'metaphase' | 'anaphase' | 'telophase' | 'divided'

export interface Cell {
  /** the chromosomes heading to the left pole and to the right one in anaphase
   *  and telophase; just one group otherwise */
  groups: Chromosome[][]
}

export interface PhaseState {
  phase: Phase
  stage: Stage
  /** homologs lie side by side as tetrads (prophase I to metaphase I) */
  paired: boolean
  /** the centrosomes each cell has, for interphase: one in G1, two in G2 */
  centrosomes: 1 | 2
  /** the cells, left to right */
  cells: Cell[]
}

export const DIPLOID_NUMBERS = ['2', '4', '6', '8'] as const
export type DiploidNumber = (typeof DIPLOID_NUMBERS)[number]

const ORIGINS: Origin[] = ['m', 'p']

/** Which homolog of a pair goes to the left pole in anaphase I. Pairs line up
 *  independently of one another, so they alternate here and every daughter
 *  cell gets some of each parent's chromosomes. */
export const leftHomolog = (pair: number): Origin => (pair % 2 === 0 ? 'm' : 'p')

/** The two chromatids of a tetrad that cross over: the inner, nonsister ones. */
export const crossesOver = (c: Pick<Chromatid, 'homolog' | 'sister'>) =>
  (c.homolog === 'm' && c.sister === 1) || (c.homolog === 'p' && c.sister === 0)

const other = (o: Origin): Origin => (o === 'm' ? 'p' : 'm')

/** A cell's chromosomes before replication: one chromatid each. */
function unreplicated(pairs: number): Chromosome[] {
  const list: Chromosome[] = []
  for (let pair = 0; pair < pairs; pair++)
    for (const homolog of ORIGINS) list.push({ pair, homolog, chromatids: [{ pair, homolog, sister: 0, tip: homolog }] })
  return list
}

/** After the S phase: two sister chromatids each, with crossing over done if asked. */
function replicated(pairs: number, crossed = false): Chromosome[] {
  return unreplicated(pairs).map(({ pair, homolog }) => ({
    pair,
    homolog,
    chromatids: ([0, 1] as const).map((sister) => ({
      pair,
      homolog,
      sister,
      tip: crossed && crossesOver({ homolog, sister }) ? other(homolog) : homolog,
    })),
  }))
}

/** Separate sister chromatids: each becomes a chromosome of its own. */
const sisters = (list: Chromosome[], sister: 0 | 1): Chromosome[] =>
  list.map((c) => ({ pair: c.pair, homolog: c.homolog, chromatids: c.chromatids.filter((t) => t.sister === sister) }))

/** The homologs going to the left pole in anaphase I, or to the right. */
const homologs = (list: Chromosome[], side: 'left' | 'right') =>
  list.filter((c) => (c.homolog === leftHomolog(c.pair)) === (side === 'left'))

/** What is in each cell at a phase, for 2n = 2 × `pairs` chromosomes. */
export function phaseState(phase: Phase, pairs: number, crossingOver = false): PhaseState {
  const base = { phase, paired: false, centrosomes: 2 as const }
  const one = (stage: Stage, list: Chromosome[], more: Partial<PhaseState> = {}): PhaseState => ({
    ...base,
    stage,
    cells: [{ groups: [list] }],
    ...more,
  })
  const parent = replicated(pairs)

  switch (phase) {
    case 'g1':
      return one('interphase', unreplicated(pairs), { centrosomes: 1 })
    case 'g2':
    case 'interphase':
      return one('interphase', parent)
    case 'prophase':
    case 'prometaphase':
    case 'metaphase':
      return one(phase, parent)
    case 'anaphase':
    case 'telophase':
      return { ...base, stage: phase, cells: [{ groups: [sisters(parent, 0), sisters(parent, 1)] }] }
    case 'cytokinesis':
      return { ...base, stage: 'divided', cells: [{ groups: [sisters(parent, 0)] }, { groups: [sisters(parent, 1)] }] }
  }

  // Meiosis. Crossing over happens in prophase I, so every cell from then on
  // carries it.
  const tetrads = replicated(pairs, crossingOver)
  const left = homologs(tetrads, 'left')
  const right = homologs(tetrads, 'right')
  switch (phase) {
    case 'prophase-1':
    case 'prometaphase-1':
    case 'metaphase-1':
      return one(phase.slice(0, -2) as Stage, tetrads, { paired: true })
    case 'anaphase-1':
    case 'telophase-1':
      return { ...base, stage: phase.slice(0, -2) as Stage, cells: [{ groups: [left, right] }] }
    case 'prophase-2':
    case 'prometaphase-2':
    case 'metaphase-2':
      return { ...base, stage: phase.slice(0, -2) as Stage, cells: [{ groups: [left] }, { groups: [right] }] }
    case 'anaphase-2':
    case 'telophase-2':
      return {
        ...base,
        stage: phase.slice(0, -2) as Stage,
        cells: [left, right].map((list) => ({ groups: [sisters(list, 0), sisters(list, 1)] })),
      }
    case 'products':
      return {
        ...base,
        stage: 'divided',
        cells: [sisters(left, 0), sisters(left, 1), sisters(right, 0), sisters(right, 1)].map((list) => ({ groups: [list] })),
      }
  }
}

/** The chromosomes a count label is for: each cell's, except in anaphase and
 *  telophase, where it is each set heading to a pole, the cells to be. */
export function countedGroups(state: PhaseState): Chromosome[][][] {
  const perGroup = state.stage === 'anaphase' || state.stage === 'telophase'
  return state.cells.map((cell) => (perGroup ? cell.groups : [cell.groups.flat()]))
}

/** "2n = 4" or "n = 2" for a set of chromosomes (counted by centromeres),
 *  or "4 chromosomes". */
export function countText(chromosomes: Chromosome[], pairs: number, mode: 'ploidy' | 'count') {
  const count = chromosomes.length
  if (mode === 'count') return `${count} chromosome${count === 1 ? '' : 's'}`
  const sets = count / pairs
  return `${sets === 1 ? '' : sets}n = ${count}`
}
