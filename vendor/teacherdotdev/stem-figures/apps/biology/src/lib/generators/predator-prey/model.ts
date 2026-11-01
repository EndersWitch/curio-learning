// The Lotka–Volterra predator–prey model, worked out numerically:
//
//   prey      dx/dt = αx − βxy   (prey grow, and are eaten)
//   predators dy/dt = δxy − γy   (predators grow on prey, and die)
//
// Both populations cycle around a balance point (x = γ/δ, y = α/β), the
// predators' peaks following the prey's. It's stepped with RK4 on the
// logarithms of the populations, so they never go below zero, at a step small
// enough that every cycle closes on the one before: the quantity
//
//   V = δx − γ ln x + βy − α ln y
//
// stays the same all the way round, as it does in the exact solution.

export type Rates = { alpha: number; beta: number; gamma: number; delta: number }
/** Both populations at one moment. */
export type Populations = { prey: number; predators: number }
/** The populations over time, at every step worked out. */
export type Run = { t: number[]; prey: number[]; predators: number[] }
/** When a population peaks or bottoms out, and how big it is then. */
export type Turn = { t: number; value: number }

/** Where neither population changes, and the average of each over a cycle. */
export const balanceOf = (r: Rates): Populations => ({ prey: r.gamma / r.delta, predators: r.alpha / r.beta })

/** The quantity that stays the same around a cycle. */
export const conserved = (r: Rates, p: Populations) =>
  r.delta * p.prey - r.gamma * Math.log(p.prey) + r.beta * p.predators - r.alpha * Math.log(p.predators)

/** How long a cycle takes when the populations stay close to the balance point. */
export const smallCyclePeriod = (r: Rates) => (2 * Math.PI) / Math.sqrt(r.alpha * r.gamma)

/**
 * The two values where a·v − b·ln(v) (lowest at v = b/a) equals `level`:
 * the low and high of one population around the cycle.
 */
function bothRoots(a: number, b: number, level: number): [number, number] {
  const mid = b / a
  const f = (v: number) => a * v - b * Math.log(v) - level
  if (f(mid) >= 0) return [mid, mid]
  // Bisect on a log scale: the low root can be many orders of magnitude down.
  const solve = (lo: number, hi: number) => {
    for (let k = 0; k < 200; k++) {
      const m = Math.sqrt(lo * hi)
      if (f(m) > 0 === f(lo) > 0) lo = m
      else hi = m
    }
    return Math.sqrt(lo * hi)
  }
  let lo = mid
  while (f(lo) < 0 && lo > 1e-300) lo /= 10
  let hi = mid
  while (f(hi) < 0) hi *= 10
  return [solve(lo, mid), solve(mid, hi)]
}

/** The lowest and highest each population reaches around the cycle through `start`, exactly. */
export function extremesOf(r: Rates, start: Populations) {
  const v = conserved(r, start)
  const b = balanceOf(r)
  // At the prey's turning points the predators are at their balance, and the other way round.
  const prey = bothRoots(r.delta, r.gamma, v - (r.beta * b.predators - r.alpha * Math.log(b.predators)))
  const predators = bothRoots(r.beta, r.alpha, v - (r.delta * b.prey - r.gamma * Math.log(b.prey)))
  return { prey: { low: prey[0], high: prey[1] }, predators: { low: predators[0], high: predators[1] } }
}

/** A step small enough for the fastest change around this cycle. */
function stepFor(r: Rates, start: Populations) {
  const e = extremesOf(r, start)
  const fastest = Math.max(r.alpha, r.beta * e.predators.high, r.gamma, r.delta * e.prey.high)
  return 0.01 / fastest
}

/** One RK4 step of the model, on the logarithms (u, v) of the populations. */
function rk4(r: Rates, u: number, v: number, dt: number): [number, number] {
  const du = (v: number) => r.alpha - r.beta * Math.exp(v)
  const dv = (u: number) => r.delta * Math.exp(u) - r.gamma
  const k1u = du(v), k1v = dv(u)
  const k2u = du(v + (dt / 2) * k1v), k2v = dv(u + (dt / 2) * k1u)
  const k3u = du(v + (dt / 2) * k2v), k3v = dv(u + (dt / 2) * k2u)
  const k4u = du(v + dt * k3v), k4v = dv(u + dt * k3u)
  return [u + (dt / 6) * (k1u + 2 * k2u + 2 * k3u + k4u), v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)]
}

const MAX_STEPS = 200_000

/** The populations from time 0 to `end`, starting from `start`. */
export function simulate(r: Rates, start: Populations, end: number): Run {
  const n = Math.min(MAX_STEPS, Math.max(200, Math.ceil(end / stepFor(r, start))))
  const dt = end / n
  const run: Run = { t: [0], prey: [start.prey], predators: [start.predators] }
  let u = Math.log(start.prey)
  let v = Math.log(start.predators)
  for (let k = 1; k <= n; k++) {
    const next = rk4(r, u, v, dt)
    u = next[0]
    v = next[1]
    run.t.push(k * dt)
    run.prey.push(Math.exp(u))
    run.predators.push(Math.exp(v))
  }
  return run
}

