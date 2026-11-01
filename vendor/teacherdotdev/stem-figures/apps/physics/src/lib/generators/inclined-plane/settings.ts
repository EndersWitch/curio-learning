// Every choice the teacher makes on the Inclined Plane Generator, with its
// default: the most common textbook version, a block on a 30° ramp.

import { bool, choice, defineSettings, int, label, list, number, type SettingsOf } from '$lib/shared/settings'

/** One object on the slope. New fields go at the end, so old links keep working (see `list`). */
const object = {
  label: label({ mode: 'text', text: 'm' }),
  kind: choice('block', ['block', 'ball', 'cart']),
  size: number(1, 0.5, 2),
}

export const MAX_OBJECTS = 3

/** Links from before the objects were a list had just one, set by these. */
const OLD = { object: object.kind, objectLabel: object.label, objectSize: object.size }
const old = {
  fields: OLD,
  upgrade(raw: Record<string, unknown>) {
    if ('objects' in raw || !Object.keys(OLD).some((key) => key in raw)) return raw
    const or = (key: keyof typeof OLD) => (key in raw ? raw[key] : OLD[key].default)
    return { ...raw, objects: [{ label: or('objectLabel'), kind: or('object'), size: or('objectSize') }] }
  },
}

export const inclineSettings = defineSettings(
  {
    /** The objects on the slope, from the foot up. */
    objects: list(object, [{ label: { mode: 'text', text: 'm' }, kind: 'block', size: 1 }], MAX_OBJECTS, 1),
    /** How far up the ramp the object (or the middle of a row of them) sits, from its foot (0) to its top (1). */
    position: number(0.55, 0.2, 0.85),
    /** How objects in a row are joined: by strings, or touching (pushing on each other). */
    joined: choice('string', ['string', 'touching']),
    /** How far apart objects tied in a row are, from half (0.5) to twice (2) the usual gap. */
    spacing: number(1, 0.5, 2),
    angle: int(30, 5, 60),
    angleLabel: label({ mode: 'text', text: 'theta' }),
    lengthMark: bool(false),
    lengthLabel: label({ mode: 'text', text: 'L' }),
    heightMark: bool(false),
    heightLabel: label({ mode: 'text', text: 'h' }),
    surface: choice('smooth', ['smooth', 'rough']),
    // Vectors on the object. Along-the-slope ones point up or down the slope. With a row of
    // objects, each one's gravity, normal force and friction are numbered (F_{g1}, F_{g2}…),
    // and so are the tensions and contact forces when there's more than one.
    gravity: bool(false),
    gravityLabel: label({ mode: 'text', text: 'F_g' }),
    normal: bool(false),
    normalLabel: label({ mode: 'text', text: 'F_N' }),
    friction: choice('none', ['none', 'up', 'down']),
    frictionLabel: label({ mode: 'text', text: 'F_f' }),
    /** On a row, the applied force pulls the one in front, or pushes the one at the back of objects touching. */
    applied: choice('none', ['none', 'up', 'down']),
    appliedLabel: label({ mode: 'text', text: 'F_A' }),
    /** In the strings between objects in a row. */
    tension: bool(false),
    tensionLabel: label({ mode: 'text', text: 'T' }),
    /** The pair of forces where two objects in a row touch, each pushing on the other. */
    contact: bool(false),
    contactLabel: label({ mode: 'text', text: 'P' }),
    velocity: choice('none', ['none', 'up', 'down']),
    velocityLabel: label({ mode: 'text', text: 'v' }),
    acceleration: choice('none', ['none', 'up', 'down']),
    accelerationLabel: label({ mode: 'text', text: 'a' }),
    mirror: bool(false),
    color: bool(false),
  },
  old,
)

export type InclineSettings = typeof inclineSettings.defaults
export type InclineObject = SettingsOf<typeof object>
