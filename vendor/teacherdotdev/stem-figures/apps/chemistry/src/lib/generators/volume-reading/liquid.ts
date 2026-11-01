// The liquid inside a volume instrument: its color, and the shape of its
// meniscus (the curved surface, read at its bottom).

export const LIQUID_TINTS = ['gray', 'blue', 'red', 'green'] as const
export type LiquidTint = (typeof LIQUID_TINTS)[number]

export const LIQUID_TINT_NAMES: Record<LiquidTint, string> = { gray: 'Gray', blue: 'Blue', red: 'Red', green: 'Green' }

/** Gray prints well on a photocopier; the colors are for slides. */
export const LIQUID_COLORS: Record<LiquidTint, { fill: string; surface: string }> = {
  gray: { fill: '#dcdcdc', surface: '#444' },
  blue: { fill: '#bfdbfe', surface: '#1d4ed8' },
  red: { fill: '#fecaca', surface: '#b91c1c' },
  green: { fill: '#bbf7d0', surface: '#15803d' },
}

/** The meniscus from the left wall to the right: it climbs `depth` up each
 *  wall and curves in one continuous bowl, its bottom exactly at `y` in the
 *  middle. */
export function meniscusCurve(left: number, right: number, y: number, depth: number) {
  const w = right - left
  const mid = left + w / 2
  const top = y - depth
  return (
    `M ${left} ${top} C ${left + 0.04 * w} ${y - 0.4 * depth} ${left + 0.22 * w} ${y} ${mid} ${y} ` +
    `C ${right - 0.22 * w} ${y} ${right - 0.04 * w} ${y - 0.4 * depth} ${right} ${top}`
  )
}

/** The meniscus in a wide vessel like a beaker: flat across the middle at
 *  `y`, climbing `depth` up each wall only within `edge` of it. */
export function flatMeniscusCurve(left: number, right: number, y: number, depth: number, edge: number) {
  const top = y - depth
  return (
    `M ${left} ${top} C ${left + 0.15 * edge} ${y - 0.3 * depth} ${left + 0.45 * edge} ${y} ${left + edge} ${y} ` +
    `H ${right - edge} C ${right - 0.45 * edge} ${y} ${right - 0.15 * edge} ${y - 0.3 * depth} ${right} ${top}`
  )
}
