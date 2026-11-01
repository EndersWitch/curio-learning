import { describe, expect, it } from 'vitest'
import { overlaps } from './place'
import { buildPredatorPrey, fitHeights, fitSpan, niceCeil, rangesOf, timeText } from './figure'
import { predatorPreySettings } from './settings'

const build = (query: string) => buildPredatorPrey(predatorPreySettings.fromParams(new URLSearchParams(query)))
const boxOf = (n: ReturnType<typeof build>['keyEntries'][number]) => ({ x: n.sample.x1, y: n.sample.y1 - 8, w: n.text.x - n.sample.x1 + n.text.text.length * 8, h: 16 })

describe('fitting the axes', () => {
  it('counts by nice steps', () => {
    expect([0.7, 1, 1.2, 2.2, 3, 7, 12, 260].map(niceCeil)).toEqual([1, 1, 2, 2.5, 5, 10, 20, 500])
  })

  it('ends the time axis on the time shown, in about 20 blocks', () => {
    expect(fitSpan(40)).toEqual({ step: 2, blocks: 20 })
    expect(fitSpan(90)).toEqual({ step: 5, blocks: 18 })
    expect(fitSpan(16)).toEqual({ step: 1, blocks: 16 })
    expect(fitSpan(120)).toEqual({ step: 5, blocks: 24 })
  })

  it('gives each population room above its peak, with one number of blocks for both', () => {
    const { blocks, steps } = fitHeights([111, 45], 0.5)
    for (const [k, high] of [111, 45].entries()) {
      expect(blocks * steps[k]).toBeGreaterThanOrEqual(high + 0.5 * steps[k])
      expect(blocks * steps[k]).toBeLessThan(high * 1.6)
    }
  })

  it('fits each axis on its own', () => {
    const typed = (query: string) => {
      const s = predatorPreySettings.fromParams(new URLSearchParams(query))
      return rangesOf(s, buildPredatorPrey(s).fitted)
    }
    const fitted = typed('')
    expect(typed('xFit=0&xTo=7&xStep=1')).toEqual({ ...fitted, xFrom: '0', xTo: '7', xStep: '1' })
    expect(typed('yFit=0&yTo=7&yStep=1')).toMatchObject({ xTo: fitted.xTo, xStep: fitted.xStep, yTo: '7', yStep: '1' })
  })
})

describe('a predator–prey graph', () => {
  it('draws the hares and lynx, named in a key under the graph', () => {
    const g = build('')
    expect(g.series.map((s) => s.key)).toEqual(['prey', 'predators'])
    expect(g.series.every((s) => s.lines.length > 0)).toBe(true)
    expect(g.keyEntries.map((n) => n.text.text)).toEqual(['Hares', 'Lynx'])
    const title = g.labels.find((l) => l.kind === 'side' && !l.rotate)!
    for (const n of g.keyEntries) {
      expect(n.sample.y1).toBeGreaterThan(title.y)
      expect(n.text.y).toBeLessThan(g.height)
      expect(n.sample.x1).toBeGreaterThanOrEqual(g.grid.x)
      expect(n.text.x).toBeLessThan(g.grid.x + g.grid.w)
    }
    expect(g.height).toBeGreaterThan(g.grid.y + g.grid.h)
    expect(overlaps(boxOf(g.keyEntries[0]), boxOf(g.keyEntries[1]))).toBe(false)
    expect(g.right).toBeNull()
  })

  it('keeps every line inside the grid', () => {
    const g = build('yFit=0&yTo=60&yStep=10')
    const ys = g.series.flatMap((s) => s.lines).join(' ').match(/,-?[\d.]+/g)!.map((t) => Number(t.slice(1)))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(g.grid.y - 0.01)
    expect(Math.max(...ys)).toBeLessThanOrEqual(g.grid.y + g.grid.h + 0.01)
  })

  it('puts the predators on a right-hand axis of their own, in room added for it', () => {
    const one = build('')
    const two = build('scale=two')
    expect(two.right?.numbers.length).toBeGreaterThan(3)
    expect(two.right?.title?.text).toBe('Lynx (thousands)')
    expect(two.width).toBeGreaterThan(one.width)
  })

  it('marks the lag and period with their lengths, or blanks for students', () => {
    const g = build('lag=1&cycle=1&peaks=1')
    expect(g.spans.map((s) => s.label.text)).toEqual(['Lag: 1.6 years', 'Period: 10 years'])
    expect(g.peaks.length).toBe(8)
    const [lag, period] = g.spans
    expect(lag.arrow.x2).toBeGreaterThan(lag.arrow.x1)
    expect(overlaps(
      { x: lag.label.x, y: lag.label.y - 14, w: 110, h: 16 },
      { x: period.label.x, y: period.label.y - 14, w: 130, h: 16 },
    )).toBe(false)
    const blank = build('lag=1&cycle=1&markLabels=blank')
    expect(blank.spans.map((s) => s.label.text)).toEqual(['Lag:', 'Period:'])
    expect(blank.spans.every((s) => s.blank)).toBe(true)
    expect(build('lag=1&markLabels=name').spans[0].label.text).toBe('Lag')
  })

  it('leaves out the lag when a population isn’t drawn, and every line for blank axes', () => {
    expect(build('lag=1&show=prey').spans).toEqual([])
    const blank = build('show=neither&lag=1&cycle=1')
    expect(blank.series).toEqual([])
    expect(blank.keyEntries).toEqual([])
    expect(blank.spans).toEqual([])
  })

  it('draws census counts, and measures the lag and period between them', () => {
    const g = build('data=census&noise=0&lag=1&cycle=1')
    expect(g.census).toBe(true)
    expect(g.series[0].counts).toHaveLength(41)
    expect(g.spans.map((s) => s.label.text)).toEqual(['Lag: 1 year', 'Period: 10 years'])
    expect(build('data=census&connect=0').series[0].lines).toEqual([])
  })

  it('thins a census taken too often to draw', () => {
    const g = build('data=census&every=0.01')
    expect(g.problems.every).toContain('every 0.1 years')
    expect(g.series[0].counts.length).toBeLessThanOrEqual(401)
  })

  it('draws the phase plane as a loop going round counterclockwise', () => {
    const g = build('view=phase')
    expect(g.series).toEqual([])
    expect(g.loop?.lines).toHaveLength(1)
    // Along the bottom (few predators) the prey grow, so the arrow there points right.
    const bottom = g.loop!.arrows.reduce((a, b) => (b.tip.y > a.tip.y ? b : a))
    expect(Math.abs(bottom.angle)).toBeLessThan(45)
    const topArrow = g.loop!.arrows.reduce((a, b) => (b.tip.y < a.tip.y ? b : a))
    expect(Math.abs(topArrow.angle)).toBeGreaterThan(135)
    expect(g.labels.map((l) => l.text)).toEqual(['Hares (thousands)', 'Lynx (thousands)'])
  })

  it('reads out the cycle for the settings panel', () => {
    const r = build('').readout
    expect(r.period).toBeCloseTo(10, 3)
    expect(r.lag).toBeCloseTo(1.6, 1)
    expect(r.balance.prey).toBeCloseTo(50, 6)
    expect(r.prey.low).toBeLessThan(20)
    expect(r.still).toBe(false)
    expect(build('prey=50&predators=20').readout.still).toBe(true)
  })

  it('writes lengths of time in their units', () => {
    expect(timeText(1, 'years')).toBe('1 year')
    expect(timeText(1.63, 'years')).toBe('1.6 years')
    expect(timeText(5.4, 'days')).toBe('5.4 days')
    expect(timeText(123.4, 'weeks')).toBe('123 weeks')
  })
})
