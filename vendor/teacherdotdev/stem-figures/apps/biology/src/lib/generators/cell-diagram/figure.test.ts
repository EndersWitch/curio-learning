import { describe, expect, it } from 'vitest'
import { LABEL_SIZES, type LabelSize } from '$shared/labelSize'
import { cellFigure, type CellFigure } from './figure'
import { crosses, distanceToSegment } from './labels'
import { cellSettings, type CellSettings } from './settings'
import { CELLS, CELL_PARTS, labeledParts } from './structures'

const d = cellSettings.defaults
const settings = (s: Partial<CellSettings>) => cellSettings.tidy({ ...d, ...s })
const fig = (s: Partial<CellSettings>) => cellFigure(settings(s))

/** Every pair of leader lines that cross, by name. */
const crossings = (f: CellFigure) =>
  f.labels.flatMap((a, i) => f.labels.slice(i + 1).filter((b) => crosses(a.from, a.to, b.from, b.to)).map((b) => `${a.id}×${b.id}`))

/** Labels closer to the next one on their side than `height` allows. */
const overlaps = (f: CellFigure, height: number) =>
  f.labels.filter((a) => f.labels.some((b) => b !== a && b.side === a.side && Math.abs(a.y - b.y) < height - 0.01)).map((l) => l.id)

const SIZES = Object.keys(LABEL_SIZES) as LabelSize[]

describe('the figure’s labels', () => {
  for (const cell of CELLS)
    for (const labels of ['names', 'numbers', 'blanks'] as const)
      it(`never cross on a ${cell} cell with ${labels}, at every label size`, () => {
        for (const labelSize of SIZES) {
          const s = { cell, labelSize, labels, with: CELL_PARTS[cell].optional }
          const f = fig(s)
          expect(crossings(f), labelSize).toEqual([])
          expect(f.labels).toHaveLength(labeledParts(settings(s)).length)
        }
      })

  it('never cross with any one structure taken out or left unlabeled', () => {
    for (const cell of CELLS)
      for (const id of CELL_PARTS[cell].standard) {
        expect(crossings(fig({ cell, without: [id] })), `${cell} without ${id}`).toEqual([])
        expect(crossings(fig({ cell, unlabeled: [id] })), `${cell} unlabeled ${id}`).toEqual([])
      }
  })

  it('don’t overlap one another', () => {
    for (const cell of CELLS)
      for (const labelSize of SIZES) {
        const f = fig({ cell, labelSize, labels: 'numbers' })
        expect(overlaps(f, 2 * f.radius), `${cell} ${labelSize}`).toEqual([])
      }
  })

  it('don’t run through another label’s point, in the default figures', () => {
    for (const cell of CELLS) {
      const f = fig({ cell })
      for (const a of f.labels)
        for (const b of f.labels) if (a !== b) expect(distanceToSegment(b.to, a.from, a.to), `${cell}: ${a.id} by ${b.id}`).toBeGreaterThan(8)
    }
  })

  it('sit outside the cell, left and right', () => {
    for (const cell of CELLS) {
      const f = fig({ cell })
      for (const l of f.labels) {
        if (l.side === 'left') expect(l.x).toBeLessThanOrEqual(f.artX)
        else expect(l.x).toBeGreaterThanOrEqual(f.artX + f.plan.width)
      }
    }
  })

  it('number down the left side, then down the right', () => {
    const f = fig({ labels: 'numbers' })
    const left = f.labels.filter((l) => l.side === 'left')
    expect(left.map((l) => l.marker)).toEqual(left.map((_, i) => String(i + 1)))
    expect(left.every((l, i) => i === 0 || l.y > left[i - 1].y)).toBe(true)
    expect(fig({ labels: 'numbers', marker: 'letters' }).labels[0].marker).toBe('A')
  })
})

describe('the word bank and answer key', () => {
  it('list the labeled names, the bank in alphabetical order', () => {
    const f = fig({ labels: 'numbers', wordBank: true, answerKey: true })
    expect(f.boxes.map((b) => b.heading)).toEqual(['Word bank', 'Answer key'])
    const bank = f.boxes[0].items.map((i) => i.text)
    expect(bank).toEqual([...bank].sort((a, b) => a.localeCompare(b)))
    expect(bank).toHaveLength(f.labels.length)
    expect(f.boxes[1].items[0].text).toBe(`1. ${f.labels[0].name}`)
  })

  it('show only for numbers or blank lines', () => {
    expect(fig({ labels: 'names', wordBank: true, answerKey: true }).boxes).toEqual([])
    expect(fig({ labels: 'blanks', wordBank: true, answerKey: true }).boxes.map((b) => b.heading)).toEqual(['Word bank'])
  })

  it('make the figure taller', () => {
    expect(fig({ labels: 'numbers', wordBank: true }).height).toBeGreaterThan(fig({ labels: 'numbers' }).height)
  })
})

describe('with no labels', () => {
  it('is just the cell', () => {
    const f = fig({ labels: 'none' })
    expect(f.labels).toEqual([])
    expect(f.width).toBe(f.plan.width)
  })
})
