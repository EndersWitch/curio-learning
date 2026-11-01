// The Parallelogram Generator's family: parallelograms and rhombi. It opens
// on a parallelogram with sides 10 and 6 and ∠A 60°, its opposite sides
// marked parallel with one and two arrows.

import { createFamily } from '$lib/shapes/quadrilateral/family.js'

export const family = createFamily({
  id: 'parallelogram',
  kinds: ['parallelogram', 'rhombus'],
  opens: 'parallelogram',
  opening: { ABArrows: 1, CDArrows: 1, BCArrows: 2, DAArrows: 2 },
})
