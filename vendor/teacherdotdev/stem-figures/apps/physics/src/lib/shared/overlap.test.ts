import { describe, expect, test } from 'vitest'
import { boxAround, boxesMeet, polygonHits, segmentHits } from './overlap'

const box = boxAround({ x: 0, y: 0 }, 10, 5)

describe('overlap', () => {
  test('a segment crossing the box, inside it, or missing it', () => {
    expect(segmentHits(box, { x1: -20, y1: 0, x2: 20, y2: 0 })).toBe(true)
    expect(segmentHits(box, { x1: -2, y1: 1, x2: 2, y2: -1 })).toBe(true)
    expect(segmentHits(box, { x1: -20, y1: 8, x2: 20, y2: 8 })).toBe(false)
    expect(segmentHits(box, { x1: 12, y1: -20, x2: 30, y2: 20 })).toBe(false)
  })

  test('a tilted square meeting the box, around it, or apart from it', () => {
    const diamond = (cx: number, r: number) => [
      { x: cx, y: -r },
      { x: cx + r, y: 0 },
      { x: cx, y: r },
      { x: cx - r, y: 0 },
    ]
    expect(polygonHits(box, diamond(15, 8))).toBe(true)
    expect(polygonHits(box, diamond(0, 100))).toBe(true)
    expect(polygonHits(box, diamond(40, 8))).toBe(false)
  })

  test('boxes', () => {
    expect(boxesMeet(box, boxAround({ x: 15, y: 0 }, 6, 6))).toBe(true)
    expect(boxesMeet(box, boxAround({ x: 30, y: 0 }, 6, 6))).toBe(false)
  })
})
