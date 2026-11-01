// The whole Mitosis & Meiosis figure: one phase, or a strip of phases in
// even panels, with the phase names, chromosome counts, structure labels, the
// maternal and paternal key, and the answer key. Positions here are in the
// figure's own units; each phase's picture (./layout.ts) is scaled into its
// panel, so every panel of a strip draws chromosomes the same size.

import { LABEL_SCALE } from '$shared/labelSize'
import { along, unionBox, type Box, type ChromosomeShape, type Point } from './chromosomes'
import { phasePicture, type Body, type PhasePicture } from './layout'
import { PHASE_NAMES, countText, phaseLabel, type Phase } from './model'
import {
  columnsFor,
  crossed,
  figurePhases,
  pairsOf,
  stripPhases,
  structuresOn,
  type CellDivisionSettings,
  type Structure,
} from './settings'

/** A single phase's picture is scaled to about this size, and a strip's panels to this width. */
const SINGLE_W = 440
const SINGLE_H = 320
const PANEL_W = 250
const PANEL_GAP = 26
const ROW_GAP = 22

const FONT = { phase: 18, count: 14, label: 16, key: 15 }

/** About how wide a line of Arial is. */
export const textWidth = (text: string, size: number) => text.length * size * 0.55

export interface CountLabel {
  text: string
  x: number
  y: number
}

export interface Panel {
  phase: Phase
  picture: PhasePicture
  /** where the picture's (0, 0) goes, and how much it is scaled */
  x: number
  y: number
  scale: number
  /** the phase's label under the panel: its text, or a blank line */
  label?: { text: string; x: number; y: number; blank: boolean; width: number }
  counts: CountLabel[]
}

export interface StructureLabel {
  structure: Structure
  /** what it says, or its letter, or '' for a blank line */
  text: string
  /** the name, for the answer key */
  name: string
  side: 'left' | 'right'
  /** where its text (or blank line) ends nearest the figure */
  x: number
  y: number
  /** where its leader lines go */
  points: Point[]
}

export interface KeyEntry {
  homolog: 'm' | 'p'
  name: string
  x: number
  y: number
}

export interface Figure {
  width: number
  height: number
  panels: Panel[]
  labels: StructureLabel[]
  /** the size labels are drawn at, after the label size setting */
  fonts: typeof FONT
  /** the maternal and paternal key */
  key: KeyEntry[]
  /** structures turned on that this phase doesn't show */
  missing: Structure[]
  answer: string
  /** an aria label for the figure */
  description: string
}

const STRUCTURE_NAMES: Record<Structure, string> = {
  chromosome: 'Chromosome',
  sisters: 'Sister chromatids',
  centromere: 'Centromere',
  pair: 'Homologous pair',
  spindle: 'Spindle fibers',
  centrioles: 'Centrioles',
  envelope: 'Nuclear envelope',
  division: 'Cleavage furrow',
}

/** A structure's name as it is labeled on this figure. */
export function structureName(structure: Structure, s: Pick<CellDivisionSettings, 'cell'>, paired = false) {
  if (structure === 'division' && s.cell === 'plant') return 'Cell plate'
  if (structure === 'pair' && paired) return 'Tetrad'
  return STRUCTURE_NAMES[structure]
}

/** A nuclear envelope breaking down is drawn in pieces: the first starts at
 *  this angle round the nucleus, and each is a piece and a gap long. Its
 *  label points at the middle of a piece, low on the left, away from the
 *  centrioles. */
export const ENVELOPE_START = -150
export const ENVELOPE_PIECE = 30
export const ENVELOPE_STEP = 52
const ENVELOPE_AT = ENVELOPE_START + ENVELOPE_PIECE / 2 + 5 * ENVELOPE_STEP

const condensed = (s: ChromosomeShape) => s.chromatids[0].look === 'condensed'

/** Where each structure is in a picture, for its label: one point, or two
 *  for a label naming two things (sister chromatids, a homologous pair). */
