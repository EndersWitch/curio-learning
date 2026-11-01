// Lays out any shape as plain pieces for ShapeFigure.svelte to draw: its
// corners, angle arcs and right-angle squares, congruence ticks, parallel
// arrows, extra lines (heights and diagonals), and every label with the spot
// it sits at. A generator works out where its corners go and what each part
// says; everything about drawing and placing them lives here, so a triangle
// and a quadrilateral are marked and labeled the same way.
//
// The shape is scaled to fit the same box whatever its measures, so every
// figure pastes in at a similar size; the SVG's frame then grows to hold its
// labels. A label the teacher drags keeps its offset in its part's own
// directions (along and across a side, say), so it follows the part when the
// shape is turned, flipped or reshaped.
//
// Every part has an id: a corner's angle is its corner's id ("B"), a side is
// its two corners' ids ("AB"), and extra lines have their own ("hB", "dAC").
// Labels add a prefix for what they name: "vB" for a vertex name, "fB" for
// where the height from B lands, "x" for where the diagonals cross, "o" for
// the center.

import { LABEL_SCALE, type LabelSize } from '$shared/labelSize'
import { layoutMath, type MathBox } from '$lib/shared/mathSvg.js'
import { readMoved, roundTo, type LabelMode, type LineLabelMode, type LineStyle, type Offset } from './parts.js'

const BASE_FS = 20 // label font size, at medium labels
const BASE_NAME_FS = 21
const FIT_W = 440
const FIT_H = 320
const PAD = 12
const ARC = 24 // angle arc radius
const ARC_GAP = 4.5 // between congruence arcs
const SQUARE = 14 // right-angle square
const TICK = 7 // half a congruence tick
const TICK_GAP = 5
const ARROW = 4.5 // half a parallel arrow's length, and
const ARROW_W = 5 // half its width
const ARROW_GAP = 6
const RIGHT = 1e-6 // how close to 90° counts as a right angle

const RAD = Math.PI / 180
/** A point or a direction, in the figure's own units (SVG's, y down). */
export type Vec = [number, number]
const add = (p: Vec, q: Vec): Vec => [p[0] + q[0], p[1] + q[1]]
const sub = (p: Vec, q: Vec): Vec => [p[0] - q[0], p[1] - q[1]]
const mul = (p: Vec, k: number): Vec => [p[0] * k, p[1] * k]
const dot = (p: Vec, q: Vec) => p[0] * q[0] + p[1] * q[1]
const cross = (p: Vec, q: Vec) => p[0] * q[1] - p[1] * q[0]
const len = (p: Vec) => Math.hypot(p[0], p[1])
const unit = (p: Vec) => mul(p, 1 / (len(p) || 1))
const perp = (p: Vec): Vec => [-p[1], p[0]]
const r1 = (v: number) => Math.round(v * 10) / 10

/** How far a label's box reaches from its middle in direction d. */
const reach = (box: MathBox, d: Vec) => (box.w / 2) * Math.abs(d[0]) + ((box.asc + box.desc) / 2) * Math.abs(d[1])

/**
 * What's written at a side or angle. `given` says whether the teacher typed
 * its measure, which is what "auto" follows; `typed` is how a measure label
 * writes it (as typed, or as the measure it equals), empty to round the solved value.
 */
export type LabelSpec = { mode: LabelMode; text: string; given: boolean; typed: string }
/** What's written at an extra line; `typed` as for a side. */
export type LineLabelSpec = { mode: LineLabelMode; text: string; typed?: string }

/** A height: from a corner straight to the line through two others. */
export type HeightSpec = { id: string; from: string; onto: [string, string]; style: LineStyle; label: LineLabelSpec; foot: string }
/** A diagonal: between two corners that aren't next to each other. */
export type DiagonalSpec = { id: string; ends: [string, string]; style: LineStyle; label: LineLabelSpec }
/**
 * A line out from the shape's center: to a corner (a regular polygon's
 * radius), or to the middle of a side, which it meets at right angles (its
 * apothem). `label` is null for one drawn without a label.
 */
export type SpokeSpec = { id: string; to: string | [string, string]; style: LineStyle; label: LineLabelSpec | null }

