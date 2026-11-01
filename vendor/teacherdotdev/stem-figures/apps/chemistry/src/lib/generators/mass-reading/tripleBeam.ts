// A 610 g triple beam balance. Three riders add up to the mass: one in the
// notches of the 0–500 g beam (every 100 g), one in the notches of the
// 0–100 g beam (every 10 g), and one sliding along the 0–10 g beam, which is
// marked every 0.1 g and read to 0.01 g.

export const TRIPLE_BEAM_CAPACITY = 610
export const TRIPLE_BEAM_DECIMALS = 2

export interface Riders {
  hundreds: number
  tens: number
  front: number
}

export function roundTripleBeam(grams: number): number {
  const clamped = Math.min(TRIPLE_BEAM_CAPACITY, Math.max(0, grams))
  return Number(clamped.toFixed(TRIPLE_BEAM_DECIMALS))
}

/** Where the riders sit for a mass. Each notched rider takes as much as it
 *  can, so 610 g is 500 + 100 + 10. Counted in hundredths of a gram. */
export function splitRiders(grams: number): Riders {
  let left = Math.round(roundTripleBeam(grams) * 100)
  const hundreds = Math.min(5, Math.floor(left / 10000))
  left -= hundreds * 10000
  const tens = Math.min(10, Math.floor(left / 1000))
  left -= tens * 1000
  return { hundreds: hundreds * 100, tens: tens * 10, front: left / 100 }
}

/** A mass a teacher might set, from 1 g to 600 g. */
export const randomTripleBeamMass = (random: () => number = Math.random) => roundTripleBeam(1 + random() * 599)
