// Server-only. Diagram questions drawn by code across maths, science and more.
// Every template draws its own picture and works out its own answer, so the
// answer is always right. The learner reads the picture and types the value(s).

import { INK, RUST, Svg, W, H, f, mk, pick, rad, rnd, REASONS, type GeometryQuestion } from '@/lib/testbuilder/geometry'

const DEG = '°'
const MINUS = '−'
const GREY = '#bbb', LIGHT = '#eef3f8', BLUE = '#3b7dd8', GREEN = '#2f8f5b', GOLD = '#e0a73a'

export interface DrawnInfo { id: string; use: string }
export const DRAWN: DrawnInfo[] = [
  { id: 'pythagoras', use: 'Grades 8-10 maths: a right-angled triangle, find the missing side.' },
  { id: 'trig', use: 'Grade 10 maths: right-angled triangle trigonometry, find a side from an angle.' },
  { id: 'area', use: 'Grades 5-9 maths: area of a rectangle, triangle, parallelogram, trapezium or circle from a drawn shape.' },
  { id: 'perimeter', use: 'Grades 4-9 maths: perimeter of a rectangle or square, or circumference of a circle.' },
  { id: 'quadrilateral', use: 'Grades 8-9 maths: find the missing angle of a drawn quadrilateral (angle sum 360).' },
  { id: 'circle', use: 'Grades 10-12 maths: circle geometry theorems (angle at the centre, semicircle, cyclic quadrilateral, tangent, same segment).' },
  { id: 'clock', use: 'Grades 3-5 maths: read the time on an analogue clock.' },
  { id: 'ruler', use: 'Grades 4-6 maths/natural science: read a length off a ruler.' },
  { id: 'protractor', use: 'Grades 5-7 maths: read an angle off a protractor.' },
  { id: 'fraction', use: 'Grades 3-7 maths: what fraction of a drawn shape is shaded.' },
  { id: 'barchart', use: 'Grades 4-9 maths: read a bar graph (a value, a difference or a total).' },
  { id: 'dotplot', use: 'Grades 6-10 maths: mean, median, mode or range from a dot plot.' },
  { id: 'pie', use: 'Grades 7-9 maths/economics: find the missing percentage on a pie chart.' },
  { id: 'coordinates', use: 'Grades 7-10 maths: read the coordinates of a point on a Cartesian plane.' },
  { id: 'gradient', use: 'Grades 9-11 maths: find the gradient of a drawn straight line.' },
  { id: 'linegraph', use: 'Grades 6-9 maths/natural science: read a value off a line graph.' },
  { id: 'blocks', use: 'Grades 2-4 maths: read the number shown by base-ten blocks.' },
  { id: 'thermometer', use: 'Grades 4-7 natural science: read a thermometer.' },
  { id: 'cylinder', use: 'Grades 5-9 natural science: read the volume in a measuring cylinder.' },
  { id: 'circuit', use: 'Grades 8-10 physical science: a drawn series circuit, calculate the current with Ohm\'s law.' },
  { id: 'wave', use: 'Grades 10-11 physical science: read the amplitude and wavelength from a drawn wave.' },
  { id: 'speedgraph', use: 'Grades 9-11 physical science: find the speed from a distance-time graph.' },
  { id: 'forces', use: 'Grades 7-10 natural/physical science: the resultant (net) force from drawn force arrows.' },
  { id: 'reflection', use: 'Grades 7-10 science: the angle of reflection at a drawn mirror.' },
  { id: 'supplydemand', use: 'Grades 10-12 economics: read the equilibrium price and quantity from a supply and demand graph.' },
  { id: 'atom', use: 'Grades 8-10 science: count the electrons in a drawn Bohr atom (atomic number and outer electrons).' },
  { id: 'balance', use: 'Grades 9-11 chemistry/physical science: balance a chemical equation by typing the coefficients.' },
]
export const DRAWN_IDS = DRAWN.map(d => d.id)

// ---- tiny drawing helpers --------------------------------------------------
const P = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.cos(rad(a)), y: cy - r * Math.sin(rad(a)) })
type Pt = { x: number; y: number }
function poly(s: Svg, pts: Pt[], fill = 'none', stroke = INK, w = 2) {
  s.parts.push(`<polygon points="${pts.map(p => `${f(p.x)},${f(p.y)}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`)
}
function rect(s: Svg, x: number, y: number, w: number, h: number, fill = 'none', stroke = INK, sw = 2) {
  s.parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`)
}
function circle(s: Svg, cx: number, cy: number, r: number, fill = 'none', stroke = INK, sw = 2) {
  s.parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`)
}
function dashed(s: Svg, a: Pt, b: Pt, c = GREY) {
  s.parts.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${c}" stroke-width="1.4" stroke-dasharray="5 4"/>`)
}
function rightMark(s: Svg, v: Pt, a: Pt, b: Pt, size = 12) {
  const ua = unit(v, a), ub = unit(v, b)
  const p1 = { x: v.x + ua.x * size, y: v.y + ua.y * size }, p2 = { x: v.x + (ua.x + ub.x) * size, y: v.y + (ua.y + ub.y) * size }, p3 = { x: v.x + ub.x * size, y: v.y + ub.y * size }
  s.parts.push(`<polyline points="${f(p1.x)},${f(p1.y)} ${f(p2.x)},${f(p2.y)} ${f(p3.x)},${f(p3.y)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`)
}
function unit(a: Pt, b: Pt): Pt { const d = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d } }
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
// A label pushed away from a line (outward = away from point `away`).
function sideLabel(s: Svg, a: Pt, b: Pt, away: Pt, text: string, gap = 16, color = INK) {
  const m = mid(a, b), d = unit(a, b)
  let n = { x: -d.y, y: d.x }
  if ((m.x + n.x - away.x) ** 2 + (m.y + n.y - away.y) ** 2 < (m.x - n.x - away.x) ** 2 + (m.y - n.y - away.y) ** 2) n = { x: -n.x, y: -n.y }
  s.text(m.x + n.x * gap, m.y + n.y * gap, text, color, 13)
}
// Angle label placed outside a corner.
function corner(s: Svg, v: Pt, a: Pt, b: Pt, label: string, r = 18, off = 28) {
  const ang = (p: Pt) => (Math.atan2(-(p.y - v.y), p.x - v.x) * 180) / Math.PI
  let a1 = ang(a), a2 = ang(b)
  while (a2 < a1) a2 += 360
  if (a2 - a1 > 180) { const t = a1; a1 = a2; a2 = t + 360 }
  s.arc(v.x, v.y, a1, a2, r)
  const bis = (a1 + a2) / 2
  s.text(v.x - off * Math.cos(rad(bis)), v.y + off * Math.sin(rad(bis)), label, RUST)
}
function gridBox(s: Svg, x0: number, y0: number, w: number, h: number, xs: number, ys: number) {
  for (let i = 0; i <= xs; i++) s.parts.push(`<line x1="${f(x0 + (w * i) / xs)}" y1="${y0}" x2="${f(x0 + (w * i) / xs)}" y2="${y0 + h}" stroke="#ddd" stroke-width="1"/>`)
  for (let j = 0; j <= ys; j++) s.parts.push(`<line x1="${x0}" y1="${f(y0 + (h * j) / ys)}" x2="${x0 + w}" y2="${f(y0 + (h * j) / ys)}" stroke="#ddd" stroke-width="1"/>`)
}
function txt(s: Svg, x: number, y: number, t: string, size = 11, color = '#555', anchor = 'middle', weight = 600) {
  s.parts.push(`<text x="${f(x)}" y="${f(y + size * 0.35)}" text-anchor="${anchor}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`)
}
const one = (id = 'v', label = 'x =', unit?: string) => [{ id, label, unit }]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

