// pH paper: universal indicator paper and the color chart it's matched
// against, one swatch per whole pH from red through green to purple.

export const CHART_COLORS = [
  '#c8102e', // 0
  '#e0301e', // 1
  '#f0592a', // 2
  '#f7892b', // 3
  '#fbb034', // 4
  '#fdd835', // 5
  '#cddc39', // 6
  '#7cb342', // 7
  '#2e9e6b', // 8
  '#1e9aa0', // 9
  '#1e78c2', // 10
  '#3f51b5', // 11
  '#5e35b1', // 12
  '#7b1fa2', // 13
  '#4a148c', // 14
]

/** The strip's color: the chart's swatch at the whole-number `pH`. */
export const paperColor = (pH: number) => CHART_COLORS[Math.min(CHART_COLORS.length - 1, Math.max(0, Math.round(pH)))]

const SWATCH = 32
const SWATCH_GAP = 4
const CARD_PAD = 14

/** Where things sit: the wet strip lying across the top, the chart card below. */
export const PH_PAPER = (() => {
  const cardWidth = 2 * CARD_PAD + CHART_COLORS.length * (SWATCH + SWATCH_GAP) - SWATCH_GAP
  const strip = { x: cardWidth / 2 - 110, y: 4, width: 220, height: 30, wet: 84 }
  const card = { x: 0, y: strip.y + strip.height + 22, width: cardWidth, height: 96 }
  return {
    width: cardWidth,
    height: card.y + card.height + 2,
    strip,
    card,
    swatch: SWATCH,
    swatchX: (pH: number) => card.x + CARD_PAD + pH * (SWATCH + SWATCH_GAP),
    swatchY: card.y + 32,
  }
})()
