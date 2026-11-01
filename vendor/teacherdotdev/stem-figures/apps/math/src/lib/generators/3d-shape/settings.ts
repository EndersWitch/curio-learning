// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a 3D shape can be bookmarked or shared.
//
// Each kind of 3D shape has its own generator (the Prism Generator, the Cone
// Generator …), and they share these settings: settingsFor(kind) gives one
// generator's defaults and its page address. Measures are kept as the text
// the teacher typed ("12", "3sqrt(2)", "5/2"); readShape() in solve.ts works
// out what they mean.

import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { LABEL_MODES, ROUNDING, INK, cleanAgainst, oneOf, queryAgainst, readMoved, writeMoved, type LabelMode, type RawSettings } from '$lib/shapes/parts.js'

export { INK, LABEL_MODES, ROUNDING, readMoved, writeMoved, type LabelMode, type RawSettings }
export type { Offset } from '$lib/shapes/parts.js'

export const SHAPES = { prism: 'Prism', cylinder: 'Cylinder', pyramid: 'Pyramid', cone: 'Cone', sphere: 'Sphere', hemisphere: 'Hemisphere' }
export type Shape = keyof typeof SHAPES
/** The kinds of 3D shape with a generator each. The Sphere Generator draws hemispheres too. */
export const KINDS = ['prism', 'cylinder', 'pyramid', 'cone', 'sphere'] as const
export type Kind = (typeof KINDS)[number]
/** Which generator draws a shape: its own, or the Sphere Generator for a hemisphere. Anything else is a prism. */
export const kindOf = (shape: string | null): Kind => (shape === 'hemisphere' ? 'sphere' : KINDS.includes(shape as Kind) ? (shape as Kind) : 'prism')
/** The shapes a kind's generator can draw, its opening one first. */
export const shapesOf = (kind: Kind): Shape[] => (kind === 'sphere' ? ['sphere', 'hemisphere'] : [kind])

/** A prism's or pyramid's base. Pyramids take only a rectangle or a regular polygon. */
export const BASES = { rectangle: 'Rectangle', right: 'Right triangle', isosceles: 'Isosceles triangle', regular: 'Regular polygon' }
export type Base = keyof typeof BASES
export const PYRAMID_BASES: Base[] = ['rectangle', 'regular']
export const SIDE_COUNTS = [3, 4, 5, 6, 7, 8] // a regular base's sides

/** Every measure a 3D shape can have. Which ones a shape uses is up to solve.ts. */
export const MEASURES = ['length', 'width', 'triBase', 'triHeight', 'side', 'radius', 'height', 'lean', 'edge', 'slant'] as const
/** Measures that are only ever worked out, never typed. */
export const SOLVED_ONLY = ['hyp', 'apothem'] as const
export type Measure = (typeof MEASURES)[number]
export type Part = Measure | (typeof SOLVED_ONLY)[number]
export const PARTS: Part[] = [...MEASURES, ...SOLVED_ONLY]


export type Settings = { [K in Measure]: string } & { [K in `${Part}Label`]: LabelMode } & { [K in `${Part}Text`]: string } & {
  shape: Shape
  base: Base
  sides: number
  /** How a prism sits: "auto" lies a triangular prism down and stands the rest up. */
  pose: 'auto' | 'stand' | 'lie'
  oblique: boolean
  leanTo: 'right' | 'left'
  /** Which way the depth runs back: up to the right or up to the left. */
  depth: 'right' | 'left'
  /** The radius measure is typed and labeled as a diameter. */
  diameter: boolean
  /** A hemisphere with its flat face up, like a bowl, instead of a dome. */
  bowl: boolean
  hidden: boolean
  showHeight: boolean
  square: boolean
  names: boolean
  /** Corner names the teacher typed, separated by spaces; blank ones are lettered in order. */
  nameList: string
  unit: string
  round: number
  moved: string
  labelSize: LabelSize
}

/** The settings every kind shares; settingsFor() sets the shape and its opening measures. */
const SHARED_DEFAULTS = {
  shape: 'prism',
  base: 'rectangle',
  sides: 6,
  length: '5',
  width: '3',
  triBase: '6',
  triHeight: '4',
  side: '4',
  radius: '3',
  height: '4',
  lean: '2',
  edge: '',
  slant: '',
  ...Object.fromEntries(PARTS.flatMap((k) => [[`${k}Label`, 'auto'], [`${k}Text`, '']])),
  pose: 'auto',
  oblique: false,
  leanTo: 'right',
  depth: 'right',
  diameter: false,
  bowl: false,
  hidden: true, // hidden edges, dashed
  showHeight: true, // the dashed height of a pyramid, cone or oblique shape
  square: true, // right-angle squares
  names: false,
  nameList: '',
  unit: 'cm',
  round: 1,
  moved: '', // labels dragged from their spots: "length:4,-6;vC:0,3"
  labelSize: 'medium',
} as Settings

/** The shape each generator opens with: a 5 × 3 × 4 cm box, a 6 × 6 square pyramid, round shapes of radius 3 cm and height 4 cm. */
const OPENING: Record<Kind, Partial<Settings>> = {
  prism: {},
  cylinder: { shape: 'cylinder' },
  pyramid: { shape: 'pyramid', length: '6', width: '6' },
  cone: { shape: 'cone' },
  sphere: { shape: 'sphere' },
}

/** One generator's settings: its defaults, and how they're tidied and carried in the page address. */
export function settingsFor(kind: Kind) {
  const DEFAULT_SETTINGS = { ...SHARED_DEFAULTS, ...OPENING[kind] } as Settings
  const shapes = shapesOf(kind)

  /** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
  function cleanSettings(s: RawSettings): Settings {
    const d = DEFAULT_SETTINGS
    const out = cleanAgainst(d, s)
    for (const k of PARTS) out[`${k}Label`] = oneOf(LABEL_MODES, out[`${k}Label`], 'auto')
    out.shape = oneOf(shapes, out.shape, d.shape)
    out.base = oneOf(kind === 'pyramid' ? PYRAMID_BASES : Object.keys(BASES), out.base, d.base)
    out.sides = oneOf(SIDE_COUNTS, out.sides, d.sides)
    out.pose = oneOf(['auto', 'stand', 'lie'], out.pose, d.pose)
    out.leanTo = oneOf(['right', 'left'], out.leanTo, d.leanTo)
    out.depth = oneOf(['right', 'left'], out.depth, d.depth)
    out.round = oneOf(ROUNDING, out.round, d.round)
    out.nameList = out.nameList.split(/\s+/).map((n: string) => n.slice(0, 4)).join(' ').trim()
    out.moved = writeMoved(readMoved(out.moved))
    out.labelSize = cleanLabelSize(out.labelSize)
    return out as Settings
  }

  function settingsToQuery(s: Settings): string {
    return queryAgainst(DEFAULT_SETTINGS, s)
  }

  function settingsFromParams(params: URLSearchParams): Settings {
    const s: RawSettings = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(DEFAULT_SETTINGS)) if (params.has(key)) s[key] = params.get(key)
    return cleanSettings(s)
  }

  return { kind, shapes, DEFAULT_SETTINGS, cleanSettings, settingsToQuery, settingsFromParams }
}

export type KindSettings = ReturnType<typeof settingsFor>
