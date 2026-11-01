// A generator's settings, declared once: each field's default and what values
// it allows. From that come tidying (for a link, a stored preset or the undo
// history) and the page address, which carries only what differs from the
// defaults so a figure can be bookmarked or shared.
//
//   const coil = defineSettings({ turns: int(8, 1, 20), mirror: bool(false) })

import { cleanLabel, decodeLabel, encodeLabel, type Label } from './label'

export interface Field<T> {
  default: T
  clean(value: unknown): T
  encode(value: T): string
  decode(raw: string): unknown
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** A whole number from min to max. */
export const int = (def: number, min: number, max: number): Field<number> => ({
  default: def,
  clean: (v) => {
    const n = Number(v)
    return v === null || v === '' || !Number.isFinite(n) ? def : clamp(Math.round(n), min, max)
  },
  encode: String,
  decode: Number,
})

/** Any number from min to max, like a size. */
export const number = (def: number, min: number, max: number): Field<number> => ({
  default: def,
  clean: (v) => {
    const n = Number(v)
    return v === null || v === '' || !Number.isFinite(n) ? def : clamp(Math.round(n * 100) / 100, min, max)
  },
  encode: String,
  decode: Number,
})

/** One of a list of choices. */
export const choice = <const T extends string>(def: T, options: readonly T[]): Field<T> => ({
  default: def,
  clean: (v) => (options.includes(v as T) ? (v as T) : def),
  encode: String,
  decode: String,
})

export const bool = (def: boolean): Field<boolean> => ({
  default: def,
  clean: (v) => (typeof v === 'boolean' ? v : def),
  encode: (v) => (v ? '1' : '0'),
  decode: (raw) => (raw === '1' ? true : raw === '0' ? false : undefined),
})

export const label = (def: Label): Field<Label> => ({
  default: def,
  clean: (v) => cleanLabel(v, def),
  encode: encodeLabel,
  decode: (raw) => decodeLabel(raw, def),
})

type Spec = Record<string, Field<any>>
export type SettingsOf<S extends Spec> = { -readonly [K in keyof S]: S[K]['default'] }

// In a page address a list is one key: rows split by ";", a row's fields by
// ",", in the order the row declares them, with trailing fields left off when
// they're the row's defaults. So new fields go at the end of a row, and old
// links keep working. Inside a field, "\" escapes a comma, semicolon or "\".
// Any other "\" is itself, so a label's \vec{F} reads as written.
const escapePart = (s: string) => s.replace(/[,;]|\\(?=[\\,;]|$)/g, (c) => `\\${c}`)

function splitRows(raw: string): string[][] {
  const rows: string[][] = [[]]
  let part = ''
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (c === '\\' && /[\\,;]/.test(raw[i + 1] ?? '')) part += raw[++i]
    else if (c === ',') (rows.at(-1)!.push(part), (part = ''))
    else if (c === ';') (rows.at(-1)!.push(part), rows.push([]), (part = ''))
    else part += c
  }
  rows.at(-1)!.push(part)
  return rows
}

/**
 * A list of up to `max` rows, each with the fields in `row`, like a Free Body
 * Diagram's forces. An empty list is written as an empty value, so a link can
 * say "none" when the default list has rows. A list with fewer than `min`
 * rows is filled up from the default's.
 */
export function list<const S extends Spec>(row: S, def: SettingsOf<S>[], max: number, min = 0): Field<SettingsOf<S>[]> {
  const fields = Object.entries(row)
  const cleanRow = (v: unknown) => {
    const r = v as Record<string, unknown>
    return Object.fromEntries(fields.map(([key, f]) => [key, f.clean(r[key])])) as SettingsOf<S>
  }
  const rowDefaults = fields.map(([, f]) => f.encode(f.default))
  return {
    default: def,
    clean: (v) => {
      if (!Array.isArray(v)) return structuredClone(def)
      const rows = v
        .filter((r) => r && typeof r === 'object')
        .slice(0, max)
        .map(cleanRow)
      return [...rows, ...structuredClone(def.slice(rows.length, min))]
    },
    encode: (rows) =>
      rows
        .map((r) => {
          const parts = fields.map(([key, f]) => f.encode(r[key]))
          while (parts.length > 1 && parts.at(-1) === rowDefaults[parts.length - 1]) parts.pop()
          return parts.map(escapePart).join(',')
        })
        .join(';'),
    decode: (raw) =>
      raw === ''
        ? []
        : splitRows(raw).map((parts) =>
            Object.fromEntries(fields.map(([key, f], i) => [key, i < parts.length ? f.decode(parts[i]) : f.default])),
          ),
  }
}

/**
 * Settings a generator no longer has, still read from old links and presets:
 * `fields` reads them from a page address, and `upgrade` turns raw settings
 * that have them into today's (leaving any others as they are).
 */
export interface Legacy {
  fields: Spec
  upgrade(raw: Record<string, unknown>): Record<string, unknown>
}

export function defineSettings<const S extends Spec>(spec: S, legacy?: Legacy) {
  type Settings = SettingsOf<S>
  const entries = Object.entries(spec) as [keyof Settings & string, Field<any>][]
  const defaults = Object.fromEntries(entries.map(([key, f]) => [key, structuredClone(f.default)])) as Settings
  const upgrade = (raw: Record<string, unknown>) => (legacy ? legacy.upgrade(raw) : raw)

  /** Tidy raw values (from a form, a link or storage) into usable settings. */
  function clean(raw: unknown): Settings {
    const r = upgrade((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>)
    return Object.fromEntries(entries.map(([key, f]) => [key, f.clean(r[key])])) as Settings
  }

  const encoded = (s: Settings) => entries.map(([key, f]) => [key, f.encode(s[key])] as const)
  const defaultEncoded = new Map(encoded(defaults))

  function toQuery(s: Settings): string {
    const params = new URLSearchParams()
    for (const [key, value] of encoded(s)) if (value !== defaultEncoded.get(key)) params.set(key, value)
    return params.toString()
  }

  function fromParams(params: URLSearchParams): Settings {
    const raw: Record<string, unknown> = {}
    for (const [key, f] of [...entries, ...Object.entries(legacy?.fields ?? {})]) if (params.has(key)) raw[key] = f.decode(params.get(key)!)
    return clean({ ...defaults, ...upgrade(raw) })
  }

  /** Do two settings draw the same figure? */
  const same = (a: Settings, b: Settings) => toQuery(clean(a)) === toQuery(clean(b))

  return { defaults, clean, toQuery, fromParams, same }
}

export type SettingsDef<T> = {
  defaults: T
  clean(raw: unknown): T
  toQuery(s: T): string
  fromParams(params: URLSearchParams): T
  same(a: T, b: T): boolean
}
