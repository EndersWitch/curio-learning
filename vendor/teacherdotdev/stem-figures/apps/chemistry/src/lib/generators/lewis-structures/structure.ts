// A structure is plain data: atoms with positions and lone electrons, and
// bonds with an order. It can be correct or not (see CONTEXT.md "Structure"
// and "Change"); drawing and checking never assume it is.

import { ELEMENTS } from './elements'

export interface Atom {
  element: string
  /** position in bond lengths, y down */
  x: number
  y: number
  /** electrons not in a bond, counted one at a time */
  lone: number
  /** the formal charge written beside it, when a change makes it differ from its real one */
  label?: number
}

export interface Bond {
  a: number
  b: number
  /** 0 (no bond, only after a change) to 3 */
  order: number
}

export interface Structure {
  atoms: Atom[]
  bonds: Bond[]
  /** the molecule's or ion's real charge */
  charge: number
  /** whether it's drawn in brackets, when a change makes it differ from being an ion */
  brackets?: boolean
  /** the charge written after it, when a change makes it differ from its real one */
  chargeLabel?: number
}

export const bondSum = (s: Structure, i: number) => s.bonds.reduce((n, b) => n + (b.a === i || b.b === i ? b.order : 0), 0)

/** The electrons around an atom: its lone electrons and two for every bond line. */
export const electronsAround = (s: Structure, i: number) => s.atoms[i].lone + 2 * bondSum(s, i)

export const formalCharge = (s: Structure, i: number) => ELEMENTS[s.atoms[i].element].valence - s.atoms[i].lone - bondSum(s, i)

/** The formal charge written beside an atom. */
export const shownFormalCharge = (s: Structure, i: number) => s.atoms[i].label ?? formalCharge(s, i)

/** The valence electrons the structure shows. */
export const electronsShown = (s: Structure) => s.atoms.reduce((n, a) => n + a.lone, 0) + 2 * s.bonds.reduce((n, b) => n + b.order, 0)

/** The valence electrons its atoms and charge call for. */
export const valenceElectrons = (s: Structure) => s.atoms.reduce((n, a) => n + ELEMENTS[a.element].valence, 0) - s.charge

export const hasBrackets = (s: Structure) => s.brackets ?? s.charge !== 0
export const shownCharge = (s: Structure) => s.chargeLabel ?? s.charge

/** Equal exactly when two structures put the same electrons in the same places. */
export const electronKey = (s: Structure) => s.bonds.map((b) => b.order).join('') + '|' + s.atoms.map((a) => a.lone).join(',')

export const neighbours = (s: Structure, i: number) =>
  s.bonds.filter((b) => b.order > 0 && (b.a === i || b.b === i)).map((b) => (b.a === i ? b.b : b.a))
