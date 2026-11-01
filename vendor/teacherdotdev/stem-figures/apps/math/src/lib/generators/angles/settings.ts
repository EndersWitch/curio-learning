// Every choice the teacher makes for an angles figure, with its default. The
// page address carries any non-default values, so a figure can be bookmarked
// or shared.
//
// The figure is rays out from one vertex. The first ray is the baseline,
// pointing right before the figure is turned; every other ray is set by its
// direction, its angle from the baseline counterclockwise, as a protractor
// reads it. A two-sided ray also runs back through the vertex, making a line.
// Each ray has an id that never changes, so what's set on an angle or a point
// stays with it while rays are added, moved or deleted.
//
// An angle is named by the two half-rays around it, counterclockwise, each a
// ray's id and which side of the vertex: "+" along its direction, "-" back
// through the vertex (a two-sided ray only). "r1+~r2+" is the angle from the
// baseline round to the second ray, and "r2+~r1+" the rest of the way round,
// so with two rays the angle and its reflex angle are named apart. A point is the vertex ("v"), or near the end of a ray: "r2:end" at its
// tip, "r2:start" at the other end of a two-sided ray.
//
// In the page address each ray is one value, like r=r2|dir=60|twoSided=1, each
// angle one too, like a=r1+~r2+|label=measure|mark=1, and each point
// pt=v|name=G.

import { parseNumber } from '$lib/shared/math.js'
import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { LINE_STYLES, ROUNDING, oneOf, type LineStyle, type RawSettings } from '$lib/shapes/parts.js'
import { ANGLE_DEFAULTS, ANGLE_LABELS, CAPS, MARKS, SHADES, type AngleStyle, type Cap } from '../parallel-lines/settings.js'

export type { AngleStyle, Cap, LineStyle, RawSettings }
export { ANGLE_DEFAULTS }

/** An angle's key: from one half-ray, counterclockwise, to the next. */
export const angleKey = (from: string, to: string) => `${from}~${to}`

export const MIN_RAYS = 2
export const MAX_RAYS = 6

/**
 * One ray out from the vertex. `direction` is as typed (the baseline's is
 * always 0). `endCap` finishes its tip; `startCap` finishes the other end of a
 * two-sided ray, and does nothing on a one-sided one, which starts at the vertex.
 */
export type Ray = { id: string; direction: string; twoSided: boolean; startCap: Cap; endCap: Cap; style: LineStyle }

export type Settings = {
  rays: Ray[]
  angles: Record<string, AngleStyle>
  points: Record<string, string>
  turn: number
  round: number
  labelSize: LabelSize
}

const RAY_DEFAULTS = { twoSided: false, startCap: 'triangle' as Cap, endCap: 'triangle' as Cap, style: 'solid' as LineStyle }
export const newRay = (id: string, direction: string): Ray => ({ id, direction, ...RAY_DEFAULTS })

/** The baseline's id: the first ray, which can't be deleted. */
export const BASELINE = 'r1'

// A 60° angle with its measure and an arc, so the figure says what it is at a glance.
const DEFAULT_ANGLES: Record<string, AngleStyle> = { 'r1+~r2+': { ...ANGLE_DEFAULTS, label: 'measure', mark: '1' } }

export const DEFAULT_SETTINGS: Settings = {
  rays: [newRay(BASELINE, '0'), newRay('r2', '60')],
  angles: DEFAULT_ANGLES,
  points: {},
  turn: 0,
  round: 1,
  labelSize: 'medium',
}

const cleanName = (v: unknown) => String(v ?? '').replace(/[|=]/g, '').slice(0, 4)
const cleanId = (v: unknown) => (/^r\d{1,3}$/.test(String(v)) ? String(v) : '')
const num = (v: unknown, fallback: number) => (v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : fallback)
const bool = (v: unknown) => v === true || v === '1' || v === 'true'

/** The next free id for a new ray. */
export const nextId = (rays: Ray[]) => `r${1 + Math.max(0, ...rays.map((r) => Number(r.id.slice(1)) || 0))}`

