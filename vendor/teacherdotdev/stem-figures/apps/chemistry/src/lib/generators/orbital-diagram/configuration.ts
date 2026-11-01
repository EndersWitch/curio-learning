// Ground-state configurations: how many electrons each sublevel of an atom or
// ion holds, from the filling order, the exceptions table and the rule for
// which electrons a cation loses (see CONTEXT.md "Orbital diagrams").

import { EXCEPTIONS, NOBLE_GASES, element } from './elements'

export const LETTERS = ['s', 'p', 'd', 'f'] as const

export interface Sublevel {
  /** e.g. "3d" */
  name: string
  /** the shell, 1–7 */
  n: number
  /** s 0, p 1, d 2, f 3 */
  l: number
  /** how many orbitals it has: 1, 3, 5 or 7 */
  orbitals: number
}

const sublevel = (n: number, l: number): Sublevel => ({ name: `${n}${LETTERS[l]}`, n, l, orbitals: 2 * l + 1 })

/** Every sublevel up to 7p in filling order: lower n + l first, and lower n
 *  first when n + l is the same. */
export const FILLING_ORDER: Sublevel[] = (() => {
  const all: Sublevel[] = []
  for (let n = 1; n <= 7; n++) for (let l = 0; l < Math.min(n, 4); l++) all.push(sublevel(n, l))
  return all.filter((s) => s.n + s.l <= 8).sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n)
})()

export const SUBLEVELS: Record<string, Sublevel> = Object.fromEntries(FILLING_ORDER.map((s) => [s.name, s]))

/** Where a sublevel comes in the filling order. */
export const fillingIndex = (name: string) => FILLING_ORDER.findIndex((s) => s.name === name)

/** The ground-state configuration's rule for exceptions: the real ground
 *  state, or what the filling order predicts (CONTEXT.md "Configuration rule"). */
export const CONFIGURATION_RULES = ['real', 'filling'] as const
export type ConfigurationRule = (typeof CONFIGURATION_RULES)[number]

/** Electrons per sublevel, by sublevel name. Sublevels without electrons may
 *  be left out or be 0. */
export type Configuration = Record<string, number>

/** Fill `electrons` electrons in filling order. */
export function fillInOrder(electrons: number): Configuration {
  const config: Configuration = {}
  let left = electrons
  for (const s of FILLING_ORDER) {
    if (left <= 0) break
    config[s.name] = Math.min(left, 2 * s.orbitals)
    left -= config[s.name]
  }
  return config
}

export const isException = (z: number) => z in EXCEPTIONS

/** A neutral atom's ground state. */
export function atomConfiguration(z: number, rule: ConfigurationRule = 'real'): Configuration {
  const config = fillInOrder(z)
  return rule === 'real' && isException(z) ? { ...config, ...EXCEPTIONS[z] } : config
}

export const electronCount = (config: Configuration) => Object.values(config).reduce((sum, e) => sum + e, 0)

/** An atom or ion's ground state. A cation loses electrons from its
 *  sublevel with the highest n first, and the highest l within that n (so Fe
 *  loses 4s before 3d, and Sn 5p before 5s); an anion gains them by going on
 *  in filling order. */
export function ionConfiguration(z: number, charge: number, rule: ConfigurationRule = 'real'): Configuration {
  const config = atomConfiguration(z, rule)
  if (charge > 0) {
    let lose = Math.min(charge, z)
    const byLoss = FILLING_ORDER.filter((s) => config[s.name]).sort((a, b) => b.n - a.n || b.l - a.l)
    for (const s of byLoss) {
      const lost = Math.min(lose, config[s.name])
      config[s.name] -= lost
      lose -= lost
    }
  } else if (charge < 0) {
    let gain = -charge
    for (const s of FILLING_ORDER) {
      const room = 2 * s.orbitals - (config[s.name] ?? 0)
      const gained = Math.min(gain, room)
      if (gained) config[s.name] = (config[s.name] ?? 0) + gained
      gain -= gained
      if (!gain) break
    }
  }
  return config
}

/** The electrons of a configuration's noble gas core: the largest noble gas
 *  with fewer electrons than it, whose sublevels the configuration fills.
 *  Undefined when there isn't one (H, He, and ions with 2 or fewer). */
export function nobleGasCore(config: Configuration): { z: number; symbol: string; sublevels: string[] } | undefined {
  const electrons = electronCount(config)
  for (const z of [...NOBLE_GASES].reverse()) {
    if (z >= electrons) continue
    const core = fillInOrder(z)
    if (Object.entries(core).every(([name, e]) => (config[name] ?? 0) === e))
      return { z, symbol: element(z).symbol, sublevels: Object.keys(core) }
  }
  return undefined
}

/** The ways to order a diagram's sublevels: filling order, or by shell (3d
 *  before 4s). */
export const SUBLEVEL_ORDERS = ['filling', 'shell'] as const
export type SublevelOrder = (typeof SUBLEVEL_ORDERS)[number]

export function inOrder(names: string[], order: SublevelOrder): string[] {
  const subs = names.map((name) => SUBLEVELS[name])
  if (order === 'shell') subs.sort((a, b) => a.n - b.n || a.l - b.l)
  else subs.sort((a, b) => fillingIndex(a.name) - fillingIndex(b.name))
  return subs.map((s) => s.name)
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** A number or charge as superscript characters, with a true minus sign. */
export const superscript = (text: string) =>
  [...text].map((c) => (c >= '0' && c <= '9' ? SUPERSCRIPTS[Number(c)] : c === '+' ? '⁺' : c === '-' ? '⁻' : c)).join('')

/** A charge as written after a symbol: "2+", "−", "3−", or "" for 0. */
export function chargeText(charge: number) {
  if (!charge) return ''
  const size = Math.abs(charge) === 1 ? '' : String(Math.abs(charge))
  return `${size}${charge > 0 ? '+' : '−'}`
}

/** "Fe²⁺", "O", "Cl⁻" */
export const speciesName = (z: number, charge: number) => `${element(z).symbol}${superscript(chargeText(charge).replace('−', '-'))}`

/** The written configuration's parts, e.g. [{ core: 'Ar' }, { sublevel: '4s', electrons: 2 }, …],
 *  so a figure can draw the superscripts itself. Sublevels with no electrons
 *  are left out, except that an atom or ion with none writes "1s⁰". */
export function configurationParts(
  config: Configuration,
  order: SublevelOrder,
  core: boolean,
): { core?: string; sublevels: { name: string; electrons: number }[] } {
  const found = core ? nobleGasCore(config) : undefined
  const names = inOrder(
    Object.keys(config).filter((name) => config[name] && !found?.sublevels.includes(name)),
    order,
  )
  const sublevels = names.map((name) => ({ name, electrons: config[name] }))
  if (!found && !sublevels.length) sublevels.push({ name: '1s', electrons: 0 })
  return { core: found?.symbol, sublevels }
}

/** The configuration as a line of text, e.g. "[Ar] 4s² 3d⁶". */
export function writtenConfiguration(config: Configuration, order: SublevelOrder = 'filling', core = false) {
  const parts = configurationParts(config, order, core)
  return [...(parts.core ? [`[${parts.core}]`] : []), ...parts.sublevels.map((s) => `${s.name}${superscript(String(s.electrons))}`)].join(' ')
}
