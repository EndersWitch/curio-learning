// Where everything goes in each kind of cell: the cell's outline, every
// organelle's position and size, the points a label's leader line may end
// at, and the space each organelle takes up, which leaders keep off. The
// organelles have fixed places, so taking one out leaves the rest where
// they were, with plain cytoplasm in its place.

import { distanceToSegment, type Side } from './labels'
import { golgi, nucleus, roughER, tube, TUBE, type GolgiArt, type NucleusArt, type RoughER, type Tube } from './organelles'
import { blob, polar, sample, scatter, seeded, smooth, wave, type Pt } from './shapes'
import type { Cell, PartId } from './structures'

/** An organelle with a long axis: a mitochondrion or chloroplast. */
export interface Placed {
  at: Pt
  angle: number
  length: number
  width: number
}

export interface Round {
  at: Pt
  r: number
}

/** A point a label's leader line can end at, and the side its label is on. */
export interface Anchor {
  at: Pt
  side: Side
}

/** The space part of an organelle takes up, as an ellipse. A leader line to
 *  anything else is kept off it where it can be. */
export interface Block {
  id: PartId
  at: Pt
  rx: number
  ry: number
  angle: number
}

export interface CellPlan {
  /** the size of the drawing, labels aside */
  width: number
  height: number
  /** the cell inside its membrane: the cytoplasm, outlined by the membrane */
  body: string
  /** a bacterium's capsule, around its wall */
  capsule?: string
  /** a plant cell's or bacterium's cell wall, the band between this and the body */
  wall?: string
  /** a plant cell's channels through its wall */
  plasmodesmata?: [Pt, Pt][]
  nucleus?: NucleusArt
  rough?: RoughER
  smooth?: Tube[]
  golgi?: GolgiArt
  vesicles?: Round[]
  mitochondria?: Placed[]
  chloroplasts?: Placed[]
  vacuole?: string
  lysosomes?: Round[]
  peroxisomes?: Round[]
  centrosome?: { at: Pt; angle: number }
  ribosomes: Pt[]
  cytoskeleton?: string[]
  /** each microvillus as a U from the membrane out and back */
  microvilli?: string[]
  nucleoid?: { region: string; dna: string }
  plasmids?: Round[]
  pili?: [Pt, Pt][]
  flagellum?: string
  /** where each structure's leader line can end, best first */
  anchors: Partial<Record<PartId, Anchor[]>>
  blocks: Block[]
}

// ---------------------------------------------------------------- helpers

/** Whether `p` is inside a long organelle, with `pad` to spare. */
const inPlaced = (o: Placed, pad: number) => (p: Pt) => {
  const a = (-o.angle * Math.PI) / 180
  const dx = p[0] - o.at[0]
  const dy = p[1] - o.at[1]
  const x = dx * Math.cos(a) - dy * Math.sin(a)
  const y = dx * Math.sin(a) + dy * Math.cos(a)
  return (x / (o.length / 2 + pad)) ** 2 + (y / (o.width / 2 + pad)) ** 2 < 1
}
const inRound = (o: Round, pad: number) => (p: Pt) => Math.hypot(p[0] - o.at[0], p[1] - o.at[1]) < o.r + pad
const inside = (outline: Pt[]) => (p: Pt) => {
  // Even–odd ray test against the sampled outline.
  let hit = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i]
    const [xj, yj] = outline[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
/** How far `p` is from a closed outline. */
const distanceTo = (outline: Pt[]) => (p: Pt) => Math.min(...outline.map((q, i) => distanceToSegment(p, q, outline[(i + 1) % outline.length])))

/** The one of `points` nearest `target`. */
const nearest = (points: Pt[], target: Pt) =>
  points.reduce((best, p) => (Math.hypot(p[0] - target[0], p[1] - target[1]) < Math.hypot(best[0] - target[0], best[1] - target[1]) ? p : best))

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
const roundedRectPoints = (x: number, y: number, w: number, h: number, r: number): Pt[] => {
  const pts: Pt[] = []
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 6; k++) pts.push(polar(cx, cy, r, a0 + k * 15))
  }
  corner(x + w - r, y + r, -90)
  corner(x + w - r, y + h - r, 0)
  corner(x + r, y + h - r, 90)
  corner(x + r, y + r, 180)
  return pts
}

