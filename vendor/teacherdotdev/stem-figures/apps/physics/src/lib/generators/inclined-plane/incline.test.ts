import { describe, expect, test } from 'vitest'
import { angleLabelBox, angleLabelClear, buildIncline } from './incline'
import { inclineSettings, type InclineSettings } from './settings'

type Over = Partial<InclineSettings> & { object?: 'block' | 'ball' | 'cart'; objectSize?: number }
/** A figure from the defaults and `over`, where object and objectSize set up its one object. */
const make = ({ object = 'block', objectSize = 1, ...over }: Over = {}) =>
  buildIncline({ ...inclineSettings.defaults, objects: [{ label: { mode: 'text', text: 'm' }, kind: object, size: objectSize }], ...over })

describe('the ramp', () => {
  test('its slope rises at the chosen angle', () => {
    for (const angle of [5, 30, 60]) {
      const { ramp } = make({ angle })
      const rise = ramp.foot.y - ramp.top.y
      const run = ramp.top.x - ramp.foot.x
      expect((Math.atan2(rise, run) * 180) / Math.PI).toBeCloseTo(angle, 1) // coordinates are rounded to 0.01
    }
  })

  test('everything fits in the figure at any angle and object size', () => {
    for (const angle of [5, 20, 45, 60]) {
      for (const objectSize of [0.5, 1, 2]) {
        for (const object of ['block', 'ball', 'cart'] as const) {
          const f = make({ angle, objectSize, object, lengthMark: true, heightMark: true })
          for (const p of f.extent) {
            expect(p.x).toBeGreaterThanOrEqual(0)
            expect(p.x).toBeLessThanOrEqual(f.width)
            expect(p.y).toBeGreaterThanOrEqual(0)
            expect(p.y).toBeLessThanOrEqual(f.height)
          }
        }
      }
    }
  })
})

describe('the object', () => {
  test('sits on the slope, tilted with it', () => {
    const f = make({ angle: 35 })
    const { foot, top } = f.ramp
    // its resting point is on the line from the foot to the top
    const cross = (top.x - foot.x) * (f.objects[0].at.y - foot.y) - (top.y - foot.y) * (f.objects[0].at.x - foot.x)
    const distance = Math.abs(cross) / Math.hypot(top.x - foot.x, top.y - foot.y)
    expect(distance).toBeLessThan(0.05)
    expect(f.objects[0].tilt).toBe(-35)
  })

  test('its middle is above the slope by half its height, whatever its size', () => {
    for (const objectSize of [0.5, 2]) {
      const f = make({ objectSize })
      const d = Math.hypot(f.objects[0].middle.x - f.objects[0].at.x, f.objects[0].middle.y - f.objects[0].at.y)
      expect(d).toBeCloseTo(f.objects[0].height / 2)
    }
  })

  test('slides along the ramp', () => {
    expect(make({ position: 0.8 }).objects[0].at.x).toBeGreaterThan(make({ position: 0.3 }).objects[0].at.x)
  })
})

describe('marks', () => {
  test('the height mark is as tall as the ramp', () => {
    const f = make({ heightMark: true })
    expect(Math.abs(f.heightMark!.y1 - f.heightMark!.y2)).toBeCloseTo(f.ramp.foot.y - f.ramp.top.y)
  })

  test('the length mark is as long as the slope and runs parallel to it', () => {
    const f = make({ lengthMark: true, angle: 25 })
    const m = f.lengthMark!
    const slope = Math.hypot(f.ramp.top.x - f.ramp.foot.x, f.ramp.top.y - f.ramp.foot.y)
    expect(Math.hypot(m.x2 - m.x1, m.y2 - m.y1)).toBeCloseTo(slope)
    expect(Math.atan2(m.y1 - m.y2, m.x2 - m.x1)).toBeCloseTo((25 * Math.PI) / 180)
  })

  test('none unless asked for', () => {
    expect(make().lengthMark).toBeNull()
    expect(make().heightMark).toBeNull()
  })

  test('a rough surface is hatched', () => {
    expect(make().hatches).toHaveLength(0)
    expect(make({ surface: 'rough' }).hatches.length).toBeGreaterThan(5)
  })
})

