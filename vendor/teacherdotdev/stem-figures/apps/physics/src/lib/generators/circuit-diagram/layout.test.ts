import { describe, expect, test } from 'vitest'
import { circuitOf } from './circuit'
import { circuitSettings, MAX_LOADS, newLoad, type CircuitSettings, type VoltmeterPlace } from './settings'
import { arrowBox, buildCircuit, labelBox, ladderOf, meterBox, partBox, pointBox, type Box, type CircuitFigure, type Pt } from './layout'
import { cleanCircuit, DEFAULT_CIRCUIT, encodeCircuit, MAX_DEPTH, MAX_PARTS, newGroup, newPart, type Circuit, type Item, type PartKind } from './tree'

const p = (kind: PartKind = 'resistor', over: Partial<ReturnType<typeof newPart>> = {}) => ({ ...newPart(kind), ...over })
const series = (...items: Item[]) => newGroup('series', items)
const parallel = (...items: Item[]) => newGroup('parallel', items)
const loop = (...items: Item[]): Circuit => cleanCircuit({ items, current: null })
const shown = { mode: 'text' as const, text: '10 Omega' }

/** A small random number generator, so random circuits are the same every run. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** A random circuit within the tree's part and depth limits, with some labels shown. */
function randomCircuit(rand: () => number): Circuit {
  let budget = MAX_PARTS - 1
  const kinds: PartKind[] = ['resistor', 'resistor', 'bulb', 'switch', 'ammeter', 'battery']
  const part = (): Item => {
    budget--
    const kind = kinds[Math.floor(rand() * kinds.length)]
    return p(kind, {
      value: rand() < 0.4 ? { mode: rand() < 0.5 ? 'text' : 'blank', text: '12.5 Omega' } : newPart(kind).value,
      open: rand() < 0.5,
      cells: rand() < 0.5 ? 2 : 1,
      voltmeter: voltmeter(),
      ...extras(),
    })
  }
  // A point after an item and an arrow on it, sometimes; tidying keeps them only where they belong.
  const extras = () => ({
    point: rand() < 0.25 ? { mode: 'text' as const, text: 'B' } : null,
    current: rand() < 0.3 ? { dir: rand() < 0.5 ? ('forward' as const) : ('backward' as const), label: { mode: 'text' as const, text: 'I_2' } } : null,
  })
  const voltmeter = () => (rand() < 0.15 ? { mode: rand() < 0.5 ? ('text' as const) : ('none' as const), text: 'V_2' } : null)
  const item = (depth: number, inParallel: boolean): Item => {
    if (budget < 2 || depth > MAX_DEPTH || rand() < 0.55) return part()
    const n = 2 + Math.floor(rand() * 2)
    const group = newGroup(inParallel ? 'series' : 'parallel', Array.from({ length: n }, () => (budget > 0 ? item(depth + 1, !inParallel) : part())))
    return { ...group, voltmeter: voltmeter(), ...extras() }
  }
  const items: Item[] = [p('battery')]
  while (budget > 0 && items.length < 5) items.push(item(1, false))
  return cleanCircuit({ items, current: rand() < 0.3 ? { dir: 'forward', label: { mode: 'text', text: 'I' } } : null })
}

const inside = (a: Box, b: Box, tol = 0) => a.left >= b.left - tol && a.right <= b.right + tol && a.top >= b.top - tol && a.bottom <= b.bottom + tol
const overlap = (a: Box, b: Box, tol = 1) => a.left < b.right - tol && b.left < a.right - tol && a.top < b.bottom - tol && b.top < a.bottom - tol
const segments = (fig: CircuitFigure) => fig.wires.flatMap((w) => w.slice(1).map((q, i) => [w[i], q] as const))
/** Does a straight wire pass through the inside of a box? */
function cuts([a, b]: readonly [Pt, Pt], box: Box, tol = 1.5): boolean {
  const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)]
  const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)]
  const acrossX = x0 === x1 ? x0 > box.left + tol && x0 < box.right - tol : x0 < box.right - tol && x1 > box.left + tol
  const acrossY = y0 === y1 ? y0 > box.top + tol && y0 < box.bottom - tol : y0 < box.bottom - tol && y1 > box.top + tol
  return acrossX && acrossY
}
/** Is a point on one of the figure's wires? */
function onWire(fig: CircuitFigure, q: Pt): boolean {
  return segments(fig).some(([a, b]) =>
    a.x === b.x ? Math.abs(q.x - a.x) < 0.01 && q.y >= Math.min(a.y, b.y) && q.y <= Math.max(a.y, b.y) : Math.abs(q.y - a.y) < 0.01 && q.x >= Math.min(a.x, b.x) && q.x <= Math.max(a.x, b.x),
  )
}

