// The lanes of a gel, left to right: a DNA ladder, or a sample with the band
// sizes the teacher types.

import { LADDER_IDS, ladderBands, type LadderId } from './ladders'
import type { Band } from './migration'

export interface LadderLane {
  type: 'ladder'
  id: number
  label: string
  ladder: LadderId
}

export interface SampleLane {
  type: 'sample'
  id: number
  label: string
  /** the band sizes as typed, e.g. "1200, 450 x2, 300" */
  bands: string
}

export type Lane = LadderLane | SampleLane

export const MIN_LANES = 2
export const MAX_LANES = 12
export const MAX_LABEL = 24
export const MAX_BANDS_TEXT = 160
export const MAX_BANDS = 20
/** The sizes a typed band can be, in bp. */
export const MIN_BP = 10
export const MAX_BP = 50000
/** How much more or less DNA a typed band can have than a typical one. */
export const MIN_AMOUNT = 0.1
export const MAX_AMOUNT = 10

/** One typed band: a size in bp or kb, then optionally "x" and how much DNA
 *  against a typical band, e.g. "450", "1.5 kb", "300 x2" or "700x0.5". */
const PIECE = /^(\d+(?:\.\d+)?)(bp|kb)?(?:x(\d+(?:\.\d+)?))?$/i

/** The bands typed for a sample lane, largest first, and any pieces that
 *  aren't a band. The same size typed twice is one band with both amounts,
 *  as two copies of a fragment make one darker band. */
export function parseBands(text: string): { bands: Band[]; bad: string[] } {
  const tidied = text
    // 1,200 and 23,130 are one size each; 100,200 is two.
    .replace(/(^|[^\d.])(\d{1,2}),(\d{3})(?!\d)/g, '$1$2$3')
    .replace(/(\d)\s+(?=(bp|kb)\b)/gi, '$1')
    .replace(/\s*[x×*]\s*(?=\d)/gi, 'x')
  const bands: Band[] = []
  const bad: string[] = []
  for (const piece of tidied.split(/[\s,;]+/).filter(Boolean)) {
    const m = PIECE.exec(piece)
    const bp = m ? Math.round(Number(m[1]) * (m[2]?.toLowerCase() === 'kb' ? 1000 : 1)) : NaN
    const amount = m?.[3] === undefined ? 1 : Number(m[3])
    if (!m || bp < MIN_BP || bp > MAX_BP || !(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
      bad.push(piece)
      continue
    }
    const same = bands.find((b) => b.bp === bp)
    if (same) same.amount = Math.min(MAX_AMOUNT, same.amount + amount)
    else if (bands.length < MAX_BANDS) bands.push({ bp, amount })
  }
  return { bands: bands.sort((a, b) => b.bp - a.bp), bad }
}

/** The bands a lane holds, whether or not they're drawn. */
export const bandsOf = (lane: Lane): Band[] => (lane.type === 'ladder' ? ladderBands(lane.ladder) : parseBands(lane.bands).bands)

/** An id no lane has yet. */
export const nextId = (lanes: Lane[]) => Math.max(0, ...lanes.map((l) => l.id)) + 1

const label = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_LABEL) : '')

function tidyLane(v: unknown): Lane | undefined {
  if (!v || typeof v !== 'object') return undefined
  const raw = v as Record<string, unknown>
  const id = typeof raw.id === 'number' && Number.isInteger(raw.id) && raw.id > 0 ? raw.id : 0
  if (raw.type === 'ladder') {
    const ladder = LADDER_IDS.includes(raw.ladder as LadderId) ? (raw.ladder as LadderId) : '1kb'
    return { type: 'ladder', id, label: label(raw.label), ladder }
  }
  if (raw.type === 'sample') {
    const bands = typeof raw.bands === 'string' ? raw.bands.slice(0, MAX_BANDS_TEXT) : ''
    return { type: 'sample', id, label: label(raw.label), bands }
  }
  return undefined
}

/** Valid lanes from anything stored or linked, or undefined for fewer than
 *  MIN_LANES. Unusable lanes are dropped, and missing or repeated ids
 *  replaced. */
export function tidyLanes(v: unknown): Lane[] | undefined {
  if (!Array.isArray(v)) return undefined
  const lanes = v.map(tidyLane).filter((l): l is Lane => !!l).slice(0, MAX_LANES)
  if (lanes.length < MIN_LANES) return undefined
  const seen = new Set<number>()
  for (const lane of lanes) {
    if (!lane.id || seen.has(lane.id)) lane.id = Math.max(0, ...lanes.map((l) => l.id), ...seen) + 1
    seen.add(lane.id)
  }
  return lanes
}
