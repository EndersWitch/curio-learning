import { describe, expect, it } from 'vitest'
import { CLASSICS } from './classics'
import { parseFamily, refKey, type Member } from './family'
import { BLANK_WIDTH, labelWidth, pedigreeFigure } from './figure'
import { MODES } from './genetics'
import { layoutPedigree, NUMBER_FONT, SYMBOL, textWidth, type Line, type PedigreeLayout } from './layout'
import { randomFamily, SIZES } from './random'
import { pedigreeSettings, type PedigreeSettings } from './settings'

const d = pedigreeSettings.defaults
const read = (text: string) => parseFamily(text)!
const plain = { numbers: true, numerals: true, genotypes: false, labelWidth: 0 }

/** Every family the tests lay out: random ones of every kind, the classics,
 *  and some drawn by hand with twins, partners on both sides and a lone child. */
function families(): { name: string; family: Member; settings: PedigreeSettings }[] {
  const out: { name: string; family: Member; settings: PedigreeSettings }[] = []
  for (const mode of MODES) {
    for (const generations of [2, 3, 4]) {
      for (const size of SIZES) {
        for (const seed of [1, 2, 3, 4]) {
          out.push({ name: `${mode} ${generations} ${size} ${seed}`, family: randomFamily(mode, generations, size, seed), settings: { ...d, mode, genotypes: 'answers' } })
        }
      }
    }
  }
  for (const c of CLASSICS) out.push({ name: c.id, family: read(c.family), settings: { ...d, mode: c.mode, letter: c.letter, genotypes: 'answers', carriers: 'half' } })
  for (const text of ['m-f4MiM-f2FmFt-m1fm.f2uFd', 'M-f1m-f1F-m1m', 'f-m5m-f1mf-m3mmmm-f2ffmf-m1u', 'm-f2f-m3mtfmM-f3mf-m1mm']) {
    out.push({ name: text, family: read(text), settings: { ...d, genotypes: 'blank' } })
  }
  return out
}

const isHorizontal = (l: Line) => Math.abs(l.y1 - l.y2) < 0.01
const isVertical = (l: Line) => Math.abs(l.x1 - l.x2) < 0.01

/** Whether two lines cross somewhere other than an end of either (a T where
 *  a line ends on another is how pedigree lines meet). */
function cross(a: Line, b: Line) {
  const den = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1)
  if (Math.abs(den) < 1e-9) {
    // Parallel: overlapping along the same line counts as crossing.
    if (isHorizontal(a) && isHorizontal(b) && Math.abs(a.y1 - b.y1) < 0.01) {
      const [a1, a2] = [Math.min(a.x1, a.x2), Math.max(a.x1, a.x2)]
      const [b1, b2] = [Math.min(b.x1, b.x2), Math.max(b.x1, b.x2)]
      return Math.min(a2, b2) - Math.max(a1, b1) > 0.01
    }
    return false
  }
  const t = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / den
  const u = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / den
  const inside = (v: number) => v > 0.001 && v < 0.999
  return inside(t) && inside(u)
}

/** Whether a line passes through a box (touching its edge is fine). */
function throughBox(l: Line, box: { x1: number; y1: number; x2: number; y2: number }) {
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const x = l.x1 + ((l.x2 - l.x1) * i) / steps
    const y = l.y1 + ((l.y2 - l.y1) * i) / steps
    if (x > box.x1 + 0.5 && x < box.x2 - 0.5 && y > box.y1 + 0.5 && y < box.y2 - 0.5) return true
  }
  return false
}

const symbolBox = (p: { x: number; y: number }) => ({ x1: p.x - SYMBOL / 2, y1: p.y - SYMBOL / 2, x2: p.x + SYMBOL / 2, y2: p.y + SYMBOL / 2 })

