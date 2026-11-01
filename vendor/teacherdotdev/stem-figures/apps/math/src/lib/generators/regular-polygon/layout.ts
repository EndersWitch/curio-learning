// Lays out a regular polygon for ShapeFigure.svelte to draw: its corners
// around its center with side AB flat along the bottom, and what each part
// says and is marked with. The apothem runs from the center down to the
// middle of AB, and the radius out to B, so with both drawn they make the
// right triangle used to work out a polygon's area. Drawing and placing the
// marks and labels is the shared shape layout's job (see $lib/shapes/layout.ts).

import { layoutShape, sidesOf, type SpokeSpec, type Vec } from '$lib/shapes/layout.js'
import type { Polygon, Settings } from './settings.js'

/** A regular polygon laid out for ShapeFigure.svelte to draw. */
export type PolygonLayout = ReturnType<typeof buildPolygon>

/** The corners' ids: A, B, C… around from the bottom left. */
export const cornerIds = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i))

export function buildPolygon(s: Settings, polygon: Polygon) {
  const ids = cornerIds(polygon.n)
  const step = (2 * Math.PI) / polygon.n
  const start = -Math.PI / 2 - step / 2 // A, at the bottom left
  const at = (i: number): Vec => [polygon.radius * Math.cos(start + i * step), polygon.radius * Math.sin(start + i * step)]
  const sides = sidesOf(ids).map(([id]) => id)
  const typed = (by: Settings['sizeBy']) => (s.sizeBy === by ? s.size : '')

  const spokes: SpokeSpec[] = []
  if (s.apothem) spokes.push({ id: 'apothem', to: ['A', 'B'], style: s.apothemStyle, label: { mode: s.apothemLabel, text: s.apothemText, typed: typed('apothem') } })
  if (s.radius) spokes.push({ id: 'radius', to: 'B', style: s.radiusStyle, label: { mode: s.radiusLabel, text: s.radiusText, typed: typed('radius') } })
  if (s.radii) for (const v of ids) if (!(s.radius && v === 'B')) spokes.push({ id: `r${v}`, to: v, style: s.radiusStyle, label: null })

  return layoutShape({
    corners: ids.map((v, i) => ({ id: v, name: s.letters ? v : '', at: at(i) })),
    angles: Object.fromEntries(ids.map((v) => [v, polygon.interior])),
    sides: Object.fromEntries(sides.map((side) => [side, polygon.side])),
    sized: true,
    labels: {
      AB: { mode: s.sideLabel, text: s.sideText, given: s.sizeBy === 'side', typed: typed('side') },
      A: { mode: s.angleLabel, text: s.angleText, given: false, typed: '' },
    },
    arcs: Object.fromEntries(ids.map((v) => [v, s.angleArcs])),
    ticks: Object.fromEntries(sides.map((side) => [side, s.sideTicks])),
    center: { at: [0, 0], dot: s.dot, name: s.centerName },
    spokes,
    unit: s.unit,
    round: s.round,
    square: s.square,
    flip: false,
    rotate: s.rotate,
    moved: s.moved,
    labelSize: s.labelSize,
  })
}
