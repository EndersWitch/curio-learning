// Plot, shade, order, match, pick and fill questions: specs, cleaners for what a
// learner sends, and marking. Plot and shade are built by code; order, match,
// pick and fill are written by the AI planner and blind-checked (interactiveGen).

export type Pt = { x: number; y: number }

const isStr = (v: unknown): v is string => typeof v === 'string'
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

// ---- plot --------------------------------------------------------------
export interface PlotSpec { mode: 'grid' | 'line'; range?: number; min?: number; max?: number; step?: number }
export function cleanPlot(v: unknown, spec: PlotSpec): { x: number; y: number } | { v: number } | null {
  const o = obj(v)
  if (spec.mode === 'grid') {
    const r = spec.range ?? 5
    if (typeof o.x === 'number' && typeof o.y === 'number' && Number.isInteger(o.x) && Number.isInteger(o.y) && Math.abs(o.x) <= r && Math.abs(o.y) <= r) return { x: o.x, y: o.y }
    return null
  }
  return typeof o.v === 'number' && Number.isFinite(o.v) && o.v >= (spec.min ?? 0) - 1e-9 && o.v <= (spec.max ?? 10) + 1e-9 ? { v: o.v } : null
}

// ---- shade -------------------------------------------------------------
export interface ShadeSpec { rows: number; cols: number }
export function cleanCells(v: unknown, spec: ShadeSpec): number[] {
  const arr = obj(v).cells
  if (!Array.isArray(arr)) return []
  const max = spec.rows * spec.cols
  return [...new Set(arr.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < max))].sort((a, b) => a - b)
}

// ---- order -------------------------------------------------------------
export interface OrderSpec { items: { id: string; text: string }[] }
export interface OrderKey { order: string[] }
export function cleanOrder(v: unknown, spec: OrderSpec): string[] | null {
  const arr = obj(v).order
  if (!Array.isArray(arr)) return null
  const ids = new Set(spec.items.map(i => i.id))
  const out = arr.filter((x): x is string => isStr(x) && ids.has(x))
  return new Set(out).size === out.length && out.length === spec.items.length ? out : null
}

// ---- match -------------------------------------------------------------
export interface MatchSpec { left: { id: string; text: string }[]; right: { id: string; text: string }[] }
export interface MatchKey { pairs: Record<string, string> }
export function cleanMatch(v: unknown, spec: MatchSpec): Record<string, string> {
  const pairs = obj(obj(v).pairs)
  const rights = new Set(spec.right.map(r => r.id))
  const used = new Set<string>()
  const out: Record<string, string> = {}
  for (const l of spec.left) {
    const r = pairs[l.id]
    if (isStr(r) && rights.has(r) && !used.has(r)) { out[l.id] = r; used.add(r) }
  }
  return out
}

// ---- pick --------------------------------------------------------------
export interface PickSpec { words: string[] }
export interface PickKey { targets: number[] }
export function cleanPicked(v: unknown, spec: PickSpec): number[] {
  const arr = obj(v).picked
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < spec.words.length))].sort((a, b) => a - b)
}
export const stripWord = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()

// ---- fill --------------------------------------------------------------
export interface FillSpec { parts: string[]; bank: string[] } // parts.length = blanks + 1
export interface FillKey { answers: string[] }
export function cleanFills(v: unknown, spec: FillSpec): Record<string, string> {
  const fills = obj(obj(v).fills)
  const out: Record<string, string> = {}
  const used = new Set<string>()
  for (let i = 0; i < spec.parts.length - 1; i++) {
    const w = fills[String(i)]
    if (isStr(w) && spec.bank.includes(w) && !used.has(w)) { out[String(i)] = w; used.add(w) }
  }
  return out
}

// ---- marking -----------------------------------------------------------
export interface Flag { awarded: boolean; reason: string }

