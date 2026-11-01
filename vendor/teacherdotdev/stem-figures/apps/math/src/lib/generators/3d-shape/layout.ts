// Lays out a 3D shape as plain lines and arcs for Shape3D.svelte to draw: its
// edges (dashed where hidden), the lines its measures sit on (a height, a
// radius, a slant height), right-angle squares, corner names and labels.
//
// A shape is built in 3D, x to the right, y up and z back, then drawn flat
// the way textbooks draw one. Prisms and pyramids keep their front face
// square-on, with depth running back on a diagonal at half length. Round
// shapes (cylinders, cones, spheres) are seen from a little above instead, so
// their circles become level ovals. Like the triangle, the shape is scaled to
// fit the same box whatever its measures; the frame then grows to hold its
// labels.

import { LABEL_SCALE } from '$shared/labelSize'
import { layoutMath, type MathBox } from '$lib/shared/mathSvg.js'
import { labelPlacer } from '$lib/shapes/placeLabels.js'
import { add, dot, len, mul, perp, r1, reach, sub, unit, type Vec } from '$lib/shapes/vec.js'
import type { Part, Settings } from './settings.js'
import { radiusOf, type ShapeRead } from './solve.js'

export type { Vec } from '$lib/shapes/vec.js'

const BASE_FS = 20 // label font size, at medium labels
const BASE_NAME_FS = 21
const FIT_W = 420
const FIT_H = 300
const PAD = 12
const SQUARE = 12 // right-angle square
const DEPTH = 0.5 // how much depth is shortened
const SLOPE = Math.SQRT1_2 // depth runs back at 45°

type P3 = [number, number, number]
const add3 = (p: P3, q: P3): P3 => [p[0] + q[0], p[1] + q[1], p[2] + q[2]]
const sub3 = (p: P3, q: P3): P3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]]
const mid3 = (p: P3, q: P3): P3 => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]
const dot3 = (p: P3, q: P3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2]
const avg3 = (ps: P3[]): P3 => ps.reduce((t, p) => add3(t, p), [0, 0, 0] as P3).map((c) => c / ps.length) as P3
const midV = (p: Vec, q: Vec) => mul(add(p, q), 0.5)

/** An edge of the shape; a hidden one is drawn dashed, or not at all when hidden edges are off. */
export type Edge = { a: Vec; b: Vec; hidden: boolean }
/** A line a measure sits on that isn't an edge: dashed for heights and anything out of sight. */
export type Extra = { a: Vec; b: Vec; dashed: boolean }
/** A curved outline, as an SVG path. */
export type Arc = { d: string; hidden: boolean }

/** A 3D shape laid out for Shape3D.svelte to draw. */
export type ShapeLayout = ReturnType<typeof buildShape>

/**
 * @param s    clean settings
 * @param read what the settings mean, with measures that make a shape
 */