describe('vectors', () => {
  const all = {
    gravity: true,
    normal: true,
    friction: 'up',
    applied: 'down',
    velocity: 'down',
    acceleration: 'up',
  } as const
  const byKind = (f: ReturnType<typeof make>, kind: string) => f.vectors.find((v) => v.kind === kind)!.v
  const angleOf = (v: { x1: number; y1: number; x2: number; y2: number }) => (Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1) * 180) / Math.PI

  test('none by default', () => {
    expect(make().vectors).toHaveLength(0)
  })

  test('gravity points straight down, the normal force straight out of the slope', () => {
    for (const angle of [10, 30, 55]) {
      const f = make({ ...all, angle })
      expect(angleOf(byKind(f, 'gravity'))).toBeCloseTo(-90, 1)
      expect(angleOf(byKind(f, 'normal'))).toBeCloseTo(90 + angle, 1)
    }
  })

  test('friction, applied force, velocity and acceleration run along the slope, up or down it', () => {
    const f = make({ ...all, angle: 30 })
    expect(angleOf(byKind(f, 'friction'))).toBeCloseTo(30, 1) // up the slope
    expect(angleOf(byKind(f, 'applied'))).toBeCloseTo(-150, 1) // down it
    expect(angleOf(byKind(f, 'velocity'))).toBeCloseTo(-150, 1)
    expect(angleOf(byKind(f, 'acceleration'))).toBeCloseTo(30, 1)
  })

  test('forces start at the edge of the object, not inside it', () => {
    const f = make({ ...all, angle: 30 })
    const m = f.objects[0].middle
    const from = (kind: string) => {
      const v = byKind(f, kind)
      return Math.hypot(v.x1 - m.x, v.y1 - m.y)
    }
    expect(from('normal')).toBeCloseTo(f.objects[0].height / 2, 0)
    // straight down meets the tilted block's bottom at a slant
    expect(from('gravity')).toBeCloseTo(f.objects[0].height / 2 / Math.cos((30 * Math.PI) / 180), 0)
  })

  test('each vector has its own label', () => {
    const f = make({ ...all, gravityLabel: { mode: 'text', text: 'mg' } })
    expect(f.vectors.find((v) => v.kind === 'gravity')!.label.text).toBe('mg')
    for (const v of f.vectors) expect(v.labelAt).toBeTruthy()
  })

  test('everything still fits with every vector on', () => {
    for (const angle of [5, 30, 60]) {
      for (const object of ['block', 'ball', 'cart'] as const) {
        const f = make({ ...all, angle, object, objectSize: 2, lengthMark: true, heightMark: true })
        for (const p of f.extent) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(f.width)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(f.height)
        }
      }
    }
  })
})

