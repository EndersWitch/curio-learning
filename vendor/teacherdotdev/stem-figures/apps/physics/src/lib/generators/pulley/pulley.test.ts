import { describe, expect, test } from 'vitest'
import { angleLabelBox, angleLabelClear, buildPulley } from './pulley'
import { numberedObject, pulleySettings, type PulleySettings } from './settings'

type Over = Partial<PulleySettings> & { aSize?: number; bSize?: number; aKind?: 'block' | 'cart' }
/** A figure from the defaults and `over`, where aSize, bSize and aKind set up the first two objects. */
const make = ({ aSize = 1, bSize = 1, aKind = 'block', ...over }: Over = {}) =>
  buildPulley({ ...pulleySettings.defaults, objects: [{ ...numberedObject(1), size: aSize, kind: aKind }, { ...numberedObject(2), size: bSize }], ...over })

describe('Atwood machine', () => {
  test('two objects hang on strings straight down from either side of the wheel', () => {
    for (const [aSize, bSize] of [[1, 1], [0.5, 2], [2, 2]]) {
      const f = make({ aSize, bSize })
      const [wheel] = f.wheels
      expect(f.objects).toHaveLength(2)
      for (const [i, side] of [[0, -1], [1, 1]] as const) {
        const string = f.strings[i]
        const top = string[0]
        const bottom = string.at(-1)!
        // leaves the wheel at its side
        expect(top.x).toBeCloseTo(wheel.cx + side * wheel.r)
        expect(top.y).toBeCloseTo(wheel.cy)
        // straight down, to the top middle of its object
        expect(bottom.x).toBeCloseTo(top.x)
        const o = f.objects[i]
        expect(bottom.x).toBeCloseTo(o.at.x)
        expect(bottom.y).toBeCloseTo(o.at.y - o.height)
      }
    }
  })

  test("big objects don't overlap: the wheel grows to keep them apart", () => {
    const f = make({ aSize: 2, bSize: 2 })
    const [a, b] = f.objects
    expect(a.at.x + a.width / 2).toBeLessThan(b.at.x - b.width / 2)
  })

  test('either object can hang lower', () => {
    const even = make()
    expect(even.objects[0].at.y).toBe(even.objects[1].at.y)
    const aLower = make({ lower: 'a' })
    expect(aLower.objects[0].at.y).toBeGreaterThan(aLower.objects[1].at.y)
    const bLower = make({ lower: 'b' })
    expect(bLower.objects[1].at.y).toBeGreaterThan(bLower.objects[0].at.y)
  })

  test('big objects with gravity on still hang below the wheel, on strings', () => {
    const f = make({ aSize: 2, bSize: 2, gravity: true })
    const [wheel] = f.wheels
    for (const o of f.objects) expect(o.at.y - o.height).toBeGreaterThan(wheel.cy + wheel.r)
    for (const o of f.objects) expect(o.at.y).toBeLessThanOrEqual(f.height)
  })

  test('everything fits in the figure', () => {
    for (const lower of ['neither', 'a', 'b'] as const) {
      const f = make({ aSize: 2, bSize: 2, lower })
      for (const o of f.objects) {
        expect(o.at.y).toBeLessThanOrEqual(f.height)
        expect(o.at.y - o.height).toBeGreaterThan(0)
      }
    }
  })
})

