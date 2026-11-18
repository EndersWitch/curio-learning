// Interactive question types for the test builder: things a learner does with
// their hands instead of typing. Everything here is pure (no server, no React)
// so the same rules draw the question, mark it, and show the answer.
//
//   symmetry  draw the lines of symmetry on a shape
//   bond      drag outer electrons from a metal to a non-metal (ionic bonding)
//   sort      drag items into the group they belong to
//   activity  one of curio's maths tools (rounding, fraction fun, algebra tiles)
//   maplocate click the province or country on a map
//   mapline   draw a line between two places on a map
//
// Symmetry, bond and activity questions are built from code templates, so their
// answers are always right. Sort questions are written by the AI and checked by a
// second blind AI pass (in the generate route) before a learner ever sees them.

export type InteractiveType = 'symmetry' | 'bond' | 'sort' | 'activity' | 'maplocate' | 'mapline' | 'geometry'
export const INTERACTIVE_TYPES: InteractiveType[] = ['symmetry', 'bond', 'sort', 'activity', 'maplocate', 'mapline', 'geometry']
export const isInteractive = (t: string): t is InteractiveType => (INTERACTIVE_TYPES as string[]).includes(t)

// ───────────────────────── Lines of symmetry ─────────────────────────

export type ShapeId =
  | 'square' | 'rectangle' | 'rhombus' | 'equilateral_triangle' | 'isosceles_triangle'
  | 'kite' | 'isosceles_trapezium' | 'regular_pentagon' | 'regular_hexagon'

export interface Axis { x: number; y: number; deg: number }
export interface Line { x1: number; y1: number; x2: number; y2: number }
export interface Shape { label: string; points: [number, number][]; axes: Axis[] }

const deg = (rad: number) => (rad * 180) / Math.PI
const through = (a: [number, number], b: [number, number]): Axis => ({ x: a[0], y: a[1], deg: deg(Math.atan2(b[1] - a[1], b[0] - a[0])) })
const V: Axis = { x: 100, y: 100, deg: 90 }
const H: Axis = { x: 100, y: 100, deg: 0 }

function regular(n: number, cx: number, cy: number, r: number, wholeEdges: boolean): Shape['points'] & { axes?: Axis[] } {
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
  })
}
const pent = regular(5, 100, 105, 80, false)
const hex = regular(6, 100, 100, 80, false)
const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const tri: [number, number][] = [[100, 30], [35, 142.6], [165, 142.6]]

export const SHAPES: Record<ShapeId, Shape> = {
  square: { label: 'square', points: [[40, 40], [160, 40], [160, 160], [40, 160]], axes: [V, H, { x: 100, y: 100, deg: 45 }, { x: 100, y: 100, deg: 135 }] },
  rectangle: { label: 'rectangle', points: [[20, 55], [180, 55], [180, 145], [20, 145]], axes: [V, H] },
  rhombus: { label: 'rhombus', points: [[100, 25], [165, 100], [100, 175], [35, 100]], axes: [V, H] },
  equilateral_triangle: {
    label: 'equilateral triangle',
    points: tri,
    axes: [through(tri[0], mid(tri[1], tri[2])), through(tri[1], mid(tri[0], tri[2])), through(tri[2], mid(tri[0], tri[1]))],
  },
  isosceles_triangle: { label: 'isosceles triangle', points: [[100, 30], [50, 165], [150, 165]], axes: [V] },
  kite: { label: 'kite', points: [[100, 20], [150, 80], [100, 180], [50, 80]], axes: [V] },
  isosceles_trapezium: { label: 'isosceles trapezium', points: [[60, 55], [140, 55], [175, 145], [25, 145]], axes: [V] },
  regular_pentagon: { label: 'regular pentagon', points: pent, axes: pent.map((p, k) => through(p, mid(pent[(k + 2) % 5]!, pent[(k + 3) % 5]!))) },
  regular_hexagon: {
    label: 'regular hexagon',
    points: hex,
    axes: [
      ...[0, 1, 2].map(k => through(hex[k]!, hex[k + 3]!)),
      ...[0, 1, 2].map(k => through(mid(hex[k]!, hex[k + 1]!), mid(hex[k + 3]!, hex[(k + 4) % 6]!))),
    ],
  },
}
export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[]
export const isShapeId = (v: unknown): v is ShapeId => typeof v === 'string' && v in SHAPES