describe('a row of objects', () => {
  type Kind = 'block' | 'ball' | 'cart'
  /** n objects labeled m_1… from the foot up, of these kinds and sizes. */
  const row = (n: number, kinds: Kind[] = [], sizes: number[] = []) =>
    Array.from({ length: n }, (_, i) => ({ label: { mode: 'text' as const, text: `m_${i + 1}` }, kind: kinds[i] ?? 'block', size: sizes[i] ?? 1 }))
  const makeRow = (n: number, over: Partial<InclineSettings> = {}, kinds?: Kind[], sizes?: number[]) =>
    buildIncline({ ...inclineSettings.defaults, objects: row(n, kinds, sizes), ...over })
  const everything = { gravity: true, normal: true, friction: 'up', applied: 'down', tension: true, contact: true, velocity: 'down', acceleration: 'up' } as const
  /** How far along the slope from the foot a point is, and how far off the slope's line. */
  const onSlope = (f: ReturnType<typeof make>, p: { x: number; y: number }) => {
    const { foot, top } = f.ramp
    const len = Math.hypot(top.x - foot.x, top.y - foot.y)
    const u = { x: (top.x - foot.x) / len, y: (top.y - foot.y) / len }
    return { d: (p.x - foot.x) * u.x + (p.y - foot.y) * u.y, off: Math.abs((p.x - foot.x) * u.y - (p.y - foot.y) * u.x), len }
  }
  const labels = (f: ReturnType<typeof make>, kind: string) => f.vectors.filter((v) => v.kind === kind).map((v) => v.label.text)

  test('every object rests on the slope, tilted with it, in order from the foot, all of it on the ramp', () => {
    for (const angle of [5, 30, 60]) {
      for (const joined of ['string', 'touching'] as const) {
        for (const n of [2, 3]) {
          const f = makeRow(n, { angle, joined }, ['block', 'cart', 'ball'], [2, 1, 0.5])
          let last = -Infinity
          for (const o of f.objects) {
            const { d, off, len } = onSlope(f, o.at)
            expect(off).toBeLessThan(0.05)
            expect(o.tilt).toBe(-angle)
            expect(d - o.width / 2).toBeGreaterThan(last - 0.05)
            expect(d + o.width / 2).toBeLessThan(len)
            last = d + o.width / 2
          }
        }
      }
    }
  })

  test('tied: a string between each pair, parallel to the slope; touching: face to face, no strings', () => {
    const tied = makeRow(3, { angle: 25 })
    expect(tied.strings).toHaveLength(2)
    for (const st of tied.strings) expect((Math.atan2(st.y1 - st.y2, st.x2 - st.x1) * 180) / Math.PI).toBeCloseTo(25, 1)
    const touching = makeRow(3, { joined: 'touching' })
    expect(touching.strings).toHaveLength(0)
    const [a, b] = touching.objects
    expect(onSlope(touching, b.at).d - b.width / 2).toBeCloseTo(onSlope(touching, a.at).d + a.width / 2, 1)
  })

  test('tied objects sit as far apart as Space between sets, and friction stays clear of the next one', () => {
    const gaps = (spacing: number) => {
      const f = makeRow(3, { angle: 20, spacing, friction: 'up' })
      const gap = (i: number) => onSlope(f, f.objects[i + 1].at).d - f.objects[i + 1].width / 2 - (onSlope(f, f.objects[i].at).d + f.objects[i].width / 2)
      const friction = f.vectors.filter((v) => v.kind === 'friction')
      return { gaps: [gap(0), gap(1)], f, friction }
    }
    const usual = gaps(1).gaps[0]
    expect(gaps(2).gaps[0]).toBeCloseTo(usual * 2, 0)
    expect(gaps(0.5).gaps[1]).toBeCloseTo(usual / 2, 0)
    const { f, friction } = gaps(0.5)
    friction.slice(0, 2).forEach((v, i) => expect(onSlope(f, { x: v.v.x2, y: v.v.y2 }).d).toBeLessThan(onSlope(f, f.objects[i + 1].at).d - f.objects[i + 1].width / 2))
  })

  test("the row's middle follows Where on the ramp", () => {
    expect(onSlope(makeRow(2, { position: 0.8 }), makeRow(2, { position: 0.8 }).objects[0].at).d).toBeGreaterThan(
      onSlope(makeRow(2, { position: 0.3 }), makeRow(2, { position: 0.3 }).objects[0].at).d,
    )
  })

  test('gravity, the normal force and friction on every object, numbered', () => {
    const f = makeRow(3, everything)
    expect(labels(f, 'gravity')).toEqual(['F_{g1}', 'F_{g2}', 'F_{g3}'])
    expect(labels(f, 'normal')).toEqual(['F_{N1}', 'F_{N2}', 'F_{N3}'])
    expect(labels(f, 'friction')).toEqual(['F_{f1}', 'F_{f2}', 'F_{f3}'])
    // and one object keeps its labels as they are
    expect(labels(make({ ...everything }), 'gravity')).toEqual(['F_g'])
  })

  test('tension at both ends of each string, numbered when there are two', () => {
    expect(labels(makeRow(2, { tension: true }), 'tension')).toEqual(['T', 'T'])
    expect(labels(makeRow(3, { tension: true }), 'tension')).toEqual(['T_1', 'T_1', 'T_2', 'T_2'])
    expect(labels(makeRow(3, { tension: true, joined: 'touching' }), 'tension')).toEqual([])
    expect(labels(make({ tension: true }), 'tension')).toEqual([])
    // each pulls its object toward the other
    const f = makeRow(2, { tension: true, angle: 30 })
    const [onLower, onUpper] = f.vectors.filter((v) => v.kind === 'tension')
    expect(onLower.v.y2).toBeLessThan(onLower.v.y1) // up the slope
    expect(onUpper.v.y2).toBeGreaterThan(onUpper.v.y1) // down it
  })

  test('contact forces only when touching: a pair at each face, one labeled', () => {
    expect(labels(makeRow(2, { contact: true }), 'contact')).toEqual([])
    const f = makeRow(3, { contact: true, joined: 'touching', angle: 30 })
    expect(f.vectors.filter((v) => v.kind === 'contact').map((v) => v.label.mode === 'none' ? '' : v.label.text)).toEqual(['P_1', '', 'P_2', ''])
    const [up, down] = f.vectors.filter((v) => v.kind === 'contact')
    expect(up.v.x1).toBe(down.v.x1)
    expect(up.v.y2).toBeLessThan(up.v.y1) // pushing the upper one up the slope
    expect(down.v.y2).toBeGreaterThan(down.v.y1) // and the lower one down it
  })

  test('the applied force pulls the one in front of a tied row, and pushes the one at the back of a touching row', () => {
    const tied = makeRow(3, { applied: 'up', angle: 30 })
    const pull = tied.vectors.find((v) => v.kind === 'applied')!.v
    expect(onSlope(tied, { x: pull.x1, y: pull.y1 }).d).toBeGreaterThan(onSlope(tied, tied.objects[2].at).d)
    expect(pull.y2).toBeLessThan(pull.y1)
    const touching = makeRow(3, { applied: 'up', angle: 30, joined: 'touching' })
    const push = touching.vectors.find((v) => v.kind === 'applied')!.v
    const back = touching.objects[0]
    // its tip at the lowest object's lower face
    expect(onSlope(touching, { x: push.x2, y: push.y2 }).d).toBeCloseTo(onSlope(touching, back.at).d - back.width / 2, 0)
    expect(push.y2).toBeLessThan(push.y1)
  })

  test('touching, the row moves as one: one velocity and one acceleration, over the one in front', () => {
    const f = makeRow(3, { joined: 'touching', velocity: 'up', acceleration: 'down' })
    const [v] = f.vectors.filter((x) => x.kind === 'velocity')
    const [a] = f.vectors.filter((x) => x.kind === 'acceleration')
    expect(f.vectors.filter((x) => x.kind === 'velocity')).toHaveLength(1)
    expect(onSlope(f, { x: v.v.x1, y: v.v.y1 }).d).toBeGreaterThan(onSlope(f, f.objects[2].at).d)
    expect(onSlope(f, { x: a.v.x1, y: a.v.y1 }).d).toBeLessThan(onSlope(f, f.objects[0].at).d)
    expect(makeRow(3, { velocity: 'up' }).vectors.filter((x) => x.kind === 'velocity')).toHaveLength(3)
  })

  test('everything fits, steep or shallow, tied or touching, every vector and mark on', () => {
    for (const angle of [5, 15, 30, 45, 60]) {
      for (const joined of ['string', 'touching'] as const) {
        for (const sizes of [[1, 1, 1], [2, 2, 2]]) {
          for (const position of [0.2, 0.85]) {
            for (const spacing of [0.5, 1, 2]) {
              const f = makeRow(3, { ...everything, angle, joined, position, spacing, lengthMark: true, heightMark: true }, ['cart', 'block', 'ball'], sizes)
              for (const p of f.extent) {
                expect(p.x).toBeGreaterThanOrEqual(0)
                expect(p.x).toBeLessThanOrEqual(f.width)
                expect(p.y).toBeGreaterThanOrEqual(0)
                expect(p.y).toBeLessThanOrEqual(f.height)
              }
            }
          }
        }
      }
    }
  })

  test('at shallow angles the angle label is clear of the row, wherever the row is put', () => {
    for (const angle of [5, 10, 15]) {
      for (const n of [2, 3]) {
        for (const joined of ['string', 'touching'] as const) {
          for (const position of [0.2, 0.55, 0.85]) {
            for (const over of [{}, everything, { ...everything, spacing: 0.5 }, { ...everything, spacing: 2 }]) {
              const f = makeRow(n, { ...over, angle, joined, position }, ['cart', 'block', 'ball'], [1, 2, 1])
              // clear of every object, string, vector and vector label
              expect(angleLabelClear(f, inclineSettings.defaults)).toBe(true)
              // and still inside the figure, on the ramp's side of the foot
              const box = angleLabelBox(f, inclineSettings.defaults)
              expect(box.left).toBeGreaterThan(f.ramp.foot.x - 1)
            }
          }
        }
      }
    }
  })

  test('a long angle label is cleared too', () => {
    for (const angle of [5, 10, 15]) {
      const s = { angle, angleLabel: { mode: 'text' as const, text: '15deg' }, ...everything }
      expect(angleLabelClear(makeRow(3, s), { ...inclineSettings.defaults, ...s })).toBe(true)
    }
  })

  test('a row too long to fit makes the figure bigger, not the row shorter', () => {
    const f = makeRow(3, { angle: 60 }, ['cart', 'cart', 'cart'], [2, 2, 2])
    expect(Math.max(f.width - 640, f.height - 400)).toBeGreaterThan(0)
  })
})

describe('links and presets from before the objects were a list', () => {
  test('an old link still loads', () => {
    const s = inclineSettings.fromParams(new URLSearchParams('object=ball&objectLabel=5 kg&objectSize=1.5&angle=40'))
    expect(s.objects).toEqual([{ label: { mode: 'text', text: '5 kg' }, kind: 'ball', size: 1.5 }])
    expect(s.angle).toBe(40)
  })

  test('an old preset still loads', () => {
    const { objects, ...rest } = inclineSettings.defaults
    const s = inclineSettings.clean({ ...rest, object: 'cart', objectLabel: { mode: 'blank', text: 'm' }, objectSize: 0.5 })
    expect(s.objects).toEqual([{ label: { mode: 'blank', text: 'm' }, kind: 'cart', size: 0.5 }])
  })
})
