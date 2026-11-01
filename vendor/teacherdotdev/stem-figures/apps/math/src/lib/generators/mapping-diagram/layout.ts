// Lays out a mapping diagram as plain numbers for MappingDiagram.svelte to
// draw: the inputs down the left, the outputs down the right, each side in an
// oval (or a box, or nothing) under its title, and an arrow from each input to
// each output it maps to.

import { LABEL_SCALE } from '$shared/labelSize'
import { layoutMath, type MathBox } from '$lib/shared/mathSvg.js'
import { readMapping, type Settings } from './settings.js'

// Font sizes at the medium label size (see labelSize.ts).
const BASE_ITEM_FS = 20
const BASE_SIDE_FS = 18 // "Input" and "Output"
const BASE_TITLE_FS = 22
const PAD = 16
const GAP = 150 // between the two sides, for the arrows
const ARROW_GAP = 7 // from an item to the end of its arrow
const MIN_ROWS = 2 // the least room a side has, so one item doesn't sit in a circle
const EMPTY_ROWS = 3 // a blank diagram's sides
const ROUND = 12 // a box's corner radius

/** Function names that stay math; any other run of letters is a word, written upright. */
const MATH_NAMES = /sqrt|pi|sin|cos|tan|log|ln/g
const isWord = (item: string) => /\p{L}{2,}/u.test(item.replace(MATH_NAMES, ''))

/** A mapping diagram laid out for MappingDiagram.svelte to draw. */
export type DiagramLayout = ReturnType<typeof buildDiagram>

/** One item, laid out: its left end and baseline, and its math. */
type Item = { x: number; y: number; box: MathBox }

export function buildDiagram(s: Settings) {
  const scale = LABEL_SCALE[s.labelSize]
  const FS = BASE_ITEM_FS * scale
  const SIDE_FS = BASE_SIDE_FS * scale
  const TITLE_FS = BASE_TITLE_FS * scale
  const ROW = FS * 1.9 // from one item to the next
  const textWidth = (t: string, size: number) => t.length * size * 0.56 // bold sans, roughly

  const { inputs, outputs, arrows } = readMapping(s)
  const lay = (item: string) => (isWord(item) ? layoutMath('', FS, { suffix: item }) : layoutMath(item, FS))!
  const sides = [inputs.map(lay), outputs.map(lay)]
  const rows = inputs.length || outputs.length ? Math.max(inputs.length, outputs.length, MIN_ROWS) : EMPTY_ROWS

  // Each side's items spread down it evenly, a shorter list more widely
  // spaced (to a point) so it fills its side like the longer one.
  const offsets = sides.map((boxes) => {
    const step = boxes.length ? Math.min((rows * ROW) / boxes.length, ROW * 1.6) : 0
    return boxes.map((_, i) => (i - (boxes.length - 1) / 2) * step)
  })

  // Both sides are the same size, big enough for the wider side's items.
  // An oval narrows toward its top and bottom, so it's as wide as its
  // widest item needs at that item's height.
  const widest = Math.max(0, ...sides.flat().map((b) => b.w))
  let half: { w: number; h: number }
  if (s.shape === 'oval') {
    const h = (rows * ROW) / 2 + ROW * 0.7
    const fit = sides.flatMap((boxes, k) => boxes.map((b, i) => (b.w / 2 + FS * 0.7) / Math.sqrt(1 - (offsets[k][i] / h) ** 2)))
    half = { w: Math.max(ROW * 1.3, ...fit), h }
  } else if (s.shape === 'box') half = { w: Math.max(ROW * 1.1, widest / 2 + FS), h: (rows * ROW) / 2 + ROW * 0.4 }
  else half = { w: Math.max(ROW * 0.5, widest / 2), h: (rows * ROW) / 2 }

  // Titles are written text, a blank write-on line for students, or nothing.
  const titleOf = (mode: string, typed: string) => ({ text: mode === 'text' ? typed.trim() : '', blank: mode === 'blank' })
  const title = titleOf(s.titleMode, s.title)
  const sideTitles = [titleOf(s.inputTitleMode, s.inputTitle), titleOf(s.outputTitleMode, s.outputTitle)]
  const BLANK_SIDE = 90
  const sideTitleW = sideTitles.map((t) => (t.text ? textWidth(t.text, SIDE_FS) : t.blank ? BLANK_SIDE : 0))

  // Across: each side is as wide as its shape or its title, whichever is
  // wider, and the two sides' titles never run into each other.
  const reach = sideTitleW.map((w) => Math.max(half.w, w / 2))
  const between = Math.max(2 * half.w + GAP, (sideTitleW[0] + sideTitleW[1]) / 2 + 24)
  const BLANK_TITLE = 260
  const titleW = title.text ? textWidth(title.text, TITLE_FS) : title.blank ? BLANK_TITLE : 0
  const diagramW = reach[0] + between + reach[1]
  const width = Math.max(diagramW, titleW) + 2 * PAD
  const left = PAD + (width - 2 * PAD - diagramW) / 2 + reach[0] // the inputs' middle
  const centers = [left, left + between]
  const midX = width / 2

  // Down: the title, the side titles, then the two sides.
  let y = PAD
  const titleY = y + TITLE_FS
  if (title.text || title.blank) y += TITLE_FS * 1.3 + 12
  const sideTitleY = y + SIDE_FS
  if (sideTitles.some((t) => t.text || t.blank)) y += SIDE_FS * 1.3 + 10
  const cy = y + half.h
  const height = cy + half.h + PAD

  // Items, centered across their side, with their middle on their row.
  const items: Item[][] = sides.map((boxes, k) =>
    boxes.map((box, i) => ({ x: centers[k] - box.w / 2, y: cy + offsets[k][i] + (box.asc - box.desc) / 2, box })),
  )
  const middle = (it: Item) => it.y - (it.box.asc - it.box.desc) / 2

  const texts: { x: number; y: number; text: string; size: number }[] = []
  const blanks: { x1: number; x2: number; y: number }[] = []
  if (title.text) texts.push({ x: midX, y: titleY, text: title.text, size: TITLE_FS })
  else if (title.blank) blanks.push({ x1: midX - BLANK_TITLE / 2, x2: midX + BLANK_TITLE / 2, y: titleY })
  sideTitles.forEach((t, k) => {
    if (t.text) texts.push({ x: centers[k], y: sideTitleY, text: t.text, size: SIDE_FS })
    else if (t.blank) blanks.push({ x1: centers[k] - BLANK_SIDE / 2, x2: centers[k] + BLANK_SIDE / 2, y: sideTitleY })
  })

  return {
    width,
    height,
    shape: s.shape,
    sides: centers.map((cx) => ({ cx, cy, rx: half.w, ry: half.h, round: ROUND })),
    items: items.flat(),
    arrows: arrows.map(({ from, to }) => {
      const a = items[0][from]
      const b = items[1][to]
      return { x1: a.x + a.box.w + ARROW_GAP, y1: middle(a), x2: b.x - ARROW_GAP, y2: middle(b) }
    }),
    texts,
    blanks,
  }
}