/** Do two wires cross (rather than meet at an end or a T)? */
function cross([a, b]: readonly [Pt, Pt], [c, d]: readonly [Pt, Pt]): boolean {
  const h = a.y === b.y ? [a, b] : c.y === d.y ? [c, d] : null
  const v = a.x === b.x ? [a, b] : c.x === d.x ? [c, d] : null
  if (!h || !v || h === v) return false
  const [x0, x1] = [Math.min(h[0].x, h[1].x), Math.max(h[0].x, h[1].x)]
  const [y0, y1] = [Math.min(v[0].y, v[1].y), Math.max(v[0].y, v[1].y)]
  return v[0].x > x0 && v[0].x < x1 && h[0].y > y0 && h[0].y < y1
}

/** Everything a figure must get right, whatever the circuit. */
function checkFigure(fig: CircuitFigure) {
  const frame = { left: 0, right: fig.width, top: 0, bottom: fig.height }
  const parts = [...fig.parts.map(partBox), ...fig.meters.map(meterBox)]
  // Letters inside meters sit in their part's box; polarity marks must stay clear of everything.
  const marks = fig.letters.filter((l) => l.text === '+' || l.text === '−').map((l) => ({ left: l.x - 5, right: l.x + 5, top: l.y - 6, bottom: l.y + 6 }))
  const labels = [...fig.labels.map(labelBox), ...marks, ...fig.arrows.map(arrowBox)]
  // Points sit on wires, but mustn't touch parts, labels or each other.
  const points = fig.points.map(pointBox)
  for (const pt of points) for (const b of [...parts, ...labels]) expect(overlap(pt, b, 0), 'a point overlaps something').toBe(false)
  for (const pt of fig.points) expect(onWire(fig, pt), 'a point is off its wire').toBe(true)
  for (const b of [...parts, ...labels]) expect(inside(b, frame, 0.5)).toBe(true)
  for (const q of fig.wires.flat()) expect(inside({ left: q.x, right: q.x, top: q.y, bottom: q.y }, frame)).toBe(true)
  const things = [...parts, ...labels]
  for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) expect(overlap(things[i], things[j]), `boxes ${i} and ${j} overlap`).toBe(false)
  const wires = segments(fig)
  for (const w of wires) for (const b of things) expect(cuts(w, b), 'a wire runs through a part or label').toBe(false)
  for (let i = 0; i < wires.length; i++) for (let j = i + 1; j < wires.length; j++) expect(cross(wires[i], wires[j]), 'wires cross').toBe(false)
}

describe('current arrows and points', () => {
  const arrow = (dir: 'forward' | 'backward', text = 'I_1') => ({ dir, label: { mode: 'text' as const, text } })
  const point = (text: string) => ({ mode: 'text' as const, text })

  test("a branch's arrow sits beside its own wire, pointing the way it was set", () => {
    for (const dir of ['forward', 'backward'] as const) {
      const c = loop(p('battery'), p(), parallel(p(), p('resistor', { current: arrow(dir) })))
      const fig = buildCircuit(c, { title: false, polarity: false })
      checkFigure(fig)
      const [a] = fig.arrows
      const [r2, r3] = fig.parts.slice(2)
      // R₃'s branch is the lower one; its arrow is just above that wire, between the group's buses.
      expect(a.y1).toBe(a.y2)
      expect(a.y1).toBeLessThan(r3.y)
      expect(a.y1).toBeGreaterThan(r2.y)
      expect(Math.sign(a.x2 - a.x1)).toBe(dir === 'forward' ? 1 : -1)
    }
  })

  test("the main loop's arrow goes on the battery's side, and on a ladder's left rung", () => {
    const c = cleanCircuit({ items: DEFAULT_CIRCUIT.items, current: arrow('forward', 'I') })
    const fig = buildCircuit(c, { title: false, polarity: false })
    checkFigure(fig)
    const [a] = fig.arrows
    const battery = fig.parts[0]
    expect(a.x1).toBe(a.x2)
    expect(a.x1).toBeLessThan(battery.x)
    // Forward on the left side is up.
    expect(a.y2).toBeLessThan(a.y1)
    const ladder = cleanCircuit({ items: [p('battery'), parallel(p(), p())], current: arrow('backward', 'I') })
    const lfig = buildCircuit(ladder, { title: false, polarity: false })
    checkFigure(lfig)
    expect(lfig.arrows[0].x1).toBeLessThan(lfig.parts[0].x)
    expect(lfig.arrows[0].y2).toBeGreaterThan(lfig.arrows[0].y1)
  })

  test('points sit on the wire in their gap, each with its letter', () => {
    const c = loop(p('battery', { point: point('A') }), p('resistor', { point: point('B') }), p(), parallel(p(), p()))
    ;(c.items[3] as Item).point = point('C')
    const fig = buildCircuit(cleanCircuit(c), { title: false, polarity: false })
    checkFigure(fig)
    expect(fig.points).toHaveLength(3)
    const letters = fig.labels.map((l) => l.label.text)
    expect(letters).toEqual(expect.arrayContaining(['A', 'B', 'C']))
    // B is between R₁ and R₂ on the top side.
    const [, r1, r2] = fig.parts
    const b = fig.points.find((q) => q.y === r1.y && q.x > r1.x && q.x < r2.x)
    expect(b).toBeDefined()
  })

  test('a point after the parallel group of a ladder goes on the bottom rail', () => {
    const c = loop(p('battery'), { ...parallel(p(), p()), point: point('D') })
    const fig = buildCircuit(c, { title: false, polarity: false })
    checkFigure(fig)
    const [pt] = fig.points
    const bottom = Math.max(...fig.wires.flat().map((q) => q.y))
    expect(pt.y).toBe(bottom)
  })
})