export function targetsIn(picture: PhasePicture): Partial<Record<Structure, Point[]>> {
  const body: Body = picture.bodies[0]
  const { stage, paired } = picture.state
  const out: Partial<Record<Structure, Point[]>> = {}
  // points moved down with their cell
  const at = (points: Point[]) => points.map((p) => ({ x: p.x, y: p.y + body.dy }))
  const shapes = body.chromosomes
  const visible = shapes.filter(condensed)
  const replicated = visible.filter((s) => s.chromatids.length === 2)

  if (stage !== 'interphase' && shapes.length) {
    const first = visible[0] ?? shapes[0]
    out.chromosome = at([along(first.chromatids[0], 0.06)])
  }
  if (replicated.length) {
    const pick = replicated[replicated.length - 1]
    out.sisters = at(pick.chromatids.map((c) => along(c, 0.8)))
  }
  const withCentromere = replicated.length ? replicated : stage === 'anaphase' ? visible : []
  if (withCentromere.length) {
    const pick = withCentromere[Math.min(1, withCentromere.length - 1)]
    out.centromere = at([pick.centromere])
  }
  if (paired && replicated.length >= 2) {
    // the tetrad's right-hand homolog, at its outer edge
    const right = replicated[1]
    out.pair = at([{ x: right.box.x2 - 2, y: right.centromere.y + 6 }])
  } else if (stage !== 'interphase') {
    const both = shapes.filter((s) => s.chromosome.pair === 0)
    const m = both.find((s) => s.chromosome.homolog === 'm')
    const p = both.find((s) => s.chromosome.homolog === 'p')
    if (m && p) out.pair = at([m, p].map((s) => along(s.chromatids[0], 0.55)))
  }
  const kinetochore = body.fibers.find((f) => f.kind === 'kinetochore') ?? (stage === 'prophase' ? body.fibers[0] : undefined)
  if (kinetochore) out.spindle = at([kinetochore.mid])
  if (body.centrosomes.length) out.centrioles = at([body.centrosomes[0]])
  const nucleus = body.nuclei[0]
  if (nucleus) {
    const a = ((nucleus.broken ? ENVELOPE_AT : 145) * Math.PI) / 180
    out.envelope = at([{ x: nucleus.x + nucleus.r * Math.cos(a), y: nucleus.y + nucleus.r * Math.sin(a) }])
  }
  if (body.furrow) out.division = at([body.furrow])
  else if (body.plate) out.division = at([{ x: body.plate.x, y: body.plate.y1 + (body.plate.y2 - body.plate.y1) * 0.18 }])
  return out
}

/** Lay out labels down one side: in the order of what they point at, spaced
 *  so none touch, and kept within `top` to `bottom` where they can be. */
export function spread(ys: number[], gap: number, top: number, bottom: number): number[] {
  const out = [...ys]
  for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], i ? out[i - 1] + gap : top)
  const over = out.length ? out[out.length - 1] - bottom : 0
  if (over > 0) {
    out[out.length - 1] -= over
    for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - gap)
  }
  return out
}

/** Labels under a row of panels or cells, centered on their x, in a second
 *  row when they'd touch the one before. */
function countLabels(items: { text: string; x: number }[], y: number, size: number): CountLabel[] {
  const ends = [-Infinity, -Infinity]
  return items.map(({ text, x }) => {
    const half = textWidth(text, size) / 2
    const row = x - half > ends[0] + 6 ? 0 : 1
    ends[row] = x + half
    return { text, x, y: y + row * size * 1.25 }
  })
}

const LETTERS = 'ABCDEFGHIJ'

/** Lines of the answer key, wrapped to fit `width`. */
function wrap(parts: string[], width: number, size = 18) {
  const lines: string[] = []
  for (const part of parts) {
    const last = lines.length ? lines[lines.length - 1] : ''
    if (last && textWidth(`${last} · ${part}`, size) <= width) lines[lines.length - 1] = `${last} · ${part}`
    else lines.push(part)
  }
  return lines
}

