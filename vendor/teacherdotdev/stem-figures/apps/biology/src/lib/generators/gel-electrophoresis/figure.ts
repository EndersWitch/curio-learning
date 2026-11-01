// Where everything on a gel figure goes, worked out apart from the drawing so
// it can be tested: the lane names over the wells, the gel with its wells and
// bands, the ladder's sizes beside it, the electrodes and the ruler, and the
// answer key.
//
// Down the gel, 5 px is 1 mm, and the run from the bottom of the wells is
// 80 mm long, as on a classroom gel. Lanes are always the same width.

import { bandsOf, type Lane } from './lanes'
import { GEL_RANGES, drawBands, inRange, runOf, type DrawnBand } from './migration'
import type { GelSettings } from './settings'

export const LANE_W = 54
export const WELL_W = 36
export const WELL_H = 8
/** gel to the edge of the first and last lanes */
const SIDE = 14
/** gel top to the top of the wells */
export const WELL_TOP = 14
/** gel top to the bottom of the wells, where the run starts: the ruler's 0 */
export const RUN_TOP = WELL_TOP + WELL_H
export const PX_PER_MM = 5
export const RUN_MM = 80
/** where the middles of the biggest and smallest bands can go, down from RUN_TOP */
const BANDS_FROM = 12
const BANDS_TO = RUN_MM * PX_PER_MM - 14
export const GEL_H = RUN_TOP + RUN_MM * PX_PER_MM + 10

export const LANE_LABEL_SIZE = 14
export const SIZE_LABEL_SIZE = 13
const SIZE_GAP = 15
/** the room a lane label row, or a lane number row, takes over the gel */
const LABEL_ROW = 22
const NUMBER_ROW = 18
const BLANK_W = 40
/** the ladder sizes' tick and the gap to their text */
export const TICK = 6
const TEXT_GAP = 10
export const BADGE_R = 10
const BADGE_GAP = 6
const RULER_GAP = 10
export const RULER_W = 30
const ANSWER_SIZE = 18
const TITLE_SIZE = 22

/** About how wide a line of Arial is. */
export const textWidth = (text: string, size: number) => 0.56 * size * [...text].length

/** A size as the ladder labels write it: "500 bp", "10,000 bp" or "1.5 kb". */
export function sizeText(bp: number, units: 'bp' | 'kb', withUnit = true) {
  const n = units === 'kb' ? String(Number((bp / 1000).toPrecision(3))) : bp >= 10000 ? bp.toLocaleString('en-US') : String(bp)
  return withUnit ? `${n} ${units}` : n
}

/** What a ladder band is labeled: its size, both sizes where two ran
 *  together ("500/517 bp"), or the span where more did. */
export function bandText(sizes: number[], units: 'bp' | 'kb') {
  const sorted = [...sizes].sort((a, b) => a - b)
  if (sorted.length === 1) return sizeText(sorted[0], units)
  const join = sorted.length === 2 ? '/' : '–'
  return `${sizeText(sorted[0], units, false)}${join}${sizeText(sorted[sorted.length - 1], units)}`
}

/** Labels at the `wanted` heights, moved apart as little as they can be so
 *  each is `gap` from the next, and kept within `min` to `max` when they fit.
 *  They keep their order. */
export function spread(wanted: number[], gap: number, min: number, max: number): number[] {
  const order = wanted.map((_, i) => i).sort((a, b) => wanted[a] - wanted[b])
  // Runs of labels touching each other, each placed as one: as near its
  // labels' wanted heights as it can be, within bounds.
  const blocks: { first: number; n: number; sum: number; start: number }[] = []
  const place = (b: (typeof blocks)[number]) => {
    const ideal = (b.sum - (gap * b.n * (b.n - 1)) / 2) / b.n
    b.start = Math.max(min, Math.min(max - (b.n - 1) * gap, ideal))
  }
  order.forEach((index, k) => {
    const block = { first: k, n: 1, sum: wanted[index], start: 0 }
    place(block)
    blocks.push(block)
    while (blocks.length > 1) {
      const [a, b] = blocks.slice(-2)
      if (a.start + a.n * gap <= b.start + 1e-9) break
      blocks.splice(-2, 2, { first: a.first, n: a.n + b.n, sum: a.sum + b.sum, start: 0 })
      place(blocks[blocks.length - 1])
    }
  })
  const out: number[] = []
  for (const b of blocks) for (let k = 0; k < b.n; k++) out[order[b.first + k]] = b.start + k * gap
  return out
}

