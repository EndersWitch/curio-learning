// The strips of a line spectrum figure (CONTEXT.md "Strip"): an element's
// preset lines, lines the teacher types, or a mixture of other strips, and
// the lines each one shows.

import { SYMBOLS, elementOf, type ElementSymbol } from './elements'

export interface ElementStrip {
  type: 'element'
  id: number
  element: ElementSymbol
}

export interface CustomStrip {
  type: 'custom'
  id: number
  name: string
  /** the wavelengths as typed, e.g. "450, 520.5, 610" */
  lines: string
}

export interface MixtureStrip {
  type: 'mixture'
  id: number
  name: string
  /** the ids of the element and custom strips mixed */
  of: number[]
}

export type Strip = ElementStrip | CustomStrip | MixtureStrip

/** A line as drawn: its wavelength and how bright (or dark) it is, 0 to 1. */
export interface Line {
  nm: number
  strength: number
}

export const MAX_STRIPS = 8
export const MAX_NAME = 30
export const MAX_LINES_TEXT = 200
export const MAX_LINES = 30
/** Wavelengths a typed line can have, in nm. */
export const MIN_NM = 100
export const MAX_NM = 2000

/** The dimmest a line is drawn with relative strength, so faint lines still show. */
export const MIN_STRENGTH = 0.3

/** The lines typed for a custom strip, and any pieces that aren't a wavelength. */
export function parseLines(text: string): { lines: number[]; bad: string[] } {
  const lines: number[] = []
  const bad: string[] = []
  for (const piece of text.split(/[\s,;]+/).filter(Boolean)) {
    const nm = Number(piece)
    if (Number.isFinite(nm) && nm >= MIN_NM && nm <= MAX_NM) {
      if (lines.length < MAX_LINES && !lines.includes(nm)) lines.push(nm)
    } else bad.push(piece)
  }
  return { lines: lines.sort((a, b) => a - b), bad }
}

/** An element's preset lines, each as bright as NIST says relative to its
 *  strongest (square-rooted and then some, so weak lines still show), or all
 *  equally bright. */
function elementLines(symbol: ElementSymbol, relative: boolean): Line[] {
  const { lines } = elementOf(symbol)
  const strongest = Math.max(...lines.map(([, i]) => i))
  return lines.map(([nm, i]) => ({ nm, strength: relative ? Math.max(MIN_STRENGTH, (i / strongest) ** 0.35) : 1 }))
}

/** The strips a mixture is made of, in the order they're listed. */
export const partsOf = (mixture: MixtureStrip, strips: Strip[]) =>
  strips.filter((s): s is ElementStrip | CustomStrip => s.type !== 'mixture' && mixture.of.includes(s.id))

/** The lines a strip shows, shortest wavelength first. A mixture shows every
 *  line of every strip in it; where two share a wavelength, the brighter. */
export function linesOf(strip: Strip, strips: Strip[], relative = false): Line[] {
  if (strip.type === 'element') return elementLines(strip.element, relative)
  if (strip.type === 'custom') return parseLines(strip.lines).lines.map((nm) => ({ nm, strength: 1 }))
  const byNm = new Map<number, Line>()
  for (const part of partsOf(strip, strips))
    for (const line of linesOf(part, strips, relative)) {
      const had = byNm.get(line.nm)
      if (!had || had.strength < line.strength) byNm.set(line.nm, line)
    }
  return [...byNm.values()].sort((a, b) => a.nm - b.nm)
}

/** What a strip is called: an element's name (or symbol), or the name typed. */
export const stripName = (strip: Strip, symbol = false) =>
  strip.type === 'element' ? (symbol ? strip.element : elementOf(strip.element).name) : strip.name.trim()

/** "Unknown: hydrogen and sodium", for the answer key. */
export function mixtureAnswer(mixture: MixtureStrip, strips: Strip[]): string {
  const names = partsOf(mixture, strips).map((s) => (s.type === 'element' ? elementOf(s.element).name.toLowerCase() : stripName(s) || 'unnamed'))
  const list = names.length <= 1 ? (names[0] ?? 'nothing') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return `${mixture.name.trim() || 'Mixture'}: ${list}`
}

/** A new strip's id, one more than any there. */
export const nextId = (strips: Strip[]) => Math.max(0, ...strips.map((s) => s.id)) + 1

/** The same lines as a custom strip, to trim or change. */
export function asCustom(strip: ElementStrip): CustomStrip {
  const { name, lines } = elementOf(strip.element)
  return { type: 'custom', id: strip.id, name, lines: lines.map(([nm]) => nm.toFixed(1)).join(', ') }
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const nameOf = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_NAME) : '')

/** Valid strips from anything stored or in the address: unusable strips are
 *  dropped, ids made unique, and mixtures keep only strips that are there
 *  and aren't mixtures. Undefined when no strip is usable. */
export function tidyStrips(v: unknown): Strip[] | undefined {
  if (!Array.isArray(v)) return undefined
  const strips: Strip[] = []
  const used = new Set<number>()
  for (const raw of v.slice(0, MAX_STRIPS)) {
    if (!isObject(raw)) continue
    let id = typeof raw.id === 'number' && Number.isInteger(raw.id) && raw.id > 0 ? raw.id : 0
    if (!id || used.has(id)) id = Math.max(0, ...used) + 1
    used.add(id)
    if (raw.type === 'element' && SYMBOLS.includes(raw.element as ElementSymbol))
      strips.push({ type: 'element', id, element: raw.element as ElementSymbol })
    else if (raw.type === 'custom')
      strips.push({ type: 'custom', id, name: nameOf(raw.name), lines: typeof raw.lines === 'string' ? raw.lines.slice(0, MAX_LINES_TEXT) : '' })
    else if (raw.type === 'mixture')
      strips.push({ type: 'mixture', id, name: nameOf(raw.name), of: Array.isArray(raw.of) ? raw.of.filter((n): n is number => typeof n === 'number') : [] })
    else used.delete(id)
  }
  if (!strips.length) return undefined
  const mixable = new Set(strips.filter((s) => s.type !== 'mixture').map((s) => s.id))
  for (const s of strips) if (s.type === 'mixture') s.of = [...new Set(s.of.filter((id) => mixable.has(id)))]
  return strips
}
