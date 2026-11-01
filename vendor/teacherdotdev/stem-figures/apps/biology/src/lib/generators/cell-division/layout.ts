// Where everything in one phase's picture goes: the cells, nuclei, spindles,
// centrioles and chromosomes, in drawing units with the picture centered on
// (0, 0). Spindles run left to right, so the metaphase plate is upright.
// ./model.ts says which chromosomes are in each cell; this only places them.
//
// Following OpenStax Biology 2e (10.2, 11.1): the nucleolus goes and the
// chromosomes condense in prophase, the nuclear envelope breaks into pieces
// in prometaphase and spindle fibers reach the kinetochores, chromosomes line
// up on the plate in metaphase (singly in mitosis and meiosis II, as tetrads
// in meiosis I), and new nuclear envelopes form round each set in telophase.
// Animal cells have centrioles and asters at the poles and pinch in two at a
// cleavage furrow; plant cells have a wall, broad spindle poles with no
// centrioles, and build a cell plate across the middle.

import {
  EDGE,
  LENGTHS,
  SHORT_ARM,
  WIDTH,
  chromosomeShape,
  sizeFor,
  tetradShapes,
  turn,
  unionBox,
  type Box,
  type ChromosomeShape,
  type Point,
  type Pose,
} from './chromosomes'
import { phaseState, type Chromosome, type Phase, type PhaseState, type Stage } from './model'

export type CellType = 'animal' | 'plant'

// the space between one chromosome's centerline end and the next on a plate: room for both round ends
const GAP = 12
/** the space between separate cells side by side, and one above the other
 *  (room for a count label under the top one) */
const CELL_GAP = 16
const STACK_GAP = 34

/** A body moved down by dy. */
const lowered = (body: Body, dy: number): Body => ({
  ...body,
  dy,
  box: { ...body.box, y1: body.box.y1 + dy, y2: body.box.y2 + dy },
})

export interface Centrosome extends Point {
  /** the aster: short fibers all round, at prophase and after */
  aster: boolean
}

export interface Nucleus extends Point {
  r: number
  /** in pieces, breaking down (prometaphase) */
  broken: boolean
}

export interface Fiber {
  d: string
  /** kinetochore fibers end at a chromosome; polar ones overlap in the middle */
  kind: 'kinetochore' | 'polar'
  /** a point halfway along, for its label */
  mid: Point
}

export interface Plate {
  x: number
  y1: number
  y2: number
  /** finished: a new wall between the daughter cells */
  complete: boolean
}

/** One cell, or one cell dividing in two. */
export interface Body {
  /** the cell's outline: a membrane, or a plant cell's wall */
  outline: string
  /** for a plant cell, the inside of its wall */
  inner?: string
  nuclei: Nucleus[]
  nucleoli: (Point & { r: number })[]
  centrosomes: Centrosome[]
  fibers: Fiber[]
  chromosomes: ChromosomeShape[]
  plate?: Plate
  /** the top of the cleavage furrow */
  furrow?: Point
  /** the chromosomes each count label is for, the x it's centered on, and the cell's bottom */
  counts: { x: number; y: number; chromosomes: Chromosome[] }[]
  /** how far it is moved down, when cells are stacked: everything above is drawn at y = 0 */
  dy: number
  box: Box
}

export interface PhasePicture {
  state: PhaseState
  bodies: Body[]
  box: Box
}

/** The cell sizes for 2n = 2 × pairs: a diploid cell's radius, a haploid
 *  cell's in meiosis II, and each of the four cells meiosis makes. Big enough
 *  for every chromosome to line up on the plate. */
export function cellSizes(pairs: number) {
  const plate = (list: number[]) => list.reduce((sum, l) => sum + l, 0) + GAP * (list.length - 1)
  const lengths = LENGTHS.slice(0, pairs).map((l) => l * sizeFor(pairs))
  const diploid = Math.max(80, plate([...lengths, ...lengths]) / 2 + 16)
  const haploid = Math.max(70, plate(lengths) / 2 + 22)
  return { diploid, haploid, product: Math.max(50, haploid * 0.72) }
}

