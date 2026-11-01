// An object from Volume by Displacement sitting on a balance's pan, drawn
// the same way so one object can be weighed in one figure and measured in
// the other. Unlike in the cylinder, it's always the same size: a rock is a
// rock whatever it weighs.

import { CYLINDER_ASPECT, OBJECTS, ROCK_ASPECT, ROCK_FILL, cubeArea, cylinderArea, placeObject, type ObjectKind, type Placed } from '../volume-by-displacement/objects'

/** What can sit on the pan besides the balance's own contents. */
export const PAN_OBJECTS = ['none', ...OBJECTS] as const
export type PanObject = (typeof PAN_OBJECTS)[number]

const MARBLE_D = 30
const ROCK_W = 96
const CUBE_SIDE = 56
const CYLINDER_D = 32
/** The area placeObject draws each object with to make it that size. */
const AREA: Record<ObjectKind, (marbles: number) => number> = {
  marbles: (n) => (n * Math.PI * MARBLE_D ** 2) / 4,
  rock: () => (ROCK_W ** 2 * ROCK_FILL) / ROCK_ASPECT,
  cube: () => cubeArea(CUBE_SIDE),
  cylinder: () => cylinderArea(CYLINDER_D, CYLINDER_ASPECT * CYLINDER_D),
}

/** Where `kind` goes on a pan whose top surface is centered at (cx, top):
 *  resting on it, with marbles side by side. */
export function objectOnPan(kind: ObjectKind, marbles: number, pan: { cx: number; top: number }): Placed {
  const half = (5 * MARBLE_D) / 2
  const room = { left: pan.cx - half, right: pan.cx + half, top: pan.top - 90, bottom: pan.top }
  return placeObject(kind, marbles, room, AREA[kind](Math.max(1, Math.round(marbles))))
}
