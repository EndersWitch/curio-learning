// Bohr Model's settings, as they appear in the page address.

import { bool, choice, defineSettings, number, text, type Field } from '$lib/shared/settings'
import {
  COLORS,
  ELECTRON_SYMBOLS,
  MAX_BALLS,
  MAX_ELECTRONS,
  MAX_NUCLEONS,
  MAX_PAIRED,
  MAX_SHELLS,
  NEUTRON_SYMBOLS,
  PLACEMENTS,
  PROTON_SYMBOLS,
  nucleusBalls,
  shellPlaces,
} from './model'
import { groundStateShells } from './elements'

/** How the nucleus is drawn: proton and neutron balls, the counts as text,
 *  or an empty circle for students to fill in. */
export const NUCLEUS_STYLES = ['balls', 'text', 'blank'] as const
export type NucleusStyle = (typeof NUCLEUS_STYLES)[number]

export const MAX_SEED = 999999

const whole = (n: number, max: number) => Math.min(max, Math.max(0, Math.round(n)))

/** The electrons on each shell, innermost first, written in the address as
 *  "2-8-1". There is always at least one shell. */
function shells(fallback: number[]): Field<number[]> {
  const accept = (v: unknown) =>
    Array.isArray(v) && v.length >= 1 && v.length <= MAX_SHELLS && v.every((e) => typeof e === 'number' && Number.isFinite(e))
      ? v.map((e) => whole(e, MAX_ELECTRONS))
      : undefined
  return {
    fallback,
    accept,
    parse: (text) => (/^\d+(-\d+)*$/.test(text) ? accept(text.split('-').map(Number)) : undefined),
    format: (v) => v.join('-'),
  }
}

export const bohrSettings = defineSettings(
  {
    protons: number({ min: 0, max: MAX_NUCLEONS, fallback: 6 }),
    neutrons: number({ min: 0, max: MAX_NUCLEONS, fallback: 6 }),
    nucleus: choice(NUCLEUS_STYLES, 'balls'),
    seed: number({ min: 1, max: MAX_SEED, fallback: 1 }),
    electrons: shells([2, 4]),
    placement: choice(PLACEMENTS, 'even'),
    emptyRings: bool(false),
    protonColor: choice(COLORS, 'red'),
    protonSymbol: choice(PROTON_SYMBOLS, '+'),
    neutronColor: choice(COLORS, 'gray'),
    neutronSymbol: choice(NEUTRON_SYMBOLS, ''),
    electronColor: choice(COLORS, 'blue'),
    electronSymbol: choice(ELECTRON_SYMBOLS, ''),
    gainedLost: bool(false),
    gainedColor: choice(COLORS, 'green'),
    brackets: bool(false),
    key: bool(false),
    shellLabels: bool(false),
    titleMode: choice(['none', 'text'] as const, 'none'),
    title: text(''),
  },
  (s) => ({ ...s, protons: Math.round(s.protons), neutrons: Math.round(s.neutrons), seed: Math.round(s.seed) }),
)

export type BohrSettings = typeof bohrSettings.defaults

/** A seed for a new random nucleus. */
export const newSeed = () => 1 + Math.floor(Math.random() * MAX_SEED)

/** How the nucleus is actually drawn: balls become text past MAX_BALLS. */
export const drawnNucleus = (s: BohrSettings): NucleusStyle =>
  s.nucleus === 'balls' && s.protons + s.neutrons > MAX_BALLS ? 'text' : s.nucleus

/** The balls of a ball nucleus, or none when it isn't drawn as balls. */
export const ballsFor = (s: BohrSettings) => (drawnNucleus(s) === 'balls' ? (nucleusBalls(s.protons, s.neutrons, s.seed) ?? []) : [])

/** The protons minus the electrons: positive for a cation, negative for an
 *  anion (CONTEXT.md "Charge"). */
export const chargeOf = (s: Pick<BohrSettings, 'protons' | 'electrons'>) => s.protons - s.electrons.reduce((sum, e) => sum + e, 0)

/** The neutral atom's shells that gained and lost electrons are drawn
 *  against, when they are shown and can be: the proton count is an
 *  element's and the rings have electrons. */
export const neutralShells = (s: BohrSettings) => (s.gainedLost && !s.emptyRings ? groundStateShells(s.protons) : undefined)

/** Whether some shell has too many electrons to pair, and so is spaced evenly. */
export const pairingSkipped = (s: BohrSettings) => s.placement === 'paired' && shellPlaces(s.electrons, neutralShells(s)).some((e) => e > MAX_PAIRED)