/** The order chromosomes take on a mitotic metaphase plate: homologs apart,
 *  since in mitosis they line up on their own. */
const plateOrder = (list: Chromosome[]) => [...list].sort((a, b) => (a.homolog === b.homolog ? a.pair - b.pair : a.homolog === 'm' ? -1 : 1))

/** Centromere heights for a column of chromosomes on a plate, centered on 0. */
function column(list: Chromosome[], size: number): number[] {
  const lengths = list.map((c) => LENGTHS[c.pair] * size)
  const total = lengths.reduce((a, b) => a + b, 0) + GAP * (list.length - 1)
  let top = -total / 2
  return lengths.map((l, i) => {
    const y = top + l * SHORT_ARM[list[i].pair]
    top += l + GAP
    return y
  })
}

/** Homologs as tetrads, largest pair first: [left, right] by which pole each faces. */
function tetrads(list: Chromosome[]): [Chromosome, Chromosome][] {
  const pairs = [...new Set(list.map((c) => c.pair))].sort()
  return pairs.map((pair) => {
    const both = list.filter((c) => c.pair === pair)
    // the homolog going left in anaphase I faces the left pole
    const leftFirst = pair % 2 === 0 ? 'm' : 'p'
    const left = both.find((c) => c.homolog === leftFirst)!
    const right = both.find((c) => c.homolog !== leftFirst)!
    return [left, right]
  })
}

/** Turns used for chromosomes loose in the nucleus, so they look scattered. */
const LOOSE_ANGLES = [-28, 22, -12, 34, -38, 14, 30, -20]

/** Items packed in staggered rows round (0, 0): each is drawn by `draw` at a
 *  center and turn, and rows are spread until no two boxes overlap. */
function pack<T>(items: T[], draw: (item: T, pose: Pose) => ChromosomeShape[], angles = LOOSE_ANGLES, space = 5): ChromosomeShape[][] {
  if (!items.length) return []
  const columns = Math.ceil(Math.sqrt(items.length * 1.3))
  const trial = items.map((item, i) => draw(item, { x: 0, y: 0, angle: angles[i % angles.length] }))
  const sizes = trial.map((shapes) => unionBox(shapes.map((s) => s.box)))
  const rows: number[][] = []
  items.forEach((_, i) => {
    if (!rows.length || rows[rows.length - 1].length === columns) rows.push([])
    rows[rows.length - 1].push(i)
  })
  const placed: { x: number; y: number }[] = []
  const rowHeights = rows.map((row) => Math.max(...row.map((i) => sizes[i].y2 - sizes[i].y1)))
  const height = rowHeights.reduce((a, b) => a + b, 0) + space * (rows.length - 1)
  let top = -height / 2
  rows.forEach((row, r) => {
    const widths = row.map((i) => sizes[i].x2 - sizes[i].x1)
    const width = widths.reduce((a, b) => a + b, 0) + space * (row.length - 1)
    let left = -width / 2 + (r % 2 ? 4 : -4)
    row.forEach((i, k) => {
      const s = sizes[i]
      placed[i] = { x: left - s.x1, y: top + rowHeights[r] / 2 - (s.y1 + s.y2) / 2 }
      left += widths[k] + space
    })
    top += rowHeights[r] + space
  })
  return items.map((item, i) => draw(item, { x: placed[i].x, y: placed[i].y, angle: angles[i % angles.length] }))
}

const moved = (shapes: ChromosomeShape[], dx: number, dy: number): ChromosomeShape[] =>
  shapes.map((s) => ({
    ...s,
    centromere: { x: s.centromere.x + dx, y: s.centromere.y + dy },
    box: { x1: s.box.x1 + dx, y1: s.box.y1 + dy, x2: s.box.x2 + dx, y2: s.box.y2 + dy },
    chromatids: s.chromatids.map((c) => ({ ...c, points: c.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) })),
  }))

