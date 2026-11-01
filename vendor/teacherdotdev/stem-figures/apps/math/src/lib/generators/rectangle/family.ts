// The Rectangle Generator's family: rectangles and squares. It opens on a
// 10 by 6 rectangle with both lengths labeled. It has no heights: every
// height to AB would be one of its sides.

import { createFamily } from '$lib/shapes/quadrilateral/family.js'

export const family = createFamily({ id: 'rectangle', kinds: ['rectangle', 'square'], opens: 'rectangle', opening: {}, heights: false })
