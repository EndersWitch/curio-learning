// The arithmetic of a school compound light microscope. Total magnification
// is the eyepiece's times the objective's. The field of view shrinks in step
// as the magnification grows, so a field measured at low power gives every
// other one:
//
//   field at high power = field at low power × low magnification ÷ high magnification
//
// Fields are kept in millimeters, as students measure them with a ruler;
// specimens in micrometers (1 mm = 1000 µm), as cells are sized.

export const EYEPIECES = ['5', '10', '15', '20'] as const
export type Eyepiece = (typeof EYEPIECES)[number]

/** scanning, low power, high power and oil immersion */
export const OBJECTIVES = ['4', '10', '40', '100'] as const
export type Objective = (typeof OBJECTIVES)[number]

export const OBJECTIVE_NAMES: Record<Objective, string> = {
  '4': 'Scanning',
  '10': 'Low power',
  '40': 'High power',
  '100': 'Oil immersion',
}

export const UM_PER_MM = 1000

/** The magnification students see through the eyepiece: 10× × 40× = 400×. */
export const totalMagnification = (eyepiece: Eyepiece | number, objective: Objective | number) =>
  Number(eyepiece) * Number(objective)

/** A field's diameter at magnification `to`, from one measured at `from`. */
export const fieldAt = (field: number, from: number, to: number) => (field * from) / to

/** How many of a specimen `size` µm long fit across a field `field` mm wide. */
export const fitAcross = (field: number, size: number) => (field * UM_PER_MM) / size

/** A specimen's size in µm from how many fit across a field `field` mm wide. */
export const sizeFromFit = (field: number, fit: number) => (field * UM_PER_MM) / fit

/** A number to three significant figures, as it would be written in an
 *  answer: 0.45, 1.8, 172, 1,800. */
export function formatNumber(n: number) {
  if (!Number.isFinite(n)) return '–'
  const tidy = Number(n.toPrecision(3))
  const [whole, decimals] = String(Math.abs(tidy)).split('.')
  const grouped = whole.length > 3 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : whole
  return (tidy < 0 ? '−' : '') + grouped + (decimals ? `.${decimals}` : '')
}

/** A count of specimens across a field, "6" or "4.5": whole when it's as
 *  good as whole, otherwise to one decimal place, or two when one would
 *  put the size it gives more than 1.5% out. */
export function formatFit(n: number) {
  if (Math.abs(n - Math.round(n)) < 0.01) return String(Math.round(n))
  const one = Number(n.toFixed(1))
  return Math.abs(one - n) / n > 0.015 ? n.toFixed(2) : n.toFixed(1)
}

/** A length in mm written in mm, e.g. "1.8 mm". */
export const mmText = (mm: number) => `${formatNumber(mm)} mm`

/** A length in µm written in µm, e.g. "1,800 µm". */
export const umText = (um: number) => `${formatNumber(um)} µm`

/** A length in µm as a scale bar's label: in mm from 1 mm up. */
export const lengthText = (um: number) => (um >= UM_PER_MM ? mmText(um / UM_PER_MM) : umText(um))

/** A scale bar for a field `field` mm across: the longest round length, 1, 2
 *  or 5 times a power of ten µm, no more than a quarter of the field. */
export function scaleBarLength(field: number) {
  const most = (field * UM_PER_MM) / 4
  const power = 10 ** Math.floor(Math.log10(most))
  const step = [5, 2, 1].find((k) => k * power <= most * (1 + 1e-9)) ?? 1
  return step * power
}
