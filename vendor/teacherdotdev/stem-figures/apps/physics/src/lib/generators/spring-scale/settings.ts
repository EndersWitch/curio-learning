// Spring Scale's settings, as they appear in the page address. Forces are
// kept in newtons whatever the scale is printed in; a scale in grams shows
// and takes them as grams.

import { figureTextFields } from '$shared/figureText'
import { MAGNIFIER_VIEWS } from '$shared/magnify'
import { bool, choice, defineSettings, number, text } from '$shared/settings'
import { CAPACITIES, HANGING, SCALE_UNITS, gramsText, newtonsText, springScale, tidyForce, tidyZero } from './scale'

export const springScaleSettings = defineSettings(
  {
    capacity: choice(CAPACITIES, '10'),
    units: choice(SCALE_UNITS, 'newtons'),
    /** the force on the hook, in newtons */
    force: number({ min: 0, max: 50, fallback: 3.47 }),
    /** where the pointer sits with nothing hanging, in newtons: below zero is positive */
    zero: number({ min: -5, max: 5, fallback: 0 }),
    /** with a zero offset, draw the scale with nothing hanging beside it too */
    unloaded: bool(true),
    hanging: choice(HANGING, 'block'),
    masses: number({ min: 1, max: 5, fallback: 3 }),
    blockLabel: text('', 12),
    /** color-coded by capacity, or black and white */
    color: bool(true),
    view: choice(MAGNIFIER_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    ...figureTextFields(),
  },
  (s) => {
    const scale = springScale(s.capacity)
    const zero = tidyZero(scale, s.zero)
    return { ...s, masses: Math.round(s.masses), span: Math.round(s.span), zero, force: tidyForce(scale, zero, s.force) }
  },
)

export type SpringScaleSettings = typeof springScaleSettings.defaults

/** Where the pointer sits: the force plus the zero offset. */
export const pointerAt = (s: SpringScaleSettings) => s.force + s.zero

/** A force as the scale is printed: "3.47 N", "347 g", or "3.47 N (347 g)". */
export function forceText(s: SpringScaleSettings, n: number, signed = false) {
  const scale = springScale(s.capacity)
  if (s.units === 'grams') return gramsText(scale, n, signed)
  if (s.units === 'newtons') return newtonsText(scale, n, signed)
  return `${newtonsText(scale, n, signed)} (${gramsText(scale, n, signed)})`
}

const quantity = (s: SpringScaleSettings) => (s.units === 'grams' ? 'Mass' : 'Force')

/** The answer key, e.g. "Force: 3.47 N". With a zero offset, the reading and
 *  the offset go first, then the force they give. */
export function answerLines(s: SpringScaleSettings) {
  const result = `${quantity(s)}: ${forceText(s, s.force)}`
  if (!s.zero) return result
  return `Reading: ${forceText(s, pointerAt(s))}, zero offset: ${forceText(s, s.zero, true)}\n${result}`
}
