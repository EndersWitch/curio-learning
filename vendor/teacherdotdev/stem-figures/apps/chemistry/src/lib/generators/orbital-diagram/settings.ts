// Orbital Diagram's settings, as they appear in the page address: the atom or
// ion, how to draw it, what to leave for the student, and the teacher's
// changes to its orbitals (ADR 0004).

import { figureTextFields } from '$lib/shared/figureText'
import { bool, choice, defineSettings, json, number } from '$lib/shared/settings'
import { checkDiagram, VERDICT_NAMES } from './check'
import {
  CONFIGURATION_RULES,
  SUBLEVEL_ORDERS,
  type ConfigurationRule,
  atomConfiguration,
  chargeText,
  configurationParts,
  electronCount,
  ionConfiguration,
  speciesName,
  writtenConfiguration,
} from './configuration'
import { FILL_NAMES, MAX_EXTRA, buildDiagram, changedOrbitals, diagramConfiguration, emptied, tidyChanges, type Changes } from './diagram'
import { MAX_Z, element } from './elements'
import type { Run } from './layout'

export const MIN_CHARGE = -4
export const MAX_CHARGE = 8

export const ARROW_STYLES = ['full', 'half'] as const
export type ArrowStyle = (typeof ARROW_STYLES)[number]

export const ORBITAL_STYLES = ['squares', 'lines'] as const
export type OrbitalStyle = (typeof ORBITAL_STYLES)[number]

/** The sublevels side by side in rows, or stacked by energy. */
export const ARRANGEMENTS = ['row', 'energy'] as const
export type Arrangement = (typeof ARRANGEMENTS)[number]

/** Text on the figure: written out, a blank line for students, or none. */
export const TEXT_MODES = ['text', 'blank', 'none'] as const
export type TextMode = (typeof TEXT_MODES)[number]

export const orbitalSettings = defineSettings(
  {
    z: number({ min: 1, max: MAX_Z, fallback: 8 }),
    charge: number({ min: MIN_CHARGE, max: MAX_CHARGE, fallback: 0 }),
    rule: choice(CONFIGURATION_RULES, 'real'),
    order: choice(SUBLEVEL_ORDERS, 'filling'),
    core: bool(false),
    arrows: choice(ARROW_STYLES, 'full'),
    orbitals: choice(ORBITAL_STYLES, 'squares'),
    arrangement: choice(ARRANGEMENTS, 'row'),
    symbol: choice(TEXT_MODES, 'text'),
    labels: choice(TEXT_MODES, 'text'),
    electrons: bool(true),
    configLine: choice(TEXT_MODES, 'none'),
    extra: number({ min: 0, max: MAX_EXTRA, fallback: 0 }),
    changes: json<Changes>({}, (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Changes) : undefined)),
    ...figureTextFields(),
  },
  (s) => {
    const z = Math.round(s.z)
    // never fewer than no electrons, nor more than the diagram has sublevels for
    const charge = Math.min(z, Math.max(z - MAX_Z, Math.round(s.charge)))
    const fixed = { ...s, z, charge, extra: Math.round(s.extra) }
    return { ...fixed, changes: tidyChanges(s.changes, groundState(fixed), fixed) }
  },
)

export type OrbitalSettings = typeof orbitalSettings.defaults

// written out rather than picked from OrbitalSettings, which the settings'
// own rules use it to work out
export function groundState(s: { z: number; charge: number; rule: ConfigurationRule }) {
  return ionConfiguration(s.z, s.charge, s.rule)
}

export const species = (s: Pick<OrbitalSettings, 'z' | 'charge'>) => speciesName(s.z, s.charge)

/** The diagram as the teacher set it up, with its changes. */
export const teacherDiagram = (s: OrbitalSettings) => buildDiagram(groundState(s), s, s.changes)

/** The diagram the figure draws: the teacher's, or its orbitals emptied. */
export const drawnDiagram = (s: OrbitalSettings) => (s.electrons ? teacherDiagram(s) : emptied(teacherDiagram(s)))

/** The changes that still apply: to drawn sublevels, and not back to the
 *  ground state. The page sets changes directly, so they're tidied here too. */
export const liveChanges = (s: OrbitalSettings) => tidyChanges(s.changes, groundState(s), s)

export const isChanged = (s: OrbitalSettings) => Object.keys(liveChanges(s)).length > 0

export const changeCount = (s: OrbitalSettings) => changedOrbitals(liveChanges(s), groundState(s))

export const checkSettings = (s: OrbitalSettings) =>
  checkDiagram(teacherDiagram(s), { ground: groundState(s), atom: atomConfiguration(s.z, s.rule), charge: s.charge, species: species(s) })

/** The configuration the figure's configuration line writes: the drawn
 *  diagram's, so it matches a changed diagram. */
export function drawnConfigurationText(s: OrbitalSettings) {
  const ground = groundState(s)
  return writtenConfiguration(diagramConfiguration(teacherDiagram(s), ground), s.order, s.core)
}

/** The answer key's lines: the species and its ground state, e.g.
 *  "Fe²⁺: [Ar] 3d⁶", then for a changed diagram whether it's an excited
 *  state or not allowed and each mistake. */
export function answerLines(s: OrbitalSettings): string[] {
  const ground = groundState(s)
  const first = `${species(s)}: ${electronCount(ground) ? writtenConfiguration(ground, s.order, s.core) : 'no electrons'}`
  if (!isChanged(s) || !s.electrons) return [first]
  const { verdict, mistakes } = checkSettings(s)
  return [first, VERDICT_NAMES[verdict], ...mistakes]
}

/** The symbol as the figure draws it, with the charge raised. */
export function symbolRuns(s: Pick<OrbitalSettings, 'z' | 'charge'>): Run[] {
  const charge = chargeText(s.charge)
  return [{ text: element(s.z).symbol }, ...(charge ? [{ text: charge, sup: true }] : [])]
}

/** The configuration line as the figure draws it: the drawn diagram's
 *  configuration, so it matches a changed diagram. */
export function configRuns(s: OrbitalSettings): Run[] {
  const drawn = diagramConfiguration(teacherDiagram(s), groundState(s))
  const parts = configurationParts(drawn, s.order, s.core)
  const runs: Run[] = parts.core ? [{ text: `[${parts.core}]` }] : []
  for (const sub of parts.sublevels) runs.push({ text: `${runs.length ? ' ' : ''}${sub.name}` }, { text: String(sub.electrons), sup: true })
  return runs
}

/** What the figure shows, for screen readers. */
export function figureLabel(s: OrbitalSettings): string {
  const diagram = drawnDiagram(s)
  const who = s.symbol === 'text' ? ` for ${species(s)}` : s.symbol === 'blank' ? ' with a blank for the symbol' : ''
  const core = diagram.core ? ` [${diagram.core}] core, then` : ''
  const orbitals = diagram.sublevels
    .map((sub) =>
      s.electrons ? `${sub.name}: ${sub.orbitals.map((fill) => FILL_NAMES[fill]).join(', ')}` : `${sub.name}: ${sub.orbitals.length} empty`,
    )
    .join('; ')
  const labels = s.labels === 'blank' ? ' Sublevel labels are blank.' : ''
  const line =
    s.configLine === 'text' ? ` Written under it: ${drawnConfigurationText(s)}.` : s.configLine === 'blank' ? ' A blank line for the configuration.' : ''
  const stacked = s.arrangement === 'energy' ? ', its sublevels stacked by energy' : ''
  return `An orbital diagram${who}${stacked}:${core} ${orbitals}.${labels}${line}`
}
