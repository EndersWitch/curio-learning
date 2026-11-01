import { describe, expect, it } from 'vitest'
import { playStep, ramp, type Player } from './autoplay'
import {
  isValidProblem,
  modeFromParams,
  nearestWholes,
  problemFromParams,
  problemIssues,
  problemQuery,
} from './problem'

const params = (query: string) => new URLSearchParams(query)

describe('mode', () => {
  it('is interactive unless the link says watch', () => {
    expect(modeFromParams(params(''))).toBe('interactive')
    expect(modeFromParams(params('mode=watch'))).toBe('watch')
    expect(modeFromParams(params('mode=WATCH'))).toBe('interactive')
    expect(modeFromParams(params('mode=play'))).toBe('interactive')
  })

  it("doesn't change how the problem is read", () => {
    expect(problemFromParams(params('n=3&d=4&of=24&mode=watch&item=pizza'))).toEqual({
      numerator: 3,
      denominator: 4,
      whole: 24,
    })
  })
})

describe('nearestWholes', () => {
  it('suggests the multiples either side', () => {
    expect(nearestWholes(22, 4)).toEqual([20, 24])
    expect(nearestWholes(21, 4)).toEqual([20, 24])
    expect(nearestWholes(24, 5)).toEqual([20, 25])
  })

  it('keeps a whole that already works', () => {
    expect(nearestWholes(24, 4)).toEqual([24])
  })

  it('stays between one share each and 60', () => {
    expect(nearestWholes(2, 4)).toEqual([4])
    expect(nearestWholes(0, 7)).toEqual([7])
    expect(nearestWholes(47, 5)).toEqual([45, 50])
    expect(nearestWholes(70, 7)).toEqual([56])
    expect(nearestWholes(62, 4)).toEqual([60])
    expect(nearestWholes(46, 4)).toEqual([44, 48])
  })

  it('has nothing to suggest without a usable denominator', () => {
    expect(nearestWholes(20, 13)).toEqual([])
    expect(nearestWholes(20, NaN)).toEqual([])
  })
})

describe('problemIssues', () => {
  it('explains an uneven whole with suggestions', () => {
    expect(problemIssues({ numerator: 3, denominator: 4, whole: 22 })).toEqual([
      { field: 'whole', message: "22 doesn't split evenly into 4 equal groups.", suggestions: [20, 24] },
    ])
  })

  it('names each problem field', () => {
    const fields = (n: number, d: number, of: number) =>
      problemIssues({ numerator: n, denominator: d, whole: of }).map((issue) => issue.field)
    expect(fields(4, 4, 20)).toEqual(['numerator'])
    expect(fields(0, 4, 20)).toEqual(['numerator'])
    expect(fields(1, 13, 26)).toEqual(['denominator'])
    expect(fields(1, 4, 64)).toEqual(['whole'])
    expect(fields(1, 4, NaN)).toEqual(['whole'])
  })

  it('agrees with isValidProblem', () => {
    for (let d = 0; d <= 14; d += 1) {
      for (let n = -1; n <= 14; n += 1) {
        for (let of = -1; of <= 52; of += 1) {
          const problem = { numerator: n, denominator: d, whole: of }
          expect(problemIssues(problem).length === 0).toBe(isValidProblem(problem))
        }
      }
    }
  })
})

describe('problemQuery', () => {
  it('leaves the defaults out', () => {
    expect(problemQuery({ numerator: 1, denominator: 4, whole: 20 })).toBe('n=1&d=4&of=20')
    expect(problemQuery({ numerator: 1, denominator: 4, whole: 20 }, { item: 'donut', mode: 'interactive' })).toBe(
      'n=1&d=4&of=20',
    )
  })

  it('adds the item and watch mode', () => {
    const query = problemQuery({ numerator: 3, denominator: 4, whole: 24 }, { item: 'pizza', mode: 'watch' })
    expect(query).toBe('n=3&d=4&of=24&item=pizza&mode=watch')
    expect(problemFromParams(params(query))).toEqual({ numerator: 3, denominator: 4, whole: 24 })
    expect(modeFromParams(params(query))).toBe('watch')
  })
})

describe('watch mode', () => {
  function fakePlayer(problem = { numerator: 3, denominator: 4, whole: 24 }) {
    const calls: string[] = []
    let groups = 1
    let thrown = 0
    let counted = 0
    const kept = new Set<number>()
    let live = true
    const player: Player = {
      groups: () => groups,
      changeGroups: (delta) => (groups += delta),
      chop: () => calls.push('chop'),
      thrown: () => thrown,
      throwSprinkle: () => (thrown += 1),
      share: () => calls.push('share'),
      uncounted: () => problem.whole / problem.denominator - counted,
      countNext: () => (counted += 1),
      doneCounting: () => calls.push('done'),
      kept: () => kept,
      toggleGroup: (g) => kept.add(g),
      keep: () => calls.push('keep'),
      start: () => calls.push('start'),
      again: () => calls.push('again'),
      wait: async () => {},
      current: () => live,
    }
    return {
      player,
      problem,
      calls,
      state: () => ({ groups, thrown, counted, kept: [...kept] }),
      goBack: () => (live = false),
    }
  }

  it('plays each step to its confirm', async () => {
    const { player, problem, calls, state } = fakePlayer()
    for (const step of ['question', 'groups', 'sprinkles', 'count', 'pick', 'answer'] as const) {
      await playStep(step, problem, player)
    }
    expect(calls).toEqual(['start', 'chop', 'share', 'done', 'keep', 'again'])
    expect(state()).toEqual({ groups: 4, thrown: 24, counted: 6, kept: [0, 1, 2] })
  })

  it('picks up a step left part-done by Back', async () => {
    const { player, problem, state } = fakePlayer()
    player.changeGroups(5) // 6 groups, more than fourths need
    await playStep('groups', problem, player)
    expect(state().groups).toBe(4)
  })

  it('stops when the student goes Back', async () => {
    const { player, problem, calls, state, goBack } = fakePlayer()
    goBack()
    await playStep('sprinkles', problem, player)
    expect(calls).toEqual([])
    expect(state().thrown).toBe(0)
  })

  it('speeds up long runs, but not past a floor', () => {
    expect(ramp(0, 320, 0.9, 70)).toBe(320)
    expect(ramp(5, 320, 0.9, 70)).toBeLessThan(200)
    expect(ramp(47, 320, 0.9, 70)).toBe(70)
  })
})
