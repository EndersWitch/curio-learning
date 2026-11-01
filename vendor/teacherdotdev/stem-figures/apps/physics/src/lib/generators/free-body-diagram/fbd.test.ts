import { describe, expect, test } from 'vitest'
import { searchGenerators } from '$lib/generators'
import { crosses, labelBox, overlaps } from '$lib/shared/layout'
import { buildFbd, DOT_R, sameDirection, SIDE_DOT_R, SIDE_GAP, UNIT } from './fbd'
import { componentLabel } from '$lib/shared/label'
import { VECTOR_WIDTH } from '$lib/shared/vector'
import { fbdSettings, STARTERS, starterForce, type FbdSettings, type Force } from './settings'

const make = (over: Partial<FbdSettings> = {}) => buildFbd({ ...fbdSettings.defaults, ...over })
const ROW = fbdSettings.clean({ forces: [{}] }).forces[0]
const force = (angle: number, length = 1, text = 'F', over: Partial<Force> = {}): Force => ({
  ...structuredClone(ROW),
  angle,
  length,
  label: { mode: 'text', text },
  ...over,
})
const length = (v: { x1: number; y1: number; x2: number; y2: number }) => Math.hypot(v.x2 - v.x1, v.y2 - v.y1)
const angleOf = (v: { x1: number; y1: number; x2: number; y2: number }) =>
  ((Math.atan2(v.y1 - v.y2, v.x2 - v.x1) * 180) / Math.PI + 360) % 360

describe('the default figure', () => {
  test('is a dot with gravity down and the normal force up, drawn equal', () => {
    const f = make()
    expect(f.body.kind).toBe('dot')
    expect(f.forces.map((v) => v.label.text)).toEqual(['F_g', 'F_N'])
    expect(angleOf(f.forces[0].v)).toBeCloseTo(270)
    expect(angleOf(f.forces[1].v)).toBeCloseTo(90)
    expect(length(f.forces[0].v)).toBeCloseTo(length(f.forces[1].v))
  })
})

describe('forces', () => {
  test('every tail is at the middle of the body', () => {
    for (const body of ['dot', 'block', 'ball', 'cart'] as const) {
      const f = make({ body, forces: [force(0), force(37), force(200)] })
      for (const v of f.forces) {
        expect(v.v.x1).toBeCloseTo(f.body.middle.x)
        expect(v.v.y1).toBeCloseTo(f.body.middle.y)
      }
    }
  })

  test('each points at its angle, counterclockwise from the right', () => {
    for (const angle of [0, 30, 90, 135, 180, 250, 359]) {
      expect(angleOf(make({ forces: [force(angle)] }).forces[0].v)).toBeCloseTo(angle, 0)
    }
  })

  test('the part past the body is the relative length', () => {
    const f = make({ forces: [force(0, 0.5), force(90, 2)] })
    expect(length(f.forces[0].v) - DOT_R).toBeCloseTo(UNIT * 0.5)
    expect(length(f.forces[1].v) - DOT_R).toBeCloseTo(UNIT * 2)
    // On a block, equal forces reach equally far past its sides.
    const b = make({ body: 'block', forces: [force(0), force(90)] })
    expect(length(b.forces[0].v) - b.body.width / 2).toBeCloseTo(length(b.forces[1].v) - b.body.height / 2)
  })

  test('labels sit past the tip', () => {
    const [v] = make({ forces: [force(0)] }).forces
    expect(v.labelAt.x).toBeGreaterThan(v.v.x2)
    expect(v.labelAt.y).toBeCloseTo(v.v.y2)
  })

  test('Mirror sends each angle to 180° − angle', () => {
    const f = make({ mirror: true, forces: [force(30), force(90), force(270), force(0)] })
    expect(f.forces.map((v) => Math.round(angleOf(v.v)))).toEqual([150, 90, 270, 180])
  })
})

