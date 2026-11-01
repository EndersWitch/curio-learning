// A generator's settings, described once and used everywhere they travel: the
// page address (so a link opens the same figure), undo history and presets.
// Each field knows its default and how to read itself from text or from
// whatever was stored; anything it doesn't understand becomes the default.
//
//   const volume = defineSettings({ size: choice(['10', '100'], '100'), … }, fix)
//   volume.fromParams(url.searchParams)  settings from the address
//   volume.toQuery(s)                    the address query, defaults left out
//   volume.tidy(stored)                  valid settings from anything stored
//   volume.keyOf(s)                      equal exactly when two draw the same figure
//
// `fix` applies rules between fields (a reading within the chosen size, say),
// after the fields are read one by one.

/** What values a field takes, for the public reference of link parameters
 *  (src/lib/linking). Fields made by the helpers below carry it; a field made
 *  by hand, or from $shared, leaves it for its generator's linking.ts to say. */
export type FieldAbout =
  | { type: 'choice'; options: readonly string[] }
  | { type: 'number'; min: number; max: number }
  | { type: 'bool' }
  | { type: 'text'; maxLength: number }
  | { type: 'json' }
  | { type: 'format'; syntax: string }

export interface Field<T> {
  fallback: T
  about?: FieldAbout
  /** The value in a stored snapshot, or undefined if it isn't a valid one. */
  accept(value: unknown): T | undefined
  /** The value written in the address. */
  parse(text: string): T | undefined
  format(value: T): string
}

export function choice<const T extends string>(options: readonly T[], fallback: T): Field<T> {
  const accept = (v: unknown) => (options.includes(v as T) ? (v as T) : undefined)
  return { fallback, accept, parse: accept, format: (v) => v, about: { type: 'choice', options } }
}

export function number({ min, max, fallback }: { min: number; max: number; fallback: number }): Field<number> {
  const accept = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined
  return {
    fallback,
    accept,
    parse: (text) => (text.trim() === '' ? undefined : accept(Number(text))),
    format: (v) => String(v),
    about: { type: 'number', min, max },
  }
}

export function bool(fallback: boolean): Field<boolean> {
  return {
    fallback,
    accept: (v) => (typeof v === 'boolean' ? v : undefined),
    parse: (text) => (text === '1' ? true : text === '0' ? false : undefined),
    format: (v) => (v ? '1' : '0'),
    about: { type: 'bool' },
  }
}

export function text(fallback: string, maxLength = 120): Field<string> {
  const accept = (v: unknown) => (typeof v === 'string' ? v.slice(0, maxLength) : undefined)
  return { fallback, accept, parse: accept, format: (v) => v, about: { type: 'text', maxLength } }
}

/** A structured value (a list of particle kinds, say) written in the
 *  address as JSON. `tidy` makes a valid value from anything parsed or
 *  stored, or returns undefined when there's nothing usable in it. */
export function json<T>(fallback: T, tidy: (v: unknown) => T | undefined): Field<T> {
  return {
    fallback,
    accept: tidy,
    parse: (text) => {
      try {
        return tidy(JSON.parse(text))
      } catch {
        return undefined
      }
    },
    format: (v) => JSON.stringify(v),
    about: { type: 'json' },
  }
}

type Values<F> = { [K in keyof F]: F[K] extends Field<infer T> ? T : never }

export function defineSettings<F extends Record<string, Field<any>>>(
  fields: F,
  fix: (s: Values<F>) => Values<F> = (s) => s,
) {
  type S = Values<F>
  const names = Object.keys(fields) as (keyof F & string)[]

  const build = (valueOf: (name: keyof F & string, field: Field<any>) => unknown): S => {
    const s = {} as Record<string, unknown>
    for (const name of names) s[name] = valueOf(name, fields[name]) ?? fields[name].fallback
    return fix(s as S)
  }

  const defaults = build(() => undefined)

  function tidy(stored: unknown): S {
    const raw = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {}
    return build((name, field) => field.accept(raw[name]))
  }

  function fromParams(params: URLSearchParams): S {
    return build((name, field) => {
      const t = params.get(name)
      return t === null ? undefined : field.parse(t)
    })
  }

  function toQuery(s: S): string {
    const params = new URLSearchParams()
    for (const name of names) {
      const written = fields[name].format(s[name])
      if (written !== fields[name].format(defaults[name])) params.set(name, written)
    }
    return params.toString()
  }

  const keyOf = (s: S) => JSON.stringify(names.map((name) => s[name]))

  return { fields, names, defaults, tidy, fromParams, toQuery, keyOf }
}

export type Settings<D> = D extends { defaults: infer S } ? S : never