// ---- maths -----------------------------------------------------------------
function pythagoras(): GeometryQuestion {
  const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25], [12, 16, 20], [15, 20, 25], [20, 21, 29]] as const)
  const k = Math.min(230 / b, 150 / a)
  const Pp = { x: 55, y: 205 }, Q = { x: 55 + b * k, y: 205 }, R = { x: 55, y: 205 - a * k }
  const s = new Svg()
  poly(s, [Pp, Q, R]); rightMark(s, Pp, Q, R)
  const unknown = pick(['hyp', 'hyp', 'leg'] as const)
  const away = { x: (Pp.x + Q.x + R.x) / 3, y: (Pp.y + Q.y + R.y) / 3 }
  const lab = (n: number, isX: boolean) => (isX ? 'x' : `${n} cm`)
  sideLabel(s, Pp, Q, away, lab(b, false), 16)
  sideLabel(s, Pp, R, away, lab(a, unknown === 'leg'), 18)
  sideLabel(s, Q, R, away, lab(c, unknown === 'hyp'), 18)
  if (unknown === 'hyp') {
    return mk('Calculate the length of x.', s.out(), one('v', 'x =', 'cm'), { v: c }, [], `x² = ${a}² + ${b}² = ${a * a + b * b}, so x = ${c} cm.`)
  }
  return mk('Calculate the length of x.', s.out(), one('v', 'x =', 'cm'), { v: a }, [], `x² = ${c}² ${MINUS} ${b}² = ${c * c - b * b}, so x = ${a} cm.`)
}

function trig(): GeometryQuestion {
  const th = rnd(25, 65), kind = pick(['sin', 'cos', 'tan'] as const)
  const hyp = 200
  const Pp = { x: 70, y: 200 }, Q = { x: 70 + hyp * Math.cos(rad(th)) * 1.15, y: 200 }, R = { x: 70, y: 200 - hyp * Math.sin(rad(th)) * 1.15 }
  const s = new Svg()
  poly(s, [Pp, Q, R]); rightMark(s, Pp, Q, R)
  corner(s, Q, R, Pp, `${th}${DEG}`, 22, 34)
  const away = { x: (Pp.x + Q.x + R.x) / 3, y: (Pp.y + Q.y + R.y) / 3 }
  const r1 = (n: number) => Math.round(n * 10) / 10
  const given = rnd(8, 20)
  let ans: number, work: string
  if (kind === 'sin') { ans = r1(given * Math.sin(rad(th))); sideLabel(s, Q, R, away, `${given} cm`, 18); sideLabel(s, Pp, R, away, 'x', 16); work = `x = ${given} × sin ${th}${DEG} = ${ans} cm.` }
  else if (kind === 'cos') { ans = r1(given * Math.cos(rad(th))); sideLabel(s, Q, R, away, `${given} cm`, 18); sideLabel(s, Pp, Q, away, 'x', 16); work = `x = ${given} × cos ${th}${DEG} = ${ans} cm.` }
  else { ans = r1(given * Math.tan(rad(th))); sideLabel(s, Pp, Q, away, `${given} cm`, 16); sideLabel(s, Pp, R, away, 'x', 16); work = `x = ${given} × tan ${th}${DEG} = ${ans} cm.` }
  return mk('Calculate the length of x, correct to one decimal place.', s.out(), one('v', 'x =', 'cm'), { v: ans }, [], work, 0.1)
}

function area(): GeometryQuestion {
  const kind = pick(['rect', 'tri', 'para', 'trap', 'circle'] as const)
  const s = new Svg()
  if (kind === 'rect') {
    const l = rnd(5, 16), w = rnd(3, 9)
    rect(s, 80, 70, 200, 110, '#fdf3dc'); txt(s, 180, 195, `${l} cm`, 13, INK); txt(s, 62, 125, `${w} cm`, 13, INK)
    return mk('Calculate the area of the rectangle.', s.out(), one('v', 'Area =', 'cm²'), { v: l * w }, [], `Area = length × breadth = ${l} × ${w} = ${l * w} cm².`)
  }
  if (kind === 'tri') {
    const b = rnd(4, 14) * 2, h = rnd(3, 10)
    const A = { x: 60, y: 190 }, B = { x: 300, y: 190 }, C = { x: 150, y: 50 }
    poly(s, [A, B, C], '#fdf3dc'); dashed(s, C, { x: C.x, y: A.y }, RUST); rightMark(s, { x: C.x, y: A.y }, B, C, 9)
    txt(s, 180, 207, `${b} cm`, 13, INK); txt(s, 165, 125, `${h} cm`, 13, INK, 'start')
    return mk('Calculate the area of the triangle.', s.out(), one('v', 'Area =', 'cm²'), { v: (b * h) / 2 }, [], `Area = ½ × base × height = ½ × ${b} × ${h} = ${(b * h) / 2} cm².`)
  }
  if (kind === 'para') {
    const b = rnd(6, 15), h = rnd(3, 9)
    const A = { x: 60, y: 180 }, B = { x: 250, y: 180 }, C = { x: 320, y: 60 }, D = { x: 130, y: 60 }
    poly(s, [A, B, C, D], '#fdf3dc'); dashed(s, D, { x: D.x, y: A.y }, RUST)
    txt(s, 155, 198, `${b} cm`, 13, INK); txt(s, 143, 125, `${h} cm`, 13, INK, 'start')
    return mk('Calculate the area of the parallelogram.', s.out(), one('v', 'Area =', 'cm²'), { v: b * h }, [], `Area = base × perpendicular height = ${b} × ${h} = ${b * h} cm².`)
  }
  if (kind === 'trap') {
    const a = rnd(3, 8), b = a + rnd(2, 6), h = rnd(2, 8) * 2
    const A = { x: 60, y: 190 }, B = { x: 300, y: 190 }, C = { x: 250, y: 60 }, D = { x: 110, y: 60 }
    poly(s, [A, B, C, D], '#fdf3dc'); dashed(s, D, { x: D.x, y: A.y }, RUST)
    txt(s, 180, 45, `${a} cm`, 13, INK); txt(s, 180, 207, `${b} cm`, 13, INK); txt(s, 118, 125, `${h} cm`, 13, INK, 'start')
    return mk('Calculate the area of the trapezium.', s.out(), one('v', 'Area =', 'cm²'), { v: ((a + b) * h) / 2 }, [], `Area = ½ (${a} + ${b}) × ${h} = ${((a + b) * h) / 2} cm².`)
  }
  const r = rnd(3, 12)
  circle(s, 180, 120, 80, '#fdf3dc'); s.dot(180, 120, 3); s.line(180, 120, 260, 120, 2, RUST); txt(s, 220, 106, `${r} cm`, 13, INK)
  const ans = Math.round(Math.PI * r * r * 10) / 10
  return mk('Calculate the area of the circle, correct to one decimal place. Use the π button on your calculator.', s.out(), one('v', 'Area =', 'cm²'), { v: ans }, [], `Area = πr² = π × ${r}² = ${ans} cm².`, 0.1)
}

