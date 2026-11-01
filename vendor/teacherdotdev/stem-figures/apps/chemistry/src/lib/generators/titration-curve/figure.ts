// Lays out a titration curve for TitrationFigure.svelte to draw: the grid
// from $shared/graph, the curve on it, and the equivalence and
// half-equivalence points marked if the teacher wants them.

import { axisEnd, readAxes } from '$shared/graph/axes'
import { COLORS } from '$shared/graph/colors'
import { clipPath, layoutGrid, pathOf, round, type Point } from '$shared/graph/grid'
import { curveThrough, isBase, isWeak, keyPointsOf, phAt, sampleVolumes, type Analyte, type Chemistry, type KeyPoints } from './curve'
import { chemistryOf, eqMlOf, keyPointsIn, type TitrationSettings } from './settings'

const DOT_R = 5.5
const LABEL_GAP = 12 // from a marked point to its label
const BLANK_W = 120 // a write-on line for a label left blank

type Segment = { x1: number; y1: number; x2: number; y2: number }
export type Mark = {
  dot: Point
  guides: Segment[]
  label?: { x: number; y: number; text: string; anchor: 'start' | 'end' }
  blank?: Segment
}

/** What the teacher typed that doesn't make a curve, or can't be drawn, by field. */
export function checkTitration(s: TitrationSettings, endMl: number): Record<string, string> {
  const problems: Record<string, string> = {}
  const eqMl = eqMlOf(s)
  const ml = (v: number) => `${round(v)} mL`
  // From key points, the ending pH has to come after the equivalence point.
  if (s.source === 'chemistry' ? eqMl > endMl : eqMl >= endMl) {
    problems[s.source === 'chemistry' ? 'amounts' : 'eqMl'] =
      `The equivalence point, at ${ml(eqMl)}, is past the end of the x-axis (${ml(endMl)}). Make the x-axis go further, or change the ${s.source === 'chemistry' ? 'amounts' : 'volume'}.`
  }
  if (s.source === 'points') {
    const base = isBase(s.analyte)
    const rising = s.endPH > s.startPH
    if (s.endPH === s.startPH || rising === base)
      problems.endPH = base
        ? 'Adding acid lowers the pH, so the ending pH has to be lower than the starting pH.'
        : 'Adding base raises the pH, so the ending pH has to be higher than the starting pH.'
    else if ((s.eqPH - s.startPH) * (s.eqPH - s.endPH) >= 0)
      problems.eqPH = 'The equivalence point’s pH has to be between the starting and ending pH.'
  }
  return problems
}

/** Why no real titration of this kind has these key points, if one of them says. */
export function impossibleReason(analyte: Analyte, p: KeyPoints): string | null {
  if (!isWeak(analyte)) return Math.abs(p.eqPH - 7) > 0.05 ? 'A strong acid and a strong base reach equivalence at pH 7.' : null
  if (!isBase(analyte) && p.eqPH <= 7) return 'A weak acid titrated with a strong base reaches equivalence above pH 7.'
  if (isBase(analyte) && p.eqPH >= 7) return 'A weak base titrated with a strong acid reaches equivalence below pH 7.'
  return null
}

/** A gentle word when key points aren't what this kind of titration does. */
export const pointsNote = (s: TitrationSettings) => (s.source === 'points' ? impossibleReason(s.analyte, keyPointsIn(s)) : null)

/**
 * Where a titration's curve misses the key points it was worked out from,
 * as a sentence ("…starts at pH 3.53 (not 3) and ends at pH 10.47 (not 12)"),
 * or null when it meets them all to within a tenth of a pH.
 */
export function missedPoints(c: Chemistry, wanted: KeyPoints, endMl: number): string | null {
  const got = keyPointsOf(c, endMl)
  const pH = (v: number) => `pH ${Math.round(v * 100) / 100}`
  const off = (a: number, b: number) => Math.abs(a - b) > 0.1
  const parts: string[] = []
  if (off(got.startPH, wanted.startPH)) parts.push(`starts at ${pH(got.startPH)} (not ${wanted.startPH})`)
  const eqMoved = Math.abs(got.eqMl - wanted.eqMl) > wanted.eqMl * 0.01
  if (eqMoved || off(got.eqPH, wanted.eqPH))
    parts.push(`reaches equivalence at ${eqMoved ? `${round(got.eqMl)} mL, ` : ''}${pH(got.eqPH)} (not ${eqMoved ? `${wanted.eqMl} mL, ` : ''}${wanted.eqPH})`)
  if (off(got.endPH, wanted.endPH)) parts.push(`ends at ${pH(got.endPH)} (not ${wanted.endPH})`)
  if (!parts.length) return null
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return `${impossibleReason(c.analyte, wanted) ?? 'No real titration has exactly those key points.'} From these concentrations, the curve ${list}.`
}

