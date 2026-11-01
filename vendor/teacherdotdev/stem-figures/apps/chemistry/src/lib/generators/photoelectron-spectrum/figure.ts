// Lays out a photoelectron spectrum for PesFigure.svelte to draw, as plain
// numbers. Everything is placed on the plot, 0 to W across and 0 (top) to H
// (the energy axis) down; `origin` is where the plot's top left corner goes
// so that the labels, numbers and titles around it fit.
//
// Binding energy runs high on the left to low on the right, as AP draws it.
// Core and valence energies differ a thousandfold, so the axis is in powers of
// ten, broken into a linear stretch for each group of peaks, or linear from 0
// (ADR 0006).

import { LABEL_SCALE } from '$shared/labelSize'
import { superscript } from '../orbital-diagram/configuration'
import { energyText, peaksOf, type Peak } from './spectrum'
import { keyNames, type PesSettings } from './settings'

export const W = 640
export const H = 280
const BASE_FS = 14
const SIGMA = 3.2 // a peak's width, in px
const BAR_W = 8
const GAP = 18 // between two stretches of a broken axis
const BREAK_RATIO = 2.5 // a broken axis starts a new stretch where the next peak is this many times lower
const LABEL_GAP = 6 // from a peak's top to its label
const BLANK_W = 30 // a write-on line for a sublevel's label
const STACK_GAP = 6 // between two labels, one over the other

type Segment = { x1: number; y1: number; x2: number; y2: number }
type Text = { x: number; y: number; text: string }

/** One stretch of the energy axis: energies `top` down to `bottom`, drawn
 *  from x0 to x1, in powers of ten or evenly. */
interface Stretch {
  top: number
  bottom: number
  x0: number
  x1: number
  log: boolean
}

const niceStep = (rough: number) => {
  const p = 10 ** Math.floor(Math.log10(rough))
  const m = rough / p
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p
}

/** The next nice step up from one: 1 → 2 → 5 → 10. */
const nextStep = (step: number) => niceStep(step * 1.9)

/** A tick's number, with as many decimals as its step needs. */
function tickText(v: number, step: number) {
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9))
  return Number(v.toFixed(decimals)).toLocaleString('en-US', { maximumFractionDigits: decimals })
}

const xIn = (st: Stretch, e: number) =>
  st.log
    ? st.x0 + ((Math.log10(st.top) - Math.log10(e)) / (Math.log10(st.top) - Math.log10(st.bottom))) * (st.x1 - st.x0)
    : st.x0 + ((st.top - e) / (st.top - st.bottom)) * (st.x1 - st.x0)

/** Groups of peaks close enough in energy to share a stretch of a broken
 *  axis, highest first, as each group's highest and lowest energy. */
export function peakGroups(energies: number[]): { high: number; low: number; count: number }[] {
  const sorted = [...energies].sort((a, b) => b - a)
  const groups: { high: number; low: number; count: number }[] = []
  for (const e of sorted) {
    const last = groups.at(-1)
    if (last && last.low / e < BREAK_RATIO) Object.assign(last, { low: e, count: last.count + 1 })
    else groups.push({ high: e, low: e, count: 1 })
  }
  return groups
}

/** The energy axis for these energies: its stretches, ticks and numbers,
 *  which never run into each other where it's linear, with digits `char` px wide. */
