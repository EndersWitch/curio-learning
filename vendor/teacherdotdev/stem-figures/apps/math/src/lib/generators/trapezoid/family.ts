// The Trapezoid Generator's family: trapezoids, isosceles trapezoids and
// right trapezoids. It opens on a right trapezoid: bases 12 and 7, leg DA 5,
// the slanted leg labeled x, and parallel arrows on the bases.

import { createFamily } from '$lib/shapes/quadrilateral/family.js'

export const family = createFamily({
  id: 'trapezoid',
  kinds: ['trapezoid', 'isosceles-trapezoid', 'right-trapezoid'],
  opens: 'right-trapezoid',
  opening: { BCLabel: 'text', BCText: 'x', ABArrows: 1, CDArrows: 1 },
})
