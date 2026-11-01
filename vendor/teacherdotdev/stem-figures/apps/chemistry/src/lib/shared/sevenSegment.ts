// Seven-segment digits, like a digital instrument's display, as polygons. A digit cell is
// 0.64 of its height wide; a decimal point takes a narrow cell of its own.

const SEGMENTS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg',
  '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '',
}

export const digitWidth = (h: number) => h * 0.64
export const pointWidth = (h: number) => h * 0.22

/** One bar between two points, with pointed ends. */
function bar(x0: number, y0: number, x1: number, y1: number, t: number) {
  const horizontal = y0 === y1
  const [a, b] = [t / 2, t / 2]
  const pts = horizontal
    ? [[x0, y0], [x0 + a, y0 - b], [x1 - a, y1 - b], [x1, y1], [x1 - a, y1 + b], [x0 + a, y0 + b]]
    : [[x0, y0], [x0 + a, y0 + b], [x1 + a, y1 - b], [x1, y1], [x1 - a, y1 - b], [x0 - a, y0 + b]]
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

/** Polygons for `text` (digits, '-', ' ' and '.') drawn `h` tall from (x, y). */
export function sevenSegment(text: string, x: number, y: number, h: number): string[] {
  const w = digitWidth(h)
  const t = h * 0.14
  const gap = t * 0.2
  const polys: string[] = []
  let cx = x
  for (const ch of text) {
    if (ch === '.') {
      const s = t * 1.1
      const px = cx + (pointWidth(h) - s) / 2 - w * 0.08
      polys.push(`${px},${y + h - s} ${px + s},${y + h - s} ${px + s},${y + h} ${px},${y + h}`)
      cx += pointWidth(h)
      continue
    }
    const L = cx + t / 2
    const R = cx + w - t / 2 - w * 0.16
    const top = y + t / 2
    const mid = y + h / 2
    const bottom = y + h - t / 2
    const bars: Record<string, [number, number, number, number]> = {
      a: [L + gap, top, R - gap, top],
      g: [L + gap, mid, R - gap, mid],
      d: [L + gap, bottom, R - gap, bottom],
      f: [L, top + gap, L, mid - gap],
      b: [R, top + gap, R, mid - gap],
      e: [L, mid + gap, L, bottom - gap],
      c: [R, mid + gap, R, bottom - gap],
    }
    for (const s of SEGMENTS[ch] ?? '') polys.push(bar(...bars[s], t))
    cx += w
  }
  return polys
}

/** How wide `text` draws at height `h`. */
export const segmentTextWidth = (text: string, h: number) =>
  [...text].reduce((sum, ch) => sum + (ch === '.' ? pointWidth(h) : digitWidth(h)), 0)