/** A shape, ready to lay out. */
export type ShapeSpec = {
  /** The corners in order around the shape, placed with its base side along the x-axis and the rest above it (y up). */
  corners: { id: string; name: string; at: Vec }[]
  /** Each corner's angle in degrees, and each side's length, as the generator worked them out. */
  angles: Record<string, number>
  sides: Record<string, number>
  /** False when no length was given, so the shape has a shape but no size and no lengths are written. */
  sized: boolean
  /** Labels for angles (by corner id) and sides (by side id). */
  labels: Record<string, LabelSpec>
  arcs: Record<string, number>
  ticks: Record<string, number>
  arrows?: Record<string, number>
  heights?: HeightSpec[]
  diagonals?: DiagonalSpec[]
  /** The name of where the diagonals cross, when both are drawn. */
  cross?: string
  /** The shape's center, placed like the corners, shown as a dot and named when asked, and the lines out from it. */
  center?: { at: Vec; dot: boolean; name: string }
  spokes?: SpokeSpec[]
  unit: string
  round: number
  square: boolean
  flip: boolean
  rotate: number
  moved: string
  labelSize: LabelSize
}

/** A label placed on the figure. `part` is what it labels (see the ids above). */
export type PlacedLabel = { part: string; box: MathBox; cx: number; cy: number; x: number; y: number; along: Vec; across: Vec; offset: Offset }

/** A shape laid out for ShapeFigure.svelte to draw. */
export type ShapeLayout = ReturnType<typeof layoutShape>

/** The sides of a shape, as [side id, from corner, to corner], in order around it. */
export function sidesOf<T extends string>(ids: readonly T[]): [string, T, T][] {
  return ids.map((id, i) => [`${id}${ids[(i + 1) % ids.length]}`, id, ids[(i + 1) % ids.length]])
}

