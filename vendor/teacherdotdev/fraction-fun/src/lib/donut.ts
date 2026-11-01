// Geometry for a donut (or any other item) drawn in a 400×400 box centred on (200, 200).
// Group 0 starts at twelve o'clock and groups go clockwise.

import type { Item } from './items'
import { CHEESE_MIN_RADIUS } from './pizzaArt'
import { MAX_WHOLE } from './problem'

export const CENTER = 200
export const OUTER_RADIUS = 186
export const HOLE_RADIUS = 56
/** How far each group sits out from the centre once chopped. */
export const CHOP_GAP = 12
/** A pepperoni's radius. */
export const PEPPERONI_RADIUS = 11.5

/** The parts of an item's geometry that differ from one item to another. */
export type ItemShape = {
  /** Radius of the hole in the middle; 0 for none. */
  hole: number
  /** Toppings' centres stay between these radii. */
  toppingInner: number
  toppingOuter: number
  /** How far a topping reaches from its centre: its radius. */
  toppingRadius: number
  /**
   * The item's top (cheese, dough, frosting, flesh) reaches at least this far from
   * the centre all the way round, so toppings that stay inside it sit whole on it.
   */
  faceRadius?: number
  /**
   * How far a topping's centre keeps from each cut, measured straight across.
   * Without it, toppings keep an angular margin (the donut's original rule).
   */
  cutClearance?: number
  /** Distance from the centre to a group's badge. */
  badgeAt: number
  /** Candidates tried for each slot; more packs toppings more evenly. */
  candidates: number
  /** Whole layouts tried, keeping the roomiest; 1 for the plain seeded one. */
  layouts: number
}

/** Everything an item without a hole needs, given its topping's size and how far out toppings go. */
function solid(toppingRadius: number, toppingOuter: number, faceRadius: number): ItemShape {
  return {
    hole: 0,
    toppingInner: 0,
    toppingOuter,
    toppingRadius,
    faceRadius,
    cutClearance: toppingRadius + 2.5,
    badgeAt: 115,
    candidates: 100,
    layouts: 8,
  }
}

export const SHAPES: Record<Item, ItemShape> = {
  donut: {
    hole: HOLE_RADIUS,
    toppingInner: 92,
    toppingOuter: 138,
    toppingRadius: 13,
    badgeAt: 115,
    candidates: 80,
    layouts: 1,
  },
  // Pepperoni sit anywhere on the cheese, clear of the crust and of every cut,
  // so even a thin twelfth keeps its pepperoni whole.
  pizza: {
    hole: 0,
    toppingInner: 0,
    toppingOuter: 136,
    toppingRadius: PEPPERONI_RADIUS,
    faceRadius: CHEESE_MIN_RADIUS,
    cutClearance: PEPPERONI_RADIUS + 2.5,
    badgeAt: 115,
    candidates: 100,
    layouts: 8,
  },
  // Chocolate chips anywhere on the dough, inside the bumpy baked edge.
  cookie: solid(9.5, 150, 170),
  // Candles on the flat top, inside the piped frosting border.
  cake: solid(11.5, 136, 150),
  // Seeds in the red flesh, clear of the pale band and the rind.
  watermelon: solid(9, 138, 152),
  // Holes in the cheese's face, inside the waxed rind.
  cheese: solid(10.5, 150, 168),
}

export type Point = { x: number; y: number }

export function angleOf(index: number, groups: number): number {
  return -Math.PI / 2 + (index / groups) * Math.PI * 2
}

export function polar(radius: number, angle: number): Point {
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) }
}

