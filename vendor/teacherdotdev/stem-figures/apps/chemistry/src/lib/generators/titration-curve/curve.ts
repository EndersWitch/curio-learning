// The chemistry behind a titration curve: the pH of the flask after each mL
// of titrant, from the charge balance of a monoprotic acid or base titrated
// with a strong base or acid, solved exactly (no Henderson–Hasselbalch or
// "small x" shortcuts, so the start and the equivalence point come out right).
//
// A curve comes from one of two things the teacher types:
//   • the chemistry: the analyte's molarity and volume, the titrant's
//     molarity, and pKa (weak acid) or pKb (weak base); or
//   • key points: the starting pH, the equivalence point's volume and pH, and
//     the pH at the end of the graph. The curve is then a real titration
//     whose numbers come close, stretched a little on each side of the
//     equivalence point so it passes through each point exactly.
//
// A base titrated with an acid is an acid titrated with a base turned upside
// down: swap H⁺ and OH⁻ (pH and pOH) and the equations are the same.

export const ANALYTES = ['strong-acid', 'weak-acid', 'strong-base', 'weak-base'] as const
export type Analyte = (typeof ANALYTES)[number]

export const isBase = (a: Analyte) => a.endsWith('base')
export const isWeak = (a: Analyte) => a.startsWith('weak')

/** What's in the flask and the buret. pK is pKa for a weak acid, pKb for a weak base. */
export type Chemistry = { analyte: Analyte; analyteM: number; analyteMl: number; titrantM: number; pK: number }

/** The four numbers the first teacher asked for. */
export type KeyPoints = { startPH: number; eqMl: number; eqPH: number; endPH: number }

const PKW = 14
const KW = 10 ** -PKW

/** An acid in the flask, in "acid terms": a base's pOH is worked out as if it were pH. */
type AcidFlask = { ca: number; va: number; cb: number; ka: number }

/**
 * pH (for a base, pOH) after v mL of titrant: the [H⁺] where
 * [H⁺] + [Na⁺] = [A⁻] + [OH⁻]. The left side minus the right grows with
 * [H⁺], so halving the range (in logs) finds it.
 */
function acidPH({ ca, va, cb, ka }: AcidFlask, v: number): number {
  const total = va + v
  const na = (cb * v) / total
  const ct = (ca * va) / total
  const excess = (h: number) => h + na - (Number.isFinite(ka) ? (ct * ka) / (ka + h) : ct) - KW / h
  let lo = -20
  let hi = 3
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2
    if (excess(10 ** mid) > 0) hi = mid
    else lo = mid
  }
  return -(lo + hi) / 2
}

function flask(c: Chemistry): AcidFlask {
  return { ca: c.analyteM, va: c.analyteMl, cb: c.titrantM, ka: isWeak(c.analyte) ? 10 ** -c.pK : Infinity }
}

/** The equivalence point's volume, in mL. */
export const equivalenceMl = (c: Chemistry) => (c.analyteM * c.analyteMl) / c.titrantM

/** The pH after v mL of titrant. */
export function phAt(c: Chemistry, v: number): number {
  const p = acidPH(flask(c), v)
  return isBase(c.analyte) ? PKW - p : p
}

/** The key points of a titration whose graph ends at endMl. */
export function keyPointsOf(c: Chemistry, endMl: number): KeyPoints {
  const eqMl = equivalenceMl(c)
  return { startPH: phAt(c, 0), eqMl, eqPH: phAt(c, eqMl), endPH: phAt(c, endMl) }
}

/**
 * A first guess at a titration with these key points, in acid terms (a
 * base's pH already turned into pOH), from the textbook approximations:
 *   start pH ≈ ½(pKa − log Ca), equivalence pH ≈ 7 + ½(pKa + log Ceq),
 *   and past it, [OH⁻] ≈ the excess base.
 * r is how much the flask's volume grows by the equivalence point (Veq/Va).
 */
