// An analog pH meter: a needle swinging over a dial marked 0 to 14, and
// where things sit on the drawing.

import { PH_MAX, PH_MIN } from './readings'

/** The dial's arc sweeps this far either side of straight up. */
const HALF_SWEEP = Math.PI / 4

/** Where things sit on the meter, in drawing units. The needle pivots at
 *  the bottom of the window; the scale's arc runs round it, its marks
 *  standing outward from the arc and the numbers outside them. */
export const ANALOG_METER = {
  width: 420,
  height: 330,
  pivot: { x: 150, y: 226 },
  /** the arc the marks stand on */
  radius: 140,
  window: { left: 28, right: 272, top: 50, bottom: 240 },
  tick: { major: 11, medium: 8, minor: 6 },
  /** the numbers' centers, out from the arc */
  labelOut: 20,
  /** the needle's tip, out from the arc, over the marks */
  needleOut: 9,
  /** the electrode's center line */
  electrode: 360,
}

/** The needle's angle from straight up at `pH`, 0 at the left end. */
export const angleAt = (pH: number) => -HALF_SWEEP + ((pH - PH_MIN) / (PH_MAX - PH_MIN)) * 2 * HALF_SWEEP

/** The point `out` beyond the arc (inside it when negative) at `pH`. */
export function dialPoint(pH: number, out = 0) {
  const a = angleAt(pH)
  const r = ANALOG_METER.radius + out
  return { x: ANALOG_METER.pivot.x + r * Math.sin(a), y: ANALOG_METER.pivot.y - r * Math.cos(a) }
}

/** Drawing units along the arc per pH unit. */
export const perPh = (ANALOG_METER.radius * 2 * HALF_SWEEP) / (PH_MAX - PH_MIN)