/** Whether a start is (all but) the balance point, where nothing cycles. */
export function atBalance(r: Rates, start: Populations) {
  const b = balanceOf(r)
  return Math.abs(start.prey / b.prey - 1) < 1e-6 && Math.abs(start.predators / b.predators - 1) < 1e-6
}

/**
 * The times a run crosses `level`, going up (`rising`) or down, found between
 * the steps either side.
 */
function crossings(t: number[], values: number[], level: number, rising: boolean) {
  const out: number[] = []
  for (let k = 1; k < values.length; k++) {
    const a = values[k - 1] - level
    const b = values[k] - level
    if (rising ? a < 0 && b >= 0 : a > 0 && b <= 0) out.push(t[k - 1] + (t[k] - t[k - 1]) * (a / (a - b)))
  }
  return out
}

/** A run's value at time `at`, between the steps either side. */
export function valueAt(t: number[], values: number[], at: number) {
  if (at <= t[0]) return values[0]
  if (at >= t[t.length - 1]) return values[values.length - 1]
  const dt = t[1] - t[0]
  const k = Math.min(t.length - 2, Math.floor((at - t[0]) / dt))
  const f = (at - t[k]) / (t[k + 1] - t[k])
  return values[k] + (values[k + 1] - values[k]) * f
}

/**
 * Each population's peaks and lows over a run. The prey turn where the
 * predators pass their balance (rising at a prey peak), and the predators
 * turn where the prey pass theirs (falling at a predator peak).
 */
export function turnsOf(r: Rates, run: Run) {
  const b = balanceOf(r)
  const at = (times: number[], values: number[]) => times.map((t) => ({ t, value: valueAt(run.t, values, t) }))
  return {
    preyPeaks: at(crossings(run.t, run.predators, b.predators, true), run.prey),
    preyLows: at(crossings(run.t, run.predators, b.predators, false), run.prey),
    predatorPeaks: at(crossings(run.t, run.prey, b.prey, false), run.predators),
    predatorLows: at(crossings(run.t, run.prey, b.prey, true), run.predators),
  }
}

/** How long one full cycle through `start` takes, worked out by running it round. */
export function periodOf(r: Rates, start: Populations) {
  if (atBalance(r, start)) return smallCyclePeriod(r)
  // A big cycle takes longer than a small one; run on until two prey peaks show.
  let end = smallCyclePeriod(r) * 2.5
  for (let tries = 0; tries < 8; tries++, end *= 2) {
    const peaks = turnsOf(r, simulate(r, start, end)).preyPeaks
    if (peaks.length >= 2) return peaks[1].t - peaks[0].t
  }
  return smallCyclePeriod(r)
}

/** How long after a prey peak the predators peak, on the cycle through `start`. */
export function lagOf(r: Rates, start: Populations, period = periodOf(r, start)) {
  if (atBalance(r, start)) return period / 4
  const turns = turnsOf(r, simulate(r, start, period * 2.2))
  const prey = turns.preyPeaks[0]
  const predators = prey && turns.predatorPeaks.find((p) => p.t > prey.t)
  return prey && predators ? predators.t - prey.t : period / 4
}

/**
 * The rates for a cycle around `balance`, through `start`, taking `period`
 * to come round. The prey's growth rate (α) and the predators' death rate (γ)
 * are kept equal, so the two populations swing about as far, each against
 * its own balance; the size of the swing comes from how far the start is
 * from the balance point.
 */
export function ratesFor(balance: Populations, start: Populations, period: number): Rates {
  const base: Rates = { alpha: 1, beta: 1 / balance.predators, gamma: 1, delta: 1 / balance.prey }
  // Speeding every rate up by k leaves the cycle's shape and shortens it by k.
  const k = periodOf(base, start) / period
  return { alpha: k, beta: k / balance.predators, gamma: k, delta: k / balance.prey }
}

/** A random number generator that gives the same numbers for the same seed (mulberry32). */
export function seeded(seed: number) {
  let a = Math.floor(seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Census = { t: number; prey: number; predators: number }

/**
 * Counts taken every `every` time units from a run, each off by up to about
 * `noise` (a fraction, 0.1 for 10%) the way a real census is, the same each
 * time for the same seed.
 */
export function censusOf(run: Run, every: number, noise: number, seed: number): Census[] {
  const random = seeded(seed)
  // Normally distributed, by Box–Muller, then as a factor that keeps counts above zero.
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  const off = () => (noise > 0 ? Math.exp(noise * normal() - (noise * noise) / 2) : 1)
  const end = run.t[run.t.length - 1]
  const out: Census[] = []
  for (let k = 0; k * every <= end + 1e-9; k++) {
    const t = k * every
    out.push({ t, prey: valueAt(run.t, run.prey, t) * off(), predators: valueAt(run.t, run.predators, t) * off() })
  }
  return out
}