function perimeter(): GeometryQuestion {
  const kind = pick(['rect', 'square', 'circle'] as const), s = new Svg()
  if (kind === 'rect') {
    const l = rnd(5, 18), w = rnd(3, 9)
    rect(s, 80, 70, 200, 110, '#fdf3dc'); txt(s, 180, 195, `${l} cm`, 13, INK); txt(s, 62, 125, `${w} cm`, 13, INK)
    return mk('Calculate the perimeter of the rectangle.', s.out(), one('v', 'Perimeter =', 'cm'), { v: 2 * (l + w) }, [], `Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)} cm.`)
  }
  if (kind === 'square') {
    const l = rnd(3, 15)
    rect(s, 110, 50, 140, 140, '#fdf3dc'); txt(s, 180, 205, `${l} cm`, 13, INK)
    return mk('Calculate the perimeter of the square.', s.out(), one('v', 'Perimeter =', 'cm'), { v: 4 * l }, [], `Perimeter = 4 × ${l} = ${4 * l} cm.`)
  }
  const d = rnd(4, 20)
  circle(s, 180, 120, 80, '#fdf3dc'); s.line(100, 120, 260, 120, 2, RUST); s.dot(180, 120, 3); txt(s, 180, 105, `${d} cm`, 13, INK)
  const ans = Math.round(Math.PI * d * 10) / 10
  return mk('Calculate the circumference of the circle, correct to one decimal place. Use the π button on your calculator.', s.out(), one('v', 'C =', 'cm'), { v: ans }, [], `C = πd = π × ${d} = ${ans} cm.`, 0.1)
}

function quadrilateral(): GeometryQuestion {
  for (let tries = 0; tries < 200; tries++) {
    const angs = [rnd(0, 20), rnd(85, 105), rnd(170, 195), rnd(260, 285)]
    const rs = [rnd(75, 105), rnd(75, 105), rnd(75, 105), rnd(75, 105)]
    const pts = angs.map((a, i) => P(180, 120, rs[i]!, a)).map(p => ({ x: p.x, y: 120 + (p.y - 120) * 0.95 }))
    const ia = pts.map((p, i) => {
      const a = pts[(i + 3) % 4]!, b = pts[(i + 1) % 4]!
      const v1 = { x: a.x - p.x, y: a.y - p.y }, v2 = { x: b.x - p.x, y: b.y - p.y }
      return Math.round((Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))) * 180) / Math.PI)
    })
    if (ia.some(a => a < 55 || a > 125)) continue
    const hide = rnd(0, 3)
    const known = ia.filter((_, i) => i !== hide)
    const ans = 360 - known.reduce((x, y) => x + y, 0)
    if (ans < 40 || ans > 140) continue
    const s = new Svg()
    poly(s, pts)
    pts.forEach((p, i) => corner(s, p, pts[(i + 1) % 4]!, pts[(i + 3) % 4]!, i === hide ? 'x' : `${ia[i]}${DEG}`, 16, 26))
    return mk('Find the size of angle x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: ans }, ['quad'], `x = 360${DEG} ${MINUS} ${known.join(`${DEG} ${MINUS} `)}${DEG} = ${ans}${DEG} (sum of the angles in a quadrilateral).`)
  }
  return pythagoras()
}

