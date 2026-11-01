// The ecology behind a population growth graph, in the terms OpenStax Biology
// 2e uses (45.3, Environmental Limits to Population Growth):
//
//   exponential growth   dN/dt = rN           a J-shaped curve
//   logistic growth      dN/dt = rN(K − N)/K  an S-shaped curve, leveling at
//                                            the carrying capacity K
//
// r is the per capita growth rate with room to grow (r max), per unit of
// time. Divided by N, the growth rate is the per capita growth rate: r for
// exponential growth whatever N is, and r(K − N)/K for logistic growth,
// falling in a straight line to 0 at K.
//
// Two more curves for the populations textbooks show that don't settle
// smoothly at K:
//
//   overshoot   logistic growth that feels crowding late, a lag τ behind:
//               dN/dt = rN(1 − N(t − τ)/K). It overshoots K and oscillates
//               around it, the swings dying away when rτ is below about 1.57
//               (π/2) and lasting for good above it.
//   crash       a population using up food that doesn't grow back. Each
//               individual's growth rate falls as food is used,
//               dN/dt = N(r − δF), dF/dt = N, so the population booms to a
//               peak and then crashes. δ is set by the peak the teacher types:
//               N peaks at N₀ + r²/2δ.

export const MODELS = ['logistic', 'exponential', 'both', 'overshoot', 'crash'] as const
export type Model = (typeof MODELS)[number]

/** One curve on the graph; `both` draws logistic and exponential. */
export type Curve = 'logistic' | 'exponential' | 'overshoot' | 'crash'

/** The numbers a curve comes from. k is the carrying capacity, or the peak for a crash. */
export type Growth = { n0: number; r: number; k: number; lag: number }

export const curvesOf = (m: Model): Curve[] => (m === 'both' ? ['logistic', 'exponential'] : [m])

/** Whether the model has a carrying capacity to draw. */
export const hasK = (m: Model) => m === 'logistic' || m === 'both' || m === 'overshoot'
/** Whether a logistic curve is on the graph, for its inflection point and phases. */
export const hasLogistic = (m: Model) => m === 'logistic' || m === 'both'

/** A curve worked out: N, dN/dt and (dN/dt)/N at any time from 0 on. */
export type Solution = { n(t: number): number; rate(t: number): number; perCapita(t: number): number }

const logisticN = ({ n0, r, k }: Growth, t: number) => k / (1 + ((k - n0) / n0) * Math.exp(-r * t))

export function solve(curve: Curve, g: Growth, tEnd: number): Solution {
  if (curve === 'exponential') {
    const n = (t: number) => g.n0 * Math.exp(g.r * t)
    return { n, rate: (t) => g.r * n(t), perCapita: () => g.r }
  }
  if (curve === 'logistic') {
    const n = (t: number) => logisticN(g, t)
    return { n, rate: (t) => g.r * n(t) * (1 - n(t) / g.k), perCapita: (t) => g.r * (1 - n(t) / g.k) }
  }
  return curve === 'overshoot' ? overshoot(g, tEnd) : crash(g, tEnd)
}

/** Steps for solving a curve numerically, and reading it back between them. */
const STEPS = 4000

function tabulated(ts: number[], ns: number[], pcs: number[]): Solution {
  const dt = ts[1] - ts[0]
  const at = (values: number[], t: number) => {
    const i = Math.min(values.length - 2, Math.max(0, Math.floor(t / dt)))
    const f = Math.min(1, Math.max(0, t / dt - i))
    return values[i] + (values[i + 1] - values[i]) * f
  }
  return { n: (t) => at(ns, t), perCapita: (t) => at(pcs, t), rate: (t) => at(ns, t) * at(pcs, t) }
}

/** Logistic growth with a lag: before time 0 the population was N₀. */
function overshoot({ n0, r, k, lag }: Growth, tEnd: number): Solution {
  const end = Math.max(tEnd, 1e-6)
  // Fine enough steps for the lag, but never more than ten times the usual.
  const dt = Math.max(end / (10 * STEPS), Math.min(end / STEPS, lag > 0 ? lag / 40 : Infinity))
  const steps = Math.ceil(end / dt) + 1
  const ns = [n0]
  // N at a time already worked out (or before 0), for the lagged crowding.
  const past = (t: number) => {
    if (t <= 0) return n0
    const i = Math.min(ns.length - 2, Math.floor(t / dt))
    const f = t / dt - i
    return ns[i] + (ns[Math.min(i + 1, ns.length - 1)] - ns[i]) * f
  }
  const pc = (t: number) => r * (1 - past(t - lag) / k)
  // Heun's method; the lagged N always comes from steps already taken.
  for (let i = 1; i < steps; i++) {
    const t = (i - 1) * dt
    const n = ns[i - 1]
    const a = n * pc(t)
    const guess = n + a * dt
    ns.push(Math.max(0, n + ((a + guess * (lag > 0 ? pc(t + dt) : r * (1 - guess / k))) * dt) / 2))
  }
  const ts = ns.map((_, i) => i * dt)
  return tabulated(ts, ns, ts.map(pc))
}

