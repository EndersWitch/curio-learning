// The whole figure laid out: the structure (or its resonance structures in a
// row joined by ↔), and the answer key under it, drawn or written.

import { drawStructure, type Drawing } from './drawing'
import type { Figure, LewisSettings } from './settings'
import type { Structure } from './structure'

export const KEY_FONT = 16
export const KEY_LINE = 23
const ARROW_W = 52
const KEY_GAP = 30
const HEADING_H = 26
const MIN_TEXT_W = 380

/** An atom or bond picked for changing, by clicking it or in the settings. */
export type Selection = { kind: 'atom' | 'bond'; index: number }

export interface Placed<T> {
  x: number
  y: number
  item: T
}

export interface Row {
  width: number
  height: number
  drawings: Placed<Drawing>[]
  /** the middle of each ↔ between resonance structures */
  arrows: { x: number; y: number }[]
}

export interface FigureLayout {
  width: number
  height: number
  main: { kind: 'row'; row: Row; x: number } | { kind: 'empty' }
  key?: { heading: { x: number; y: number }; row?: { row: Row; x: number; y: number }; lines?: { x: number; y: number; text: string }[] }
}

/** Structures side by side, with ↔ between them. */
export function rowOf(structures: Structure[], draw: (s: Structure) => Drawing): Row {
  const drawings = structures.map(draw)
  const height = Math.max(0, ...drawings.map((d) => d.height))
  const placed: Placed<Drawing>[] = []
  const arrows: Row['arrows'] = []
  let x = 0
  drawings.forEach((d, i) => {
    if (i) {
      arrows.push({ x: x + ARROW_W / 2, y: height / 2 })
      x += ARROW_W
    }
    placed.push({ x, y: (height - d.height) / 2, item: d })
    x += d.width
  })
  return { width: x, height, drawings: placed, arrows }
}

/** Text broken into lines no wider than `width`, as near as letters' widths can be guessed. */
export function wrap(text: string, width: number, size: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && next.length * size * 0.5 > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function layoutFigure(s: LewisSettings, figure: Figure): FigureLayout {
  if (!figure.resolved.ok || !figure.shown.length) return { width: 240, height: 60, main: { kind: 'empty' } }

  const full = (x: Structure) => drawStructure(x, { bondStyle: s.bondStyle, formalCharges: s.formalCharges })
  const scaffolded = (x: Structure) =>
    s.scaffold === 'bonds'
      ? drawStructure(x, { bondStyle: s.bondStyle, electrons: false })
      : s.scaffold === 'skeleton'
        ? drawStructure(x, { bonds: false, electrons: false })
        : full(x)

  const row = rowOf(figure.shown, scaffolded)
  const mainW = row.width
  const mainH = row.height
  const main = { kind: 'row' as const, row, x: 0 }

  let key: FigureLayout['key']
  let keyW = 0
  let keyH = 0
  if (figure.key.kind === 'structures') {
    const row = rowOf(figure.key.structures, full)
    keyW = row.width
    keyH = HEADING_H + row.height
    key = { heading: { x: 0, y: 0 }, row: { row, x: 0, y: HEADING_H } }
  } else if (figure.key.kind === 'mistakes') {
    const width = Math.max(mainW, MIN_TEXT_W)
    const texts = figure.key.mistakes.length ? figure.key.mistakes : ['No mistakes: the structure is still correct.']
    const lines: { x: number; y: number; text: string }[] = []
    for (const mistake of texts)
      wrap(mistake, width - 16, KEY_FONT).forEach((text, i) => lines.push({ x: 0, y: HEADING_H + lines.length * KEY_LINE, text: (i ? '   ' : '• ') + text }))
    keyW = width
    keyH = HEADING_H + lines.length * KEY_LINE
    key = { heading: { x: 0, y: 0 }, lines }
  }

  const width = Math.max(mainW, keyW)
  main.x = (width - mainW) / 2
  if (key) {
    const top = mainH + KEY_GAP
    const left = key.lines ? 0 : (width - keyW) / 2
    key.heading = { x: key.lines ? 0 : width / 2, y: top + 16 }
    if (key.row) key.row = { ...key.row, x: left, y: top + key.row.y }
    if (key.lines) key.lines = key.lines.map((l) => ({ ...l, x: left, y: top + l.y + 16 }))
  }
  return { width, height: mainH + (key ? KEY_GAP + keyH : 0), main, key }
}
