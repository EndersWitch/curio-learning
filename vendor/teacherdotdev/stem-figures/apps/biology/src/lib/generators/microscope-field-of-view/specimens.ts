// What can be on the slide, and where it all lies. Everything is placed in
// micrometers around the middle of the field, so one arrangement can be drawn
// at any magnification: a higher power shows the middle of the same slide,
// bigger. The randomness comes only from a seed kept in the settings, so a
// link redraws the same figure and the server draws what the browser will.

export const SPECIMENS = ['onion', 'elodea', 'cheek', 'blood', 'paramecium', 'cells', 'circles', 'letter', 'none'] as const
export type Specimen = (typeof SPECIMENS)[number]

/** Tissue fills the field in rows of cells; loose specimens lie scattered or
 *  in a row; the letter is one, in the middle. */
export type SpecimenKind = 'tissue' | 'loose' | 'letter' | 'none'

export interface SpecimenInfo {
  name: string
  kind: SpecimenKind
  /** one of them, and several, in a sentence: "onion cell", "onion cells" */
  one: string
  many: string
  /** the size the settings give it: its length, its diameter or its height */
  measure: 'length' | 'diameter' | 'height'
  /** a typical size, in µm, it starts at */
  typical: number
  /** a tissue cell's width over its length */
  aspect?: number
}

// Typical sizes, from open lab manuals: onion epidermis cells are about
// 250–400 µm long and 60–80 µm wide; Elodea leaf cells about 50–130 µm by
// 20–30 µm; cheek cells 50–70 µm across; red blood cells about 8 µm
// (OpenStax Biology 2e, 4.1); Paramecium caudatum 170–330 µm long; a printed
// letter e on a newspaper about 1.5 mm tall.
export const SPECIMEN_INFO: Record<Specimen, SpecimenInfo> = {
  onion: { name: 'Onion skin', kind: 'tissue', one: 'onion cell', many: 'onion cells', measure: 'length', typical: 300, aspect: 0.25 },
  elodea: { name: 'Elodea leaf', kind: 'tissue', one: 'Elodea cell', many: 'Elodea cells', measure: 'length', typical: 100, aspect: 0.3 },
  cheek: { name: 'Cheek cells', kind: 'loose', one: 'cheek cell', many: 'cheek cells', measure: 'diameter', typical: 60 },
  blood: { name: 'Red blood cells', kind: 'loose', one: 'red blood cell', many: 'red blood cells', measure: 'diameter', typical: 8 },
  paramecium: { name: 'Paramecium', kind: 'loose', one: 'paramecium', many: 'paramecia', measure: 'length', typical: 220 },
  cells: { name: 'Simple cells', kind: 'loose', one: 'cell', many: 'cells', measure: 'diameter', typical: 100 },
  circles: { name: 'Circles', kind: 'loose', one: 'circle', many: 'circles', measure: 'diameter', typical: 100 },
  letter: { name: 'Letter e', kind: 'letter', one: 'letter e', many: 'letters', measure: 'height', typical: 1500 },
  none: { name: 'Nothing', kind: 'none', one: 'specimen', many: 'specimens', measure: 'length', typical: 100 },
}

/** Loose specimens lie scattered, or end to end across the middle of the
 *  field, for counting how many fit across it. */
export const ARRANGEMENTS = ['scatter', 'row'] as const
export type Arrangement = (typeof ARRANGEMENTS)[number]

/** The most tissue cells drawn across the field: any smaller, and there are
 *  thousands of them, too small to see, so smaller ones are drawn this many
 *  across (and the settings say so). */
export const MOST_ACROSS = 60

/** A small seeded random number generator (mulberry32): the same seed always
 *  gives the same numbers, from 0 up to 1. */
