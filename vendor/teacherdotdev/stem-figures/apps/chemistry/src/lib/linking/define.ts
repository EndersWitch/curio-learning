// Linking to an exact figure. Every generator keeps its settings in the page
// address (src/lib/shared/settings.ts), so a link like
// /volume-reading?instrument=buret&reading=23.47 opens that exact figure.
// Each generator describes its address parameters in a linking.ts beside its
// settings.ts; this is the shape of that description, and how it becomes the
// reference on /linking, /llms.txt and /llms-full.txt.
//
// A parameter's type, allowed values and default come from the settings
// themselves wherever the field says (FieldAbout); linking.ts adds only what
// the code can't say: what it controls, when it matters, and example links.
// linking.test.ts checks every parameter is described and every example
// link opens the settings it claims to.

import type { Field, FieldAbout, Settings } from '$lib/shared/settings'

export interface ParamDoc {
  /** what it controls, in plain words */
  what: string
  /** when it has any effect, e.g. "instrument=beaker" */
  when?: string
  /** the values it takes, for a field that doesn't carry them itself (made
   *  by hand, or from $shared) */
  about?: FieldAbout
  /** said after the allowed values: units, rounding, what each value means */
  values?: string
}

/** What defineSettings() returns, as far as linking needs it. */
export interface Definition<S> {
  fields: Record<string, Field<any>>
  names: string[]
  defaults: S
  tidy(stored: unknown): S
  fromParams(params: URLSearchParams): S
  toQuery(s: S): string
  keyOf(s: S): string
}

export interface Example<S> {
  /** what the figure shows, in one line */
  shows: string
  /** the settings that differ from the defaults */
  settings: Partial<S>
}

export interface GeneratorLinking<S = any> {
  /** the generator's id in the STEM Figures catalog */
  id: string
  definition: Definition<S>
  /** how the parameters fit together, in a sentence or two */
  summary: string
  /** rules between parameters: switches, rounding, clamping */
  notes: string[]
  /** every parameter, in the order the address writes them */
  params: { [K in keyof S]-?: ParamDoc }
  examples: Example<S>[]
}

/** A generator's linking description, typed against its settings, so a
 *  parameter left out or misspelled fails type checking too. */
export const describeLinking = <D extends Definition<any>>(
  definition: D,
  doc: Omit<GeneratorLinking<Settings<D>>, 'definition'>,
): GeneratorLinking<Settings<D>> => ({ ...doc, definition })

// Turning a description into reference rows and links ----------------------

export interface ParamRow {
  name: string
  what: string
  when?: string
  type: string
  allowed: string
  default: string
}

const shown = (value: string) => (value === '' ? '(empty)' : value)

/** A field's values, from the field or from its description. */
export function aboutOf(l: GeneratorLinking, name: string): FieldAbout {
  const about = (l.params as Record<string, ParamDoc>)[name]?.about ?? l.definition.fields[name]?.about
  if (!about) throw new Error(`${l.id}: nothing says what values ${name} takes`)
  return about
}

function typeAndValues(about: FieldAbout): { type: string; allowed: string } {
  switch (about.type) {
    case 'choice':
      return { type: 'choice', allowed: about.options.map(shown).join(', ') }
    case 'number':
      return { type: 'number', allowed: `${about.min} to ${about.max}` }
    case 'bool':
      return { type: 'on/off', allowed: '1 (on) or 0 (off)' }
    case 'text':
      return { type: 'text', allowed: `up to ${about.maxLength} characters` }
    case 'json':
      return { type: 'JSON', allowed: 'JSON, URL-encoded' }
    case 'format':
      return { type: 'text', allowed: about.syntax }
  }
}

/** The reference table's rows for one generator, in address order. */
export function paramRows(l: GeneratorLinking): ParamRow[] {
  const params = l.params as Record<string, ParamDoc>
  return l.definition.names.map((name) => {
    const doc = params[name]
    const { type, allowed } = typeAndValues(aboutOf(l, name))
    const written = l.definition.fields[name].format((l.definition.defaults as Record<string, unknown>)[name])
    return {
      name,
      what: doc.what,
      when: doc.when,
      type,
      allowed: doc.values ? `${allowed}. ${doc.values}` : allowed,
      default: shown(written),
    }
  })
}

/** The settings an example draws: its settings on top of the defaults, tidied. */
export const exampleSettings = <S>(l: GeneratorLinking<S>, ex: Example<S>): S =>
  l.definition.tidy({ ...l.definition.defaults, ...ex.settings })

/** An example's address query, without the "?". */
export const exampleQuery = <S>(l: GeneratorLinking<S>, ex: Example<S>) => l.definition.toQuery(exampleSettings(l, ex))

/** An example's link from the site root, e.g. "/volume-reading?instrument=buret". */
export function exampleHref<S>(path: string, l: GeneratorLinking<S>, ex: Example<S>) {
  const query = exampleQuery(l, ex)
  return query ? `${path}?${query}` : path
}
