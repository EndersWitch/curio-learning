// Hands-on question types built and marked by code: label a diagram, set a
// clock, draw a straight-line graph, draw an angle, tap on the periodic table.
// Shared by the server (building, marking) and the browser (cleaning answers).

import { DIAGRAMS, DIAGRAM_IDS } from '@/lib/testbuilder/diagrams'
import { ELEMENTS, PERIODIC_GROUPS, type El } from '@/lib/testbuilder/periodic'

export const HANDSON_TYPES = ['label', 'clockset', 'linedraw', 'angledraw', 'periodic'] as const
export type HandsOnType = (typeof HANDSON_TYPES)[number]
export const isHandsOnType = (t: string): t is HandsOnType => (HANDSON_TYPES as readonly string[]).includes(t)
export { DIAGRAM_IDS }

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!
const shuffle = <T,>(xs: T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j]!, a[i]!] } return a }
const MINUS = '−'
export type Flag = { awarded: boolean; reason: string }

export interface Built { type: HandsOnType; question: string; marks: number; spec: Record<string, unknown>; answerSpec: Record<string, unknown>; points: string[] }

// ---------------- label a diagram ----------------
export interface LabelSpec { svg: string; pins: number[]; bank: string[] }
export function cleanLabels(v: unknown, spec: LabelSpec): Record<string, string> {
  const o = obj(obj(v).labels), out: Record<string, string> = {}
  for (const n of spec.pins) { const s = o[String(n)]; if (typeof s === 'string' && spec.bank.includes(s)) out[String(n)] = s }
  return out
}
function buildLabel(id: string, grade: number): Built | null {
  const d = DIAGRAMS.find(x => x.id === id)
  if (!d) return null
  const count = grade <= 6 ? 4 : Math.min(d.parts.length, grade <= 8 ? 5 : 6)
  const chosen = shuffle(d.parts).slice(0, Math.min(count, d.parts.length))
  const numbers = new Map(chosen.map((p, i) => [p.name, i + 1] as [string, number]))
  const extra = shuffle(d.parts.filter(p => !numbers.has(p.name))).slice(0, 1).map(p => p.name)
  const bank = shuffle([...chosen.map(p => p.name), ...extra])
  return {
    type: 'label',
    question: `Label the parts of the ${d.title.toLowerCase()}. Choose the right name for each number.`,
    marks: chosen.length,
    spec: { svg: d.svg(numbers), pins: chosen.map((_, i) => i + 1), bank } satisfies LabelSpec,
    answerSpec: { labels: Object.fromEntries(chosen.map((p, i) => [String(i + 1), p.name])) },
    points: chosen.map((_, i) => `Labelled part ${i + 1} correctly`),
  }
}

// ---------------- set a clock ----------------
export interface ClockSpec { snap: number; hourOnly?: boolean }
export function cleanClock(v: unknown, spec: ClockSpec): { h: number; m: number } | null {
  const o = obj(v)
  if (typeof o.h === 'number' && typeof o.m === 'number' && Number.isInteger(o.h) && Number.isInteger(o.m) && o.h >= 0 && o.h <= 11 && o.m >= 0 && o.m <= 59 && o.m % spec.snap === 0) return { h: o.h, m: o.m }
  return null
}
export const clockText = (h: number, m: number) => `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`
function buildClock(grade: number): Built {
  const easy = grade <= 3
  const h = rnd(0, 11)
  const m = easy ? pick([0, 30]) : grade <= 5 ? pick([0, 15, 30, 45]) : pick([5, 10, 20, 25, 35, 40, 50, 55, 15, 45])
  const words = easy ? (m === 0 ? `${h === 0 ? 12 : h} o'clock` : `half past ${h === 0 ? 12 : h}`) : clockText(h, m)
  return {
    type: 'clockset',
    question: `Set the clock to ${words}. Drag the hands. The short hand is the hour hand and the long hand is the minute hand.`,
    marks: 2, spec: { snap: easy ? 30 : 5 } satisfies ClockSpec, answerSpec: { h, m },
    points: ['Put the hour hand in the right place', 'Put the minute hand in the right place'],
  }
}