/** The ray ids an angle's or a point's key is made from. */
export const idsIn = (key: string): string[] => key.match(/r\d+/g) ?? []

const ANGLE_KEY = /^r\d+[+-]~r\d+[+-]$/
const POINT_KEY = /^(v|r\d+:(start|end))$/

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s: RawSettings): Settings {
  const d = DEFAULT_SETTINGS
  const raw = (Array.isArray(s.rays) && s.rays.length ? s.rays : d.rays).slice(0, MAX_RAYS)
  const used = new Set<string>()
  let next = 1 + Math.max(1, ...raw.map((r: any) => Number(cleanId(r?.id).slice(1)) || 0))
  const rays: Ray[] = raw.map((r: any, i: number) => {
    // The first ray is always the baseline, at 0°.
    let id = i === 0 ? BASELINE : cleanId(r?.id)
    if (!id || used.has(id) || (i > 0 && id === BASELINE)) id = `r${next++}`
    used.add(id)
    return {
      id,
      direction: i === 0 ? '0' : String(r?.direction ?? '').slice(0, 20),
      twoSided: bool(r?.twoSided),
      startCap: oneOf(Object.keys(CAPS) as Cap[], r?.startCap, 'triangle'),
      endCap: oneOf(Object.keys(CAPS) as Cap[], r?.endCap, 'triangle'),
      style: oneOf(Object.keys(LINE_STYLES) as LineStyle[], r?.style, 'solid'),
    }
  })
  const out: Settings = {
    rays,
    angles: {},
    points: {},
    turn: Math.max(-180, Math.min(180, Math.round(num(s.turn, d.turn)))),
    round: oneOf(ROUNDING, num(s.round, d.round), d.round),
    labelSize: cleanLabelSize(s.labelSize),
  }
  // Only what belongs to half-rays that are there: a "-" half needs a two-sided ray.
  const byId = new Map(rays.map((r) => [r.id, r]))
  const half = (h: string) => byId.has(h.slice(0, -1)) && (h.endsWith('+') || byId.get(h.slice(0, -1))!.twoSided)
  for (const [key, a] of Object.entries((s.angles ?? {}) as Record<string, any>)) {
    const sides = key.split('~')
    if (!ANGLE_KEY.test(key) || sides[0] === sides[1] || !sides.every(half)) continue
    const style: AngleStyle = {
      label: oneOf(ANGLE_LABELS, a?.label, 'none'),
      text: String(a?.text ?? '').slice(0, 40),
      mark: oneOf(MARKS, a?.mark, 'none'),
      shade: oneOf(SHADES.map((_, i) => i), num(a?.shade, 0), 0),
    }
    if (style.label !== 'none' || style.mark !== 'none' || style.shade || style.text) out.angles[key] = style
  }
  for (const [key, name] of Object.entries((s.points ?? {}) as Record<string, any>)) {
    if (!POINT_KEY.test(key)) continue
    const [id, end] = key.split(':')
    if (key !== 'v' && !(byId.has(id) && (end === 'end' || byId.get(id)!.twoSided))) continue
    out.points[key] = cleanName(name)
  }
  return out
}

