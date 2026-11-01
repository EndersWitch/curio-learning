// A structure worked out in pixels: where each symbol, bond line, dot and
// label goes, and how big the whole drawing is. It draws whatever it's
// given (five bonds on C, ten electrons on O, a lone electron) without
// assuming the structure is correct.

import { chargeText, signed } from './formula'
import { electronGroups, labelDirection } from './layout'
import { hasBrackets, shownCharge, shownFormalCharge, type Structure } from './structure'

export const BOND = 64
/** atoms sit closer with dot bonds, so each shared pair sits between them,
 *  though never so close that a bond's dots touch its atoms' letters */
const DOT_BOND = 40
const DOT_CLEAR = 3
export const FONT = 26
export const DOT_R = 2.6
export const LABEL_FONT = 15
export const CHARGE_FONT = 18

/** Arial's widths, in ems, for the letters element symbols use. */
const WIDTHS: Record<string, number> = {
  A: 0.667, B: 0.667, C: 0.722, F: 0.611, G: 0.778, H: 0.722, I: 0.278, K: 0.667, L: 0.556, M: 0.833, N: 0.722, O: 0.778,
  P: 0.667, R: 0.722, S: 0.667, T: 0.611, X: 0.667, a: 0.556, b: 0.556, e: 0.556, g: 0.556, i: 0.222, l: 0.222, n: 0.556,
  o: 0.556, r: 0.333, s: 0.5, u: 0.556,
}

export const textWidth = (text: string, size: number) => [...text].reduce((w, ch) => w + (WIDTHS[ch] ?? 0.6), 0) * size

/** Half the width and height of the box a symbol's letters fill. */
const halfBox = (symbol: string) => ({ w: textWidth(symbol, FONT) / 2 + 1, h: FONT * 0.37 })

/** How far from a symbol's middle its box ends, going in a direction. */
function reach(symbol: string, direction: number) {
  const { w, h } = halfBox(symbol)
  const r = (direction * Math.PI) / 180
  const c = Math.abs(Math.cos(r))
  const s = Math.abs(Math.sin(r))
  return Math.min(c ? w / c : Infinity, s ? h / s : Infinity)
}

const unit = (direction: number) => {
  const r = (direction * Math.PI) / 180
  return { x: Math.cos(r), y: Math.sin(r) }
}

export interface Drawing {
  width: number
  height: number
  symbols: { x: number; y: number; text: string; atom: number; w: number; h: number }[]
  lines: { x1: number; y1: number; x2: number; y2: number; bond: number }[]
  /** where each bond is, for selecting it: its middle and direction, also for a bond of order 0 */
  bondSpots: { x: number; y: number; angle: number; length: number; bond: number }[]
  dots: { x: number; y: number }[]
  labels: { x: number; y: number; text: string }[]
  /** the box the brackets are drawn on */
  brackets?: { x1: number; y1: number; x2: number; y2: number }
  charge?: { x: number; y: number; text: string }
}

/** How a bond's shared pairs are drawn: a line each, or two dots each
 *  (see CONTEXT.md "Bond style"). */
export const BOND_STYLES = ['lines', 'dots'] as const
export type BondStyle = (typeof BOND_STYLES)[number]

export interface DrawOptions {
  /** draw the bonds; off for a skeleton */
  bonds?: boolean
  bondStyle?: BondStyle
  /** draw the lone electrons; off for a skeleton or bonds only */
  electrons?: boolean
  formalCharges?: boolean
}

const BOND_GAP = 4
const MULTIPLE = [[], [0], [-3.5, 3.5], [-6.5, 0, 6.5]]
/** where each shared pair of dots sits along a bond, out from its middle */
const DOT_PAIRS = [[], [0], [-4.5, 4.5], [-8, 0, 8]]
const DOT_OUT = 5.5
const PAIR = 4.3

/** How far apart atoms sit with dot bonds: DOT_BOND, or further when a
 *  bond's dots need more room between its atoms' letters. */
function dotSpacing(s: Structure) {
  let spacing = DOT_BOND
  for (const b of s.bonds) {
    const p = s.atoms[b.a]
    const q = s.atoms[b.b]
    const length = Math.hypot(q.x - p.x, q.y - p.y)
    const pairs = DOT_PAIRS[Math.min(3, Math.max(0, b.order))]
    if (!length || !pairs.length) continue
    const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
    const dots = 2 * Math.max(...pairs.map(Math.abs)) + 2 * DOT_R
    spacing = Math.max(spacing, (reach(p.element, angle) + reach(q.element, angle + 180) + dots + 2 * DOT_CLEAR) / length)
  }
  return spacing
}

