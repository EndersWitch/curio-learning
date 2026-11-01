import { describe, expect, it } from 'vitest'
import { answerLines, bandText, layoutGel, sizeText, spread } from './figure'
import { LADDERS, LADDER_IDS, ladderBands } from './ladders'
import { parseBands, tidyLanes, type Lane } from './lanes'
import { GELS, drawBands, inRange, runOf, thicknessOf } from './migration'
import { SCENARIOS } from './scenarios'
import { gelSettings, type GelSettings } from './settings'

const sample = (id: number, bands: string, label = ''): Lane => ({ type: 'sample', id, label, bands })
const withLanes = (lanes: Lane[], more: Partial<GelSettings> = {}): GelSettings => ({ ...gelSettings.defaults, lanes, ...more })
const middles = (s: GelSettings, lane: number) => layoutGel(s).lanes[lane].bands.map((b) => (b.top + b.bottom) / 2)

describe('how far a band runs', () => {
  it('sends larger fragments a shorter way on every gel, inside its range or out', () => {
    const sizes = [10, 50, 100, 150, 200, 300, 450, 500, 517, 800, 1000, 2000, 3000, 5000, 9416, 10000, 23130, 50000]
    for (const gel of GELS) {
      const runs = sizes.map((bp) => runOf(bp, gel))
      for (let i = 1; i < runs.length; i++) expect(runs[i], `${sizes[i]} bp on ${gel}%`).toBeLessThan(runs[i - 1])
      for (const r of runs) expect(r).toBeGreaterThanOrEqual(0)
      for (const r of runs) expect(r).toBeLessThanOrEqual(1)
    }
  })

  it('is a straight line in log size across the gel’s range', () => {
    // 500 → 1000 → 2000 bp are equal steps in log size, so equal steps down a 1% gel.
    const [a, b, c] = [2000, 1000, 500].map((bp) => runOf(bp, '1'))
    expect(b - a).toBeCloseTo(c - b, 10)
  })

  it('crowds sizes outside the range together', () => {
    // 20,000 and 40,000 bp are a doubling apart, as 2,000 and 4,000 are, but sit much closer.
    expect(runOf(20000, '1') - runOf(40000, '1')).toBeLessThan((runOf(2000, '1') - runOf(4000, '1')) / 3)
    expect(inRange(450, '2')).toBe(true)
    expect(inRange(23130, '1')).toBe(false)
  })

  it('spreads small fragments farther apart on a stronger gel', () => {
    const gap = (gel: (typeof GELS)[number]) => runOf(200, gel) - runOf(300, gel)
    expect(gap('2')).toBeGreaterThan(gap('1'))
    expect(gap('1.5')).toBeGreaterThan(gap('0.8'))
  })

  it('puts equal sizes at equal heights in every lane', () => {
    const s = withLanes([
      { type: 'ladder', id: 1, label: 'Ladder', ladder: '1kb' },
      sample(2, '5000, 3000, 1000'),
      sample(3, '3000'),
      sample(4, '6000, 3000, 700'),
    ])
    const at = (lane: number) => middles(s, lane)
    expect(at(1)).toContain(at(2)[0])
    expect(at(3)[1]).toBe(at(2)[0])
    expect(at(0)).toContain(at(2)[0])
  })

  it('draws larger fragments higher in a lane', () => {
    for (const gel of GELS) {
      const s = withLanes([sample(1, '9000, 4000, 1500, 700, 350, 150'), sample(2, '')], { gel })
      const ys = middles(s, 0)
      for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1])
    }
  })
})

describe('bands running together', () => {
  const y = (bp: number) => 1000 - 100 * Math.log10(bp)

  it('merges sizes too close to leave a gap into one thicker band', () => {
    const drawn = drawBands([{ bp: 500, amount: 1 }, { bp: 517, amount: 1 }, { bp: 300, amount: 1 }], y)
    expect(drawn.map((b) => b.sizes)).toEqual([[517, 500], [300]])
    expect(drawn[0].bottom - drawn[0].top).toBeGreaterThan(thicknessOf(1))
    expect(drawn[0].amount).toBe(2)
  })

  it('keeps sizes apart when there is room between them', () => {
    expect(drawBands([{ bp: 1000, amount: 1 }, { bp: 800, amount: 1 }], y)).toHaveLength(2)
  })

  it('runs the 100 bp ladder’s 500 and 517 together, as on a real gel', () => {
    const s = withLanes([{ type: 'ladder', id: 1, label: '', ladder: '100bp' }, sample(2, '')], { gel: '2' })
    const sizes = layoutGel(s).lanes[0].bands.map((b) => b.sizes)
    expect(sizes).toContainEqual([517, 500])
    expect(sizes).toHaveLength(12)
  })
})

