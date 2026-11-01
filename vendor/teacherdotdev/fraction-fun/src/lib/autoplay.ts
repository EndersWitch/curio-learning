// Watch mode: one press plays a whole step by driving the same actions a student's
// taps would, so the sounds and animations are exactly the interactive ones.

import type { Problem } from './problem'
import type { Step } from './steps'

/** What watch mode needs from the activity. */
export type Player = {
  groups(): number
  changeGroups(delta: number): void
  chop(): void
  thrown(): number
  throwSprinkle(): void
  share(): void
  /** Sprinkles in the counted group not counted yet. */
  uncounted(): number
  countNext(): void
  doneCounting(): void
  kept(): ReadonlySet<number>
  toggleGroup(group: number): void
  keep(): void
  start(): void
  again(): void
  wait(ms: number): Promise<void>
  /** False once the student has gone Back, so the rest of the step is dropped. */
  current(): boolean
}

/** A gap that shrinks with each repeat, so long runs speed up instead of dragging. */
export function ramp(n: number, start: number, factor: number, min: number): number {
  return Math.max(min, start * factor ** n)
}

/**
 * Plays one step from wherever it stands (Back can leave a step part-done) to the
 * step's own confirm, which moves on just as a student's press would.
 */
export async function playStep(step: Step, problem: Problem, p: Player): Promise<void> {
  switch (step) {
    case 'question':
      return p.start()

    case 'groups': {
      // −/+ ticks toward the right number of groups, showing each set of cut lines.
      await p.wait(250)
      for (let n = 0; p.groups() !== problem.denominator; n += 1) {
        if (!p.current()) return
        p.changeGroups(p.groups() < problem.denominator ? 1 : -1)
        await p.wait(ramp(n, 480, 0.92, 260))
      }
      await p.wait(300)
      if (p.current()) p.chop()
      return
    }

    case 'sprinkles': {
      for (let n = 0; p.thrown() < problem.whole; n += 1) {
        if (!p.current()) return
        p.throwSprinkle()
        await p.wait(ramp(n, 320, 0.9, 70))
      }
      if (p.current()) p.share()
      return
    }

    case 'count': {
      await p.wait(200)
      for (let n = 0; p.uncounted() > 0; n += 1) {
        if (!p.current()) return
        p.countNext()
        await p.wait(ramp(n, 520, 0.88, 160))
      }
      await p.wait(350)
      if (p.current()) p.doneCounting()
      return
    }

    case 'pick': {
      await p.wait(200)
      // Keep groups from the top, going clockwise, until there are enough.
      for (let group = 0; p.kept().size < problem.numerator; group += 1) {
        if (!p.current()) return
        if (p.kept().has(group)) continue
        p.toggleGroup(group)
        await p.wait(ramp(group, 560, 0.9, 320))
      }
      await p.wait(450)
      if (p.current()) p.keep()
      return
    }

    case 'answer':
      return p.again()
  }
}
