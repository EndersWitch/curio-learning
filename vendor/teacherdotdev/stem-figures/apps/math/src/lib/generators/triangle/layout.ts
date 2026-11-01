// Lays out a solved triangle for ShapeFigure.svelte to draw: where its corners
// go, and what each part says and is marked with. Drawing and placing the
// marks and labels is the shared shape layout's job (see $lib/shapes/layout.ts).

import { layoutShape, type HeightSpec, type LabelSpec, type Vec } from '$lib/shapes/layout.js'
import { ANGLES, OPPOSITE, SIDES, sideOf, type Part, type Solved, type Vertex } from './solve.js'
import { HEIGHTS, type Settings } from './settings.js'

const RAD = Math.PI / 180

/** A triangle laid out for ShapeFigure.svelte to draw. */
export type TriangleLayout = ReturnType<typeof buildTriangle>

/**
 * @param s        clean settings
 * @param triangle a solved triangle: { angles, sides, sized }
 * @param given    the measures as typed numbers, null where solved
 */
export function buildTriangle(s: Settings, triangle: Pick<Solved, 'angles' | 'sides' | 'sized'>, given: Record<Part, number | null>) {
  const { angles, sides, sized } = triangle

  // Corners with the base side flat along the bottom and the third corner above it.
  const [P, Q] = [s.base[0] as Vertex, s.base[1] as Vertex]
  const R = ANGLES.find((v) => v !== P && v !== Q)!
  const pr = sides[sideOf(P, R)]
  const at = { [P]: [0, 0], [Q]: [sides[s.base], 0], [R]: [pr * Math.cos(angles[P] * RAD), pr * Math.sin(angles[P] * RAD)] } as Record<Vertex, Vec>

  const label = (k: Part): LabelSpec => ({ mode: s[`${k}Label`], text: s[`${k}Text`], given: given[k] != null, typed: given[k] != null ? s[k] : '' })
  const heights: HeightSpec[] = HEIGHTS.filter((h) => s[h]).map((h) => {
    const v = h[1] as Vertex
    return {
      id: h,
      from: v,
      onto: OPPOSITE[v].split('') as [Vertex, Vertex],
      style: s[`${h}Style`],
      label: { mode: s[`${h}Label`], text: s[`${h}Text`] },
      foot: s[`${h}Foot`],
    }
  })

  return layoutShape({
    corners: ANGLES.map((v) => ({ id: v, name: s[`name${v}`], at: at[v] })),
    angles,
    sides,
    sized,
    labels: Object.fromEntries([...ANGLES, ...SIDES].map((k) => [k, label(k)])),
    arcs: Object.fromEntries(ANGLES.map((v) => [v, s[`${v}Arcs`]])),
    ticks: Object.fromEntries(SIDES.map((side) => [side, s[`${side}Ticks`]])),
    heights,
    unit: s.unit,
    round: s.round,
    square: s.square,
    flip: s.flip,
    rotate: s.rotate,
    moved: s.moved,
    labelSize: s.labelSize,
  })
}
