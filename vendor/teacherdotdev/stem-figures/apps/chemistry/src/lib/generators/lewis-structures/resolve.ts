// From what the teacher typed to the correct structures: a structure from
// the list when the formula or name is listed, otherwise one built around a
// central atom (ADR 0003), placed for the chosen shape, or an atom on its own.

import { correctStructures, findCentral, starSkeleton, type Rule, type Skeleton } from './build'
import { ELEMENTS, octetOf } from './elements'
import { formulaText, parseFormula, type Formula } from './formula'
import { placeStar, type Shape } from './layout'
import { LISTED, type Listed } from './listed'
import { electronKey, type Structure } from './structure'

export type Resolved =
  | {
      ok: true
      formula: Formula
      /** the formula for sentences and labels, e.g. "SO₄²⁻" */
      name: string
      listed?: Listed
      /** listed structures sharing the typed formula, to choose between */
      choices: Listed[]
      /** a built structure's central atom */
      central?: number
      /** the correct structures under the rule: the resonance structures, all placed alike */
      correct: Structure[]
      /** whether the other structure rule would build something else */
      ruleMatters: boolean
    }
  | { ok: false; message: string; request: boolean }

export interface ResolveInput {
  formula: string
  /** which listed structure, when several share the formula */
  which: string
  rule: Rule
  shape: Shape
}

const listedFormula = new Map<string, { formula: Formula; written: string[] }>(
  LISTED.map((l) => {
    const read = (text: string) => {
      const parsed = parseFormula(text)
      if (!parsed.ok) throw new Error(`Listed ${l.id}: ${parsed.message}`)
      return parsed.formula
    }
    return [l.id, { formula: read(l.formula), written: [l.formula, ...(l.aliases ?? [])].map((t) => read(t).written) }]
  }),
)

export const listedSkeleton = (l: Listed): Skeleton => ({ atoms: l.atoms.map(([element]) => element), bonds: l.bonds, charge: l.charge ?? 0 })

/** The same structure with a listed structure's positions for the shape. */
function placeListed(s: Structure, l: Listed, shape: Shape): Structure {
  const positions = shape === 'shaped' && l.shaped ? l.shaped : l.atoms.map(([, x, y]) => [x, y])
  return { ...s, atoms: s.atoms.map((a, i) => ({ ...a, x: positions[i][0], y: positions[i][1] })) }
}

/** The correct structures, placed like the first of them. */
function placeBuilt(all: Structure[], central: number, shape: Shape) {
  const first = placeStar(all[0], central, shape)
  return all.map((s) => ({ ...s, atoms: s.atoms.map((a, i) => ({ ...a, x: first.atoms[i].x, y: first.atoms[i].y })) }))
}

/** Why an atom on its own can't take its charge: it would lose more
 *  electrons than it has, or have more than it has room for. */
function tooCharged(f: Formula, name: string) {
  const [element] = f.atoms
  const { valence } = ELEMENTS[element]
  const electrons = valence - f.charge
  return electrons < 0
    ? `${name} would lose more than ${element}’s ${valence} valence electron${valence === 1 ? '' : 's'}.`
    : `${name} would have ${electrons} valence electrons, but ${element} only has room for ${octetOf(element)}.`
}

const differs = (a: Structure[], b: Structure[]) => a.map(electronKey).join(' ') !== b.map(electronKey).join(' ')

export function resolve({ formula: typed, which, rule, shape }: ResolveInput): Resolved {
  const other: Rule = rule === 'octet' ? 'fewest' : 'octet'
  const byName = LISTED.find((l) => l.names.includes(typed.trim().toLowerCase()))
  const parsed = byName ? { ok: true as const, formula: listedFormula.get(byName.id)!.formula } : parseFormula(typed)
  if (!parsed.ok) return { ok: false, message: parsed.message, request: false }
  const f = parsed.formula

  const exact = byName ?? LISTED.find((l) => listedFormula.get(l.id)!.written.includes(f.written))
  const sharing = exact ? [] : LISTED.filter((l) => listedFormula.get(l.id)!.formula.composition === f.composition)
  const listed = exact ?? sharing.find((l) => l.id === which) ?? sharing[0]
  if (listed) {
    const skeleton = listedSkeleton(listed)
    const correct = correctStructures(skeleton, rule).map((s) => placeListed(s, listed, shape))
    const lf = listedFormula.get(listed.id)!.formula
    return {
      ok: true,
      formula: lf,
      name: formulaText(lf),
      listed,
      choices: sharing.length > 1 ? sharing : [],
      correct,
      ruleMatters: differs(correct, correctStructures(skeleton, other)),
    }
  }

  const name = formulaText(f)
  const central = findCentral(f)
  if (!central.ok)
    return {
      ok: false,
      message:
        central.reason === 'acid'
          ? `In acids like ${name}, H bonds to O, and ${name} isn’t in the list yet.`
          : `${name} has more than one central atom, and it isn’t in the list yet.`,
      request: true,
    }
  const skeleton = starSkeleton(f, central.central)
  const built = correctStructures(skeleton, rule)
  if (!built.length && f.atoms.length === 1) return { ok: false, message: tooCharged(f, name), request: false }
  if (!built.length) return { ok: false, message: `${name} can’t be drawn as a correct Lewis structure with one central atom.`, request: true }
  return {
    ok: true,
    formula: f,
    name,
    choices: [],
    central: central.central,
    correct: placeBuilt(built, central.central, shape),
    ruleMatters: differs(built, correctStructures(skeleton, other)),
  }
}

export type Found = Extract<Resolved, { ok: true }>

/** The elements a built structure's central atom can be changed to: any
 *  other element in it, H included, since H in the middle is a common
 *  mistake. None for a diatomic or a listed structure. */
export const centralChoices = (r: Found) =>
  r.central === undefined || r.formula.atoms.length < 3 ? [] : [...new Set(r.formula.atoms)].filter((a) => a !== r.formula.atoms[r.central!])

/** A built structure rebuilt around another central atom, with its
 *  electrons placed as well as they can be, and the element that should be
 *  in the middle; undefined when the element isn't one it can change to. */
export function aroundCentral(r: Found, element: string, rule: Rule, shape: Shape) {
  if (!centralChoices(r).includes(element)) return undefined
  const central = r.formula.atoms.indexOf(element)
  const [s] = correctStructures(starSkeleton(r.formula, central), rule, false)
  if (!s) return undefined
  return { structure: placeStar(s, central, shape), shouldBe: r.formula.atoms[r.central!] }
}
