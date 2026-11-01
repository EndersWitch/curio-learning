// Lays out a line spectrum figure for SpectrumFigure.svelte to draw: the
// strips stacked on one wavelength scale, each with its label to the left
// and its lines, and the wavelength axis under the last strip or every one.

import { wavelengthColor } from './color'
import { elementOf } from './elements'
import { linesOf, mixtureAnswer, stripName, type MixtureStrip, type Strip } from './strips'
import type { SpectrumSettings } from './settings'

/** The strips' width, whatever the range, so figures made one at a time line up. */
export const PLOT_W = 600
export const STRIP_H = 44
export const STRIP_GAP = 14
export const LABEL_SIZE = 17
export const LABEL_GAP = 12
export const BLANK_W = 110
export const NUMBER_SIZE = 14
export const AXIS_TITLE_SIZE = 15
const MAJOR_TICK = 8
const MINOR_TICK = 4
/** The axis under a strip: ticks, numbers, and the title if there is one. */
const AXIS_H = MAJOR_TICK + NUMBER_SIZE + 8
const AXIS_TITLE_H = AXIS_TITLE_SIZE + 12
/** Room at either end for half a number hanging past the strips. */
const END_ROOM = 18

export const textWidth = (text: string, size: number) => 0.55 * size * [...text].length

export interface DrawnLine {
  x: number
  nm: number
  color: string
  opacity: number
}

export interface DrawnStrip {
  y: number
  label: { text: string } | { blank: true } | null
  lines: DrawnLine[]
  /** lines past either end of the axis, not drawn */
  outside: number
  /** whether the axis is drawn under this strip */
  axis: boolean
}

export interface Tick {
  x: number
  major: boolean
  number?: string
}

/** The label left of a strip: an element's name or symbol, a blank line for
 *  students to write it, or a custom or mixture strip's own name. */
function labelOf(strip: Strip, labels: SpectrumSettings['labels']): DrawnStrip['label'] {
  if (labels === 'none') return null
  if (strip.type === 'element') return labels === 'blank' ? { blank: true } : { text: stripName(strip, labels === 'symbols') }
  const name = stripName(strip)
  return name ? { text: name } : null
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const isMultiple = (nm: number, of: number) => Math.abs(nm / of - Math.round(nm / of)) < 1e-9

/** Tick marks every `ticks` nm and numbers every `numbers` nm, at their
 *  multiples inside the range, even where one isn't a multiple of the
 *  other (ticks every 10 and numbers every 25, say). */
function ticksFor(s: SpectrumSettings, x: (nm: number) => number): Tick[] {
  const every = Number(s.numbers)
  const tick = s.ticks === 'none' ? every : Number(s.ticks)
  const step = gcd(tick, every)
  const out: Tick[] = []
  for (let k = Math.ceil(s.from / step - 1e-9); k * step <= s.to + 1e-9; k++) {
    const nm = Math.round(k * step * 1000) / 1000
    const major = isMultiple(nm, every)
    if (!major && !isMultiple(nm, tick)) continue
    out.push({ x: x(nm), major, ...(major ? { number: String(nm) } : {}) })
  }
  return out
}

export function buildSpectrum(s: SpectrumSettings) {
  const relative = s.strength === 'relative'
  const labels = s.strips.map((strip) => labelOf(strip, s.labels))
  const labelW = Math.max(
    0,
    ...labels.map((l) => (!l ? 0 : 'blank' in l ? BLANK_W : textWidth(l.text, LABEL_SIZE))),
  )
  const x0 = Math.max(labelW ? labelW + LABEL_GAP : 0, END_ROOM)
  const x = (nm: number) => x0 + ((nm - s.from) / (s.to - s.from)) * PLOT_W
  const axisH = AXIS_H + (s.axisTitleMode === 'text' && s.axisTitle.trim() ? AXIS_TITLE_H : 0)

  let y = 0
  const strips: DrawnStrip[] = s.strips.map((strip, i) => {
    const all = linesOf(strip, s.strips, relative)
    const shown = all.filter((l) => l.nm >= s.from && l.nm <= s.to)
    const axis = s.axis === 'each' || (s.axis === 'bottom' && i === s.strips.length - 1)
    const drawn: DrawnStrip = {
      y,
      label: labels[i],
      lines: shown.map((l) => ({ x: x(l.nm), nm: l.nm, color: s.style === 'emission' ? wavelengthColor(l.nm) : '#000', opacity: l.strength })),
      outside: all.length - shown.length,
      axis,
    }
    y += STRIP_H + (axis ? axisH : 0) + (i < s.strips.length - 1 ? STRIP_GAP : 0)
    return drawn
  })

  // The rainbow behind absorption lines, a stop every 5 nm.
  const rainbow: { offset: number; color: string }[] = []
  for (let nm = s.from; nm < s.to + 5; nm += 5) {
    const at = Math.min(nm, s.to)
    rainbow.push({ offset: (at - s.from) / (s.to - s.from), color: wavelengthColor(at) })
  }

  return {
    width: x0 + PLOT_W + END_ROOM,
    height: y,
    x0,
    strips,
    ticks: ticksFor(s, x),
    axisTitle: s.axisTitleMode === 'text' ? s.axisTitle.trim() : '',
    rainbow,
    lineWidth: s.style === 'print' ? 2.5 : 3,
  }
}

export type SpectrumLayout = ReturnType<typeof buildSpectrum>

export const AXIS = { MAJOR_TICK, MINOR_TICK, AXIS_H }

/** The answer key: what each mixture is made of, and, when element strips'
 *  names are left blank, what they are from the top down. */
export function answerLines(s: SpectrumSettings): string[] {
  const lines = s.strips.filter((x): x is MixtureStrip => x.type === 'mixture').map((m) => mixtureAnswer(m, s.strips))
  if (s.labels === 'blank') {
    const blanks = s.strips.flatMap((x) => (x.type === 'element' ? [elementOf(x.element).name] : []))
    if (blanks.length) lines.unshift(`Top to bottom: ${blanks.join(', ')}`)
  }
  return lines
}

/** The figure described for screen readers, without giving away a mixture's parts. */
export function describeSpectrum(s: SpectrumSettings, layout: SpectrumLayout): string {
  const kind = { emission: 'Emission', absorption: 'Absorption', print: 'Line' }[s.style]
  const strips = layout.strips.map((d, i) => {
    const name = d.label && 'text' in d.label ? d.label.text : `Strip ${i + 1}`
    return `${name}: ${d.lines.length ? `lines at ${d.lines.map((l) => l.nm).join(', ')} nm` : 'no lines'}`
  })
  return `${kind} spectra from ${s.from} to ${s.to} nm. ${strips.join('. ')}`
}