describe('meters', () => {
  const V = { mode: 'text' as const, text: 'V_1' }

  test("a voltmeter's leads tap the wire either side of the part, and its meter clears the part's labels", () => {
    const fig = buildCircuit(loop(p('battery'), p('resistor', { voltmeter: V, value: shown }), p()), { title: false, polarity: false })
    checkFigure(fig)
    const r1 = fig.parts[1]
    const box = partBox(r1)
    const [meter] = fig.meters
    expect(meter.x).toBeCloseTo(r1.x)
    // Both taps are junction dots on R₁'s own wire, one before it and one after.
    const taps = fig.dots.filter((d) => d.y === r1.y)
    expect(taps).toHaveLength(2)
    expect(Math.min(...taps.map((t) => t.x))).toBeLessThan(box.left)
    expect(Math.max(...taps.map((t) => t.x))).toBeGreaterThan(box.right)
    // The meter is above R₁'s name, on the outside of the loop.
    const name = fig.labels.find((l) => l.label.text === 'R_1')!
    expect(meterBox(meter).bottom).toBeLessThan(labelBox(name).top)
    expect(fig.letters.map((l) => l.text)).toContain('V')
  })

  test('a voltmeter can go across a group, or a part on a vertical side', () => {
    const across = loop(p('battery', { voltmeter: V }), p(), { ...parallel(p(), p()), voltmeter: V })
    const fig = buildCircuit(across, { title: false, polarity: false })
    checkFigure(fig)
    expect(fig.meters).toHaveLength(2)
    // The battery's voltmeter is out to its left.
    expect(fig.meters[0].x).toBeLessThan(fig.parts[0].x)
  })

  test('an ammeter is a part with an upright A in it', () => {
    const fig = buildCircuit(loop(p('battery'), p('ammeter')), { title: false, polarity: false })
    const ammeter = fig.parts[1]
    expect(fig.letters).toEqual([expect.objectContaining({ text: 'A', x: ammeter.x, y: ammeter.y })])
  })
})