/** A capsule's outline at `c`, as points, for a bacterium's layers. */
const capsulePoints = (c: Pt, length: number, width: number): Pt[] => {
  const r = width / 2
  const x = length / 2 - r
  return sample(
    [
      [c[0] - x, c[1] - r],
      [c[0] + x, c[1] - r],
      polar(c[0] + x, c[1], r, -45),
      [c[0] + length / 2, c[1]],
      polar(c[0] + x, c[1], r, 45),
      [c[0] + x, c[1] + r],
      [c[0] - x, c[1] + r],
      polar(c[0] - x, c[1], r, 135),
      [c[0] - length / 2, c[1]],
      polar(c[0] - x, c[1], r, 225),
    ],
    true,
    6,
  )
}
/** A capsule path placed at `c`. */
const capsuleAt = (c: Pt, length: number, width: number) => {
  const r = width / 2
  const x = length / 2 - r
  return `M ${c[0] - x} ${c[1] - r} H ${c[0] + x} A ${r} ${r} 0 0 1 ${c[0] + x} ${c[1] + r} H ${c[0] - x} A ${r} ${r} 0 0 1 ${c[0] - x} ${c[1] - r} Z`
}

/** Anchors at each point, each labeled on the side of the cell it's on. */
const sided = (points: Pt[], middle: number): Anchor[] => points.map((at) => ({ at, side: at[0] < middle ? 'left' : 'right' }))
/** An anchor that can be labeled from either side, the nearer first. */
const either = (at: Pt, middle: number): Anchor[] =>
  at[0] < middle ? [{ at, side: 'left' }, { at, side: 'right' }] : [{ at, side: 'right' }, { at, side: 'left' }]

const roundBlocks = (id: PartId, list: Round[], pad = 2): Block[] => list.map((o) => ({ id, at: o.at, rx: o.r + pad, ry: o.r + pad, angle: 0 }))
const placedBlocks = (id: PartId, list: Placed[]): Block[] =>
  list.map((o) => ({ id, at: o.at, rx: o.length / 2 + 2, ry: o.width / 2 + 2, angle: o.angle }))
const pointBlocks = (id: PartId, points: Pt[], r: number): Block[] => points.map((at) => ({ id, at, rx: r, ry: r, angle: 0 }))

/** The microvilli along part of a membrane's outline (`edge`, sampled
 *  points): each a finger out of the cell, and the point near its tip. */
function microvilliOn(edge: Pt[], centre: Pt, keep: (p: Pt) => boolean) {
  const tips: Pt[] = []
  const fingers = edge
    .filter(keep)
    .filter((_, i) => i % 2 === 0)
    .map((p) => {
      const i = edge.indexOf(p)
      const a = edge[(i + edge.length - 1) % edge.length]
      const b = edge[(i + 1) % edge.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]
      let [nx, ny] = [uy, -ux]
      // Outward: away from the cell's centre.
      if ((p[0] - centre[0]) * nx + (p[1] - centre[1]) * ny < 0) [nx, ny] = [-nx, -ny]
      const w = 4.5
      const h = 22
      const base = (s: number): Pt => [p[0] + ux * s * w - nx * 3, p[1] + uy * s * w - ny * 3]
      const tip = (s: number): Pt => [p[0] + ux * s * w + nx * h, p[1] + uy * s * w + ny * h]
      const [b0, t0, t1, b1] = [base(-1), tip(-1), tip(1), base(1)]
      tips.push([p[0] + nx * (h - 5), p[1] + ny * (h - 5)])
      const f = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
      return `M ${f(b0)} L ${f(t0)} A ${w} ${w} 0 0 1 ${f(t1)} L ${f(b1)}`
    })
  return { fingers, tips }
}

// ---------------------------------------------------------------- animal

/** Bare cytoplasm for its label to point at, kept clear of ribosomes. */
const ANIMAL_CYTOPLASM: Pt[] = [[118, 380], [530, 200], [250, 40], [470, 168]]
const PLANT_CYTOPLASM: Pt[] = [[48, 290], [556, 350], [250, 240]]
const BACTERIUM_CYTOPLASM: Pt[] = [[136, 150], [472, 154]]

