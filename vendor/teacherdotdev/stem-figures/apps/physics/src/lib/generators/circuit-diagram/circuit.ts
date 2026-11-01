// The generator's settings as a series/parallel tree (tree.ts), the form the
// layout draws from, and the one a planned Circuit Editor would take a circuit
// over in (docs/adr/0005). In series, round the loop from the cell or
// battery: the resistors and bulbs, then the ammeter and the switch. In
// parallel, the switch and ammeter come straight after the battery and the
// resistors and bulbs are the branches of one group, so the circuit is drawn
// as a ladder (see layout.ts).

import { labelRuns, type Label } from '$lib/shared/label'
import { newGroup, newPart, renumber, type Circuit, type Item, type Part } from './tree'
import type { CircuitSettings, Load } from './settings'

/** A resistor or bulb as a part, named automatically when its name is left empty. */
function loadPart(load: Load): Part {
  const part = newPart(load.kind)
  part.auto = load.name.text.trim() === ''
  part.name = part.auto ? { mode: load.name.mode, text: '' } : { ...load.name }
  part.value = { ...load.value }
  return part
}

export function circuitOf(s: CircuitSettings): Circuit {
  const source: Part = { ...newPart('battery'), cells: s.source === 'battery' ? 2 : 1, auto: false, name: { ...s.sourceName }, value: { ...s.sourceValue } }
  const loads = s.loads.map(loadPart)
  const across = s.voltmeter === 'source' ? source : s.voltmeter === 'none' ? undefined : loads[Number(s.voltmeter) - 1]
  if (across) across.voltmeter = { ...s.voltmeterLabel }

  const main: Item[] = []
  if (s.switch !== 'none') main.push({ ...newPart('switch'), open: s.switch === 'open', auto: false, name: { mode: 'none', text: 'S' } })
  if (s.ammeter) main.push({ ...newPart('ammeter'), value: { ...s.ammeterLabel } })
  const items: Item[] =
    s.arrangement === 'parallel' && loads.length > 1 ? [source, ...main, newGroup('parallel', loads)] : [source, ...loads, ...main.reverse()]
  return renumber({ items, current: null })
}

// The answer key, for a circuit of resistors whose values are all given as
// numbers ("12 V", "4 Omega"): the equivalent resistance, the current from
// the battery, and each resistor's current and potential difference.

const reading = (l: Label, unit: RegExp) => {
  const m = l.mode === 'text' ? l.text.trim().match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(?:${unit.source})$`)) : null
  return m ? Number(m[1]) : null
}
const round = (n: number) => String(Number(n.toPrecision(3)))

/** The answer key's lines, or null when the circuit doesn't give enough to work one out. */
export function circuitAnswer(s: CircuitSettings): string[] | null {
  if (s.switch === 'open') return ['The switch is open, so no current flows.']
  const volts = reading(s.sourceValue, /V/)
  const ohms = s.loads.map((l) => (l.kind === 'resistor' ? reading(l.value, /Omega|ohm|Ω/) : null))
  if (volts === null || ohms.some((r) => !r)) return null
  const rs = ohms as number[]
  const series = s.arrangement === 'series' || rs.length === 1
  const total = series ? rs.reduce((a, b) => a + b, 0) : 1 / rs.reduce((a, r) => a + 1 / r, 0)
  const current = volts / total
  const names = loadNames(s).map(plainText)
  return [
    `Equivalent resistance: ${round(total)} Ω`,
    `Current from the ${s.source === 'cell' ? 'cell' : 'battery'}: ${round(current)} A`,
    ...rs.map((r, i) => {
      const [v, a] = series ? [current * r, current] : [volts, volts / r]
      return `${names[i] || `Resistor ${i + 1}`}: ${round(v)} V across it, ${round(a)} A through it`
    }),
  ]
}

/** Each resistor's or bulb's name as drawn, typed or automatic (R_1, L_2…), in settings order. */
export function loadNames(s: CircuitSettings): string[] {
  const parts = circuitOf(s).items.flatMap((i) => (i.type === 'part' ? [i] : i.items)) as Part[]
  return parts.filter((p) => p.kind === 'resistor' || p.kind === 'bulb').map((p) => p.name.text)
}

const SUB: Record<string, string> = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋' }
const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' }

/** Label text as plain text for a summary: "R_1" reads R₁, "4 Omega" reads 4 Ω. */
export function plainText(text: string): string {
  return labelRuns(text)
    .map((r) => {
      const table = r.shift === 'sub' ? SUB : r.shift === 'super' ? SUP : null
      if (!table) return r.text
      const chars = [...r.text]
      return chars.every((c) => table[c]) ? chars.map((c) => table[c]).join('') : `${r.shift === 'sub' ? '_' : '^'}${r.text}`
    })
    .join('')
}
