import { describe, expect, test } from 'vitest'
import { buildAngles } from './layout.js'
import { DEFAULT_SETTINGS, cleanSettings, freeDirection, newRay, readDirection, readRays, settingsFromParams, settingsToQuery } from './settings.js'

const params = (q: string) => settingsFromParams(new URLSearchParams(q))
const query = (...rows: [string, string][]) => new URLSearchParams(rows).toString()
const measures = (q: string) => buildAngles(params(q)).angles.map((a) => [a.key, a.measure])

describe('the page address', () => {
  test('the opening figure has a bare address', () => {
    expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe('')
  })

  test('the opening figure is a 60° angle with its measure and an arc', () => {
    expect(DEFAULT_SETTINGS.rays.map((r) => r.direction)).toEqual(['0', '60'])
    expect(buildAngles(DEFAULT_SETTINGS).labels.map((l) => l.part)).toEqual(['angle:r1+~r2+'])
  })

  test('a link comes back the same', () => {
    const q = query(
      ['turn', '20'],
      ['r', 'r1|dir=0|twoSided=1|startCap=none'],
      ['r', 'r2|dir=90|style=dashed'],
      ['r', 'r4|dir=147.5|endCap=circle'],
      ['a', 'r1+~r2+|label=measure|mark=right'],
      ['a', 'r4+~r1-|label=text|text=2x%2B10|shade=2'],
      ['pt', 'v|name=G'],
      ['pt', 'r1:start|name=F'],
    )
    expect(settingsToQuery(params(q))).toBe(q)
  })

  test('taking every label off is kept, not mistaken for the opening angle', () => {
    const s = cleanSettings({ ...DEFAULT_SETTINGS, angles: {} })
    expect(settingsToQuery(s)).toBe('a=')
    expect(params(settingsToQuery(s)).angles).toEqual({})
  })

  test('the first ray is always the baseline at 0°', () => {
    const s = params(query(['r', 'r7|dir=45'], ['r', 'r1|dir=30']))
    expect(s.rays.map((r) => r.direction)).toEqual(['0', '30'])
    expect(s.rays[0].id).toBe('r1')
    expect(s.rays[1].id).not.toBe('r1')
  })

  test('what belongs to a ray that isn’t there, or a side a one-sided ray doesn’t have, is dropped', () => {
    const s = params('a=r1%2B~r9%2B|label=measure&a=r1-~r2%2B|label=measure&pt=r2:start|name=A&pt=r9:end&a=nonsense|label=measure')
    expect([s.angles, s.points]).toEqual([{}, {}])
  })

  test('an angle and the reflex angle around the outside are named apart', () => {
    const s = params('a=r2%2B~r1%2B|label=measure&a=r1%2B~r1%2B|label=measure')
    expect(Object.keys(s.angles)).toEqual(['r2+~r1+'])
  })

  test('at most six rays', () => {
    const rays = Array.from({ length: 9 }, (_, i) => newRay(`r${i + 1}`, String(i * 20)))
    expect(cleanSettings({ ...DEFAULT_SETTINGS, rays }).rays).toHaveLength(6)
  })
})

describe('directions', () => {
  test('a direction is a number of degrees from 0 up to 360', () => {
    expect(readDirection('147.5')).toBe(147.5)
    expect(readDirection('')).toMatch(/direction/)
    expect(readDirection('x')).toMatch(/number/)
    expect(readDirection('360')).toMatch(/360/)
  })

  test('a ray pointing the same way as another is refused, either side of a line counting', () => {
    const s = params(query(['r', 'r1|dir=0|twoSided=1'], ['r', 'r2|dir=180'], ['r', 'r3|dir=60|twoSided=1'], ['r', 'r4|dir=240'], ['r', 'r5|dir=360']))
    expect(readRays(s).problems).toEqual({
      r2: 'Another ray already points this way.',
      r4: 'Another ray already points this way.',
      r5: 'Type a direction from 0° up to 360°.',
    })
  })

  test('a new ray gets a direction no ray has', () => {
    expect(freeDirection(params(query(['r', 'r1|dir=0|twoSided=1'], ['r', 'r2|dir=120'], ['r', 'r3|dir=150'])))).toBe('30')
  })
})

describe('the angles', () => {
  test('two rays make the angle between them and the reflex angle around the outside', () => {
    expect(measures('')).toEqual([['r1+~r2+', 60], ['r2+~r1+', 300]])
  })

  test('a line through the vertex makes a straight angle on its other side', () => {
    expect(measures(query(['r', 'r1|dir=0|twoSided=1'], ['r', 'r2|dir=90']))).toEqual([['r1+~r2+', 90], ['r2+~r1-', 90], ['r1-~r1+', 180]])
  })

  test('two lines crossing make vertical angles', () => {
    const m = measures(query(['r', 'r1|dir=0|twoSided=1'], ['r', 'r2|dir=50|twoSided=1']))
    expect(m.map(([, deg]) => deg)).toEqual([50, 130, 50, 130])
  })

  test('a ray that can’t be drawn is left off, and the others still make their angles', () => {
    expect(measures(query(['r', 'r1|dir=0'], ['r', 'r2|dir=100'], ['r', 'r3|dir=oops']))).toEqual([['r1+~r2+', 100], ['r2+~r1+', 260]])
  })

  test('a right angle gets its square, and a reflex angle its long way round', () => {
    const f = buildAngles(params(query(['r', 'r1|dir=0'], ['r', 'r2|dir=90'], ['a', 'r1+~r2+|label=measure|mark=right'])))
    expect(f.squares).toHaveLength(1)
    const reflex = buildAngles(params(query(['a', 'r2+~r1+|mark=1'])))
    expect(reflex.arcs.some((d) => / 0 1 1 /.test(d))).toBe(true)
  })
})