function guessFlask(weak: boolean, p: KeyPoints, endMl: number): AcidFlask {
  const fEnd = endMl / p.eqMl
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  // The end of the graph: [OH⁻] = Ca(fEnd − 1)/(1 + r·fEnd), solved for r.
  const rFor = (ca: number) => clamp((ca * (fEnd - 1) * 10 ** (PKW - p.endPH) - 1) / fEnd, 0.05, 20)
  let ca = clamp(10 ** -p.startPH, 1e-7, 10)
  let ka = Infinity
  let r = rFor(ca)
  if (weak) {
    for (let i = 0; i < 40; i++) {
      const dilution = Math.log10(1 + r) / 2
      ca = clamp(10 ** (-(PKW / 2 - (p.eqPH - p.startPH) - dilution)), 1e-7, 10)
      ka = 10 ** -clamp(p.startPH + p.eqPH - PKW / 2 + dilution, 0.5, 13)
      r = rFor(ca)
    }
  }
  const va = p.eqMl / r
  return { ca, va, cb: (ca * va) / p.eqMl, ka }
}

// What a teacher can type for the chemistry (the fields' limits).
const LIMITS = { molarity: [1e-4, 10], volume: [0.1, 1000], pK: [0, 14] } as const

/** x solved from a·x = b, for a small square a (Gaussian elimination). */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length
  const m = a.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    const pivot = m.slice(c).reduce((best, row, k) => (Math.abs(row[c]) > Math.abs(m[best][c]) ? k + c : best), c)
    ;[m[c], m[pivot]] = [m[pivot], m[c]]
    for (let r = 0; r < n; r++) {
      if (r === c || !m[c][c]) continue
      const f = m[r][c] / m[c][c]
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k]
    }
  }
  return m.map((row, i) => (row[i] ? row[n] / row[i] : 0))
}

/**
 * The real titration, in acid terms, whose own curve comes closest to these
 * key points, within what the teacher could type for the chemistry. From the
 * first guess, it's refined (Levenberg–Marquardt) in log Ca, log r and pKa
 * until the starting, equivalence and ending pH match. A strong acid's
 * equivalence point is always at 7, so only its start and end are matched.
 */
function fitFlask(weak: boolean, p: KeyPoints, endMl: number): AcidFlask {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const [mLo, mHi] = LIMITS.molarity.map(Math.log10)
  const [vLo, vHi] = LIMITS.volume
  // u = [log Ca, log r, pKa], kept where every field stays within its limits.
  const keep = ([lca, lr, pka]: number[]) => {
    const ca = clamp(lca, mLo, mHi)
    // Va = Veq/r within its limits, and Cb = Ca/r within the molarity limits.
    const lrLo = Math.max(Math.log10(p.eqMl / vHi), ca - mHi)
    const lrHi = Math.min(Math.log10(p.eqMl / vLo), ca - mLo)
    return [ca, clamp(lr, lrLo, Math.max(lrLo, lrHi)), clamp(pka, LIMITS.pK[0], LIMITS.pK[1])]
  }
  const flaskOf = ([lca, lr, pka]: number[]): AcidFlask => {
    const ca = 10 ** lca
    const r = 10 ** lr
    return { ca, va: p.eqMl / r, cb: ca / r, ka: weak ? 10 ** -pka : Infinity }
  }
  const misses = (u: number[]) => {
    const f = flaskOf(u)
    const out = [acidPH(f, 0) - p.startPH, acidPH(f, endMl) - p.endPH]
    if (weak) out.push(acidPH(f, p.eqMl) - p.eqPH)
    return out
  }
  const size = (r: number[]) => r.reduce((sum, v) => sum + v * v, 0)

  const g = guessFlask(weak, p, endMl)
  let u = keep([Math.log10(g.ca), Math.log10(p.eqMl / g.va), weak ? -Math.log10(g.ka) : 7])
  const n = weak ? 3 : 2
  let r = misses(u)
  let damping = 1e-2
  for (let i = 0; i < 80 && size(r) > 1e-10; i++) {
    // How each miss changes with each unknown, measured.
    const jac = r.map(() => Array(n).fill(0))
    for (let k = 0; k < n; k++) {
      const h = 1e-5
      const bumped = misses(u.map((v, j) => (j === k ? v + h : v)))
      bumped.forEach((b, row) => (jac[row][k] = (b - r[row]) / h))
    }
    const jtj = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => jac.reduce((sum, row) => sum + row[a] * row[b], 0)))
    const jtr = Array.from({ length: n }, (_, a) => jac.reduce((sum, row, k) => sum + row[a] * r[k], 0))
    const step = solve(jtj.map((row, a) => row.map((v, b) => (a === b ? v * (1 + damping) + 1e-12 : v))), jtr.map((v) => -v))
    const next = keep(u.map((v, k) => v + (step[k] ?? 0)))
    const nextR = misses(next)
    if (size(nextR) < size(r)) {
      u = next
      r = nextR
      damping = Math.max(damping / 3, 1e-9)
    } else if ((damping *= 4) > 1e8) break
  }
  return flaskOf(u)
}