describe('the figure', () => {
  test('is cropped to what is drawn, and everything fits', () => {
    const small = make({ forces: [force(90, 0.25)] })
    const big = make({ forces: [force(0, 2), force(180, 2)] })
    expect(big.width).toBeGreaterThan(small.width)
    for (const f of [small, big, make({ body: 'cart', bodySize: 2, forces: STARTERS.map(starterForce) })]) {
      for (const p of f.extent) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(f.width)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(f.height)
      }
    }
  })

  test('is drawn at the same scale whatever else is on it', () => {
    const a = make({ forces: [force(0)] })
    const b = make({ forces: [force(0), force(90, 2), force(200, 2)] })
    expect(length(a.forces[0].v)).toBeCloseTo(length(b.forces[0].v))
  })

  test('with no forces is just the body', () => {
    expect(make({ forces: [] }).forces).toEqual([])
  })
})

describe('angle marks', () => {
  // The angle an arc spans, from its reference end to its force end, counterclockwise.
  const spanOf = (f: ReturnType<typeof make>, i = 0) => {
    const { arc } = f.marks[i]
    const c = f.body.middle
    const at = (p: { x: number; y: number }) => (Math.atan2(c.y - p.y, p.x - c.x) * 180) / Math.PI
    return ((at(arc.to) - at(arc.from) + 540) % 360) - 180
  }
  const refAngle = (f: ReturnType<typeof make>, i = 0) => angleOf(f.marks[i].ref)

  test('measure from the nearer half of the reference line, in every quadrant', () => {
    const cases: [number, 'h' | 'v', number, number][] = [
      // angle, measured from, reference half-line, signed span
      [30, 'h', 0, 30],
      [150, 'h', 180, -30],
      [200, 'h', 180, 20],
      [300, 'h', 0, -60],
      [30, 'v', 90, -60],
      [120, 'v', 90, 30],
      [200, 'v', 270, -70],
      [340, 'v', 270, 70],
    ]
    for (const [angle, from, ref, span] of cases) {
      const f = make({ forces: [force(angle, 1, 'F', { arc: true, from })] })
      expect(refAngle(f)).toBeCloseTo(ref, 0)
      expect(spanOf(f)).toBeCloseTo(span, 0)
      // the arc's sweep flag turns it the same way
      expect(f.marks[0].arc.sweep).toBe(span > 0 ? 0 : 1)
    }
  })

  test('arcs from the same half-line step outward', () => {
    const f = make({ forces: [force(30, 1, 'F', { arc: true }), force(60, 1, 'F', { arc: true })] })
    expect(f.marks[1].arc.r).toBeGreaterThan(f.marks[0].arc.r)
  })

  test('clear the corners of a block', () => {
    const f = make({ body: 'block', forces: [force(45, 1, 'F', { arc: true })] })
    expect(f.marks[0].arc.r).toBeGreaterThan(Math.hypot(f.body.width, f.body.height) / 2)
  })

  test('none for a force along an axis, or unless asked for', () => {
    expect(make({ forces: [force(90, 1, 'F', { arc: true, parts: true })] }).marks).toEqual([])
    expect(make({ forces: [force(90, 1, 'F', { arc: true, parts: true })] }).components).toEqual([])
    expect(make({ forces: [force(30)] }).marks).toEqual([])
  })

  test("don't draw the reference line over the force's own component", () => {
    const f = make({ forces: [force(30, 1.5, 'F', { arc: true, parts: true })] })
    const [c] = f.components
    const [m] = f.marks
    expect(m.ref.x1).toBeGreaterThanOrEqual(c.x.x2 - 0.01)
  })

  test('mirror with the force', () => {
    const f = make({ mirror: true, forces: [force(30, 1, 'F', { arc: true })] })
    expect(refAngle(f)).toBeCloseTo(180, 0)
    expect(spanOf(f)).toBeCloseTo(-30, 0)
  })
})

