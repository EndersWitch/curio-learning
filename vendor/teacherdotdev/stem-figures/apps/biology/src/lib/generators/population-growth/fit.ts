// Axes fitted to the curves: round numbers, about the right number of
// squares for a graph of this shape. The page refits them whenever the
// population's numbers or the graphs change, so a teacher rarely has to type
// a range, and can still change them by hand afterwards.

import { curvesOf, hasK, solve, type Solution } from './growth'
import { againstOf, growthOf, viewsOf, type PopulationSettings, type View } from './settings'

/** Steps a range counts by: 1, 2, 2.5 and 5 times a power of ten. */
const MULTIPLES = [1, 2, 2.5, 5]

/** A number written without float noise: 0.30000000000000004 is "0.3". */
export const plain = (v: number) => String(Number(v.toPrecision(10)))

/**
 * A round range from 0 (or below, for a negative low) up past `high`, in
 * close to `blocks` squares.
 */
export function niceRange(low: number, high: number, blocks: number) {
  const lo = Math.min(0, low)
  const hi = Math.max(high, lo + 1e-9)
  const span = hi - lo
  let best = { from: 0, to: 1, step: 1, blocks: 1, miss: Infinity }
  const base = 10 ** Math.floor(Math.log10(span / blocks))
  for (const power of [base / 10, base, base * 10]) {
    for (const m of MULTIPLES) {
      const step = m * power
      const from = Math.floor(lo / step + 1e-9) * step
      const n = Math.ceil((hi - from) / step - 1e-9)
      // 2.5s only when they land on whole tens (25, 50, 75), not 2.5, 7.5.
      if (m === 2.5 && step < 10) continue
      const miss = Math.abs(n - blocks) + (n > 50 ? 100 : 0)
      if (miss < best.miss) best = { from, to: from + n * step, step, blocks: n, miss }
    }
  }
  return { from: plain(best.from), to: plain(best.to), step: plain(best.step), blocks: best.blocks }
}

/** Every nth line numbered, so numbers this wide don't crowd along an axis. */
function everyFor(blocks: number, widest: number, along: boolean) {
  const room = along ? widest * 8.5 + 10 : 0 // a number's width at medium labels
  for (const every of [1, 2, 5, 10]) if (blocks / every <= (along ? 12 : 14) && every * 32 >= room) return every
  return 10
}

/** The highest and lowest of a view, over the time the curves run (or up to N for a graph against N). */
function extent(view: View, sols: Solution[], tEnd: number) {
  let lo = Infinity
  let hi = -Infinity
  for (const sol of sols) {
    for (let i = 0; i <= 400; i++) {
      const t = (tEnd * i) / 400
      const v = view === 'size' ? sol.n(t) : view === 'rate' ? sol.rate(t) : sol.perCapita(t)
      if (Number.isFinite(v)) {
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
      }
    }
  }
  return { lo, hi }
}

/** The axis ranges that fit the settings' curves. */
export function fitAxes(s: PopulationSettings) {
  const g = growthOf(s)
  const views: readonly View[] = viewsOf(s)
  const stacked = views.length > 1
  const tall = stacked ? 8 : 10
  const curves = curvesOf(s.model)
  const tEnd = s.span
  const sols = curves.map((c) => solve(c, g, tEnd))
  // With both curves, the exponential one runs off the top: fit to the logistic.
  const fitted = s.model === 'both' ? sols.slice(0, 1) : sols
  // Room over the top of the curves; a growth rate's peak needs room for its label.
  const headroom = (view: View) =>
    s.model === 'both' ? 1.3 : view === 'size' ? (hasK(s.model) ? 1.1 : 1.08) : view === 'rate' || againstOf(s) === 'size' ? 1.25 : 1.08

  const sizeHigh = () => {
    const { hi } = extent('size', fitted, tEnd)
    return Math.max(hi, hasK(s.model) ? s.k : 0) * headroom('size')
  }
  function yRange(view: View, blocks: number) {
    if (view === 'size') return niceRange(0, sizeHigh(), blocks)
    if (againstOf(s) === 'size' && s.model !== 'overshoot' && s.model !== 'crash') {
      // Against N, a logistic curve peaks at K/2 and a lone exponential rises
      // to the end of the N axis.
      const top = view === 'percapita' ? g.r : s.model === 'exponential' ? g.r * sizeHigh() : (g.r * g.k) / 4
      return niceRange(0, top * headroom(view), blocks)
    }
    const { lo, hi } = extent(view, fitted, tEnd)
    return niceRange(lo < 0 ? lo * 1.08 : 0, hi * headroom(view), blocks)
  }

  const x = againstOf(s) === 'time' ? niceRange(0, tEnd, 20) : niceRange(0, sizeHigh(), 20)
  const y = yRange(views[0], tall)
  const y2 = stacked ? yRange(views[1], tall) : null
  const widest = (r: { from: string; to: string }) => Math.max(r.from.length, r.to.length)
  return {
    xFrom: x.from, xTo: x.to, xStep: x.step, xEvery: everyFor(x.blocks, widest(x), true),
    yFrom: y.from, yTo: y.to, yStep: y.step, yEvery: everyFor(y.blocks, widest(y), false),
    ...(y2 ? { y2From: y2.from, y2To: y2.to, y2Step: y2.step, y2Every: everyFor(y2.blocks, widest(y2), false) } : {}),
  }
}

/** How often to count the population for about a dozen census points, in round numbers. */
export function censusEveryFor(span: number) {
  const { step } = niceRange(0, span, 10)
  return Number(step)
}