/** The smallest circle round (x, y) holding every chromosome, plus a margin. */
const reach = (shapes: ChromosomeShape[], x: number, y: number, margin: number) =>
  Math.max(
    0,
    ...shapes.flatMap((s) => s.chromatids.flatMap((c) => c.points.map((p) => Math.hypot(p.x - x, p.y - y) + c.width / 2))),
  ) + margin

// Outlines -------------------------------------------------------------------

const f = (n: number) => n.toFixed(1)

const ellipse = (cx: number, rx: number, ry: number) =>
  `M${f(cx - rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} 0 Z`

const roundRect = (cx: number, hw: number, hh: number, r: number) =>
  `M${f(cx - hw + r)} ${f(-hh)} H${f(cx + hw - r)} A${r} ${r} 0 0 1 ${f(cx + hw)} ${f(-hh + r)} V${f(hh - r)} A${r} ${r} 0 0 1 ${f(cx + hw - r)} ${f(hh)} H${f(cx - hw + r)} A${r} ${r} 0 0 1 ${f(cx - hw)} ${f(hh - r)} V${f(-hh + r)} A${r} ${r} 0 0 1 ${f(cx - hw + r)} ${f(-hh)} Z`

/** An animal cell pinching in two: two round lobes, `c` either side of the
 *  middle, joined at a waist. A deep pinch leaves only a thin bridge. */
function pinched(cx: number, c: number, r: number, smooth: number, bridge = 0) {
  const half = c + r
  const height = (x: number) => {
    const lobe = (center: number) => Math.sqrt(Math.max(0, r * r - (x - center) ** 2))
    const [a, b] = [lobe(-c), lobe(c)]
    const joined = (a + b + Math.sqrt((a - b) ** 2 + smooth * smooth)) / 2 - smooth / 2
    return Math.max(joined, Math.abs(x) < bridge * 2 ? bridge : 0, Math.max(a, b))
  }
  const n = 90
  const xs = Array.from({ length: n + 1 }, (_, i) => -half * Math.cos((Math.PI * i) / n))
  const top = xs.map((x) => ({ x, y: -height(x) }))
  const bottom = xs.map((x) => ({ x, y: height(x) })).reverse()
  const points = [...top, ...bottom]
  return { d: points.map((p, i) => `${i ? 'L' : 'M'}${f(cx + p.x)} ${f(p.y)}`).join(' ') + ' Z', waist: height(0) }
}

/** A plant cell's wall. */
const WALL = 7
function plantOutline(cx: number, hw: number, hh: number) {
  return { outline: roundRect(cx, hw, hh, 7), inner: roundRect(cx, hw - WALL, hh - WALL, 4) }
}

// Spindles -------------------------------------------------------------------

/** A fiber from a pole to a point, bowing out from the spindle's axis. */
function fiber(from: Point, to: Point, kind: Fiber['kind']): Fiber {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const bow = (to.y - from.y) * 0.18 + (to.y > from.y ? 3 : to.y < from.y ? -3 : 0)
  const control = { x: mx, y: my + bow }
  const mid = { x: (from.x + 2 * control.x + to.x) / 4, y: (from.y + 2 * control.y + to.y) / 4 }
  return { d: `M${f(from.x)} ${f(from.y)} Q${f(control.x)} ${f(control.y)} ${f(to.x)} ${f(to.y)}`, kind, mid }
}

/** Where a fiber leaves its pole: a point for an animal cell's centrosome, or
 *  spread over a broad pole in a plant cell. */
function poleAt(pole: Point, toward: Point, type: CellType, spread: number): Point {
  if (type === 'animal') return pole
  return { x: pole.x, y: pole.y + Math.max(-spread, Math.min(spread, (toward.y - pole.y) * 0.45)) }
}

/** The kinetochore of a chromosome facing a pole: the side of its centromere
 *  toward that pole. */