export function buildTitration(s: TitrationSettings) {
  const axes = readAxes(s)
  const { px, box, ...grid } = layoutGrid(s, axes)
  const endMl = axisEnd(axes.x)
  const problems = checkTitration(s, endMl)
  const eqMl = eqMlOf(s)
  const drawable = !problems.endPH && !problems.eqPH && eqMl > 0
  const phOf =
    s.source === 'chemistry'
      ? (v: number) => phAt(chemistryOf(s), v)
      : curveThrough(s.analyte, keyPointsIn(s), Math.max(endMl, eqMl * 1.01))

  // The curve, cut to the grid, leaving out points too close to see.
  const curve: string[] = []
  if (drawable) {
    const pts = sampleVolumes(eqMl, endMl).map((v) => ({ x: v, y: phOf(v) }))
    for (const run of clipPath(pts, box)) {
      const drawn = run.map(px)
      const kept = drawn.filter((p, k) => k === 0 || k === drawn.length - 1 || Math.hypot(p.x - drawn[k - 1].x, p.y - drawn[k - 1].y) > 0.4)
      curve.push(pathOf(kept))
    }
  }

  // A marked point: a dot, dashed lines down and across to the axes, and its
  // label beside it, on whichever side the curve leaves room.
  const onGrid = (p: Point) => p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1
  const CHAR = grid.fs * 1.1 * 0.58
  const rising = phOf(endMl) > phOf(0)
  function mark(at: Point, style: TitrationSettings['eqMark'], mode: TitrationSettings['eqLabelMode'], text: string, side: 'level' | 'below' | 'above'): Mark | null {
    if (style === 'none' || !drawable || !onGrid(at)) return null
    const dot = px(at)
    const guides =
      style === 'guides'
        ? [
            { x1: dot.x, y1: dot.y, x2: dot.x, y2: px({ x: at.x, y: box.y0 }).y },
            { x1: dot.x, y1: dot.y, x2: px({ x: box.x0, y: at.y }).x, y2: dot.y },
          ]
        : []
    const words = mode === 'text' ? text.trim() : ''
    const width = mode === 'blank' ? BLANK_W : words.length * CHAR
    const right = dot.x + LABEL_GAP + width <= grid.grid.x + grid.grid.w + 8
    const x = right ? dot.x + LABEL_GAP : dot.x - LABEL_GAP
    const y = dot.y + { level: grid.fs * 0.4, below: grid.fs * 1.4, above: -grid.fs * 0.7 }[side]
    const out: Mark = { dot, guides }
    if (words) out.label = { x, y, text: words, anchor: right ? 'start' : 'end' }
    else if (mode === 'blank') out.blank = { x1: x, y1: y, x2: right ? x + BLANK_W : x - BLANK_W, y2: y }
    return out
  }
  const halfMl = eqMl / 2
  const marks = [
    // The curve is steep through the equivalence point, so there's room level with it.
    mark({ x: eqMl, y: phOf(eqMl) }, s.eqMark, s.eqLabelMode, s.eqLabel, 'level'),
    // Halfway, it's gentle and rising (or falling) to the right: the label goes below (or above).
    isWeak(s.analyte) ? mark({ x: halfMl, y: phOf(halfMl) }, s.halfMark, s.halfLabelMode, s.halfLabel, rising ? 'below' : 'above') : null,
  ].filter((m): m is Mark => !!m)

  return {
    ...grid,
    curve,
    color: COLORS[s.color],
    marks,
    r: DOT_R,
    problems: { ...axes.problems, ...problems },
    /** What the curve works out to, for the settings panel. */
    eq: drawable ? { ml: eqMl, ph: phOf(eqMl) } : null,
    half: drawable && isWeak(s.analyte) ? { ml: halfMl, ph: phOf(halfMl) } : null,
    endPH: drawable ? phOf(endMl) : null,
    startPH: drawable ? phOf(0) : null,
  }
}

export type TitrationLayout = ReturnType<typeof buildTitration>