const angleOf = (a: { x: number; y: number }, b: { x: number; y: number }) => (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI

describe('table and hanging mass', () => {
  test('the object rests on the table; its string runs level to the top of the wheel, then straight down', () => {
    for (const aSize of [0.5, 1, 2]) {
      for (const aKind of ['block', 'cart'] as const) {
        const f = make({ setup: 'table', aSize, aKind })
        const [a, b] = f.objects
        const [wheel] = f.wheels
        expect(a.at.y).toBeCloseTo(f.table!.top)
        const [level, hang] = f.strings
        expect(level[0].y).toBeCloseTo(level[1].y) // level
        expect(level[0].y).toBeCloseTo(a.middle.y) // from the middle of the object's side
        expect(level[0].x).toBeCloseTo(a.at.x + a.width / 2)
        expect(level[1].x).toBeCloseTo(wheel.cx) // to the top of the wheel
        expect(level[1].y).toBeCloseTo(wheel.cy - wheel.r)
        expect(hang[0].x).toBeCloseTo(wheel.cx + wheel.r) // down from its side
        expect(hang.at(-1)!.x).toBeCloseTo(b.at.x)
        expect(hang.at(-1)!.y).toBeCloseTo(b.at.y - b.height)
      }
    }
  })

  test('a rough table is hatched', () => {
    expect(make({ setup: 'table' }).hatches).toHaveLength(0)
    expect(make({ setup: 'table', surface: 'rough' }).hatches.length).toBeGreaterThan(5)
  })
})

describe('ramp and hanging mass', () => {
  test('the string runs parallel to the slope, touching the wheel', () => {
    for (const angle of [10, 30, 60]) {
      for (const aSize of [0.5, 1, 2]) {
        const f = make({ setup: 'ramp', angle, aSize })
        const [slope] = f.strings
        const [wheel] = f.wheels
        expect(angleOf(slope[0], slope[1])).toBeCloseTo(angle, 1)
        // the wheel's middle is one radius from the string's line
        const [p, q] = slope
        const dist = Math.abs((q.x - p.x) * (wheel.cy - p.y) - (q.y - p.y) * (wheel.cx - p.x)) / Math.hypot(q.x - p.x, q.y - p.y)
        expect(dist).toBeCloseTo(wheel.r, 0)
        // and meets the object in the middle of its up-slope face
        const a = f.objects[0]
        expect(Math.hypot(p.x - a.middle.x, p.y - a.middle.y)).toBeCloseTo(a.width / 2, 0)
      }
    }
  })

  test('the hanging object is clear of the ramp and everything fits', () => {
    for (const angle of [10, 12, 35, 60]) {
      for (const [bSize, aKind, aSize] of [[0.5, 'block', 2], [2, 'block', 2], [1, 'cart', 1], [2, 'cart', 0.5]] as const) {
        const f = make({ setup: 'ramp', angle, bSize, aSize, aKind })
        const b = f.objects[1]
        expect(b.at.x - b.width / 2).toBeGreaterThan(f.ramp!.top.x)
        // every corner of every object, and the wheel, inside the figure
        for (const o of f.objects) {
          const t = (o.tilt * Math.PI) / 180
          const u = { x: Math.cos(t), y: Math.sin(t) }
          const n = { x: Math.sin(t), y: -Math.cos(t) }
          for (const [du, dn] of [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]]) {
            const x = o.at.x + u.x * du * o.width + n.x * dn * o.height
            const y = o.at.y + u.y * du * o.width + n.y * dn * o.height
            expect(x).toBeGreaterThanOrEqual(0)
            expect(x).toBeLessThanOrEqual(f.width)
            expect(y).toBeGreaterThanOrEqual(0)
            expect(y).toBeLessThanOrEqual(f.height)
          }
        }
        expect(f.wheels[0].cy - f.wheels[0].r).toBeGreaterThan(0)
        // the hanging object is below its wheel, with string between
        expect(b.at.y - b.height).toBeGreaterThan(f.wheels[0].cy + 20)
      }
    }
  })
})

  test('a low ramp stands on a platform so the hanging object has room below the pulley', () => {
    expect(make({ setup: 'ramp', angle: 45 }).platform).toBeNull()
    expect(make({ setup: 'ramp', angle: 10 }).platform).not.toBeNull()
  })

describe('block and tackle', () => {
  test('the load is held up by the chosen number of strands', () => {
    for (const strands of [1, 2, 3, 4]) {
      const f = make({ setup: 'tackle', strands })
      expect(f.tackle!.supporting).toHaveLength(strands)
      // plus the free end the effort pulls on
      expect(f.tackle!.effort).toBeTruthy()
    }
  })

  test('every strand hangs straight up and down', () => {
    for (const strands of [1, 2, 3, 4]) {
      for (const string of make({ setup: 'tackle', strands }).strings) {
        for (let i = 1; i < string.length; i++) expect(string[i].x).toBeCloseTo(string[i - 1].x)
      }
    }
  })

  test('fixed pulleys above, movable ones below with the load', () => {
    const count = (strands: number) => {
      const f = make({ setup: 'tackle', strands })
      const [top] = f.wheels.map((w) => w.cy).sort((a, b) => a - b)
      return { fixed: f.wheels.filter((w) => w.cy === top).length, movable: f.wheels.filter((w) => w.cy !== top).length }
    }
    expect(count(1)).toEqual({ fixed: 1, movable: 0 })
    expect(count(2)).toEqual({ fixed: 1, movable: 1 })
    expect(count(3)).toEqual({ fixed: 2, movable: 1 })
    expect(count(4)).toEqual({ fixed: 2, movable: 2 })
  })

  test('the load fits, and the free end is clear of it', () => {
    for (const strands of [1, 2, 3, 4]) {
      for (const loadSize of [0.5, 2]) {
        const f = make({ setup: 'tackle', strands, loadSize })
        const [load] = f.objects
        expect(load.at.y).toBeLessThanOrEqual(f.height)
        const effortX = f.tackle!.effort.x
        expect(Math.abs(effortX - load.at.x)).toBeGreaterThan(load.width / 2 + 6)
      }
    }
  })
})