export function energyAxis(scale: PesSettings['scale'], energies: number[], char = 8.4) {
  // How far apart numbers `step` apart on a stretch from `hi` to `lo` have to be.
  const apart = (step: number, hi: number, lo: number) =>
    Math.max(tickText(hi, step).length, tickText(lo, step).length) * char + 12
  const max = Math.max(...energies)
  const min = Math.min(...energies)
  const ticks: { x: number; major: boolean }[] = []
  const numbers: Text[] = []
  const stretches: Stretch[] = []

  if (scale === 'log') {
    const hiK = Math.ceil(Math.log10(max * 1.15))
    const loK = Math.floor(Math.log10(min / 1.15))
    const st = { top: 10 ** hiK, bottom: 10 ** loK, x0: 0, x1: W, log: true }
    stretches.push(st)
    for (let k = loK; k <= hiK; k++) {
      const x = xIn(st, 10 ** k)
      ticks.push({ x, major: true })
      numbers.push({ x, y: 0, text: tickText(10 ** k, 10 ** k) })
      if (k < hiK) for (let m = 2; m <= 9; m++) ticks.push({ x: xIn(st, m * 10 ** k), major: false })
    }
  } else if (scale === 'linear') {
    let step = niceStep((max * 1.08) / 6)
    while ((step / (max * 1.08)) * W < apart(step, max * 1.08, 0)) step = nextStep(step)
    const top = Math.ceil((max * 1.08) / step) * step
    const st = { top, bottom: 0, x0: 0, x1: W, log: false }
    stretches.push(st)
    for (let k = 0; k * step <= top + step / 1e6; k++) {
      const x = xIn(st, k * step)
      ticks.push({ x, major: true })
      numbers.push({ x, y: 0, text: tickText(k * step, step) })
    }
  } else {
    const groups = peakGroups(energies)
    const weights = groups.map((g) => g.count + 1)
    const total = weights.reduce((a, b) => a + b, 0)
    const room = W - GAP * (groups.length - 1)
    let x = 0
    groups.forEach((g, i) => {
      const pad = g.high === g.low ? g.high * 0.12 : Math.max((g.high - g.low) * 0.3, g.high * 0.06)
      // Padding stops halfway (in powers of ten) to the next group, so no
      // two stretches share an energy and each peak lands in its own.
      const above = i > 0 ? Math.sqrt(groups[i - 1].low * g.high) : Infinity
      const below = i < groups.length - 1 ? Math.sqrt(g.low * groups[i + 1].high) : 0
      const top = Math.min(g.high + pad, above)
      const bottom = Math.max(0, g.low - pad, below)
      const st = { top, bottom, x0: x, x1: x + (room * weights[i]) / total, log: false }
      stretches.push(st)
      // Numbered ticks stay clear of the stretch's ends, where the next
      // stretch's numbers begin, and of each other; a narrow stretch may
      // have room for only one, at a round number near its middle.
      const range = st.top - st.bottom
      const px = (st.x1 - st.x0) / range
      let step = niceStep(range / 4)
      while (step * px < apart(step, st.top, st.bottom)) step = nextStep(step)
      // Half a number's width in from each end, clear of the break marks.
      const inset = Math.max(range * 0.04, (apart(step, st.top, st.bottom) / 2 + 4) / px)
      const values: number[] = []
      for (let v = Math.ceil((st.bottom + inset) / step) * step; v <= st.top - inset + step / 1e6; v += step) values.push(v)
      if (!values.length) {
        const mid = (st.top + st.bottom) / 2
        step = 10 ** Math.floor(Math.log10(range / 2))
        values.push(Math.round(mid / step) * step)
      }
      for (const v of values) {
        const tx = xIn(st, v)
        ticks.push({ x: tx, major: true })
        numbers.push({ x: tx, y: 0, text: tickText(v, step) })
      }
      x = st.x1 + GAP
    })
  }

  const xOf = (e: number) => {
    const st = stretches.find((s) => e <= s.top && e >= s.bottom) ?? stretches[0]
    return xIn(st, e)
  }
  numbers.sort((a, b) => a.x - b.x)
  return { stretches, ticks, numbers, xOf }
}

/** A peak's outline, standing on the axis at x, h tall. */
function peakPath(x: number, h: number) {
  const pts: string[] = []
  for (let k = -24; k <= 24; k++) {
    const t = (k / 24) * 4 * SIGMA
    pts.push(`${k === -24 ? 'M' : 'L'}${(x + t).toFixed(2)},${(H - h * Math.exp(-(t * t) / (2 * SIGMA * SIGMA))).toFixed(2)}`)
  }
  return pts.join('')
}

export type DrawnPeak = { x: number; top: number; path: string; bar: { x: number; y: number; w: number; h: number } }

/** A peak's label, bottom line first: its sublevel, then its energy. */
export type LabelLine = { text: string } | { blank: number }
export type PeakLabel = { x: number; y: number; lines: LabelLine[]; w: number }