// ---------------- draw a straight line on a grid ----------------
export interface LineSpec { range: number; equation: string }
export function cleanLinePts(v: unknown, range: number): { x: number; y: number }[] {
  const a = obj(v).pts
  if (!Array.isArray(a)) return []
  return a.flatMap(p => {
    const o = obj(p)
    return typeof o.x === 'number' && typeof o.y === 'number' && Number.isInteger(o.x) && Number.isInteger(o.y) && Math.abs(o.x) <= range && Math.abs(o.y) <= range ? [{ x: o.x, y: o.y }] : []
  }).slice(0, 2)
}
const frac = (m: number) => (Number.isInteger(m) ? String(m) : m === 0.5 ? '½' : m === -0.5 ? `${MINUS}½` : String(m))
function lineEq(m: number, c: number): string {
  const mm = m === 1 ? 'x' : m === -1 ? `${MINUS}x` : `${frac(m).replace('-', MINUS)}x`
  return c === 0 ? `y = ${mm}` : `y = ${mm} ${c > 0 ? '+' : MINUS} ${Math.abs(c)}`
}
export const onLine = (m: number, c: number, p: { x: number; y: number }) => Math.abs(p.y - (m * p.x + c)) < 1e-9
function buildLine(): Built {
  const R = 6
  for (let i = 0; i < 200; i++) {
    const m = pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]), c = rnd(-4, 4)
    const pts: { x: number; y: number }[] = []
    for (let x = -R; x <= R; x++) { const y = m * x + c; if (Number.isInteger(y) && Math.abs(y) <= R) pts.push({ x, y }) }
    if (pts.length < 3) continue
    return {
      type: 'linedraw',
      question: `Draw the graph of ${lineEq(m, c)}. Click two points that are on the line. The line is drawn through them.`,
      marks: 2, spec: { range: R, equation: lineEq(m, c) } satisfies LineSpec, answerSpec: { m, c },
      points: ['First point lies on the line', 'Second point lies on the line and is a different point'],
    }
  }
  return buildLine()
}

// ---------------- draw an angle ----------------
export interface AngleSpec { target: number }
export function cleanAngle(v: unknown): { a: number } | null {
  const o = obj(v)
  return typeof o.a === 'number' && Number.isFinite(o.a) && o.a >= 0 && o.a <= 180 ? { a: Math.round(o.a) } : null
}
function buildAngle(grade: number): Built {
  const a = grade <= 6 ? rnd(2, 17) * 10 : rnd(4, 34) * 5
  return {
    type: 'angledraw',
    question: `Draw an angle of ${a}°. The vertex and the base line are given. Drag the end of the arm to the right place.`,
    marks: 1, spec: { target: a } satisfies AngleSpec, answerSpec: { a, tol: 3 },
    points: [`Drew an angle of ${a}° (within 3°)`],
  }
}

// ---------------- periodic table ----------------
export interface PeriodicSpec { instruction: string; count: number }
export function cleanElements(v: unknown): number[] {
  const a = obj(v).sel
  return Array.isArray(a) ? [...new Set(a.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 118))].sort((x, y) => x - y) : []
}
function buildPeriodic(grade: number): Built {
  const kind = pick(['symbol', 'name', 'group', 'group', 'position'] as const)
  let instruction = '', targets: El[] = []
  if (kind === 'symbol' || kind === 'name') {
    const e = pick(ELEMENTS.filter(x => x.z <= (grade <= 9 ? 20 : grade <= 10 ? 36 : 86)))
    targets = [e]
    instruction = kind === 'symbol' ? `Tap the element with the symbol ${e.sym}.` : `Tap the element ${e.name.toLowerCase()}.`
  } else if (kind === 'group') {
    const g = pick(PERIODIC_GROUPS.filter(x => x.minGrade <= Math.max(grade, 8)))
    targets = ELEMENTS.filter(e => e.group === g.group && !(g.skipH && e.z === 1))
    instruction = `Tap all the ${g.plural} shown in the table.`
  } else {
    const e = pick(ELEMENTS.filter(x => x.z > 2 && x.z <= 18 && !(x.group >= 3 && x.group <= 12)))
    targets = [e]
    const period = e.row
    instruction = `Tap the element in Period ${period} and Group ${e.group}.`
  }
  return {
    type: 'periodic', question: instruction, marks: targets.length,
    spec: { instruction, count: targets.length } satisfies PeriodicSpec, answerSpec: { targets: targets.map(t => t.z) },
    points: targets.map(t => `Tapped ${t.name}`),
  }
}

