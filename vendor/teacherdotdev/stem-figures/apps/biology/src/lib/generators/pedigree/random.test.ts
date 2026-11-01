import { describe, expect, it } from 'vitest'
import { CLASSICS } from './classics'
import { verdicts } from './clues'
import { depthOf, everyone, formatFamily, parseFamily } from './family'
import { fitsMode, MODES, tellsMode } from './genetics'
import { randomFamily, shadeFamily, SIZES } from './random'

const SEEDS = Array.from({ length: 25 }, (_, i) => i * 7919 + 3)

describe('random families', () => {
  it('are the same for the same seed, and differ between seeds', () => {
    expect(formatFamily(randomFamily('ar', 3, 'medium', 42))).toBe(formatFamily(randomFamily('ar', 3, 'medium', 42)))
    const many = new Set(SEEDS.map((seed) => formatFamily(randomFamily('ar', 3, 'medium', seed))))
    expect(many.size).toBeGreaterThan(SEEDS.length * 0.8)
  })

  it('have the generations asked for, within the format’s limits', () => {
    for (const mode of MODES) {
      for (const generations of [2, 3, 4]) {
        for (const size of SIZES) {
          for (const seed of SEEDS.slice(0, 6)) {
            const f = randomFamily(mode, generations, size, seed)
            expect(depthOf(f)).toBe(generations)
            // What's written in the address reads back as the same family.
            expect(formatFamily(parseFamily(formatFamily(f))!)).toBe(formatFamily(f))
          }
        }
      }
    }
  })

  it('always fit their mode, with carriers shown or not', () => {
    for (const mode of MODES) {
      for (const generations of [2, 3, 4]) {
        for (const seed of SEEDS) {
          const f = randomFamily(mode, generations, 'medium', seed)
          expect(fitsMode(f, mode, false)).toBe(true)
          expect(fitsMode(f, mode, true)).toBe(true)
        }
      }
    }
  })

  it('can be diagnosed: every other mode ruled out or far less likely', () => {
    for (const mode of MODES) {
      for (const generations of [2, 3, 4]) {
        for (const size of SIZES) {
          for (const seed of SEEDS) {
            expect(tellsMode(randomFamily(mode, generations, size, seed), mode), `${mode} ${generations} ${size} ${seed}`).toBe(true)
          }
        }
      }
    }
  })

  it('show the textbook clue for recessive inheritance: unaffected parents with an affected child', () => {
    for (const mode of ['ar', 'xr'] as const) {
      for (const seed of SEEDS) {
        const f = randomFamily(mode, 3, 'medium', seed)
        const names = (key: string) => key
        const dominant = verdicts(f, names, false).find((v) => v.mode === 'ad')!
        expect(dominant.verdict).toBe('ruled out')
        expect(dominant.reasons[0]).toMatch(/are unaffected but have an affected/)
      }
    }
  })

  it('show the trait but don’t fill the family with it', () => {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        const people = [...everyone(randomFamily(mode, 3, 'medium', seed))].map((e) => e.person)
        const affected = people.filter((p) => p.affected).length
        expect(affected).toBeGreaterThanOrEqual(3)
        expect(affected).toBeLessThanOrEqual(people.length * 0.6)
      }
    }
  })

  it('mark carriers only in recessive modes, and never a man for X-linked', () => {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        const people = [...everyone(randomFamily(mode, 3, 'medium', seed))].map((e) => e.person)
        const carriers = people.filter((p) => p.carrier)
        if (mode === 'ad' || mode === 'xd' || mode === 'y') expect(carriers).toEqual([])
        if (mode === 'xr') expect(carriers.every((p) => p.sex === 'f')).toBe(true)
      }
    }
  })
})

describe('classic families', () => {
  it('read, fit their mode and can be diagnosed', () => {
    for (const c of CLASSICS) {
      const f = parseFamily(c.family)
      expect(f, c.id).toBeDefined()
      expect(formatFamily(f!), c.id).toBe(c.family)
      expect(fitsMode(f!, c.mode, false), c.id).toBe(true)
      expect(fitsMode(f!, c.mode, true), `${c.id} with carriers`).toBe(true)
      expect(tellsMode(f!, c.mode), c.id).toBe(true)
    }
  })

  it('cover every mode but Y-linked, whose classic examples are doubtful', () => {
    expect(new Set(CLASSICS.map((c) => c.mode))).toEqual(new Set(['ad', 'ar', 'xr', 'xd']))
  })

  it('name a royal-family proband with an arrow', () => {
    const f = parseFamily(CLASSICS.find((c) => c.id === 'hemophilia')!.family)!
    const proband = [...everyone(f)].filter((e) => e.person.proband)
    expect(proband).toHaveLength(1)
    expect(proband[0].person).toMatchObject({ sex: 'm', affected: true })
    expect(proband[0].ref.path).toHaveLength(3)
  })
})

describe('shading a family again for another mode', () => {
  /** Everyone as drawn, with who's affected and a carrier left out. */
  const people = (text: string) => text.replace(/[A-Z]/g, (c) => c.toLowerCase()).replace(/c/g, '')

  it('keeps the people, and fits the new mode', () => {
    for (const c of CLASSICS) {
      for (const mode of MODES) {
        const f = shadeFamily(parseFamily(c.family)!, mode, 5)
        expect(people(formatFamily(f)), `${c.id} as ${mode}`).toBe(people(c.family))
        expect(fitsMode(f, mode, false), `${c.id} as ${mode}`).toBe(true)
        expect(fitsMode(f, mode, true), `${c.id} as ${mode}, with carriers`).toBe(true)
        expect([...everyone(f)].some((e) => e.person.affected), `${c.id} as ${mode}`).toBe(true)
      }
    }
  })

  it('can usually be diagnosed', () => {
    const told = CLASSICS.flatMap((c) => MODES.map((mode) => tellsMode(shadeFamily(parseFamily(c.family)!, mode, 5), mode)))
    expect(told.filter(Boolean).length).toBeGreaterThan(told.length * 0.6)
  })
})