/**
 * The chemistry of the real titration closest to these key points, to fill
 * the concentrations in with when a teacher goes back to them.
 */
export function chemistryFor(analyte: Analyte, p: KeyPoints, endMl: number): Chemistry {
  const base = isBase(analyte)
  const acidTerms = (ph: number) => (base ? PKW - ph : ph)
  const f = fitFlask(isWeak(analyte), { ...p, startPH: acidTerms(p.startPH), eqPH: acidTerms(p.eqPH), endPH: acidTerms(p.endPH) }, endMl)
  return { analyte, analyteM: f.ca, analyteMl: f.va, titrantM: f.cb, pK: Number.isFinite(f.ka) ? -Math.log10(f.ka) : 0 }
}

/**
 * A curve through the key points: the closest real titration, with each side
 * of the equivalence point stretched the rest of the way to meet them.
 * Returns pH after v mL.
 */
export function curveThrough(analyte: Analyte, p: KeyPoints, endMl: number): (v: number) => number {
  const base = isBase(analyte)
  const acidTerms = (ph: number) => (base ? PKW - ph : ph)
  const q: KeyPoints = { ...p, startPH: acidTerms(p.startPH), eqPH: acidTerms(p.eqPH), endPH: acidTerms(p.endPH) }
  const f = fitFlask(isWeak(analyte), q, endMl)
  const t0 = acidPH(f, 0)
  const tEq = acidPH(f, p.eqMl)
  const tEnd = acidPH(f, endMl)
  const stretch = (t: number, from: [number, number], to: [number, number]) =>
    to[0] + ((t - from[0]) * (to[1] - to[0])) / (from[1] - from[0] || 1)
  return (v) => {
    const t = acidPH(f, v)
    const ph = v <= p.eqMl ? stretch(t, [t0, tEq], [q.startPH, q.eqPH]) : stretch(t, [tEq, tEnd], [q.eqPH, q.endPH])
    return acidTerms(ph)
  }
}

/**
 * Volumes to work the pH out at, from 0 to endMl: evenly spaced, and crowded
 * in close on both sides of the equivalence point, where the curve is steep.
 */
export function sampleVolumes(eqMl: number, endMl: number): number[] {
  const out = new Set<number>()
  for (let i = 0; i <= 400; i++) out.add((endMl * i) / 400)
  if (eqMl > 0 && eqMl < endMl) {
    for (let i = 0; i <= 90; i++) {
      const d = eqMl * 10 ** (-6 + (i * 5.7) / 90)
      if (eqMl - d > 0) out.add(eqMl - d)
      if (eqMl + d < endMl) out.add(eqMl + d)
    }
    out.add(eqMl)
  }
  return [...out].sort((a, b) => a - b)
}