describe('the ladder layout', () => {
  test('a battery driving one parallel group is a ladder, with the battery on the left rung', () => {
    const c = loop(p('battery'), parallel(p('resistor', { value: shown }), p('resistor', { value: shown }), p('bulb', { value: shown })))
    expect(ladderOf(c)).not.toBeNull()
    const fig = buildCircuit(c, { title: false, polarity: true })
    checkFigure(fig)
    const [battery, ...rungs] = fig.parts
    expect(battery.angle).toBe(270)
    for (const r of rungs) expect(r.angle).toBe(90)
    // Rungs run left to right in the tree's order, each to the right of the one before.
    const xs = [battery.x, ...rungs.map((r) => r.x)]
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    // The middle rungs meet each rail at a T.
    expect(fig.dots).toHaveLength(4)
  })

  test('a switch or ammeter can share the left rung, and the loop can start anywhere', () => {
    expect(ladderOf(loop(p('battery'), p('switch'), parallel(p(), p())))).not.toBeNull()
    expect(ladderOf(loop(parallel(p(), p()), p('ammeter'), p('battery')))?.rest.map((i) => (i.type === 'part' ? i.kind : ''))).toEqual(['ammeter', 'battery'])
  })

  test('anything else in the loop, or a second group, means the loop layout', () => {
    expect(ladderOf(DEFAULT_CIRCUIT)).toBeNull()
    expect(ladderOf(loop(p('battery'), parallel(p(), p()), parallel(p(), p())))).toBeNull()
    expect(ladderOf(loop(p('switch'), parallel(p(), p())))).toBeNull()
  })

  test('rungs with nested groups and wide labels stay clear of each other', () => {
    const wide = { mode: 'text' as const, text: 'R_{bulb} = 120 Omega' }
    const c = loop(p('battery'), parallel(p('resistor', { value: wide }), series(p(), parallel(p('resistor', { value: shown }), p())), p('bulb', { value: wide })))
    checkFigure(buildCircuit(c, { title: false, polarity: false }))
  })
})

describe('the loop layout', () => {
  test('the default circuit: a battery on the left, the rest along the top', () => {
    const fig = buildCircuit(DEFAULT_CIRCUIT, { title: false, polarity: false })
    checkFigure(fig)
    const [battery, r1, r2, r3] = fig.parts
    expect(battery.angle).toBe(270)
    expect(battery.x).toBeLessThan(r1.x)
    for (const r of [r1, r2]) expect(r.angle).toBe(0)
    // R₃ is R₂'s parallel branch, below it inside the loop.
    expect(r3.x).toBeCloseTo(r2.x)
    expect(r3.y).toBeGreaterThan(r2.y)
    // Junction dots where the branches meet.
    expect(fig.dots).toHaveLength(2)
  })

  test('a battery later in the loop is brought round to the left', () => {
    const fig = buildCircuit(loop(p(), p(), p('battery')), { title: false, polarity: false })
    const battery = fig.parts.find((q) => q.part.kind === 'battery')!
    expect(battery.angle).toBe(270)
  })

  test('a long loop goes on down the right side, then back along the bottom', () => {
    const long = buildCircuit(loop(p('battery'), ...Array.from({ length: 7 }, () => p('resistor', { value: shown }))), { title: false, polarity: false })
    checkFigure(long)
    expect(new Set(long.parts.map((q) => q.angle))).toEqual(new Set([270, 0, 90]))
    const wide = { mode: 'text' as const, text: 'R_{heater} = 120 Omega' }
    const longer = buildCircuit(loop(p('battery'), ...Array.from({ length: 7 }, () => p('resistor', { name: wide, auto: false }))), { title: false, polarity: false })
    checkFigure(longer)
    expect(new Set(longer.parts.map((q) => q.angle))).toEqual(new Set([270, 0, 90, 180]))
  })

  test('nested groups fit inside one another', () => {
    const c = loop(p('battery'), parallel(p('resistor', { value: shown }), series(p('bulb', { value: shown }), parallel(p(), p('resistor', { value: shown }))), p()))
    checkFigure(buildCircuit(c, { title: false, polarity: false }))
  })

  test('wires are joined into long lines, not left in pieces', () => {
    const fig = buildCircuit(loop(p('battery'), p()), { title: false, polarity: false })
    // Two parts in a loop: one wire runs from the resistor round to the battery, one back.
    expect(fig.wires).toHaveLength(2)
  })

  test('a title makes room for itself above the circuit', () => {
    const plain = buildCircuit(DEFAULT_CIRCUIT, { title: false, polarity: false })
    const titled = buildCircuit(DEFAULT_CIRCUIT, { title: true, polarity: false })
    expect(titled.height).toBeGreaterThan(plain.height)
    expect(Math.min(...titled.wires.flat().map((q) => q.y))).toBeGreaterThan(titled.title!.y)
  })

  test('names go on the outside of the loop and values on the inside', () => {
    const value = { mode: 'text' as const, text: '12 V' }
    const fig = buildCircuit(loop(p('battery', { value }), p('resistor', { value: shown })), { title: false, polarity: false })
    const [battery, resistor] = fig.parts
    const [bName, bValue, rName, rValue] = fig.labels
    // The battery is on the left side: its name to its left, its value to its right.
    expect(bName).toMatchObject({ anchor: 'end' })
    expect(bName.x).toBeLessThan(battery.x)
    expect(bValue).toMatchObject({ anchor: 'start' })
    expect(bValue.x).toBeGreaterThan(battery.x)
    // The resistor is along the top: its name above, its value below.
    expect(rName.y).toBeLessThan(resistor.y)
    expect(rValue.y).toBeGreaterThan(resistor.y)
  })

  test('polarity marks: + by the long plate, following a battery turned round', () => {
    const marks = (flip: boolean) => {
      const fig = buildCircuit(loop(p('battery', { flip }), p()), { title: false, polarity: true })
      const plus = fig.letters.find((l) => l.text === '+')!
      const minus = fig.letters.find((l) => l.text === '−')!
      return { plus, minus }
    }
    // On the left side the current travels up, so a battery's + faces up.
    const up = marks(false)
    expect(up.plus.y).toBeLessThan(up.minus.y)
    const down = marks(true)
    expect(down.plus.y).toBeGreaterThan(down.minus.y)
    expect(buildCircuit(loop(p('battery'), p()), { title: false, polarity: false }).letters).toHaveLength(0)
  })

  test('random circuits: nothing overlaps, no wires cross, everything fits', () => {
    const rand = random(7)
    for (let i = 0; i < 300; i++) {
      const c = randomCircuit(rand)
      try {
        checkFigure(buildCircuit(c, { title: false, polarity: i % 2 === 0 }))
      } catch (e) {
        throw new Error(`circuit ${encodeCircuit(c)}: ${e}`)
      }
    }
  }, 30_000)
})