export function buildShape(s: Settings, read: Pick<ShapeRead, 'form' | 'given'> & { values: Record<Part, number> }) {
  const FS = BASE_FS * LABEL_SCALE[s.labelSize]
  const NAME_FS = BASE_NAME_FS * LABEL_SCALE[s.labelSize]
  const { form, values: v, given } = read
  const dir = s.depth === 'right' ? 1 : -1
  const ld = s.leanTo === 'right' ? 1 : -1
  const lean = form.oblique ? v.lean * ld : 0
  const round = !(form.shape === 'prism' || form.shape === 'pyramid')

  // Flat, in the shape's own units (y down), before it's scaled to fit.
  const flat = ([x, y, z]: P3): Vec => (round ? [x, -(y + z * DEPTH * SLOPE)] : [x + dir * z * DEPTH * SLOPE, -(y + z * DEPTH * SLOPE)])
  /** Seen along this direction, a point and everything behind it land on the same spot. */
  const view: P3 = [-dir * DEPTH * SLOPE, -DEPTH * SLOPE, 1]

  // ---- The shape in 3D ----
  let corners: P3[] = []
  let faces: number[][] = []
  let bottomCount = 0
  type Circle = { c: P3; r: number }
  const circles: Circle[] = []
  let apex: P3 | null = null
  let sphere: { c: P3; r: number } | null = null
  const r = form.parts.includes('radius') ? radiusOf(s, v.radius) : 0

  if (!round) {
    const base = basePolygon(form.base, form.sides, v)
    const n = base.length
    bottomCount = n
    if (form.shape === 'prism') {
      const h = v.height
      corners = form.lie
        ? [...base.map(([u, w]): P3 => [u, w, 0]), ...base.map(([u, w]): P3 => [u, w, h])]
        : [...base.map(([u, w]): P3 => [u, 0, w]), ...base.map(([u, w]): P3 => [u + lean, h, w])]
      faces = [base.map((_, i) => i), base.map((_, i) => n + i), ...base.map((_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i])]
    } else {
      const c = avg3(base.map(([u, w]): P3 => [u, 0, w]))
      apex = [c[0] + lean, v.height, c[2]]
      corners = [...base.map(([u, w]): P3 => [u, 0, w]), apex]
      faces = [base.map((_, i) => i), ...base.map((_, i) => [i, (i + 1) % n, n])]
    }
  } else if (form.shape === 'cylinder') {
    circles.push({ c: [0, 0, 0], r }, { c: [lean, v.height, 0], r })
  } else if (form.shape === 'cone') {
    circles.push({ c: [0, 0, 0], r })
    apex = [lean, v.height, 0]
  } else {
    sphere = { c: [0, 0, 0], r }
    if (form.shape === 'hemisphere' || form.shape === 'sphere') circles.push({ c: [0, 0, 0], r })
  }

  // ---- Scaled to fit ----
  const rawPoints: Vec[] = corners.map(flat)
  if (apex) rawPoints.push(flat(apex))
  const ry = (rad: number) => rad * DEPTH * SLOPE // a level circle's oval is this tall, either side of its middle
  for (const c of circles) {
    const m = flat(c.c)
    rawPoints.push([m[0] - c.r, m[1] - ry(c.r)], [m[0] + c.r, m[1] + ry(c.r)])
  }
  if (sphere) {
    const m = flat(sphere.c)
    const up = form.shape === 'hemisphere' && s.bowl ? 0 : sphere.r
    const down = form.shape === 'hemisphere' && !s.bowl ? ry(sphere.r) : sphere.r
    rawPoints.push([m[0] - sphere.r, m[1] - up], [m[0] + sphere.r, m[1] + down])
  }
  if (form.oblique) {
    // Heights dropped outside the shape land level with its base.
    const tops = form.shape === 'prism' ? corners.slice(bottomCount) : form.shape === 'cylinder' ? [circles[1].c] : [apex!]
    for (const p of tops) rawPoints.push(flat([p[0], 0, p[2]]))
  }
  const xs = rawPoints.map((p) => p[0])
  const ys = rawPoints.map((p) => p[1])
  const scale = Math.min(FIT_W / (Math.max(...xs) - Math.min(...xs) || 1), FIT_H / (Math.max(...ys) - Math.min(...ys) || 1))
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)]
  /** Where a point in 3D lands on the figure. */
  const at = (p: P3): Vec => {
    const [x, y] = flat(p)
    return [(x - x0) * scale, (y - y0) * scale]
  }

  const edges: Edge[] = []
  const arcs: Arc[] = []
  const extras: Extra[] = []
  const squares: Vec[][] = []
  const dots: Vec[] = []
  const outline: Vec[] = [] // points the frame must hold

  // ---- Edges ----
  const pts = corners.map(at)
  if (!round) {
    const centroid = avg3(corners)
    const facing = faces.map((f) => {
      const nrm = normal(f.map((i) => corners[i]))
      const out = dot3(nrm, sub3(avg3(f.map((i) => corners[i])), centroid)) < 0 ? -1 : 1
      return out * dot3(nrm, view) < 0 // its outside faces the viewer
    })
    const seen = new Map<string, boolean>()
    faces.forEach((f, fi) =>
      f.forEach((a, k) => {
        const b = f[(k + 1) % f.length]
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        seen.set(key, (seen.get(key) ?? false) || facing[fi])
      }),
    )
    for (const [key, visible] of seen) {
      const [a, b] = key.split('-').map(Number)
      edges.push({ a: pts[a], b: pts[b], hidden: !visible })
    }
    outline.push(...pts)
  }

  // ---- Curved outlines ----
  const oval = (c: P3, rad: number) => ({ m: at(c), rx: rad * scale, ry: ry(rad) * scale })
  const onOval = (o: { m: Vec; rx: number; ry: number }, phi: number): Vec => [o.m[0] + o.rx * Math.cos(phi), o.m[1] + o.ry * Math.sin(phi)]
  const arc = (o: { m: Vec; rx: number; ry: number }, from: number, to: number, hidden: boolean) => {
    while (to <= from) to += 2 * Math.PI
    const steps = Math.max(2, Math.ceil(((to - from) / Math.PI) * 2))
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const p = onOval(o, from + ((to - from) * i) / steps)
      outline.push(p)
      d += i ? ` A${r1(o.rx)},${r1(o.ry)} 0 0 1 ${r1(p[0])},${r1(p[1])}` : `M${r1(p[0])},${r1(p[1])}`
    }
    arcs.push({ d, hidden })
  }
  const ovals = circles.map((c) => oval(c.c, c.r))

  if (form.shape === 'cylinder') {
    const [lo, hi] = ovals
    const T = sub(hi.m, lo.m)
    const phi = Math.atan2(-T[0] / lo.rx, T[1] / lo.ry) // where the sides touch the ovals
    for (const f of [phi, phi + Math.PI]) edges.push({ a: onOval(lo, f), b: onOval(hi, f), hidden: false })
    const middle = onOval(lo, phi + Math.PI / 2)
    const backFirst = dot(sub(middle, lo.m), T) > 0 // the half from phi on is behind the cylinder
    arc(lo, phi, phi + Math.PI, backFirst)
    arc(lo, phi + Math.PI, phi + 2 * Math.PI, !backFirst)
    arc(hi, 0, Math.PI, false)
    arc(hi, Math.PI, 2 * Math.PI, false)
  } else if (form.shape === 'cone') {
    const [o] = ovals
    const tip = at(apex!)
    const q: Vec = [(tip[0] - o.m[0]) / o.rx, (tip[1] - o.m[1]) / o.ry]
    if (len(q) <= 1) {
      // A cone this flat has its tip over its own base: all of it shows.
      arc(o, 0, Math.PI, false)
      arc(o, Math.PI, 2 * Math.PI, false)
    } else {
      const toward = Math.atan2(q[1], q[0])
      const spread = Math.acos(1 / len(q))
      for (const f of [toward - spread, toward + spread]) edges.push({ a: tip, b: onOval(o, f), hidden: false })
      arc(o, toward - spread, toward + spread, true)
      arc(o, toward + spread, toward - spread + 2 * Math.PI, false)
    }
    outline.push(tip)
  } else if (sphere) {
    const [o] = ovals
    const R = o.rx
    const circle = { m: o.m, rx: R, ry: R }
    if (form.shape === 'sphere') {
      arc(circle, 0, Math.PI, false)
      arc(circle, Math.PI, 2 * Math.PI, false)
      arc(o, 0, Math.PI, false)
      arc(o, Math.PI, 2 * Math.PI, true)
    } else if (!s.bowl) {
      arc(circle, Math.PI, 2 * Math.PI, false) // the dome
      arc(o, 0, Math.PI, false)
      arc(o, Math.PI, 2 * Math.PI, true)
    } else {
      arc(circle, 0, Math.PI, false) // the bowl
      arc(o, 0, Math.PI, false)
      arc(o, Math.PI, 2 * Math.PI, false)
    }
  }

  // ---- Labels ----
  const { labels, place } = labelPlacer(s.moved)
  const rounded = (x: number) => String(Number(x.toFixed(s.round)))
  const unitText = s.unit.trim() ? ` ${s.unit.trim()}` : ''
  const has = (k: Part) => form.parts.includes(k)
  /** What's written at a part, as math, or null for nothing. */
  function content(k: Part): MathBox | null {
    if (!has(k)) return null
    let mode = s[`${k}Label`]
    if (mode === 'auto') mode = given[k] != null ? 'measure' : 'none'
    if (mode === 'text') return layoutMath(s[`${k}Text`], FS)
    if (mode !== 'measure') return null
    const text = given[k] != null ? s[k as keyof Settings] as string : rounded(v[k])
    return layoutMath(text, FS, { suffix: unitText })
  }
  const shown = (k: Part) => content(k) !== null
  const frameCenter = (() => {
    const all = outline.length ? outline : [at([0, 0, 0])]
    const xs2 = all.map((p) => p[0])
    const ys2 = all.map((p) => p[1])
    return [(Math.min(...xs2) + Math.max(...xs2)) / 2, (Math.min(...ys2) + Math.max(...ys2)) / 2] as Vec
  })()
  /**
   * A part's label beside the line from a to b, on the side `side` points to
   * (away from the shape, if not given), `at` of the way along it.
   */
  function labelOn(k: Part, a: Vec, b: Vec, side?: Vec, at = 0.5) {
    const box = content(k)
    if (!box) return
    const t = unit(sub(b, a))
    const m = add(a, mul(sub(b, a), at))
    let n = perp(t)
    const want = side ?? sub(m, frameCenter)
    if (dot(n, want) < 0) n = mul(n, -1)
    place(k, box, add(m, mul(n, 6 + reach(box, n))), t, n, 0.4 * len(sub(b, a)))
  }
  const square = (foot: Vec, toward1: Vec, toward2: Vec) => {
    if (!s.square) return
    const [u1, u2] = [unit(sub(toward1, foot)), unit(sub(toward2, foot))]
    const q = Math.min(SQUARE, 0.4 * len(sub(toward1, foot)), 0.4 * len(sub(toward2, foot)))
    squares.push([add(foot, mul(u1, q)), add(foot, add(mul(u1, q), mul(u2, q))), add(foot, mul(u2, q))])
  }
  const DOWN: Vec = [0, 1]
  const UP: Vec = [0, -1]
  const SIDE: Vec = [dir, 0]
  const OTHER_SIDE: Vec = [-dir, 0]
  const n = bottomCount

  /** A dashed height from `top` down to its level foot, with the lean along the base's line to it when it overhangs. */
  function dropHeight(top: P3, from: P3, labelSide: Vec) {
    const foot3: P3 = [top[0], 0, top[2]]
    const [tp, fp, bp] = [at(top), at(foot3), at(from)]
    const overhangs = form.oblique && Math.abs(top[0] - from[0]) > 1e-9
    if (!s.showHeight) return
    extras.push({ a: fp, b: tp, dashed: true })
    outline.push(fp)
    if (overhangs) {
      extras.push({ a: bp, b: fp, dashed: true })
      square(fp, tp, bp)
    }
    labelOn('height', fp, tp, labelSide)
    if (overhangs) labelOn('lean', bp, fp, DOWN)
  }

  /** The bottom edge running back that the width sits on: on the depth's side, unless the lean's height and lean are there. */
  const widthEdge = (): [Vec, Vec] => {
    const right = (dir === 1) !== (form.oblique && ld === dir)
    return right ? [pts[1], pts[2]] : [pts[0], pts[3]]
  }

  if (form.shape === 'prism') {
    const B = (i: number) => pts[i]
    const T = (i: number) => pts[n + i]
    const [near, far] = dir === 1 ? [0, 1] : [1, 0] // front corners on the side away from the depth, and toward it
    if (form.base === 'rectangle') {
      labelOn('length', B(0), B(1), DOWN)
      labelOn('width', ...widthEdge())
    } else if (form.base === 'regular') {
      labelOn('side', B(0), B(1), DOWN)
      if (shown('apothem')) {
        // From the middle of the face the base is drawn on (the top, standing; the front, lying).
        const face = form.lie ? corners.slice(0, n) : corners.slice(n)
        const c = at(avg3(face))
        const e = form.lie ? midV(B(0), B(1)) : midV(T(0), T(1))
        extras.push({ a: c, b: e, dashed: false })
        dots.push(c)
        square(e, c, form.lie ? B(1) : T(1))
        labelOn('apothem', c, e, form.lie ? SIDE : UP)
      }
    } else {
      labelOn('triBase', B(0), B(1), DOWN)
      if (form.base === 'right') {
        labelOn('triHeight', B(0), B(2), form.lie ? [-1, 0] : undefined)
        if (form.lie) square(B(0), B(1), B(2))
      } else if (shown('triHeight')) {
        const foot = midV(B(0), B(1))
        extras.push({ a: foot, b: B(2), dashed: true })
        square(foot, B(2), B(1))
        labelOn('triHeight', foot, B(2), form.lie ? [-1, 0] : OTHER_SIDE)
      }
      labelOn('hyp', B(1), B(2))
    }
    if (form.lie) labelOn('height', B(far), pts[n + far])
    else if (!form.oblique) labelOn('height', B(near), T(near), OTHER_SIDE)
    else {
      const k = ld === 1 ? 1 : 0 // the front corner the top leans out past
      dropHeight(corners[n + k], corners[k], [ld, 0])
      // The slanted edge furthest out on the side it leans to, where its label has room.
      const out = (i: number) => ld * (B(i)[0] + T(i)[0])
      const j = Array.from({ length: n }, (_, i) => i).reduce((best, i) => (out(i) > out(best) + 1e-6 ? i : best), 0)
      // When the height hangs from this same edge's top, the label goes on its inner side,
      // clear of the height; otherwise toward its top, above the height beside it.
      if (j === k) labelOn('edge', B(j), T(j), [-ld, 0])
      else labelOn('edge', B(j), T(j), [ld, 0], 0.72)
    }
  } else if (form.shape === 'pyramid') {
    const B = (i: number) => pts[i]
    if (form.base === 'rectangle') {
      labelOn('length', B(0), B(1), DOWN)
      labelOn('width', ...widthEdge())
    } else {
      labelOn('side', B(0), B(1), DOWN)
    }
    const c3 = avg3(corners.slice(0, n))
    const c = at(c3)
    const frontMid = midV(B(0), B(1))
    if (shown('apothem')) {
      extras.push({ a: c, b: frontMid, dashed: true })
      square(frontMid, c, B(1))
      labelOn('apothem', c, frontMid, OTHER_SIDE)
    }
    if (!form.oblique) {
      if (s.showHeight) {
        extras.push({ a: c, b: pts[n], dashed: true })
        square(c, pts[n], frontMid)
        labelOn('height', c, pts[n], OTHER_SIDE)
      }
      if (shown('slant')) {
        extras.push({ a: frontMid, b: pts[n], dashed: true })
        square(frontMid, pts[n], B(1))
        labelOn('slant', frontMid, pts[n], SIDE)
      }
    } else {
      dropHeight(apex!, c3, [ld, 0])
    }
  } else if (form.shape === 'cylinder' || form.shape === 'cone' || sphere) {
    // The radius (or diameter): across the top of a cylinder, the base of a
    // cone or hemisphere, or the middle of a sphere.
    const o = form.shape === 'cylinder' ? ovals[1] : ovals[0]
    // Away from the lean, which runs out along the same line.
    const toward = form.oblique ? -ld : 1
    const rim: Vec = [o.m[0] + toward * o.rx, o.m[1]]
    const start: Vec = s.diameter ? [o.m[0] - toward * o.rx, o.m[1]] : o.m
    if (shown('radius')) {
      extras.push({ a: start, b: rim, dashed: form.shape === 'cone' })
      if (!s.diameter) dots.push(o.m)
      labelOn('radius', start, rim, form.shape === 'cone' && !form.oblique ? DOWN : UP)
    }
    if (form.shape === 'cylinder') {
      const [lo, hi] = ovals
      if (!form.oblique) labelOn('height', [lo.m[0] + lo.rx, lo.m[1]], [hi.m[0] + hi.rx, hi.m[1]], [1, 0])
      else {
        dropHeight(circles[1].c, circles[0].c, [ld, 0])
        // The slanted side furthest out on the side it leans to, where its label has room.
        const [e1, e2] = edges
        const outer = ld * (e1.a[0] + e1.b[0]) > ld * (e2.a[0] + e2.b[0]) ? e1 : e2
        labelOn('edge', outer.a, outer.b, [ld, 0])
      }
    } else if (form.shape === 'cone') {
      const tip = at(apex!)
      if (!form.oblique) {
        if (s.showHeight) {
          extras.push({ a: o.m, b: tip, dashed: true })
          square(o.m, tip, rim)
          labelOn('height', o.m, tip, [-1, 0])
        }
        const right = edges.reduce((best, e) => (e.b[0] > best.b[0] ? e : best), edges[0])
        if (right) labelOn('slant', right.b, right.a, [1, 0])
      } else {
        dropHeight(apex!, [0, 0, 0], [ld, 0])
      }
    }
  }

  // Corner names: outward from the middle of the shape.
  if (s.names && !round) {
    const typed = s.nameList.split(/\s+/).filter(Boolean)
    corners.forEach((_, i) => {
      const name = typed[i] && typed[i] !== '_' ? typed[i] : letter(i)
      const box = layoutMath(name, NAME_FS, { upright: false })
      if (!box) return
      let out = unit(sub(pts[i], frameCenter))
      if (!len(out)) out = UP
      place(`v${letter(i)}`, box, add(pts[i], mul(out, 7 + reach(box, out))), out, perp(out))
    })
  }

  // The frame holds the shape, its lines and every label.
  const points: Vec[] = [...outline, ...extras.flatMap((e) => [e.a, e.b])]
  for (const l of labels) points.push([l.cx - l.box.w / 2, l.y - l.box.asc], [l.cx + l.box.w / 2, l.y + l.box.desc])
  const minX = Math.min(...points.map((p) => p[0])) - PAD
  const minY = Math.min(...points.map((p) => p[1])) - PAD
  const maxX = Math.max(...points.map((p) => p[0])) + PAD
  const maxY = Math.max(...points.map((p) => p[1])) + PAD

  return {
    frame: { x: r1(minX), y: r1(minY), w: r1(maxX - minX), h: r1(maxY - minY) },
    edges: edges.filter((e) => s.hidden || !e.hidden),
    arcs: arcs.filter((a) => s.hidden || !a.hidden),
    extras,
    squares,
    dots,
    labels,
  }
}

