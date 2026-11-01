import { describe, expect, test } from 'vitest'
import { buildProjectile } from './projectile'
import { projectileSettings, type ProjectileSettings } from './settings'

const make = (over: Partial<ProjectileSettings> = {}) => buildProjectile({ ...projectileSettings.defaults, ...over })

const everything = {
  positions: 5,
  letters: true,
  components: true,
  gravity: true,
  heightMark: true,
  rangeMark: true,
  cliffMark: true,
} as const

describe('the path', () => {
  test('is the real parabola: from level ground its peak is tan θ / 4 of its range', () => {
    for (const angle of [15, 30, 45, 60, 80]) {
      const f = make({ angle, positions: 1 })
      const range = f.landing.x - f.launch.x
      const rise = f.launch.y - f.peak!.y
      expect(rise / range).toBeCloseTo(Math.tan((angle * Math.PI) / 180) / 4, 2)
    }
  })

  test('leaves along the launch velocity', () => {
    for (const angle of [20, 45, 70]) {
      const { from, control } = make({ angle }).path
      expect((Math.atan2(from.y - control.y, control.x - from.x) * 180) / Math.PI).toBeCloseTo(angle, 1)
    }
  })

  test('is drawn from just past the launch velocity, which shows where it starts, and lies on the same curve', () => {
    const f = make({ angle: 45 })
    const v = f.vectors.find((v) => v.kind === 'velocity')!.v
    expect(f.drawnPath.from.x).toBeGreaterThan(v.x2)
    expect(f.drawnPath.to).toEqual(f.path.to)
    // The cut point is on the full curve: at its x, the parabola through launch, control and landing has its y.
    const { from, control, to } = f.path
    const u = (f.drawnPath.from.x - from.x) / (to.x - from.x)
    expect(f.drawnPath.from.y).toBeCloseTo((1 - u) ** 2 * from.y + 2 * u * (1 - u) * control.y + u ** 2 * to.y, 1)
    expect(make({ velocity: false }).drawnPath).toEqual(make({ velocity: false }).path)
  })

  test('from level ground it starts and lands with its middle on the ground line', () => {
    for (const positions of [0, 3]) {
      const f = make({ angle: 35, positions })
      expect(f.launch.y).toBe(f.ground.y1)
      expect(f.landing.y).toBeCloseTo(f.ground.y1, 1)
    }
  })

  test('from a cliff it lands with its middle on the ground line, past the cliff', () => {
    const f = make({ start: 'cliff', angle: 30, positions: 2 })
    expect(f.landing.y).toBeCloseTo(f.ground.y1, 1)
    expect(f.landing.x).toBeGreaterThan(f.cliff![3].x)
    // The ball starts centered on the cliff's top corner.
    expect(f.launch.x).toBeCloseTo(f.cliff![2].x)
    expect(f.launch.y).toBeCloseTo(f.cliff![2].y)
  })

  test('a horizontal launch has no peak, and drops as the square of the distance', () => {
    const f = make({ start: 'cliff', angle: 0, positions: 4 })
    expect(f.peak).toBeNull()
    expect(f.path.control.y).toBeCloseTo(f.launch.y, 1)
    const [p1, p2] = f.positions
    const drop = (p: { y: number }) => p.y - f.launch.y
    const across = (p: { x: number }) => p.x - f.launch.x
    expect(drop(p2) / drop(p1)).toBeCloseTo((across(p2) / across(p1)) ** 2, 1)
  })

  test('from a cliff it lands as far past the peak as the fall takes', () => {
    // With v₀ = g = 1 the peak comes at t = sin θ and the landing at sin θ + √(sin²θ + 2h).
    for (const cliffHeight of [0.3, 1.2]) {
      const f = make({ start: 'cliff', angle: 30, cliffHeight, positions: 1 })
      const sin = Math.sin(Math.PI / 6)
      const ratio = (f.landing.x - f.launch.x) / (f.peak!.x - f.launch.x)
      expect(ratio).toBeCloseTo((sin + Math.sqrt(sin * sin + 2 * cliffHeight)) / sin, 1)
    }
  })

  test('from the ground it is never flatter than 10°', () => {
    expect(make({ angle: 0 }).path).toEqual(make({ angle: 10 }).path)
  })
})

describe('positions', () => {
  test('at equal time steps, so equally spaced across, the last one landing', () => {
    const f = make({ positions: 4 })
    expect(f.positions).toHaveLength(4)
    const xs = [f.launch, ...f.positions].map((p) => p.x)
    const steps = xs.slice(1).map((x, i) => x - xs[i])
    for (const step of steps) expect(step).toBeCloseTo(steps[0], 1)
    expect(f.positions.at(-1)).toEqual(f.landing)
  })

  test('with an even number from level ground, one is at the peak', () => {
    const f = make({ positions: 2 })
    expect(f.positions[0].x).toBeCloseTo(f.peak!.x, 1)
    expect(f.positions[0].y).toBeCloseTo(f.peak!.y, 1)
  })

  test('are lettered from the launch, A first', () => {
    const f = make({ positions: 3, letters: true })
    expect(f.letters.map((l) => l.label.text)).toEqual(['A', 'B', 'C', 'D'])
    expect(make({ positions: 0, letters: true }).letters).toHaveLength(0)
  })
})

