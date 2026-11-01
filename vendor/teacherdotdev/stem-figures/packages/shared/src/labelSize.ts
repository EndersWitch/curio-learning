// Label size: how big a figure's text is compared to its lines, the same
// setting on every generator. Medium is how figures have always looked; large
// keeps labels readable once a figure is shrunk to fit a worksheet.

export const LABEL_SIZES = { small: 'Small', medium: 'Medium', large: 'Large' }
export type LabelSize = keyof typeof LABEL_SIZES

/** How much a figure's text is scaled at each label size. */
export const LABEL_SCALE: Record<LabelSize, number> = { small: 0.8, medium: 1, large: 1.4 }

/** A label size from a form, a link or a stored preset, or medium. */
export const cleanLabelSize = (v: unknown): LabelSize => (typeof v === 'string' && v in LABEL_SIZES ? (v as LabelSize) : 'medium')
