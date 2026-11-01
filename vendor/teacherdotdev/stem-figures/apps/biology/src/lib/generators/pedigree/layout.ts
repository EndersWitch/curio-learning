// Where everyone in a pedigree goes, and the lines between them, following
// the standard pedigree nomenclature (Bennett et al., NSGC 2008 and 2022):
// a generation to a row, partners side by side joined by a partner line,
// a line of descent from its middle down to the sibship line, and each child
// hanging from that by a short line of their own, in birth order left to
// right. Twins hang from one point; identical twins have a bar between them.
//
// Each blood relative's family is laid out on its own, then placed beside
// its siblings' as close as their rows allow (tidy tree drawing), so lines
// never cross and children are centered under their parents. Someone who
// married in sits on the outer side of an eldest or youngest child, so the
// sibship line doesn't pass over them; otherwise the man is on the left.

import { refKey, type Member, type Person, type Ref } from './family'

/** A symbol's size: a square's side and a circle's diameter. */
export const SYMBOL = 36
/** The fewest units between neighbors' centers in a row. */
export const SPACING = 62
/** The extra space between cousins, so separate sibships read as separate. */
const COUSIN_GAP = 20
/** The length of each child's own line, from the sibship line down. */
const DROP = 20
/** Room for the generation numerals on the left. */
export const NUMERAL_WIDTH = 34
/** Room left of a symbol for its deceased slash and proband arrow. */
const LEFT_ROOM = SYMBOL / 2 + 24
const RIGHT_ROOM = SYMBOL / 2 + 8
const TOP_ROOM = SYMBOL / 2 + 6

export const NUMBER_FONT = 13
export const GENOTYPE_FONT = 16
export const NUMERAL_FONT = 17

