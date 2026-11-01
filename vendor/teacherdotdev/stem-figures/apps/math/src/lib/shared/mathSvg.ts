// Lays out typed math ("3sqrt(2)", "x^2", "5/2", "2y+1") as plain SVG pieces:
// runs of text, fraction bars and root signs, so a figure's labels look like
// math and still export cleanly to PNG and SVG. There's no browser to measure
// text on the server, so widths come from Times' own glyph widths.
//
// A layout's coordinates start at its left end, on its baseline, with y down
// as in SVG: `asc` is how far it reaches above the baseline, `desc` below.

import { fromText, type MathDoc } from './math.js'

export const SERIF = "'Times New Roman', Times, serif"

type Token = MathDoc['root']['tokens'][number]
type Point = [number, number]
/** One piece of laid-out math: a run of text, a straight line (a fraction bar) or a path (a root sign). */
export type MathItem =
  | { kind: 'text'; x: number; y: number; text: string; size: number; italic: boolean }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'path'; points: Point[]; width: number }
/** Laid-out math: its width, how far it reaches above and below the baseline, and its pieces. */
export type MathBox = { w: number; asc: number; desc: number; items: MathItem[] }

// Glyph widths in em, upright and italic (Times New Roman).
const UPRIGHT: Record<string, number> = {
  ...Object.fromEntries([...'0123456789'].map((c) => [c, 0.5])),
  '.': 0.25, ',': 0.25, '°': 0.4, '′': 0.28, "'": 0.18, '(': 0.333, ')': 0.333, '[': 0.333, ']': 0.333,
  '+': 0.564, '−': 0.564, '=': 0.564, '<': 0.564, '>': 0.564, '≤': 0.549, '≥': 0.549, '≠': 0.549, '×': 0.564, '·': 0.25,
  '±': 0.564, '%': 0.833, '?': 0.444, ':': 0.278, '!': 0.333, '/': 0.278, ' ': 0.25, π: 0.55, '√': 0.55,
  a: 0.444, b: 0.5, c: 0.444, d: 0.5, e: 0.444, f: 0.333, g: 0.5, h: 0.5, i: 0.278, j: 0.278, k: 0.5, l: 0.278, m: 0.778,
  n: 0.5, o: 0.5, p: 0.5, q: 0.5, r: 0.333, s: 0.389, t: 0.278, u: 0.5, v: 0.5, w: 0.722, x: 0.5, y: 0.5, z: 0.444,
}
const ITALIC: Record<string, number> = {
  a: 0.5, b: 0.5, c: 0.444, d: 0.5, e: 0.444, f: 0.278, g: 0.5, h: 0.5, i: 0.278, j: 0.278, k: 0.444, l: 0.278, m: 0.722,
  n: 0.5, o: 0.5, p: 0.5, q: 0.5, r: 0.389, s: 0.389, t: 0.278, u: 0.5, v: 0.444, w: 0.667, x: 0.444, y: 0.444, z: 0.389,
  A: 0.611, B: 0.611, C: 0.667, D: 0.722, E: 0.611, F: 0.611, G: 0.722, H: 0.722, I: 0.333, J: 0.444, K: 0.667, L: 0.556,
  M: 0.833, N: 0.667, O: 0.722, P: 0.611, Q: 0.722, R: 0.611, S: 0.5, T: 0.556, U: 0.722, V: 0.611, W: 0.833, X: 0.611,
  Y: 0.556, Z: 0.556, θ: 0.5, α: 0.55, β: 0.5, γ: 0.45, δ: 0.45, λ: 0.5, μ: 0.5, σ: 0.55, φ: 0.6, ω: 0.65,
}
const UPPER: Record<string, number> = { A: 0.722, B: 0.667, C: 0.667, D: 0.722, E: 0.611, F: 0.556, G: 0.722, H: 0.722, I: 0.333, J: 0.389, K: 0.722, L: 0.611, M: 0.889, N: 0.722, O: 0.722, P: 0.556, Q: 0.722, R: 0.667, S: 0.556, T: 0.611, U: 0.722, V: 0.722, W: 0.944, X: 0.722, Y: 0.722, Z: 0.611 }

const ASC = 0.68 // how tall digits and capitals stand, in em
const DESC = 0.2
const AXIS = 0.26 // where fraction bars sit above the baseline
const REL = new Set(['=', '<', '>', '≤', '≥', '≠'])
const BIN = new Set(['+', '−', '-', '×', '·', '±'])

const isLetter = (c: string) => /^\p{L}$/u.test(c) && c !== 'π'
const width = (c: string, italic: boolean) => (italic ? ITALIC[c] : UPRIGHT[c] ?? UPPER[c]) ?? 0.55

/**
 * @param {string} text  math as stored in the page address
 * @param {number} size  font size
 * @param {{ suffix?: string, upright?: boolean }} options
 *   suffix: plain upright text after the math, like " cm"; upright: letters too (for words)
 * @returns null when there's nothing to write
 */
export function layoutMath(text: string, size: number, { suffix = '', upright = false }: { suffix?: string; upright?: boolean } = {}): MathBox | null {
  const tokens = String(text ?? '').trim() ? fromText(text).root.tokens : []
  if (!tokens.length && !suffix.trim()) return null
  const box = strand(tokens, size, upright)
  if (suffix) append(box, run(suffix, size, false, 0, 0))
  return box
}

const empty = (): MathBox => ({ w: 0, asc: 0, desc: 0, items: [] })

/** Put `part` (laid out from its own origin) at the end of `box`, raised by `rise`. */
function append(box: MathBox, part: MathBox, rise = 0, gap = 0) {
  const x = box.w + gap
  for (const it of part.items) box.items.push(shift(it, x, -rise))
  box.w = x + part.w
  box.asc = Math.max(box.asc, part.asc + rise)
  box.desc = Math.max(box.desc, part.desc - rise)
}

