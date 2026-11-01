// How far a band runs. Within a gel's resolving range the distance from the
// well goes down in a straight line with log10 of the fragment's size, so
// smaller fragments run farther. Past either end of the range the bands crowd
// together instead: the biggest ones bunch up near the wells and the smallest
// toward the far end, still in order but harder to tell apart, as on a real
// gel.

/** The agarose percentages a gel can be. */
export const GELS = ['0.8', '1', '1.5', '2'] as const
export type Gel = (typeof GELS)[number]

/** The sizes in bp each gel separates well, from Thermo Fisher's and
 *  miniPCR's agarose tables (0.8% sits between their 0.7% and 1%). */
export const GEL_RANGES: Record<Gel, [low: number, high: number]> = {
  '0.8': [800, 10000],
  '1': [500, 10000],
  '1.5': [200, 3000],
  '2': [100, 2000],
}

/** How much of the run each crowded end takes, against the resolving
 *  range's 1. Fragments too big for the gel all crawl at about the same
 *  speed, so they bunch up tightly by the wells; small ones still separate
 *  a little as they head for the far end. */
const CROWD_BIG = 0.08
const CROWD_SMALL = 0.3

/** Squeezes t outside 0–1 into the crowded ends, smoothly, so the order of
 *  any two sizes is kept. */
function crowd(t: number) {
  if (t < 0) return -CROWD_BIG * (1 - Math.exp(t / CROWD_BIG))
  if (t > 1) return 1 + CROWD_SMALL * (1 - Math.exp(-(t - 1) / CROWD_SMALL))
  return t
}

/** How far along the run a fragment of `bp` ends up, from 0 (at the wells'
 *  end of the run) to 1 (at its far end). Always smaller for a larger size. */
export function runOf(bp: number, gel: Gel) {
  const [low, high] = GEL_RANGES[gel]
  const t = (Math.log10(high) - Math.log10(bp)) / (Math.log10(high) - Math.log10(low))
  return (crowd(t) + CROWD_BIG) / (1 + CROWD_BIG + CROWD_SMALL)
}

/** Whether a gel separates fragments of `bp` well. */
export function inRange(bp: number, gel: Gel) {
  const [low, high] = GEL_RANGES[gel]
  return bp >= low && bp <= high
}

/** A fragment in a lane: its size in bp, and how much DNA against a typical band's 1. */
export interface Band {
  bp: number
  amount: number
}

/** A band as drawn: the sizes in it (more than one where they ran together,
 *  largest first), its top and bottom, and how much DNA it holds. */
export interface DrawnBand {
  sizes: number[]
  top: number
  bottom: number
  amount: number
}

/** A band's height in px. More DNA makes it a little thicker, never thinner. */
export const BAND_H = 6
export const thicknessOf = (amount: number) => BAND_H * Math.min(1.6, Math.max(1, 1 + 0.3 * Math.log2(amount)))

/** How dark (or bright) a band is, 0 to 1: faint bands never fainter than 0.3. */
export const strengthOf = (amount: number) => Math.min(1, Math.max(0.3, Math.sqrt(amount)))

/** The smallest gap in px left between two bands for them to read as two. */
export const MIN_GAP = 2

/** A lane's bands as drawn, top down, with `y` placing a band's middle.
 *  Bands too close to leave a clear gap between them run together as one
 *  thicker band, holding all of their sizes. */
export function drawBands(bands: Band[], y: (bp: number) => number): DrawnBand[] {
  const sorted = [...bands].sort((a, b) => b.bp - a.bp)
  const drawn: DrawnBand[] = []
  let last: { mid: number; h: number } | undefined
  for (const band of sorted) {
    const mid = y(band.bp)
    const h = thicknessOf(band.amount)
    const piece = { top: mid - h / 2, bottom: mid + h / 2 }
    const current = drawn[drawn.length - 1]
    if (current && last && mid - last.mid < (last.h + h) / 2 + MIN_GAP) {
      if (!current.sizes.includes(band.bp)) current.sizes.push(band.bp)
      current.top = Math.min(current.top, piece.top)
      current.bottom = Math.max(current.bottom, piece.bottom)
      current.amount += band.amount
    } else {
      drawn.push({ sizes: [band.bp], ...piece, amount: band.amount })
    }
    last = { mid, h }
  }
  return drawn
}