describe('the pedigree layout', () => {
  it('draws a generation to a row, numbered left to right', () => {
    const l = layoutPedigree(read('m-f3fM-f2mfm'), plain)
    const rows = [...new Set(l.people.map((p) => p.y))]
    expect(rows).toHaveLength(3)
    expect(l.numerals.map((n) => n.text)).toEqual(['I', 'II', 'III'])
    const second = l.people.filter((p) => p.generation === 1).sort((a, b) => a.x - b.x)
    expect(second.map((p) => p.name)).toEqual(['II-1', 'II-2', 'II-3', 'II-4'])
  })

  it('puts a married-in partner on the outside of an eldest or youngest child', () => {
    const l = layoutPedigree(read('m-f3f-m1mmM-f1f'), plain)
    const x = (path: number[], partner = false) => l.people.find((p) => p.key === refKey({ path, partner }))!.x
    expect(x([0], true)).toBeLessThan(x([0]))
    expect(x([2], true)).toBeGreaterThan(x([2]))
    // The founders: the man on the left.
    expect(x([])).toBeLessThan(x([], true))
  })

  it('keeps twins side by side, their partners outside the pair', () => {
    const l = layoutPedigree(read('m-f3Fi-m1mF-m1mm'), plain)
    const x = (path: number[], partner = false) => l.people.find((p) => p.key === refKey({ path, partner }))!.x
    expect(x([1]) - x([0])).toBe(l.spacing)
    expect(x([0], true)).toBeLessThan(x([0]))
    expect(x([1], true)).toBeGreaterThan(x([1]))
  })

  for (const { name, family, settings } of families()) {
    it(`is tidy: ${name}`, () => {
      const fig = pedigreeFigure(settings, family)
      const l: PedigreeLayout = fig.layout
      const at = new Map(l.people.map((p) => [p.key, p]))

      // Partners side by side, with no one between them.
      const walk = (m: Member, path: number[]) => {
        if (m.partner) {
          const a = at.get(refKey({ path, partner: false }))!
          const b = at.get(refKey({ path, partner: true }))!
          expect(Math.abs(a.x - b.x)).toBe(l.spacing)
          expect(l.people.some((p) => p.y === a.y && p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x))).toBe(false)
          if (m.children.length) {
            // Children centered under the partner line's middle.
            const kids = m.children.map((_, i) => at.get(refKey({ path: [...path, i], partner: false }))!.x)
            expect((kids[0] + kids[kids.length - 1]) / 2).toBeCloseTo((a.x + b.x) / 2)
          }
        }
        m.children.forEach((c, i) => walk(c, [...path, i]))
      }
      walk(family, [])

      // No two symbols closer than the spacing in a row.
      for (const p of l.people) {
        for (const q of l.people) {
          if (p !== q && p.y === q.y) expect(Math.abs(p.x - q.x)).toBeGreaterThanOrEqual(l.spacing - 0.01)
        }
      }

      // No lines crossing, and none through a symbol.
      for (let i = 0; i < l.lines.length; i++) {
        for (let j = i + 1; j < l.lines.length; j++) {
          expect(cross(l.lines[i], l.lines[j]), `${JSON.stringify(l.lines[i])} × ${JSON.stringify(l.lines[j])}`).toBe(false)
        }
        for (const p of l.people) expect(throughBox(l.lines[i], symbolBox(p)), `line through ${p.name}`).toBe(false)
      }

      // Labels under each symbol: inside the spacing, so neighbors' never
      // meet, and clear of every line.
      for (const p of l.people) {
        const label = fig.labels.get(p.key)
        const width = Math.max(label ? labelWidth(label) : 0, settings.genotypes === 'blank' ? BLANK_WIDTH : 0, textWidth(p.name.split('-')[1], NUMBER_FONT))
        expect(width).toBeLessThanOrEqual(l.spacing - 10)
        const box = { x1: p.x - width / 2, y1: p.y + SYMBOL / 2 + 2, x2: p.x + width / 2, y2: p.y + l.genotypeY + 4 }
        for (const line of l.lines) expect(throughBox(line, box), `line through ${p.name}’s labels`).toBe(false)
      }
    })
  }

  it('widens the spacing for wide labels', () => {
    const family = read(CLASSICS[0].family)
    expect(layoutPedigree(family, plain).spacing).toBe(62)
    expect(layoutPedigree(family, { ...plain, genotypes: true, labelWidth: 80 }).spacing).toBe(92)
  })

  it('draws identical twins with a bar, fraternal twins without', () => {
    const lines = (text: string) => layoutPedigree(read(text), plain).lines
    const diagonal = (ls: Line[]) => ls.filter((l) => !isHorizontal(l) && !isVertical(l))
    expect(diagonal(lines('m-f2mim'))).toHaveLength(2)
    expect(diagonal(lines('m-f2mtm'))).toHaveLength(2)
    expect(lines('m-f2mim').filter(isHorizontal).length).toBe(lines('m-f2mtm').filter(isHorizontal).length + 1)
  })

  it('draws related partners with a double line', () => {
    const one = layoutPedigree(read('m-f1m'), plain).lines.filter(isHorizontal)
    const two = layoutPedigree(read('m.f1m'), plain).lines.filter(isHorizontal)
    expect(two.length).toBe(one.length + 1)
  })
})

describe('the key', () => {
  it('lists the four basic symbols, then only the marks the family has', () => {
    const texts = (text: string, carriers: PedigreeSettings['carriers'] = 'none') =>
      pedigreeFigure({ ...d, carriers }, read(text)).key!.entries.map((e) => e.text)
    expect(texts('m-f1m')).toEqual(['Unaffected male', 'Affected male', 'Unaffected female', 'Affected female'])
    expect(texts('m-fc2fcud', 'half')).toEqual(['Unaffected male', 'Affected male', 'Unaffected female', 'Affected female', 'Carrier female', 'Sex unknown', 'Deceased'])
    expect(texts('m-fc2fcu')).not.toContain('Carrier female')
  })

  it('sits below the pedigree, inside the figure', () => {
    const fig = pedigreeFigure(d, read('m-f2mf'))
    expect(fig.key!.y).toBeGreaterThan(fig.layout.height)
    expect(fig.key!.x).toBeGreaterThanOrEqual(0)
    expect(fig.key!.x + fig.key!.width).toBeLessThanOrEqual(fig.width + 0.01)
  })
})