/** Boom and crash: per capita growth falls as food that doesn't grow back is used. */
function crash({ n0, r, k }: Growth, tEnd: number): Solution {
  const delta = (r * r) / (2 * Math.max(k - n0, 1e-9))
  const dt = Math.max(tEnd, 1e-6) / STEPS
  // dN/dt = N(r − δF), dF/dt = N, by Runge–Kutta.
  const f = (n: number, used: number) => [n * (r - delta * used), n]
  const ns = [n0]
  const pcs = [r]
  let n = n0
  let used = 0
  for (let i = 1; i <= STEPS; i++) {
    const [a1, b1] = f(n, used)
    const [a2, b2] = f(n + (a1 * dt) / 2, used + (b1 * dt) / 2)
    const [a3, b3] = f(n + (a2 * dt) / 2, used + (b2 * dt) / 2)
    const [a4, b4] = f(n + a3 * dt, used + b3 * dt)
    n = Math.max(0, n + ((a1 + 2 * a2 + 2 * a3 + a4) * dt) / 6)
    used += ((b1 + 2 * b2 + 2 * b3 + b4) * dt) / 6
    ns.push(n)
    pcs.push(r - delta * used)
  }
  return tabulated(ns.map((_, i) => i * dt), ns, pcs)
}

/** A logistic curve's growth rate and per capita growth rate at a population size. */
export const rateAtN = (curve: 'logistic' | 'exponential', g: Growth, n: number) => (curve === 'exponential' ? g.r * n : g.r * n * (1 - n / g.k))
export const perCapitaAtN = (curve: 'logistic' | 'exponential', g: Growth, n: number) => (curve === 'exponential' ? g.r : g.r * (1 - n / g.k))

/**
 * Where a logistic curve bends from speeding up to slowing down: at N = K/2,
 * where it grows fastest, rK/4 a unit of time. Null when it starts at K/2 or
 * above, so never passes through it.
 */
export function inflection(g: Growth): { t: number; n: number; rate: number } | null {
  if (!(g.n0 > 0 && g.n0 < g.k / 2)) return null
  return { t: Math.log((g.k - g.n0) / g.n0) / g.r, n: g.k / 2, rate: (g.r * g.k) / 4 }
}

/**
 * The lag, exponential and stationary phases of a logistic curve. Their
 * edges are where the steepest tangent (through the inflection point) meets
 * the starting size and K, the way a growth curve's lag is measured. Null
 * when there's no inflection point; `lagEnd` is null when the curve starts
 * steep, with no lag phase.
 */
export function phases(g: Growth): { lagEnd: number | null; stationary: number } | null {
  const p = inflection(g)
  if (!p) return null
  const lagEnd = p.t - (g.k / 2 - g.n0) / p.rate
  const stationary = p.t + g.k / 2 / p.rate
  // A lag too short to see (starting near K/2) is left out.
  return { lagEnd: lagEnd > 0.05 * stationary ? lagEnd : null, stationary }
}

/** What the teacher typed that can't make a curve, by field. */
export function checkGrowth(model: Model, g: Growth): Record<string, string> {
  const problems: Record<string, string> = {}
  if (!(g.n0 > 0)) problems.n0 = 'The starting population has to be more than 0.'
  if (!(g.r > 0)) problems.r = 'The growth rate r has to be more than 0.'
  if (model === 'crash' && g.k <= g.n0) problems.k = 'The peak has to be bigger than the starting population.'
  return problems
}

/** A repeatable stream of random numbers from 0 to 1 (mulberry32). */
export function random(seed: number) {
  let a = Math.floor(seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** Decimals a census is written to: whole individuals unless the numbers are small (like millions of cells). */
export const censusDecimals = (largest: number) => (largest < 10 ? 2 : largest < 100 ? 1 : 0)

/**
 * A census: the population counted every `every` units of time from 0 to
 * `tEnd`, each count off the curve by a random few percent (`noise`, the
 * standard deviation), the same for the same `seed`. The first count is N₀.
 */
export function census(sol: Solution, every: number, tEnd: number, noise: number, seed: number) {
  const next = random(seed)
  const count = Math.min(200, Math.floor(tEnd / every + 1e-9))
  const exact = Array.from({ length: count + 1 }, (_, i) => ({ t: Number((i * every).toPrecision(12)), n: sol.n(i * every) }))
  const decimals = censusDecimals(Math.max(...exact.map((p) => p.n)))
  const tenths = 10 ** decimals
  return exact.map(({ t, n }, i) => {
    // Box–Muller, for counts off by a normal amount.
    const z = Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next())
    const counted = i === 0 ? n : Math.max(0, n * (1 + (noise / 100) * z))
    return { t, n: Math.round(counted * tenths) / tenths }
  })
}
