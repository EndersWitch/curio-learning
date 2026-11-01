// An element's mass spectrum as numbers: one peak per isotope at its mass
// number, as tall as its abundance, and the relative atomic mass the peaks
// average to. Peaks sit at whole numbers; the exact masses are used only for
// the average.

import { element } from '../orbital-diagram/elements'
import { ISOTOPES, ISOTOPE_ZS } from './isotopes'

/** One isotope as the teacher types it: its mass and % abundance. */
export type Typed = { mass: number; pct: number }

export type Peak = {
  /** where it sits on the m/z axis: the mass rounded to a whole number */
  mz: number
  /** the exact mass, for the relative atomic mass */
  mass: number
  pct: number
}

/** The elements with isotope data, H to Xe (but Tc) and Pt, Au, Hg, Pb and U. */
export const SYMBOLS = ISOTOPE_ZS.map((z) => element(z).symbol)

const zOf = (symbol: string) => ISOTOPE_ZS.find((z) => element(z).symbol === symbol) ?? 12

export const elementOf = (symbol: string) => element(zOf(symbol))

export const elementPeaks = (symbol: string): Peak[] => ISOTOPES[zOf(symbol)].map(([mz, mass, pct]) => ({ mz, mass, pct }))

/** Typed isotopes as peaks, lightest first. */
export const typedPeaks = (isotopes: Typed[]): Peak[] =>
  isotopes.map(({ mass, pct }) => ({ mz: Math.round(mass), mass, pct })).sort((a, b) => a.mass - b.mass)

/** The average of the peaks' masses weighted by their abundances, which
 *  needn't add up to 100. */
export function relativeAtomicMass(peaks: Peak[]): number | null {
  const total = peaks.reduce((sum, p) => sum + p.pct, 0)
  return total > 0 ? peaks.reduce((sum, p) => sum + p.mass * p.pct, 0) / total : null
}

/** The peaks' heights as % abundance, or against the tallest as 100. */
export function heightsOf(peaks: Peak[], scale: 'percent' | 'relative'): number[] {
  const tallest = Math.max(...peaks.map((p) => p.pct))
  return peaks.map((p) => (scale === 'percent' || !tallest ? p.pct : (p.pct / tallest) * 100))
}

/** An abundance over its peak: to two decimal places, or to three
 *  significant figures below 0.1 (²H's 0.0115), and 100 as 100. */
export function abundanceText(v: number): string {
  if (v === 100) return '100'
  if (v > 0 && v < 0.1) return String(Number(v.toPrecision(3)))
  return v.toFixed(2)
}

/** A mass to three decimal places, or as typed if it has fewer: "34.969", "35". */
export const massText = (mass: number) => String(Math.round(mass * 1000) / 1000)
