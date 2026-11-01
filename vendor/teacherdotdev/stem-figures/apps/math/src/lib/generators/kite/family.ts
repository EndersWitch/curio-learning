// The Kite Generator's family: just kites. It opens on a kite with short
// sides 5, long sides 9 and ∠B 100°, each pair of equal sides marked.

import { createFamily } from '$lib/shapes/quadrilateral/family.js'

export const family = createFamily({
  id: 'kite',
  kinds: ['kite'],
  opens: 'kite',
  opening: { ABTicks: 1, BCTicks: 1, CDTicks: 2, DATicks: 2 },
})