function circleGeo(): GeometryQuestion {
  const s = new Svg()
  const cx = 180, cy = 120, r = 85
  const pt = (a: number) => P(cx, cy, r, a)
  const named = (name: string, a: number, off = 14) => { const p = P(cx, cy, r + off, a); s.text(p.x, p.y, name, INK, 13) }
  const kind = pick(['centre', 'centre2', 'semi', 'cyclic', 'tangent', 'same'] as const)
  circle(s, cx, cy, r)
  if (kind === 'centre' || kind === 'centre2') {
    const half = pick([35, 40, 45, 50, 55, 60, 65, 70]), phi = half * 2
    const A = pt(270 - half), B = pt(270 + half), C = pt(rnd(70, 110)), O = { x: cx, y: cy }
    s.line(O.x, O.y, A.x, A.y); s.line(O.x, O.y, B.x, B.y); s.line(C.x, C.y, A.x, A.y); s.line(C.x, C.y, B.x, B.y)
    s.dot(O.x, O.y); named('A', 270 - half); named('B', 270 + half); s.text(C.x, C.y - 14, 'C', INK, 13); s.text(O.x - 12, O.y - 12, 'O', INK, 13)
    const cAng = (Math.atan2(-(A.y - C.y), A.x - C.x) * 180) / Math.PI, cAng2 = (Math.atan2(-(B.y - C.y), B.x - C.x) * 180) / Math.PI
    if (kind === 'centre') {
      s.arc(C.x, C.y, Math.min(cAng, cAng2) + 360 * (Math.min(cAng, cAng2) < -180 ? 1 : 0), Math.max(cAng, cAng2), 22); txt(s, C.x, C.y + 36, `${half}${DEG}`, 13, RUST, 'middle', 700)
      s.arc(O.x, O.y, 270 - half, 270 + half, 22); txt(s, O.x, O.y + 40, 'x', 13, RUST, 'middle', 700)
      return mk('O is the centre of the circle. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: phi }, ['centre'], `x = 2 × ${half}${DEG} = ${phi}${DEG} (angle at the centre is twice the angle at the circumference).`)
    }
    s.arc(C.x, C.y, Math.min(cAng, cAng2), Math.max(cAng, cAng2), 22); txt(s, C.x, C.y + 36, 'x', 13, RUST, 'middle', 700)
    s.arc(O.x, O.y, 270 - half, 270 + half, 22); txt(s, O.x, O.y + 40, `${phi}${DEG}`, 13, RUST, 'middle', 700)
    return mk('O is the centre of the circle. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: half }, ['centre'], `x = ${phi}${DEG} ÷ 2 = ${half}${DEG} (angle at the centre is twice the angle at the circumference).`)
  }
  if (kind === 'semi') {
    const A = pt(180), B = pt(0), cA = rnd(45, 135), C = pt(cA), O = { x: cx, y: cy }
    s.line(A.x, A.y, B.x, B.y); s.line(A.x, A.y, C.x, C.y); s.line(B.x, B.y, C.x, C.y); s.dot(O.x, O.y)
    named('A', 180); named('B', 0); s.text(C.x, C.y - 14, 'C', INK, 13); s.text(O.x, O.y + 14, 'O', INK, 13)
    // angle at A is half the arc CB (B is at 0 degrees, C at cA)
    const angAR = Math.round(cA / 2)
    if (Math.random() < 0.5) {
      corner(s, C, A, B, 'x', 16, 22)
      return mk('AB is a diameter of the circle. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: 90 }, ['semi'], `x = 90${DEG} (angle in a semicircle).`)
    }
    s.arc(A.x, A.y, 0, angAR, 26); txt(s, A.x + 42, A.y - 8, `${angAR}${DEG}`, 13, RUST, 'middle', 700)
    corner(s, B, C, A, 'x', 18, 26)
    return mk('AB is a diameter of the circle. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: 90 - angAR }, ['semi', 'tri'], `∠ACB = 90${DEG} (angle in a semicircle), so x = 180${DEG} ${MINUS} 90${DEG} ${MINUS} ${angAR}${DEG} = ${90 - angAR}${DEG} (sum of the angles in a triangle).`)
  }
  if (kind === 'cyclic') {
    const g = [rnd(35, 55) * 2, rnd(30, 50) * 2, rnd(35, 55) * 2]
    const g4 = 360 - g[0]! - g[1]! - g[2]!
    if (g4 < 60) return circleGeo()
    const a1 = 100
    const angles = [a1, a1 + g[0]!, a1 + g[0]! + g[1]!, a1 + g[0]! + g[1]! + g[2]!]
    const pts = angles.map(pt), names = ['A', 'B', 'C', 'D']
    poly(s, pts)
    pts.forEach((_, i) => named(names[i]!, angles[i]!))
    const gaps = [g[0]!, g[1]!, g[2]!, g4]
    const ang = [(gaps[1]! + gaps[2]!) / 2, (gaps[2]! + gaps[3]!) / 2, (gaps[3]! + gaps[0]!) / 2, (gaps[0]! + gaps[1]!) / 2] // A,B,C,D
    const pair = pick([[0, 2], [1, 3]] as const)
    const [gi, hi] = Math.random() < 0.5 ? pair : [pair[1], pair[0]]
    pts.forEach((p, i) => { if (i === gi || i === hi) corner(s, p, pts[(i + 1) % 4]!, pts[(i + 3) % 4]!, i === gi ? `${ang[i]}${DEG}` : 'x', 18, 30) })
    return mk('ABCD is a cyclic quadrilateral. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: 180 - ang[gi]! }, ['cyc'], `x = 180${DEG} ${MINUS} ${ang[gi]}${DEG} = ${180 - ang[gi]!}${DEG} (opposite angles of a cyclic quadrilateral).`)
  }
  if (kind === 'tangent') {
    const th = rnd(25, 65), pa = 270
    const Pp = pt(pa), O = { x: cx, y: cy }
    const tlen = r * Math.tan(rad(th))
    const T = { x: Pp.x + tlen, y: Pp.y }
    // keep inside the picture: shrink if needed
    s.parts.length = 0
    const k = Math.min(1, 150 / tlen)
    circle(s, cx, cy, r)
    const T2 = { x: Pp.x + tlen * k, y: Pp.y }
    const th2 = (Math.atan2(r, tlen * k) * 180) / Math.PI
    void T
    const thR = Math.round(th2)
    s.line(Pp.x - 50, Pp.y, T2.x + 10, Pp.y, 2, INK); s.line(O.x, O.y, Pp.x, Pp.y); s.line(O.x, O.y, T2.x, T2.y)
    rightMark(s, Pp, { x: Pp.x + 20, y: Pp.y }, O, 11); s.dot(O.x, O.y)
    s.text(O.x - 12, O.y - 10, 'O', INK, 13); s.text(Pp.x, Pp.y + 16, 'P', INK, 13); s.text(T2.x + 4, T2.y + 16, 'T', INK, 13)
    corner(s, O, Pp, T2, `${thR}${DEG}`, 20, 30)
    corner(s, T2, O, { x: Pp.x, y: Pp.y }, 'x', 22, 30)
    return mk('TP is a tangent to the circle at P, and O is the centre. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: 90 - thR }, ['tan', 'tri'], `∠OPT = 90${DEG} (tangent is perpendicular to the radius), so x = 180${DEG} ${MINUS} 90${DEG} ${MINUS} ${thR}${DEG} = ${90 - thR}${DEG} (sum of the angles in a triangle).`)
  }
  const th = pick([25, 30, 35, 40, 45, 50])
  const A = pt(270 - th), B = pt(270 + th), C = pt(150), D = pt(60)
  s.line(A.x, A.y, C.x, C.y); s.line(B.x, B.y, C.x, C.y); s.line(A.x, A.y, D.x, D.y); s.line(B.x, B.y, D.x, D.y)
  named('A', 270 - th); named('B', 270 + th); named('C', 150); named('D', 60)
  corner(s, C, A, B, `${th}${DEG}`, 20, 32); corner(s, D, A, B, 'x', 20, 32)
  return mk('A, B, C and D lie on the circle. Find the size of x. Give a reason.', s.out(), one('v', 'x =', DEG), { v: th }, ['same'], `x = ${th}${DEG} (angles in the same segment, subtended by the same chord AB).`)
}

// ---- measuring and reading -------------------------------------------------
function clock(): GeometryQuestion {
  const h = rnd(1, 12), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
  const s = new Svg(), cx = 180, cy = 120, r = 100
  circle(s, cx, cy, r, '#fff', INK, 3)
  for (let i = 0; i < 60; i++) { const a = 90 - i * 6, big = i % 5 === 0, p1 = P(cx, cy, r - (big ? 10 : 5), a), p2 = P(cx, cy, r - 1, a); s.line(p1.x, p1.y, p2.x, p2.y, big ? 2 : 1, INK) }
  for (let n = 1; n <= 12; n++) { const p = P(cx, cy, r - 24, 90 - n * 30); s.text(p.x, p.y, String(n), INK, 16) }
  const ha = 90 - ((h % 12) * 30 + m * 0.5), ma = 90 - m * 6
  const hp = P(cx, cy, 50, ha), mp = P(cx, cy, 78, ma)
  s.line(cx, cy, hp.x, hp.y, 6, INK); s.line(cx, cy, mp.x, mp.y, 3.5, RUST); s.dot(cx, cy, 5)
  return mk('What time does the clock show? Give the hour and the minutes.', s.out(), [{ id: 'h', label: 'Hours:' }, { id: 'm', label: 'Minutes:' }], { h, m }, [], `The short hand is on ${h} and the long hand is on ${m / 5 === 0 ? 12 : m / 5}, so the time is ${h}:${String(m).padStart(2, '0')}.`)
}

function ruler(): GeometryQuestion {
  const s = new Svg(), x0 = 30, k = 19
  const start = pick([0, 0, 0, 2, 3]), len = pick([3.5, 4, 5, 5.5, 6, 7, 7.5, 8, 9, 10, 11.5, 12]), end = start + len
  rect(s, 14, 118, 332, 56, '#f8e6b0', INK, 2)
  for (let i = 0; i <= 160; i++) {
    const x = x0 + i * k / 10, cm = i % 10 === 0, half = i % 5 === 0
    s.line(x, 118, x, 118 + (cm ? 22 : half ? 15 : 9), cm ? 1.6 : 1, INK)
    if (cm) txt(s, x, 152, String(i / 10), 13, INK, 'middle', 700)
  }
  rect(s, x0 + start * k, 70, len * k, 30, '#7fb6e8', INK, 2)
  if (start > 0) dashed(s, { x: x0 + start * k, y: 100 }, { x: x0 + start * k, y: 118 }, RUST)
  dashed(s, { x: x0 + end * k, y: 100 }, { x: x0 + end * k, y: 118 }, RUST)
  return mk('How long is the blue bar? Read the ruler carefully.', s.out(), one('v', 'Length =', 'cm'), { v: len }, [], start ? `The bar goes from ${start} cm to ${end} cm, so it is ${end} ${MINUS} ${start} = ${len} cm long.` : `The bar ends at ${end} cm and starts at 0, so it is ${len} cm long.`)
}

function protractor(): GeometryQuestion {
  const th = pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150])
  const s = new Svg(), cx = 180, cy = 205, r = 135
  s.parts.push(`<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="#eaf4fb" stroke="${INK}" stroke-width="2"/>`)
  for (let d = 0; d <= 180; d += 5) { const big = d % 10 === 0, p1 = P(cx, cy, r, d), p2 = P(cx, cy, r - (big ? 14 : 8), d); s.line(p1.x, p1.y, p2.x, p2.y, big ? 1.4 : 1, INK); if (d % 10 === 0) { const t = P(cx, cy, r - 25, d); txt(s, t.x, t.y, String(d), 10, INK) } }
  s.line(cx - r - 8, cy, cx + r + 8, cy, 2, INK); s.dot(cx, cy, 3)
  const e = P(cx, cy, r + 20, th); s.line(cx, cy, e.x, e.y, 3, RUST)
  return mk('Read the size of the angle between the red line and the base line from the protractor.', s.out(), one('v', 'Angle =', DEG), { v: th }, [], `The red line passes through ${th} on the scale that starts at 0 on the right, so the angle is ${th}${DEG}.`)
}

function fraction(): GeometryQuestion {
  const d = rnd(3, 12)
  let n = rnd(1, d - 1)
  while (gcd(n, d) !== 1) n = rnd(1, d - 1)
  const s = new Svg(), kind = pick(['bar', 'circle', 'grid'] as const)
  if (kind === 'circle') {
    const cx = 180, cy = 120, r = 90
    for (let i = 0; i < d; i++) {
      const a1 = 90 - (i * 360) / d, a2 = 90 - ((i + 1) * 360) / d, p1 = P(cx, cy, r, a1), p2 = P(cx, cy, r, a2)
      s.parts.push(`<path d="M ${cx} ${cy} L ${f(p1.x)} ${f(p1.y)} A ${r} ${r} 0 0 1 ${f(p2.x)} ${f(p2.y)} Z" fill="${i < n ? GOLD : '#fff'}" stroke="${INK}" stroke-width="2"/>`)
    }
  } else if (kind === 'bar') {
    const w = 300 / d
    for (let i = 0; i < d; i++) rect(s, 30 + i * w, 80, w, 80, i < n ? GOLD : '#fff')
  } else {
    const cols = d % 4 === 0 ? 4 : d % 3 === 0 ? 3 : d % 2 === 0 ? 2 : d, rows = d / cols, cw = Math.min(60, 280 / cols), ch = Math.min(60, 190 / rows)
    const x0 = 180 - (cols * cw) / 2, y0 = 120 - (rows * ch) / 2
    for (let i = 0; i < d; i++) rect(s, x0 + (i % cols) * cw, y0 + Math.floor(i / cols) * ch, cw, ch, i < n ? GOLD : '#fff')
  }
  return mk('What fraction of the shape is shaded? The shape is divided into equal parts.', s.out(), [{ id: 'n', label: 'Shaded parts:' }, { id: 'd', label: 'All the equal parts:' }], { n, d }, [], `${n} of the ${d} equal parts are shaded, so the fraction is ${n}/${d}.`)
}

function barchart(): GeometryQuestion {
  const sets = [
    { title: 'Books read in a week', cats: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'books' },
    { title: 'Favourite fruit (learners)', cats: ['Apple', 'Banana', 'Orange', 'Pear', 'Grape'], unit: 'learners' },
    { title: 'Cars sold per month', cats: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], unit: 'cars' },
  ]
  const set = pick(sets), vals = set.cats.map(() => rnd(1, 9) * 5), s = new Svg()
  const x0 = 50, y0 = 195, w = 290, h = 150, max = 50
  gridBox(s, x0, y0 - h, w, h, 1, 10)
  for (let j = 0; j <= 10; j += 2) txt(s, x0 - 8, y0 - (h * j) / 10, String(j * 5), 10, '#555', 'end')
  s.line(x0, y0, x0 + w, y0, 2); s.line(x0, y0, x0, y0 - h, 2)
  const bw = w / set.cats.length
  vals.forEach((v, i) => { rect(s, x0 + i * bw + 8, y0 - (h * v) / max, bw - 16, (h * v) / max, '#7fb6e8'); txt(s, x0 + i * bw + bw / 2, y0 + 13, set.cats[i]!, 10.5, INK) })
  txt(s, 190, 14, set.title, 13, INK, 'middle', 700)
  const type = pick(['read', 'diff', 'total'] as const)
  const i = rnd(0, 4)
  if (type === 'read') return mk(`How many ${set.unit} are there for ${set.cats[i]}?`, s.out(), one('v', 'Answer =', ''), { v: vals[i]! }, [], `The ${set.cats[i]} bar reaches ${vals[i]}.`)
  if (type === 'diff') {
    let j = rnd(0, 4); while (j === i) j = rnd(0, 4)
    const hi = Math.max(i, j, 0), lo = Math.min(i, j)
    const a = vals[i]! >= vals[j]! ? i : j, b = a === i ? j : i
    void hi; void lo
    return mk(`How many more ${set.unit} are there for ${set.cats[a]} than for ${set.cats[b]}?`, s.out(), one('v', 'Answer =', ''), { v: vals[a]! - vals[b]! }, [], `${vals[a]} ${MINUS} ${vals[b]} = ${vals[a]! - vals[b]!}.`)
  }
  return mk(`What is the total number of ${set.unit} for all five bars?`, s.out(), one('v', 'Total =', ''), { v: vals.reduce((x, y) => x + y, 0) }, [], `${vals.join(' + ')} = ${vals.reduce((x, y) => x + y, 0)}.`)
}

function dotplot(): GeometryQuestion {
  for (let tries = 0; tries < 300; tries++) {
    const n = pick([7, 9]), data = Array.from({ length: n }, () => rnd(1, 9)).sort((a, b) => a - b)
    const sum = data.reduce((a, b) => a + b, 0)
    const counts = new Map<number, number>(); data.forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1))
    const top = Math.max(...counts.values()), modes = [...counts].filter(([, c]) => c === top)
    const kind = pick(['mean', 'median', 'mode', 'range'] as const)
    if (kind === 'mean' && sum % n !== 0) continue
    if (kind === 'mode' && modes.length !== 1) continue
    if (top > 4) continue
    const s = new Svg(), x0 = 40, k = 31
    s.line(x0 - 10, 190, x0 + 9 * k + 10, 190, 2)
    for (let v = 0; v <= 9; v++) { s.line(x0 + v * k, 190, x0 + v * k, 196, 1.6); txt(s, x0 + v * k, 208, String(v), 12, INK, 'middle', 700) }
    const used = new Map<number, number>()
    data.forEach(v => { const c = used.get(v) ?? 0; used.set(v, c + 1); s.parts.push(`<circle cx="${x0 + v * k}" cy="${178 - c * 24}" r="10" fill="${BLUE}"/>`) })
    const ans = kind === 'mean' ? sum / n : kind === 'median' ? data[(n - 1) / 2]! : kind === 'mode' ? modes[0]![0] : data[n - 1]! - data[0]!
    const word = { mean: 'mean', median: 'median', mode: 'mode', range: 'range' }[kind]
    const work = kind === 'mean' ? `The values add up to ${sum} and there are ${n} of them, so the mean is ${sum} ÷ ${n} = ${ans}.` : kind === 'median' ? `In order the values are ${data.join(', ')}. The middle value is ${ans}.` : kind === 'mode' ? `${ans} appears most often (${top} times).` : `Range = largest ${MINUS} smallest = ${data[n - 1]} ${MINUS} ${data[0]} = ${ans}.`
    return mk(`Each dot is one value. Find the ${word} of the data shown.`, s.out(), one('v', `${word[0]!.toUpperCase()}${word.slice(1)} =`, ''), { v: ans! }, [], work)
  }
  return barchart()
}

function pie(): GeometryQuestion {
  const parts = [rnd(2, 7) * 5, rnd(2, 7) * 5, rnd(2, 7) * 5]
  const x = 100 - parts.reduce((a, b) => a + b, 0)
  if (x < 10 || x > 60) return pie()
  const all = [...parts, x], cols = ['#f2b880', '#9dc6e8', '#a9d9a8', '#e8b3d9']
  const s = new Svg(), cx = 180, cy = 120, r = 88
  let a = 90
  all.forEach((v, i) => {
    const a2 = a - (v * 360) / 100, p1 = P(cx, cy, r, a), p2 = P(cx, cy, r, a2)
    s.parts.push(`<path d="M ${cx} ${cy} L ${f(p1.x)} ${f(p1.y)} A ${r} ${r} 0 ${v > 50 ? 1 : 0} 1 ${f(p2.x)} ${f(p2.y)} Z" fill="${cols[i]}" stroke="${INK}" stroke-width="2"/>`)
    const m = P(cx, cy, r * 0.6, (a + a2) / 2); txt(s, m.x, m.y, i === 3 ? 'x%' : `${v}%`, 14, INK, 'middle', 700)
    a = a2
  })
  return mk('The pie chart shows how a class spends its pocket money. Find the value of x.', s.out(), one('v', 'x =', '%'), { v: x }, [], `The whole pie is 100%, so x = 100 ${MINUS} (${parts.join(' + ')}) = ${x}%.`)
}

function gridAxes(s: Svg, range = 5, x0 = 60, y0 = 16, size = 200) {
  const k = size / (2 * range), cx = x0 + size / 2, cy = y0 + size / 2
  gridBox(s, x0, y0, size, size, 2 * range, 2 * range)
  s.line(x0, cy, x0 + size, cy, 2); s.line(cx, y0, cx, y0 + size, 2)
  for (let v = -range; v <= range; v++) if (v !== 0) { txt(s, cx + v * k, cy + 12, String(v), 9.5); txt(s, cx - 10, cy - v * k, String(v), 9.5, '#555', 'end') }
  txt(s, x0 + size + 12, cy + 1, 'x', 12, INK, 'middle', 700); txt(s, cx + 1, y0 - 2, 'y', 12, INK, 'middle', 700)
  return { cx, cy, k, at: (x: number, y: number) => ({ x: cx + x * k, y: cy - y * k }) }
}
function coordinates(): GeometryQuestion {
  const x = rnd(-4, 4), y = rnd(-4, 4)
  if (x === 0 || y === 0) return coordinates()
  const s = new Svg(), g = gridAxes(s)
  const p = g.at(x, y); s.parts.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="6" fill="${RUST}"/>`); txt(s, p.x + 12, p.y - 10, 'P', 14, INK, 'middle', 700)
  return mk('Read the coordinates of the point P.', s.out(), [{ id: 'x', label: 'x =' }, { id: 'y', label: 'y =' }], { x, y }, [], `P is ${Math.abs(x)} ${x > 0 ? 'right' : 'left'} and ${Math.abs(y)} ${y > 0 ? 'up' : 'down'} from the origin, so P is (${x}; ${y}).`)
}

function gradient(): GeometryQuestion {
  for (let t = 0; t < 200; t++) {
    const m = pick([-3, -2, -1, 1, 2, 3]), dx = rnd(1, 2), x1 = rnd(-4, 1), y1 = rnd(-4, 4), x2 = x1 + dx, y2 = y1 + m * dx
    if (Math.abs(y2) > 4 || x2 > 4) continue
    const s = new Svg(), g = gridAxes(s)
    const a = g.at(x1, y1), b = g.at(x2, y2), d = unit(a, b)
    s.line(a.x - d.x * 90, a.y - d.y * 90, b.x + d.x * 90, b.y + d.y * 90, 2.4, RUST)
    ;[[a, x1, y1, 'A'], [b, x2, y2, 'B']].forEach(([p, px, py, n]) => { const q = p as Pt; s.parts.push(`<circle cx="${f(q.x)}" cy="${f(q.y)}" r="5" fill="${INK}"/>`); txt(s, q.x + 14, q.y - 10, `${n}(${px}; ${py})`, 11, INK, 'start', 700) })
    return mk('Calculate the gradient of the straight line through A and B.', s.out(), one('v', 'Gradient =', ''), { v: m }, [], `m = (y₂ ${MINUS} y₁) ÷ (x₂ ${MINUS} x₁) = (${y2} ${MINUS} ${y1 < 0 ? `(${y1})` : y1}) ÷ (${x2} ${MINUS} ${x1 < 0 ? `(${x1})` : x1}) = ${m}.`)
  }
  return coordinates()
}

function linegraph(): GeometryQuestion {
  const sc = pick([
    { title: 'Temperature during a day', xs: ['6', '8', '10', '12', '14', '16'], unit: '°C', what: 'temperature', xl: 'Time (hours)', lo: 10, hi: 30 },
    { title: 'Height of a plant', xs: ['1', '2', '3', '4', '5', '6'], unit: 'cm', what: 'height of the plant', xl: 'Week', lo: 0, hi: 25 },
  ])
  const vals = sc.xs.map(() => rnd(sc.lo / 5, sc.hi / 5) * 5)
  const s = new Svg(), x0 = 56, y0 = 190, w = 270, h = 140, k = h / (sc.hi - sc.lo)
  gridBox(s, x0, y0 - h, w, h, 5, (sc.hi - sc.lo) / 5)
  for (let v = sc.lo; v <= sc.hi; v += 5) txt(s, x0 - 8, y0 - (v - sc.lo) * k, String(v), 10, '#555', 'end')
  s.line(x0, y0, x0 + w, y0, 2); s.line(x0, y0, x0, y0 - h, 2)
  const pts = vals.map((v, i) => ({ x: x0 + (w * i) / 5, y: y0 - (v - sc.lo) * k }))
  s.parts.push(`<polyline points="${pts.map(p => `${f(p.x)},${f(p.y)}`).join(' ')}" fill="none" stroke="${RUST}" stroke-width="2.6"/>`)
  pts.forEach((p, i) => { s.parts.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="4.5" fill="${RUST}"/>`); txt(s, p.x, y0 + 13, sc.xs[i]!, 11, INK) })
  txt(s, 190, 14, sc.title, 13, INK, 'middle', 700); txt(s, 190, 222, sc.xl, 11, '#555')
  const i = rnd(0, 5)
  return mk(`Read the graph. What was the ${sc.what} at ${sc.xl.toLowerCase().startsWith('time') ? `${sc.xs[i]}:00` : `week ${sc.xs[i]}`}?`, s.out(), one('v', 'Answer =', sc.unit), { v: vals[i]! }, [], `The point above ${sc.xs[i]} is level with ${vals[i]} on the vertical scale.`)
}

