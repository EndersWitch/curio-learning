// Lays out a whole Cell Diagram for CellFigure.svelte to draw: the cell in
// the middle, its labels down both sides with their leader lines, and the
// word bank and answer key under it.
//
// Each structure can be pointed at in a few places (a different
// mitochondrion, the other side of the nucleus), labeled from the left or
// the right. The layout tries them in turn and keeps whichever leaves the
// fewest leader lines crossing other organelles or running close by
// another label's point, with the labels nearest level with what they name.

import { LABEL_SCALE } from '$shared/labelSize'
import { PLANS, type Anchor, type Block, type CellPlan } from './cells'
import { column, crosses, distanceToSegment, hitsEllipse, textWidth, wrap, type Side } from './labels'
import type { Pt } from './shapes'
import type { CellSettings } from './settings'
import { PARTS, drawnParts, labeledParts, partName, type PartId } from './structures'

// Sizes at the medium label size.
const BASE_FS = 17
/** between a label column and the cell */
const GAP = 30
/** between a label and the start of its leader line */
const LEAD_PAD = 6
/** the widest a name gets before wrapping onto a second line */
const BASE_MAX_NAME = 170
/** a blank line's length, for students to write a name on */
const BASE_BLANK = 150
const BANK_PAD = 14

export interface PlacedLabel {
  id: PartId
  side: Side
  name: string
  /** the name broken into lines, for a names label */
  lines: string[]
  /** "1" or "A", for a numbered label */
  marker: string
  /** the label's centre height, and the edge of it facing the cell */
  y: number
  x: number
  /** the leader line, from the label to the structure */
  from: Pt
  to: Pt
}

export interface ListBox {
  x: number
  y: number
  width: number
  height: number
  heading: string
  items: { text: string; x: number; y: number }[]
}

export type CellFigure = ReturnType<typeof cellFigure>

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** What a leader line crossing each kind of block costs: big plain ones
 *  (the nucleus, the vacuole) and single ribosomes matter less. */
const BLOCK_COST: Partial<Record<PartId, number>> = { nucleus: 5, vacuole: 4, nucleoid: 4, ribosomes: 4 }
const CROSSING_COST = 400
const NEAR_ANCHOR_COST = 60
/** an anchor sitting on some other structure, so it's unclear which is meant */
const COVERED_ANCHOR_COST = 40
const SLANT_COST = 0.06
const CHOICE_COST = 2

interface Content {
  id: PartId
  name: string
  lines: string[]
  width: number
  height: number
  candidates: Anchor[]
}

/** Whether a leader to `id` may run over `block` without it counting:
 *  its own structure, and the nucleus for anything inside it. */
const exempt = (id: PartId, block: Block) => block.id === id || (block.id === 'nucleus' && (id === 'nucleus' || PARTS[id].parent === 'nucleus'))

