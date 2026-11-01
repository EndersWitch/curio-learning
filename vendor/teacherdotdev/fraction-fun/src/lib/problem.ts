export type Problem = {
  numerator: number
  denominator: number
  whole: number
}

export const DEFAULT_PROBLEM: Problem = { numerator: 1, denominator: 4, whole: 20 }

export const MIN_DENOMINATOR = 2
export const MAX_DENOMINATOR = 12
export const MAX_WHOLE = 60

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
]

const FRACTION_NAMES: Record<number, [singular: string, plural: string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['fourth', 'fourths'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
  11: ['eleventh', 'elevenths'],
  12: ['twelfth', 'twelfths'],
}

/** Reads `?n=1&d=4&of=20`. Any invalid value falls back to the whole default problem. */
export function problemFromParams(params: URLSearchParams): Problem {
  const numerator = Number(params.get('n') ?? DEFAULT_PROBLEM.numerator)
  const denominator = Number(params.get('d') ?? DEFAULT_PROBLEM.denominator)
  const whole = Number(params.get('of') ?? DEFAULT_PROBLEM.whole)
  const problem = { numerator, denominator, whole }
  return isValidProblem(problem) ? problem : DEFAULT_PROBLEM
}

export function isValidProblem({ numerator, denominator, whole }: Problem): boolean {
  return (
    [numerator, denominator, whole].every(Number.isInteger) &&
    denominator >= MIN_DENOMINATOR &&
    denominator <= MAX_DENOMINATOR &&
    numerator >= 1 &&
    numerator < denominator &&
    whole >= denominator &&
    whole <= MAX_WHOLE &&
    whole % denominator === 0
  )
}

/** How many sprinkles land on each group. */
export function shareOf(problem: Problem): number {
  return problem.whole / problem.denominator
}

export function answerOf(problem: Problem): number {
  return shareOf(problem) * problem.numerator
}

export function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value)
}

/** "fourth" for one, "fourths" for any other count. */
export function fractionName(denominator: number, count = 1): string {
  const [singular, plural] = FRACTION_NAMES[denominator]
  return count === 1 ? singular : plural
}

/** "one fourth", "two fourths". */
export function fractionWords(problem: Problem): string {
  return `${numberWord(problem.numerator)} ${fractionName(problem.denominator, problem.numerator)}`
}

// ——— Mode ———

/** Interactive: the student does each step. Watch: each press plays the next step. */
export type Mode = 'interactive' | 'watch'

/** Reads `?mode=watch`. Anything else is the interactive default. */
export function modeFromParams(params: URLSearchParams): Mode {
  return params.get('mode') === 'watch' ? 'watch' : 'interactive'
}

// ——— Teacher setup ———

function isValidDenominator(denominator: number): boolean {
  return Number.isInteger(denominator) && denominator >= MIN_DENOMINATOR && denominator <= MAX_DENOMINATOR
}

/**
 * The wholes closest to `whole` that split evenly into `denominator` groups and stay
 * countable (at most 60): 22 in fourths → [20, 24]. A whole that already works comes
 * back on its own. Empty when the denominator itself is out of range.
 */
export function nearestWholes(whole: number, denominator: number): number[] {
  if (!isValidDenominator(denominator)) return []
  const largest = Math.floor(MAX_WHOLE / denominator) * denominator
  if (!Number.isFinite(whole) || whole <= denominator) return [denominator]
  if (whole >= largest) return [largest]
  const below = Math.floor(whole / denominator) * denominator
  if (below === whole) return [whole]
  return [below, below + denominator]
}

export type ProblemField = 'numerator' | 'denominator' | 'whole'

export type ProblemIssue = {
  field: ProblemField
  message: string
  /** Wholes that would work instead, for one-tap fixes. */
  suggestions?: number[]
}

/**
 * Why a problem can't be used, in a teacher's words. Empty exactly when
 * `isValidProblem` is true.
 */
export function problemIssues({ numerator, denominator, whole }: Problem): ProblemIssue[] {
  const issues: ProblemIssue[] = []
  const denominatorOk = isValidDenominator(denominator)
  if (!denominatorOk) {
    issues.push({
      field: 'denominator',
      message: `The denominator must be a whole number from ${MIN_DENOMINATOR} to ${MAX_DENOMINATOR}.`,
    })
  }

  if (!Number.isInteger(numerator) || numerator < 1) {
    issues.push({ field: 'numerator', message: 'The numerator must be a whole number, 1 or more.' })
  } else if (denominatorOk && numerator >= denominator) {
    issues.push({
      field: 'numerator',
      message: `The numerator must be less than the denominator (${denominator}), so students keep some of the groups but not all of them.`,
    })
  }

  if (!Number.isInteger(whole) || whole < 1) {
    issues.push({ field: 'whole', message: 'The whole must be a whole number, 1 or more.' })
  } else if (whole > MAX_WHOLE) {
    issues.push({
      field: 'whole',
      message: `The whole can be at most ${MAX_WHOLE}, so students can still count them.`,
      suggestions: nearestWholes(whole, denominator),
    })
  } else if (denominatorOk && whole % denominator !== 0) {
    issues.push({
      field: 'whole',
      message: `${whole} doesn't split evenly into ${denominator} equal groups.`,
      suggestions: nearestWholes(whole, denominator),
    })
  }
  return issues
}

/** The query for a student link: the inverse of `problemFromParams` and `modeFromParams`. */
export function problemQuery(
  { numerator, denominator, whole }: Problem,
  { item, mode }: { item?: string; mode?: Mode } = {},
): string {
  const params = new URLSearchParams({ n: String(numerator), d: String(denominator), of: String(whole) })
  // The defaults (donut, interactive) stay out of the link so it's as short as it can be.
  if (item && item !== 'donut') params.set('item', item)
  if (mode === 'watch') params.set('mode', 'watch')
  return params.toString()
}
