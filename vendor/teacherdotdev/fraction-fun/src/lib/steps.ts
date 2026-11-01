import { toppingsFor, type Item } from './items'
import { fractionName, fractionWords, numberWord, shareOf, type Problem } from './problem'

export type Step = 'question' | 'groups' | 'sprinkles' | 'count' | 'pick' | 'answer'

export const STEPS: Step[] = ['question', 'groups', 'sprinkles', 'count', 'pick', 'answer']

export function nextStep(step: Step): Step {
  return STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]
}


/** The value a step's confirm button needs. */
export function targetFor(problem: Problem, step: Step): number | null {
  switch (step) {
    case 'groups':
      return problem.denominator
    case 'sprinkles':
      return problem.whole
    case 'count':
      return shareOf(problem)
    case 'pick':
      return problem.numerator
    default:
      return null
  }
}

export type Hint = {
  text: string
  /** Pulse the control that moves toward the answer. */
  pulse: boolean
}

/** Hints get more direct with each wrong try (attempt 1, 2, 3+), but never set the value. */
export function hintFor(problem: Problem, step: Step, attempt: number, item: Item = 'donut'): Hint | null {
  if (attempt < 1) return null
  const pieces = capitalise(fractionName(problem.denominator, 2))
  const level = Math.min(attempt, 3)
  const texts: Partial<Record<Step, [string, string]>> = {
    groups: [
      `${pieces} means how many equal groups?`,
      `${pieces} → ${problem.denominator} equal groups.`,
    ],
    sprinkles: [
      `We're finding ${fractionWords(problem)} of how many?`,
      `We're sharing ${problem.whole} ${toppingsFor(item, problem.whole)}.`,
    ],
    pick: [
      `How many ${fractionName(problem.denominator, 2)} does the question ask for?`,
      `${capitalise(fractionWords(problem))} → keep ${numberWord(problem.numerator)} groups.`,
    ],
  }
  const pair = texts[step]
  if (!pair) return null
  return { text: level === 1 ? pair[0] : pair[1], pulse: level >= 3 }
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