/** A lane's name: its label when labels are written, or its number. */
export const laneName = (lane: Lane, i: number, s: Pick<GelSettings, 'laneLabels'>) =>
  s.laneLabels === 'text' && lane.label.trim() ? lane.label.trim() : `Lane ${i + 1}`

const sizesList = (sizes: number[]) => sizes.map(String).join(', ')

/** The answer key: every sample lane's band sizes, and the ladder's when its
 *  sizes are blank. */
export function answerLines(s: GelSettings): string[] {
  const lines: string[] = []
  s.lanes.forEach((lane, i) => {
    const sizes = bandsOf(lane).map((b) => b.bp)
    const name = laneName(lane, i, s)
    if (lane.type === 'ladder') {
      if (s.sizeLabels === 'blank') lines.push(`${name}: ${sizesList(sizes)} bp`)
    } else if (sizes.length) lines.push(`${name}: ${sizesList(sizes)} bp`)
  })
  return lines
}

export interface DrawnLane {
  lane: Lane
  /** the middle of the lane, across */
  cx: number
  /** the bands to draw */
  bands: DrawnBand[]
  /** sizes outside the gel's resolving range, and sizes that ran together */
  outside: number[]
  merged: number[][]
}

export interface SizeLabel {
  text: string
  /** the band's middle, and the label's (moved off it to make room) */
  band: number
  y: number
}

export interface GelLayout {
  width: number
  height: number
  gel: { x: number; y: number; w: number; h: number }
  lanes: DrawnLane[]
  /** the lane labels over the wells, and whether they're turned to fit */
  laneLabels: { mode: 'text' | 'blank' | 'none'; turned: boolean; y: number }
  numbersY: number | null
  /** the ladder sizes beside the first or last lane */
  sizes: { side: 'left' | 'right'; x: number; labels: SizeLabel[] }[]
  electrodes: { x: number; top: number; bottom: number } | null
  ruler: { x: number; zero: number } | null
}

const TURN = Math.SQRT1_2

