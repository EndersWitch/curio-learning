// Where things sit on a drawn beaker, in drawing units: the scale runs 240
// units from the bottom up to capacity, with headroom above it to the rim
// like real glass, so every size is drawn the same and only the numbers
// change. Its marks are printed in a column on the front, not at the wall.

import type { Scale } from './scale'

const SCALE_H = 240
const INNER_W = 180

export function beakerLayout(scale: Scale) {
  const left = 14 // room for the pouring spout
  const right = left + INNER_W
  const width = right + 10
  const rimTop = 4
  const wallTop = rimTop + 8
  const yFull = wallTop + 54
  const yZero = yFull + SCALE_H
  const scaleLeft = left + 30
  return {
    width,
    height: yZero + 4,
    cx: (left + right) / 2,
    left,
    right,
    rimTop,
    wallTop,
    innerBottom: yZero,
    /** the left end of the printed marks */
    scaleLeft,
    /** the marks' width, as a tube this wide would have them (see ScaleTicks) */
    scaleW: 56,
    /** where a magnifier looks: across the marks and their numbers */
    readX: scaleLeft + 36,
    /** drawing units per mL */
    perMl: SCALE_H / scale.capacity,
    yOf: (ml: number) => yZero - (ml / scale.capacity) * SCALE_H,
    /** a wide surface is flat, climbing the glass only this close to it… */
    meniscusEdge: 12,
    /** …by this much */
    meniscus: 5,
  }
}