function kinetochore(s: ChromosomeShape, side: -1 | 1): Point {
  const reach = s.chromosome.chromatids.length === 2 ? WIDTH.condensed + 0.5 : 1
  return { x: s.centromere.x + side * reach, y: s.centromere.y }
}

// Bodies -------------------------------------------------------------------

interface Frame {
  cx: number
  /** the cell's radius */
  R: number
  type: CellType
  /** the chromosomes' size, from sizeFor */
  size: number
}

/** A cell not yet dividing: interphase through anaphase. */
function singleBody(stage: Stage, chromosomes: Chromosome[][], paired: boolean, centrosomes: 1 | 2, frame: Frame): Body {
  const { cx, R, type, size } = frame
  const anaphase = stage === 'anaphase'
  const rx = type === 'plant' ? R * 1.2 : R * (anaphase ? 1.22 : 1.06)
  // a plant cell's wall is drawn inside its outline, so it is a little taller
  const ry = type === 'plant' ? R + 8 : R * (anaphase ? 0.94 : 1)
  const walls = type === 'plant' ? plantOutline(cx, rx, ry) : { outline: ellipse(cx, rx, ry) }
  const all = chromosomes.flat()
  const body: Body = { ...walls, nuclei: [], nucleoli: [], centrosomes: [], fibers: [], chromosomes: [], counts: [], dy: 0, box: { x1: cx - rx, y1: -ry, x2: cx + rx, y2: ry } }
  const poleX = rx - (type === 'plant' ? 30 : 24)
  const poles = [{ x: cx - poleX, y: 0 }, { x: cx + poleX, y: 0 }]
  const spread = R * 0.22

  if (stage === 'interphase' || stage === 'prophase') {
    const look = stage === 'interphase' ? 'thread' : 'condensed'
    const shapes = paired
      ? pack(tetrads(all), ([l, r], pose) => tetradShapes(l, r, { ...pose, size }), [-12, 10, -6, 14], 22).flat()
      : pack(plateOrder(all), (c, pose) => [chromosomeShape(c, { ...pose, look, size, wave: c.pair * 1.7 + (c.homolog === 'p' ? 2.4 : 0) })]).flat()
    const r = Math.max(R * (stage === 'interphase' ? 0.5 : 0.52), reach(shapes, 0, 0, stage === 'interphase' ? 4 : 6))
    body.chromosomes = moved(shapes, cx, 0)
    body.nuclei.push({ x: cx, y: 0, r, broken: false })
    if (stage === 'interphase') {
      // the nucleolus, in the clearest spot
      const nr = Math.max(5, r * 0.13)
      const spots = [0.6, 0.35, 0.78].flatMap((k) =>
        [-50, 40, 140, -140, 0, 90, 180, -90].map((a) => ({ x: cx + k * r * Math.sin((a * Math.PI) / 180), y: -k * r * Math.cos((a * Math.PI) / 180) })),
      )
      const clear = (p: Point) => -Math.min(...body.chromosomes.flatMap((sh) => sh.chromatids.flatMap((c) => c.points.map((q) => Math.hypot(q.x - p.x, q.y - p.y)))))
      const spot = spots.reduce((best, p) => (clear(p) < clear(best) ? p : best))
      body.nucleoli.push({ ...spot, r: nr })
    }
    if (type === 'animal') {
      // The centrosome sits by the nucleus; it has doubled by G2, and in
      // prophase the two move apart, a spindle growing between them.
      const out = r + 12
      if (stage === 'interphase') {
        const at = turn({ x: 0, y: -out }, 40)
        body.centrosomes.push({ x: cx + at.x, y: at.y, aster: false })
        if (centrosomes === 2) body.centrosomes.push({ x: cx + at.x + 12, y: at.y + 9, aster: false })
      } else {
        // as high round the nucleus as leaves room for the aster inside the cell
        const fits = (deg: number) => {
          const p = turn({ x: 0, y: -out }, deg)
          return (p.x / (rx - 24)) ** 2 + (p.y / (ry - 24)) ** 2 <= 1
        }
        let deg = 40
        while (deg < 90 && !fits(deg)) deg += 5
        const b = turn({ x: 0, y: -Math.min(out, rx - 24) }, deg)
        const a = { x: -b.x, y: b.y }
        body.centrosomes.push({ x: cx + a.x, y: a.y, aster: true }, { x: cx + b.x, y: b.y, aster: true })
        // the spindle grows between them, over the nucleus rather than through it
        if (deg <= 55) for (const lift of [14, 24]) {
          const from = { x: cx + a.x + 6, y: a.y }
          const to = { x: cx + b.x - 6, y: b.y }
          body.fibers.push({ d: `M${f(from.x)} ${f(from.y)} Q${f(cx)} ${f(a.y - lift * 1.6)} ${f(to.x)} ${f(to.y)}`, kind: 'polar', mid: { x: cx, y: a.y - lift * 0.8 } })
        }
      }
    }
  } else if (stage === 'prometaphase' || stage === 'metaphase') {
    const meta = stage === 'metaphase'
    let shapes: ChromosomeShape[]
    if (paired) {
      const list = tetrads(all)
      const ys = column(list.map(([l]) => l), size)
      shapes = list.flatMap(([l, r], i) => {
        const jitter = meta ? 0 : [12, -14, 9, -10][i % 4]
        return tetradShapes(l, r, { x: cx + jitter, y: ys[i] * (meta ? 1 : 1.18), angle: meta ? 0 : [20, -24, 16, -20][i % 4], size })
      })
    } else {
      const list = plateOrder(all)
      const ys = column(list, size)
      shapes = list.map((c, i) =>
        chromosomeShape(c, {
          x: cx + (meta ? 0 : [16, -14, 22, -18, 10, -22, 18, -10][i % 8]),
          y: ys[i] * (meta ? 1 : 0.94),
          angle: meta ? 0 : [-32, 26, -20, 38, -26, 18, -36, 24][i % 8],
          size,
        }),
      )
    }
    body.chromosomes = shapes
    if (!meta) body.nuclei.push({ x: cx, y: 0, r: R * 0.62, broken: true })
    if (type === 'animal') body.centrosomes.push(...poles.map((p) => ({ ...p, aster: true })))
    // Kinetochore fibers: from both poles to each chromosome in mitosis and
    // meiosis II, from one pole to each homolog of a tetrad in meiosis I.
    // In prometaphase some have not been caught yet.
    shapes.forEach((s, i) => {
      if (!meta && i % 3 === 2) return
      // a tetrad's homologs come left one first
      const sides: (-1 | 1)[] = paired ? [i % 2 === 0 ? -1 : 1] : [-1, 1]
      for (const side of sides) {
        const end = kinetochore(s, side)
        body.fibers.push(fiber(poleAt(poles[side < 0 ? 0 : 1], end, type, spread), end, 'kinetochore'))
      }
    })
  } else if (anaphase) {
    // Each chromosome keeps its height on the plate as it is pulled, centromere first.
    const [leftGroup, rightGroup] = chromosomes
    const replicated = leftGroup[0]?.chromatids.length === 2
    // anaphase I keeps the tetrads' order, largest pair on top
    const order = replicated ? [...leftGroup].sort((a, b) => a.pair - b.pair) : plateOrder(leftGroup)
    const ys = column(order, size)
    const reachX = rx * (replicated ? 0.5 : 0.6)
    const at = (group: Chromosome[], side: -1 | 1) =>
      order.map((c, i) => {
        const match = group.find((g) => g.pair === c.pair && (replicated ? true : g.homolog === c.homolog))!
        // gathering toward the pole: closer together the nearer it they are
        return chromosomeShape(match, { x: cx + side * reachX, y: ys[i] * (replicated ? 0.92 : 0.78), lead: side, bend: replicated ? 32 : 56, size })
      })
    const shapes = [...at(leftGroup, -1), ...at(rightGroup, 1)]
    body.chromosomes = shapes
    if (type === 'animal') body.centrosomes.push(...poles.map((p) => ({ ...p, aster: true })))
    for (const s of shapes) {
      const side = s.centromere.x < cx ? -1 : 1
      const end = { x: s.centromere.x + side * (replicated ? WIDTH.condensed * 0.6 : 2), y: s.centromere.y }
      body.fibers.push(fiber(poleAt(poles[side < 0 ? 0 : 1], end, type, spread), end, 'kinetochore'))
    }
    // polar fibers from the two poles overlapping in the middle, pushing them apart
    for (const y of [-7, 7]) {
      body.fibers.push(fiber(poleAt(poles[0], { x: cx, y }, type, spread), { x: cx + rx * 0.24, y }, 'polar'))
      body.fibers.push(fiber(poleAt(poles[1], { x: cx, y }, type, spread), { x: cx - rx * 0.24, y }, 'polar'))
    }
  }

  body.counts = anaphase
    ? chromosomes.map((group, i) => ({ x: cx + (i === 0 ? -1 : 1) * rx * 0.5, y: ry, chromosomes: group }))
    : [{ x: cx, y: ry, chromosomes: all }]
  return body
}