export function layoutShape(spec: ShapeSpec) {
  const FS = BASE_FS * LABEL_SCALE[spec.labelSize]
  const NAME_FS = BASE_NAME_FS * LABEL_SCALE[spec.labelSize]
  const ids = spec.corners.map((c) => c.id)
  const n = ids.length

  // Flipped and turned, then in SVG's y-down coordinates, scaled to fit.
  const pts: Record<string, Vec> = {}
  const turn = spec.rotate * RAD
  const turned = (at: Vec): Vec => {
    let [x, y] = at
    if (spec.flip) x = -x
    return [x * Math.cos(turn) - y * Math.sin(turn), -(x * Math.sin(turn) + y * Math.cos(turn))]
  }
  for (const c of spec.corners) pts[c.id] = turned(c.at)
  const xs = ids.map((v) => pts[v][0])
  const ys = ids.map((v) => pts[v][1])
  const scale = Math.min(FIT_W / (Math.max(...xs) - Math.min(...xs) || 1), FIT_H / (Math.max(...ys) - Math.min(...ys) || 1))
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)]
  const fitted = ([x, y]: Vec): Vec => [(x - x0) * scale, (y - y0) * scale]
  for (const v of ids) pts[v] = fitted(pts[v])
  const center = spec.center ? fitted(turned(spec.center.at)) : null
  const middle = mul(ids.reduce<Vec>((m, v) => add(m, pts[v]), [0, 0]), 1 / n)

  const moved = readMoved(spec.moved)
  const labels: PlacedLabel[] = []
  const overlaps = (box: MathBox, [cx, cy]: Vec) =>
    labels.some((l) => Math.abs(l.cx - cx) < (l.box.w + box.w) / 2 + 3 && Math.abs(l.cy - cy) < (l.box.asc + l.box.desc + box.asc + box.desc) / 2 + 2)
  // `slide`: how far the label may move along its part to clear the labels already placed.
  const place = (part: string, box: MathBox | null, center: Vec, along: Vec, across: Vec, slide = 0) => {
    if (!box) return
    for (let k = 1; slide && overlaps(box, center) && k * 8 <= slide; k++) {
      const tries = [add(center, mul(along, k * 8)), add(center, mul(along, -k * 8))].filter((c) => !overlaps(box, c))
      if (tries.length) center = tries[0]
    }
    const o = moved[part] ?? [0, 0]
    const [cx, cy] = add(center, add(mul(along, o[0]), mul(across, o[1])))
    labels.push({ part, box, cx, cy, x: cx - box.w / 2, y: cy + (box.asc - box.desc) / 2, along, across, offset: o })
  }

  const rounded = (v: number) => roundTo(v, spec.round)
  const unitText = spec.unit.trim() ? ` ${spec.unit.trim()}` : ''
  /** What's written at a side or angle, as math, or null for nothing. */
  function content(key: string, value: number, isAngle: boolean) {
    const l = spec.labels[key]
    if (!l) return null
    let mode = l.mode
    if (mode === 'auto') mode = l.given ? 'measure' : 'none'
    if (mode === 'text') return layoutMath(l.text, FS)
    if (mode !== 'measure' || (!isAngle && !spec.sized)) return null
    return layoutMath(l.typed || rounded(value), FS, { suffix: isAngle ? '°' : unitText })
  }
  /** What's written at an extra line of length `length` (in the figure's units). */
  function lineContent(l: LineLabelSpec, length: number) {
    if (l.mode === 'text') return layoutMath(l.text, FS)
    if (l.mode === 'measure' && spec.sized) return layoutMath(l.typed || rounded(length / scale), FS, { suffix: unitText })
    return null
  }
  const foot = (from: Vec, [a, b]: [string, string]) => {
    const dir = sub(pts[b], pts[a])
    const t = dot(sub(from, pts[a]), dir) / dot(dir, dir)
    return { t, at: add(pts[a], mul(dir, t)) }
  }

  // Angles: an arc (or congruence arcs) when labeled or marked, a square at a right angle.
  const arcs: string[] = []
  const squares: [Vec, Vec, Vec][] = []
  ids.forEach((v, i) => {
    const [a, b] = [ids[(i + n - 1) % n], ids[(i + 1) % n]].sort((p, q) => ids.indexOf(p) - ids.indexOf(q))
    const u1 = unit(sub(pts[a], pts[v]))
    const u2 = unit(sub(pts[b], pts[v]))
    const bis = unit(add(u1, u2))
    const room = 0.4 * Math.min(len(sub(pts[a], pts[v])), len(sub(pts[b], pts[v])))
    const box = content(v, spec.angles[v], true)
    const count = spec.arcs[v] ?? 0
    let outer = 0
    if (spec.square && Math.abs(spec.angles[v] - 90) < RIGHT) {
      const q = Math.min(SQUARE, room)
      squares.push([add(pts[v], mul(u1, q)), add(pts[v], add(mul(u1, q), mul(u2, q))), add(pts[v], mul(u2, q))])
      outer = q * Math.SQRT2
    } else if (box || count) {
      const r0 = Math.min(ARC, room)
      const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0
      for (let i = 0; i < Math.max(1, count); i++) {
        const r = r0 + i * ARC_GAP
        const [p, q] = [add(pts[v], mul(u1, r)), add(pts[v], mul(u2, r))]
        arcs.push(`M${r1(p[0])},${r1(p[1])} A${r1(r)},${r1(r)} 0 0 ${sweep} ${r1(q[0])},${r1(q[1])}`)
      }
      outer = r0 + (Math.max(1, count) - 1) * ARC_GAP
    }
    if (box) {
      // Between the two sides, or when extra lines from this corner split the
      // angle, in the widest part, so no line runs through the label.
      let [e1, e2, spread] = [u1, u2, spec.angles[v] * RAD]
      const between = (p: Vec, q: Vec) => Math.acos(Math.max(-1, Math.min(1, dot(p, q))))
      const rays = [
        ...(spec.heights ?? []).filter((h) => h.from === v).map((h) => unit(sub(foot(pts[v], h.onto).at, pts[v]))),
        ...(spec.diagonals ?? []).filter((d) => d.ends.includes(v)).map((d) => unit(sub(pts[d.ends[0] === v ? d.ends[1] : d.ends[0]], pts[v]))),
      ]
        .filter((r) => {
          const [w1, w2] = [between(u1, r), between(u2, r)]
          return Math.abs(w1 + w2 - spread) < 1e-6 && Math.min(w1, w2) > 1e-3 // runs inside this angle, clear of its sides
        })
        .sort((p, q) => between(u1, p) - between(u1, q))
      const edges = [u1, ...rays, u2]
      for (let k = 0; rays.length && k < edges.length - 1; k++) {
        const gap = between(edges[k], edges[k + 1])
        if (k === 0 || gap >= spread) [e1, e2, spread] = [edges[k], edges[k + 1], gap]
      }
      const mid = unit(add(e1, e2))
      // Far enough in to clear the arc, and to fit between its two edges.
      const half = Math.sin(spread / 2)
      const toSide = Math.max(...[e1, e2].map((u) => (reach(box, perp(u)) + 3) / half))
      const d = Math.max(outer + 5 + reach(box, mid), toSide)
      place(v, box, add(pts[v], mul(mid, d)), mid, perp(mid))
    }
    const name = spec.corners[i].name.trim()
    const nameBox = name ? layoutMath(name, NAME_FS, { upright: false }) : null
    if (nameBox) {
      const out = mul(bis, -1)
      place(`v${v}`, nameBox, add(pts[v], mul(out, 7 + reach(nameBox, out))), out, perp(out))
    }
  })

  // Sides: congruence ticks and parallel arrows across the middle, the label just outside it.
  const ticks: [Vec, Vec][] = []
  const arrows: [Vec, Vec, Vec][] = []
  for (const [side, from, to] of sidesOf(ids)) {
    const [p, q] = [pts[from], pts[to]]
    const mid = mul(add(p, q), 0.5)
    const t = unit(sub(q, p))
    let nrm = perp(t)
    if (dot(nrm, sub(middle, mid)) > 0) nrm = mul(nrm, -1)
    const count = spec.ticks[side] ?? 0
    const arrowCount = spec.arrows?.[side] ?? 0
    // Ticks and arrows on one side sit apart, arrows toward the side's far end.
    const both = count && arrowCount
    const tickMid = both ? add(mid, mul(t, -(count * TICK_GAP) / 2 - 4)) : mid
    const arrowMid = both ? add(mid, mul(t, (arrowCount * ARROW_GAP) / 2 + 4)) : mid
    for (let i = 0; i < count; i++) {
      const c = add(tickMid, mul(t, (i - (count - 1) / 2) * TICK_GAP))
      ticks.push([add(c, mul(nrm, TICK)), add(c, mul(nrm, -TICK))])
    }
    // Every arrow points rightward on the page (or down, on an upright side),
    // so arrows on parallel sides point the same way.
    const way = t[0] > 1e-9 || (Math.abs(t[0]) <= 1e-9 && t[1] > 0) ? t : mul(t, -1)
    for (let i = 0; i < arrowCount; i++) {
      const c = add(arrowMid, mul(way, (i - (arrowCount - 1) / 2) * ARROW_GAP))
      const tip = add(c, mul(way, ARROW))
      const back = add(c, mul(way, -ARROW))
      arrows.push([add(back, mul(nrm, ARROW_W)), tip, add(back, mul(nrm, -ARROW_W))])
    }
    const box = content(side, spec.sides[side], false)
    if (box) place(side, box, add(mid, mul(nrm, (count || arrowCount ? TICK + 6 : 6) + reach(box, nrm))), t, nrm)
  }

  // Heights: from a corner straight to the line through a side, which runs on
  // (dashed) when the height lands outside the shape.
  const lines: { part: string; from: Vec; to: Vec; style: LineStyle }[] = []
  const extensions: [Vec, Vec][] = []
  for (const h of spec.heights ?? []) {
    const v = h.from
    const [a, b] = h.onto
    const { t, at: ft } = foot(pts[v], h.onto)
    const up = unit(sub(pts[v], ft))
    const onCorner = Math.abs(t) < 1e-6 || Math.abs(t - 1) < 1e-6 // the height is a side
    let along = unit(t < 0.5 ? sub(pts[b], ft) : sub(pts[a], ft)) // toward the side, for the square
    if (t < 0) along = unit(sub(pts[a], ft))
    if (t > 1) along = unit(sub(pts[b], ft))
    if (!onCorner) {
      // Drawn out from the foot, so the dashes start whole at the right angle there.
      lines.push({ part: h.id, from: ft, to: pts[v], style: h.style })
      if (t < 0) extensions.push([ft, pts[a]])
      if (t > 1) extensions.push([ft, pts[b]])
      if (spec.square) {
        const q = Math.min(12, len(sub(pts[v], ft)) * 0.4)
        squares.push([add(ft, mul(along, q)), add(ft, add(mul(along, q), mul(up, q))), add(ft, mul(up, q))])
      }
    }
    const box = lineContent(h.label, len(sub(pts[v], ft)))
    if (box) {
      // Away from whichever side from this corner runs closest to the height.
      const down = mul(up, -1)
      const [near] = [pts[a], pts[b]].map((e) => unit(sub(e, pts[v]))).sort((p, q) => dot(q, down) - dot(p, down))
      let across = perp(up)
      if (dot(across, near) > 0) across = mul(across, -1)
      const spot = (d: Vec) => add(mul(add(pts[v], ft), 0.5), mul(d, 6 + reach(box, d)))
      // The other side of the height when this one is crowded (by its corner's angle label, say).
      // It has to fit between the height and the side next to it there.
      const other = spot(mul(across, -1))
      const rel = sub(other, pts[v])
      const fits = Math.abs(rel[0] * near[1] - rel[1] * near[0]) > reach(box, perp(near)) + 3
      if (fits && overlaps(box, spot(across)) && !overlaps(box, other)) across = mul(across, -1)
      place(h.id, box, spot(across), up, across, 0.4 * len(sub(pts[v], ft)))
    }
    const footBox = h.foot.trim() ? layoutMath(h.foot.trim(), NAME_FS) : null
    if (footBox) {
      const down = mul(up, -1)
      place(`f${v}`, footBox, add(ft, mul(down, 7 + reach(footBox, down))), down, perp(down))
    }
  }

  // Diagonals: corner to corner. With both drawn, each label sits halfway
  // from its first corner to where they cross, so the two don't meet there.
  const diagonals = spec.diagonals ?? []
  let crossing: Vec | null = null
  if (diagonals.length === 2) {
    const [[p1, q1], [p2, q2]] = diagonals.map((d) => d.ends.map((e) => pts[e]))
    const d1 = sub(q1, p1)
    const d2 = sub(q2, p2)
    const k = cross(d1, d2)
    if (Math.abs(k) > 1e-9) crossing = add(p1, mul(d1, cross(sub(p2, p1), d2) / k))
  }
  for (const d of diagonals) {
    const [p, q] = [pts[d.ends[0]], pts[d.ends[1]]]
    lines.push({ part: d.id, from: p, to: q, style: d.style })
    const box = lineContent(d.label, len(sub(q, p)))
    if (!box) continue
    const t = unit(sub(q, p))
    let across = perp(t)
    if (across[1] > 0) across = mul(across, -1) // above the line reads best
    const spot = mul(add(p, crossing ?? q), 0.5)
    place(d.id, box, add(spot, mul(across, 6 + reach(box, across))), t, across, 0.4 * len(sub(crossing ?? q, p)))
  }
  if (crossing) {
    // Rays from the crossing to all four corners; the square goes between the
    // first corner of each diagonal, the name in the widest gap left.
    const rays = diagonals.flatMap((d) => d.ends.map((e) => unit(sub(pts[e], crossing!))))
    const [a1, , a2] = rays
    const right = Math.abs(dot(rays[0], rays[2])) < 1e-6
    if (spec.square && right) {
      const q = Math.min(12, 0.3 * Math.min(...diagonals.flatMap((d) => d.ends.map((e) => len(sub(pts[e], crossing!))))))
      squares.push([add(crossing, mul(a1, q)), add(crossing, add(mul(a1, q), mul(a2, q))), add(crossing, mul(a2, q))])
    }
    const name = spec.cross?.trim()
    const box = name ? layoutMath(name, NAME_FS) : null
    if (box) {
      const angleOf = (u: Vec) => Math.atan2(u[1], u[0])
      const sorted = [...rays].sort((u, w) => angleOf(u) - angleOf(w))
      let best: { gap: number; dir: Vec } | null = null
      sorted.forEach((u, i) => {
        const w = sorted[(i + 1) % 4]
        const gap = (angleOf(w) - angleOf(u) + 2 * Math.PI) % (2 * Math.PI)
        const squared = spec.square && right && ((u === a1 && w === a2) || (u === a2 && w === a1))
        if (!squared && (!best || gap > best.gap + 1e-9)) best = { gap, dir: unit(add(u, w)) }
      })
      const dir = best!.dir
      place('x', box, add(crossing, mul(dir, 8 + reach(box, dir))), dir, perp(dir))
    }
  }

  // Lines out from the center: each label beside its line's middle, on the
  // side away from the other lines' ends, so an apothem's label and a
  // radius's don't meet in the triangle between them.
  const dots: Vec[] = []
  if (center) {
    const ends = (spec.spokes ?? []).map((sp) => (typeof sp.to === 'string' ? pts[sp.to] : mul(add(pts[sp.to[0]], pts[sp.to[1]]), 0.5)))
    ;(spec.spokes ?? []).forEach((sp, i) => {
      const end = ends[i]
      lines.push({ part: sp.id, from: center, to: end, style: sp.style })
      if (typeof sp.to !== 'string' && spec.square) {
        const q = Math.min(12, 0.4 * len(sub(end, center)))
        const along = unit(sub(pts[sp.to[1]], end))
        const up = unit(sub(center, end))
        squares.push([add(end, mul(along, q)), add(end, add(mul(along, q), mul(up, q))), add(end, mul(up, q))])
      }
      const box = sp.label ? lineContent(sp.label, len(sub(end, center))) : null
      if (!box) return
      const t = unit(sub(end, center))
      let across = perp(t)
      const others = ends.filter((_, j) => j !== i)
      if (others.length) {
        const away = sub(mul(add(center, end), 0.5), mul(others.reduce<Vec>((m, e) => add(m, e), [0, 0]), 1 / others.length))
        if (dot(across, away) < 0) across = mul(across, -1)
      } else if (across[1] > 0) across = mul(across, -1)
      place(sp.id, box, add(mul(add(center, end), 0.5), mul(across, 6 + reach(box, across))), t, across, 0.4 * len(sub(end, center)))
    })
    if (spec.center!.dot) dots.push(center)
    // The center's name in the widest gap between its lines, or just below it.
    const name = spec.center!.name.trim()
    const box = name ? layoutMath(name, NAME_FS) : null
    if (box) {
      const angleOf = (u: Vec) => Math.atan2(u[1], u[0])
      const rays = ends.map((e) => unit(sub(e, center))).sort((u, w) => angleOf(u) - angleOf(w))
      let dir: Vec = [0, 1]
      let widest = -1
      rays.forEach((u, i) => {
        const w = rays[(i + 1) % rays.length]
        const gap = rays.length === 1 ? 2 * Math.PI : (angleOf(w) - angleOf(u) + 2 * Math.PI) % (2 * Math.PI)
        // The middle of a gap wider than half a turn is away from both its edges.
        const mid = rays.length === 1 ? mul(u, -1) : mul(add(u, w), gap > Math.PI ? -1 : 1)
        if (gap > widest + 1e-9) [widest, dir] = [gap, len(mid) < 1e-6 ? perp(u) : unit(mid)]
      })
      place('o', box, add(center, mul(dir, 7 + reach(box, dir))), dir, perp(dir))
    }
  }

  // The frame holds the shape, its extensions and every label.
  const points: Vec[] = [...ids.map((v) => pts[v]), ...extensions.flat()]
  for (const l of labels) points.push([l.cx - l.box.w / 2, l.y - l.box.asc], [l.cx + l.box.w / 2, l.y + l.box.desc])
  const minX = Math.min(...points.map((p) => p[0])) - PAD
  const minY = Math.min(...points.map((p) => p[1])) - PAD
  const maxX = Math.max(...points.map((p) => p[0])) + PAD
  const maxY = Math.max(...points.map((p) => p[1])) + PAD

  return {
    frame: { x: r1(minX), y: r1(minY), w: r1(maxX - minX), h: r1(maxY - minY) },
    corners: ids.map((v) => pts[v]),
    arcs,
    squares,
    ticks,
    arrows,
    lines,
    extensions,
    dots,
    labels,
    /** The figure's units per unit of length, for anything the generator measures on it. */
    scale,
  }
}