describe('the ladders', () => {
  it('lists every ladder’s bands from largest to smallest', () => {
    for (const id of LADDER_IDS) {
      const sizes = LADDERS[id].bands.map(([bp]) => bp)
      expect([...sizes].sort((a, b) => b - a), id).toEqual(sizes)
    }
  })

  it('has λ/HindIII’s fragments adding up to the 48,502 bp genome', () => {
    expect(LADDERS.lambda.bands.reduce((sum, [bp]) => sum + bp, 0)).toBe(48502)
  })

  it('makes reference bands darker', () => {
    const kb = ladderBands('1kb')
    const three = kb.find((b) => b.bp === 3000)!
    for (const b of kb) if (b !== three) expect(three.amount).toBeGreaterThan(b.amount)
  })
})

describe('typed bands', () => {
  it('reads sizes in bp or kb, with commas or spaces between', () => {
    expect(parseBands('1200, 450, 300').bands.map((b) => b.bp)).toEqual([1200, 450, 300])
    expect(parseBands('300 1.5 kb 450bp').bands.map((b) => b.bp)).toEqual([1500, 450, 300])
  })

  it('reads 1,200 as one size, but 100,200 as two', () => {
    expect(parseBands('1,200, 450').bands.map((b) => b.bp)).toEqual([1200, 450])
    expect(parseBands('23,130').bands.map((b) => b.bp)).toEqual([23130])
    expect(parseBands('100,200').bands.map((b) => b.bp)).toEqual([200, 100])
  })

  it('reads how much DNA a band has', () => {
    expect(parseBands('450 x2, 300x0.5, 200 × 3').bands).toEqual([
      { bp: 450, amount: 2 },
      { bp: 300, amount: 0.5 },
      { bp: 200, amount: 3 },
    ])
  })

  it('makes one darker band of a size typed twice', () => {
    expect(parseBands('450, 450').bands).toEqual([{ bp: 450, amount: 2 }])
  })

  it('leaves out what isn’t a band', () => {
    expect(parseBands('450, abc, 5, 99999, 300 x50')).toEqual({ bands: [{ bp: 450, amount: 1 }], bad: ['abc', '5', '99999', '300x50'] })
  })
})