/** Chromosomes uncoiling inside a new nucleus: rods side by side, largest first. */
function rodsIn(group: Chromosome[], x: number, side: -1 | 1, size: number) {
  const order = [...group].sort((a, b) => a.pair - b.pair || (a.homolog === 'm' ? -1 : 1))
  // room for each rod, or each pair of sister rods parting at their tips, with a little space between
  const doubled = group[0]?.chromatids.length === 2
  const step = (doubled ? 2 : 1) * (WIDTH.rod + 2 * EDGE) + (doubled ? 12 : 7)
  const width = step * (order.length - 1)
  const shapes = order.map((c, i) =>
    chromosomeShape(c, {
      x: x - width / 2 + i * step,
      y: -LENGTHS[c.pair] * size * 0.08,
      angle: [-6, 5, -3, 6, -5, 4, -6, 3][i % 8],
      lead: side,
      bend: 10,
      look: 'rod',
      size,
    }),
  )
  const r = Math.max(22, reach(shapes, x, 0, 5))
  return { shapes, r }
}

/** A cell dividing in two: telophase, or a finished division (`divided`)
 *  with the daughters still touching. `groups` are the left and right sets. */
function dividingBody(stage: Stage, groups: Chromosome[][], frame: Frame): Body {
  const { cx, R, type, size } = frame
  const done = stage === 'divided'
  const c = R * (done ? 0.84 : 0.66)
  let outline: string
  let inner: string | undefined
  let box: Box
  let furrow: Point | undefined
  let plate: Plate | undefined
  let halfH: number
  if (type === 'plant') {
    const hw = R * 1.2
    halfH = R + 8
    ;({ outline, inner } = plantOutline(cx, hw, halfH))
    box = { x1: cx - hw, y1: -halfH, x2: cx + hw, y2: halfH }
    plate = { x: cx, y1: done ? -halfH + WALL : -halfH * 0.55, y2: done ? halfH - WALL : halfH * 0.55, complete: done }
  } else {
    const r = R * (done ? 0.74 : 0.78)
    const shape = pinched(cx, c, r, done ? R * 0.16 : R * 0.5, done ? R * 0.04 : 0)
    outline = shape.d
    halfH = r
    box = { x1: cx - c - r, y1: -r, x2: cx + c + r, y2: r }
    furrow = { x: cx, y: -shape.waist }
  }
  const nx = type === 'plant' ? R * 0.6 : c
  const body: Body = { outline, inner, nuclei: [], nucleoli: [], centrosomes: [], fibers: [], chromosomes: [], plate, furrow, counts: [], dy: 0, box }
  groups.forEach((group, i) => {
    const side = i === 0 ? -1 : 1
    const x = cx + side * nx
    const { shapes, r } = rodsIn(group, x, side as -1 | 1, size)
    body.chromosomes.push(...shapes)
    body.nuclei.push({ x, y: 0, r: Math.min(r, halfH * 0.8), broken: false })
    // each new cell gets one centrosome, on the side its pole was
    if (type === 'animal') body.centrosomes.push({ x: x + side * (Math.min(r, halfH * 0.8) + 16), y: 0, aster: false })
    body.counts.push({ x, y: halfH, chromosomes: group })
  })
  if (!done) {
    // what is left of the spindle, between the new nuclei
    const [a, b] = body.nuclei
    for (const y of [-10, 0, 10]) {
      const from = { x: a.x + a.r * 0.9, y }
      const to = { x: b.x - b.r * 0.9, y }
      body.fibers.push({ d: `M${f(from.x)} ${f(from.y)} L${f(to.x)} ${f(to.y)}`, kind: 'polar', mid: { x: (from.x + to.x) / 2, y } })
    }
  }
  return body
}

