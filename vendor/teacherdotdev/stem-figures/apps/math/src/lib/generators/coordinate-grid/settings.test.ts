import { describe, expect, test } from 'vitest'
import { cleanSettings, readAxes, settingsFromParams, settingsToQuery, DEFAULT_SETTINGS } from './settings.js'

const params = (q: string) => settingsFromParams(new URLSearchParams(q))

describe('older links and presets', () => {
  test('a start and a number of blocks become From and To', () => {
    const s = params('xStart=-2&xBlocks=7&yStart=-1&yBlocks=14&yStep=0.5')
    expect([s.xFrom, s.xTo, s.xStep]).toEqual(['-2', '5', '1'])
    expect([s.yFrom, s.yTo, s.yStep]).toEqual(['-1', '6', '0.5'])
    expect((s as Record<string, unknown>).xBlocks).toBeUndefined()
  })

  test('only blocks, or only a start, use the old defaults for the rest', () => {
    expect(params('xBlocks=20').xTo).toBe('20')
    expect(params('xStart=5').xTo).toBe('20')
  })

  test('an old link comes back written the new way', () => {
    expect(settingsToQuery(params('xStart=-10&xBlocks=20'))).toBe('xFrom=-10&xTo=10')
  })

  test('a stored preset from before is upgraded', () => {
    const s = cleanSettings({ ...DEFAULT_SETTINGS, xFrom: undefined, xTo: undefined, xBlocks: 20, xStart: -10, xStep: 1 })
    expect([s.xFrom, s.xTo, s.xStep]).toEqual(['-10', '10', '1'])
  })

  test('new links are left alone', () => {
    expect(params('xFrom=0&xTo=2pi&xStep=pi%2F4').xTo).toBe('2pi')
  })
})

describe('readAxes', () => {
  test('reads math', () => {
    const { x } = readAxes(cleanSettings({ ...DEFAULT_SETTINGS, xFrom: '0', xTo: '2pi', xStep: 'pi/4' }))
    expect(x.blocks).toBe(8)
    expect(x.step).toBeCloseTo(Math.PI / 4)
    expect(x.numbering).toBe('pi')
  })

  test('a range that the step does not land on runs on, and says so', () => {
    const r = readAxes(cleanSettings({ ...DEFAULT_SETTINGS, xFrom: '-2', xTo: '5', xStep: '2' }))
    expect(r.x.blocks).toBe(4)
    expect(r.problems.xTo).toMatch(/runs on to 6/)
  })

  test('an unusable range falls back and explains', () => {
    const r = readAxes(cleanSettings({ ...DEFAULT_SETTINGS, yFrom: '5', yTo: '1' }))
    expect(r.y).toEqual({ start: 0, step: 1, blocks: 15, numbering: 'decimal' })
    expect(r.problems.yTo).toMatch(/end after it starts/)
  })
})
