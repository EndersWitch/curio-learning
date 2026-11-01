// The maths behind one rounding question: which multiples of the unit sit on
// either side of the number, where halfway is, and which way it rounds.

const FORMAT_DECIMALS = 4
const EPSILON = 1e-9

export function roundingParts(n, unit) {
  const scale = scaleForUnit(unit)
  const nScaled = toScaled(n, scale)
  const unitScaled = toScaled(unit, scale)
  const startScaled = Math.floor(nScaled / unitScaled) * unitScaled
  const endScaled = startScaled + unitScaled
  const midScaled = startScaled + unitScaled / 2
  const answerScaled = nScaled >= midScaled ? endScaled : startScaled

  return {
    start: fromScaled(startScaled, scale),
    end: fromScaled(endScaled, scale),
    mid: fromScaled(midScaled, scale),
    answer: fromScaled(answerScaled, scale),
    halfway: nScaled === midScaled,
  }
}

/**
 * A fresh question for these settings. Numbers that are already multiples of
 * the unit are skipped (there is nothing to round), and so is the number that
 * was just asked, so the drill never shows the same thing twice in a row.
 */
export function randomProblem(settings, avoid = null) {
  const unit = settings.units[Math.floor(Math.random() * settings.units.length)]
  const scale = scaleForUnit(unit)
  const stepScaled = toScaled(problemStep(unit), scale)
  const unitScaled = toScaled(unit, scale)
  const maxScaled = toScaled(settings.max, scale)

  // When the range is bigger than the rounding unit, skip the below-one-unit
  // questions that round to zero. If the range is exactly one unit (for example,
  // numbers up to 1 rounded to the nearest whole), use the smaller tick step.
  const preferredLow = settings.max > unit ? unitScaled : stepScaled
  const lowScaled = Math.max(stepScaled, Math.min(preferredLow, maxScaled - stepScaled))
  const choices = Math.max(1, Math.floor((maxScaled - lowScaled - 1) / stepScaled) + 1)
  const avoidScaled = avoid === null ? null : toScaled(avoid, scale)

  let nScaled = lowScaled
  for (let attempts = 0; attempts < 500; attempts += 1) {
    const candidate = lowScaled + Math.floor(Math.random() * choices) * stepScaled
    if (candidate % unitScaled !== 0 && (avoidScaled === null || candidate !== avoidScaled || choices === 1)) {
      nScaled = candidate
      break
    }
  }

  // Extremely small ranges can make the random loop unlucky. Walk forward a few
  // ticks as a deterministic fallback before allowing a repeat.
  if (nScaled % unitScaled === 0 || (avoidScaled !== null && nScaled === avoidScaled && choices > 1)) {
    for (let i = 0; i < Math.min(choices, 25); i += 1) {
      const candidate = lowScaled + i * stepScaled
      if (candidate % unitScaled !== 0 && (avoidScaled === null || candidate !== avoidScaled)) {
        nScaled = candidate
        break
      }
    }
  }

  const n = fromScaled(nScaled, scale)
  return { n, unit, ...roundingParts(n, unit) }
}

/** A stable preview question for the teacher setup page. */
export function sampleProblem(settings) {
  const unit = Math.max(...settings.units)
  const scale = scaleForUnit(unit)
  const step = problemStep(unit)
  let start = 0

  if (settings.max > unit) {
    start = Math.floor((settings.max * 0.65) / unit) * unit
    if (start + unit >= settings.max) start = Math.max(0, settings.max - unit)
  }

  let n = fromScaled(toScaled(start + unit * 0.7, scale), scale)
  if (n >= settings.max) n = fromScaled(toScaled(settings.max - step, scale), scale)
  if (n <= 0) n = step

  return { n, unit, ...roundingParts(n, unit) }
}

// The steps a guided question walks through, in order.
export const STEPS = [
  { id: 'start', label: 'starting point' },
  { id: 'end', label: 'end point' },
  { id: 'mid', label: 'midpoint' },
  { id: 'plot', label: 'plotting' },
  { id: 'round', label: 'rounding' },
]

