// Where things sit on a drawn graduated cylinder, in drawing units: the scale
// runs 400 units from 0 up to capacity, so every size is the same height and
// only the tube width changes (narrower for the small ones, like real glass).

import type { CylinderSize, Scale } from './scale'

const SCALE_H = 400
const TUBE_W: Record<CylinderSize, number> = { '10': 36, '25': 42, '50': 50, '100': 58, '250': 70, '1000': 88 }

export function cylinderLayout(scale: Scale, size: CylinderSize) {
  const tubeW = TUBE_W[size]
  const footW = tubeW + 52
  const width = footW + 4
  const cx = width / 2
  const rimTop = 4
  const tubeTop = rimTop + 8
  const yFull = tubeTop + 44
  const yZero = yFull + SCALE_H
  const innerBottom = yZero + 16
  const footTop = innerBottom + 16
  const height = footTop + 14 + 2
  return {
    width,
    height,
    cx,
    left: cx - tubeW / 2,
    right: cx + tubeW / 2,
    tubeW,
    footW,
    rimTop,
    tubeTop,
    innerBottom,
    footTop,
    /** drawing units per mL */
    perMl: SCALE_H / scale.capacity,
    yOf: (ml: number) => yZero - (ml / scale.capacity) * SCALE_H,
    /** the bottom of the meniscus sits this far below the liquid at the wall */
    meniscus: tubeW * 0.12,
  }
}