export function buildSpectrum(s: PesSettings) {
  const fs = BASE_FS * LABEL_SCALE[s.labelSize]
  const char = fs * 0.6
  const lineH = fs * 1.25
  const main = peaksOf(s.z, s.unit)
  const other = s.compare ? peaksOf(s.compare, s.unit) : []
  const all = [...main, ...other]
  const axis = energyAxis(s.scale, all.map((p) => p.energy), char)

  // Relative number of electrons: room over the tallest peak for its label.
  const most = Math.max(...all.map((p) => p.electrons))
  const yTop = most + (most <= 4 ? 1 : 2)
  const yStep = yTop > 10 ? 2 : 1
  const yOf = (n: number) => H - (n / yTop) * H
  const yTicks = Array.from({ length: Math.floor(yTop / yStep) + 1 }, (_, k) => k * yStep)

  const draw = (p: Peak): DrawnPeak => {
    const x = axis.xOf(p.energy)
    const h = H - yOf(p.electrons)
    return { x, top: H - h, path: peakPath(x, h), bar: { x: x - BAR_W / 2, y: H - h, w: BAR_W, h } }
  }
  const peaks = main.map(draw)
  const compared = other.map(draw)

  // Labels over the main element's peaks, raised where two would overlap.
  const labels: PeakLabel[] = []
  main.forEach((p, i) => {
    const lines: LabelLine[] = []
    const count = s.counts ? String(p.electrons) : ''
    if (s.sublevels === 'text') lines.push({ text: `${p.sublevel}${count ? superscript(count) : ''}` })
    else if (s.sublevels === 'blank') lines.push({ blank: BLANK_W })
    else if (count) lines.push({ text: count })
    if (s.energies) lines.push({ text: energyText(p.energy) })
    if (!lines.length) return
    const w = Math.max(...lines.map((l) => ('text' in l ? l.text.length * char : l.blank)))
    const x = peaks[i].x
    // Over every peak it would cover, not just its own, then over any label
    // already in the way.
    const under = [...peaks, ...compared].filter((c) => Math.abs(c.x - x) < w / 2 + SIGMA * 2)
    let y = Math.min(...under.map((c) => c.top)) - LABEL_GAP
    const height = lines.length * lineH
    for (let moved = true; moved; ) {
      moved = false
      for (const l of labels) {
        const apart = Math.abs(l.x - x) >= (l.w + w) / 2 + 4
        const clear = y - height >= l.y + STACK_GAP || y <= l.y - l.lines.length * lineH - STACK_GAP
        if (!apart && !clear) {
          y = l.y - l.lines.length * lineH - STACK_GAP
          moved = true
        }
      }
    }
    labels.push({ x, y, lines, w })
  })
  const labelsTop = Math.min(0, ...labels.map((l) => l.y - l.lines.length * lineH))

  // The key, above everything at the right: the element's symbol, or both
  // elements with their lines when comparing.
  const names = keyNames(s)
  const keyShown = s.compare || s.names
  const keyY = labelsTop - fs * 0.9
  const SAMPLE = 30
  const key = keyShown
    ? names.map((name, i) => ({ name, dashed: i === 1, sample: !!s.compare }))
    : []
  const entryW = (name: string) => name.length * char * 1.05 + (s.compare ? SAMPLE + 8 : 0)
  let kx = W
  const keyEntries = [...key].reverse().map((k) => {
    kx -= entryW(k.name)
    const at = { ...k, x: kx, y: keyY }
    kx -= 22
    return at
  }).reverse()

  const numberY = H + fs + 6
  const xNumbers = axis.numbers.map((n) => ({ ...n, y: numberY }))
  const yNumW = s.yNumbers ? Math.max(...yTicks.map((t) => String(t).length)) * char + 10 : 4
  const yNumbers = s.yNumbers ? yTicks.map((t) => ({ x: -9, y: yOf(t) + fs * 0.35, text: String(t) })) : []
  const xTitle = { x: W / 2, y: numberY + fs * 1.2 + 10, text: `Binding energy (${s.unit})` }
  const yTitle = { x: -yNumW - fs * 0.9, y: H / 2, text: 'Relative number of electrons' }

  // Break marks where a broken axis jumps, at the ends of each stretch.
  const breaks: Segment[] = []
  axis.stretches.slice(1).forEach((st, i) => {
    for (const x of [axis.stretches[i].x1, st.x0]) breaks.push({ x1: x - 3, y1: H + 6, x2: x + 3, y2: H - 6 })
  })

  const top = Math.min(labelsTop, keyShown ? keyY - fs : 0)
  const left = Math.min(yTitle.x - fs * 0.8, ...labels.map((l) => l.x - l.w / 2))
  const lastNumber = xNumbers.at(-1)
  const right = Math.max(
    W,
    lastNumber ? lastNumber.x + (lastNumber.text.length * char) / 2 : W,
    ...labels.map((l) => l.x + l.w / 2),
  )
  const bottom = xTitle.y + fs * 0.4

  return {
    fs,
    lineH,
    width: right - left,
    height: bottom - top,
    origin: { x: -left, y: -top },
    xAxis: axis.stretches.map((st) => ({ x1: st.x0, x2: st.x1 })),
    breaks,
    xTicks: axis.ticks,
    xNumbers,
    yTicks: yTicks.map(yOf),
    yNumbers,
    gridlines: s.gridlines ? yTicks.slice(1).map(yOf) : [],
    peaks,
    compared,
    labels,
    key: keyEntries,
    keySample: SAMPLE,
    xTitle,
    yTitle,
  }
}

export type SpectrumLayout = ReturnType<typeof buildSpectrum>