describe('the lanes setting', () => {
  it('keeps 2 to 12 usable lanes', () => {
    expect(tidyLanes([sample(1, '450')])).toBeUndefined()
    expect(tidyLanes(Array.from({ length: 15 }, (_, i) => sample(i + 1, '450')))).toHaveLength(12)
    expect(tidyLanes([sample(1, '450'), { type: 'gel' }, { type: 'ladder', id: 2, ladder: 'nope' }])).toEqual([
      sample(1, '450'),
      { type: 'ladder', id: 2, label: '', ladder: '1kb' },
    ])
  })

  it('gives repeated or missing ids new ones', () => {
    const ids = tidyLanes([sample(1, ''), sample(1, ''), { type: 'sample', bands: '' }])!.map((l) => l.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('round-trips through the page address', () => {
    const s = withLanes([sample(1, '450 x2', 'Child'), { type: 'ladder', id: 2, label: 'M', ladder: 'lambda' }], { gel: '0.8', ruler: true })
    const back = gelSettings.fromParams(new URLSearchParams(gelSettings.toQuery(s)))
    expect(gelSettings.keyOf(back)).toBe(gelSettings.keyOf(s))
  })

  it('never lets an edit change the defaults', () => {
    const s = gelSettings.tidy(gelSettings.defaults)
    s.lanes[0].label = 'changed'
    expect(gelSettings.defaults.lanes[0].label).toBe('Ladder')
    expect(SCENARIOS[0].lanes[0].label).toBe('Ladder')
  })
})

describe('the scenarios', () => {
  const sizes = (lane: Lane) => parseBands(lane.type === 'sample' ? lane.bands : '').bands.map((b) => b.bp)
  const named = (id: string, label: string) => SCENARIOS.find((x) => x.id === id)!.lanes.find((l) => l.label === label)!

  it('has the crime scene matching Suspect 2 only', () => {
    const scene = sizes(named('crime-scene', 'Crime scene'))
    expect(sizes(named('crime-scene', 'Suspect 2'))).toEqual(scene)
    expect(sizes(named('crime-scene', 'Suspect 1'))).not.toEqual(scene)
    expect(sizes(named('crime-scene', 'Suspect 3'))).not.toEqual(scene)
  })

  it('gives the child each band from the mother or Father 2, and none only Father 1 has', () => {
    const mother = sizes(named('paternity', 'Mother'))
    const father = sizes(named('paternity', 'Father 2'))
    const other = sizes(named('paternity', 'Father 1'))
    for (const bp of sizes(named('paternity', 'Child'))) {
      expect(mother.includes(bp) || father.includes(bp), `${bp}`).toBe(true)
      if (!mother.includes(bp)) expect(other).not.toContain(bp)
    }
  })

  it('cuts the plasmid into pieces adding up to its whole length', () => {
    for (const lane of SCENARIOS.find((x) => x.id === 'digest')!.lanes.filter((l) => l.type === 'sample'))
      expect(sizes(lane).reduce((a, b) => a + b, 0), lane.label).toBe(5000)
  })

  it('keeps every scenario’s bands apart on its own gel', () => {
    for (const x of SCENARIOS)
      for (const lane of layoutGel(withLanes(x.lanes, { gel: x.gel })).lanes.filter((l) => l.lane.type === 'sample'))
        expect(lane.merged, `${x.id} ${lane.lane.label}`).toEqual([])
  })
})

describe('labels', () => {
  it('writes sizes in bp or kb', () => {
    expect(sizeText(500, 'bp')).toBe('500 bp')
    expect(sizeText(1500, 'bp')).toBe('1500 bp')
    expect(sizeText(23130, 'bp')).toBe('23,130 bp')
    expect(sizeText(1500, 'kb')).toBe('1.5 kb')
    expect(sizeText(564, 'kb')).toBe('0.564 kb')
    expect(sizeText(23130, 'kb')).toBe('23.1 kb')
    expect(bandText([517, 500], 'bp')).toBe('500/517 bp')
    expect(bandText([2027, 2322, 4361], 'bp')).toBe('2027–4361 bp')
  })

  it('moves crowded labels apart, in order and as little as it can', () => {
    expect(spread([10, 50, 90], 15, 0, 100)).toEqual([10, 50, 90])
    expect(spread([50, 52], 10, 0, 100)).toEqual([46, 56])
    expect(spread([5, 0], 10, 0, 100)).toEqual([10, 0])
    // Pushed off the bottom, a run of labels moves up to fit.
    expect(spread([95, 98, 100], 10, 0, 100)).toEqual([80, 90, 100])
  })

  it('never lets ladder sizes overlap', () => {
    for (const ladder of LADDER_IDS)
      for (const gel of GELS) {
        const s = withLanes([{ type: 'ladder', id: 1, label: '', ladder }, sample(2, '')], { gel })
        const ys = layoutGel(s).sizes[0].labels.map((l) => l.y)
        for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1], `${ladder} on ${gel}%`).toBeGreaterThanOrEqual(15 - 1e-9)
      }
  })

  it('writes the ladder’s sizes beside the first or last lane only', () => {
    const ladder: Lane = { type: 'ladder', id: 9, label: '', ladder: '1kb' }
    expect(layoutGel(withLanes([sample(1, ''), ladder, sample(2, '')])).sizes).toEqual([])
    expect(layoutGel(withLanes([sample(1, ''), ladder])).sizes.map((x) => x.side)).toEqual(['right'])
  })

  it('turns lane labels too wide for their lane', () => {
    expect(layoutGel(withLanes([sample(1, '', 'A'), sample(2, '', 'B')])).laneLabels.turned).toBe(false)
    expect(layoutGel(withLanes([sample(1, '', 'Crime scene'), sample(2, '', 'B')])).laneLabels.turned).toBe(true)
  })
})

describe('the answer key', () => {
  it('lists each sample lane’s sizes', () => {
    const s = withLanes([
      { type: 'ladder', id: 1, label: 'Ladder', ladder: '1kb' },
      sample(2, '1200, 450', 'Child'),
      sample(3, ''),
    ])
    expect(answerLines(s)).toEqual(['Child: 1200, 450 bp'])
    expect(answerLines({ ...s, laneLabels: 'blank', sizeLabels: 'blank' })[0]).toBe(
      'Lane 1: 10000, 8000, 6000, 5000, 4000, 3000, 2000, 1500, 1000, 500 bp',
    )
  })
})