describe('vectors', () => {
  const unit = (v: { x1: number; y1: number; x2: number; y2: number }) => {
    const len = Math.hypot(v.x2 - v.x1, v.y2 - v.y1)
    return { x: (v.x2 - v.x1) / len, y: (v.y2 - v.y1) / len }
  }
  const along = (v: { x1: number; y1: number; x2: number; y2: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const u = unit(v)
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    return Math.abs(u.x * ((b.y - a.y) / len) - u.y * ((b.x - a.x) / len)) // 0 when parallel
  }

  test('none by default', () => {
    for (const setup of ['atwood', 'table', 'ramp', 'tackle'] as const) expect(make({ setup }).vectors).toHaveLength(0)
  })

  test('tension at each end of each string, pointing along it', () => {
    for (const setup of ['atwood', 'table', 'ramp'] as const) {
      const f = make({ setup, tension: true })
      const tensions = f.vectors.filter((v) => v.kind === 'tension')
      expect(tensions).toHaveLength(4)
      for (const t of tensions) {
        const string = f.strings.find((st) => [st[0], st.at(-1)!].some((p) => Math.hypot(p.x - t.v.x1, p.y - t.v.y1) < 0.5))!
        expect(string).toBeTruthy()
        expect(along(t.v, string[0], string.at(-1)!)).toBeLessThan(1e-3)
      }
    }
  })

  test('tension on the object points away from it, up the string', () => {
    const f = make({ tension: true })
    for (const o of f.objects) {
      const t = f.vectors.find((v) => v.kind === 'tension' && Math.abs(v.v.x1 - o.at.x) < 0.5 && Math.abs(v.v.y1 - (o.at.y - o.height)) < 0.5)!
      expect(t.v.y2).toBeLessThan(t.v.y1)
    }
  })

  test('a block and tackle labels the tension in every supporting strand', () => {
    for (const strands of [1, 2, 3, 4]) {
      const f = make({ setup: 'tackle', strands, tension: true })
      const up = f.vectors.filter((v) => v.kind === 'tension' && v.v.y2 < v.v.y1)
      expect(up).toHaveLength(strands)
      for (const t of up) expect(t.label.text).toBe('T')
    }
  })

  test('gravity straight down on every object; normal and friction only on the table or ramp', () => {
    for (const setup of ['atwood', 'table', 'ramp', 'tackle'] as const) {
      const f = make({ setup, gravity: true, normal: true, friction: 'away' })
      const gravity = f.vectors.filter((v) => v.kind === 'gravity')
      expect(gravity).toHaveLength(f.objects.length)
      for (const g of gravity) {
        expect(g.v.x2).toBeCloseTo(g.v.x1)
        expect(g.v.y2).toBeGreaterThan(g.v.y1)
      }
      const onSurface = setup === 'table' || setup === 'ramp'
      expect(f.vectors.some((v) => v.kind === 'normal')).toBe(onSurface)
      expect(f.vectors.some((v) => v.kind === 'friction')).toBe(onSurface)
    }
    const ramp = make({ setup: 'ramp', angle: 30, normal: true, friction: 'away' })
    const n = unit(ramp.vectors.find((v) => v.kind === 'normal')!.v)
    expect((Math.atan2(-n.y, n.x) * 180) / Math.PI).toBeCloseTo(120, 0)
    const fr = unit(ramp.vectors.find((v) => v.kind === 'friction')!.v)
    expect((Math.atan2(-fr.y, fr.x) * 180) / Math.PI).toBeCloseTo(-150, 0) // down the slope, away from the pulley
  })

  test('acceleration: forward, the hanging object falls and the other moves toward the pulley', () => {
    const f = make({ setup: 'table', acceleration: 'forward' })
    const acc = f.vectors.filter((v) => v.kind === 'acceleration')
    expect(acc).toHaveLength(2)
    const [onTable, hangingDown] = acc
    expect(onTable.v.x2).toBeGreaterThan(onTable.v.x1)
    expect(hangingDown.v.y2).toBeGreaterThan(hangingDown.v.y1)
    const atwood = make({ acceleration: 'forward' }).vectors.filter((v) => v.kind === 'acceleration')
    expect(atwood[0].v.y2).toBeLessThan(atwood[0].v.y1) // left rises
    expect(atwood[1].v.y2).toBeGreaterThan(atwood[1].v.y1) // right falls
  })
})

test('every vector and label fits, above the ground, whatever the setup', () => {
  for (const setup of ['atwood', 'table', 'ramp', 'tackle'] as const) {
    for (const size of [1, 2]) {
      const f = make({ setup, tension: true, gravity: true, normal: true, friction: 'away', acceleration: 'forward', aSize: size, bSize: size, loadSize: size, strands: 3 })
      for (const v of f.vectors) {
        for (const y of [v.v.y1, v.v.y2, v.labelAt.y + 12]) {
          expect(y).toBeLessThanOrEqual(f.height)
          expect(y).toBeGreaterThanOrEqual(0)
        }
      }
      if (f.ground) for (const v of f.vectors.filter((v) => v.kind === 'gravity' && f.objects.some((o) => o.tilt === 0 && Math.abs(o.at.x - v.v.x1) < 1)))
        expect(v.labelAt.y).toBeLessThan(f.ground.y1)
    }
  }
})

describe('links and presets from before the objects were a list', () => {
  const text = (t: string) => ({ mode: 'text', text: t })

  test('an old link still loads', () => {
    const s = pulleySettings.fromParams(new URLSearchParams('setup=table&aLabel=5 kg&aKind=cart&aSize=2&bGravityLabel=W'))
    expect(s.objects).toEqual([
      { label: text('5 kg'), gravityLabel: text('m_1 g'), kind: 'cart', size: 2 },
      { label: text('m_2'), gravityLabel: text('W'), kind: 'block', size: 1 },
    ])
  })

  test('an old preset still loads', () => {
    const { objects, ...rest } = pulleySettings.defaults
    const preset = { ...rest, aLabel: text('A'), aSize: 1.5, aKind: 'cart', aGravityLabel: text('W_A'), bLabel: { mode: 'blank', text: 'm_2' }, bSize: 0.5, bGravityLabel: text('W_B') }
    expect(pulleySettings.clean(preset).objects).toEqual([
      { label: text('A'), gravityLabel: text('W_A'), kind: 'cart', size: 1.5 },
      { label: { mode: 'blank', text: 'm_2' }, gravityLabel: text('W_B'), kind: 'block', size: 0.5 },
    ])
  })

  test('its figure keeps its new address', () => {
    const old = pulleySettings.fromParams(new URLSearchParams('setup=ramp&aSize=0.5&bLabel=~&gravity=1'))
    const again = pulleySettings.fromParams(new URLSearchParams(pulleySettings.toQuery(old)))
    expect(buildPulley(again)).toEqual(buildPulley(old))
  })
})

/** Three objects of these sizes (and kinds, for the ones on a table or ramp), labeled m_1 to m_3. */
const three = (sizes: number[] = [1, 1, 1], kinds: ('block' | 'cart')[] = []) => sizes.map((size, i) => ({ ...numberedObject(i + 1), size, kind: kinds[i] ?? 'block' }))
const make3 = (over: Partial<PulleySettings> = {}, sizes?: number[], kinds?: ('block' | 'cart')[]) =>
  buildPulley({ ...pulleySettings.defaults, objects: three(sizes, kinds), ...over })
const tensions = (f: ReturnType<typeof make>) => f.vectors.filter((v) => v.kind === 'tension').map((v) => v.label.text)
const count = (texts: string[]) => texts.reduce<Record<string, number>>((n, t) => ({ ...n, [t]: (n[t] ?? 0) + 1 }), {})

/** Every corner of every object is inside the figure. */
function expectInside(f: ReturnType<typeof make>) {
  for (const o of f.objects) {
    const t = (o.tilt * Math.PI) / 180
    const u = { x: Math.cos(t), y: Math.sin(t) }
    const n = { x: Math.sin(t), y: -Math.cos(t) }
    for (const [du, dn] of [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]]) {
      const x = o.at.x + u.x * du * o.width + n.x * dn * o.height
      const y = o.at.y + u.y * du * o.width + n.y * dn * o.height
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(f.width)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(f.height)
    }
  }
  for (const w of f.wheels) expect(w.cy - w.r).toBeGreaterThan(0)
  for (const v of f.vectors) {
    for (const p of [{ x: v.v.x2, y: v.v.y2 }, v.labelAt]) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(f.width)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(f.height)
    }
  }
}

