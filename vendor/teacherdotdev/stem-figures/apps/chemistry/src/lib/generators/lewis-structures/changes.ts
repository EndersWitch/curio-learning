// Changes: the teacher's edits to a correct structure, for a "find the
// mistake" question (see CONTEXT.md "Change"). They're kept as a list against
// the starting structure rather than the whole structure (ADR 0003), written
// in the page address as short items joined by dots: "b1_2" (bond 1 is
// double), "l0_7" (atom 0 has 7 lone electrons), "f2_m1" (atom 2 is labeled
// −1), "k_0" (no brackets), "q_m2" (the charge is written 2−).

import type { Field } from '$lib/shared/settings'
import { formalCharge, type Structure } from './structure'

export type Change =
  | { kind: 'bond'; bond: number; order: number }
  | { kind: 'lone'; atom: number; lone: number }
  | { kind: 'label'; atom: number; label: number }
  | { kind: 'brackets'; on: boolean }
  | { kind: 'charge'; label: number }

export const MAX_LONE = 8
export const MAX_ORDER = 3
const MAX_INDEX = 99
const MAX_CHARGE = 4

/** What a change is to: two changes to the same thing can't both stand. */
const target = (c: Change) =>
  c.kind === 'bond' ? `b${c.bond}` : c.kind === 'lone' ? `l${c.atom}` : c.kind === 'label' ? `f${c.atom}` : c.kind === 'brackets' ? 'k' : 'q'

const whole = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** The change itself, if it's a valid one. */
function valid(v: unknown): Change | undefined {
  if (!v || typeof v !== 'object') return undefined
  const c = v as Record<string, unknown>
  if (c.kind === 'bond' && whole(c.bond, 0, MAX_INDEX) && whole(c.order, 0, MAX_ORDER)) return { kind: 'bond', bond: c.bond as number, order: c.order as number }
  if (c.kind === 'lone' && whole(c.atom, 0, MAX_INDEX) && whole(c.lone, 0, MAX_LONE)) return { kind: 'lone', atom: c.atom as number, lone: c.lone as number }
  if (c.kind === 'label' && whole(c.atom, 0, MAX_INDEX) && whole(c.label, -MAX_CHARGE, MAX_CHARGE)) return { kind: 'label', atom: c.atom as number, label: c.label as number }
  if (c.kind === 'brackets' && typeof c.on === 'boolean') return { kind: 'brackets', on: c.on }
  if (c.kind === 'charge' && whole(c.label, -MAX_CHARGE, MAX_CHARGE)) return { kind: 'charge', label: c.label as number }
  return undefined
}

/** Valid changes only, the last one to each thing, in a fixed order. */
function tidy(list: unknown[]): Change[] {
  const byTarget = new Map<string, Change>()
  for (const item of list) {
    const c = valid(item)
    if (c) byTarget.set(target(c), c)
  }
  return [...byTarget.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, c]) => c)
}

const writeNumber = (n: number) => (n < 0 ? `m${-n}` : String(n))
const readNumber = (text: string) => (/^m?\d+$/.test(text) ? (text[0] === 'm' ? -Number(text.slice(1)) : Number(text)) : NaN)

export function formatChanges(list: Change[]) {
  return list
    .map((c) =>
      c.kind === 'bond'
        ? `b${c.bond}_${c.order}`
        : c.kind === 'lone'
          ? `l${c.atom}_${c.lone}`
          : c.kind === 'label'
            ? `f${c.atom}_${writeNumber(c.label)}`
            : c.kind === 'brackets'
              ? `k_${c.on ? 1 : 0}`
              : `q_${writeNumber(c.label)}`,
    )
    .join('.')
}

export function parseChanges(text: string): Change[] {
  return tidy(
    text.split('.').map((item) => {
      const m = item.match(/^([blfkq])(\d*)_(m?\d+)$/)
      if (!m) return undefined
      const [, kind, index, value] = m
      const i = index === '' ? NaN : Number(index)
      const n = readNumber(value)
      if (kind === 'b') return { kind: 'bond', bond: i, order: n }
      if (kind === 'l') return { kind: 'lone', atom: i, lone: n }
      if (kind === 'f') return { kind: 'label', atom: i, label: n }
      if (kind === 'k') return index === '' && (n === 0 || n === 1) ? { kind: 'brackets', on: n === 1 } : undefined
      return index === '' ? { kind: 'charge', label: n } : undefined
    }),
  )
}

/** The settings field for a list of changes. */
export function changesField(): Field<Change[]> {
  return {
    fallback: [],
    accept: (v) => (Array.isArray(v) ? tidy(v) : undefined),
    parse: parseChanges,
    format: formatChanges,
  }
}

/** The structure with the changes made; ones to atoms or bonds it doesn't have are skipped. */
export function applyChanges(base: Structure, changes: Change[]): Structure {
  const s: Structure = { ...base, atoms: base.atoms.map((a) => ({ ...a })), bonds: base.bonds.map((b) => ({ ...b })) }
  for (const c of changes) {
    if (c.kind === 'bond' && s.bonds[c.bond]) s.bonds[c.bond].order = c.order
    if (c.kind === 'lone' && s.atoms[c.atom]) s.atoms[c.atom].lone = c.lone
    if (c.kind === 'brackets') s.brackets = c.on
    if (c.kind === 'charge') s.chargeLabel = c.label
  }
  // Labels last, so they're compared with the changed structure's charges.
  for (const c of changes) if (c.kind === 'label' && s.atoms[c.atom] && c.label !== formalCharge(s, c.atom)) s.atoms[c.atom].label = c.label
  return s
}

/** The list with one more change, or without it when it sets something back
 *  to how the starting structure has it. */
export function setChange(list: Change[], change: Change, base: Structure): Change[] {
  const others = list.filter((c) => target(c) !== target(change))
  const withIt = tidy([...others, change])
  const before = applyChanges(base, others)
  const unchanged =
    change.kind === 'bond'
      ? base.bonds[change.bond]?.order === change.order
      : change.kind === 'lone'
        ? base.atoms[change.atom]?.lone === change.lone
        : change.kind === 'label'
          ? formalCharge(applyChanges(base, withIt), change.atom) === change.label
          : change.kind === 'brackets'
            ? (before.charge !== 0) === change.on
            : before.charge === change.label
  return unchanged ? tidy(others) : withIt
}
