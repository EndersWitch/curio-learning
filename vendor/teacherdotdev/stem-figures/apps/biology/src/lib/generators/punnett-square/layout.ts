// Where everything on a Punnett square figure goes. From the top: the chart
// title, the question, then the square itself, with the first parent and its
// gametes across the top and the second down the side, then the key to any
// shading and the summary lines. Text sizes follow the label size; cells
// grow to fit what's written in them.

import { LABEL_SCALE } from '$shared/labelSize'
import { isFemale, phenotypeCounts, phenotypeKey, shownAlleles, type Square } from './genetics'
import { readNames, type PunnettSettings } from './settings'
import { classesOf, genotypeLine, phenotypeLines, phenotypeRuns, type SummaryLine } from './summary'
import { allelesRuns, genotypeRuns, runsWidth, text, words, wrap, type Run } from './text'

/** The fills a shaded cell can have, each still telling phenotypes apart
 *  once photocopied: light gray, then hatching, dots and cross-hatching. */
export const PATTERNS = ['gray', 'hatch', 'dots', 'cross'] as const
export type Pattern = (typeof PATTERNS)[number] | 'white'

/** A line of text. `x` is its start, or its middle when `middle`. */
export interface TextLine {
  x: number
  y: number
  size: number
  runs: Run[]
  middle?: boolean
}

/** A line for students to write on. */
export interface Blank {
  x1: number
  x2: number
  y: number
}

export interface CellLayout {
  x: number
  y: number
  row: number
  column: number
  lines: TextLine[]
  fill?: Pattern
}

export interface KeyEntry {
  x: number
  y: number
  size: number
  fill: Pattern
  label: TextLine
}

export interface PunnettLayout {
  width: number
  height: number
  heading: TextLine[]
  grid: { x: number; y: number; n: number; cell: number }
  cells: CellLayout[]
  text: TextLine[]
  blanks: Blank[]
  key: KeyEntry[]
  /** the patterns the figure uses, to define once */
  patterns: Pattern[]
}

const MIN_WRAP = 520
const GAP = 18

/** Is this cell left for students to fill in? */
export const isBlank = (s: PunnettSettings, row: number, column: number, n: number) =>
  s.cells === 'blank' || (s.cells === 'some' && (s.blanks & (1 << (row * n + column))) !== 0)

/** Which fill each phenotype gets, by its key: with 'each', every phenotype
 *  its own, the last (most recessive) left white; or just the one chosen, gray. */
export function shadingOf(s: PunnettSettings, sq: Square): Map<string, Pattern> {
  const shades = new Map<string, Pattern>()
  if (!s.shade) return shades
  const kinds = phenotypeCounts(sq).map((t) => t.key)
  if (s.shade === 'each') {
    kinds.forEach((k, i) => shades.set(k, i === kinds.length - 1 && kinds.length > 1 ? 'white' : PATTERNS[i % PATTERNS.length]))
  } else if (kinds.includes(s.shade)) shades.set(s.shade, 'gray')
  return shades
}

