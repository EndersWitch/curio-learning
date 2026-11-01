// An element's photoelectron spectrum: one peak per sublevel of its ground
// state (Orbital Diagram's configuration, exceptions and all), as tall as the
// sublevel's electrons, at its binding energy.

import { atomConfiguration, FILLING_ORDER } from '../orbital-diagram/configuration'
import { element } from '../orbital-diagram/elements'
import { MJ_PER_EV, bindingEnergies } from './energies'

export const UNITS = ['MJ/mol', 'eV'] as const
export type Unit = (typeof UNITS)[number]

export interface Peak {
  /** e.g. "2p" */
  sublevel: string
  electrons: number
  /** in the unit asked for */
  energy: number
}

/** A binding energy in MJ/mol, in `unit`. */
export const inUnit = (mj: number, unit: Unit) => (unit === 'eV' ? mj / MJ_PER_EV : mj)

/** The peaks of element `z`'s spectrum, highest binding energy first. */
export function peaksOf(z: number, unit: Unit): Peak[] {
  const config = atomConfiguration(z)
  const energies = bindingEnergies(z)
  return FILLING_ORDER.filter((s) => config[s.name] && energies[s.name])
    .map((s) => ({ sublevel: s.name, electrons: config[s.name], energy: inUnit(energies[s.name], unit) }))
    .sort((a, b) => b.energy - a.energy)
}

/**
 * A binding energy as a label writes it, to about three significant figures
 * the way the textbook table does: 104, 84.0, 6.84, 0.52.
 */
export function energyText(v: number) {
  if (v >= 1000) return Math.round(v).toLocaleString('en-US')
  if (v >= 100) return String(Math.round(v))
  if (v >= 10) return v.toFixed(1)
  return v.toFixed(2)
}

/** "sodium" */
export const elementName = (z: number) => element(z).name.toLowerCase()