function blocks(): GeometryQuestion {
  const h = rnd(0, 3), t = rnd(0, 9), u = rnd(0, 9)
  if (h + t + u === 0) return blocks()
  const s = new Svg()
  for (let i = 0; i < h; i++) { const x = 14 + i * 46, y = 30; rect(s, x, y, 42, 42, '#bfe0f5', INK, 1.5); for (let g = 1; g < 5; g++) { s.line(x + g * 8.4, y, x + g * 8.4, y + 42, 0.8, '#7aa'); s.line(x, y + g * 8.4, x + 42, y + g * 8.4, 0.8, '#7aa') } }
  for (let i = 0; i < t; i++) { const x = 150 + i * 14, y = 30; rect(s, x, y, 11, 120, '#a9d9a8', INK, 1.2); for (let g = 1; g < 10; g++) s.line(x, y + g * 12, x + 11, y + g * 12, 0.8, '#6a6') }
  for (let i = 0; i < u; i++) { const x = 14 + (i % 5) * 18, y = 120 + Math.floor(i / 5) * 18; rect(s, x, y, 14, 14, '#f2b880', INK, 1.2) }
  return mk('What number do the blocks show? A flat is 100, a long rod is 10 and a small cube is 1.', s.out(), one('v', 'Number =', ''), { v: h * 100 + t * 10 + u }, [], `${h} hundreds + ${t} tens + ${u} ones = ${h * 100 + t * 10 + u}.`)
}

