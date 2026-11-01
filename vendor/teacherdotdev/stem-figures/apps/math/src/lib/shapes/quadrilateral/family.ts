// A family of quadrilaterals: the kinds one generator draws (a Trapezoid
// Generator's trapezoids, isosceles trapezoids and right trapezoids, say) and
// the figure it opens with. From those it works out everything that generator
// needs: its defaults, tidying and page addresses.
//
// A page address carries the kind (when it isn't the one the generator opens
// on) and any values that differ from that kind's defaults, so a
// quadrilateral can be bookmarked or shared.

import { oneOf, queryAgainst, type RawSettings } from '$lib/shapes/parts.js'
import { kindOf, type KindId } from './kinds.js'
import { HEIGHTS, KEPT_ON_SWITCH, plain, tidy, type Settings } from './settings.js'

export type FamilyDef = {
  /** Names the generator's saved presets and undo history: "trapezoid". */
  id: string
  /** Its kinds, in the order its kind menu lists them. */
  kinds: KindId[]
  /** The kind it opens on, and that figure's labels and markings. */
  opens: KindId
  opening: Partial<Settings>
  /** False for kinds whose heights to AB are always sides (rectangles and squares), which then offer none. */
  heights?: boolean
}

export type Family = ReturnType<typeof createFamily>

export function createFamily(def: FamilyDef) {
  const openingKind = def.opens
  const DEFAULT_SETTINGS: Settings = { ...plain(openingKind), ...def.opening, kind: openingKind }

  /** The settings a kind starts with: the opening figure for the opening kind, and a plain one for the rest. */
  const defaultsFor = (kind: KindId): Settings => (kind === openingKind ? DEFAULT_SETTINGS : plain(kind))

  function cleanSettings(s: RawSettings): Settings {
    const kind = oneOf(def.kinds, s.kind, openingKind)
    const out = tidy(kind, defaultsFor(kind), s)
    if (def.heights === false) for (const h of HEIGHTS) out[h] = false
    return out
  }

  return {
    ...def,
    kinds: def.kinds.map(kindOf),
    DEFAULT_SETTINGS,
    defaultsFor,
    cleanSettings,

    /** A new kind's defaults, keeping what carries over from the current settings. */
    switchKind(s: Settings, kind: KindId): Settings {
      const next = { ...defaultsFor(kind) }
      for (const k of KEPT_ON_SWITCH) (next as RawSettings)[k] = s[k]
      return next
    },

    settingsToQuery(s: Settings): string {
      const query = queryAgainst(defaultsFor(s.kind), s)
      return s.kind === openingKind ? query : [`kind=${s.kind}`, query].filter(Boolean).join('&')
    },

    settingsFromParams(params: URLSearchParams): Settings {
      const s: RawSettings = { ...defaultsFor(cleanSettings({ kind: params.get('kind') }).kind) }
      for (const key of Object.keys(s)) if (params.has(key)) s[key] = params.get(key)
      return cleanSettings(s)
    },
  }
}
