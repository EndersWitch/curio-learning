// The shapes of chromosomes: each chromatid is a thick line along a center
// line, in pieces by whose DNA each part is, so a crossed-over tip shows in
// its own shade. Lengths are in drawing units; the figure is scaled to fit.
//
// A chromosome is posed by its centromere. Its short arm points up and its
// long arm down before it is turned; replicated, the sister chromatids lie
// side by side, touching at the centromere and parting a little toward the
// tips, the familiar X. Pulled toward a pole in anaphase, its centromere
// leads and its arms trail behind, a V.

import type { Chromatid, Chromosome } from './model'

export interface Point {
  x: number
  y: number
}

/** Each pair's whole chromatid length, largest first, so homologous pairs differ by size. */
export const LENGTHS = [46, 37, 30, 24]
/** Chromosomes are drawn a little shorter as there are more of them, so a
 *  cell with 2n = 8 isn't drawn huge. */
export const sizeFor = (pairs: number) => [1, 1, 0.9, 0.8][pairs - 1] ?? 0.8

/** The share of each pair's length in its short arm: where its centromere sits. */
export const SHORT_ARM = [0.38, 0.27, 0.44, 0.33]
/** Where each pair crosses over, as a share of the long arm out from the centromere. */
export const CROSS_AT = [0.55, 0.5, 0.6, 0.5]

/** Chromatid widths: condensed, decondensing (telophase), and chromatin (interphase). */
export const WIDTH = { condensed: 8, rod: 6, thread: 2.8 }
/** The dark edge round each chromatid. */
export const EDGE = 1.3
/** How far sister chromatids part at their tips. */
const SPLAY = 2.6
/** How far the two crossing chromatids of a tetrad bend at the chiasma: far
 *  enough to cross over each other, an X between the homologs. */
const PINCH = 6.6

export type Look = keyof typeof WIDTH

export interface Pose {
  /** where the centromere is */
  x: number
  y: number
  /** the turn, in degrees clockwise: 0 keeps the short arm up */
  angle?: number
  /** the pole the centromere is pulled toward, along the chromosome's own x: −1 left, 1 right */
  lead?: -1 | 0 | 1
  /** how far the arms trail away from that pole, in degrees */
  bend?: number
  look?: Look
  /** sister 1 on the left, so a tetrad's crossing chromatids face each other */
  flip?: boolean
  /** which side the other homolog of a crossed tetrad is on, for the chiasma */
  pinch?: -1 | 1
  /** for chromatin, a wave of its own */
  wave?: number
  /** how much longer or shorter than LENGTHS (see sizeFor) */
  size?: number
}

export interface ChromatidShape {
  chromatid: Chromatid
  look: Look
  width: number
  /** the center line, from the short arm's tip to the long arm's */
  points: Point[]
  /** where the long arm's tip starts: from here on it is `chromatid.tip`'s DNA */
  split: number
}

export interface ChromosomeShape {
  chromosome: Chromosome
  chromatids: ChromatidShape[]
  centromere: Point
  /** a box round the whole chromosome */
  box: Box
}

export interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

export function turn(p: Point, deg: number): Point {
  const a = rad(deg)
  return { x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }
}

function boxOf(points: Point[], pad = 0): Box {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return { x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad, x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad }
}

export const unionBox = (boxes: Box[]): Box => ({
  x1: Math.min(...boxes.map((b) => b.x1)),
  y1: Math.min(...boxes.map((b) => b.y1)),
  x2: Math.max(...boxes.map((b) => b.x2)),
  y2: Math.max(...boxes.map((b) => b.y2)),
})

/** One arm's center line, from the centromere out, at `samples` (shares of
 *  its length). Its direction turns from straight up or down toward the
 *  trailing side as it goes, so a pulled chromosome's arms droop into a V. */
function arm(length: number, down: boolean, lead: number, bend: number, samples: number[]): Point[] {
  const out: Point[] = []
  const steps = 48
  let x = 0
  let y = 0
  let at = 0
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    while (at < samples.length && samples[at] <= t + 1e-9) out[at++] = { x, y }
    const theta = lead ? rad(bend) * (0.55 + 0.45 * t) : 0
    x += -lead * Math.sin(theta) * (length / steps)
    y += (down ? 1 : -1) * Math.cos(theta) * (length / steps)
  }
  while (at < samples.length) out[at++] = { x, y }
  return out
}