const everything = { tension: true, gravity: true, normal: true, friction: 'away', contact: true, acceleration: 'forward' } as const

describe('three-mass Atwood machine', () => {
  test('the third hangs straight below the one chosen, on its own string', () => {
    for (const below of ['a', 'b'] as const) {
      const f = make3({ below })
      expect(f.objects).toHaveLength(3)
      const [a, b, c] = f.objects
      const holder = below === 'a' ? a : b
      expect(c.at.x).toBeCloseTo(holder.at.x)
      expect(c.at.y - c.height).toBeGreaterThan(holder.at.y)
      const string = f.strings[2]
      expect(string[0]).toEqual(holder.at)
      expect(string.at(-1)!.x).toBeCloseTo(c.at.x)
      expect(string.at(-1)!.y).toBeCloseTo(c.at.y - c.height)
    }
  })

  test('the third moves with the one it hangs from', () => {
    const f = make3({ below: 'a', acceleration: 'forward' })
    const [up, down, third] = f.vectors.filter((v) => v.kind === 'acceleration')
    expect(up.v.y2).toBeLessThan(up.v.y1)
    expect(down.v.y2).toBeGreaterThan(down.v.y1)
    expect(third.v.y2).toBeLessThan(third.v.y1)
  })

  test("a wide third object doesn't run into the other side", () => {
    const f = make3({}, [2, 0.5, 2])
    const [a, , c] = f.objects
    expect(a.at.x + a.width / 2).toBeLessThan(c.at.x - c.width / 2)
  })

  test('two strings: T_1 over the wheel and T_2 below, at both ends of each', () => {
    expect(count(tensions(make3({ tension: true })))).toEqual({ T_1: 4, T_2: 2 })
    // and still just T with two objects
    expect(count(tensions(make({ tension: true })))).toEqual({ T: 4 })
  })

  test('the holder’s weight is set off to the outer side, clear of the string below it', () => {
    const f = make3({ gravity: true, below: 'b' })
    const [, b] = f.objects
    const weight = f.vectors.filter((v) => v.kind === 'gravity')[1]
    expect(weight.v.x1).toBeGreaterThan(b.at.x + 1)
  })

  test('everything fits, with the third on either side, any size, every vector on', () => {
    for (const below of ['a', 'b'] as const) {
      for (const lower of ['neither', 'a', 'b'] as const) {
        for (const sizes of [[1, 1, 1], [2, 2, 2], [0.5, 0.5, 2]]) expectInside(make3({ ...everything, below, lower }, sizes))
      }
    }
  })
})