export function cellFigure(s: CellSettings) {
  const plan: CellPlan = PLANS[s.cell]
  const scale = LABEL_SCALE[s.labelSize]
  const fs = BASE_FS * scale
  const lineH = fs * 1.2
  const radius = fs * 0.8 // a number's circle
  const blank = BASE_BLANK * scale
  const drawn = drawnParts(s)
  const labeled = s.labels === 'none' ? [] : labeledParts(s).filter((id) => plan.anchors[id]?.length)
  const blocks = plan.blocks.filter((b) => drawn.includes(b.id))

  const content: Content[] = labeled.map((id) => {
    const name = partName(id, s.naming)
    const lines = wrap(name, fs, BASE_MAX_NAME * scale)
    const nameW = Math.max(...lines.map((l) => textWidth(l, fs)))
    const [width, height] =
      s.labels === 'names' ? [nameW, lines.length * lineH]
      : s.labels === 'numbers' ? [2 * radius, 2 * radius]
      : [s.answerKey ? Math.max(blank, textWidth(name, fs) + 10) : blank, lineH * 1.5]
    return { id, name, lines, width, height, candidates: plan.anchors[id]! }
  })

  // Each side's labels from a little above the cell to a little below it.
  const lo = -fs
  const hi = plan.height + fs
  const gap = s.labels === 'names' ? fs * 0.45 : fs * 0.35

  /** The labels, laid out with each structure's chosen anchor. */
  function layout(choice: number[]) {
    const items = content.map((c, i) => ({ ...c, anchor: c.candidates[choice[i]], choice: choice[i] }))
    const sideWidth = (side: Side) => Math.max(0, ...items.filter((c) => c.anchor.side === side).map((c) => c.width))
    const leftW = sideWidth('left')
    const rightW = sideWidth('right')
    const artX = leftW ? leftW + GAP : 0
    const width = artX + plan.width + (rightW ? GAP + rightW : 0)
    const placed = (['left', 'right'] as Side[]).flatMap((side) => {
      const edge = side === 'left' ? leftW : artX + plan.width + GAP
      const leadX = s.labels === 'names' ? edge + (side === 'left' ? LEAD_PAD : -LEAD_PAD) : edge
      const items_ = items
        .filter((c) => c.anchor.side === side)
        .map((c) => ({ key: c, anchor: [artX + c.anchor.at[0], c.anchor.at[1]] as Pt, height: c.height }))
      return column(items_, leadX, lo, hi, gap).map((p) => ({ ...p, side, edge }))
    })
    return { placed, artX, width }
  }

  /** How bad a layout's leader lines are (see the costs above). */
  function cost(l: ReturnType<typeof layout>) {
    let total = 0
    for (const a of l.placed) {
      const from = a.start
      // Stop a little short of the end, which sits on its own structure.
      const len = Math.hypot(a.anchor[0] - from[0], a.anchor[1] - from[1]) || 1
      const to: Pt = [a.anchor[0] - ((a.anchor[0] - from[0]) / len) * 3, a.anchor[1] - ((a.anchor[1] - from[1]) / len) * 3]
      const start: Pt = [from[0] - l.artX, from[1]]
      const end: Pt = [a.anchor[0] - l.artX, a.anchor[1]]
      const [x0, x1] = [Math.min(start[0], end[0]), Math.max(start[0], end[0])]
      const [y0, y1] = [Math.min(start[1], end[1]), Math.max(start[1], end[1])]
      for (const b of blocks) {
        const r = Math.max(b.rx, b.ry) + 3
        if (b.at[0] + r < x0 || b.at[0] - r > x1 || b.at[1] + r < y0 || b.at[1] - r > y1) continue
        if (exempt(a.key.id, b)) continue
        if (hitsEllipse(start, [to[0] - l.artX, to[1]], b)) total += BLOCK_COST[b.id] ?? 30
        if (hitsEllipse(end, end, { ...b, rx: b.rx + 3, ry: b.ry + 3 })) total += COVERED_ANCHOR_COST
      }
      for (const b of l.placed) {
        if (b === a) continue
        if (crosses(from, a.anchor, b.start, b.anchor)) total += CROSSING_COST / 2
        if (distanceToSegment(b.anchor, from, a.anchor) < 14) total += NEAR_ANCHOR_COST
      }
      total += Math.abs(a.y - a.anchor[1]) * SLANT_COST + a.key.choice * CHOICE_COST
    }
    return total
  }

  // Try each structure's other anchors in turn, keeping any that help, until
  // nothing does.
  const choice = content.map(() => 0)
  let best = layout(choice)
  let bestCost = cost(best)
  for (let pass = 0; pass < 4; pass++) {
    let better = false
    content.forEach((c, i) => {
      for (let k = 0; k < c.candidates.length; k++) {
        const kept = choice[i]
        if (k === kept) continue
        choice[i] = k
        const next = layout(choice)
        const nextCost = cost(next)
        if (nextCost < bestCost - 1e-6) {
          best = next
          bestCost = nextCost
          better = true
        } else choice[i] = kept
      }
    })
    if (!better) break
  }
  const { placed, artX, width } = best

  // Numbered down the left side, then down the right.
  const labels: PlacedLabel[] = placed.map((p, i) => ({
    id: p.key.id,
    side: p.side,
    name: p.key.name,
    lines: p.key.lines,
    marker: s.marker === 'letters' ? (LETTERS[i] ?? String(i + 1)) : String(i + 1),
    y: p.y,
    x: p.edge,
    from: p.start,
    to: p.anchor,
  }))

  // Labels can reach a little above and below the cell; the drawing grows to fit them.
  const extents = placed.map((p) => [p.y - p.key.height / 2, p.y + p.key.height / 2])
  const top = Math.min(0, ...extents.map((e) => e[0]))
  const bottom = Math.max(plan.height, ...extents.map((e) => e[1]))

  // The word bank and answer key go under the cell, in as many columns as fit.
  const boxes: ListBox[] = []
  let y = bottom - top + fs * 1.4
  const list = (heading: string, texts: string[], columnMajor: boolean) => {
    const colW = Math.max(...texts.map((t) => textWidth(t, fs))) + fs * 2
    const cols = Math.max(1, Math.min(texts.length, Math.floor((width - 2 * BANK_PAD) / colW), 4))
    const rows = Math.ceil(texts.length / cols)
    const x0 = (width - cols * colW) / 2 + fs
    const headH = fs * 1.9
    const items = texts.map((text, i) => {
      const [col, row] = columnMajor ? [Math.floor(i / rows), i % rows] : [i % cols, Math.floor(i / cols)]
      return { text, x: x0 + col * colW, y: y + BANK_PAD + headH + row * lineH * 1.1 + fs * 0.35 }
    })
    const height = BANK_PAD * 2 + headH + rows * lineH * 1.1 - fs * 0.2
    boxes.push({ x: 0.75, y, width: width - 1.5, height, heading, items })
    y += height + fs
  }
  const quiz = s.labels === 'numbers' || s.labels === 'blanks'
  if (quiz && s.wordBank && labels.length) list('Word bank', labels.map((l) => l.name).sort((a, b) => a.localeCompare(b)), false)
  if (s.labels === 'numbers' && s.answerKey && labels.length)
    list('Answer key', labels.map((l) => `${l.marker}. ${l.name}`), true)

  return {
    plan,
    drawn: new Set(drawn),
    labels,
    boxes,
    fs,
    lineH,
    radius,
    blank,
    width,
    height: boxes.length ? y - fs : bottom - top,
    /** where the cell's drawing sits */
    artX,
    artY: -top,
    /** how far from ideal the leader lines are, for tests */
    cost: bestCost,
  }
}

/** A description of the figure for screen readers. */
export function describe(s: CellSettings, f: CellFigure) {
  const kind = { animal: 'An animal cell', plant: 'A plant cell', bacterium: 'A bacterial cell' }[s.cell]
  const parts = [...f.drawn].map((id) => partName(id, s.naming).toLowerCase())
  const labels =
    s.labels === 'none' || !f.labels.length ? 'no labels'
    : s.labels === 'names' ? `labels for ${f.labels.map((l) => l.name.toLowerCase()).join(', ')}`
    : s.labels === 'numbers' ? `${f.labels.length} numbered labels`
    : `${f.labels.length} blank labels`
  return `${kind} showing ${parts.join(', ')}, with ${labels}`
}
