// Server-and-client. Euclidean geometry (angles) questions built from templates:
// the diagram is drawn by code and the answer is worked out by code, so both are
// always right. The learner types a value and picks the geometry reason, as in a
// CAPS memo ("alt. angles; AB ∥ CD").

export const REASONS = [
  { id: 'line', label: 'Angles on a straight line' },
  { id: 'opp', label: 'Vertically opposite angles' },
  { id: 'corr', label: 'Corresponding angles (parallel lines)' },
  { id: 'alt', label: 'Alternate angles (parallel lines)' },
  { id: 'coint', label: 'Co-interior angles (parallel lines)' },
  { id: 'tri', label: 'Sum of the angles in a triangle' },
  { id: 'ext', label: 'Exterior angle of a triangle' },
  { id: 'iso', label: 'Base angles of an isosceles triangle' },
  { id: 'quad', label: 'Sum of the angles in a quadrilateral' },
  { id: 'centre', label: 'Angle at the centre is twice the angle at the circumference' },
  { id: 'semi', label: 'Angle in a semicircle' },
  { id: 'same', label: 'Angles in the same segment' },
  { id: 'cyc', label: 'Opposite angles of a cyclic quadrilateral' },
  { id: 'tan', label: 'Tangent is perpendicular to the radius' },
  { id: 'rad', label: 'Radii are equal (isosceles triangle)' },
] as const
export type ReasonId = (typeof REASONS)[number]['id']
export const REASON_IDS = REASONS.map(r => r.id) as string[]
export const reasonLabel = (id: string) => REASONS.find(r => r.id === id)?.label ?? id

export type AngleKind = 'line' | 'opposite' | 'parallel' | 'triangle' | 'isosceles' | 'exterior'
export const ANGLE_KINDS: AngleKind[] = ['line', 'opposite', 'parallel', 'triangle', 'isosceles', 'exterior']

export interface GeometrySpec { svg: string; fields: { id: string; label: string; unit?: string }[]; reasons: { id: string; label: string }[] }
export interface GeometryKey { values: Record<string, number>; reasons: string[]; working: string; tol?: number }
export interface GeometryQuestion { question: string; spec: GeometrySpec; key: GeometryKey; marks: number; points: string[] }

export const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
export const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!
export const rad = (d: number) => (d * Math.PI) / 180
export const f = (n: number) => Math.round(n * 10) / 10
const MINUS = '−'

// ---- drawing ---------------------------------------------------------------
export const INK = '#222', RUST = '#b2431f'
export const W = 360, H = 240