function thermometer(): GeometryQuestion {
  const lo = -10, hi = 50, v = rnd(-3, 24) * 2
  const s = new Svg(), x = 180, top = 22, bot = 190, k = (bot - top) / (hi - lo)
  rect(s, x - 9, top, 18, bot - top, '#fff', INK, 2); circle(s, x, bot + 12, 17, '#d93b2b', INK, 2)
  const y = bot - (v - lo) * k; rect(s, x - 5, y, 10, bot - y + 4, '#d93b2b', 'none', 0)
  for (let t = lo; t <= hi; t += 2) { const yy = bot - (t - lo) * k, big = t % 10 === 0; s.line(x + 9, yy, x + (big ? 24 : 16), yy, big ? 1.6 : 1, INK); if (big) txt(s, x + 42, yy, String(t), 11, INK) }
  txt(s, x + 90, 120, '°C', 14, INK, 'middle', 700)
  return mk('What temperature does the thermometer show?', s.out(), one('v', 'Temperature =', '°C'), { v }, [], `The top of the red liquid is at ${v}${DEG}C.`)
}

function cylinder(): GeometryQuestion {
  const v = rnd(2, 19) * 5, s = new Svg(), x = 150, top = 20, bot = 200, k = (bot - top) / 100
  s.parts.push(`<path d="M ${x - 30} ${top} L ${x - 30} ${bot} L ${x + 30} ${bot} L ${x + 30} ${top}" fill="none" stroke="${INK}" stroke-width="2.4"/>`)
  const y = bot - v * k; rect(s, x - 29, y, 58, bot - y, '#8ec8ee', 'none', 0); s.line(x - 29, y, x + 29, y, 2, BLUE)
  for (let m = 0; m <= 100; m += 5) { const yy = bot - m * k, big = m % 10 === 0; s.line(x + 30, yy, x + (big ? 48 : 40), yy, big ? 1.6 : 1, INK); if (big) txt(s, x + 66, yy, String(m), 11, INK) }
  txt(s, x + 112, 110, 'ml', 14, INK, 'middle', 700)
  return mk('How much water is in the measuring cylinder? Read the bottom of the curved surface level.', s.out(), one('v', 'Volume =', 'ml'), { v }, [], `The water level is at the ${v} ml mark.`)
}