describe("the generator's circuits", () => {
  const settings = (over: Partial<CircuitSettings>) => circuitSettings.clean({ ...circuitSettings.defaults, ...over })
  const loads = (n: number) => Array.from({ length: n }, (_, i) => newLoad(i))

  test('every setup, in series and in parallel, with 1 to 4 parts: nothing overlaps, no wires cross', () => {
    for (const arrangement of ['series', 'parallel'] as const)
      for (let n = 1; n <= MAX_LOADS; n++)
        for (const sw of ['none', 'open'] as const)
          for (const ammeter of [false, true])
            for (const voltmeter of ['none', 'source', String(n) as VoltmeterPlace] as const) {
              const s = settings({ arrangement, loads: loads(n), switch: sw, ammeter, voltmeter, voltmeterLabel: shown, ammeterLabel: shown, polarity: true })
              try {
                checkFigure(buildCircuit(circuitOf(s), { title: false, polarity: true }))
              } catch (e) {
                throw new Error(`${circuitSettings.toQuery(s)}: ${e}`)
              }
            }
  }, 30_000)

  test('series parts go round one loop, the battery on the left', () => {
    const fig = buildCircuit(circuitOf(settings({ loads: loads(4) })), { title: false, polarity: false })
    expect(fig.parts.map((q) => q.part.kind)).toEqual(['battery', 'resistor', 'resistor', 'resistor', 'resistor'])
    expect(fig.parts[0].angle).toBe(270)
    expect(fig.dots).toHaveLength(0)
  })

  test('parallel parts are rungs of a ladder, the switch and ammeter beside the battery', () => {
    const c = circuitOf(settings({ arrangement: 'parallel', loads: loads(3), switch: 'closed', ammeter: true }))
    expect(ladderOf(c)).not.toBeNull()
    const fig = buildCircuit(c, { title: false, polarity: false })
    expect(fig.parts.filter((q) => q.part.kind === 'resistor').map((q) => q.angle)).toEqual([90, 90, 90])
    for (const q of fig.parts.filter((q) => q.part.kind !== 'resistor')) expect(q.angle).toBe(270)
    // Every rung but the last meets each rail at a T.
    expect(fig.dots).toHaveLength(4)
  })

  test('one part is one loop, whichever arrangement is set', () => {
    const one = (arrangement: 'series' | 'parallel') => encodeCircuit(circuitOf(settings({ arrangement, loads: loads(1) })))
    expect(one('parallel')).toBe(one('series'))
  })

  test('the voltmeter goes across the part it names, and names number themselves', () => {
    const c = circuitOf(settings({ loads: [newLoad(0), { ...newLoad(1), kind: 'bulb' }, { ...newLoad(2), name: { mode: 'text', text: 'R_x' } }], voltmeter: '2' }))
    const parts = c.items.filter((i) => i.type === 'part')
    expect(parts.map((q) => q.name.text)).toEqual(['epsilon', 'R', 'L', 'R_x'])
    expect(parts.map((q) => !!q.voltmeter)).toEqual([false, false, true, false])
  })
})
