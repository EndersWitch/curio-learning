// The organelles' shapes, worked out as plain path data for the artwork to
// draw: a nucleus with its envelope and pores, rough ER wrapped round it,
// a Golgi stack, chromatin threads, and so on. Each cell's plan (cells.ts)
// places them.

import { polar, sample, seeded, smooth, type Pt } from './shapes'

/** How thick a membrane tube (ER, Golgi cisternae, the nuclear envelope) is. */
export const TUBE = 8

export interface NucleusArt {
  c: Pt
  r: number
  /** the envelope, broken at each pore */
  arcs: string[]
  /** the envelope unbroken, when pores aren't drawn */
  ring: string
  /** the angles of the pores */
  pores: number[]
  nucleolus: { c: Pt; r: number }
  chromatin: string[]
  /** points along the chromatin threads, for a label to point at one */
  chromatinPoints: Pt[]
}

const ringPath = (c: Pt, r: number, a0: number, a1: number) => {
  const p0 = polar(c[0], c[1], r, a0)
  const p1 = polar(c[0], c[1], r, a1)
  return `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
}

/** A nucleus at `c`: its envelope broken by `poreCount` pores, a nucleolus
 *  at `nucleolus` (relative to the centre) and threads of chromatin. */
export function nucleus(c: Pt, r: number, poreCount: number, nucleolus: { at: Pt; r: number }, seed: number): NucleusArt {
  const step = 360 / poreCount
  // Each arc stops 8 short of a pore; its rounded end takes 4 of that, leaving a gap of about 8.
  const gap = (8 / (Math.PI * r)) * 180
  const pores = Array.from({ length: poreCount }, (_, i) => -90 + step * (i + 0.5))
  const arcs = pores.map((a) => ringPath(c, r, a + gap, a + step - gap))
  const ring = `M ${c[0] - r} ${c[1]} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`
  const nc: Pt = [c[0] + nucleolus.at[0], c[1] + nucleolus.at[1]]
  const threads = chromatin(c, r - TUBE, nc, nucleolus.r + 5, seed)
  return { c, r, arcs, ring, pores, nucleolus: { c: nc, r: nucleolus.r }, chromatin: threads.map((t) => smooth(t)), chromatinPoints: threads.flat() }
}

/** Loose threads of chromatin filling a nucleus, kept off the nucleolus. */
function chromatin(c: Pt, r: number, avoid: Pt, avoidR: number, seed: number): Pt[][] {
  const rand = seeded(seed)
  const ok = (p: Pt) => Math.hypot(p[0] - c[0], p[1] - c[1]) < r - 4 && Math.hypot(p[0] - avoid[0], p[1] - avoid[1]) > avoidR
  const threads: Pt[][] = []
  const count = Math.round((r * r) / 600)
  for (let t = 0; t < count * 20 && threads.length < count; t++) {
    const start: Pt = [c[0] + (rand() * 2 - 1) * r, c[1] + (rand() * 2 - 1) * r]
    if (!ok(start)) continue
    const points: Pt[] = [start]
    let heading = rand() * 2 * Math.PI
    for (let i = 0; i < 7; i++) {
      heading += (rand() - 0.5) * 2.4
      const last = points[points.length - 1]
      const next: Pt = [last[0] + 7 * Math.cos(heading), last[1] + 7 * Math.sin(heading)]
      if (!ok(next)) break
      points.push(next)
    }
    if (points.length >= 5) threads.push(points)
  }
  return threads
}

export interface Tube {
  d: string
  /** points along it, for keeping leader lines off it */
  points: Pt[]
  /** ribosomes along both sides, for rough ER */
  dots: Pt[]
}

export interface RoughER {
  /** the folded sheet, as one tube */
  sheet: Tube
  /** where it joins the nuclear envelope, drawn when the nucleus is */
  stub: string
  /** its free end, where the smooth ER carries on */
  end: Pt
}

/** Rough ER: one sheet folded back and forth round a nucleus at `c`, a fold
 *  at each radius, from angle `from` (where it joins the envelope, at
 *  radius `envelope`) toward `to`, gently wavy and studded with ribosomes. */
export function roughER(c: Pt, envelope: number, radii: number[], from: number, to: number, seed: number): RoughER {
  const rand = seeded(seed)
  const points: Pt[] = []
  const dots: Pt[] = []
  radii.forEach((r, k) => {
    const phase = rand() * Math.PI * 2
    const [a0, a1] = k % 2 ? [to, from] : [from, to]
    const wobble = (a: number) => r + 2 * Math.sin((a * Math.PI) / 30 + phase)
    for (let i = 0; i <= 12; i++) {
      const a = a0 + ((a1 - a0) * i) / 12
      points.push(polar(c[0], c[1], wobble(a), a))
    }
    // The fold round to the next sheet.
    if (k + 1 < radii.length) {
      const mid = (r + radii[k + 1]) / 2
      const turn = (((radii[k + 1] - r) / 2 / mid) * 180) / Math.PI
      points.push(polar(c[0], c[1], mid, a1 + Math.sign(a1 - a0) * turn))
    }
    const n = Math.max(3, Math.round((Math.abs(a1 - a0) * Math.PI * r) / 180 / 9))
    for (const side of [-1, 1])
      for (let i = 0; i < n; i++) {
        const a = a0 + ((a1 - a0) * (i + 0.5)) / n
        dots.push(polar(c[0], c[1], wobble(a) + side * (TUBE / 2 + 2.6), a))
      }
  })
  const start = points[0]
  const inner = polar(c[0], c[1], envelope, from)
  return {
    sheet: { d: smooth(points), points: sample(points, false, 2), dots },
    stub: `M ${inner[0].toFixed(1)} ${inner[1].toFixed(1)} L ${start[0].toFixed(1)} ${start[1].toFixed(1)}`,
    end: points[points.length - 1],
  }
}

export interface GolgiArt {
  cisternae: string[]
  /** points along the cisternae, for keeping leader lines off them */
  points: Pt[]
}

/** A Golgi stack at `at`: `count` curved cisternae, the middle ones
 *  longest, curving round a point `bend` away in direction `facing`
 *  (degrees), which is the side facing the nucleus (the cis face). */
export function golgi(at: Pt, facing: number, count: number, bend: number, spacing = TUBE + 3.5): GolgiArt {
  const centre = polar(at[0], at[1], bend, facing)
  const back = facing + 180
  const cisternae: string[] = []
  const points: Pt[] = []
  for (let i = 0; i < count; i++) {
    const r = bend - ((count - 1) / 2) * spacing + i * spacing
    const half = 32 - Math.abs(i - (count - 1) / 2) * 4 // degrees either side, at radius 70
    const span = (half * 70) / r
    cisternae.push(ringPath(centre, r, back - span, back + span))
    for (let k = 0; k <= 6; k++) points.push(polar(centre[0], centre[1], r, back - span + (k * span) / 3))
  }
  return { cisternae, points }
}

/** A tube along a smooth path through the points, or round them when `closed`. */
export const tube = (points: Pt[], closed = false): Tube => ({ d: smooth(points, closed), points: sample(points, closed, 3), dots: [] })