describe('components', () => {
  test('add up to the force, along the horizontal and vertical', () => {
    for (const angle of [30, 135, 210, 320]) {
      for (const body of ['dot', 'block'] as const) {
        const f = make({ body, forces: [force(angle, 1.3, 'F', { parts: true })] })
        const [v] = f.forces
        const [c] = f.components
        expect(c.x.y2).toBeCloseTo(c.x.y1) // horizontal
        expect(c.y.x2).toBeCloseTo(c.y.x1) // vertical
        expect(c.x.x1 + (c.x.x2 - c.x.x1) + (c.y.x2 - c.y.x1)).toBeCloseTo(v.v.x2)
        expect(c.y.y1 + (c.x.y2 - c.x.y1) + (c.y.y2 - c.y.y1)).toBeCloseTo(v.v.y2)
      }
    }
  })

  test('labels sit on the far side from the force', () => {
    const f = make({ forces: [force(30, 1, 'F', { parts: true })] })
    const [c] = f.components
    expect(c.xLabelAt.y).toBeGreaterThan(f.body.middle.y) // force is above, label below
    expect(c.yLabelAt.x).toBeLessThan(f.body.middle.x) // force is to the right, label to the left
  })

  test('are named after their force', () => {
    expect(componentLabel('T', 'x')).toBe('T_x')
    expect(componentLabel('F_g', 'y')).toBe('F_{gy}')
    expect(componentLabel('F_{air}', 'x')).toBe('F_{airx}')
    expect(componentLabel('F', 'x')).toBe('F_x')
  })
})

describe('velocity and acceleration', () => {
  const points = (f: ReturnType<typeof make>) =>
    f.forces.flatMap((v) => [v.v.x2, v.labelAt.x]).concat(f.body.middle.x + f.body.width / 2)

  test('sit beside everything else, clear of the body and every force', () => {
    for (const body of ['dot', 'block'] as const) {
      const f = make({ body, forces: STARTERS.map(starterForce), velocity: true, velocityAngle: 0, acceleration: true, accelerationAngle: 200 })
      expect(f.motion.map((m) => m.kind)).toEqual(['velocity', 'acceleration'])
      const rightmost = Math.max(...points(f))
      for (const m of f.motion) expect(Math.min(m.v.x1, m.v.x2)).toBeGreaterThan(rightmost + 20)
    }
  })

  test('point where they are set, and stack without overlapping', () => {
    const f = make({ velocity: true, velocityAngle: 90, acceleration: true, accelerationAngle: 90 })
    expect(angleOf(f.motion[0].v)).toBeCloseTo(90)
    const [a, b] = f.motion
    expect(Math.min(b.v.y1, b.v.y2)).toBeGreaterThan(Math.max(a.v.y1, a.v.y2))
  })

  test('go on the left when mirrored', () => {
    const f = make({ mirror: true, velocity: true, velocityAngle: 30 })
    const leftmost = Math.min(...f.forces.flatMap((v) => [v.v.x2, v.labelAt.x]))
    expect(Math.max(f.motion[0].v.x1, f.motion[0].v.x2)).toBeLessThan(leftmost)
    expect(angleOf(f.motion[0].v)).toBeCloseTo(150, 0)
  })

  test('none unless asked for', () => {
    expect(make().motion).toEqual([])
  })
})

