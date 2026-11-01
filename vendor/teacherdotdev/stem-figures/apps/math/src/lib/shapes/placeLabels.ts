// Putting a figure's labels down one at a time without overlapping, for
// figures laid out outside layout.ts (3D shapes). A label the teacher drags
// keeps its offset in its part's own directions (along and across an edge,
// say), so it follows the part when the figure is reshaped.

import type { MathBox } from '$lib/shared/mathSvg.js'
import type { PlacedLabel } from './layout.js'
import { readMoved } from './parts.js'
import { add, mul, type Vec } from './vec.js'

/** The labels placed so far, and how to place the next. `moved` is the setting. */
export function labelPlacer(moved: string) {
  const offsets = readMoved(moved)
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
    const o = offsets[part] ?? [0, 0]
    const [cx, cy] = add(center, add(mul(along, o[0]), mul(across, o[1])))
    labels.push({ part, box, cx, cy, x: cx - box.w / 2, y: cy + (box.asc - box.desc) / 2, along, across, offset: o })
  }
  return { labels, overlaps, place }
}
