// Where everything in a Coil and Magnet figure goes, before mirroring: the
// magnet on the left, the coil on the right, the whole thing centered.
//
// The coil is seen from the side as a helix. Each turn is a front half (drawn
// over the magnet) and a back half (drawn behind it); the back halves slant,
// so the wire runs on into the next turn. Both ends of the wire come off the
// bottom of the coil as leads. Below the coil, a circuit can join them through
// a battery, a meter, or both in series.

import type { Point } from '$lib/shared/field'
import type { Segment } from '$lib/shared/vector'
import { coilFieldLines, magnetFieldLines, type FieldLine } from './fieldLines'
import type { CoilSettings } from './settings'

export const WIDTH = 640
export const HEIGHT = 360
const CY = 170
/** Half the coil's height, half a loop's width seen edge-on, and the gap between turns. */
export const COIL_R = 62
const LOOP_RX = 13
const PITCH = 18
const LEAD = 38

const MAGNET_LENGTH = 150
const MAGNET_HEIGHT = 46
const GAP_OUTSIDE = 70
const MOTION_LENGTH = 76
const METER_R = 30
/** How far the needle leans from upright, in degrees. */
const NEEDLE_LEAN = 38
/** The battery's two plates: the gap between them, and the long (+) plate's height. */
export const BATTERY_GAP = 10
export const BATTERY_PLATE = 36
/** The circuit below the coil: from the leads down to its wire, and the space around each part. */
const CIRCUIT_DROP = METER_R + 6
const CIRCUIT_GAP = 26
const MAX_CURRENT_ARROWS = 5
const FIELD_MARGIN = 14

export interface Magnet {
  x: number
  y: number
  length: number
  height: number
  /** The pole on the side toward the coil. */
  near: 'N' | 'S'
}

export interface CoilFigure {
  width: number
  height: number
  cy: number
  /** Leftmost and rightmost drawn points, after centering. */
  left: number
  right: number
  coil: {
    /** Centers of the first and last turns' loops. */
    left: number
    right: number
    loopRx: number
    r: number
    front: string[]
    back: string[]
    leads: Segment[]
  }
  magnet: Magnet | null
  motion: Segment | null
  fieldLines: FieldLine[]
  /** Wires below the coil, from each lead through the battery and meter. */
  circuit: Point[][]
  meter: {
    cx: number
    cy: number
    r: number
    /** The needle's lean from upright in degrees (negative is left), or null for students to draw. */
    needle: number | null
  } | null
  battery: {
    cx: number
    cy: number
    /** Whether the positive (long) plate is on the left, before mirroring. */
    plusLeft: boolean
  } | null
  /** Arrowheads on the front of the coil, pointing the way the current flows (angle in degrees). */
  currentArrows: { x: number; y: number; angle: number }[]
}

const f = (n: number) => Math.round(n * 100) / 100
const k = 4 / 3 // cubic control distance for a half ellipse

/**
 * Which way current flows down the front of the coil, as the figure shows it,
 * or null for none. With a battery, conventional current leaves its positive
 * terminal: from the left-hand lead the wire runs down the front of every
 * turn, and mirroring doesn't change up and down. With a magnet it's the
 * teacher's current arrows, or else Lenz's law: the coil's near end takes the
 * pole that opposes the magnet's motion.
 */
function currentDownFront(s: CoilSettings): boolean | null {
  if (s.source === 'battery') return s.batteryPlus === 'left'
  if (s.current !== 'none') return s.current === 'down'
  if (s.source !== 'magnet' || s.motion === 'none') return null
  // A north pole approaching makes the near end north; receding, south.
  const nearEndNorth = (s.facing === 'N') === (s.motion === 'toward')
  // The near end is the coil's left end before mirroring.
  const northOnRightAsDrawn = !nearEndNorth !== s.mirror
  return northOnRightAsDrawn
}

