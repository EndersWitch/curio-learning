// Volume by Displacement's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { bool, choice, defineSettings, number, text } from '$lib/shared/settings'
import { cylinderLayout } from '../volume-reading/cylinder'
import { LIQUID_TINTS } from '../volume-reading/liquid'
import {
  MARK_SPACINGS, NUMBER_SPACINGS, UNIT_SYMBOLS, VOLUME_UNITS, fitScale, formatReading, volumeScale, type CylinderSize, type ScaleChoice,
} from '../volume-reading/scale'
import { AREA_PER_RISE, OBJECTS, drawnArea, placeObject } from './objects'
import { displacedVolume, fixReadings } from './readings'

/** A magnifier never replaces the cylinders: the object has to show. */
export const DISPLACEMENT_VIEWS = ['whole', 'both'] as const
export type DisplacementView = (typeof DISPLACEMENT_VIEWS)[number]
export const DISPLACEMENT_VIEW_NAMES: Record<DisplacementView, string> = { whole: 'Cylinders only', both: 'Cylinders and magnifiers' }

/** The cylinders an object is dropped into: not the 250 or 1000 mL, which
 *  Volume Reading has but a displacement question doesn't need. */
export const DISPLACEMENT_SIZES = ['10', '25', '50', '100'] as const satisfies readonly CylinderSize[]

/** The cylinders' scale: the size's standard one unless the teacher picks
 *  other marks or numbers. */
export const cylinderScale = (s: { size: CylinderSize } & Partial<ScaleChoice>) => volumeScale({ ...s, instrument: 'cylinder', beaker: 'medium' })

export const displacementSettings = defineSettings(
  {
    size: choice(DISPLACEMENT_SIZES, '10'),
    marks: choice(MARK_SPACINGS, 'standard'),
    numbers: choice(NUMBER_SPACINGS, 'standard'),
    unit: choice(VOLUME_UNITS, 'mL'),
    before: number({ min: 0, max: 100, fallback: 4 }),
    after: number({ min: 0, max: 100, fallback: 6 }),
    /** a dotted line from the bottom of each meniscus across to the scale */
    guide: bool(false),
    tint: choice(LIQUID_TINTS, 'gray'),
    object: choice(OBJECTS, 'marbles'),
    marbles: number({ min: 1, max: 5, fallback: 2 }),
    view: choice(DISPLACEMENT_VIEWS, 'whole'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    beforeCaption: text('Before', 40),
    afterCaption: text('After', 40),
    ...figureTextFields(),
  },
  (settings) => {
    const s = { ...settings, ...fitScale({ ...settings, instrument: 'cylinder', beaker: 'medium' }) }
    return { ...s, ...fixReadings(cylinderScale(s), s.before, s.after), marbles: Math.round(s.marbles), span: Math.round(s.span) }
  },
)

export type DisplacementSettings = typeof displacementSettings.defaults

/** A volume with its unit, e.g. "4.00 mL" or "4.00 cm³". */
export const volumeText = (s: DisplacementSettings, v: number) => `${formatReading(cylinderScale(s), v)} ${UNIT_SYMBOLS[s.unit]}`

/** The answer key line, e.g. "Before: 4.00 mL · After: 6.00 mL · Object: 2.00 mL". */
export function answerLine(s: DisplacementSettings) {
  const object = displacedVolume(cylinderScale(s), s)
  return `Before: ${volumeText(s, s.before)} · After: ${volumeText(s, s.after)} · Object: ${volumeText(s, object)}`
}

/** The object in the after cylinder, in the cylinder's drawing units, and
 *  whether it had to be drawn smaller than its volume suggests to stay
 *  under water. */
export function objectInCylinder(s: DisplacementSettings) {
  const scale = cylinderScale(s)
  const at = cylinderLayout(scale, s.size)
  const inset = 3
  const room = { left: at.left + inset, right: at.right - inset, top: at.yOf(s.after) + 4, bottom: at.innerBottom - 1 }
  const area = AREA_PER_RISE * at.tubeW * displacedVolume(scale, s) * at.perMl
  const placed = placeObject(s.object, s.marbles, room, area)
  const unlimited = placeObject(s.object, s.marbles, { ...room, top: at.tubeTop }, area)
  return { placed, shrunk: drawnArea(placed) < drawnArea(unlimited) * 0.6 }
}
