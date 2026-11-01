// Turns the activity settings into URL text (for a shareable link) and back.

import { fmt } from './rounding.js'

export const UNITS = [0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000]
export const MAXES = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000]
export const MAX_QUESTIONS = 100

export const DEFAULT_SETTINGS = {
  units: [10],      // round to any place from thousandths through millions
  max: 100,         // numbers go up to this (like the classroom 0–100 line)
  count: 10,        // questions in the drill
  mode: 'guided',   // 'guided' asks start, end, midpoint then round; 'quick' just asks round
  plot: false,      // ask students to place the number on the line before rounding
  labels: false,    // number every tick mark on the line
  retry: false,     // let students try a step again after a wrong answer
}

export function settingsToQuery(s) {
  const p = new URLSearchParams()
  p.set('to', s.units.join(','))
  p.set('max', String(s.max))
  p.set('n', String(s.count))
  p.set('mode', s.mode)
  p.set('plot', s.plot ? '1' : '0')
  p.set('labels', s.labels ? '1' : '0')
  p.set('retry', s.retry ? '1' : '0')
  return p.toString()
}

export function settingsFromParams(params) {
  const d = DEFAULT_SETTINGS
  const max = MAXES.includes(Number(params.get('max'))) ? Number(params.get('max')) : d.max
  // Only units that fit inside the range make sense; anything else falls back.
  const units = (params.get('to') ?? '')
    .split(',')
    .map(Number)
    .filter((u) => UNITS.includes(u) && u <= max)
    .sort((a, b) => a - b)
  const mode = params.get('mode') === 'quick' ? 'quick' : 'guided'
  return {
    units: units.length ? units : usableUnits(max, d.units),
    max,
    count: clampCount(params.get('n'), d.count),
    mode,
    plot: bool(params.get('plot'), d.plot),
    labels: bool(params.get('labels'), d.labels),
    retry: bool(params.get('retry'), d.retry),
  }
}

/** Keep the chosen units inside the range, falling back to the largest usable unit. */
export function usableUnits(max, units) {
  const kept = units.filter((u) => u <= max).sort((a, b) => a - b)
  if (kept.length) return kept
  return [[...UNITS].reverse().find((u) => u <= max) ?? UNITS[0]]
}

export function clampCount(v, fallback) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(MAX_QUESTIONS, n)
}

function bool(v, fallback) {
  if (v === '1') return true
  if (v === '0') return false
  return fallback
}

/** A one-line summary of the settings, for the start gate and the report. */
export function describeSettings(s) {
  const units = s.units.map((u) => fmt(u))
  const unitText = units.length === 1 ? units[0] : units.slice(0, -1).join(', ') + ' or ' + units.at(-1)
  const parts = [
    `Round to the nearest ${unitText}`,
    `numbers up to ${fmt(s.max)}`,
    `${s.count} question${s.count === 1 ? '' : 's'}`,
    s.mode === 'guided' ? 'guided steps' : 'quick rounding',
  ]
  if (s.plot) parts.push('students plot each number')
  if (s.labels) parts.push('every tick numbered')
  if (s.retry) parts.push('retries allowed')
  return parts.join(' · ')
}