/** One value of the page address: the first part, then key=value for anything not the default. */
function joinParts(first: string, values: Record<string, unknown>, defaults: Record<string, unknown>) {
  const parts = Object.entries(values)
    .filter(([k, v]) => v !== defaults[k])
    .map(([k, v]) => `${k}=${typeof v === 'boolean' ? (v ? '1' : '0') : typeof v === 'string' ? encodeURIComponent(v) : v}`)
  return [first, ...parts].join('|')
}
function splitParts(value: string): [string, Record<string, string>] {
  const [first, ...rest] = String(value).split('|')
  const values: Record<string, string> = {}
  for (const part of rest) {
    const i = part.indexOf('=')
    if (i <= 0) continue
    try {
      values[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1))
    } catch {
      values[part.slice(0, i)] = part.slice(i + 1)
    }
  }
  return [first, values]
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function settingsToQuery(s: Settings): string {
  const d = DEFAULT_SETTINGS
  const params = new URLSearchParams()
  for (const key of ['turn', 'round', 'labelSize'] as const) {
    if (s[key] !== d[key]) params.set(key, String(s[key]))
  }
  // The rays only when they aren't the opening ones; then all of them, in order.
  // A ray's direction is always written, so a blank one isn't mistaken for the default.
  if (!same(s.rays, d.rays)) {
    for (const r of s.rays) {
      const { id, direction, ...rest } = r
      params.append('r', joinParts(id, { dir: direction, ...rest }, { ...RAY_DEFAULTS, dir: null }))
    }
  }
  // The angles only when they aren't the opening ones; an empty "a" says there are none.
  if (!same(s.angles, d.angles)) {
    const entries = Object.entries(s.angles)
    for (const [key, a] of entries) params.append('a', joinParts(key, a, ANGLE_DEFAULTS))
    if (!entries.length) params.append('a', '')
  }
  for (const [key, name] of Object.entries(s.points)) params.append('pt', joinParts(key, { name }, { name: '' }))
  return params.toString()
}

export function settingsFromParams(params: URLSearchParams): Settings {
  const s: RawSettings = structuredClone(DEFAULT_SETTINGS)
  for (const key of ['turn', 'round', 'labelSize']) if (params.has(key)) s[key] = params.get(key)
  if (params.has('r')) {
    s.rays = params.getAll('r').map((v) => {
      const [id, { dir, ...values }] = splitParts(v)
      return { ...RAY_DEFAULTS, ...values, direction: dir ?? '', id }
    })
  }
  if (params.has('a')) {
    s.angles = Object.fromEntries(params.getAll('a').filter(Boolean).map(splitParts).map(([key, values]) => [key, { ...ANGLE_DEFAULTS, ...values }]))
  }
  s.points = Object.fromEntries(params.getAll('pt').map(splitParts).map(([key, values]) => [key, values.name ?? '']))
  return cleanSettings(s)
}

/** A ray's direction in degrees, or what to fix about it. */
export function readDirection(typed: string): number | string {
  if (!typed.trim()) return 'Give the ray a direction.'
  const v = parseNumber(typed)
  if (v === null) return 'Type a number of degrees, like 60 or 147.5.'
  if (v < 0 || v >= 360) return 'Type a direction from 0° up to 360°.'
  return v
}

/** Directions on a circle, 0 up to 360. */
const around = (deg: number) => ((deg % 360) + 360) % 360
const SAME_WAY = 1e-6

/**
 * Every ray that can be drawn, with its direction in degrees, and what to fix
 * about any that can't: a direction that isn't one, or a ray pointing the
 * same way as an earlier one (either side of a two-sided ray counts).
 */
export function readRays(s: Settings) {
  const problems: Record<string, string> = {}
  const rays: { ray: Ray; theta: number }[] = []
  const taken: number[] = []
  const clash = (deg: number) => taken.some((t) => Math.abs(around(deg - t + 180) - 180) < SAME_WAY)
  for (const ray of s.rays) {
    const v = ray.id === BASELINE ? 0 : readDirection(ray.direction)
    if (typeof v === 'string') {
      problems[ray.id] = v
      continue
    }
    if (clash(v) || (ray.twoSided && clash(v + 180))) {
      problems[ray.id] = 'Another ray already points this way.'
      continue
    }
    taken.push(v)
    if (ray.twoSided) taken.push(around(v + 180))
    rays.push({ ray, theta: v })
  }
  return { rays, problems }
}

const NEW_DIRECTIONS = ['120', '150', '30', '90', '135', '45', '105', '75', '165', '15']

/** A direction for a new ray: the first of a few common ones that's free. */
export function freeDirection(s: Settings) {
  const { rays } = readRays(s)
  const taken = rays.flatMap(({ ray, theta }) => (ray.twoSided ? [theta, around(theta + 180)] : [theta]))
  return NEW_DIRECTIONS.find((d) => !taken.some((t) => Math.abs(around(Number(d) - t + 180) - 180) < SAME_WAY)) ?? '100'
}