describe('crowded forces', () => {
  const boxes = (f: ReturnType<typeof make>) => [
    ...f.forces.map((v) => labelBox(v.labelAt, v.label)),
    ...f.marks.map((m) => labelBox(m.labelAt, m.label)),
    ...f.components.flatMap((c) => [labelBox(c.xLabelAt, c.xLabel), labelBox(c.yLabelAt, c.yLabel)]),
  ]
  const noOverlaps = (f: ReturnType<typeof make>) => {
    const b = boxes(f)
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlaps(b[i], b[j])).toBe(false)
    // and no force's label sits on any force's arrow
    for (const v of f.forces) for (const l of f.forces) expect(crosses(v.v, labelBox(l.labelAt, l.label))).toBe(false)
  }

  test('labels of forces pointing almost the same way move apart, clear of the arrows', () => {
    noOverlaps(make({ forces: [force(85, 1, 'T_1'), force(95, 1, 'T_2')] }))
    noOverlaps(make({ forces: [80, 84, 88, 92, 96, 100].map((a, i) => force(a, 1, `F_${i + 1}`)) }))
    noOverlaps(make({ forces: [force(270, 1, 'F_g'), force(270, 1, 'F_{book}')] }))
  })

  test('and so are angle marks and components beside other forces', () => {
    noOverlaps(make({ forces: [force(30, 1.2, 'T', { arc: true, parts: true }), force(160, 0.8, 'F_A', { arc: true, from: 'v' })] }))
  })

  test('arrows stay where they are', () => {
    const alone = make({ forces: [force(85, 1, 'T_1')] })
    const crowded = make({ forces: [force(85, 1, 'T_1'), force(95, 1, 'T_2')] })
    const [a] = alone.forces
    const [b] = crowded.forces
    expect(b.v.x2 - b.v.x1).toBeCloseTo(a.v.x2 - a.v.x1)
    expect(b.v.y2 - b.v.y1).toBeCloseTo(a.v.y2 - a.v.y1)
  })

  test('a label with room stays past its tip', () => {
    const [v] = make({ forces: [force(0, 1, 'T'), force(180, 1, 'F')] }).forces
    expect(v.labelAt.y).toBeCloseTo(v.v.y2)
    expect(v.labelAt.x - v.v.x2).toBeLessThan(30)
  })

  test('crowded labels stay near their own arrow', () => {
    const f = make({ forces: [80, 84, 88, 92, 96, 100].map((a, i) => force(a, 1, `F_${i + 1}`)) })
    for (const v of f.forces) expect(Math.hypot(v.labelAt.x - v.v.x2, v.labelAt.y - v.v.y2)).toBeLessThan(130)
  })

  test('forces pointing exactly the same way are found', () => {
    expect(sameDirection([force(270), force(90), force(270), force(0), force(90), force(270)])).toEqual([
      [0, 2, 5],
      [1, 4],
    ])
    expect(sameDirection([force(89), force(90)])).toEqual([])
  })
})