/** A corner's name when the teacher hasn't typed one: A, B, C … Z, then A₁ style doubles. */
const letter = (i: number) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : '')

/** A base as a flat polygon, counterclockwise from its front left corner, its front edge along the bottom. */
function basePolygon(base: Settings['base'], sides: number, v: Record<Part, number>): Vec[] {
  if (base === 'rectangle') return [[0, 0], [v.length, 0], [v.length, v.width], [0, v.width]]
  if (base === 'right') return [[0, 0], [v.triBase, 0], [0, v.triHeight]]
  if (base === 'isosceles') return [[0, 0], [v.triBase, 0], [v.triBase / 2, v.triHeight]]
  const R = v.side / (2 * Math.sin(Math.PI / sides))
  return Array.from({ length: sides }, (_, i) => {
    const a = -Math.PI / 2 - Math.PI / sides + (i * 2 * Math.PI) / sides
    return [R * Math.cos(a), R * Math.sin(a)] as Vec
  })
}

/** A face's normal (Newell's method), pointing whichever way its corners wind. */
function normal(ps: P3[]): P3 {
  const n: P3 = [0, 0, 0]
  ps.forEach((p, i) => {
    const q = ps[(i + 1) % ps.length]
    n[0] += (p[1] - q[1]) * (p[2] + q[2])
    n[1] += (p[2] - q[2]) * (p[0] + q[0])
    n[2] += (p[0] - q[0]) * (p[1] + q[1])
  })
  return n
}
