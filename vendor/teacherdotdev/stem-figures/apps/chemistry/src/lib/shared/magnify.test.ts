import { describe, expect, it } from 'vitest'
import { magnifierAboveLayout, magnifierLayout } from './magnify'

describe('magnifier layout', () => {
  it('puts a drawing at the top left with the magnifier to its right', () => {
    const layout = magnifierLayout('both', 100, 500, { x: 50, y: 250, r: 40 })
    expect(layout.origin).toEqual({ x: 0, y: 0 })
    expect(layout.width).toBe(100 + 56 + 300)
    expect(layout.height).toBe(500)
  })

  it('makes room for the outlined region where it hangs past the drawing', () => {
    // a thermometer 72 wide, its region 60 in radius near the top
    const layout = magnifierLayout('both', 72, 600, { x: 38, y: 40, r: 60 })
    expect(layout.origin).toEqual({ x: 22, y: 20 })
    expect(layout.width).toBe(22 + 72 + 56 + 300)
    expect(layout.height).toBe(620)
    expect(layout.origin!.x + 38 - 60).toBe(0)
    expect(layout.origin!.y + 40 - 60).toBe(0)
  })
})

describe('magnifier above a drawing', () => {
  it('puts the magnifier over the region, with the drawing below it', () => {
    const layout = magnifierAboveLayout('both', 800, 100, { x: 400, y: 50, r: 40 })
    expect(layout.magnifier).toEqual({ x: 400, y: 150, r: 150 })
    expect(layout.origin).toEqual({ x: 0, y: 300 + 56 })
    expect(layout.width).toBe(800)
    expect(layout.height).toBe(356 + 100)
  })

  it('keeps the magnifier inside the figure near the drawing’s ends', () => {
    const layout = magnifierAboveLayout('both', 800, 100, { x: 30, y: 50, r: 40 })
    expect(layout.origin!.x).toBe(10)
    expect(layout.magnifier!.x).toBe(150)
  })

  it('leaves the other views as they are beside a drawing', () => {
    const source = { x: 400, y: 50, r: 40 }
    expect(magnifierAboveLayout('whole', 800, 100, source)).toEqual(magnifierLayout('whole', 800, 100, source))
    expect(magnifierAboveLayout('magnifier', 800, 100, source)).toEqual(magnifierLayout('magnifier', 800, 100, source))
  })
})