describe('a row of objects on a table', () => {
  test('tied: a gap between them, with a level string from one to the next', () => {
    const f = make3({ setup: 'table' })
    const [back, front] = f.objects
    expect(back.at.y).toBe(front.at.y)
    expect(back.at.x + back.width / 2).toBeLessThan(front.at.x - front.width / 2)
    const tie = f.strings[0]
    expect(tie[0].x).toBeCloseTo(back.at.x + back.width / 2)
    expect(tie[1].x).toBeCloseTo(front.at.x - front.width / 2)
    expect(tie[0].y).toBe(tie[1].y)
  })

  test('tied: as far apart as Space between sets, everything still fitting', () => {
    const gap = (spacing: number) => {
      const f = make3({ setup: 'table', spacing, tension: true, friction: 'toward', normal: true, gravity: true })
      expectInside(f)
      const [back, front] = f.objects
      return front.at.x - front.width / 2 - (back.at.x + back.width / 2)
    }
    expect(gap(2)).toBeCloseTo(gap(1) * 2, 0)
    expect(gap(0.5)).toBeCloseTo(gap(1) / 2, 0)
  })

  test('touching: face to face, with no string between them', () => {
    const f = make3({ setup: 'table', joined: 'touching' })
    const [back, front] = f.objects
    expect(back.at.x + back.width / 2).toBeCloseTo(front.at.x - front.width / 2)
    expect(f.strings).toHaveLength(2)
  })

  test('the front one is where a lone one goes, still tied over the pulley', () => {
    const lone = make({ setup: 'table' }).objects[0]
    const f = make3({ setup: 'table' })
    expect(f.objects[1].at.x - (f.width - 640)).toBeCloseTo(lone.at.x)
  })

  test('a long row makes the table, and the figure, longer', () => {
    const f = make3({ setup: 'table' }, [2, 2, 1], ['cart', 'cart'])
    expect(f.width).toBeGreaterThan(640)
    expect(f.table!.slab.x).toBeLessThan(f.objects[0].at.x - f.objects[0].width / 2)
    expectInside(f)
  })

  test('two strings, T_1 and T_2; touching, one string, T', () => {
    expect(count(tensions(make3({ setup: 'table', tension: true })))).toEqual({ T_1: 2, T_2: 4 })
    expect(count(tensions(make3({ setup: 'table', joined: 'touching', tension: true })))).toEqual({ T: 4 })
  })

  test('a normal force and friction on each object on the table, numbered', () => {
    const f = make3({ setup: 'table', normal: true, friction: 'toward' })
    expect(f.vectors.filter((v) => v.kind === 'normal').map((v) => v.label.text)).toEqual(['F_{N1}', 'F_{N2}'])
    expect(f.vectors.filter((v) => v.kind === 'friction').map((v) => v.label.text)).toEqual(['F_{f1}', 'F_{f2}'])
  })

  test('touching, friction runs under each object and is labeled below the table top', () => {
    const f = make3({ setup: 'table', joined: 'touching', friction: 'away' })
    for (const v of f.vectors.filter((v) => v.kind === 'friction')) {
      expect(v.v.y1).toBeGreaterThan(f.table!.top)
      expect(v.v.x2).toBeLessThan(v.v.x1)
      expect(v.labelAt.y).toBeGreaterThan(v.v.y1)
    }
  })

  test('contact forces only when touching: equal, opposite, from the face, one labeled', () => {
    expect(make3({ setup: 'table', contact: true }).vectors.some((v) => v.kind === 'contact')).toBe(false)
    const f = make3({ setup: 'table', joined: 'touching', contact: true })
    const [onFront, onBack] = f.vectors.filter((v) => v.kind === 'contact')
    const [back, front] = f.objects
    const face = front.at.x - front.width / 2
    for (const c of [onFront, onBack]) expect(c.v.x1).toBeCloseTo(face)
    expect(onFront.v.x2).toBeGreaterThan(face) // pushing the front one forward
    expect(onBack.v.x2).toBeLessThan(face) // and the back one back
    expect(onFront.v.x2 - face).toBeCloseTo(face - onBack.v.x2)
    expect(onFront.v.y1).toBeLessThan(back.at.y)
    expect([onFront.label.mode, onBack.label.mode]).toEqual(['text', 'none'])
  })

  test('touching, they move as one: one acceleration arrow for the row', () => {
    const tied = make3({ setup: 'table', acceleration: 'forward' }).vectors.filter((v) => v.kind === 'acceleration')
    expect(tied).toHaveLength(3)
    const f = make3({ setup: 'table', joined: 'touching', acceleration: 'backward' })
    const acc = f.vectors.filter((v) => v.kind === 'acceleration')
    expect(acc).toHaveLength(2)
    // backward, over the back one
    expect(acc[0].v.x2).toBeLessThan(acc[0].v.x1)
    expect(Math.abs(acc[0].v.x1 - f.objects[0].at.x)).toBeLessThan(f.objects[0].width)
  })
})