export function markAuthored(type: string, spec: unknown, key: unknown, given: unknown, n: number): Flag[] | null {
  const k = obj(key)
  const flags: Flag[] = []
  if (type === 'plot') {
    const s = spec as PlotSpec, ans = cleanPlot(given, s)
    if (s.mode === 'grid') {
      const want = k as unknown as Pt, g = ans as Pt | null
      flags.push(g && g.x === want.x ? { awarded: true, reason: 'The x position is right.' } : { awarded: false, reason: g ? `Your point is at x = ${g.x}. The x coordinate is the first number: move left or right first.` : "You didn't place a point." })
      flags.push(g && g.y === want.y ? { awarded: true, reason: 'The y position is right.' } : { awarded: false, reason: g ? `Your point is at y = ${g.y}. The y coordinate is the second number: then move up or down.` : "You didn't place a point." })
    } else {
      const want = Number(k.v), g = ans as { v: number } | null, step = s.step ?? 1
      flags.push(g && Math.abs(g.v - want) <= step / 2 + 1e-9 ? { awarded: true, reason: 'Yes, that is where it goes on the number line.' } : { awarded: false, reason: g ? `You marked ${g.v}. The number belongs at ${want}.` : "You didn't mark the number line." })
    }
  } else if (type === 'shade') {
    const s = spec as ShadeSpec, cells = cleanCells(given, s), want = Number(k.count)
    flags.push(cells.length === want ? { awarded: true, reason: `Yes, ${want} of the ${s.rows * s.cols} equal parts is the right amount.` } : { awarded: false, reason: cells.length === 0 ? "You didn't shade anything." : `You shaded ${cells.length} parts. The fraction needs ${want} of the ${s.rows * s.cols} equal parts.` })
  } else if (type === 'order') {
    const s = spec as OrderSpec, want = (Array.isArray(k.order) ? k.order : []) as string[], got = cleanOrder(given, s)
    const text = (id: string) => s.items.find(i => i.id === id)?.text ?? ''
    want.forEach((id, pos) => {
      flags.push(got && got[pos] === id ? { awarded: true, reason: `"${text(id)}" is in the right place.` } : { awarded: false, reason: got ? `Position ${pos + 1} should be "${text(id)}".` : "You didn't put these in order." })
    })
  } else if (type === 'match') {
    const s = spec as MatchSpec, want = obj(k.pairs) as Record<string, string>, got = cleanMatch(given, s)
    const rt = (id: string) => s.right.find(r => r.id === id)?.text ?? ''
    for (const l of s.left) {
      flags.push(got[l.id] === want[l.id] ? { awarded: true, reason: `"${l.text}" goes with "${rt(want[l.id]!)}".` } : { awarded: false, reason: got[l.id] ? `"${l.text}" does not go with "${rt(got[l.id]!)}". It goes with "${rt(want[l.id]!)}".` : `"${l.text}" goes with "${rt(want[l.id]!)}". You didn't match it.` })
    }
  } else if (type === 'pick') {
    const s = spec as PickSpec, want = (Array.isArray(k.targets) ? k.targets : []) as number[], got = cleanPicked(given, s)
    const hits = want.filter(i => got.includes(i)), wrong = got.filter(i => !want.includes(i))
    const score = Math.max(0, hits.length - wrong.length)
    want.forEach((_, j) => {
      if (j < score) flags.push({ awarded: true, reason: j < hits.length ? `"${s.words[hits[j]!]}" is right.` : 'Good find.' })
      else if (got.length === 0) flags.push({ awarded: false, reason: "You didn't pick any words." })
      else if (hits.length < want.length && j >= hits.length) flags.push({ awarded: false, reason: `You missed "${s.words[want.filter(i => !got.includes(i))[j - hits.length] ?? want[j]!]}".` })
      else flags.push({ awarded: false, reason: `A wrong pick (${wrong.map(i => `"${s.words[i]}"`).join(', ')}) cancelled out a mark.` })
    })
  } else if (type === 'fill') {
    const s = spec as FillSpec, want = (Array.isArray(k.answers) ? k.answers : []) as string[], got = cleanFills(given, s)
    want.forEach((w, i) => {
      flags.push(got[String(i)] === w ? { awarded: true, reason: `"${w}" is right.` } : { awarded: false, reason: got[String(i)] ? `"${got[String(i)]}" doesn't fit there. The word is "${w}".` : `Blank ${i + 1} should be "${w}".` })
    })
  } else return null
  void n
  return flags
}

export function isAuthoredType(t: string) { return ['plot', 'shade', 'order', 'match', 'pick', 'fill'].includes(t) }
