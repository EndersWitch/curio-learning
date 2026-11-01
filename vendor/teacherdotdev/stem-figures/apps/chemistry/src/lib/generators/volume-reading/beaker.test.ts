import { describe, expect, it } from 'vitest'
import { beakerLayout } from './beaker'
import { volumeScale } from './scale'

describe('beaker drawing', () => {
  const at = beakerLayout(volumeScale({ instrument: 'beaker', size: '100', beaker: 'medium' }))

  it('reads 0 at the bottom and leaves room above its top mark', () => {
    expect(at.yOf(0)).toBe(at.innerBottom)
    expect(at.yOf(250)).toBeGreaterThan(at.wallTop)
    expect(at.innerBottom).toBeLessThan(at.height)
  })

  it('looks at its marks, inside the glass', () => {
    expect(at.readX).toBeGreaterThan(at.left)
    expect(at.readX).toBeLessThan(at.cx)
  })
})