export interface Placed {
  ref: Ref
  key: string
  person: Person
  x: number
  y: number
  generation: number
  /** its name in the pedigree, e.g. "II-3" */
  name: string
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface PedigreeLayout {
  width: number
  height: number
  people: Placed[]
  lines: Line[]
  /** each generation's numeral and the height of its row */
  numerals: { text: string; y: number }[]
  /** where the number and genotype rows are written, below each symbol's center */
  numberY: number
  genotypeY: number
  /** the units between neighbors' centers */
  spacing: number
}

export interface LayoutOptions {
  numbers: boolean
  numerals: boolean
  /** a genotype row is drawn (written or blank) */
  genotypes: boolean
  /** the widest label under any symbol, so neighbors' labels never meet */
  labelWidth: number
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']
export const roman = (n: number) => ROMAN[n - 1] ?? String(n)

/** The heights of the rows under each symbol, below its center. */
export function labelRows(o: Pick<LayoutOptions, 'numbers' | 'genotypes'>) {
  const top = SYMBOL / 2 + 4
  const numberY = top + NUMBER_FONT
  const genotypeY = (o.numbers ? numberY + 4 : top) + GENOTYPE_FONT
  const bottom = o.genotypes ? genotypeY + 5 : o.numbers ? numberY + 3 : SYMBOL / 2
  return { numberY, genotypeY, bottom }
}

/** Which side of a child their partner sits on: left (-1) or right (1). */
export function partnerSide(m: Member, siblings: Member[] | null, i: number): -1 | 1 {
  const maleLeft = m.sex === 'f' ? -1 : 1
  if (!siblings || siblings.length < 2) return maleLeft
  if (m.twin) return -1
  if (siblings[i - 1]?.twin) return 1
  if (i === 0) return -1
  if (i === siblings.length - 1) return 1
  return maleLeft
}

/** One blood relative's family, laid out with them at x = 0. */
interface Subtree {
  /** for each row from theirs down, the leftmost and rightmost centers */
  left: number[]
  right: number[]
  /** x of each person, relative to the blood relative, by refKey */
  xs: Map<string, number>
}

function layoutTree(root: Member, d: number): Map<string, number> {
  const build = (m: Member, path: number[], side: -1 | 1): Subtree => {
    const me = refKey({ path, partner: false })
    const xs = new Map<string, number>([[me, 0]])
    let left = [0]
    let right = [0]
    if (m.partner) {
      xs.set(refKey({ path, partner: true }), side * d)
      left = [Math.min(0, side * d)]
      right = [Math.max(0, side * d)]
    }
    if (!m.partner || !m.children.length) return { left, right, xs }

    // Place the children's families side by side, each as close to the one
    // before as every row allows.
    const kids = m.children.map((c, i) => build(c, [...path, i], partnerSide(c, m.children, i)))
    const offsets: number[] = []
    const accLeft: number[] = []
    const accRight: number[] = []
    kids.forEach((k, i) => {
      let off = 0
      if (i > 0) {
        off = -Infinity
        for (let r = 0; r < k.left.length; r++) {
          if (accRight[r] === undefined) continue
          off = Math.max(off, accRight[r] - k.left[r] + (r === 0 ? d : d + COUSIN_GAP))
        }
        if (off === -Infinity) off = 0
      }
      offsets.push(off)
      k.left.forEach((v, r) => (accLeft[r] = Math.min(accLeft[r] ?? Infinity, v + off)))
      k.right.forEach((v, r) => (accRight[r] = Math.max(accRight[r] ?? -Infinity, v + off)))
    })
    // Center the children under the partner line's middle.
    const mid = (side * d) / 2
    const shift = mid - (offsets[0] + offsets[offsets.length - 1]) / 2
    kids.forEach((k, i) => {
      for (const [key, x] of k.xs) xs.set(key, x + offsets[i] + shift)
    })
    accLeft.forEach((v, r) => (left[r + 1] = v + shift))
    accRight.forEach((v, r) => (right[r + 1] = v + shift))
    return { left, right, xs }
  }
  return build(root, [], partnerSide(root, null, 0)).xs
}

export function layoutPedigree(root: Member, o: LayoutOptions): PedigreeLayout {
  const d = Math.max(SPACING, Math.ceil(o.labelWidth) + 12)
  const rows = labelRows(o)
  const row = Math.max(96, rows.bottom + 14 + DROP + SYMBOL / 2)
  const xs = layoutTree(root, d)

  // Everyone, with x from the tree and y from their generation.
  const people: Placed[] = []
  const collect = (m: Member, path: number[]) => {
    const g = path.length
    people.push({ ref: { path, partner: false }, key: refKey({ path, partner: false }), person: m, x: xs.get(refKey({ path, partner: false }))!, y: g * row, generation: g, name: '' })
    if (m.partner) {
      const key = refKey({ path, partner: true })
      people.push({ ref: { path, partner: true }, key, person: m.partner, x: xs.get(key)!, y: g * row, generation: g, name: '' })
    }
    m.children.forEach((c, i) => collect(c, [...path, i]))
  }
  collect(root, [])

  // Shift so the leftmost symbol clears the numerals.
  const minX = Math.min(...people.map((p) => p.x))
  const maxX = Math.max(...people.map((p) => p.x))
  const dx = (o.numerals ? NUMERAL_WIDTH : 0) + LEFT_ROOM - minX
  const generations = Math.max(...people.map((p) => p.generation)) + 1
  for (const p of people) {
    p.x += dx
    p.y += TOP_ROOM
  }

  // Number each generation left to right: II-1, II-2…
  for (let g = 0; g < generations; g++) {
    people
      .filter((p) => p.generation === g)
      .sort((a, b) => a.x - b.x)
      .forEach((p, i) => (p.name = `${roman(g + 1)}-${i + 1}`))
  }

  const at = new Map(people.map((p) => [p.key, p]))
  const lines: Line[] = []
  const half = SYMBOL / 2
  const walk = (m: Member, path: number[]) => {
    if (!m.partner) return
    const a = at.get(refKey({ path, partner: false }))!
    const b = at.get(refKey({ path, partner: true }))!
    const [l, r] = a.x < b.x ? [a, b] : [b, a]
    const y = a.y
    if (m.consanguineous) {
      lines.push({ x1: l.x + half, y1: y - 3, x2: r.x - half, y2: y - 3 }, { x1: l.x + half, y1: y + 3, x2: r.x - half, y2: y + 3 })
    } else lines.push({ x1: l.x + half, y1: y, x2: r.x - half, y2: y })
    if (!m.children.length) return

    const mid = (l.x + r.x) / 2
    const kids = m.children.map((_, i) => at.get(refKey({ path: [...path, i], partner: false }))!)
    const sibY = kids[0].y - half - DROP
    // Where each child's line meets the sibship line: twins share a point.
    const tops = kids.map((k) => k.x)
    m.children.forEach((c, i) => {
      if (c.twin && kids[i + 1]) tops[i] = tops[i + 1] = (kids[i].x + kids[i + 1].x) / 2
    })
    const from = Math.min(mid, ...tops)
    const to = Math.max(mid, ...tops)
    lines.push({ x1: mid, y1: y + (m.consanguineous ? 3 : 0), x2: mid, y2: sibY })
    if (to > from) lines.push({ x1: from, y1: sibY, x2: to, y2: sibY })
    kids.forEach((k, i) => lines.push({ x1: tops[i], y1: sibY, x2: k.x, y2: k.y - half }))
    m.children.forEach((c, i) => {
      if (c.twin !== 'mz' || !kids[i + 1]) return
      // The bar between identical twins, halfway down their lines.
      const t = 0.5
      const ya = sibY + (kids[i].y - half - sibY) * t
      lines.push({ x1: tops[i] + (kids[i].x - tops[i]) * t, y1: ya, x2: tops[i] + (kids[i + 1].x - tops[i]) * t, y2: ya })
    })
    m.children.forEach((c, i) => walk(c, [...path, i]))
  }
  walk(root, [])

  const numerals = o.numerals
    ? Array.from({ length: generations }, (_, g) => ({ text: roman(g + 1), y: TOP_ROOM + g * row }))
    : []
  const width = maxX + dx + RIGHT_ROOM
  const height = TOP_ROOM + (generations - 1) * row + rows.bottom + 4
  return { width, height, people, lines, numerals, numberY: rows.numberY, genotypeY: rows.genotypeY, spacing: d }
}

/** About how wide `text` is in Arial at `size`, for spacing labels. */
export function textWidth(text: string, size: number) {
  let w = 0
  for (const ch of text) {
    if ('iIjl.,:;!|\''.includes(ch)) w += 0.28
    else if ('frt-_()'.includes(ch)) w += 0.36
    else if ('mwMW'.includes(ch)) w += 0.86
    else if (ch === ' ') w += 0.28
    else if (ch >= 'A' && ch <= 'Z') w += 0.69
    else w += 0.56
  }
  return w * size
}