export function buildHandsOn(kind: string, opts: { grade: number; diagram?: string }): Built | null {
  try {
    if (kind === 'label') return buildLabel(opts.diagram ?? pick(DIAGRAM_IDS), opts.grade)
    if (kind === 'clockset') return buildClock(opts.grade)
    if (kind === 'linedraw') return buildLine()
    if (kind === 'angledraw') return buildAngle(opts.grade)
    if (kind === 'periodic') return buildPeriodic(opts.grade)
  } catch (err) { console.error('[tests] handson failed', kind, err) }
  return null
}

// ---------------- marking ----------------
export function markHandsOn(type: string, spec: unknown, key: unknown, given: unknown): Flag[] | null {
  const k = obj(key)
  if (type === 'label') {
    const s = spec as LabelSpec, want = obj(k.labels) as Record<string, string>, got = cleanLabels(given, s)
    return s.pins.map(n => {
      const g = got[String(n)], w = want[String(n)]!
      return g === w ? { awarded: true, reason: `Number ${n} is the ${w.toLowerCase()}.` } : { awarded: false, reason: g ? `Number ${n} is not the ${g.toLowerCase()}. It is the ${w.toLowerCase()}.` : `Number ${n} is the ${w.toLowerCase()}. You didn't label it.` }
    })
  }
  if (type === 'clockset') {
    const s = spec as ClockSpec, g = cleanClock(given, s), h = Number(k.h), m = Number(k.m)
    return [
      g && g.h === h % 12 ? { awarded: true, reason: 'The hour hand is in the right place.' } : { awarded: false, reason: g ? `The hour hand should point to ${h === 0 ? 12 : h} (the short hand).` : "You didn't set the clock." },
      g && g.m === m ? { awarded: true, reason: 'The minute hand is in the right place.' } : { awarded: false, reason: g ? `The minute hand should show ${m} minutes. Each number on the clock face is 5 minutes.` : "You didn't set the clock." },
    ]
  }
  if (type === 'linedraw') {
    const s = spec as LineSpec, pts = cleanLinePts(given, s.range), m = Number(k.m), c = Number(k.c)
    const p1 = pts[0], p2 = pts[1]
    return [
      p1 && onLine(m, c, p1) ? { awarded: true, reason: `(${p1.x}; ${p1.y}) is on the line ${s.equation}.` } : { awarded: false, reason: p1 ? `(${p1.x}; ${p1.y}) is not on ${s.equation}. Put your x value into the equation and work out y.` : "You didn't place a point." },
      p2 && p1 && onLine(m, c, p2) && (p2.x !== p1.x || p2.y !== p1.y) ? { awarded: true, reason: `(${p2.x}; ${p2.y}) is also on the line.` } : { awarded: false, reason: !p2 ? 'You need two points to draw a line.' : p1 && p2.x === p1.x && p2.y === p1.y ? 'Your two points are the same point.' : `(${p2.x}; ${p2.y}) is not on ${s.equation}.` },
    ]
  }
  if (type === 'angledraw') {
    const g = cleanAngle(given), a = Number(k.a), tol = Number(k.tol ?? 3)
    return [g && Math.abs(g.a - a) <= tol ? { awarded: true, reason: `Yes, that is about ${a}°.` } : { awarded: false, reason: g ? `Your angle is about ${g.a}°. It needed to be ${a}° (within 3°). Line the protractor's 0 with the base line.` : "You didn't draw an angle." }]
  }
  if (type === 'periodic') {
    const want = (Array.isArray(k.targets) ? k.targets : []) as number[], got = cleanElements(given)
    const name = (z: number) => ELEMENTS.find(e => e.z === z)?.name ?? ''
    const hits = want.filter(z => got.includes(z)), wrong = got.filter(z => !want.includes(z))
    const score = Math.max(0, hits.length - wrong.length)
    return want.map((z, j) => {
      if (j < score) return { awarded: true, reason: j < hits.length ? `${name(hits[j]!)} is right.` : 'Good find.' }
      if (got.length === 0) return { awarded: false, reason: "You didn't tap anything." }
      const missed = want.filter(x => !got.includes(x))
      if (j >= hits.length && missed.length) return { awarded: false, reason: `You missed ${name(missed[Math.min(j - hits.length, missed.length - 1)]!)}.` }
      return { awarded: false, reason: `A wrong tap (${wrong.map(name).join(', ')}) cancelled out a mark.` }
    })
  }
  return null
}