/** A long segment along an axis, for drawing the answer. */
export function axisLine(a: Axis, half = 95): Line {
  const r = (a.deg * Math.PI) / 180
  return { x1: a.x - half * Math.cos(r), y1: a.y - half * Math.sin(r), x2: a.x + half * Math.cos(r), y2: a.y + half * Math.sin(r) }
}

const MIN_LINE = 40
const ANGLE_TOL = 10
const DIST_TOL = 12

function lineMatchesAxis(l: Line, a: Axis): boolean {
  const dx = l.x2 - l.x1
  const dy = l.y2 - l.y1
  const len = Math.hypot(dx, dy)
  if (len < MIN_LINE) return false
  let diff = Math.abs(deg(Math.atan2(dy, dx)) - a.deg) % 180
  if (diff > 90) diff = 180 - diff
  if (diff > ANGLE_TOL) return false
  // Distance from the axis point to the learner's (extended) line.
  const dist = Math.abs(dx * (l.y1 - a.y) - dy * (l.x1 - a.x)) / len
  return dist <= DIST_TOL
}

export function cleanLines(value: unknown): Line[] {
  if (!Array.isArray(value)) return []
  const out: Line[] = []
  for (const raw of value.slice(0, 12)) {
    const l = raw as Record<string, unknown>
    const nums = ['x1', 'y1', 'x2', 'y2'].map(k => l?.[k])
    if (nums.every(n => typeof n === 'number' && Number.isFinite(n) && (n as number) > -100 && (n as number) < 300)) {
      out.push({ x1: nums[0] as number, y1: nums[1] as number, x2: nums[2] as number, y2: nums[3] as number })
    }
  }
  return out
}

/** For each axis, the index of the learner's line that found it (or -1). Each line counts once. */
export function checkSymmetry(shape: ShapeId, lines: Line[]): { found: number[]; strays: number[] } {
  const used = new Set<number>()
  const found = SHAPES[shape].axes.map(axis => {
    const i = lines.findIndex((l, k) => !used.has(k) && lineMatchesAxis(l, axis))
    if (i >= 0) used.add(i)
    return i
  })
  return { found, strays: lines.map((_, k) => k).filter(k => !used.has(k)) }
}

// ───────────────────────── Ionic bonding ─────────────────────────

/** Electrons in each shell, innermost first. */
export const ELEMENTS: Record<string, { name: string; shells: number[]; metal: boolean }> = {
  Li: { name: 'lithium', shells: [2, 1], metal: true },
  Na: { name: 'sodium', shells: [2, 8, 1], metal: true },
  K: { name: 'potassium', shells: [2, 8, 8, 1], metal: true },
  Mg: { name: 'magnesium', shells: [2, 8, 2], metal: true },
  Ca: { name: 'calcium', shells: [2, 8, 8, 2], metal: true },
  Al: { name: 'aluminium', shells: [2, 8, 3], metal: true },
  O: { name: 'oxygen', shells: [2, 6], metal: false },
  S: { name: 'sulfur', shells: [2, 8, 6], metal: false },
  F: { name: 'fluorine', shells: [2, 7], metal: false },
  Cl: { name: 'chlorine', shells: [2, 8, 7], metal: false },
}

export interface Compound { name: string; formula: string; metals: string[]; nonmetals: string[] }
export const COMPOUNDS: Record<string, Compound> = {
  NaCl: { name: 'sodium chloride', formula: 'NaCl', metals: ['Na'], nonmetals: ['Cl'] },
  LiF: { name: 'lithium fluoride', formula: 'LiF', metals: ['Li'], nonmetals: ['F'] },
  KCl: { name: 'potassium chloride', formula: 'KCl', metals: ['K'], nonmetals: ['Cl'] },
  MgO: { name: 'magnesium oxide', formula: 'MgO', metals: ['Mg'], nonmetals: ['O'] },
  CaO: { name: 'calcium oxide', formula: 'CaO', metals: ['Ca'], nonmetals: ['O'] },
  MgS: { name: 'magnesium sulfide', formula: 'MgS', metals: ['Mg'], nonmetals: ['S'] },
  MgCl2: { name: 'magnesium chloride', formula: 'MgCl₂', metals: ['Mg'], nonmetals: ['Cl', 'Cl'] },
  CaCl2: { name: 'calcium chloride', formula: 'CaCl₂', metals: ['Ca'], nonmetals: ['Cl', 'Cl'] },
  CaF2: { name: 'calcium fluoride', formula: 'CaF₂', metals: ['Ca'], nonmetals: ['F', 'F'] },
  Na2O: { name: 'sodium oxide', formula: 'Na₂O', metals: ['Na', 'Na'], nonmetals: ['O'] },
  K2O: { name: 'potassium oxide', formula: 'K₂O', metals: ['K', 'K'], nonmetals: ['O'] },
  Li2O: { name: 'lithium oxide', formula: 'Li₂O', metals: ['Li', 'Li'], nonmetals: ['O'] },
  Na2S: { name: 'sodium sulfide', formula: 'Na₂S', metals: ['Na', 'Na'], nonmetals: ['S'] },
  AlCl3: { name: 'aluminium chloride', formula: 'AlCl₃', metals: ['Al'], nonmetals: ['Cl', 'Cl', 'Cl'] },
}
export const COMPOUND_IDS = Object.keys(COMPOUNDS)
export const isCompoundId = (v: unknown): v is string => typeof v === 'string' && v in COMPOUNDS