export function cellDivisionFigure(s: CellDivisionSettings): Figure {
  const scaleText = LABEL_SCALE[s.labelSize]
  const fonts = {
    phase: FONT.phase * scaleText,
    count: FONT.count * scaleText,
    label: FONT.label * scaleText,
    key: FONT.key * scaleText,
  }
  const pairs = pairsOf(s)
  const phases = figurePhases(s)
  const pictures = phases.map((phase) => phasePicture(phase, pairs, s.cell, crossed(s)))
  const strip = s.layout === 'strip'

  // Every panel the same box, so chromosomes are the same size in each.
  const box: Box = unionBox(pictures.map((p) => ({ x1: p.box.x1, y1: p.box.y1, x2: p.box.x2, y2: p.box.y2 })))
  const half = { w: Math.max(-box.x1, box.x2), h: Math.max(-box.y1, box.y2) }
  const scale = strip ? PANEL_W / (2 * half.w) : Math.min(SINGLE_W / (2 * half.w), SINGLE_H / (2 * half.h))
  const cellW = 2 * half.w * scale
  const labelH = s.phaseLabels === 'none' ? 0 : 14 + fonts.phase * 1.2
  const columns = strip ? columnsFor(phases.length, s.perRow) : 1
  const rows = Math.ceil(phases.length / columns)

  // Each cell's count goes just under it, from the panel's middle; labels at
  // one height share a line, or take a second.
  const hasCounts = s.countLabels !== 'none'
  const relativeCounts = pictures.map((picture) => {
    const out: CountLabel[] = []
    if (!hasCounts) return out
    const lines = new Map<number, { text: string; x: number }[]>()
    for (const b of picture.bodies)
      for (const c of b.counts) {
        const at = Math.round((c.y + b.dy) * scale)
        lines.set(at, [...(lines.get(at) ?? []), { text: countText(c.chromosomes, pairs, s.countLabels as 'ploidy' | 'count'), x: c.x * scale }])
      }
    for (const [at, items] of lines) out.push(...countLabels(items, at + 6 + fonts.count, fonts.count))
    return out
  })

  // A strip's rows are as tall as their tallest picture, with room under it for counts.
  const halfH = pictures.map((p) => Math.max(-p.box.y1, p.box.y2) * scale)
  const inRow = (r: number) => phases.map((_, i) => i).filter((i) => Math.floor(i / columns) === r)
  const rowHalf = Array.from({ length: rows }, (_, r) => (strip ? Math.max(...inRow(r).map((i) => halfH[i])) : half.h * scale))
  const rowBelow = rowHalf.map((h, r) => Math.max(h, ...inRow(r).flatMap((i) => relativeCounts[i].map((c) => c.y + 5))) - h)
  const rowH = rowHalf.map((h, r) => 2 * h + rowBelow[r] + labelH)
  const rowTop = rowH.map((_, r) => rowH.slice(0, r).reduce((a, b) => a + b + ROW_GAP, 0))
  const pictureH = 2 * rowHalf[0]

  // Structure labels, for one phase on its own.
  const on = strip ? [] : structuresOn(s)
  const targets = strip ? {} : targetsIn(pictures[0])
  const missing = on.filter((k) => !targets[k])
  const shown = on.filter((k) => targets[k])
  const paired = pictures[0].state.paired
  const toFigure = (p: Point, ox: number, oy: number) => ({ x: ox + p.x * scale, y: oy + p.y * scale })
  const blankW = 96
  const labelText = (k: Structure, i: number) =>
    s.labelStyle === 'names' ? structureName(k, s, paired) : s.labelStyle === 'letters' ? LETTERS[i] : ''
  const labelW = (k: Structure, i: number) => (s.labelStyle === 'blank' ? blankW : textWidth(labelText(k, i), fonts.label) + (s.labelStyle === 'letters' ? 4 : 0))

  // Which side each label goes: the side of what it points at, moving the
  // nearest the middle across while one side has more than fit down it.
  const anchors = shown.map((k) => {
    const points = targets[k]!
    return { k, x: points.reduce((a, p) => a + p.x, 0) / points.length, y: points.reduce((a, p) => a + p.y, 0) / points.length }
  })
  const sides = new Map<Structure, 'left' | 'right'>(anchors.map((a) => [a.k, a.x < 0 ? 'left' : 'right']))
  const count = (side: 'left' | 'right') => anchors.filter((a) => sides.get(a.k) === side).length
  const fit = Math.max(1, Math.floor((2 * half.h * scale) / (fonts.label * 1.7)))
  while (Math.max(count('left'), count('right')) > fit && Math.min(count('left'), count('right')) < fit) {
    const from = count('left') > count('right') ? 'left' : 'right'
    const nearest = anchors.filter((a) => sides.get(a.k) === from).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0]
    sides.set(nearest.k, from === 'left' ? 'right' : 'left')
  }
  const sideW = (side: 'left' | 'right') =>
    Math.max(0, ...shown.map((k, i) => (sides.get(k) === side ? labelW(k, i) + 34 : 0)))
  const leftW = sideW('left')
  const rightW = sideW('right')

  const drawingW = columns * cellW + (columns - 1) * PANEL_GAP
  const keyH = s.key ? 36 : 0
  let width = leftW + drawingW + rightW
  const height = rowTop[rows - 1] + rowH[rows - 1] + keyH

  const panels: Panel[] = phases.map((phase, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    const left = leftW + col * (cellW + PANEL_GAP)
    const x = left + cellW / 2
    const y = rowTop[row] + rowHalf[row]
    const picture = pictures[i]
    const counts = relativeCounts[i].map((c) => ({ ...c, x: x + c.x, y: y + c.y }))
    const labelY = y + rowHalf[row] + rowBelow[row] + 8 + fonts.phase
    const text = s.phaseLabels === 'name' ? phaseLabel(phase) : s.phaseLabels === 'number' ? String(i + 1) : ''
    const label =
      s.phaseLabels === 'none'
        ? undefined
        : { text, x, y: labelY, blank: s.phaseLabels === 'blank', width: Math.min(cellW * 0.8, 170 * scaleText) }
    return { phase, picture, x, y, scale, label, counts }
  })

  // Lettered in reading order: down the left side, then down the right.
  const labels: StructureLabel[] = []
  if (shown.length) {
    const p0 = panels[0]
    const gap = fonts.label * 1.7
    for (const side of ['left', 'right'] as const) {
      const list = anchors.filter((a) => sides.get(a.k) === side).sort((a, b) => a.y - b.y)
      const ys = spread(
        list.map((a) => p0.y + a.y * scale),
        gap,
        fonts.label,
        pictureH - 4,
      )
      list.forEach((a, j) => {
        labels.push({
          structure: a.k,
          text: labelText(a.k, labels.length),
          name: structureName(a.k, s, paired),
          side,
          x: side === 'left' ? leftW - 16 : leftW + drawingW + 16,
          y: ys[j],
          points: targets[a.k]!.map((p) => toFigure(p, p0.x, p0.y)),
        })
      })
    }
  }

  const key: KeyEntry[] = s.key
    ? (['m', 'p'] as const).map((homolog, i) => ({
        homolog,
        name: homolog === 'm' ? 'Maternal' : 'Paternal',
        x: leftW + drawingW / 2 + (i ? 14 : -textWidth('Maternal', fonts.key) - 54),
        y: height - keyH / 2,
      }))
    : []

  // The answer key: the phases in each panel, and their right order when shuffled.
  const answerParts: string[] = []
  if (strip) {
    phases.forEach((p, i) => answerParts.push(`${i + 1}. ${PHASE_NAMES[p]}`))
    if (s.order === 'shuffled') {
      const real = stripPhases(s)
      answerParts.push(`In order: ${real.map((p) => phases.indexOf(p) + 1).join(', ')}`)
    }
  } else {
    answerParts.push(PHASE_NAMES[phases[0]])
    if (s.labelStyle === 'letters') labels.forEach((l) => answerParts.push(`${l.text}: ${l.name}`))
    if (s.labelStyle === 'blank')
      for (const side of ['left', 'right'] as const) {
        const names = labels.filter((l) => l.side === side).map((l) => l.name)
        if (names.length) answerParts.push(`${side === 'left' ? 'Left' : 'Right'}, top down: ${names.join(', ')}`)
      }
  }
  width = Math.max(width, 200)
  const answer = wrap(answerParts, width).join('\n')

  const description =
    `${strip ? `${phases.length} phases of ${s.process}` : `${PHASE_NAMES[phases[0]]} of ${s.process}`}, ` +
    `${s.cell} cell${strip ? 's' : ''} with 2n = ${s.diploid}` +
    (crossed(s) ? ', with crossing over' : '') +
    (strip ? `: ${phases.map((p) => PHASE_NAMES[p]).join(', ')}` : '') +
    (labels.length ? `. Labeled: ${labels.map((l) => l.name.toLowerCase()).join(', ')}` : '')

  return { width, height, panels, labels, fonts, key, missing, answer, description }
}