const range = (n: number) => Array.from({ length: n + 1 }, (_, i) => i / n)

/** A chromosome drawn at a pose. */
export function chromosomeShape(chromosome: Chromosome, pose: Pose): ChromosomeShape {
  const { x, y, angle = 0, lead = 0, bend = 0, look = 'condensed', flip = false, pinch, wave = 0, size = 1 } = pose
  const pair = chromosome.pair
  const scale = look === 'thread' ? 1.6 : look === 'rod' ? 0.92 : 1
  const length = LENGTHS[pair] * scale * size
  const short = length * SHORT_ARM[pair]
  const long = length - short
  const width = WIDTH[look]
  const doubled = chromosome.chromatids.length === 2
  const crossAt = CROSS_AT[pair]

  const chromatids = chromosome.chromatids.map((chromatid): ChromatidShape => {
    // Sister 0 on the left, sister 1 on the right, unless flipped.
    const side = doubled ? ((chromatid.sister === 0) !== flip ? -1 : 1) : 0
    const offset = side * (width / 2 + (look === 'thread' ? 0.9 : 0.3))
    const shortTs = range(look === 'thread' ? 14 : 8)
    const longTs = [...new Set([...range(look === 'thread' ? 22 : 14), crossAt])].sort((a, b) => a - b)
    const shortArm = arm(short, false, lead, bend, shortTs)
    const longArm = arm(long, true, lead, bend, longTs)
    const crossing = pinch !== undefined && chromatid.tip !== chromatid.homolog
    const place = (p: Point, t: number, isLong: boolean) => {
      let px = p.x + offset + side * SPLAY * t * t
      let py = p.y
      if (look === 'thread') {
        // chromatin: a loose wave along the line
        const along = isLong ? t * long : -t * short
        px += 4.2 * Math.sin(along / 6 + wave)
        py += 1.2 * Math.cos(along / 9 + wave)
      }
      if (crossing && isLong) px += pinch! * PINCH * Math.exp(-(((t - crossAt) / 0.13) ** 2))
      const q = turn({ x: px, y: py }, angle)
      return { x: x + q.x, y: y + q.y }
    }
    const points = [
      ...shortArm.map((p, i) => place(p, shortTs[i], false)).reverse(),
      ...longArm.slice(1).map((p, i) => place(p, longTs[i + 1], true)),
    ]
    const split = shortTs.length - 1 + longTs.indexOf(crossAt)
    return { chromatid, look, width, points, split }
  })
  const centromere = { x, y }
  const box = boxOf(chromatids.flatMap((c) => c.points), width / 2 + EDGE)
  return { chromosome, chromatids, centromere, box }
}

/** A tetrad: two replicated homologs side by side, each chromosome's
 *  crossing chromatid on the inside. `left` is the homolog on the left. */
export function tetradShapes(left: Chromosome, right: Chromosome, pose: Pose & { gap?: number }): ChromosomeShape[] {
  const { gap = 4.5, angle = 0 } = pose
  const half = WIDTH.condensed + 0.3 + gap / 2 + 1
  const crossed = left.chromatids.some((t) => t.tip !== t.homolog)
  return [left, right].map((chromosome, i) => {
    const side = i === 0 ? -1 : 1
    const shift = turn({ x: side * half, y: 0 }, angle)
    // The crossing chromatid is maternal 1 or paternal 0: put it next to the other homolog.
    const crossingSister = chromosome.homolog === 'm' ? 1 : 0
    const flip = (side === -1) === (crossingSister === 0)
    return chromosomeShape(chromosome, {
      ...pose,
      x: pose.x + shift.x,
      y: pose.y + shift.y,
      flip,
      pinch: crossed ? (side === -1 ? 1 : -1) : undefined,
    })
  })
}

/** An SVG path along points. */
export const pathOf = (points: Point[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

/** A point along a chromatid, as a share of its length from the short arm's tip. */
export function along(c: ChromatidShape, share: number): Point {
  const i = Math.max(0, Math.min(c.points.length - 1, Math.round(share * (c.points.length - 1))))
  return c.points[i]
}