export const valence = (symbol: string) => ELEMENTS[symbol]!.shells.at(-1)!
export const needs = (symbol: string) => 8 - valence(symbol)

/** The learner's moves: "m:e" (metal atom m, its e-th outer electron) → "n:s" (non-metal atom n, outer-shell slot s). */
export type BondMoves = Record<string, string>

export function cleanMoves(value: unknown): BondMoves {
  const out: BondMoves = {}
  if (!value || typeof value !== 'object') return out
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    if (/^\d:\d$/.test(k) && typeof v === 'string' && /^\d:\d$/.test(v)) out[k] = v
  }
  return out
}

export interface BondResult { gaveAll: boolean; gaveCount: number; gaveTotal: number; allFull: boolean; fullCount: number }

export function checkBond(c: Compound, moves: BondMoves): BondResult {
  const taken = new Set<string>()
  const valid: [string, string][] = []
  for (const [from, to] of Object.entries(moves)) {
    const [m, e] = from.split(':').map(Number) as [number, number]
    const [n, s] = to.split(':').map(Number) as [number, number]
    const metal = c.metals[m]
    const nonmetal = c.nonmetals[n]
    // Only outer electrons of a metal, into an empty slot of a non-metal's outer shell, each slot once.
    if (!metal || !nonmetal || e >= valence(metal) || s < valence(nonmetal) || s > 7 || taken.has(to)) continue
    taken.add(to)
    valid.push([from, to])
  }
  const gaveTotal = c.metals.reduce((n, m) => n + valence(m), 0)
  const full = c.nonmetals.filter((nm, n) => valid.filter(([, to]) => to.startsWith(`${n}:`)).length === needs(nm)).length
  return { gaveAll: valid.length === gaveTotal, gaveCount: valid.length, gaveTotal, allFull: full === c.nonmetals.length, fullCount: full }
}

/** The answer, as moves: metals' electrons fill each non-metal's empty slots in turn. */
export function solveBond(c: Compound): BondMoves {
  const moves: BondMoves = {}
  const queue: string[] = []
  c.metals.forEach((m, mi) => { for (let e = 0; e < valence(m); e++) queue.push(`${mi}:${e}`) })
  c.nonmetals.forEach((nm, ni) => { for (let s = valence(nm); s < 8; s++) moves[queue.shift()!] = `${ni}:${s}` })
  return moves
}

// ───────────────────────── Sorting ─────────────────────────

export interface SortSpec { categories: string[]; items: { id: string; text: string }[] }
/** Item id → index of the category it belongs to. */
export type SortAnswer = Record<string, number>

export function cleanSort(raw: unknown): { spec: SortSpec; answer: SortAnswer } | null {
  const r = raw as { categories?: unknown; items?: unknown } | null
  if (!r || !Array.isArray(r.categories) || !Array.isArray(r.items)) return null
  const categories = r.categories.filter((c): c is string => typeof c === 'string').map(c => c.trim()).filter(Boolean)
  if (categories.length < 2 || categories.length > 3 || new Set(categories.map(c => c.toLowerCase())).size !== categories.length) return null
  if (categories.some(c => c.length > 40)) return null
  const items: SortSpec['items'] = []
  const answer: SortAnswer = {}
  for (const it of r.items as Record<string, unknown>[]) {
    const text = typeof it?.text === 'string' ? it.text.trim() : ''
    const cat = it?.category
    if (!text || text.length > 40 || typeof cat !== 'number' || !Number.isInteger(cat) || cat < 0 || cat >= categories.length) continue
    if (items.some(x => x.text.toLowerCase() === text.toLowerCase())) continue
    const id = `i${items.length}`
    items.push({ id, text })
    answer[id] = cat
  }
  if (items.length < 4 || items.length > 6) return null
  // Each group needs at least one item, or the sort is a giveaway.
  if (categories.some((_, k) => !Object.values(answer).includes(k))) return null
  return { spec: { categories, items }, answer }
}

