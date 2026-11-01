// Lays out a worked-out quadrilateral for ShapeFigure.svelte to draw: where
// its corners go, and what each part says and is marked with. Drawing and
// placing the marks and labels is the shared shape layout's job (see
// $lib/shapes/layout.ts).

import { layoutShape, type LabelSpec, type Vec } from '$lib/shapes/layout.js'
import { CORNERS, SIDES, kindOf, type Corner, type Measure, type Side } from './kinds.js'
import { DIAGONALS, HEIGHTS, type Settings, type Shape } from './settings.js'

/** A quadrilateral laid out for ShapeFigure.svelte to draw. */
export type QuadrilateralLayout = ReturnType<typeof buildQuadrilateral>

/** The corners turned so the chosen side runs along the bottom, left to right, with the rest above it. */
function onBase(corners: Record<Corner, Vec>, base: Settings['base']): Record<Corner, Vec> {
  if (!base) return corners
  const [p, q] = [corners[base[0] as Corner], corners[base[1] as Corner]]
  const turn = -Math.atan2(q[1] - p[1], q[0] - p[0])
  const [c, s] = [Math.cos(turn), Math.sin(turn)]
  return Object.fromEntries(
    CORNERS.map((v) => {
      const [x, y] = [corners[v][0] - p[0], corners[v][1] - p[1]]
      return [v, [x * c - y * s, x * s + y * c]]
    }),
  ) as Record<Corner, Vec>
}

/**
 * @param s     clean settings
 * @param shape the worked-out quadrilateral
 * @param given the measures as typed numbers, null where solved
 */
export function buildQuadrilateral(s: Settings, shape: Shape, given: Record<Measure, number | null>) {
  const kind = kindOf(s.kind)
  const at = onBase(shape.corners, s.base)
  // A side the kind makes equal to a given one is written the way that one was typed.
  const typedFor = (m: Measure) => (given[m] != null ? s[m] : '')
  const label = (k: Corner | Side): LabelSpec => {
    const same = kind.equal?.[k as Side]
    return { mode: s[`${k}Label`], text: s[`${k}Text`], given: kind.givens.includes(k), typed: typedFor(same ?? k) }
  }

  return layoutShape({
    corners: CORNERS.map((v) => ({ id: v, name: s[`name${v}`], at: at[v] })),
    angles: shape.angles,
    sides: shape.sides,
    sized: true,
    labels: Object.fromEntries([...CORNERS, ...SIDES].map((k) => [k, label(k)])),
    arcs: Object.fromEntries(CORNERS.map((v) => [v, s[`${v}Arcs`]])),
    ticks: Object.fromEntries(SIDES.map((side) => [side, s[`${side}Ticks`]])),
    arrows: Object.fromEntries(SIDES.map((side) => [side, s[`${side}Arrows`]])),
    heights: HEIGHTS.filter((h) => s[h]).map((h) => ({
      id: h,
      from: h[1],
      onto: ['A', 'B'] as [Corner, Corner],
      style: s[`${h}Style`],
      // Either height of a trapezoid is its given height, written as typed.
      label: { mode: s[`${h}Label`], text: s[`${h}Text`], typed: typedFor('h') },
      foot: s[`${h}Foot`],
    })),
    diagonals: DIAGONALS.filter((d) => s[d]).map((d) => ({
      id: d,
      ends: [d[1], d[2]] as [Corner, Corner],
      style: s[`${d}Style`],
      label: { mode: s[`${d}Label`], text: s[`${d}Text`] },
    })),
    cross: s.cross,
    unit: s.unit,
    round: s.round,
    square: s.square,
    flip: s.flip,
    rotate: s.rotate,
    moved: s.moved,
    labelSize: s.labelSize,
  })
}
