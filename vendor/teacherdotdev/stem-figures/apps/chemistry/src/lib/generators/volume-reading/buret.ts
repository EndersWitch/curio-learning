// Where things sit on a drawn buret, in drawing units: 10 units per mL, with
// 0 near the open top and 50 above the stopcock that drains it.

const PER_ML = 10

export function buretLayout() {
  const tubeW = 28
  const width = 76
  const cx = width / 2
  const tubeTop = 4
  const yZero = tubeTop + 46
  const yFifty = yZero + 50 * PER_ML
  const taperTop = yFifty + 36
  const neckW = 8
  const stopcockY = taperTop + 34
  const tipTop = stopcockY + 14
  const tipBottom = tipTop + 44
  return {
    width,
    height: tipBottom + 4,
    cx,
    left: cx - tubeW / 2,
    right: cx + tubeW / 2,
    tubeW,
    tubeTop,
    taperTop,
    neckW,
    stopcockY,
    tipTop,
    tipBottom,
    perMl: PER_ML,
    yOf: (ml: number) => yZero + ml * PER_ML,
    /** a real buret's meniscus is shallow: about 0.2 mL */
    meniscus: 2,
  }
}