export function buildCoilFigure(s: CoilSettings): CoilFigure {
  const coilLength = (s.turns - 1) * PITCH
  // Lay out from x = 0, then shift everything to center it.
  let coilLeft = 0
  let magnet: Magnet | null = null
  if (s.source === 'magnet') {
    let right: number
    if (s.distance === 'outside') right = coilLeft - LOOP_RX - GAP_OUTSIDE
    else if (s.distance === 'mouth') right = coilLeft
    else right = coilLeft + coilLength / 2 + MAGNET_LENGTH / 2
    magnet = { x: right - MAGNET_LENGTH, y: CY - MAGNET_HEIGHT / 2, length: MAGNET_LENGTH, height: MAGNET_HEIGHT, near: s.facing }
  }

  // The parts in the circuit below the coil, left to right, and how wide each is.
  const parts: ('battery' | 'meter')[] = []
  if (s.source === 'battery') parts.push('battery')
  if (s.meter) parts.push('meter')
  const widthOf = (part: 'battery' | 'meter') => (part === 'meter' ? METER_R * 2 : BATTERY_GAP)
  const needed = parts.reduce((sum, p) => sum + widthOf(p), 0) + CIRCUIT_GAP * (parts.length + 1)
  // The leads spread apart when the coil is too short for the circuit to fit between them.
  const spread = parts.length ? Math.max(0, (needed - coilLength) / 2) : 0
  const leadEnds = [-spread, coilLength + spread]

  const drawnLeft = Math.min(coilLeft - LOOP_RX * k, coilLeft + leadEnds[0] - 6, magnet ? magnet.x : Infinity)
  const drawnRight = Math.max(coilLeft + coilLength + LOOP_RX, coilLeft + leadEnds[1] + 6, magnet ? magnet.x + magnet.length : -Infinity)
  const shift = (WIDTH - (drawnRight - drawnLeft)) / 2 - drawnLeft
  coilLeft += shift
  if (magnet) magnet.x += shift

  const top = CY - COIL_R
  const bottom = CY + COIL_R
  const xs = Array.from({ length: s.turns }, (_, i) => coilLeft + i * PITCH)
  const front = xs.map((x) => `M${f(x)},${top} C${f(x + k * LOOP_RX)},${top} ${f(x + k * LOOP_RX)},${bottom} ${f(x)},${bottom}`)
  // The first back half rises straight up the first loop; the rest slant on
  // from one turn's bottom to the next turn's top.
  const back = xs.map((x, i) => {
    const from = i === 0 ? x : xs[i - 1]
    return `M${f(from)},${bottom} C${f(from - k * LOOP_RX)},${bottom} ${f(x - k * LOOP_RX)},${top} ${f(x)},${top}`
  })
  const leads: Segment[] = [xs[0], xs.at(-1)!].map((x, i) => ({ x1: f(x), y1: bottom, x2: f(coilLeft + leadEnds[i]), y2: bottom + LEAD }))

  // The circuit: down from each lead to one wire, with the parts spaced evenly along it.
  let meter: CoilFigure['meter'] = null
  let battery: CoilFigure['battery'] = null
  const circuit: Point[][] = []
  if (parts.length) {
    const wireY = bottom + LEAD + CIRCUIT_DROP
    const [from, to] = [leads[0].x2, leads[1].x2]
    const slot = (to - from) / (parts.length + 1)
    let wire: Point[] = [{ x: from, y: leads[0].y2 }, { x: from, y: wireY }]
    parts.forEach((part, i) => {
      const cx = f(from + slot * (i + 1))
      const half = widthOf(part) / 2
      wire.push({ x: f(cx - half), y: wireY })
      circuit.push(wire)
      wire = [{ x: f(cx + half), y: wireY }]
      if (part === 'meter') {
        const needle = s.needle === 'blank' ? null : s.needle === 'left' ? -NEEDLE_LEAN : s.needle === 'right' ? NEEDLE_LEAN : 0
        meter = { cx, cy: wireY, r: METER_R, needle }
      } else {
        battery = { cx, cy: wireY, plusLeft: s.batteryPlus === 'left' }
      }
    })
    wire.push({ x: to, y: wireY }, { x: to, y: leads[1].y2 })
    // Each wire runs away from a lead, so the last one is turned around.
    circuit.push(wire.reverse())
  }

  let motion: Segment | null = null
  if (magnet && s.motion !== 'none') {
    const mid = magnet.x + magnet.length / 2
    // Above the magnet, or above the coil when the magnet is in it.
    const y = s.distance === 'outside' ? magnet.y - 30 : top - 28
    const dir = s.motion === 'toward' ? 1 : -1
    motion = { x1: f(mid - (dir * MOTION_LENGTH) / 2), y1: y, x2: f(mid + (dir * MOTION_LENGTH) / 2), y2: y }
  }

  const down = currentDownFront(s)

  // On the rightmost point of some front halves, spread along the coil.
  const every = Math.ceil(s.turns / MAX_CURRENT_ARROWS)
  const showCurrent = s.current !== 'none' && down !== null
  const currentArrows = showCurrent
    ? xs.filter((_, i) => i % every === Math.floor((every - 1) / 2)).map((x) => ({ x: f(x + LOOP_RX), y: CY, angle: down ? 90 : -90 }))
    : []

  // Field lines. The outermost magnet loop passes just inside the top of the figure.
  const showMagnetField = magnet && (s.fieldLines === 'magnet' || s.fieldLines === 'both')
  // With nothing beside the coil the field line choices are hidden, so none show.
  const showCoilField =
    s.source === 'battery' ? s.fieldLines !== 'none' : s.source === 'magnet' && (s.fieldLines === 'coil' || s.fieldLines === 'both')
  const fieldLines: FieldLine[] = []
  if (showMagnetField) fieldLines.push(...magnetFieldLines(magnet!, s.lineCount, magnet!.y - FIELD_MARGIN))
  if (showCoilField && down !== null) {
    // Current down the front makes the right-hand end north, as drawn; the
    // lines are laid out before mirroring, so a mirrored figure swaps ends.
    const northRight = down !== s.mirror
    fieldLines.push(...coilFieldLines({ left: xs[0], right: xs.at(-1)!, cy: CY, r: COIL_R }, s.lineCount, northRight))
  }

  return {
    width: WIDTH,
    height: HEIGHT,
    cy: CY,
    left: f(drawnLeft + shift),
    right: f(drawnRight + shift),
    coil: { left: f(xs[0]), right: f(xs.at(-1)!), loopRx: LOOP_RX, r: COIL_R, front, back, leads },
    magnet,
    motion,
    fieldLines,
    circuit,
    meter,
    battery,
    currentArrows,
  }
}
