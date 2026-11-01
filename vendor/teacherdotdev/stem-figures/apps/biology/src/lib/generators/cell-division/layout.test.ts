import { describe, expect, it } from 'vitest'
import { EDGE, type ChromosomeShape } from './chromosomes'
import { cellSizes, phasePicture, type CellType } from './layout'
import { PHASES } from './model'

const TYPES: CellType[] = ['animal', 'plant']
const PAIRS = [1, 2, 3, 4]

/** How far apart two chromosomes' edges are: below zero, they overlap. */
function clearance(a: ChromosomeShape, b: ChromosomeShape) {
  let best = Infinity
  for (const ca of a.chromatids)
    for (const cb of b.chromatids)
      for (const p of ca.points)
        for (const q of cb.points) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y) - (ca.width + cb.width) / 2 - 2 * EDGE)
  return best
}

const every = (fn: (phase: (typeof PHASES)[number], pairs: number, type: CellType, crossing: boolean) => void) => {
  for (const phase of PHASES) for (const pairs of PAIRS) for (const type of TYPES) for (const crossing of [false, true]) fn(phase, pairs, type, crossing)
}

describe('a phase’s picture', () => {
  it('draws every chromosome the model puts in it', () => {
    every((phase, pairs, type, crossing) => {
      const picture = phasePicture(phase, pairs, type, crossing)
      const modeled = picture.state.cells.flatMap((c) => c.groups.flat()).length
      const drawn = picture.bodies.flatMap((b) => b.chromosomes).length
      expect(drawn, phase).toBe(modeled)
    })
  })

  it('never draws two chromosomes on top of each other', () => {
    every((phase, pairs, type, crossing) => {
      const picture = phasePicture(phase, pairs, type, crossing)
      for (const body of picture.bodies) {
        const list = body.chromosomes
        for (let i = 0; i < list.length; i++)
          for (let j = i + 1; j < list.length; j++) {
            // a tetrad's homologs lie together on purpose
            if (picture.state.paired && list[i].chromosome.pair === list[j].chromosome.pair) continue
            // chromatin is loose; only condensed chromosomes must stay apart
            if (list[i].chromatids[0].look === 'thread') continue
            expect(clearance(list[i], list[j]), `${phase} 2n=${2 * pairs} ${type}: ${i} and ${j}`).toBeGreaterThan(0)
          }
      }
    })
  })

  it('keeps chromosomes inside their nuclei, and nuclei inside their cells', () => {
    every((phase, pairs, type) => {
      const picture = phasePicture(phase, pairs, type)
      for (const body of picture.bodies) {
        for (const n of body.nuclei.filter((n) => !n.broken)) {
          const inside = body.chromosomes.filter((s) => Math.hypot(s.centromere.x - n.x, s.centromere.y - n.y) < n.r)
          for (const s of inside)
            for (const c of s.chromatids)
              for (const p of c.points) expect(Math.hypot(p.x - n.x, p.y - n.y), `${phase} 2n=${2 * pairs}`).toBeLessThanOrEqual(n.r)
          const box = { ...body.box, y1: body.box.y1 - body.dy, y2: body.box.y2 - body.dy }
          expect(n.x - n.r).toBeGreaterThan(box.x1)
          expect(n.x + n.r).toBeLessThan(box.x2)
          expect(n.r, `${phase} 2n=${2 * pairs}`).toBeLessThan((box.y2 - box.y1) / 2)
        }
      }
    })
  })

  it('keeps every chromosome inside its cell', () => {
    every((phase, pairs, type, crossing) => {
      const picture = phasePicture(phase, pairs, type, crossing)
      for (const body of picture.bodies)
        for (const s of body.chromosomes)
          for (const c of s.chromatids)
            for (const p of c.points) {
              expect(p.x, phase).toBeGreaterThan(body.box.x1)
              expect(p.x, phase).toBeLessThan(body.box.x2)
              expect(p.y + body.dy, phase).toBeGreaterThan(body.box.y1)
              expect(p.y + body.dy, phase).toBeLessThan(body.box.y2)
            }
    })
  })

  it('lines chromosomes up on the plate in metaphase: singly in mitosis and meiosis II, in pairs in meiosis I', () => {
    for (const pairs of PAIRS) {
      const mitosis = phasePicture('metaphase', pairs, 'animal').bodies[0].chromosomes
      expect(new Set(mitosis.map((s) => Math.round(s.centromere.x)))).toEqual(new Set([0]))
      const meiosis = phasePicture('metaphase-1', pairs, 'animal').bodies[0].chromosomes
      // each tetrad's homologs either side of the plate, facing opposite poles
      for (let pair = 0; pair < pairs; pair++) {
        const [a, b] = meiosis.filter((s) => s.chromosome.pair === pair)
        expect(Math.sign(a.centromere.x)).toBe(-Math.sign(b.centromere.x))
      }
      for (const body of phasePicture('metaphase-2', pairs, 'animal').bodies)
        expect(new Set(body.chromosomes.map((s) => Math.round(s.centromere.x)))).toEqual(new Set([0]))
    }
  })

  it('has a nuclear envelope until prometaphase breaks it up, and again from telophase', () => {
    const nuclei = (phase: (typeof PHASES)[number]) => phasePicture(phase, 2, 'animal').bodies.flatMap((b) => b.nuclei)
    expect(nuclei('prophase').map((n) => n.broken)).toEqual([false])
    expect(nuclei('prometaphase').map((n) => n.broken)).toEqual([true])
    expect(nuclei('metaphase')).toEqual([])
    expect(nuclei('anaphase')).toEqual([])
    expect(nuclei('telophase')).toHaveLength(2)
    expect(nuclei('telophase-1')).toHaveLength(2)
    expect(nuclei('telophase-2')).toHaveLength(4)
    expect(nuclei('products')).toHaveLength(4)
  })

  it('gives animal cells centrioles and a cleavage furrow, and plant cells a wall and a cell plate', () => {
    for (const phase of ['telophase', 'cytokinesis', 'telophase-1', 'telophase-2'] as const) {
      const animal = phasePicture(phase, 2, 'animal')
      const plant = phasePicture(phase, 2, 'plant')
      expect(animal.bodies.every((b) => b.furrow && !b.plate && !b.inner)).toBe(true)
      expect(plant.bodies.every((b) => b.plate && !b.furrow && b.inner)).toBe(true)
    }
    for (const phase of PHASES) {
      expect(phasePicture(phase, 2, 'plant').bodies.every((b) => b.centrosomes.length === 0)).toBe(true)
    }
    expect(phasePicture('metaphase', 2, 'animal').bodies[0].centrosomes).toHaveLength(2)
  })

  it('finishes the cell plate only once the cell has divided', () => {
    expect(phasePicture('telophase', 2, 'plant').bodies[0].plate?.complete).toBe(false)
    expect(phasePicture('cytokinesis', 2, 'plant').bodies[0].plate?.complete).toBe(true)
  })

  it('makes cells big enough for the plate, and haploid cells smaller', () => {
    for (const pairs of PAIRS) {
      const { diploid, haploid, product } = cellSizes(pairs)
      expect(haploid).toBeLessThan(diploid)
      expect(product).toBeLessThan(haploid)
    }
  })
})
