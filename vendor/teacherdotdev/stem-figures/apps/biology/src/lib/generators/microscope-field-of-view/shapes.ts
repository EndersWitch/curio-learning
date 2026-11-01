// The outlines of specimens drawn in the field, in pixels: a cell's smooth
// uneven outline, a paramecium, and the letter e. Each is drawn around its own
// middle; the field turns and places it.

type Point = [number, number]

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = ([x, y]: Point) => `${r2(x)} ${r2(y)}`

/** A smooth closed outline through points (a Catmull–Rom curve). */
export function smoothClosed(points: Point[]) {
  const n = points.length
  const at = (i: number) => points[(i + n) % n]
  let d = `M ${pt(at(0))}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return `${d} Z`
}

/** A round cell `r` pixels in radius whose outline reaches `radii[i]` × r in
 *  each of its evenly spaced directions. */
export function roundCell(r: number, radii: number[]) {
  const step = (2 * Math.PI) / radii.length
  return smoothClosed(radii.map((k, i) => [k * r * Math.cos(i * step), k * r * Math.sin(i * step)]))
}

// A paramecium one unit long, its blunt front end at the left and its
// narrower back end at the right, the oral groove dipping into its lower
// side: four cubic curves around, as [start, control, control, end].
const BODY: Point[][] = [
  [[-0.5, 0], [-0.5, -0.12], [-0.36, -0.155], [-0.15, -0.155]],
  [[-0.15, -0.155], [0.1, -0.155], [0.38, -0.115], [0.49, -0.035]],
  [[0.49, -0.035], [0.535, 0.005], [0.5, 0.05], [0.42, 0.075]],
  [[0.42, 0.075], [0.3, 0.12], [0.12, 0.135], [0.02, 0.115]],
  [[0.02, 0.115], [-0.06, 0.1], [-0.1, 0.075], [-0.19, 0.085]],
  [[-0.19, 0.085], [-0.32, 0.1], [-0.5, 0.125], [-0.5, 0]],
]

function bezier([p0, p1, p2, p3]: Point[], t: number): Point {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}

/** Points around the body, closely spaced, for its cilia. */
function bodyPoints(perCurve: number): Point[] {
  return BODY.flatMap((curve) => Array.from({ length: perCurve }, (_, i) => bezier(curve, i / perCurve)))
}

/** A paramecium `L` pixels long, lying along the x axis around (0, 0): its
 *  outline, oral groove, nuclei, contractile vacuoles with their radiating
 *  canals, food vacuoles and cilia, and the width of its outline. Smaller
 *  ones leave out what wouldn't show, but keep the slipper outline, a firm
 *  edge and the macronucleus: the oral groove goes below 30 px long, the
 *  other organelles below 60 px, cilia below 90 px. */
export function paramecium(L: number) {
  const s = (p: Point): Point => [p[0] * L, p[1] * L]
  const outline =
    `M ${pt(s(BODY[0][0]))}` + BODY.map((c) => ` C ${pt(s(c[1]))} ${pt(s(c[2]))} ${pt(s(c[3]))}`).join('') + ' Z'
  const organelles = L >= 60
  const vacuole = (x: number) => {
    const c: Point = [x * L, -0.045 * L]
    const r = 0.03 * L
    const canals = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3 + Math.PI / 6
      return `M ${pt([c[0] + 1.15 * r * Math.cos(a), c[1] + 1.15 * r * Math.sin(a)])} L ${pt([c[0] + 2.3 * r * Math.cos(a), c[1] + 2.3 * r * Math.sin(a)])}`
    }).join(' ')
    return { cx: r2(c[0]), cy: r2(c[1]), r: r2(r), canals }
  }
  let cilia = ''
  if (L >= 90) {
    const points = bodyPoints(Math.max(6, Math.round(L / 30)))
    const n = points.length
    const len = Math.max(3, 0.028 * L)
    cilia = points
      .map((p, i) => {
        // outward, at right angles to the outline here
        const [a, b] = [points[(i - 1 + n) % n], points[(i + 1) % n]]
        const [tx, ty] = [b[0] - a[0], b[1] - a[1]]
        const k = Math.hypot(tx, ty) || 1
        const [nx, ny] = [ty / k, -tx / k]
        const from = s(p)
        // longer ones in a tuft at the back end
        const tail = p[0] > 0.44 ? 2.2 : 1
        return `M ${pt(from)} L ${pt([from[0] + nx * len * tail, from[1] + ny * len * tail])}`
      })
      .join(' ')
  }
  return {
    outline,
    edge: r2(Math.min(1.6, Math.max(1, 0.03 * L))),
    groove: L >= 30 ? `M ${pt(s([-0.43, 0.065]))} Q ${pt(s([-0.2, 0.02]))} ${pt(s([0, 0.06]))}` : '',
    mouth: organelles ? { cx: r2(0.02 * L), cy: r2(0.065 * L), r: r2(0.02 * L) } : null,
    macronucleus: L >= 10 ? { cx: r2(0.04 * L), cy: r2(-0.025 * L), rx: r2(0.12 * L), ry: r2(0.06 * L) } : null,
    micronucleus: organelles ? { cx: r2(0.16 * L), cy: r2(-0.065 * L), r: r2(0.018 * L) } : null,
    vacuoles: organelles ? [vacuole(-0.3), vacuole(0.3)] : [],
    food: organelles
      ? [[-0.12, 0.03, 0.025], [0.2, 0.05, 0.022], [0.32, 0.015, 0.018]].map(([x, y, r]) => ({ cx: r2(x * L), cy: r2(y * L), r: r2(r * L) }))
      : [],
    cilia,
  }
}

/** A lowercase e `H` pixels tall around (0, 0), as a stroked path and its
 *  stroke's width: an oval bowl, its bar a little above the middle, open at
 *  the lower right, as it's printed the right way up. */
export function letterE(H: number) {
  const t = 0.17 * H
  const rx = (0.9 * H - t) / 2
  const ry = (H - t) / 2
  const bar = -0.06 * H
  const barRight = rx * Math.sqrt(1 - (bar / ry) ** 2)
  const end: Point = [rx * Math.cos((38 * Math.PI) / 180), ry * Math.sin((38 * Math.PI) / 180)]
  return {
    d: `M ${pt([-rx, bar])} L ${pt([barRight, bar])} A ${r2(rx)} ${r2(ry)} 0 1 0 ${pt(end)}`,
    width: r2(t),
  }
}