export class Svg {
  parts: string[] = []
  line(x1: number, y1: number, x2: number, y2: number, w = 2, c = INK) {
    this.parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`)
  }
  text(x: number, y: number, s: string, c = INK, size = 13, weight = 700) {
    this.parts.push(`<text x="${f(x)}" y="${f(y + size * 0.35)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${c}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`)
  }
  dot(x: number, y: number, r = 3) { this.parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${INK}"/>`) }
  // Arc between two directions (degrees, anticlockwise, y up) around a point.
  arc(cx: number, cy: number, a1: number, a2: number, r = 16) {
    const p = (a: number) => `${f(cx + r * Math.cos(rad(a)))} ${f(cy - r * Math.sin(rad(a)))}`
    this.parts.push(`<path d="M ${p(a1)} A ${r} ${r} 0 0 0 ${p(a2)}" fill="none" stroke="${RUST}" stroke-width="1.6"/>`)
  }
  // Label for the wedge between directions a1 → a2 (anticlockwise).
  wedge(cx: number, cy: number, a1: number, a2: number, label: string, R = 46, c = RUST) {
    this.arc(cx, cy, a1, a2)
    const b = (a1 + a2) / 2
    this.text(cx + R * Math.cos(rad(b)), cy - R * Math.sin(rad(b)), label, c)
  }
  // Small arrow-heads on a line, the sign for parallel lines.
  chevron(x: number, y: number) {
    this.parts.push(`<path d="M ${f(x - 7)} ${f(y - 6)} L ${f(x)} ${f(y)} L ${f(x - 7)} ${f(y + 6)}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`)
  }
  tick(x1: number, y1: number, x2: number, y2: number) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1
    const nx = -dy / len, ny = dx / len
    this.line(mx - nx * 6, my - ny * 6, mx + nx * 6, my + ny * 6, 2, INK)
  }
  out() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${this.parts.join('')}</svg>`
  }
}

// ---- algebra helpers -------------------------------------------------------
const VARS = ['x', 'a', 'b', 'y', 'p']
function expr(m: number, c: number, v: string) { return `(${m === 1 ? '' : m}${v}+${c})°` }
// Two expressions that are EQUAL, or that add to 180, at a whole-number value of the variable.
function pair(mode: 'equal' | 'sum180', lo = 65, hi = 115): { v: number; m1: number; c1: number; m2: number; c2: number; val1: number; val2: number } {
  for (let i = 0; i < 400; i++) {
    const v = rnd(5, 30), m1 = rnd(1, 5), m2 = rnd(1, 5)
    if (m1 === m2 && mode === 'equal') continue
    const val1 = rnd(lo, hi)
    const c1 = val1 - m1 * v
    const val2 = mode === 'equal' ? val1 : 180 - val1
    const c2 = val2 - m2 * v
    if (c1 < 5 || c1 > 90 || c2 < 5 || c2 > 90) continue
    if (mode === 'sum180' && (val1 === 90 || val1 < lo || val1 > hi || 180 - val1 < lo)) continue
    return { v, m1, c1, m2, c2, val1, val2 }
  }
  return { v: 15, m1: 5, c1: 40, m2: 1, c2: 100, val1: 115, val2: 115 }
}

const coef = (m: number, v: string) => `${m === 1 ? '' : m}${v}`

/** A diagram question: one or more typed fields (each worth a mark) and, when reasons are given, a reason (one more mark). */
export function mk(
  question: string, svg: string, fields: { id: string; label: string; unit?: string }[], values: Record<string, number>,
  reasons: string[], working: string, tol = 0,
): GeometryQuestion {
  return {
    question,
    spec: { svg, fields, reasons: reasons.length ? REASONS.map(r => ({ id: r.id, label: r.label })) : [] },
    key: { values, reasons, working, ...(tol ? { tol } : {}) },
    marks: fields.length + (reasons.length ? 1 : 0),
    points: [...fields.map(fl => `Found the correct ${fl.label.replace(/\s*=\s*$/, '')}`), ...(reasons.length ? ['Gave the correct geometry reason'] : [])],
  }
}

function build(question: string, svg: string, v: string | null, answer: number, reasons: ReasonId[], working: string): GeometryQuestion {
  return mk(question, svg, [{ id: 'v', label: `${v ?? 'x'} =`, unit: '\u00b0' }], { v: answer }, reasons, working)
}

// ---- templates -------------------------------------------------------------
function straightLine(algebra: boolean): GeometryQuestion {
  const s = new Svg()
  const cx = 180, cy = 150
  s.line(30, cy, 330, cy)
  const p = algebra ? pair('sum180') : null
  const theta = p ? p.val1 : rnd(40, 140)
  s.line(cx, cy, cx + 120 * Math.cos(rad(theta)), cy - 120 * Math.sin(rad(theta)))
  s.dot(cx, cy)
  if (p) {
    const v = pick(VARS)
    s.wedge(cx, cy, 0, theta, expr(p.m1, p.c1, v), 52)
    s.wedge(cx, cy, theta, 180, expr(p.m2, p.c2, v), 52)
    return build(`Find the value of ${v}. Give a reason.`, s.out(), v, p.v, ['line'], `${expr(p.m1, p.c1, v)} + ${expr(p.m2, p.c2, v)} = 180° (angles on a straight line), so ${coef(p.m1 + p.m2, v)} + ${p.c1 + p.c2} = 180, ${coef(p.m1 + p.m2, v)} = ${180 - p.c1 - p.c2}, ${v} = ${p.v}.`)
  }
  s.wedge(cx, cy, 0, theta, `${theta}°`, 42)
  s.wedge(cx, cy, theta, 180, 'x', 42)
  return build('Find the size of angle x. Give a reason.', s.out(), 'x', 180 - theta, ['line'], `x = 180° ${MINUS} ${theta}° = ${180 - theta}° (angles on a straight line).`)
}

function opposite(algebra: boolean): GeometryQuestion {
  const s = new Svg()
  const cx = 180, cy = 120
  const pp = algebra ? pair('equal', 45, 80) : null
  const t = rnd(15, 55), phi = pp ? pp.val1 : rnd(45, 80) // line 1 at t, line 2 at t+phi
  const dirs = [t, t + phi, t + 180, t + phi + 180]
  for (const d of dirs.slice(0, 2)) {
    s.line(cx + 130 * Math.cos(rad(d)), cy - 130 * Math.sin(rad(d)), cx - 130 * Math.cos(rad(d)), cy + 130 * Math.sin(rad(d)))
  }
  s.dot(cx, cy)
  if (algebra) {
    const v = pick(VARS)
    const p = pp!
    s.wedge(cx, cy, dirs[0]!, dirs[1]!, expr(p.m1, p.c1, v), 62)
    s.wedge(cx, cy, dirs[2]!, dirs[3]!, expr(p.m2, p.c2, v), 62)
    return build(`Find the value of ${v}. Give a reason.`, s.out(), v, p.v, ['opp'], `${expr(p.m1, p.c1, v)} = ${expr(p.m2, p.c2, v)} (vertically opposite angles), so ${p.m1 > p.m2 ? `${coef(p.m1 - p.m2, v)} = ${p.c2 - p.c1}` : `${coef(p.m2 - p.m1, v)} = ${p.c1 - p.c2}`}, ${v} = ${p.v}.`)
  }
  s.wedge(cx, cy, dirs[0]!, dirs[1]!, `${phi}°`, 48)
  s.wedge(cx, cy, dirs[2]!, dirs[3]!, 'x', 48)
  return build('Find the size of angle x. Give a reason.', s.out(), 'x', phi, ['opp'], `x = ${phi}° (vertically opposite angles).`)
}

type Wedge = 'NE' | 'NW' | 'SW' | 'SE'
function parallel(algebra: boolean): GeometryQuestion {
  const rel = pick(['corr', 'alt', 'coint'] as const)
  let w1: Wedge, w2: Wedge
  if (rel === 'corr') { w1 = w2 = pick(['NE', 'NW', 'SW', 'SE'] as const) }
  else if (rel === 'alt') { [w1, w2] = pick([['SW', 'NE'], ['SE', 'NW']] as const) }
  else { [w1, w2] = pick([['SE', 'NE'], ['SW', 'NW']] as const) }

  const sameSize = (a: Wedge, b: Wedge) => (a === 'NE' || a === 'SW') === (b === 'NE' || b === 'SW')
  const pp = algebra ? pair(sameSize(w1, w2) ? 'equal' : 'sum180') : null
  const w1IsTheta = w1 === 'NE' || w1 === 'SW'
  const theta = pp ? (w1IsTheta ? pp.val1 : 180 - pp.val1) : pick([55, 60, 65, 70, 110, 115, 120, 125])
  const s = new Svg()
  const y1 = 75, y2 = 165
  const cot = Math.cos(rad(theta)) / Math.sin(rad(theta))
  const p1 = { x: 180 + 45 * cot, y: y1 }, p2 = { x: 180 - 45 * cot, y: y2 }
  s.line(20, y1, 340, y1); s.line(20, y2, 340, y2)
  s.chevron(330, y1); s.chevron(330, y2)
  const ux = Math.cos(rad(theta)), uy = -Math.sin(rad(theta))
  s.line(p1.x + ux * 48, p1.y + uy * 48, p2.x - ux * 48, p2.y - uy * 48)
  s.dot(p1.x, p1.y); s.dot(p2.x, p2.y)

  const range: Record<Wedge, [number, number]> = { NE: [0, theta], NW: [theta, 180], SW: [180, 180 + theta], SE: [180 + theta, 360] }
  const size = (w: Wedge) => (w === 'NE' || w === 'SW' ? theta : 180 - theta)
  const v1 = size(w1), v2 = size(w2)
  const reason: ReasonId = rel

  if (algebra) {
    const v = pick(VARS)
    const p = pp!
    s.wedge(p1.x, p1.y, range[w1][0], range[w1][1], expr(p.m1, p.c1, v), w1[0] === 'S' ? 46 : 52)
    s.wedge(p2.x, p2.y, range[w2][0], range[w2][1], expr(p.m2, p.c2, v), w2[0] === 'N' ? 46 : 52)
    const eq = v1 === v2
    const working = eq
      ? `${expr(p.m1, p.c1, v)} = ${expr(p.m2, p.c2, v)} (${reasonLabel(rel).toLowerCase()}), so ${v} = ${p.v}.`
      : `${expr(p.m1, p.c1, v)} + ${expr(p.m2, p.c2, v)} = 180° (co-interior angles, parallel lines), so ${coef(p.m1 + p.m2, v)} + ${p.c1 + p.c2} = 180, ${v} = ${p.v}.`
    return build(`The two horizontal lines are parallel. Find the value of ${v}. Give a reason.`, s.out(), v, p.v, [reason], working)
  }
  s.wedge(p1.x, p1.y, range[w1][0], range[w1][1], `${v1}°`, 44)
  s.wedge(p2.x, p2.y, range[w2][0], range[w2][1], 'x', w2[0] === 'N' ? 34 : 44)
  const answer = v2
  const working = v1 === v2 ? `x = ${v1}° (${reasonLabel(rel).toLowerCase()}).` : `x = 180° ${MINUS} ${v1}° = ${answer}° (${reasonLabel(rel).toLowerCase()}).`
  return build('The two horizontal lines are parallel. Find the size of angle x. Give a reason.', s.out(), 'x', answer, [reason], working)
}

// Triangle with interior angles A (left), B (right), C (apex), fitted into the picture.
function triangle(A: number, B: number, extra: (s: Svg, P: { x: number; y: number }, Q: { x: number; y: number }, R: { x: number; y: number }) => void, labels: [string, string, string], opts: { exterior?: boolean; ticks?: boolean } = {}) {
  const C = 180 - A - B
  const base = 100
  const P = { x: 0, y: 0 }
  const Q = { x: base, y: 0 }
  const lenPR = (base * Math.sin(rad(B))) / Math.sin(rad(C))
  const R = { x: lenPR * Math.cos(rad(A)), y: lenPR * Math.sin(rad(A)) } // y up
  const minX = Math.min(P.x, R.x), maxX = Math.max(Q.x, R.x)
  const extra_r = opts.exterior ? 0.5 * base : 0
  const padX = 60, padY = 40
  const scale = Math.min((W - 2 * padX) / (maxX + extra_r - minX), (H - 2 * padY) / R.y)
  const map = (p: { x: number; y: number }) => ({ x: padX + ((W - 2 * padX) - (maxX + extra_r - minX) * scale) / 2 + (p.x - minX) * scale, y: H - padY - ((H - 2 * padY) - R.y * scale) / 2 - p.y * scale })
  const p = map(P), q = map(Q), r = map(R)
  const s = new Svg()
  s.line(p.x, p.y, q.x, q.y); s.line(q.x, q.y, r.x, r.y); s.line(r.x, r.y, p.x, p.y)
  if (opts.exterior) s.line(q.x, q.y, q.x + 0.5 * base * scale, q.y)
  if (opts.ticks) { s.tick(p.x, p.y, r.x, r.y); s.tick(q.x, q.y, r.x, r.y) }
  const angleAt = (from: { x: number; y: number }, to: { x: number; y: number }) => (Math.atan2(-(to.y - from.y), to.x - from.x) * 180) / Math.PI
  const vertex = (v: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }, label: string) => {
    let a1 = angleAt(v, a), a2 = angleAt(v, b)
    while (a2 < a1) a2 += 360
    if (a2 - a1 > 180) { const t = a1; a1 = a2; a2 = t + 360 }
    s.arc(v.x, v.y, a1, a2, 18)
    const bis = (a1 + a2) / 2
    // Label sits outside the corner so it never crowds the lines.
    s.text(v.x - 26 * Math.cos(rad(bis)), v.y + 26 * Math.sin(rad(bis)), label, RUST)
  }
  vertex(p, q, r, labels[0]); vertex(q, r, p, labels[1]); vertex(r, p, q, labels[2])
  extra(s, p, q, r)
  return { s, p, q, r, C }
}

function triangleSum(algebra: boolean): GeometryQuestion {
  if (algebra) {
    const v = pick(VARS)
    // angles m1 v, m2 v + c, ... that sum to 180 at a whole v
    for (let i = 0; i < 400; i++) {
      const x = rnd(8, 30), m1 = rnd(1, 4), m2 = rnd(1, 4), m3 = rnd(1, 4)
      const total = (m1 + m2 + m3) * x
      const c = 180 - total
      if (c < 5 || c > 80) continue
      const A = m1 * x, B = m2 * x, C = m3 * x + c
      if (A < 35 || B < 35 || C < 35 || A > 110 || B > 110 || C > 110) continue
      const lab = (m: number, k: number) => (k ? `(${coef(m, v)}+${k})\u00b0` : `${coef(m, v)}\u00b0`)
      const { s } = triangle(A, B, () => {}, [lab(m1, 0), lab(m2, 0), lab(m3, c)])
      return build(`Find the value of ${v}. Give a reason.`, s.out(), v, x, ['tri'], `${coef(m1, v)} + ${coef(m2, v)} + (${coef(m3, v)} + ${c}) = 180° (sum of the angles in a triangle), so ${m1 + m2 + m3}${v} = ${180 - c}, ${v} = ${x}.`)
    }
  }
  let A = rnd(40, 85), B = rnd(40, 85)
  if (A + B > 135) B = 135 - A
  const C = 180 - A - B
  const { s } = triangle(A, B, () => {}, [`${A}°`, `${B}°`, 'x'])
  return build('Find the size of angle x. Give a reason.', s.out(), 'x', C, ['tri'], `x = 180° ${MINUS} ${A}° ${MINUS} ${B}° = ${C}° (sum of the angles in a triangle).`)
}

function isosceles(): GeometryQuestion {
  const base = rnd(40, 75)
  const apex = 180 - 2 * base
  const { s } = triangle(base, base, () => {}, ['x', `${base}°`, `${apex}°`], { ticks: true })
  // Ask for the base angle that is not given: angle x at the left, with the right base angle shown too is trivial,
  // so show the apex only.
  const t = triangle(base, base, () => {}, ['x', '', `${apex}°`], { ticks: true })
  void s
  return build('The two sides marked with a dash are equal. Find the size of angle x. Give a reason.', t.s.out(), 'x', base, ['iso', 'tri'], `x = (180° ${MINUS} ${apex}°) ÷ 2 = ${base}° (base angles of an isosceles triangle, and the sum of the angles in a triangle).`)
}

function exterior(): GeometryQuestion {
  let A = rnd(35, 80), B = rnd(40, 80)
  if (A + B > 140) B = 140 - A
  const C = 180 - A - B
  const ext = A + C
  // exterior angle at Q = 180 - B = A + C. Show A and C, ask for the exterior angle x at Q.
  const t = triangle(A, B, (s, _p, q) => { s.wedge(q.x, q.y, 0, 180 - B, 'x', 46) }, [`${A}°`, '', `${C}°`], { exterior: true })
  return build('Find the size of angle x. Give a reason.', t.s.out(), 'x', ext, ['ext'], `x = ${A}° + ${C}° = ${ext}° (exterior angle of a triangle equals the sum of the two interior opposite angles).`)
}

export function makeGeometry(kind: AngleKind, algebra: boolean): GeometryQuestion {
  switch (kind) {
    case 'line': return straightLine(algebra)
    case 'opposite': return opposite(algebra)
    case 'parallel': return parallel(algebra)
    case 'triangle': return triangleSum(algebra)
    case 'isosceles': return isosceles()
    case 'exterior': return exterior()
  }
}

// ---- learner answers & marking ---------------------------------------------
export function cleanGeometry(v: unknown, fieldIds: string[]): { fields: Record<string, string>; reason: string } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as { fields?: unknown; reason?: unknown }
  const fields: Record<string, string> = {}
  if (o.fields && typeof o.fields === 'object') {
    for (const id of fieldIds) {
      const raw = (o.fields as Record<string, unknown>)[id]
      if (typeof raw === 'string' && raw.trim()) fields[id] = raw.trim().slice(0, 12)
    }
  }
  const reason = typeof o.reason === 'string' && REASON_IDS.includes(o.reason) ? o.reason : ''
  return Object.keys(fields).length || reason ? { fields, reason } : null
}

export function toNumber(s: string | undefined): number | null {
  if (!s) return null
  const t = s.replace(/[\s°]/g, '').replace(',', '.').replace(/[−–]/g, '-')
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null
}