describe('vectors', () => {
  const angleOf = (v: { x1: number; y1: number; x2: number; y2: number }) => (Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1) * 180) / Math.PI
  const byKind = (f: ReturnType<typeof make>, kind: string) => f.vectors.find((v) => v.kind === kind)!

  test('the launch velocity is on by default, at the launch angle, from the ball', () => {
    const f = make({ angle: 40 })
    const v = byKind(f, 'velocity')
    expect(angleOf(v.v)).toBeCloseTo(40, 1)
    expect(v.v.x1).toBe(f.launch.x)
    expect(v.v.y1).toBe(f.launch.y)
  })

  test('its components add up to it', () => {
    const f = make({ angle: 50, components: true })
    const v = byKind(f, 'velocity').v
    const [x, y] = f.components
    expect(x.v.y2).toBe(x.v.y1)
    expect(y.v.x2).toBe(y.v.x1)
    expect(x.v.x2 - x.v.x1 + (y.v.x2 - y.v.x1)).toBeCloseTo(v.x2 - v.x1, 1)
    expect(x.v.y2 - x.v.y1 + (y.v.y2 - y.v.y1)).toBeCloseTo(v.y2 - v.y1, 1)
  })

  test('a horizontal launch has no components', () => {
    expect(make({ start: 'cliff', angle: 0, components: true }).components).toHaveLength(0)
  })

  test('gravity points straight down', () => {
    for (const start of ['ground', 'cliff'] as const) {
      expect(angleOf(byKind(make({ start, gravity: true }), 'gravity').v)).toBeCloseTo(-90, 1)
    }
  })

  test("the angle mark's horizontal line carries on past a short horizontal component", () => {
    const f = make({ start: 'cliff', angle: 70, components: true })
    expect(f.angle!.ref!.x1).toBeCloseTo(f.components[0].v.x2, 1)
    expect(f.angle!.ref!.x2).toBeGreaterThan(f.angle!.arc.from.x)
    expect(make({ start: 'cliff', angle: 30, components: true }).angle!.ref).toBeNull()
  })

  test('on level ground the angle is measured from the ground line, with no line of its own', () => {
    const f = make()
    expect(f.angle!.ref).toBeNull()
    expect(f.angle!.arc.from.y).toBe(f.ground.y1)
  })

  test('g goes below the path, clear of the ground line, when there is room', () => {
    const f = make({ gravity: true, positions: 4 })
    const g = f.vectors.find((v) => v.kind === 'gravity')!.v
    expect(g.y1).toBeGreaterThan(f.positions[2].y)
    expect(g.y2).toBeLessThan(f.ground.y1)
  })

  test('the angle mark is on by default, and never on a horizontal launch', () => {
    expect(make().angle).not.toBeNull()
    expect(make({ start: 'cliff', angle: 0 }).angle).toBeNull()
  })
})

describe('marks', () => {
  test('none unless asked for', () => {
    const f = make({ start: 'cliff' })
    expect([f.heightMark, f.rangeMark, f.cliffMark]).toEqual([null, null, null])
  })

  test('the maximum height runs from the ground up to the peak', () => {
    const f = make({ heightMark: true })
    expect(f.heightMark!.y1).toBe(f.ground.y1)
    expect(f.heightMark!.y2).toBeCloseTo(f.peak!.y, 1)
  })

  test('the range runs from the launch to the landing, or from the foot of the cliff', () => {
    const g = make({ rangeMark: true })
    expect(g.rangeMark!.x1).toBe(g.launch.x)
    expect(g.rangeMark!.x2).toBe(g.landing.x)
    const c = make({ start: 'cliff', rangeMark: true })
    expect(c.rangeMark!.x1).toBe(c.cliff![3].x)
  })

  test('the cliff height is as tall as the cliff, and only with a cliff', () => {
    const f = make({ start: 'cliff', cliffMark: true })
    expect(f.cliffMark!.y1 - f.cliffMark!.y2).toBeCloseTo(f.cliff![0].y - f.cliff![1].y)
    expect(make({ cliffMark: true }).cliffMark).toBeNull()
  })
})

describe('fitting', () => {
  test('everything fits in the figure, with everything on', () => {
    for (const start of ['ground', 'cliff'] as const) {
      for (const angle of [0, 10, 30, 60, 85]) {
        for (const cliffHeight of [0.2, 1.5]) {
          for (const objectSize of [0.3, 1.2]) {
            const f = make({ ...everything, start, angle, cliffHeight, objectSize })
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
  })

  test('the path fills most of the figure', () => {
    const f = make()
    expect(f.landing.x - f.launch.x).toBeGreaterThan(f.width * 0.6)
  })
})
