import { describe, expect, test } from 'vitest'
import { buildLines, readLines } from './layout.js'
import {
  DEFAULT_SETTINGS, angleKey, cleanSettings, freePos, freshName, nextId, readAngle, setAngleKey, settingsFromParams, settingsToQuery,
} from './settings.js'

const params = (q: string) => settingsFromParams(new URLSearchParams(q))
const T2 = 't=t1|name=t|angle=65|pos=0&t=t2|name=s|angle=120|pos=1.5'

describe('the page address', () => {
  test('the opening figure has a bare address', () => {
    expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe('')
  })

  test('a link comes back the same', () => {
    const q = new URLSearchParams([
      ['turn', '20'],
      ['p', 'p1|name=l|arrows=2'],
      ['p', 'p3|name=k|startCap=none|endCap=circle|style=dashed'],
      ['t', 't1|name=t|angle=50|pos=0'],
      ['t', 't4|name=s|angle=3x|pos=-1.25'],
      ['a', 'p1+~t1+|label=measure|shade=1'],
      ['a', 'p3-~t4-|label=text|text=3x%2B5|mark=2'],
      ['pt', 'p1.t1|name=B'],
      ['pt', 'p1:start|name=A'],
      ['pt', 't4:end'],
    ]).toString()
    expect(settingsToQuery(params(q))).toBe(q)
  })

  test('angles start unlabeled, and an unlabeled angle isn’t written', () => {
    expect(settingsToQuery(params('a=p1%2B~t1%2B|label=none'))).toBe('')
  })

  test('what belongs to a line that isn’t there is dropped', () => {
    const s = params('a=p1%2B~t9%2B|label=measure&pt=p1.t9|name=A&a=nonsense|label=measure')
    expect([s.angles, s.points]).toEqual([{}, {}])
  })

  test('there is always a parallel line, and at most six of each', () => {
    expect(params('t=t1|name=t|angle=65|pos=0').parallels).toHaveLength(1)
    const many = Array.from({ length: 9 }, (_, i) => `t=t${i + 1}|angle=60|pos=${i}`).join('&')
    expect(params(`p=p1&${many}`).transversals).toHaveLength(6)
  })

  test('repeated or missing ids get fresh ones', () => {
    expect(params('p=p1&p=p1&p=x&t=t1|angle=60|pos=0').parallels.map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  test('names can’t hold the address’s own separators', () => {
    expect(cleanSettings({ parallels: [{ id: 'p1', name: 'a|b=c' }] }).parallels[0].name).toBe('abc')
  })
})

describe('helpers', () => {
  test('an angle is named by its two rays, in either order', () => {
    expect(angleKey('t1+', 'p1+')).toBe('p1+~t1+')
    expect(setAngleKey(DEFAULT_SETTINGS, DEFAULT_SETTINGS.transversals[0])).toBe('p1+~t1+')
  })

  test('new lines get the next id and an unused name, and transversals are placed apart', () => {
    const s = params(T2)
    expect([nextId(s.transversals, 't'), freshName(s.transversals, 't'), freshName(s.parallels, 'p'), freePos(s.transversals)]).toEqual(['t3', 'u', 'n', 3])
  })

  test('angles that can’t be drawn', () => {
    expect(readAngle('')).toBe('Give the angle a measure.')
    expect(readAngle('x')).toMatch(/Type a number/)
    expect(readAngle('190')).toMatch(/between 0° and 180°/)
    expect(readAngle('5')).toMatch(/between 10° and 170°/)
    expect(readLines(params('t=t1|angle=x|pos=0')).problems).toEqual({ t1: expect.stringMatching(/Type a number/) })
  })
})

describe('the angles on the figure', () => {
  const measures = (q: string) => Object.fromEntries(buildLines(params(q)).angles.map((a) => [a.key, Math.round(a.measure * 10) / 10]))

  test('two parallel lines and a transversal make eight angles, matching in corresponding pairs', () => {
    const m = measures('')
    expect(Object.keys(m)).toHaveLength(8)
    expect([m['p1+~t1+'], m['p2+~t1+'], m['p1-~t1+'], m['p1-~t1-'], m['p2+~t1-']]).toEqual([65, 65, 115, 65, 115])
  })

  test('the angles keep their names when the transversal turns or the figure does', () => {
    const keys = (q: string) => Object.keys(measures(q)).sort()
    expect(keys('turn=90')).toEqual(keys(''))
    expect(measures('t=t1|name=t|angle=120|pos=0&p=p1&p=p2')['p1+~t1+']).toBe(120)
  })

  test('two transversals that cross between the lines make a crossing of their own', () => {
    const fig = buildLines(params('p=p1&p=p2&t=t1|angle=60|pos=0&t=t2|angle=120|pos=0.5'))
    expect(fig.crossings.map((c) => c.key).sort()).toEqual(['p1.t1', 'p1.t2', 'p2.t1', 'p2.t2', 't1.t2'])
    const top = fig.angles.filter((a) => a.crossing === 't1.t2').map((a) => Math.round(a.measure))
    expect(top.sort((a, b) => a - b)).toEqual([60, 60, 120, 120])
  })

  test('two transversals meeting on a line make one crossing of three lines, with six angles', () => {
    const fig = buildLines(params('p=p1&p=p2&t=t1|angle=60|pos=0&t=t2|angle=120|pos=0'))
    expect(fig.crossings.find((c) => c.ids.length === 3)?.key).toBe('p1.t1.t2')
    expect(fig.angles.filter((a) => a.crossing === 'p1.t1.t2')).toHaveLength(6)
  })

  test('a crossing far off the band is left off', () => {
    const fig = buildLines(params('p=p1&p=p2&t=t1|angle=60|pos=0&t=t2|angle=62|pos=0.5'))
    expect(fig.crossings.map((c) => c.key)).not.toContain('t1.t2')
  })

  test('an angle gets only the mark it’s set to: a label alone adds no arc', () => {
    const fig = (q: string) => buildLines(params(q))
    expect(fig('a=p1%2B~t1%2B|label=measure').arcs).toHaveLength(0)
    expect(fig('a=p1%2B~t1%2B|mark=3').arcs).toHaveLength(3)
  })

  test('a right-angle square only at a right angle; elsewhere it shows as one arc', () => {
    const right = buildLines(params('t=t1|angle=90|pos=0&p=p1&p=p2&a=p1%2B~t1%2B|mark=right'))
    expect([right.squares.length, right.arcs.length, right.angles.find((a) => a.key === 'p1+~t1+')!.right]).toEqual([1, 0, true])
    const leaning = buildLines(params('a=p1%2B~t1%2B|mark=right'))
    expect([leaning.squares.length, leaning.arcs.length]).toEqual([0, 1])
    expect(buildLines(params('t=t1|angle=90|pos=0&p=p1&p=p2')).squares).toHaveLength(0)
  })

  test('a point can go at every crossing and near each end of every line, and shows once it’s turned on', () => {
    const blank = buildLines(params(''))
    expect(blank.spots.map((p) => p.key)).toEqual(['p1.t1', 'p2.t1', 'p1:start', 'p1:end', 'p2:start', 'p2:end', 't1:start', 't1:end'])
    expect(blank.dots).toHaveLength(0)
    const named = buildLines(params('pt=p1.t1|name=A&pt=t1:end|name=B&pt=p2:start'))
    expect(named.dots).toHaveLength(3)
    expect(named.labels.filter((l) => l.part.startsWith('pt:')).map((l) => l.part)).toEqual(['pt:p1.t1', 'pt:t1:end'])
  })

  test('each end of a line finishes as it’s set', () => {
    const fig = buildLines(params('p=p1|startCap=line|endCap=circle&p=p2|startCap=none|endCap=none&t=t1|angle=65|pos=0'))
    expect([fig.heads.length, fig.openHeads.length, fig.dots.length]).toEqual([2, 1, 1])
  })

  test('a measure label is the angle as drawn, and an unlabeled angle has no label', () => {
    const fig = buildLines(params('a=p1%2B~t1%2B|label=measure&a=p2-~t1-|label=text|text=x'))
    expect(fig.labels.filter((l) => l.part.startsWith('angle:')).map((l) => l.part)).toEqual(['angle:p1+~t1+', 'angle:p2-~t1-'])
  })
})