export function seededRandom(seed: number) {
  let a = Math.floor(seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Rounded to thousandths of a µm, so the server and every browser agree. */
const round = (n: number) => Math.round(n * 1000) / 1000

type Point = [number, number]

/** A tissue cell: its outline's four corners, clockwise from top left, its
 *  nucleus, and an Elodea cell's chloroplasts (x, y, angle in degrees). */
export interface TissueCell {
  corners: Point[]
  nucleus?: { x: number; y: number; r: number }
  chloroplasts: [number, number, number][]
  /** in the field whole, not cut off by its edge */
  whole: boolean
}

/** A loose specimen: where its middle is, how it's turned (degrees), its size
 *  (µm) and, for the round ones, how far its outline reaches in each of ten
 *  directions, as a share of its radius. */
export interface LooseItem {
  x: number
  y: number
  angle: number
  size: number
  outline: number[]
  /** where its nucleus sits, as a share of its radius from the middle */
  nucleus: Point
  whole: boolean
}

export type Arranged =
  | { kind: 'tissue'; cells: TissueCell[] }
  | { kind: 'loose'; items: LooseItem[]; missing: number }
  | { kind: 'letter'; size: number }
  | { kind: 'none' }

export interface ArrangeOptions {
  specimen: Specimen
  /** µm */
  size: number
  /** the widest field it's seen in, in µm across */
  field: number
  arrangement: Arrangement
  /** loose specimens lying whole in the field */
  count: number
  /** more loose specimens, cut off by the field's edge */
  edges: boolean
  seed: number
}

/** Everything on the slide for a set of options, in µm from the field's middle. */
export function arrange(o: ArrangeOptions): Arranged {
  const info = SPECIMEN_INFO[o.specimen]
  if (info.kind === 'tissue') return { kind: 'tissue', cells: tissue(o, info.aspect ?? 0.3) }
  if (info.kind === 'loose') return o.arrangement === 'row' ? { kind: 'loose', items: row(o), missing: 0 } : scatter(o)
  if (info.kind === 'letter') return { kind: 'letter', size: o.size }
  return { kind: 'none' }
}

/** How many whole specimens are in the field: the answer to "count the cells". */
export function wholeCount(a: Arranged) {
  if (a.kind === 'tissue') return a.cells.filter((c) => c.whole).length
  if (a.kind === 'loose') return a.items.filter((i) => i.whole).length
  return a.kind === 'letter' ? 1 : 0
}

/** Rows of cells filling the field, each `size` long and `aspect` × `size`
 *  wide. The row along the field's middle starts exactly at its left edge,
 *  so a field `n` cells long holds `n` cells across its diameter; the others
 *  start anywhere, and their cells vary a little in length, as real ones do.
 *  End walls lean a little, like bricks laid unevenly. */
function tissue(o: ArrangeOptions, aspect: number): TissueCell[] {
  const random = seededRandom(o.seed)
  const elodea = o.specimen === 'elodea'
  const R = o.field / 2
  const L = Math.max(o.size, o.field / MOST_ACROSS)
  const w = L * aspect
  const vary = elodea ? 0.12 : 0.18
  const lean = elodea ? 0.06 : 0.2
  const rows = Math.ceil(R / w + 0.5)
  const cells: TissueCell[] = []
  for (let j = -rows; j <= rows; j++) {
    const top = round((j - 0.5) * w)
    const bottom = round((j + 0.5) * w)
    // where each end wall crosses the row's middle, and how far it leans
    const walls: { x: number; d: number }[] = []
    // The middle row's walls cross the diameter exactly every L, from one
    // cell before the field's left edge.
    let x = j === 0 ? -R - L : -R - random() * L
    for (let k = 1; x < R + L; k++) {
      walls.push({ x: round(x), d: round((random() * 2 - 1) * lean * w) })
      x = j === 0 ? -R - L + k * L : x + L * (1 + vary * (random() * 2 - 1))
    }
    for (let k = 0; k + 1 < walls.length; k++) {
      const a = walls[k]
      const b = walls[k + 1]
      const corners: Point[] = [
        [round(a.x - a.d), top],
        [round(b.x - b.d), top],
        [round(b.x + b.d), bottom],
        [round(a.x + a.d), bottom],
      ]
      // Every random number is drawn whether or not the cell is kept, so a
      // cell's look doesn't depend on its neighbors being in the field.
      const length = b.x - a.x
      const along = 0.15 + 0.7 * random()
      const across = random() * 2 - 1
      const nucleus = elodea
        ? undefined
        : { x: round(a.x + along * length), y: round((top + bottom) / 2 + across * 0.18 * w), r: round(0.15 * w) }
      const chloroplasts = elodea ? plastids(corners, w, random) : []
      if (!touches(corners, R)) continue
      const whole = corners.every(([cx, cy]) => cx * cx + cy * cy <= R * R)
      cells.push({ corners, nucleus, chloroplasts, whole })
    }
  }
  return cells
}

/** Whether any of a cell lies in a field of radius `R`: the nearest point of
 *  the box around it is inside. */
function touches(corners: Point[], R: number) {
  const xs = corners.map((c) => c[0])
  const ys = corners.map((c) => c[1])
  const x = Math.min(Math.max(0, Math.min(...xs)), Math.max(...xs))
  const y = Math.min(Math.max(0, Math.min(...ys)), Math.max(...ys))
  return x * x + y * y <= R * R
}

/** An Elodea cell's chloroplasts: pressed against its walls around a big
 *  central vacuole, with a few across the middle. */
function plastids(corners: Point[], w: number, random: () => number): [number, number, number][] {
  const [tl, tr, br, bl] = corners
  const inset = 0.17 * w
  const left = (tl[0] + bl[0]) / 2 + inset
  const right = (tr[0] + br[0]) / 2 - inset
  const top = tl[1] + inset
  const bottom = bl[1] - inset
  const step = 0.3 * w
  const out: [number, number, number][] = []
  const jitter = () => (random() * 2 - 1) * 0.05 * w
  for (let x = left; x <= right + 1e-9; x += step) {
    out.push([round(x + jitter()), round(top + jitter()), 0])
    out.push([round(x + jitter()), round(bottom + jitter()), 0])
  }
  for (let y = top + step; y < bottom - step / 2; y += step) {
    out.push([round(left + jitter()), round(y + jitter()), 90])
    out.push([round(right + jitter()), round(y + jitter()), 90])
  }
  // a couple drifting across the vacuole
  for (let i = 0; i < 2; i++) {
    out.push([round(left + random() * (right - left)), round((top + bottom) / 2 + jitter()), round(random() * 180)])
  }
  return out
}

/** Ten radii around a round cell, as shares of its radius: a cheek cell's
 *  are uneven, a simple cell's nearly round, a red blood cell's and a
 *  circle's exactly round. In a row, the two ends stay at the full radius,
 *  so the row measures true. */
function outlineOf(specimen: Specimen, random: () => number, inRow: boolean) {
  const spread = specimen === 'cheek' ? 0.22 : specimen === 'cells' ? 0.06 : 0
  return Array.from({ length: 10 }, (_, i) => {
    const r = round(1 - spread * random())
    return inRow && (i === 0 || i === 5) ? 1 : r
  })
}

/** The furthest a loose specimen reaches from its middle, as a share of its
 *  size: half, plus the few percent sizes vary by. */
const REACH = 0.54

/** A loose specimen's look: its outline, its nucleus, and a size within a
 *  few percent of `size` (exactly `size` in a row). */
function item(o: ArrangeOptions, random: () => number, x: number, y: number, inRow: boolean, facing?: number): LooseItem {
  const turn = random() * 360
  const angle = inRow ? 0 : round(facing === undefined ? turn : facing + (turn / 360 - 0.5) * 60)
  const size = inRow || o.specimen === 'circles' ? o.size : round(o.size * (1 + 0.08 * (random() * 2 - 1)))
  const outline = outlineOf(o.specimen, random, inRow)
  const nucleus: Point = [round((random() * 2 - 1) * 0.2), round((random() * 2 - 1) * 0.2)]
  return { x: round(x), y: round(y), angle, size, outline, nucleus, whole: true }
}

/** Specimens end to end along the field's middle from its left edge, as
 *  many as reach across it; the last is cut off unless they fit exactly.
 *  Paramecia, long and thin, sit a little above and below the line by
 *  turns, so each stands apart from the next instead of joining into a
 *  chain; their ends still meet across the field. */
function row(o: ArrangeOptions): LooseItem[] {
  const random = seededRandom(o.seed)
  const R = o.field / 2
  const n = Math.min(Math.ceil(o.field / o.size - 1e-9), 400)
  const stagger = o.specimen === 'paramecium' ? ROW_STAGGER * o.size : 0
  return Array.from({ length: n }, (_, k) => {
    const it = item(o, random, -R + (k + 0.5) * o.size, (k % 2 ? 1 : -1) * stagger, true)
    return { ...it, whole: (k + 1) * o.size <= o.field + 1e-6 }
  })
}

/** How far a row's paramecia sit off the line, as a share of their length:
 *  more than half their width, so neighbors don't touch. */
export const ROW_STAGGER = 0.18

/** Space kept between scattered specimens, as a share of their size. */
const GAP = 0.08
const TRIES = 300

/** `count` specimens lying whole in the field, one near its middle (so a
 *  higher power still shows one), none touching; with `edges`, more cut off
 *  by the field's edge, as many as would lie in that band at the same
 *  density. Positions come from the seed alone, by plain arithmetic, and
 *  are compared as squared distances, so every browser places them alike.
 *  Any that find no room are counted in `missing`. */
function scatter(o: ArrangeOptions): Arranged {
  const random = seededRandom(o.seed)
  const R = o.field / 2
  const reach = REACH * o.size
  const apart = (2 * reach + GAP * o.size) ** 2
  const inner = R - reach
  const items: LooseItem[] = []
  const clear = (x: number, y: number) => items.every((i) => (i.x - x) ** 2 + (i.y - y) ** 2 >= apart)

  let missing = 0
  for (let n = 0; n < o.count; n++) {
    let placed = false
    for (let t = 0; t < TRIES && !placed && inner > 0; t++) {
      // the first one near the middle; the rest anywhere
      const spread = n === 0 ? Math.min(inner, 0.15 * o.size) : inner
      const x = round((random() * 2 - 1) * spread)
      const y = round((random() * 2 - 1) * spread)
      if (x * x + y * y > inner * inner || !clear(x, y)) continue
      items.push(item(o, random, x, y, false))
      placed = true
    }
    if (!placed) missing++
  }
  if (o.edges && items.length && inner > 0) {
    // Centers far enough out that the edge plainly cuts each one, and close
    // enough in that plenty of it shows. A paramecium points roughly out
    // of the field, so its length crosses the edge.
    const from = R - 0.15 * reach
    const to = R + 0.6 * reach
    const wanted = Math.round((items.length * (to * to - from * from)) / (inner * inner))
    for (let n = 0, t = 0; n < wanted && t < TRIES * wanted; t++) {
      const x = round((random() * 2 - 1) * to)
      const y = round((random() * 2 - 1) * to)
      const d = x * x + y * y
      if (d <= from * from || d > to * to || !clear(x, y)) continue
      const facing = o.specimen === 'paramecium' ? (Math.atan2(y, x) * 180) / Math.PI : undefined
      items.push({ ...item(o, random, x, y, false, facing), whole: false })
      n++
    }
  }
  return { kind: 'loose', items, missing }
}