describe('forces pointing the same way', () => {
  // How far a force's arrow is from the line through the middle along its direction, signed.
  const sideways = (f: ReturnType<typeof make>, i: number) => {
    const { v } = f.forces[i]
    const n = length(v)
    return ((v.x2 - v.x1) * (f.body.middle.y - v.y1) - (v.y2 - v.y1) * (f.body.middle.x - v.x1)) / n
  }

  test('are drawn side by side, a small gap apart, centered on the middle', () => {
    const f = make({ forces: [force(90, 1, 'F_N'), force(90, 0.6, 'T')] })
    expect(f.forces.map((v) => angleOf(v.v))).toEqual([expect.closeTo(90), expect.closeTo(90)])
    expect(Math.abs(sideways(f, 0) - sideways(f, 1))).toBeCloseTo(SIDE_GAP)
    expect(sideways(f, 0) + sideways(f, 1)).toBeCloseTo(0)
    // the first is on the left
    expect(f.forces[0].v.x1).toBeLessThan(f.forces[1].v.x1)
  })

  test('each keeps its own length', () => {
    const f = make({ forces: [force(90, 1, 'F_N'), force(90, 0.5, 'T'), force(270, 1, 'F_g')] })
    expect(length(f.forces[0].v) - SIDE_DOT_R).toBeCloseTo(UNIT)
    expect(length(f.forces[1].v) - SIDE_DOT_R).toBeCloseTo(UNIT * 0.5)
    // A force pointing another way stays on the middle.
    expect(sideways(f, 2)).toBeCloseTo(0)
  })

  test('the dot grows a little, so two side by side start on it', () => {
    expect(make({ forces: [force(90, 1, 'F_N'), force(270, 1, 'F_g')] }).body.width).toBe(DOT_R * 2)
    const f = make({ forces: [force(90, 1, 'F_N'), force(90, 0.6, 'T')] })
    expect(f.body.width).toBe(SIDE_DOT_R * 2)
    expect(SIDE_DOT_R).toBeGreaterThanOrEqual(SIDE_GAP / 2 + VECTOR_WIDTH / 2)
  })

  test('three: one on the middle and one each side', () => {
    const f = make({ forces: [force(0, 1, 'F_1'), force(0, 1, 'F_2'), force(0, 1, 'F_3')] })
    expect(sideways(f, 1)).toBeCloseTo(0)
    expect(Math.abs(sideways(f, 0))).toBeCloseTo(SIDE_GAP)
    expect(sideways(f, 2)).toBeCloseTo(-sideways(f, 0))
    // the first is on top
    expect(f.forces[0].v.y1).toBeLessThan(f.forces[2].v.y1)
  })

  test('at any angle, on any body, with every arrow and label clear of the others', () => {
    for (const body of ['dot', 'block'] as const) {
      for (const angle of [0, 37, 90, 135, 200, 270, 315]) {
        for (const n of [2, 3]) {
          const f = make({ body, forces: Array.from({ length: n }, (_, i) => force(angle, 1 - i * 0.2, `F_${i + 1}`)) })
          const boxes = f.forces.map((v) => labelBox(v.labelAt, v.label))
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false)
            for (const v of f.forces) expect(crosses(v.v, boxes[i])).toBe(false)
            expect(angleOf(f.forces[i].v)).toBeCloseTo(angle, 0)
          }
        }
      }
    }
  })

  test('mirror with the figure', () => {
    const plain = make({ forces: [force(90, 1, 'F_N'), force(90, 1, 'T')] })
    const mirrored = make({ mirror: true, forces: [force(90, 1, 'F_N'), force(90, 1, 'T')] })
    expect(plain.forces[0].v.x1).toBeLessThan(plain.forces[1].v.x1)
    expect(mirrored.forces[0].v.x1).toBeGreaterThan(mirrored.forces[1].v.x1)
  })

  test('components and angle marks start from the force’s own tail', () => {
    const f = make({ forces: [force(30, 1, 'T_1', { arc: true, parts: true }), force(30, 0.6, 'T_2')] })
    const [v] = f.forces
    const [c] = f.components
    expect(c.x.x1).toBeCloseTo(v.v.x1)
    expect(c.x.y1).toBeCloseTo(v.v.y1)
    expect(c.x.x2 - c.x.x1 + (c.y.x2 - c.y.x1)).toBeCloseTo(v.v.x2 - v.v.x1)
    expect(c.y.y2 - c.y.y1 + (c.x.y2 - c.x.y1)).toBeCloseTo(v.v.y2 - v.v.y1)
    const [m] = f.marks
    const r = Math.hypot(m.arc.to.x - v.v.x1, m.arc.to.y - v.v.y1)
    expect(r).toBeCloseTo(m.arc.r)
  })
})