// ---- science ---------------------------------------------------------------
function circuit(): GeometryQuestion {
  const two = Math.random() < 0.6, I = rnd(1, 4)
  const R1 = rnd(1, 6), R2 = two ? rnd(1, 6) : 0, tot = R1 + R2
  const V = I * tot
  if (V > 36) return circuit()
  const s = new Svg(), x0 = 50, x1 = 310, y0 = 50, y1 = 190
  s.line(x0, y0, x1, y0); s.line(x1, y0, x1, y1); s.line(x1, y1, x0, y1); s.line(x0, y1, x0, y0)
  // battery on the left wire
  s.parts.push(`<rect x="${x0 - 14}" y="110" width="28" height="22" fill="#fff"/>`); s.line(x0 - 14, 116, x0 + 14, 116, 2); s.line(x0 - 7, 126, x0 + 7, 126, 5); txt(s, x0 + 22, 121, `${V} V`, 13, INK, 'start', 700)
  const resistor = (cx: number, name: string, ohm: number) => { rect(s, cx - 24, y0 - 11, 48, 22, '#fff'); txt(s, cx, y0 - 26, `${name} = ${ohm} Ω`, 12, INK, 'middle', 700) }
  if (two) { resistor(130, 'R₁', R1); resistor(230, 'R₂', R2) } else resistor(180, 'R', R1)
  circle(s, 180, y1, 15, '#fff', INK, 2); txt(s, 180, y1, 'A', 15, INK, 'middle', 700)
  const work = two ? `Total resistance = ${R1} + ${R2} = ${tot} Ω. I = V ÷ R = ${V} ÷ ${tot} = ${I} A.` : `I = V ÷ R = ${V} ÷ ${R1} = ${I} A.`
  return mk(`${two ? 'The two resistors in this circuit are in series. ' : ''}Calculate the reading on the ammeter (A). The ammeter has no resistance.`, s.out(), one('v', 'Current =', 'A'), { v: I }, [], work)
}

function wave(): GeometryQuestion {
  const A = rnd(1, 3), lam = pick([2, 3, 4]), s = new Svg(), x0 = 50, y0 = 112, kx = 36, ky = 24
  gridBox(s, x0, y0 - 4 * ky, 8 * kx, 8 * ky, 8, 8)
  s.line(x0, y0, x0 + 8 * kx, y0, 2); s.line(x0, y0 - 4 * ky, x0, y0 + 4 * ky, 2)
  for (let v = -3; v <= 3; v++) if (v) txt(s, x0 - 8, y0 - v * ky, String(v), 10, '#555', 'end')
  for (let v = 1; v <= 8; v++) txt(s, x0 + v * kx, y0 + 4 * ky + 12, String(v), 10, '#555')
  const pts: string[] = []
  for (let i = 0; i <= 8 * 20; i++) { const x = i / 20; pts.push(`${f(x0 + x * kx)},${f(y0 - A * Math.sin((2 * Math.PI * x) / lam) * ky)}`) }
  s.parts.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="${RUST}" stroke-width="2.6"/>`)
  txt(s, 20, 112, 'cm', 11, '#555'); txt(s, 190, 230, 'distance (m)', 11, '#555')
  return mk('The graph shows a wave. Read the amplitude (in cm) and the wavelength (in m) from the graph.', s.out(), [{ id: 'a', label: 'Amplitude =', unit: 'cm' }, { id: 'l', label: 'Wavelength =', unit: 'm' }], { a: A, l: lam }, [], `The wave goes ${A} cm above the middle line, so the amplitude is ${A} cm. One full wave is ${lam} m long.`)
}

function speedgraph(): GeometryQuestion {
  const v = rnd(2, 6), t1 = pick([4, 5, 8, 10]), d1 = v * t1
  const s = new Svg(), x0 = 56, y0 = 190, w = 270, h = 150, tmax = 10, dmax = 60
  gridBox(s, x0, y0 - h, w, h, 10, 12)
  for (let t = 0; t <= 10; t += 2) txt(s, x0 + (w * t) / tmax, y0 + 12, String(t), 10, '#555')
  for (let d = 0; d <= 60; d += 10) txt(s, x0 - 8, y0 - (h * d) / dmax, String(d), 10, '#555', 'end')
  s.line(x0, y0, x0 + w, y0, 2); s.line(x0, y0, x0, y0 - h, 2)
  const tip = { x: x0 + (w * 10) / tmax, y: y0 - (h * v * 10) / dmax }, p = { x: x0 + (w * t1) / tmax, y: y0 - (h * d1) / dmax }
  s.line(x0, y0, tip.x, tip.y, 2.8, RUST); dashed(s, p, { x: p.x, y: y0 }); dashed(s, p, { x: x0, y: p.y }); s.parts.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="5" fill="${INK}"/>`)
  txt(s, x0 + w / 2, y0 + 30, 'time (s)', 11, '#555'); txt(s, 18, 18, 'distance (m)', 11, '#555', 'start')
  return mk('A cyclist travels at a constant speed. Use the graph to calculate the speed.', s.out(), one('v', 'Speed =', 'm/s'), { v }, [], `Speed = distance ÷ time = ${d1} m ÷ ${t1} s = ${v} m/s.`)
}

function forces(): GeometryQuestion {
  const rights = Math.random() < 0.5 ? [rnd(2, 9) * 5] : [rnd(1, 5) * 5, rnd(1, 5) * 5], lefts = [rnd(1, 4) * 5]
  const net = rights.reduce((a, b) => a + b, 0) - lefts.reduce((a, b) => a + b, 0)
  if (net <= 0) return forces()
  const s = new Svg()
  rect(s, 140, 85, 80, 60, '#f8e6b0', INK, 2.4); txt(s, 180, 115, 'box', 13, INK, 'middle', 700)
  const arrow = (x1: number, y: number, x2: number, label: string) => { s.line(x1, y, x2, y, 4, RUST); const d = x2 > x1 ? -1 : 1; s.parts.push(`<polygon points="${x2},${y} ${x2 + d * 14},${y - 8} ${x2 + d * 14},${y + 8}" fill="${RUST}"/>`); txt(s, (x1 + x2) / 2, y - 16, label, 13, INK, 'middle', 700) }
  rights.forEach((fv, i) => arrow(220, 100 + i * 28, 300 + i * 0, `${fv} N`))
  lefts.forEach(fv => arrow(140, 115, 60, `${fv} N`))
  return mk('The forces on the box are shown. Calculate the size of the resultant (net) force on the box, in newtons.', s.out(), one('v', 'Net force =', 'N'), { v: net }, [], `Forces to the right: ${rights.length > 1 ? `${rights.join(' + ')} = ` : ''}${rights.reduce((a, b) => a + b, 0)} N. To the left: ${lefts[0]} N. Net force = ${rights.reduce((a, b) => a + b, 0)} ${MINUS} ${lefts[0]} = ${net} N to the right.`)
}

