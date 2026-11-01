// Every choice the teacher makes on the Free Body Diagram Generator, with its
// default: the first free body diagram every student draws, a dot with
// gravity and the normal force (a book resting on a table).

import { bool, choice, defineSettings, int, label, list, number, type SettingsOf } from '$lib/shared/settings'

/** One force on the body. New fields go at the end, so old links keep working (see `list`). */
const force = {
  /** Which way it points, in degrees counterclockwise from the right. */
  angle: int(0, 0, 359),
  /** Its length, relative to the others: equal forces are drawn equal. */
  length: number(1, 0.25, 2),
  label: label({ mode: 'text', text: 'F' }),
  /** An angle mark from a dashed horizontal or vertical reference line, for a force that isn't along either. */
  arc: bool(false),
  from: choice('h', ['h', 'v']),
  arcLabel: label({ mode: 'text', text: 'theta' }),
  /** Its components along the horizontal and vertical, which often give away the answer. */
  parts: bool(false),
  xLabel: label({ mode: 'text', text: 'F_x' }),
  yLabel: label({ mode: 'text', text: 'F_y' }),
}

export const MAX_FORCES = 8

const text = (t: string) => ({ mode: 'text' as const, text: t })

/** The starter buttons: each adds a force pointing the usual way, at a length that looks right beside the others. */
export const STARTERS = [
  { name: 'Gravity', angle: 270, length: 1, label: 'F_g' },
  { name: 'Normal', angle: 90, length: 1, label: 'F_N' },
  { name: 'Friction', angle: 180, length: 0.6, label: 'F_f' },
  { name: 'Tension', angle: 90, length: 1, label: 'T' },
  { name: 'Applied', angle: 0, length: 1, label: 'F_A' },
  { name: 'Spring', angle: 180, length: 0.8, label: 'F_s' },
  { name: 'Air resistance', angle: 90, length: 0.6, label: 'F_{air}' },
  { name: 'Force', angle: 0, length: 1, label: 'F' },
] as const

/** A force with every setting at its default. */
const ROW_DEFAULTS = Object.fromEntries(Object.entries(force).map(([key, f]) => [key, f.default])) as Force

export const starterForce = (s: (typeof STARTERS)[number]): Force => ({
  ...structuredClone(ROW_DEFAULTS),
  angle: s.angle,
  length: s.length,
  label: text(s.label),
})

/** Is this force along the horizontal or vertical, so it has no angle to mark and no components? */
export const onAxis = (angle: number) => angle % 90 === 0

export const fbdSettings = defineSettings({
  body: choice('dot', ['dot', 'block', 'ball', 'cart']),
  bodySize: number(1, 0.5, 2),
  forces: list(force, [starterForce(STARTERS[0]), starterForce(STARTERS[1])], MAX_FORCES),
  /** Velocity and acceleration, drawn beside the body, never on it: they aren't forces. */
  velocity: bool(false),
  velocityAngle: int(0, 0, 359),
  velocityLabel: label({ mode: 'text', text: 'v' }),
  acceleration: bool(false),
  accelerationAngle: int(0, 0, 359),
  accelerationLabel: label({ mode: 'text', text: 'a' }),
  mirror: bool(false),
  color: bool(false),
  /** How every vector's label is set: as typed, with an arrow over it (F⃗), or in bold (𝐅). */
  notation: choice('none', ['none', 'arrow', 'bold']),
})

export type FbdSettings = typeof fbdSettings.defaults
export type Force = SettingsOf<typeof force>
