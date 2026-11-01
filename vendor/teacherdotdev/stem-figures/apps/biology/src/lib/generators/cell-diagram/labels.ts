// Laying out the labels down the two sides of a cell: each sits as near the
// height of what it points at as it can without touching the next, in the
// same order top to bottom as their leader lines, so no two leaders cross.

import type { Pt } from './shapes'

export type Side = 'left' | 'right'

/** Roughly how wide text is in Arial, which every figure is set in. The
 *  figure is drawn on the server too, where nothing can be measured. */
export function textWidth(text: string, size: number) {
  let em = 0
  for (const ch of text) {
    if ('iljI.,:;|!\''.includes(ch)) em += 0.24
    else if ('frt()-/ '.includes(ch)) em += 0.31
    else if ('mwMW'.includes(ch)) em += 0.84
    else if (/[A-Z]/.test(ch)) em += 0.68
    else if (/[0-9]/.test(ch)) em += 0.56
    else em += 0.54
  }
  return em * size
}

/** Text broken at spaces into lines no wider than `max` (a single long
 *  word keeps its own line). */
export function wrap(text: string, size: number, max: number): string[] {
  const lines: string[] = []
  for (const word of text.split(' ')) {
    const last = lines.at(-1)
    if (last !== undefined && textWidth(`${last} ${word}`, size) <= max) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

/** Centres for a column of boxes, in the order given: each as near its
 *  target as it can be, no two closer than their half-heights plus `gap`,
 *  and all between `lo` and `hi` where they fit. This is a least-squares
 *  fit kept in order (pool adjacent violators), so a crowd of labels
 *  spreads evenly around where they point. */
export function stack(items: { target: number; height: number }[], lo: number, hi: number, gap: number): number[] {
  const n = items.length
  if (!n) return []
  // Write each centre as z + offset, where offset is the room the boxes
  // above it need; then the centres keep their spacing exactly when the zs
  // don't go down.
  const offsets = [0]
  for (let i = 1; i < n; i++) offsets.push(offsets[i - 1] + (items[i - 1].height + items[i].height) / 2 + gap)
  const wanted = items.map((it, i) => it.target - offsets[i])
  const blocks: { sum: number; count: number }[] = []
  for (const w of wanted) {
    blocks.push({ sum: w, count: 1 })
    while (blocks.length > 1) {
      const b = blocks[blocks.length - 1]
      const a = blocks[blocks.length - 2]
      if (a.sum / a.count <= b.sum / b.count) break
      blocks.splice(blocks.length - 2, 2, { sum: a.sum + b.sum, count: a.count + b.count })
    }
  }
  const zs = blocks.flatMap((b) => Array<number>(b.count).fill(b.sum / b.count))
  // Keep the column inside its bounds; one too tall for them is centred.
  const top = lo + items[0].height / 2
  const bottom = hi - items[n - 1].height / 2 - offsets[n - 1]
  const clamp = (z: number) => (bottom < top ? (top + bottom) / 2 : Math.min(bottom, Math.max(top, z)))
  return zs.map((z, i) => clamp(z) + offsets[i])
}

/** How far `p` is from the segment ab. */
export function distanceToSegment(p: Pt, a: Pt, b: Pt) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

/** Whether the segment ab passes through an ellipse at `at`, `rx` × `ry`,
 *  turned `angle` degrees. */
export function hitsEllipse(a: Pt, b: Pt, e: { at: Pt; rx: number; ry: number; angle: number }) {
  const t = (-e.angle * Math.PI) / 180
  const local = ([x, y]: Pt): Pt => {
    const dx = x - e.at[0]
    const dy = y - e.at[1]
    return [(dx * Math.cos(t) - dy * Math.sin(t)) / e.rx, (dx * Math.sin(t) + dy * Math.cos(t)) / e.ry]
  }
  return distanceToSegment([0, 0], local(a), local(b)) < 1
}

/** Whether segments ab and cd cross. */
export function crosses(a: Pt, b: Pt, c: Pt, d: Pt) {
  const turn = (p: Pt, q: Pt, r: Pt) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
  const d1 = turn(c, d, a)
  const d2 = turn(c, d, b)
  const d3 = turn(a, b, c)
  const d4 = turn(a, b, d)
  return d1 * d2 < 0 && d3 * d4 < 0
}

export interface ColumnItem<T> {
  key: T
  anchor: Pt
  height: number
}

/** One side's labels: where each label's centre goes, top to bottom, and
 *  where its leader line starts. The leaders start at `x`, the side of the
 *  column facing the cell. Ordered by the height of what they point at, then
 *  any two whose leaders would still cross swap places. */
export function column<T>(items: ColumnItem<T>[], x: number, lo: number, hi: number, gap: number) {
  let order = [...items].sort((a, b) => a.anchor[1] - b.anchor[1] || a.anchor[0] - b.anchor[0])
  let ys = stack(order.map((it) => ({ target: it.anchor[1], height: it.height })), lo, hi, gap)
  for (let round = 0; round < items.length * items.length; round++) {
    let swapped = false
    for (let i = 0; i + 1 < order.length && !swapped; i++) {
      for (let j = i + 1; j < order.length && !swapped; j++) {
        if (!crosses([x, ys[i]], order[i].anchor, [x, ys[j]], order[j].anchor)) continue
        const next = [...order]
        ;[next[i], next[j]] = [next[j], next[i]]
        order = next
        ys = stack(order.map((it) => ({ target: it.anchor[1], height: it.height })), lo, hi, gap)
        swapped = true
      }
    }
    if (!swapped) break
  }
  return order.map((it, i) => ({ key: it.key, y: ys[i], start: [x, ys[i]] as Pt, anchor: it.anchor }))
}
