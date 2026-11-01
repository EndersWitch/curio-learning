// An orbital diagram as plain data: the sublevels drawn, in order, and each
// orbital's electrons. The ground state is built from a configuration, and a
// teacher's changes replace whole sublevels (ADR 0004). Nothing here assumes
// the diagram follows the rules; the check (check.ts) says where it doesn't.

import {
  FILLING_ORDER,
  SUBLEVELS,
  electronCount,
  inOrder,
  nobleGasCore,
  type Configuration,
  type SublevelOrder,
} from './configuration'

/** An orbital's electrons, written as their spins: empty, one up, one down,
 *  a pair, or two with the same spin (which Pauli exclusion forbids). */
export const ORBITAL_FILLS = ['', 'u', 'd', 'ud', 'uu', 'dd'] as const
export type OrbitalFill = (typeof ORBITAL_FILLS)[number]

export const FILL_NAMES: Record<OrbitalFill, string> = {
  '': 'empty',
  u: 'up',
  d: 'down',
  ud: 'pair',
  uu: 'two up',
  dd: 'two down',
}

export const fillElectrons = (fill: OrbitalFill) => fill.length

export interface DrawnSublevel {
  name: string
  orbitals: OrbitalFill[]
}

export interface Diagram {
  /** the noble gas written in brackets before the orbitals, if any */
  core?: string
  sublevels: DrawnSublevel[]
}

/** Teachers' changes: the changed sublevels' orbitals, by sublevel name. */
export type Changes = Record<string, OrbitalFill[]>

/** How many more empty sublevels a diagram can show after its last filled
 *  one, so electrons can be moved up into them. */
export const MAX_EXTRA = 3

/** A sublevel's ground-state orbitals: one up electron in each orbital
 *  before any pairs, pairing from the left (Hund's rule). */
export function groundOrbitals(orbitals: number, electrons: number): OrbitalFill[] {
  return Array.from({ length: orbitals }, (_, i) => (i < electrons - orbitals ? 'ud' : i < electrons ? 'u' : ''))
}

export interface DiagramOptions {
  order: SublevelOrder
  core: boolean
  /** extra empty sublevels after the last filled one */
  extra: number
}

/** The sublevels a diagram draws: every one from 1s up to the ground
 *  state's last filled sublevel in filling order (so an ion's emptied 4s
 *  stays), then `extra` more, less the noble gas core's when it's written. */
export function drawnSublevels(config: Configuration, options: DiagramOptions) {
  const last = FILLING_ORDER.findLastIndex((s) => config[s.name])
  const upTo = Math.min(FILLING_ORDER.length - 1, Math.max(last, 0) + options.extra)
  const core = options.core ? nobleGasCore(config) : undefined
  const names = FILLING_ORDER.slice(0, upTo + 1)
    .map((s) => s.name)
    .filter((name) => !core?.sublevels.includes(name))
  return { core, names: inOrder(names, options.order) }
}

/** The diagram of a ground state, with the teacher's changes to any drawn
 *  sublevel. */
export function buildDiagram(config: Configuration, options: DiagramOptions, changes: Changes = {}): Diagram {
  const { core, names } = drawnSublevels(config, options)
  return {
    core: core?.symbol,
    sublevels: names.map((name) => ({
      name,
      orbitals: changes[name] ?? groundOrbitals(SUBLEVELS[name].orbitals, config[name] ?? 0),
    })),
  }
}

/** A drawn diagram's configuration, counting the noble gas core's electrons. */
export function diagramConfiguration(diagram: Diagram, ground: Configuration): Configuration {
  const config: Configuration = {}
  const core = diagram.core ? nobleGasCore(ground) : undefined
  for (const name of core?.sublevels ?? []) config[name] = ground[name]
  for (const s of diagram.sublevels) config[s.name] = s.orbitals.reduce((sum, fill) => sum + fillElectrons(fill), 0)
  return config
}

/** Keep only changes to drawn sublevels that differ from the ground state,
 *  with the right number of valid orbitals. */
export function tidyChanges(changes: unknown, config: Configuration, options: DiagramOptions): Changes {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return {}
  const { names } = drawnSublevels(config, options)
  const tidy: Changes = {}
  for (const name of names) {
    const orbitals = (changes as Record<string, unknown>)[name]
    if (!Array.isArray(orbitals) || orbitals.length !== SUBLEVELS[name].orbitals) continue
    if (!orbitals.every((fill) => (ORBITAL_FILLS as readonly unknown[]).includes(fill))) continue
    const ground = groundOrbitals(SUBLEVELS[name].orbitals, config[name] ?? 0)
    if (orbitals.some((fill, i) => fill !== ground[i])) tidy[name] = orbitals as OrbitalFill[]
  }
  return tidy
}

/** How many orbitals the changes make different from the ground state. */
export function changedOrbitals(changes: Changes, config: Configuration) {
  let count = 0
  for (const [name, orbitals] of Object.entries(changes)) {
    const ground = groundOrbitals(SUBLEVELS[name].orbitals, config[name] ?? 0)
    count += orbitals.filter((fill, i) => fill !== ground[i]).length
  }
  return count
}

/** A diagram with every orbital drawn empty, for students to fill in. */
export const emptied = (diagram: Diagram): Diagram => ({
  ...diagram,
  sublevels: diagram.sublevels.map((s) => ({ ...s, orbitals: s.orbitals.map(() => '' as const) })),
})

export const diagramElectrons = (diagram: Diagram, ground: Configuration) => electronCount(diagramConfiguration(diagram, ground))