function shift(it: MathItem, dx: number, dy: number): MathItem {
  if (it.kind === 'text') return { ...it, x: it.x + dx, y: it.y + dy }
  if (it.kind === 'line') return { ...it, x1: it.x1 + dx, y1: it.y1 + dy, x2: it.x2 + dx, y2: it.y2 + dy }
  return { ...it, points: it.points.map(([x, y]) => [x + dx, y + dy]) }
}

/** A run of text in one style. */
function run(chars: string, size: number, italic: boolean, x: number, y: number): MathBox {
  const w = [...chars].reduce((t, c) => t + width(c, italic), 0) * size
  return { w, asc: ASC * size, desc: DESC * size, items: [{ kind: 'text', x, y, text: chars, size, italic }] }
}

function strand(tokens: Token[], size: number, upright: boolean): MathBox {
  const box = empty()
  let pending: { chars: string; italic: boolean } | null = null // the run being built
  let prev = null as 'op' | 'open' | 'item' | null // what came before, for spacing operators

  const flush = () => {
    if (!pending) return
    append(box, run(pending.chars, size, pending.italic, 0, 0))
    pending = null
  }
  const addChar = (c: string, italic: boolean) => {
    if (pending && pending.italic !== italic) flush()
    pending ??= { chars: '', italic }
    pending.chars += c
  }

  for (const token of tokens) {
    const kids = token.children as Map<string, { tokens: Token[] }>
    if (token.type === 'core/char') {
      let c = (token.props as { char: string }).char
      if (c === '-') c = '−'
      if (REL.has(c) || (BIN.has(c) && prev !== null && prev !== 'op' && prev !== 'open')) {
        flush()
        append(box, run(c, size, false, 0, 0), 0, (REL.has(c) ? 0.28 : 0.2) * size)
        box.w += (REL.has(c) ? 0.28 : 0.2) * size
        prev = 'op'
      } else if (c === ',') {
        addChar(', ', false)
        prev = 'op'
      } else {
        addChar(c, !upright && isLetter(c))
        prev = BIN.has(c) ? 'op' : 'item'
      }
      continue
    }
    flush()
    if (token.type === 'math/fraction') {
      append(box, fraction(kids.get('numerator')?.tokens ?? [], kids.get('denominator')?.tokens ?? [], size, upright), 0, 0.06 * size)
      box.w += 0.06 * size
    } else if (token.type === 'math/subsup') {
      const sup = strand(kids.get('superscript')?.tokens ?? [], size * 0.7, upright)
      append(box, sup, 0.42 * size, 0.04 * size)
    } else if (token.type === 'math/parentheses') {
      append(box, brackets(strand(kids.get('content')?.tokens ?? [], size, upright), size))
    } else if (token.type === 'math/radical') {
      append(box, root(strand(kids.get('radicand')?.tokens ?? [], size, upright), size), 0, 0.04 * size)
    }
    prev = 'item'
  }
  flush()
  if (!tokens.length) box.asc = ASC * size
  return box
}

function fraction(top: Token[], bottom: Token[], size: number, upright: boolean): MathBox {
  const small = Math.max(size * 0.8, 11)
  const num = strand(top, small, upright)
  const den = strand(bottom, small, upright)
  const pad = 0.1 * size
  const w = Math.max(num.w, den.w) + 2 * pad
  const gap = 0.14 * size
  const bar = -AXIS * size
  const numBase = bar - gap - num.desc
  const denBase = bar + gap + den.asc
  const box: MathBox = { w, asc: -(numBase - num.asc), desc: denBase + den.desc, items: [] }
  for (const it of num.items) box.items.push(shift(it, (w - num.w) / 2, numBase))
  for (const it of den.items) box.items.push(shift(it, (w - den.w) / 2, denBase))
  box.items.push({ kind: 'line', x1: 0, y1: bar, x2: w, y2: bar, width: Math.max(1, 0.06 * size) })
  return box
}

/** Brackets around a part, drawn taller when the part is (a fraction inside, say). */
function brackets(inner: MathBox, size: number): MathBox {
  const tall = inner.asc + inner.desc > (ASC + DESC) * size * 1.25
  const s = tall ? ((inner.asc + inner.desc) / (ASC + DESC)) * 0.92 : size
  const mid = (inner.desc - inner.asc) / 2 // the part's middle, from the baseline
  const y = tall ? mid + ((ASC - DESC) / 2) * s : 0
  const box = empty()
  append(box, { ...run('(', s, false, 0, y), asc: tall ? inner.asc : ASC * size, desc: tall ? inner.desc : DESC * size })
  append(box, inner)
  append(box, { ...run(')', s, false, 0, y), asc: tall ? inner.asc : ASC * size, desc: tall ? inner.desc : DESC * size })
  return box
}

/** A square root sign over a part. */
function root(inner: MathBox, size: number): MathBox {
  const top = -(Math.max(inner.asc, ASC * size) + 0.12 * size)
  const bottom = Math.max(inner.desc, 0.05 * size)
  const hook = 0.5 * size
  const x0 = 0.04 * size
  const start = x0 + hook + 0.06 * size
  const end = start + inner.w + 0.08 * size
  const box: MathBox = { w: end + 0.02 * size, asc: -top + 0.04 * size, desc: bottom, items: [] }
  box.items.push({
    kind: 'path',
    points: [[x0, -0.3 * size], [x0 + 0.12 * size, -0.36 * size], [x0 + 0.28 * size, bottom], [x0 + hook, top], [end, top]],
    width: Math.max(1, 0.055 * size),
  })
  for (const it of inner.items) box.items.push(shift(it, start, 0))
  return box
}