describe('vector notation', () => {
  test('sets every vector’s label: forces, components, velocity and acceleration', () => {
    const f = make({
      notation: 'arrow',
      forces: [force(270, 1, 'F_g'), force(30, 1, 'T', { parts: true, xLabel: { mode: 'text', text: 'T_x' }, yLabel: { mode: 'text', text: 'T_y' } })],
      velocity: true,
      acceleration: true,
    })
    expect(f.forces.map((v) => v.label.text)).toEqual(['\\vec{F}_g', '\\vec{T}'])
    expect([f.components[0].xLabel.text, f.components[0].yLabel.text]).toEqual(['\\vec{T}_x', '\\vec{T}_y'])
    expect(f.motion.map((m) => m.label.text)).toEqual(['\\vec{v}', '\\vec{a}'])
    expect(make({ notation: 'bold' }).forces.map((v) => v.label.text)).toEqual(['\\mathbf{F}_g', '\\mathbf{F}_N'])
  })

  test('but not angle labels, and none unless asked for', () => {
    const f = make({ notation: 'arrow', forces: [force(30, 1, 'F', { arc: true })] })
    expect(f.marks[0].label.text).toBe('theta')
    expect(make().forces.map((v) => v.label.text)).toEqual(['F_g', 'F_N'])
  })

  test('a label written as a vector is drawn so with the setting off', () => {
    expect(make({ forces: [force(90, 1, '\\vec{F}_N')] }).forces[0].label.text).toBe('\\vec{F}_N')
  })

  test('is sized by what is drawn, not the commands', () => {
    const plain = make({ forces: [force(0, 1, 'F_g')] })
    const vector = make({ notation: 'arrow', forces: [force(0, 1, 'F_g')] })
    expect(vector.forces[0].labelAt.x).toBeCloseTo(plain.forces[0].labelAt.x)
  })
})

describe('settings', () => {
  test('round-trip through the address, including an empty list', () => {
    for (const s of [
      { ...fbdSettings.defaults, body: 'block' as const, forces: [force(37, 0.6, 'T_1'), force(143, 0.6, 'T_2'), force(270, 1.2, 'mg')] },
      { ...fbdSettings.defaults, forces: [] },
    ]) {
      expect(fbdSettings.fromParams(new URLSearchParams(fbdSettings.toQuery(s)))).toEqual(s)
    }
  })

  test('angle marks and components round-trip, and old links without them still work', () => {
    const s = { ...fbdSettings.defaults, forces: [force(37, 1, 'T', { arc: true, from: 'v' as const, parts: true, xLabel: { mode: 'blank' as const, text: 'F_x' } })] }
    expect(fbdSettings.fromParams(new URLSearchParams(fbdSettings.toQuery(s)))).toEqual(s)
    expect(fbdSettings.fromParams(new URLSearchParams('forces=37,1,T')).forces[0]).toEqual(force(37, 1, 'T'))
  })

  test('vector notation and labels written as vectors round-trip', () => {
    const s = { ...fbdSettings.defaults, notation: 'bold' as const, forces: [force(90, 1, '\\vec{F}_N'), force(90, 1, '\\mathbf{T}')] }
    expect(fbdSettings.fromParams(new URLSearchParams(fbdSettings.toQuery(s)))).toEqual(s)
    // and written in the address as typed
    expect(decodeURIComponent(fbdSettings.toQuery(s))).toBe('forces=90,1,\\vec{F}_N;90,1,\\mathbf{T}&notation=bold')
    expect(fbdSettings.fromParams(new URLSearchParams('forces=90,1,\\vec{F}_N')).forces[0].label.text).toBe('\\vec{F}_N')
  })

  test('starter forces write short links', () => {
    const s = { ...fbdSettings.defaults, forces: [...fbdSettings.defaults.forces, starterForce(STARTERS[2])] }
    expect(decodeURIComponent(fbdSettings.toQuery(s))).toBe('forces=270,1,F_g;90,1,F_N;180,0.6,F_f')
  })

  test('the list is capped at 8 forces', () => {
    expect(fbdSettings.clean({ forces: Array.from({ length: 12 }, () => force(0)) }).forces).toHaveLength(8)
  })
})

describe('the directory', () => {
  test('free body diagram searches find this and the figures with forces on them', () => {
    for (const q of ['free body', 'fbd']) {
      expect(searchGenerators(q).map((g) => g.id)).toEqual(['free-body-diagram', 'inclined-plane', 'pulley'])
    }
  })
})