function animalCell(): CellPlan {
  const W = 640
  const mid = 320
  const outline = blob(320, 236, 298, 220, [0.01, 0.03, 0.0, -0.025, 0.01, 0.035, 0.01, -0.02, 0.0, 0.03, 0.015, -0.015, 0.02, 0.0], 0.15)
  const edge = sample(outline, true, 10)
  const near = distanceTo(edge)
  const nuc = nucleus([290, 226], 86, 9, { at: [20, -18], r: 23 }, 7)
  const rough = roughER(nuc.c, nuc.r, [106, 123, 140], 244, 124, 11)
  // Smooth ER: a net of looping tubules carrying on from the rough ER's free end.
  const smoothER = [
    tube([rough.end, [208, 358], [214, 372]]),
    tube(blob(224, 388, 22, 16, [0, 0.06, -0.04, 0.05, 0, -0.05, 0.04, 0.03]), true),
    tube(blob(192, 410, 18, 13, [0.04, -0.03, 0.05, 0, -0.04, 0.05, 0, 0.02]), true),
    tube(blob(254, 408, 16, 12, [0, 0.05, -0.03, 0.04, 0.02, -0.04, 0.05, 0]), true),
  ]
  const golgiAt: Pt = [474, 346]
  const gol = golgi(golgiAt, 222, 5, 74)
  const vesicles: Round[] = [
    { at: [530, 322], r: 7 },
    { at: [544, 360], r: 6 },
    { at: [508, 392], r: 6 },
    { at: [454, 408], r: 6 },
  ]
  const mitochondria: Placed[] = [
    { at: [150, 118], angle: -28, length: 94, width: 40 },
    { at: [470, 100], angle: 20, length: 88, width: 38 },
    { at: [96, 292], angle: 76, length: 82, width: 36 },
    { at: [348, 404], angle: -8, length: 90, width: 38 },
  ]
  const lysosomes: Round[] = [
    { at: [92, 196], r: 14 },
    { at: [562, 296], r: 14 },
  ]
  const peroxisomes: Round[] = [
    { at: [366, 64], r: 12 },
    { at: [236, 50], r: 11 },
  ]
  const centrosome = { at: [412, 232] as Pt, angle: 0 }
  const busy = [
    ...mitochondria.map((m) => inPlaced(m, 6)),
    ...[...vesicles, ...lysosomes, ...peroxisomes].map((o) => inRound(o, 5)),
    inRound({ at: nuc.c, r: 150 }, 0),
    inRound({ at: golgiAt, r: 52 }, 0),
    inRound({ at: [212, 372], r: 50 }, 0),
    inRound({ at: [centrosome.at[0] - 4, centrosome.at[1]], r: 34 }, 0),
    ...ANIMAL_CYTOPLASM.map((at) => inRound({ at, r: 18 }, 0)),
  ]
  const ribosomes = scatter(36, { x: 0, y: 0, w: W, h: 480 }, (p) => inside(edge)(p) && near(p) > 12 && !busy.some((b) => b(p)), 22, 5)
  // Microtubules from the centrosome out to the membrane, on the side away
  // from the nucleus, and a few more running round just inside the membrane.
  const tubules = [-80, -42, -8, 28, 64, 100].map((a) => {
    const points: Pt[] = []
    for (let r = 18; r < 400; r += 24) {
      const p = polar(centrosome.at[0], centrosome.at[1], r, a + Math.sin(r / 40) * 4)
      if (!inside(edge)(p) || near(p) < 14) break
      points.push(p)
    }
    return points
  })
  const cortex = [edge.slice(96, 126), edge.slice(36, 60)].map((run) =>
    run.filter((_, i) => i % 4 === 0).map(([px, py]) => [320 + (px - 320) * 0.93, 236 + (py - 236) * 0.92] as Pt),
  )
  const villi = microvilliOn(edge, [320, 236], (p) => p[1] < 120 && p[0] > 210 && p[0] < 430)
  return {
    width: W,
    height: 472,
    body: smooth(outline, true),
    nucleus: nuc,
    rough,
    smooth: smoothER,
    golgi: gol,
    vesicles,
    mitochondria,
    lysosomes,
    peroxisomes,
    centrosome,
    ribosomes,
    cytoskeleton: [...tubules, ...cortex].map((t) => smooth(t)),
    microvilli: villi.fingers,
    anchors: {
      membrane: [{ at: edge.reduce((a, b) => (b[0] < a[0] ? b : a)), side: 'left' }, { at: edge.reduce((a, b) => (b[0] > a[0] ? b : a)), side: 'right' }],
      cytoplasm: sided(ANIMAL_CYTOPLASM, mid),
      nucleus: sided([polar(nuc.c[0], nuc.c[1], 60, 40), polar(nuc.c[0], nuc.c[1], 60, 140), polar(nuc.c[0], nuc.c[1], 58, -140)], mid),
      envelope: sided([-10, 30, -50, 190, 150, 230].map((a) => polar(nuc.c[0], nuc.c[1], nuc.r + 1, a)), nuc.c[0]),
      pores: sided(nuc.pores.map((a) => polar(nuc.c[0], nuc.c[1], nuc.r, a)), nuc.c[0]),
      nucleolus: either(nuc.nucleolus.c, 0),
      chromatin: [...sided([nearest(nuc.chromatinPoints, [240, 200])], nuc.c[0]), ...sided([nearest(nuc.chromatinPoints, [340, 260])], nuc.c[0])],
      'rough-er': sided([200, 165, 230].map((a) => polar(nuc.c[0], nuc.c[1], 140, a)), mid),
      'smooth-er': sided([[174, 410], [254, 420], [224, 404]], mid),
      ribosomes: sided([[560, 420], [600, 250], [60, 250], [60, 340]].map((t) => nearest(ribosomes, t as Pt)), mid),
      golgi: sided([golgiAt, gol.points[18], gol.points[22]], mid),
      vesicles: sided(vesicles.map((v) => v.at), mid),
      mitochondria: sided(mitochondria.map((m) => m.at), mid),
      lysosomes: sided(lysosomes.map((l) => l.at), mid),
      peroxisomes: sided(peroxisomes.map((p) => p.at), mid),
      centrosome: [{ at: centrosome.at, side: 'right' }],
      cytoskeleton: sided([tubules[1][4], tubules[0][4], tubules[2][5], cortex[0][3]], mid),
      microvilli: sided([nearest(villi.tips, [420, 0]), nearest(villi.tips, [200, 0])], mid),
    },
    blocks: [
      { id: 'nucleus', at: nuc.c, rx: nuc.r + 5, ry: nuc.r + 5, angle: 0 },
      { id: 'nucleolus', at: nuc.nucleolus.c, rx: nuc.nucleolus.r + 2, ry: nuc.nucleolus.r + 2, angle: 0 },
      ...pointBlocks('rough-er', rough.sheet.points, TUBE / 2 + 4),
      ...pointBlocks('smooth-er', smoothER.flatMap((t) => t.points), TUBE / 2 + 1),
      ...pointBlocks('golgi', gol.points, TUBE / 2 + 2),
      { id: 'centrosome', at: [centrosome.at[0] - 4, centrosome.at[1]], rx: 34, ry: 15, angle: 0 },
      ...roundBlocks('vesicles', vesicles),
      ...roundBlocks('lysosomes', lysosomes),
      ...roundBlocks('peroxisomes', peroxisomes),
      ...placedBlocks('mitochondria', mitochondria),
      ...pointBlocks('ribosomes', ribosomes, 4),
    ],
  }
}