export function cleanAssign(value: unknown, spec: SortSpec): SortAnswer {
  const out: SortAnswer = {}
  if (!value || typeof value !== 'object') return out
  for (const it of spec.items) {
    const v = (value as Record<string, unknown>)[it.id]
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < spec.categories.length) out[it.id] = v
  }
  return out
}

// ───────────────────────── Maths activity ─────────────────────────

export interface ActivityAnswer { done?: boolean; correct?: number; total?: number; mistakes?: number; watch?: boolean; solved?: boolean }

export function cleanActivity(value: unknown): ActivityAnswer | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (v.done !== true) return null
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1000 ? Math.floor(x) : undefined)
  return { done: true, correct: num(v.correct), total: num(v.total), mistakes: num(v.mistakes), watch: v.watch === true, solved: v.solved === true }
}

// ───────────────────────── Maps ─────────────────────────

export type MapId = 'za' | 'africa'
export const isMapId = (v: unknown): v is MapId => v === 'za' || v === 'africa'

/** Regions worth asking about (ids match lib/testbuilder/mapData.ts). */
export const MAP_TARGETS: Record<MapId, string[]> = {
  za: ['northern_cape', 'kwazulu_natal', 'free_state', 'eastern_cape', 'limpopo', 'north_west', 'mpumalanga', 'western_cape', 'gauteng'],
  africa: ['egypt', 'nigeria', 'kenya', 'ethiopia', 'south_africa', 'namibia', 'botswana', 'zimbabwe', 'zambia', 'mozambique', 'angola', 'tanzania', 'morocco', 'algeria', 'ghana', 'madagascar', 'dem_rep_congo', 'sudan', 'libya', 'mali', 'senegal', 'uganda', 'somalia', 'chad'],
}

export interface MapDot { letter: string; x: number; y: number }
export interface MapLineAnswer { x1: number; y1: number; x2: number; y2: number }

export function cleanPicks(value: unknown, targets: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  const v = (value && typeof value === 'object' ? (value as Record<string, unknown>).picks : null) as Record<string, unknown> | null
  if (!v || typeof v !== 'object') return out
  for (const t of targets) if (typeof v[t] === 'string' && /^[a-z0-9_]{1,40}$/.test(v[t] as string)) out[t] = v[t] as string
  return out
}

export function cleanMapLine(value: unknown): MapLineAnswer | null {
  const l = (value && typeof value === 'object' ? (value as Record<string, unknown>).line : null) as Record<string, unknown> | null
  if (!l) return null
  const n = ['x1', 'y1', 'x2', 'y2'].map(k => l[k])
  return n.every(x => typeof x === 'number' && Number.isFinite(x) && (x as number) > -50 && (x as number) < 800)
    ? { x1: n[0] as number, y1: n[1] as number, x2: n[2] as number, y2: n[3] as number }
    : null
}

const DOT_REACH = 26
const nearest = (dots: MapDot[], x: number, y: number) => {
  let best: MapDot | null = null
  let bd = Infinity
  for (const d of dots) {
    const dist = Math.hypot(d.x - x, d.y - y)
    if (dist < bd) { bd = dist; best = d }
  }
  return bd <= DOT_REACH ? best : null
}

/** Did the line connect the two right dots? Either direction counts. */
export function checkMapLine(dots: MapDot[], from: string, to: string, line: MapAnswerLike | null): { start: boolean; end: boolean } {
  if (!line) return { start: false, end: false }
  const a = nearest(dots, line.x1, line.y1)?.letter
  const b = nearest(dots, line.x2, line.y2)?.letter
  const direct = { start: a === from, end: b === to }
  const reversed = { start: a === to, end: b === from }
  const score = (r: { start: boolean; end: boolean }) => Number(r.start) + Number(r.end)
  return score(reversed) > score(direct) ? reversed : direct
}
type MapAnswerLike = MapLineAnswer