export function layoutGel(s: GelSettings): GelLayout {
  const n = s.lanes.length
  const gelW = 2 * SIDE + n * LANE_W
  const yOf = (bp: number) => RUN_TOP + BANDS_FROM + runOf(bp, s.gel) * (BANDS_TO - BANDS_FROM)
  const laneX = (i: number) => SIDE + (i + 0.5) * LANE_W

  // Over the gel: the lane labels, flat when every one fits its lane, turned
  // 45° when any doesn't, and the lane numbers under them.
  const labels = s.lanes.map((l) => (s.laneLabels === 'text' ? l.label.trim() : ''))
  const widest = Math.max(0, ...labels.map((t) => textWidth(t, LANE_LABEL_SIZE)))
  const turned = s.laneLabels === 'text' && widest > LANE_W - 6
  const labelRow =
    s.laneLabels === 'blank' ? LABEL_ROW : s.laneLabels === 'text' && widest ? (turned ? widest * TURN + 12 : LABEL_ROW) : 0
  const numberRow = s.laneNumbers ? NUMBER_ROW : 0
  const gelY = labelRow + numberRow + (labelRow || numberRow ? 6 : 0)
  // Turned labels run up and to the right, past the gel's right edge.
  const overhang = turned ? Math.max(0, ...labels.map((t, i) => laneX(i) + textWidth(t, LANE_LABEL_SIZE) * TURN - gelW)) : 0

  const lanes: DrawnLane[] = s.lanes.map((lane, i) => {
    const bands = bandsOf(lane)
    const drawn = drawBands(bands, yOf)
    return {
      lane,
      cx: laneX(i),
      bands: drawn,
      outside: bands.filter((b) => !inRange(b.bp, s.gel)).map((b) => b.bp),
      merged: drawn.filter((b) => b.sizes.length > 1).map((b) => b.sizes),
    }
  })

  // The ladder's sizes go beside the first lane, on the left, or the last,
  // on the right. They stay clear of the electrodes on the left.
  const electrodes = s.electrodes !== 'none'
  const electrodeText = s.electrodes === 'labeled' ? Math.max(textWidth('Cathode', SIZE_LABEL_SIZE), textWidth('Anode', SIZE_LABEL_SIZE)) + 6 : 0
  const sizeSides: { side: 'left' | 'right'; lane: DrawnLane }[] = []
  if (s.sizeLabels !== 'none') {
    if (s.lanes[0].type === 'ladder') sizeSides.push({ side: 'left', lane: lanes[0] })
    if (s.lanes[n - 1].type === 'ladder') sizeSides.push({ side: 'right', lane: lanes[n - 1] })
  }
  const topBadge = RUN_TOP - WELL_H / 2
  const bottomBadge = GEL_H - BADGE_R - 4
  const sizes = sizeSides.map(({ side, lane }) => {
    const bands = lane.bands
    const clear = side === 'left' && electrodes
    const min = clear ? topBadge + BADGE_R + 9 : RUN_TOP + 4
    const max = clear ? bottomBadge - BADGE_R - 9 : GEL_H - 6
    const ys = spread(bands.map((b) => (b.top + b.bottom) / 2), SIZE_GAP, min, max)
    return {
      side,
      x: 0,
      labels: bands.map((b, k) => ({ text: bandText(b.sizes, s.sizeUnits), band: (b.top + b.bottom) / 2, y: ys[k] })),
    }
  })
  const sizesWidth = (side: 'left' | 'right') => {
    const found = sizes.find((x) => x.side === side)
    if (!found) return 0
    const w = s.sizeLabels === 'blank' ? BLANK_W : Math.max(...found.labels.map((l) => textWidth(l.text, SIZE_LABEL_SIZE)))
    return TICK + TEXT_GAP + w
  }

  const leftW = Math.max(sizesWidth('left'), electrodes ? BADGE_GAP + 2 * BADGE_R + electrodeText : 0)
  const rightLabels = sizesWidth('right')
  const rulerW = s.ruler ? RULER_GAP + RULER_W + 4 : 0
  const gelX = Math.ceil(leftW) + 2
  for (const x of sizes) x.x = x.side === 'left' ? gelX : gelX + gelW
  const rulerX = gelX + gelW + rightLabels + RULER_GAP
  const right = Math.max(rightLabels + rulerW, overhang)

  return {
    width: Math.ceil(gelX + gelW + right + 2),
    height: gelY + GEL_H + (s.ruler ? 16 : 0),
    gel: { x: gelX, y: gelY, w: gelW, h: GEL_H },
    lanes,
    laneLabels: { mode: s.laneLabels, turned, y: gelY - numberRow - 6 - (turned ? 4 : 6) },
    numbersY: s.laneNumbers ? gelY - 8 : null,
    sizes,
    electrodes: electrodes ? { x: gelX - BADGE_GAP - BADGE_R, top: topBadge, bottom: bottomBadge } : null,
    ruler: s.ruler ? { x: rulerX, zero: RUN_TOP } : null,
  }
}

/** How wide the figure must be for its title and answer key to fit. */
export function textWidthOf(s: GelSettings) {
  const title = s.titleMode === 'text' && s.title.trim() ? textWidth(s.title, TITLE_SIZE) * 1.08 : 0
  const answers = s.answerKey ? answerLines(s).map((l) => textWidth(l, ANSWER_SIZE)) : []
  return Math.ceil(Math.max(0, title, ...answers))
}

/** A distance down the run, in mm from the bottom of the wells, to the nearest mm. */
export const mmOf = (y: number) => Math.round((y - RUN_TOP) / PX_PER_MM)

/** What the gel shows, for screen readers. */
export function describe(s: GelSettings) {
  const [low, high] = GEL_RANGES[s.gel]
  return `A ${s.gel}% agarose gel, separating about ${low} to ${high} bp, with ${s.lanes.length} lanes: ${s.lanes
    .map((l, i) => laneName(l, i, s))
    .join(', ')}`
}
