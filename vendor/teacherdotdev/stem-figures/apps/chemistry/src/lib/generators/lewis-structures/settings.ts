// Lewis Structures' settings, as they appear in the page address, and what
// the figure shows for them.

import { figureTextFields } from '$lib/shared/figureText'
import { bool, choice, defineSettings, number, text } from '$lib/shared/settings'
import { RULES } from './build'
import { BOND_STYLES } from './drawing'
import { applyChanges, changesField, type Change } from './changes'
import { findMistakes } from './check'
import { SHAPES } from './layout'
import { aroundCentral, resolve, type ResolveInput, type Resolved } from './resolve'
import type { Structure } from './structure'

/** How much of the structure a "complete this" question gives the student
 *  (see CONTEXT.md "Scaffold"). */
export const SCAFFOLDS = ['full', 'bonds', 'skeleton'] as const
export type Scaffold = (typeof SCAFFOLDS)[number]

/** One resonance structure, or all of them joined by ↔. */
export const RESONANCES = ['one', 'all'] as const
export type Resonance = (typeof RESONANCES)[number]

export const MAX_FORMULA = 40
const MAX_FORMS = 99

export const lewisSettings = defineSettings(
  {
    formula: text('H2O', MAX_FORMULA),
    which: text('', MAX_FORMULA),
    rule: choice(RULES, 'octet'),
    resonance: choice(RESONANCES, 'one'),
    form: number({ min: 1, max: MAX_FORMS, fallback: 1 }),
    shape: choice(SHAPES, 'flat'),
    bondStyle: choice(BOND_STYLES, 'lines'),
    formalCharges: bool(false),
    scaffold: choice(SCAFFOLDS, 'full'),
    central: text('', 2),
    changes: changesField(),
    ...figureTextFields(),
  },
  (s) => ({ ...s, form: Math.round(s.form) }),
)

export type LewisSettings = typeof lewisSettings.defaults

export interface Figure {
  /** the settings as drawn: a changed structure is one structure in full,
   *  since a figure is either a "complete this" question or a "find the
   *  mistake" one, and an atom on its own has no bonds or formal charges */
  settings: LewisSettings
  resolved: Resolved
  /** the structure changes start from, when there is one */
  start?: Structure
  /** the structures drawn, left to right: several for all resonance structures */
  shown: Structure[]
  /** the changes that apply: formal charge labels only while they're drawn */
  changes: Change[]
  /** whether the teacher changed the structure, its central atom included */
  changed: boolean
  /** whether a change put another atom in the middle */
  centralChanged: boolean
  /** a changed structure's mistakes */
  mistakes: string[]
  /** what the answer key under the figure shows */
  key: { kind: 'none' } | { kind: 'structures'; structures: Structure[] } | { kind: 'mistakes'; mistakes: string[] }
}

/** The last few structures found, since every setting redraws the figure
 *  but only these four change the structure. */
const found = new Map<string, Resolved>()
function resolveOnce(input: ResolveInput) {
  const key = JSON.stringify([input.formula, input.which, input.rule, input.shape])
  let r = found.get(key)
  if (!r) {
    r = resolve(input)
    if (found.size >= 8) found.delete(found.keys().next().value!)
    found.set(key, r)
  }
  return r
}

export function figureOf(asked: LewisSettings): Figure {
  const resolved = resolveOnce(asked)
  if (!resolved.ok) return { settings: asked, resolved, shown: [], changes: [], changed: false, centralChanged: false, mistakes: [], key: { kind: 'none' } }

  const forms = resolved.correct
  // An atom on its own has no bonds to give without its electrons, and its
  // only charge is the one written after it.
  const settings: LewisSettings =
    forms[0].atoms.length === 1 ? { ...asked, formalCharges: false, scaffold: asked.scaffold === 'bonds' ? 'skeleton' : asked.scaffold } : asked
  const form = forms[Math.min(settings.form, forms.length) - 1]
  const around = settings.central ? aroundCentral(resolved, settings.central, settings.rule, settings.shape) : undefined
  const changes = settings.formalCharges ? settings.changes : settings.changes.filter((c) => c.kind !== 'label')
  const changed = changes.length > 0 || around !== undefined
  const s: LewisSettings = changed ? { ...settings, scaffold: 'full', resonance: 'one' } : settings
  const start = around?.structure ?? form
  const shown = changed ? [applyChanges(start, changes)] : s.resonance === 'all' ? forms : [form]

  const mistakes = changed
    ? findMistakes({ structure: shown[0], correct: forms, name: resolved.name, rule: s.rule, formalCharges: s.formalCharges, shouldBeCentral: around?.shouldBe })
    : []
  const key: Figure['key'] = !s.answerKey
    ? { kind: 'none' }
    : changed
      ? { kind: 'mistakes', mistakes }
      : s.scaffold !== 'full'
        ? { kind: 'structures', structures: shown }
        : { kind: 'none' }
  return { settings: s, resolved, start, shown, changes, changed, centralChanged: around !== undefined, mistakes, key }
}