function reflection(): GeometryQuestion {
  const th = rnd(2, 7) * 10, s = new Svg(), ox = 180, oy = 170
  s.line(40, oy, 320, oy, 3)
  for (let x = 46; x < 320; x += 14) s.line(x, oy, x - 9, oy + 12, 1.2, '#888')
  dashed(s, { x: ox, y: oy }, { x: ox, y: 30 })
  const L = 130, i = P(ox, oy, L, 90 + th), r = P(ox, oy, L, 90 - th)
  s.line(i.x, i.y, ox, oy, 3, RUST); s.line(ox, oy, r.x, r.y, 3, BLUE)
  txt(s, ox + 6, 26, 'normal', 11, '#555', 'start')
  const inc = `${th}${DEG}`
  s.wedge(ox, oy, 90, 90 + th, inc, 62, RUST)
  s.wedge(ox, oy, 90 - th, 90, 'x', 62, BLUE)
  return mk('A ray of light hits a plane mirror. The angle of incidence is shown. Find the angle of reflection x.', s.out(), one('v', 'x =', DEG), { v: th }, [], `The angle of reflection equals the angle of incidence (both measured from the normal), so x = ${th}${DEG}.`)
}

function supplydemand(): GeometryQuestion {
  const q = rnd(3, 6), p = rnd(3, 6), m1 = 1, m2 = pick([1, 1, 2])
  const a = p + m1 * q, b = p - m2 * q
  if (b < 0 || a > 12) return supplydemand()
  const s = new Svg(), x0 = 56, y0 = 190, w = 270, h = 160, qm = 10, pm = 12
  gridBox(s, x0, y0 - h, w, h, qm, pm)
  for (let v = 0; v <= qm; v += 2) txt(s, x0 + (w * v) / qm, y0 + 12, String(v), 10, '#555')
  for (let v = 0; v <= pm; v += 2) txt(s, x0 - 8, y0 - (h * v) / pm, String(v), 10, '#555', 'end')
  s.line(x0, y0, x0 + w, y0, 2); s.line(x0, y0, x0, y0 - h, 2)
  const X = (v: number) => x0 + (w * v) / qm, Y = (v: number) => y0 - (h * v) / pm
  s.line(X(0), Y(a), X((a - 0) / m1 > qm ? qm : a / m1), Y(a - m1 * Math.min(qm, a / m1)), 3, RUST)
  const sEndQ = Math.min(qm, (pm - b) / m2)
  s.line(X(0), Y(b), X(sEndQ), Y(b + m2 * sEndQ), 3, BLUE)
  txt(s, X(0) + 22, Y(a) - 10, 'D', 14, RUST, 'middle', 700); txt(s, X(sEndQ) - 12, Y(b + m2 * sEndQ) - 8, 'S', 14, BLUE, 'middle', 700)
  txt(s, x0 + w / 2, y0 + 30, 'Quantity (hundreds)', 11, '#555'); txt(s, 22, 14, 'Price (R)', 11, '#555', 'start')
  return mk('The graph shows the demand (D) and supply (S) of a product. Read the equilibrium price and quantity.', s.out(), [{ id: 'p', label: 'Price = R' }, { id: 'q', label: 'Quantity =', unit: 'hundred' }], { p, q }, [], `The curves cross where price = R${p} and quantity = ${q} hundred.`)
}

function atom(): GeometryQuestion {
  const z = rnd(3, 18), shells = [Math.min(2, z), Math.min(8, Math.max(0, z - 2)), Math.max(0, z - 10)]
  const s = new Svg(), cx = 180, cy = 120
  circle(s, cx, cy, 14, '#f2b880', INK, 2); txt(s, cx, cy, 'N', 11, INK, 'middle', 700)
  const radii = [38, 66, 94]
  shells.forEach((n, i) => {
    if (!n) return
    circle(s, cx, cy, radii[i]!, 'none', '#888', 1.4)
    for (let k = 0; k < n; k++) { const p = P(cx, cy, radii[i]!, 90 + (k * 360) / n + i * 20); s.parts.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="5.5" fill="${BLUE}" stroke="${INK}" stroke-width="1"/>`) }
  })
  txt(s, 300, 30, 'N = nucleus', 11, '#555'); txt(s, 300, 46, '● = electron', 11, BLUE)
  const outer = shells[2] || shells[1] || shells[0]
  return mk('The diagram shows the electrons of a neutral atom. Count them to find the number of electrons and the number of outer-shell electrons.', s.out(), [{ id: 'z', label: 'All the electrons:' }, { id: 'o', label: 'Outer-shell electrons:' }], { z, o: outer! }, [], `Shells hold ${shells.filter(Boolean).join(', ')} electrons, so there are ${z} in total and ${outer} in the outer shell.`)
}

const EQS: { eq: string[]; co: number[]; r?: number }[] = [
  { eq: ['H₂', 'O₂', 'H₂O'], co: [2, 1, 2] },
  { eq: ['N₂', 'H₂', 'NH₃'], co: [1, 3, 2] },
  { eq: ['Mg', 'O₂', 'MgO'], co: [2, 1, 2] },
  { eq: ['Na', 'Cl₂', 'NaCl'], co: [2, 1, 2] },
  { eq: ['Fe', 'O₂', 'Fe₂O₃'], co: [4, 3, 2] },
  { eq: ['Al', 'O₂', 'Al₂O₃'], co: [4, 3, 2] },
  { eq: ['CH₄', 'O₂', 'CO₂', 'H₂O'], co: [1, 2, 1, 2] },
  { eq: ['C₃H₈', 'O₂', 'CO₂', 'H₂O'], co: [1, 5, 3, 4] },
  { eq: ['Zn', 'HCl', 'ZnCl₂', 'H₂'], co: [1, 2, 1, 1] },
  { eq: ['KClO₃', 'KCl', 'O₂'], co: [2, 2, 3] },
  { eq: ['Ca', 'H₂O', 'Ca(OH)₂', 'H₂'], co: [1, 2, 1, 1] },
]
function balance(): GeometryQuestion {
  const e = pick(EQS), n = e.eq.length, s = new Svg()
  const react = e.r ?? (n === 3 ? 2 : 2)
  const left = e.eq.slice(0, react).join(' + '), right = e.eq.slice(react).join(' + ')
  txt(s, 180, 120, `${left}  →  ${right}`, 20, INK, 'middle', 700)
  txt(s, 180, 160, 'Type a whole number in front of each substance (1 counts).', 12, '#666')
  const fields = e.eq.map((name, i) => ({ id: `c${i}`, label: `${name}:` }))
  const values = Object.fromEntries(e.co.map((c, i) => [`c${i}`, c]))
  const full = e.eq.map((name, i) => `${e.co[i] === 1 ? '' : e.co[i]}${name}`)
  return mk('Balance the equation. Give the number (coefficient) that goes in front of each substance.', s.out(), fields, values, [], `${full.slice(0, react).join(' + ')} → ${full.slice(react).join(' + ')}`)
}

const MAKERS: Record<string, () => GeometryQuestion> = {
  pythagoras, trig, area, perimeter, quadrilateral, circle: circleGeo, clock, ruler, protractor, fraction, barchart, dotplot, pie,
  coordinates, gradient, linegraph, blocks, thermometer, cylinder, circuit, wave, speedgraph, forces, reflection, supplydemand, atom, balance,
}
export function makeDrawn(id: string): GeometryQuestion | null {
  const fn = MAKERS[id]
  if (!fn) return null
  try { return fn() } catch (err) { console.error('[tests] drawn failed', id, err); return null }
}
export { REASONS, W, H }