// ---------------------------------------------------------------- plant

function plantCell(): CellPlan {
  const W = 640
  const mid = 320
  const [x, y, w, h, wall] = [8, 8, 624, 456, 16]
  const body: [number, number, number, number, number] = [x + wall, y + wall, w - 2 * wall, h - 2 * wall, 14]
  const edge = roundedRectPoints(...body)
  // The central vacuole fills the middle and pushes the nucleus to one side.
  const vac = { at: [410, 262] as Pt, rx: 150, ry: 130 }
  const vacuoleOutline = blob(vac.at[0], vac.at[1], vac.rx, vac.ry, [0.0, 0.03, -0.01, 0.02, 0.0, -0.02, 0.03, 0.01, -0.01, 0.02], 0.3)
  const nuc = nucleus([138, 148], 68, 9, { at: [14, -12], r: 19 }, 3)
  const rough = roughER(nuc.c, nuc.r, [88, 104, 120], 2, 104, 13)
  const smoothER = [
    tube([rough.end, [104, 282], [112, 296]]),
    tube(blob(118, 310, 20, 14, [0, 0.06, -0.04, 0.05, 0, -0.05, 0.04, 0.03]), true),
    tube(blob(88, 326, 15, 11, [0.04, -0.03, 0.05, 0, -0.04, 0.05, 0, 0.02]), true),
    tube(blob(150, 324, 16, 12, [0, 0.05, -0.03, 0.04, 0.02, -0.04, 0.05, 0]), true),
  ]
  const golgiAt: Pt = [118, 388]
  const gol = golgi(golgiAt, 272, 4, 66)
  const vesicles: Round[] = [
    { at: [70, 368], r: 6 },
    { at: [168, 372], r: 6 },
    { at: [76, 424], r: 6.5 },
    { at: [170, 420], r: 5.5 },
  ]
  const chloroplasts: Placed[] = [
    { at: [300, 70], angle: -6, length: 92, width: 42 },
    { at: [484, 74], angle: 8, length: 92, width: 42 },
    { at: [586, 270], angle: 86, length: 92, width: 40 },
    { at: [458, 424], angle: -5, length: 92, width: 40 },
    { at: [292, 428], angle: 5, length: 88, width: 40 },
  ]
  const mitochondria: Placed[] = [
    { at: [586, 132], angle: 66, length: 58, width: 27 },
    { at: [584, 404], angle: -62, length: 56, width: 26 },
    { at: [214, 316], angle: 74, length: 56, width: 26 },
  ]
  const peroxisomes: Round[] = [
    { at: [570, 196], r: 10 },
    { at: [214, 56], r: 10 },
  ]
  const plasmodesmata: [Pt, Pt][] = [
    [[x - 1, 214], [x + wall + 4, 214]],
    [[x - 1, 236], [x + wall + 4, 236]],
    [[x + w + 1, 190], [x + w - wall - 4, 190]],
    [[x + w + 1, 212], [x + w - wall - 4, 212]],
    [[300, y + h + 1], [300, y + h - wall - 4]],
    [[360, y - 1], [360, y + wall + 4]],
  ]
  const busy = [
    ...[...mitochondria, ...chloroplasts].map((m) => inPlaced(m, 6)),
    ...[...vesicles, ...peroxisomes].map((o) => inRound(o, 5)),
    inRound({ at: nuc.c, r: 116 }, 0),
    inRound({ at: [118, 400], r: 46 }, 0),
    inRound({ at: [128, 292], r: 52 }, 0),
    ...PLANT_CYTOPLASM.map((at) => inRound({ at, r: 18 }, 0)),
    inside(sample(vacuoleOutline, true, 8).map(([px, py]) => [vac.at[0] + (px - vac.at[0]) * 1.08, vac.at[1] + (py - vac.at[1]) * 1.1] as Pt)),
  ]
  const ribosomes = scatter(24, { x: 0, y: 0, w: W, h: 472 }, (p) => inside(edge)(p) && distanceTo(edge)(p) > 12 && !busy.some((b) => b(p)), 20, 9)
  // Microtubules and microfilaments in the thin layer of cytoplasm.
  const fibres: Pt[][] = [
    [[36, 60], [60, 110], [52, 180], [40, 240]],
    [[250, 110], [300, 118], [360, 106], [420, 112], [480, 104], [540, 120]],
    [[550, 170], [548, 230], [552, 300], [546, 360]],
    [[240, 380], [300, 396], [380, 398], [440, 394], [520, 380]],
  ]
  return {
    width: W,
    height: 472,
    wall: roundedRect(x, y, w, h, 26),
    body: roundedRect(...body),
    plasmodesmata,
    nucleus: nuc,
    rough,
    smooth: smoothER,
    golgi: gol,
    vesicles,
    vacuole: smooth(vacuoleOutline, true),
    chloroplasts,
    mitochondria,
    peroxisomes,
    ribosomes,
    cytoskeleton: fibres.map((f) => smooth(f)),
    anchors: {
      wall: sided([[x + 5, 120], [x + w - 5, 120], [x + 5, 380], [x + w - 5, 380]], mid),
      membrane: sided([[x + wall + 1, 336], [x + w - wall - 1, 336], [x + wall + 1, 100]], mid),
      cytoplasm: sided(PLANT_CYTOPLASM, mid),
      plasmodesmata: sided(plasmodesmata.map(([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Pt), mid),
      nucleus: sided([polar(nuc.c[0], nuc.c[1], 46, 70), polar(nuc.c[0], nuc.c[1], 46, 150), polar(nuc.c[0], nuc.c[1], 46, -150)], mid),
      envelope: sided([215, 180, 250, 320].map((a) => polar(nuc.c[0], nuc.c[1], nuc.r + 1, a)), mid),
      pores: sided(nuc.pores.map((a) => polar(nuc.c[0], nuc.c[1], nuc.r, a)), mid),
      nucleolus: either(nuc.nucleolus.c, mid),
      chromatin: sided([nearest(nuc.chromatinPoints, [100, 170]), nearest(nuc.chromatinPoints, [120, 120])], mid),
      'rough-er': sided([30, 60, 85].map((a) => polar(nuc.c[0], nuc.c[1], 120, a)), W),
      'smooth-er': sided([[73, 326], [118, 324], [166, 324]], mid),
      golgi: either(golgiAt, mid),
      vesicles: sided(vesicles.map((v) => v.at), mid),
      chloroplasts: sided(chloroplasts.map((c) => c.at), mid),
      mitochondria: sided(mitochondria.map((m) => m.at), mid),
      peroxisomes: sided(peroxisomes.map((p) => p.at), mid),
      vacuole: [{ at: [450, 280], side: 'right' }, { at: [350, 250], side: 'left' }],
      ribosomes: sided([[640, 300], [0, 280], [400, 0]].map((t) => nearest(ribosomes, t as Pt)), mid),
      cytoskeleton: sided([fibres[2][1], fibres[0][2], fibres[3][2]], mid),
    },
    blocks: [
      { id: 'nucleus', at: nuc.c, rx: nuc.r + 5, ry: nuc.r + 5, angle: 0 },
      { id: 'nucleolus', at: nuc.nucleolus.c, rx: nuc.nucleolus.r + 2, ry: nuc.nucleolus.r + 2, angle: 0 },
      ...pointBlocks('rough-er', rough.sheet.points, TUBE / 2 + 4),
      ...pointBlocks('smooth-er', smoothER.flatMap((t) => t.points), TUBE / 2 + 1),
      ...pointBlocks('golgi', gol.points, TUBE / 2 + 2),
      ...roundBlocks('vesicles', vesicles),
      ...roundBlocks('peroxisomes', peroxisomes),
      ...placedBlocks('mitochondria', mitochondria),
      ...placedBlocks('chloroplasts', chloroplasts),
      { id: 'vacuole', at: vac.at, rx: vac.rx, ry: vac.ry, angle: 0 },
      ...pointBlocks('ribosomes', ribosomes, 4),
    ],
  }
}

// ---------------------------------------------------------------- bacterium

function bacterium(): CellPlan {
  const W = 700
  const c: Pt = [300, 150]
  const mid = c[0]
  const [L, H] = [470, 214]
  const capsuleW = 22
  const wallW = 13
  const bodyL = L - 2 * (capsuleW + wallW)
  const bodyH = H - 2 * (capsuleW + wallW)
  const edge = capsulePoints(c, bodyL, bodyH)
  // The nucleoid: one long chromosome, looped and tangled, in a paler region.
  const dna: Pt[] = []
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * 4 * Math.PI
    // One closed loop going twice round, doubling back on itself, like the
    // loops a bacterial chromosome is folded into.
    dna.push([
      c[0] - 10 + 92 * (Math.cos(t) + 0.16 * Math.cos(3.5 * t + 0.4)),
      c[1] + 2 + 36 * (Math.sin(t) + 0.32 * Math.sin(3.5 * t) + 0.06 * Math.sin(1.5 * t + 1)),
    ])
  }
  const region = blob(c[0] - 10, c[1] + 2, 128, 64, [0.0, 0.05, -0.03, 0.04, 0.0, -0.04, 0.05, 0.02, -0.02, 0.03], 0.2)
  const plasmids: Round[] = [
    { at: [450, c[1] - 48], r: 13 },
    { at: [152, c[1] + 56], r: 11 },
    { at: [470, c[1] + 46], r: 10 },
  ]
  const busy = [
    inside(sample(region, true, 6).map(([px, py]) => [c[0] - 10 + (px - c[0] + 10) * 1.06, c[1] + 2 + (py - c[1] - 2) * 1.12] as Pt)),
    ...plasmids.map((p) => inRound(p, 7)),
    ...BACTERIUM_CYTOPLASM.map((at) => inRound({ at, r: 18 }, 0)),
  ]
  const ribosomes = scatter(46, { x: 0, y: 0, w: W, h: 320 }, (p) => inside(edge)(p) && distanceTo(edge)(p) > 11 && !busy.some((b) => b(p)), 17, 21)
  // Pili stick straight out all round, except at the flagellum's end.
  const straight = L / 2 - H / 2
  const rand = seeded(4)
  const pili: [Pt, Pt][] = capsulePoints(c, L, H)
    .filter((_, i) => i % 2 === 1)
    .filter((p) => !(p[0] > c[0] + L / 2 - 60 && Math.abs(p[1] - c[1]) < 60) && rand() > 0.25)
    .map((p) => {
      const dx = p[0] - Math.min(c[0] + straight, Math.max(c[0] - straight, p[0]))
      const dy = p[1] - c[1]
      const len = Math.hypot(dx, dy) || 1
      // Each a little longer or shorter and leaning a little, so they read as hairs, not rays.
      const lean = (rand() - 0.5) * 0.5
      const [ux, uy] = [dx / len + lean * (-dy / len), dy / len + lean * (dx / len)]
      const reach = 13 + rand() * 14
      return [
        [p[0] - (dx / len) * capsuleW, p[1] - (dy / len) * capsuleW],
        [p[0] + ux * reach, p[1] + uy * reach],
      ] as [Pt, Pt]
    })
  const tail = wave(150, 16, 2.2).map(([wx, wy]) => [c[0] + bodyL / 2 + wx, c[1] + wy + wx * 0.12] as Pt)
  const top = c[1] - H / 2
  const bottom = c[1] + H / 2
  return {
    width: W,
    height: 300,
    capsule: capsuleAt(c, L, H),
    wall: capsuleAt(c, L - 2 * capsuleW, H - 2 * capsuleW),
    body: capsuleAt(c, bodyL, bodyH),
    nucleoid: { region: smooth(region, true), dna: smooth(dna, true) },
    plasmids,
    ribosomes,
    pili,
    flagellum: smooth(tail),
    anchors: {
      capsule: sided([[c[0] - 120, top + 9], [c[0] + 120, top + 9], [c[0] - 60, bottom - 9]], mid),
      wall: sided([[c[0] - L / 2 + capsuleW + 6, c[1] - 30], [c[0] + 160, top + capsuleW + 6], [c[0] - 160, bottom - capsuleW - 6]], mid),
      membrane: sided([[c[0] - bodyL / 2 + 1, c[1] + 20], [c[0] + 150, top + capsuleW + wallW + 1], [c[0] - 150, bottom - capsuleW - wallW - 1]], mid),
      cytoplasm: sided(BACTERIUM_CYTOPLASM, mid),
      nucleoid: sided([nearest(dna, [c[0] + 70, c[1] + 10]), nearest(dna, [c[0] - 90, c[1]])], mid),
      plasmid: sided(plasmids.map((p) => [p.at[0], p.at[1] - p.r] as Pt), mid),
      ribosomes: sided([[640, 190], [0, 120], [400, 260]].map((t) => nearest(ribosomes, t as Pt)), mid),
      pili: sided([pili[0][1], pili[2][1], pili.at(-1)![1]], mid),
      flagellum: [{ at: tail[30], side: 'right' }],
    },
    blocks: [
      { id: 'nucleoid', at: [c[0] - 10, c[1] + 2], rx: 110, ry: 50, angle: 0 },
      ...roundBlocks('plasmid', plasmids),
      ...pointBlocks('ribosomes', ribosomes, 4),
    ],
  }
}

export const PLANS: Record<Cell, CellPlan> = { animal: animalCell(), plant: plantCell(), bacterium: bacterium() }
