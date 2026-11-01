// What a 3D shape's settings mean: which measures the chosen shape has, each
// as a number, and the ones worked out from the others. An oblique prism or
// cylinder takes any two of its height, lean and slanted edge; a right pyramid
// or cone takes its height or its slant height. Anything the teacher should
// fix comes back as a message for the settings panel.

import { parseNumber } from '$lib/shared/math.js'
import { PYRAMID_BASES, type Base, type Measure, type Part, type Settings, type Shape } from './settings.js'

/** The shape the settings describe, with the choices that don't apply to it settled. */
export type Form = {
  shape: Shape
  base: Base
  sides: number
  /** A prism lying on its side, its base at the front. */
  lie: boolean
  oblique: boolean
  /** The parts this shape has, in the order the settings list them. */
  parts: Part[]
}

export type ShapeRead = {
  form: Form
  /** Every part's measure, typed or worked out; null when the measures don't make a shape. */
  values: Record<Part, number> | null
  given: Record<Part, number | null>
  problems: Partial<Record<Part, string>>
  problem: string | null
}

const isTriangle = (b: Base) => b === 'right' || b === 'isosceles'
const hasBase = (shape: Shape) => shape === 'prism' || shape === 'pyramid'
const canLean = (shape: Shape) => shape !== 'sphere' && shape !== 'hemisphere'

/** The choices that apply to the chosen shape. */
export function formOf(s: Settings): Form {
  const shape = s.shape
  const base: Base = shape === 'pyramid' && !PYRAMID_BASES.includes(s.base) ? 'rectangle' : s.base
  const lie = shape === 'prism' && base !== 'rectangle' && (s.pose === 'lie' || (s.pose === 'auto' && isTriangle(base)))
  const oblique = canLean(shape) && s.oblique && !lie
  const parts: Part[] = []
  if (hasBase(shape)) {
    if (base === 'rectangle') parts.push('length', 'width')
    else if (base === 'regular') parts.push('side', 'apothem')
    else if (shape === 'prism') parts.push('triBase', 'triHeight', 'hyp')
  }
  if (shape === 'cylinder' || shape === 'cone' || shape === 'sphere' || shape === 'hemisphere') parts.push('radius')
  if (canLean(shape)) parts.push('height')
  if (oblique) parts.push('lean')
  if (oblique && (shape === 'prism' || shape === 'cylinder')) parts.push('edge')
  if (!oblique && (shape === 'pyramid' || shape === 'cone')) parts.push('slant')
  return { shape, base, sides: s.sides, lie, oblique, parts }
}

/** What a part is called, in words, for the settings panel and its messages. */
export function partName(s: Settings, form: Form, k: Part): string {
  if (k === 'height' && form.lie) return 'length'
  if (k === 'radius' && s.diameter) return 'diameter'
  if (k === 'hyp') return form.base === 'right' ? 'hypotenuse' : 'slanted side'
  return NAMES[k]
}
const NAMES: Record<Part, string> = {
  length: 'length', width: 'width', triBase: 'base', triHeight: 'triangle’s height', side: 'side', apothem: 'apothem',
  radius: 'radius', height: 'height', lean: 'lean', edge: 'slanted edge', slant: 'slant height', hyp: 'hypotenuse',
}

const TYPED: Measure[] = ['length', 'width', 'triBase', 'triHeight', 'side', 'radius', 'height', 'lean', 'edge', 'slant']
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, a, b)

export function readShape(s: Settings): ShapeRead {
  const form = formOf(s)
  const has = (k: Part) => form.parts.includes(k)
  const given = {} as Record<Part, number | null>
  const problems: Partial<Record<Part, string>> = {}
  for (const k of [...TYPED, 'hyp', 'apothem'] as Part[]) given[k] = null
  for (const k of TYPED) {
    if (!has(k)) continue
    const typed = s[k].trim()
    if (!typed) continue
    const v = parseNumber(typed)
    if (v === null) problems[k] = 'Type a number, like 12, 2.5, 5/2 or 3√2.'
    else if (!(v > 0)) problems[k] = `The ${partName(s, form, k)} has to be more than 0.`
    else given[k] = v
  }
  const fail = (problem: string | null) => ({ form, values: null, given, problems, problem })
  if (Object.keys(problems).length) return fail(null)
  const name = (k: Part) => partName(s, form, k)

  // Measures every shape of this kind needs.
  const needed: Measure[] = form.parts.filter((k): k is Measure => ['length', 'width', 'triBase', 'triHeight', 'side', 'radius'].includes(k))
  if (!form.oblique && (form.shape === 'prism' || form.shape === 'cylinder')) needed.push('height')
  if (form.oblique && (form.shape === 'pyramid' || form.shape === 'cone')) needed.push('height', 'lean')
  const missing = needed.find((k) => given[k] === null)
  if (missing) return fail(`Give the ${name(missing)}.`)

  const v = { ...given } as Record<Part, number>
  if (form.base === 'right') v.hyp = Math.hypot(v.triBase, v.triHeight)
  if (form.base === 'isosceles') v.hyp = Math.hypot(v.triBase / 2, v.triHeight)
  if (has('apothem')) v.apothem = v.side / (2 * Math.tan(Math.PI / form.sides))

  // An oblique prism or cylinder: any two of its height, lean and slanted edge.
  if (form.oblique && has('edge')) {
    const [h, l, e] = [given.height, given.lean, given.edge]
    const count = [h, l, e].filter((x) => x !== null).length
    if (count < 2) return fail('Give two of the height, the lean and the slanted edge.')
    if (e !== null && ((h !== null && e <= h) || (l !== null && e <= l))) return fail('The slanted edge has to be longer than the height and the lean.')
    if (count === 3 && !near(e! * e!, h! * h! + l! * l!)) return fail('The height, lean and slanted edge don’t fit together. Clear one to have it worked out.')
    v.height = h ?? Math.sqrt(e! * e! - l! * l!)
    v.lean = l ?? Math.sqrt(e! * e! - h! * h!)
    v.edge = e ?? Math.hypot(h!, l!)
  }

  // A right pyramid or cone: its height or its slant height, down to the middle of its base's front edge.
  if (has('slant')) {
    const inner = form.shape === 'cone' ? radiusOf(s, v.radius) : form.base === 'regular' ? v.apothem : v.width / 2
    const [h, sl] = [given.height, given.slant]
    const innerName = form.shape === 'cone' ? 'the radius' : form.base === 'regular' ? 'the apothem' : 'half the width'
    if (h === null && sl === null) return fail('Give the height or the slant height.')
    if (sl !== null && sl <= inner) return fail(`The slant height has to be longer than ${innerName}.`)
    if (h !== null && sl !== null && !near(sl * sl, h * h + inner * inner)) return fail('The height and slant height don’t fit together. Clear one to have it worked out.')
    v.height = h ?? Math.sqrt(sl! * sl! - inner * inner)
    v.slant = sl ?? Math.hypot(h!, inner)
  }
  return { form, values: v, given, problems, problem: null }
}

/** The true radius, when the measure is typed as a diameter. */
export const radiusOf = (s: Pick<Settings, 'diameter'>, measure: number) => (s.diameter ? measure / 2 : measure)