/** One of the four cells meiosis makes. */
function productBody(group: Chromosome[], frame: Frame, side: -1 | 1): Body {
  const { cx, R, type, size } = frame
  const walls = type === 'plant' ? plantOutline(cx, R, R * 1.05) : { outline: ellipse(cx, R, R) }
  const box = type === 'plant' ? { x1: cx - R, y1: -R * 1.05, x2: cx + R, y2: R * 1.05 } : { x1: cx - R, y1: -R, x2: cx + R, y2: R }
  const { shapes, r } = rodsIn(group, cx, side, size)
  return {
    ...walls,
    nuclei: [{ x: cx, y: 0, r, broken: false }],
    nucleoli: [],
    centrosomes: [],
    fibers: [],
    chromosomes: shapes,
    counts: [{ x: cx, y: box.y2, chromosomes: group }],
    dy: 0,
    box,
  }
}

/** The picture of a phase, for 2n = 2 × pairs chromosomes. */
export function phasePicture(phase: Phase, pairs: number, type: CellType, crossingOver = false): PhasePicture {
  const state = phaseState(phase, pairs, crossingOver)
  const sizes = cellSizes(pairs)
  const size = sizeFor(pairs)
  const { stage, cells } = state
  const meiosisII = phase.endsWith('-2')
  let bodies: Body[]

  if (phase === 'products') {
    // two above two: each cell of meiosis II made the pair in its row
    const R = sizes.product
    const gap = type === 'plant' ? 0 : CELL_GAP
    bodies = cells.map((cell, i) => {
      const body = productBody(cell.groups[0], { cx: (i % 2 ? 1 : -1) * (R + gap / 2), R, type, size }, i % 2 ? 1 : -1)
      const h = body.box.y2 - body.box.y1
      return lowered(body, (i < 2 ? -1 : 1) * (h / 2 + STACK_GAP / 2))
    })
  } else if (meiosisII) {
    // the two cells meiosis I made, one above the other
    const R = sizes.haploid
    bodies = cells.map((cell, i) => {
      const frame = { cx: 0, R, type, size }
      const body = stage === 'telophase' ? dividingBody(stage, cell.groups, frame) : singleBody(stage, cell.groups, false, 2, frame)
      const h = body.box.y2 - body.box.y1
      return lowered(body, (i ? 1 : -1) * (h / 2 + STACK_GAP / 2))
    })
  } else if (stage === 'telophase') {
    bodies = [dividingBody(stage, cells[0].groups, { cx: 0, R: sizes.diploid, type, size })]
  } else if (stage === 'divided') {
    bodies = [dividingBody(stage, cells.map((cell) => cell.groups[0]), { cx: 0, R: sizes.diploid, type, size })]
  } else {
    bodies = [singleBody(stage, cells[0].groups, state.paired, state.centrosomes, { cx: 0, R: sizes.diploid, type, size })]
  }
  const box = unionBox(bodies.map((b) => b.box))
  return { state, bodies, box }
}