export function drawStructure(s: Structure, { bonds = true, bondStyle = 'lines', electrons = true, formalCharges = false }: DrawOptions = {}): Drawing {
  const spacing = bonds && bondStyle === 'dots' ? dotSpacing(s) : BOND
  const at = s.atoms.map((a) => ({ x: a.x * spacing, y: a.y * spacing }))
  const lines: Drawing['lines'] = []
  const bondSpots: Drawing['bondSpots'] = []
  const dots: Drawing['dots'] = []
  const labels: Drawing['labels'] = []
  const symbols = s.atoms.map((a, i) => ({ ...at[i], text: a.element, atom: i, w: halfBox(a.element).w * 2, h: halfBox(a.element).h * 2 }))

  s.bonds.forEach((b, k) => {
    const p = at[b.a]
    const q = at[b.b]
    const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
    const u = unit(angle)
    const from = reach(s.atoms[b.a].element, angle) + BOND_GAP
    const to = reach(s.atoms[b.b].element, angle + 180) + BOND_GAP
    const length = Math.hypot(q.x - p.x, q.y - p.y)
    const mid = { x: (p.x + q.x) / 2 + (u.x * (from - to)) / 2, y: (p.y + q.y) / 2 + (u.y * (from - to)) / 2 }
    bondSpots.push({ ...mid, angle, length: Math.max(0, length - from - to), bond: k })
    if (!bonds) return
    const order = Math.min(3, Math.max(0, b.order))
    if (bondStyle === 'dots') {
      // Each pair across the bond, like a lone pair, and the pairs side by side along it.
      for (const along of DOT_PAIRS[order]) {
        const c = { x: mid.x + u.x * along, y: mid.y + u.y * along }
        dots.push({ x: c.x - u.y * PAIR, y: c.y + u.x * PAIR }, { x: c.x + u.y * PAIR, y: c.y - u.x * PAIR })
      }
      return
    }
    for (const offset of MULTIPLE[order]) {
      const nx = -u.y * offset
      const ny = u.x * offset
      lines.push({ x1: p.x + u.x * from + nx, y1: p.y + u.y * from + ny, x2: q.x - u.x * to + nx, y2: q.y - u.y * to + ny, bond: k })
    }
  })

  s.atoms.forEach((a, i) => {
    const groups = electrons ? electronGroups(s, i) : []
    groups.forEach(({ direction: d, electrons: n }) => {
      const u = unit(d)
      const alone = n === 1
      const group = (out: number) => {
        const c = { x: at[i].x + u.x * out, y: at[i].y + u.y * out }
        return alone ? [c] : [{ x: c.x - u.y * PAIR, y: c.y + u.x * PAIR }, { x: c.x + u.y * PAIR, y: c.y - u.x * PAIR }]
      }
      // Out from the symbol until every dot of the group clears its letters,
      // which takes further at a corner than on a side.
      const { w, h } = halfBox(a.element)
      const clear = (p: { x: number; y: number }) => Math.abs(p.x - at[i].x) >= w + DOT_R + 1 || Math.abs(p.y - at[i].y) >= h + DOT_R + 1
      let out = reach(a.element, d) + DOT_OUT
      while (!group(out).every(clear) && out < 40) out += 0.5
      dots.push(...group(out))
    })
    const charge = formalCharges ? shownFormalCharge(s, i) : 0
    if (charge) {
      const d = labelDirection(s, i, groups.map((g) => g.direction))
      const u = unit(d)
      const out = reach(a.element, d) + (groups.length ? 14 : 9)
      labels.push({ x: at[i].x + u.x * out, y: at[i].y + u.y * out, text: signed(charge) })
    }
  })

  // The box around everything drawn so far.
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  const cover = (x1: number, y1: number, x2: number, y2: number) => {
    left = Math.min(left, x1)
    top = Math.min(top, y1)
    right = Math.max(right, x2)
    bottom = Math.max(bottom, y2)
  }
  for (const t of symbols) cover(t.x - t.w / 2, t.y - t.h / 2, t.x + t.w / 2, t.y + t.h / 2)
  for (const d of dots) cover(d.x - DOT_R, d.y - DOT_R, d.x + DOT_R, d.y + DOT_R)
  for (const l of labels) {
    const w = textWidth(l.text, LABEL_FONT) / 2
    cover(l.x - w, l.y - LABEL_FONT * 0.4, l.x + w, l.y + LABEL_FONT * 0.4)
  }

  let brackets: Drawing['brackets']
  let charge: Drawing['charge']
  if (hasBrackets(s)) {
    brackets = { x1: left - 9, y1: top - 7, x2: right + 9, y2: bottom + 7 }
    cover(brackets.x1 - 1, brackets.y1 - 1, brackets.x2 + 1, brackets.y2 + 1)
  }
  const written = shownCharge(s)
  if (written) {
    const text = chargeText(written)
    charge = { x: right + 3, y: top + CHARGE_FONT * 0.35, text }
    cover(right, top - CHARGE_FONT * 0.3, right + 3 + textWidth(text, CHARGE_FONT), top)
  }

  // Everything moved so the drawing starts at (0, 0).
  const dx = -left
  const dy = -top
  const move = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: p.x + dx, y: p.y + dy })
  return {
    width: right - left,
    height: bottom - top,
    symbols: symbols.map(move),
    lines: lines.map((l) => ({ ...l, x1: l.x1 + dx, y1: l.y1 + dy, x2: l.x2 + dx, y2: l.y2 + dy })),
    bondSpots: bondSpots.map(move),
    dots: dots.map(move),
    labels: labels.map(move),
    ...(brackets ? { brackets: { x1: brackets.x1 + dx, y1: brackets.y1 + dy, x2: brackets.x2 + dx, y2: brackets.y2 + dy } } : {}),
    ...(charge ? { charge: move(charge) } : {}),
  }
}