describe('a row of objects on a ramp', () => {
  const along = (f: ReturnType<typeof make>, p: { x: number; y: number }) => {
    const { foot, top } = f.ramp!
    const len = Math.hypot(top.x - foot.x, top.y - foot.y)
    const ux = (top.x - foot.x) / len
    const uy = (top.y - foot.y) / len
    return { d: (p.x - foot.x) * ux + (p.y - foot.y) * uy, off: Math.abs((p.x - foot.x) * uy - (p.y - foot.y) * ux), len }
  }

  test('every object rests on the slope, tilted with it, all of it on the ramp', () => {
    for (const angle of [10, 30, 60]) {
      for (const joined of ['string', 'touching'] as const) {
        for (const sizes of [[1, 1, 1], [2, 2, 1], [0.5, 0.5, 0.5]]) {
          const f = make3({ setup: 'ramp', angle, joined }, sizes, ['cart', 'block'])
          for (const o of f.objects.slice(0, 2)) {
            const { d, off, len } = along(f, o.at)
            expect(off).toBeLessThan(0.05)
            expect(o.tilt).toBe(-angle)
            expect(d - o.width / 2).toBeGreaterThan(0)
            expect(d + o.width / 2).toBeLessThan(len)
          }
          const [back, front] = f.objects
          const gap = along(f, front.at).d - front.width / 2 - (along(f, back.at).d + back.width / 2)
          if (joined === 'touching') expect(gap).toBeCloseTo(0, 1)
          else expect(gap).toBeGreaterThan(100)
        }
      }
    }
  })

  test('tied: as far apart as Space between sets, on the ramp, everything still fitting', () => {
    for (const angle of [10, 30, 60]) {
      const gap = (spacing: number) => {
        const f = make3({ setup: 'ramp', angle, spacing, tension: true, friction: 'away', normal: true, gravity: true }, [2, 2, 1], ['cart', 'block'])
        expectInside(f)
        const [back, front] = f.objects
        return along(f, front.at).d - front.width / 2 - (along(f, back.at).d + back.width / 2)
      }
      expect(gap(2)).toBeCloseTo(gap(1) * 2, 0)
      expect(gap(0.5)).toBeCloseTo(gap(1) / 2, 0)
    }
  })

  test('the string between them runs parallel to the slope', () => {
    const f = make3({ setup: 'ramp', angle: 40 })
    expect(angleOf(f.strings[0][0], f.strings[0][1])).toBeCloseTo(40, 1)
  })

  test('everything fits, steep or shallow, tied or touching, every vector on', () => {
    for (const angle of [10, 20, 45, 60]) {
      for (const joined of ['string', 'touching'] as const) {
        for (const sizes of [[1, 1, 1], [2, 2, 2]]) expectInside(make3({ ...everything, setup: 'ramp', angle, joined }, sizes, ['cart', 'cart']))
      }
    }
  })

  test('at shallow angles the angle label is clear of the row and its vectors', () => {
    // The Pulley's ramp goes down to 10°, so an address asking for 5° draws 10°;
    // and a row is two objects on the ramp (three in all, with the hanging one).
    expect(pulleySettings.fromParams(new URLSearchParams('setup=ramp&angle=5')).angle).toBe(10)
    for (const angle of [10, 15]) {
      for (const joined of ['string', 'touching'] as const) {
        for (const over of [{}, everything, { friction: 'toward' as const }]) {
          for (const sizes of [[1, 1, 1], [1, 2, 1], [2, 2, 2]]) {
            for (const kinds of [['cart', 'block'], ['block', 'cart']] as ('block' | 'cart')[][]) {
              const objects = three(sizes, kinds)
              const s = { ...pulleySettings.defaults, ...over, setup: 'ramp' as const, angle, joined, objects }
              const f = buildPulley(s)
              expect(angleLabelClear(f, s)).toBe(true)
              expect(angleLabelBox(f, s).left).toBeGreaterThan(f.ramp!.foot.x - 1)
            }
          }
        }
      }
    }
  })

  test('a long row on a shallow ramp makes the figure wider, not the row shorter', () => {
    const f = make3({ setup: 'ramp', angle: 10 }, [2, 2, 1], ['cart', 'cart'])
    expect(f.width).toBeGreaterThan(640)
  })
})

describe('fitting a ramp', () => {
  test('a shallow ramp on a platform keeps its size; the figure grows taller instead', () => {
    const f = make({ setup: 'ramp', angle: 10, aKind: 'cart', bSize: 2, gravity: true, normal: true, acceleration: 'forward' })
    expect(f.platform).not.toBeNull()
    expect(f.ramp!.corner.x - f.ramp!.foot.x).toBeGreaterThan(200)
    expectInside(f)
  })
})
