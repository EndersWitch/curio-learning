// Every choice the teacher makes on the Projectile Motion Generator, with its
// default: the first projectile every student meets, a ball kicked at 45°
// from level ground.

import { bool, choice, defineSettings, int, label, number } from '$lib/shared/settings'

/** The shallowest launch from the ground: flatter than this, the ball barely leaves it. */
export const MIN_GROUND_ANGLE = 10

export const projectileSettings = defineSettings({
  object: choice('ball', ['ball', 'dot']),
  objectSize: number(0.6, 0.3, 1.2),
  /** Launched from level ground, or from the top of a cliff and landing at its foot. */
  start: choice('ground', ['ground', 'cliff']),
  /** How tall the cliff is, in units of v₀²/g (so 0.5 is as high as the ball would go thrown straight up). */
  cliffHeight: number(0.6, 0.2, 1.5),
  /** Above the horizontal. 0° (a horizontal launch) only from a cliff. */
  angle: int(45, 0, 85),
  angleMark: bool(true),
  angleLabel: label({ mode: 'text', text: 'theta' }),
  /** The dashed path. Off for "sketch the path" questions. */
  path: bool(true),
  /** The ball again at equal time steps along the path, and letters on every one. */
  positions: int(0, 0, 8),
  letters: bool(false),
  // Vectors at the launch. Velocity and g are motion, so they're dashed.
  velocity: bool(true),
  velocityLabel: label({ mode: 'text', text: 'v_0' }),
  components: bool(false),
  xLabel: label({ mode: 'text', text: 'v_{0x}' }),
  yLabel: label({ mode: 'text', text: 'v_{0y}' }),
  gravity: bool(false),
  gravityLabel: label({ mode: 'text', text: 'g' }),
  // Marks.
  heightMark: bool(false),
  heightLabel: label({ mode: 'text', text: 'H' }),
  rangeMark: bool(false),
  rangeLabel: label({ mode: 'text', text: 'R' }),
  cliffMark: bool(false),
  cliffLabel: label({ mode: 'text', text: 'h' }),
  mirror: bool(false),
  color: bool(false),
})

export type ProjectileSettings = typeof projectileSettings.defaults

/** The launch angle as drawn: never flatter than MIN_GROUND_ANGLE from the ground. */
export const launchAngle = (s: Pick<ProjectileSettings, 'start' | 'angle'>) =>
  s.start === 'ground' ? Math.max(MIN_GROUND_ANGLE, s.angle) : s.angle