export function stepQuestion(step, p) {
  switch (step) {
    case 'start':
      return `What is the starting point? (The nearest ${fmt(p.unit)} below ${fmt(p.n)})`
    case 'end':
      return `What is the end point? (The nearest ${fmt(p.unit)} above ${fmt(p.n)})`
    case 'mid':
      return `What is the midpoint? (Halfway between ${fmt(p.start)} and ${fmt(p.end)})`
    case 'plot':
      return `Plot ${fmt(p.n)} on the number line. Choose the tick mark closest to where it belongs.`
    default:
      return `Is ${fmt(p.n)} closer to ${fmt(p.start)} or ${fmt(p.end)}? Which way does it round?`
  }
}

export function stepHint(step, p) {
  switch (step) {
    case 'start':
      return `Look for the multiple of ${fmt(p.unit)} just below ${fmt(p.n)}.`
    case 'end':
      return `Add ${fmt(p.unit)} to the starting point, ${fmt(p.start)}.`
    case 'mid':
      return `Halfway between ${fmt(p.start)} and ${fmt(p.end)} is ${fmt(p.start)} + ${fmt(p.unit / 2)}.`
    case 'plot':
      if (p.halfway) return `${fmt(p.n)} belongs right on the midpoint (${fmt(p.mid)}).`
      return `${fmt(p.n)} is ${p.n > p.mid ? 'greater than' : 'less than'} the midpoint (${fmt(p.mid)}), so choose a tick on that side.`
    default:
      return p.halfway
        ? `${fmt(p.n)} is exactly halfway. Halfway always rounds up.`
        : `${fmt(p.n)} is ${p.n > p.mid ? 'past' : 'before'} the midpoint (${fmt(p.mid)}).`
  }
}

export function stepAnswer(step, p) {
  if (step === 'plot') return nearestPlotValue(p)
  return step === 'round' ? p.answer : p[step]
}

/** The line has ten equal spaces; use the tick nearest to the target number. */
export function nearestPlotValue(p) {
  const scale = scaleForTick(p.start, p.end)
  const startScaled = toScaled(p.start, scale)
  const nScaled = toScaled(p.n, scale)
  const tickScaled = toScaled((p.end - p.start) / 10, scale)
  const tick = Math.max(0, Math.min(10, Math.round((nScaled - startScaled) / tickScaled)))
  return fromScaled(startScaled + tick * tickScaled, scale)
}

/** Why the number rounds the way it does, for the feedback after the last step. */
export function explainRounding(p) {
  if (p.halfway) return `${fmt(p.n)} is exactly halfway, and halfway always rounds up to ${fmt(p.end)}.`
  if (sameNumber(p.answer, p.end)) return `${fmt(p.n)} is past the midpoint (${fmt(p.mid)}), so it is closer to ${fmt(p.end)}.`
  return `${fmt(p.n)} is before the midpoint (${fmt(p.mid)}), so it is closer to ${fmt(p.start)}.`
}

export function lineTickValue(start, end, i) {
  const scale = scaleForTick(start, end)
  const startScaled = toScaled(start, scale)
  const tickScaled = toScaled((end - start) / 10, scale)
  return fromScaled(startScaled + i * tickScaled, scale)
}

export function sameNumber(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= EPSILON
}

export function fmt(n) {
  if (!Number.isFinite(n)) return String(n)
  const value = Math.abs(n) <= EPSILON ? 0 : n
  return value.toLocaleString('en-US', { maximumFractionDigits: FORMAT_DECIMALS })
}

export function problemStep(unit) {
  if (unit >= 10) return 1
  return Number((unit / 10).toFixed(decimalPlaces(unit) + 1))
}

function scaleForUnit(unit) {
  return 10 ** decimalPlaces(problemStep(unit))
}

function scaleForTick(start, end) {
  return 10 ** decimalPlaces(clean((end - start) / 10))
}

function toScaled(value, scale) {
  return Math.round(value * scale)
}

function fromScaled(value, scale) {
  return Number((value / scale).toFixed(placesForScale(scale)))
}

function placesForScale(scale) {
  return Math.max(0, Math.round(Math.log10(scale)))
}

function clean(value) {
  return Number(value.toFixed(FORMAT_DECIMALS))
}

function decimalPlaces(value) {
  const s = Math.abs(value).toString()
  if (s.includes('e-')) return Number(s.split('e-')[1])
  if (!s.includes('.')) return 0
  return s.split('.')[1].replace(/0+$/, '').length
}