/** An annular sector covering one group, padded past the donut so it can clip the art. */
export function wedgePath(index: number, groups: number): string {
  if (groups === 1) {
    const r = OUTER_RADIUS + 8
    return `M${CENTER - r} ${CENTER}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
  }
  const start = angleOf(index, groups)
  const end = angleOf(index + 1, groups)
  const large = end - start > Math.PI ? 1 : 0
  const r = OUTER_RADIUS + 8
  const a = polar(r, start)
  const b = polar(r, end)
  return `M${CENTER} ${CENTER}L${a.x} ${a.y}A${r} ${r} 0 ${large} 1 ${b.x} ${b.y}Z`
}

/**
 * Where a chopped group sits: out along the middle of its wedge. Right after the
 * chop (`burst`), each piece is thrown further, by a different amount, and tilted,
 * so it looks cut apart; then it snaps back into the neat ring.
 */
export function chopOffset(index: number, groups: number, burst = false): Point & { tilt: number } {
  // The same for every item.
  if (groups === 1) return { x: 0, y: 0, tilt: 0 }
  const middle = angleOf(index + 0.5, groups)
  const distance = burst ? CHOP_GAP + 6 + ((index * 7) % 3) * 3 : CHOP_GAP
  return {
    x: Math.cos(middle) * distance,
    y: Math.sin(middle) * distance,
    tilt: burst ? (((index * 5) % 5) - 2) * 1.5 : 0,
  }
}

/** How to zoom so one group fills the view: the point to centre on and the scale. */
export function focusOn(
  index: number,
  groups: number,
  item: Item = 'donut',
): { centre: Point; scale: number } {
  if (groups === 1) return { centre: { x: CENTER, y: CENTER }, scale: 1 }
  const offset = chopOffset(index, groups)
  const points: Point[] = []
  for (let step = 0; step <= 16; step += 1) {
    const angle = angleOf(index + step / 16, groups)
    points.push(polar(OUTER_RADIUS, angle), polar(SHAPES[item].hole, angle))
  }
  const xs = points.map((p) => p.x + offset.x)
  const ys = points.map((p) => p.y + offset.y)
  const width = Math.max(...xs) - Math.min(...xs)
  const height = Math.max(...ys) - Math.min(...ys)
  const centre = { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 }
  let scale = Math.min(Math.max(340 / Math.max(width, height), 1), 2.4)
  const { hole, toppingOuter, cutClearance = 0 } = SHAPES[item]
  if (hole === 0) {
    // A slice with no hole comes to a point at the centre, and its toppings go right
    // down into it. Fitting the box would push that point into the view's faded
    // corner, so also keep every place a topping can sit inside the zoom's clear circle.
    const span = (Math.PI * 2) / groups
    const deepest = Math.min(cutClearance / Math.sin(Math.min(span / 2, Math.PI / 2)), toppingOuter)
    const reach =
      SHAPES[item].toppingRadius +
      Math.max(
        ...Array.from({ length: 17 }, (_, step) => polar(toppingOuter, angleOf(index + step / 16, groups)))
          .concat(polar(deepest, angleOf(index + 0.5, groups)))
          .map((p) => Math.hypot(p.x + offset.x - centre.x, p.y + offset.y - centre.y)),
      )
    scale = Math.max(1, Math.min(scale, ZOOM_CLEAR / reach))
  }
  return { centre, scale }
}

/** How far from the middle of the view a zoomed-in topping stays fully clear of the faded edge. */
const ZOOM_CLEAR = 165

/** The visual centre of a group's top (frosting, cheese, dough…), for badges. */
export function groupCentre(index: number, groups: number, item: Item = 'donut'): Point {
  return polar(SHAPES[item].badgeAt, angleOf(index + 0.5, groups))
}

/**
 * Spread-out sprinkle positions inside one group, in the order they get filled.
 * Uses best-candidate sampling with a fixed seed so a problem always looks the same.
 */
export function sprinkleSlots(index: number, groups: number, count: number, item: Item = 'donut'): Point[] {
  const { layouts, candidates, toppingRadius } = SHAPES[item]
  if (layouts === 1) return layout(index, groups, count, item, 0, candidates)
  // Big round toppings in a thin slice can end up crowded by chance, so try a few
  // layouts (each filled to the most a group can hold) and keep the roomiest.
  // Taking the first `count` of it keeps the slots the same whatever the count.
  const most = Math.max(count, Math.ceil(MAX_WHOLE / groups))
  const key = `${item} ${index} ${groups} ${most}`
  let best = roomiest.get(key)
  if (!best) {
    best = roomiestLayout(index, groups, most, item, layouts, candidates)
    // Only when that still leaves neighbours touching (big toppings, a full group),
    // search much harder. It's slow, so it's kept for the few cases that need it.
    if (closestPair(best) <= toppingRadius * 2 + 2) {
      best = roomiestLayout(index, groups, most, item, layouts * WIDER, candidates * 3)
    }
    roomiest.set(key, best)
  }
  return best.slice(0, count)
}

/** How many times more layouts the harder search tries. */
const WIDER = 4

/** Layouts already found, since they're slow to search for and never change. */
const roomiest = new Map<string, Point[]>()

function roomiestLayout(index: number, groups: number, count: number, item: Item, layouts: number, candidates: number): Point[] {
  let best: Point[] = []
  let bestSpacing = -1
  for (let variant = 0; variant < layouts; variant += 1) {
    const slots = layout(index, groups, count, item, variant, candidates)
    const spacing = closestPair(slots)
    if (spacing > bestSpacing) {
      best = slots
      bestSpacing = spacing
    }
  }
  return best
}

function closestPair(slots: Point[]): number {
  let closest = Infinity
  for (let a = 0; a < slots.length; a += 1) {
    for (let b = a + 1; b < slots.length; b += 1) {
      closest = Math.min(closest, Math.hypot(slots[a].x - slots[b].x, slots[a].y - slots[b].y))
    }
  }
  return closest
}

function layout(index: number, groups: number, count: number, item: Item, variant: number, candidates: number): Point[] {
  const random = seeded(index * 977 + groups * 131 + 7 + variant * 7919)
  const { toppingInner, toppingOuter, cutClearance } = SHAPES[item]
  const span = (Math.PI * 2) / groups
  const start = angleOf(index, groups)
  // Keep sprinkles clear of the cut on both sides.
  const margin = cutClearance === undefined ? Math.min(span * 0.12, 16 / toppingInner) : 0
  // Area-uniform radius so the outer band isn't sparse.
  const candidateAt = () =>
    polar(
      Math.sqrt(toppingInner ** 2 + random() * (toppingOuter ** 2 - toppingInner ** 2)),
      start + margin + random() * (span - margin * 2),
    )
  const fits = (p: Point) => cutClearance === undefined || clearOfCuts(p, start, span, cutClearance)
  const slots: Point[] = []
  for (let n = 0; n < count; n += 1) {
    let best: Point | null = null
    let bestDistance = -1
    for (let tries = 0, draws = 0; tries < candidates && draws < candidates * 50; draws += 1) {
      const candidate = candidateAt()
      if (!fits(candidate)) continue
      tries += 1
      const nearest = slots.reduce(
        (closest, slot) => Math.min(closest, Math.hypot(slot.x - candidate.x, slot.y - candidate.y)),
        Infinity,
      )
      if (nearest > bestDistance) {
        best = candidate
        bestDistance = nearest
      }
    }
    slots.push(best!)
  }
  return slots
}

/** Whether a point is at least `clearance` from both cuts of the wedge starting at `start`. */
function clearOfCuts(p: Point, start: number, span: number, clearance: number): boolean {
  if (span >= Math.PI * 2) return true
  const radius = Math.hypot(p.x - CENTER, p.y - CENTER)
  const angle = Math.atan2(p.y - CENTER, p.x - CENTER) - start
  const into = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  // Straight-line distance to a cut ray that is `turn` radians away.
  const toCut = (turn: number) => (turn >= Math.PI / 2 ? radius : radius * Math.sin(turn))
  return into <= span && toCut(into) >= clearance && toCut(span - into) >= clearance
}

/** Counting order inside a group: sweep clockwise so the numbers march round. */
export function countingOrder(slots: Point[], index: number, groups: number): number[] {
  const start = angleOf(index, groups)
  const sweep = (p: Point) => {
    const a = Math.atan2(p.y - CENTER, p.x - CENTER) - start
    return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  }
  return slots.map((_, i) => i).sort((a, b) => sweep(slots[a]) - sweep(slots[b]))
}

/** Sprinkle number `n` (0-based) is dealt to the next group in turn. */
export function dealTo(n: number, groups: number): { group: number; slot: number } {
  return { group: n % groups, slot: Math.floor(n / groups) }
}

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}