export function punnettLayout(s: PunnettSettings, sq: Square): PunnettLayout {
  const k = LABEL_SCALE[s.labelSize]
  const big = sq.cross !== 'dihybrid'
  const n = sq.top.length
  const cellSize = (big ? 34 : 24) * k
  const gameteSize = (big ? 30 : 22) * k
  const parentSize = (big ? 26 : 20) * k
  const nameSize = (big ? 17 : 13) * k
  const summarySize = 19 * k
  const names = readNames(s.names)
  const classes = classesOf(sq)

  // What each cell says: its genotype, then its phenotype's name under it
  // (one line per gene) when asked for.
  const cellWords = sq.cells.map((row) =>
    row.map((g) => {
      const lines = [{ runs: genotypeRuns(g), size: cellSize }]
      if (s.cellNames) {
        g.forEach((alleles, gene) => {
          lines.push({ runs: phenotypeRuns([classes[gene]], names, [shownAlleles(alleles, sq.dominance)]), size: nameSize })
        })
      }
      return lines
    }),
  )
  const cellTextW = Math.max(...cellWords.flat(2).map((l) => runsWidth(l.runs, l.size)))
  const cellTextH = Math.max(...cellWords.flat().map((ls) => ls.reduce((h, l, i) => h + l.size * (i ? 1.3 : 1), 0)))
  const cell = Math.ceil(Math.max((big ? 112 : 78) * k, cellTextW + 22 * k, cellTextH + 34 * k))

  // The gametes across the top and down the side.
  const gameteRuns = (gs: typeof sq.top) => gs.map((g) => allelesRuns(g))
  const topGametes = gameteRuns(sq.top)
  const sideGametes = gameteRuns(sq.side)
  const gameteW = Math.max(gameteSize * 1.2, ...sideGametes.map((r) => runsWidth(r, gameteSize)))
  const gameteCol = Math.ceil(gameteW + 16 * k)
  const gameteRow = Math.ceil(gameteSize * 1.55)

  // The parents: each labeled the way the teacher chose, its genotype
  // written or left blank.
  const sexOf = (i: 0 | 1) => (sq.cross === 'x-linked' ? (isFemale(sq.parents[i]) ? 0 : 1) : i)
  const prefix = (i: 0 | 1): Run[] =>
    s.parentLabels === 'sex'
      ? [text(sexOf(i) ? '♂' : '♀', 'symbol'), text(' ')]
      : s.parentLabels === 'mother'
        ? [text(sexOf(i) ? 'Father' : 'Mother', 'bold'), text(' ')]
        : []
  const blankParent = s.parentGenotypes === 'blank'
  const parentBlankW = 64 * k
  const parentRuns = (i: 0 | 1) => [...prefix(i), ...(blankParent ? [] : genotypeRuns(sq.parents[i]))]
  const parentW = (i: 0 | 1) => runsWidth(parentRuns(i), parentSize) + (blankParent ? parentBlankW + (prefix(i).length ? 4 * k : 0) : 0)
  const showParents = s.parentLabels !== 'none'
  const parentRow = showParents ? Math.ceil(parentSize * 1.7) : 0
  const sideW = showParents ? Math.ceil(parentW(1) + 8 * k) : 0

  const blockW = sideW + gameteCol + n * cell
  const wrapW = Math.max(blockW, MIN_WRAP * k)

  // The summary lines and the key, to know how wide the figure must be.
  const summary: SummaryLine[] = []
  const blankLines = new Set<SummaryLine>()
  const note = (line: SummaryLine, mode: 'shown' | 'blank' | 'none') => {
    if (mode === 'none') return
    if (mode === 'blank') blankLines.add(line)
    summary.push(line)
  }
  note(genotypeLine(sq, s.form), s.genotypeRatio)
  for (const line of phenotypeLines(sq, names, s.form)) note(line, s.phenotypeRatio)

  const headingRuns = (line: SummaryLine) => [text(line.heading, 'bold')]
  const summaryRows = summary.map((line) =>
    blankLines.has(line) ? [headingRuns(line)] : wrap([headingRuns(line), ...line.content], summarySize, wrapW),
  )
  const minBlank = 200 * k
  const summaryW = Math.max(
    0,
    ...summaryRows.map((rows, i) =>
      blankLines.has(summary[i]) ? runsWidth(rows[0], summarySize) + 10 * k + minBlank : Math.max(...rows.map((r) => runsWidth(r, summarySize))),
    ),
  )

  const shades = shadingOf(s, sq)
  const keySize = 17 * k
  const swatch = Math.round(22 * k)
  const keyKinds = phenotypeCounts(sq).filter((t) => shades.has(t.key))
  const keyItems = keyKinds.map((t) => ({ fill: shades.get(t.key)!, runs: phenotypeRuns(classes, names, t.value) }))
  const keyItemW = (runs: Run[]) => swatch + 8 * k + runsWidth(runs, keySize)
  const keyW = keyItems.length ? Math.min(wrapW, keyItems.reduce((w, item, i) => w + keyItemW(item.runs) + (i ? 24 * k : 0), 0)) : 0

  const titleRows = s.titleMode === 'text' && s.title.trim() ? wrap(words(s.title, 'bold'), 22 * k, wrapW) : []
  const questionRows = s.question.trim() ? wrap(words(s.question), summarySize, wrapW) : []
  const textW = Math.max(
    0,
    ...titleRows.map((r) => runsWidth(r, 22 * k)),
    ...questionRows.map((r) => runsWidth(r, summarySize)),
  )

  const width = Math.ceil(Math.max(blockW, summaryW, keyW, textW))
  const lines: TextLine[] = []
  const heading: TextLine[] = []
  const blanks: Blank[] = []
  let y = 0

  // The chart title, centered, and the question, from the left.
  for (const runs of titleRows) {
    y += 22 * k * 1.05
    heading.push({ x: width / 2, y, size: 22 * k, runs, middle: true })
    y += 22 * k * 0.3
  }
  if (titleRows.length) y += 8 * k
  for (const runs of questionRows) {
    y += summarySize * 1.05
    lines.push({ x: 0, y, size: summarySize, runs })
    y += summarySize * 0.32
  }
  if (titleRows.length || questionRows.length) y += GAP * k

  // The square, centered.
  const bx = (width - blockW) / 2
  const gx = bx + sideW + gameteCol
  const gy = y + parentRow + gameteRow
  const gridW = n * cell

  if (showParents) {
    const runs = parentRuns(0)
    const w = parentW(0)
    const base = y + parentSize
    if (blankParent) {
      const start = gx + gridW / 2 - w / 2
      lines.push({ x: start, y: base, size: parentSize, runs })
      blanks.push({ x1: start + w - parentBlankW, x2: start + w, y: base + 2 })
    } else lines.push({ x: gx + gridW / 2, y: base, size: parentSize, runs, middle: true })

    const sideBase = gy + gridW / 2 + parentSize * 0.35
    const start = gx - gameteCol - 6 * k - parentW(1)
    lines.push({ x: start, y: sideBase, size: parentSize, runs: parentRuns(1) })
    if (blankParent) blanks.push({ x1: start + parentW(1) - parentBlankW, x2: start + parentW(1), y: sideBase + 2 })
  }

  // Gametes, or a short line where each goes.
  const gameteBlank = s.gametes === 'blank'
  const gameteLine = Math.min(cell * 0.6, Math.max(gameteSize * 1.4, ...topGametes.map((r) => runsWidth(r, gameteSize) + 10 * k)))
  topGametes.forEach((runs, c) => {
    const x = gx + c * cell + cell / 2
    const base = gy - gameteRow * 0.38
    if (gameteBlank) blanks.push({ x1: x - gameteLine / 2, x2: x + gameteLine / 2, y: base })
    else lines.push({ x, y: base, size: gameteSize, runs, middle: true })
  })
  sideGametes.forEach((runs, r) => {
    const x = gx - gameteCol / 2
    const mid = gy + r * cell + cell / 2
    if (gameteBlank) blanks.push({ x1: x - Math.min(gameteLine, gameteCol - 8 * k) / 2, x2: x + Math.min(gameteLine, gameteCol - 8 * k) / 2, y: mid + gameteSize * 0.4 })
    else lines.push({ x, y: mid + gameteSize * 0.35, size: gameteSize, runs, middle: true })
  })

  // The cells: genotype in the middle, names under it. A blank cell is
  // never shaded, since shading would give its answer away.
  const cells: CellLayout[] = []
  sq.cells.forEach((row, r) =>
    row.forEach((g, c) => {
      const x = gx + c * cell
      const cy = gy + r * cell
      const blank = isBlank(s, r, c, n)
      const words = cellWords[r][c]
      // Centered on the letters' height, the first line's capitals to the last line's baseline.
      const h = words.reduce((sum, l, i) => sum + l.size * (i ? 1.3 : 0.72), 0)
      let base = cy + cell / 2 - h / 2 + words[0].size * 0.72
      const cellLines: TextLine[] = []
      if (!blank) {
        words.forEach((l, i) => {
          if (i) base += l.size * 1.3
          cellLines.push({ x: x + cell / 2, y: base, size: l.size, runs: l.runs, middle: true })
        })
      }
      const fill = blank ? undefined : shades.get(phenotypeKey(g, sq.dominance))
      cells.push({ x, y: cy, row: r, column: c, lines: cellLines, fill: fill === 'white' ? undefined : fill })
    }),
  )
  y = gy + gridW

  // The key to the shading, in one row (or more, if it's long).
  const key: KeyEntry[] = []
  if (keyItems.length) {
    y += GAP * k
    let x = 0
    let rowTop = y
    const rowH = Math.max(swatch, keySize * 1.2)
    const start = Math.max(0, Math.min(gx, width - keyW))
    for (const item of keyItems) {
      const w = keyItemW(item.runs)
      if (x && start + x + w > width) {
        x = 0
        rowTop += rowH + 8 * k
      }
      key.push({
        x: start + x,
        y: rowTop + (rowH - swatch) / 2,
        size: swatch,
        fill: item.fill,
        label: { x: start + x + swatch + 8 * k, y: rowTop + rowH / 2 + keySize * 0.36, size: keySize, runs: item.runs },
      })
      x += w + 24 * k
    }
    y = rowTop + rowH
  }

  // The summary lines, from the square's left edge where they fit, each
  // with its answer or a line to write it on.
  if (summaryRows.length) {
    y += GAP * k * 0.6
    const start = Math.max(0, Math.min(gx, width - summaryW))
    summaryRows.forEach((rows, i) => {
      rows.forEach((runs) => {
        y += summarySize * 1.45
        lines.push({ x: start, y, size: summarySize, runs })
      })
      if (blankLines.has(summary[i])) {
        const x1 = start + runsWidth(rows[0], summarySize) + 10 * k
        blanks.push({ x1, x2: Math.max(x1 + minBlank, width), y: y + 3 })
      }
    })
    y += summarySize * 0.45
  }

  const patterns = [...new Set(cells.map((c) => c.fill).concat(key.map((e) => e.fill)))].filter((p): p is Pattern => !!p && p !== 'white')
  return { width, height: Math.ceil(y), heading, grid: { x: gx, y: gy, n, cell }, cells, text: lines, blanks, key, patterns }
}
