// The two readings in a volume by displacement figure: the water before the
// object goes in and after. Each is read to the cylinder's estimated digit,
// and the after reading is always the higher.

import { roundReading, type Scale } from '../volume-reading/scale'

export interface Readings {
  before: number
  after: number
}

/** The smallest difference between two readings, e.g. 0.1 mL on a 100 mL cylinder. */
const stepOf = (scale: Scale) => 10 ** -scale.decimals

/** Valid readings from any typed pair: rounded, within the cylinder, and an
 *  after reading that isn't higher is pushed to one step above the before. */
export function fixReadings(scale: Scale, before: number, after: number): Readings {
  const step = stepOf(scale)
  const b = Math.min(roundReading(scale, before), roundReading(scale, scale.capacity - step))
  return { before: b, after: Math.max(roundReading(scale, after), roundReading(scale, b + step)) }
}

/** The object's volume. */
export const displacedVolume = (scale: Scale, { before, after }: Readings) =>
  Number((after - before).toFixed(scale.decimals))

/** A pair a teacher might set: 20–60% full to start, rising 5–30% of
 *  capacity, so the object always fits under water. */
export function randomReadings(scale: Scale, random: () => number = Math.random): Readings {
  const before = scale.capacity * (0.2 + random() * 0.4)
  const rise = scale.capacity * (0.05 + random() * 0.25)
  return fixReadings(scale, before, before + rise)
}
