// Pure helpers for multiple-choice generation: how many questions to ask for,
// and checks that apply Curio's quiz rules to what the model sends back.

import { LENGTH_QUESTIONS, type QuestionMix, type TestLength } from '@/lib/testbuilder/shared'

export type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_SPREAD: Difficulty[] = ['easy', 'medium', 'medium', 'hard', 'medium', 'easy', 'hard', 'medium', 'easy', 'medium']

export const LETTERS = ['A', 'B', 'C', 'D'] as const

// How many multiple-choice questions this test gets. Multiple choice weighs
// more than written types when the learner picks a mix.
export function mcqTotal(length: TestLength, mix: QuestionMix): number {
  if (!mix.mcq) return 0
  const weights = { mcq: 3, short: mix.short ? 2 : 0, long: mix.long ? 1 : 0 }
  const share = weights.mcq / (weights.mcq + weights.short + weights.long)
  return Math.max(1, Math.round(LENGTH_QUESTIONS[length] * share))
}

// Spreads the total over topics as evenly as possible, earlier topics taking the remainder.
export function perTopic(total: number, topics: number): number[] {
  if (topics === 0) return []
  const base = Math.floor(total / topics)
  const extra = total % topics
  return Array.from({ length: topics }, (_, i) => base + (i < extra ? 1 : 0))
}

export function difficultiesFor(count: number, offset: number): Difficulty[] {
  return Array.from({ length: count }, (_, i) => DIFFICULTY_SPREAD[(offset + i) % DIFFICULTY_SPREAD.length])
}

export interface RawMcq {
  question?: unknown
  options?: unknown
  correctIndex?: unknown
  explanation?: unknown
}

export interface CleanMcq {
  question: string
  options: string[] // already shuffled, always 4
  correct: (typeof LETTERS)[number]
  explanation: string
}

const HESITATION = /\b(wait|actually|hmm|let me|on second thought|recheck|re-check|needs? checking|need to check|i mean|oops|correction)\b/i

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

// Applies the quiz rules from the content guide. Returns null for a question
// that should be dropped rather than shown.
export function cleanMcq(raw: RawMcq, rand: () => number = Math.random): CleanMcq | null {
  if (typeof raw.question !== 'string' || typeof raw.explanation !== 'string') return null
  const question = raw.question.trim()
  const explanation = raw.explanation.trim()
  if (!question || !explanation || question.length > 600) return null

  // A question or explanation that hesitates or corrects itself means the
  // model was not sure of its own answer. Drop it.
  if (HESITATION.test(question) || HESITATION.test(explanation)) return null

  // No "Why...?" multiple choice: those test explaining, not identifying or applying.
  if (/^\s*why\b/i.test(question)) return null

  if (!Array.isArray(raw.options) || raw.options.length !== 4) return null
  const options = raw.options.map(o => (typeof o === 'string' ? o.trim() : ''))
  if (options.some(o => !o || o.length > 240)) return null
  if (new Set(options.map(o => o.toLowerCase())).size !== 4) return null

  const ci = raw.correctIndex
  if (typeof ci !== 'number' || !Number.isInteger(ci) || ci < 0 || ci > 3) return null
  const correct = options[ci]

  // No length giveaway: the right answer must not stand out as clearly longer
  // or shorter than the wrong ones.
  const others = options.filter((_, i) => i !== ci)
  const avgChars = others.reduce((n, o) => n + o.length, 0) / 3
  const avgWords = others.reduce((n, o) => n + words(o), 0) / 3
  if (correct.length > avgChars * 1.6 + 6 || correct.length < avgChars / 1.6 - 6) return null
  if (Math.abs(words(correct) - avgWords) > 3) return null

  // The model's own answer position is not trusted: shuffle here.
  const order = [0, 1, 2, 3]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const shuffled = order.map(i => options[i])
  return { question, options: shuffled, correct: LETTERS[order.indexOf(ci)], explanation }
}

export interface TopicPlan {
  mcq: number
  short: number
  long: number
}

// How many of each question type every topic gets. The total follows the
// chosen length, but never drops below one question per topic. Multiple
// choice weighs most, then short answer, then long answer, and each type the
// learner picked appears at least once when there is room.
export function planTest(length: TestLength, mix: QuestionMix, topicCount: number): TopicPlan[] {
  if (topicCount === 0) return []
  const types = (['mcq', 'short', 'long'] as const).filter(t => mix[t])
  if (!types.length) return []
  const weight = { mcq: 3, short: 2, long: 1 }
  const total = Math.max(LENGTH_QUESTIONS[length], topicCount)
  const sum = types.reduce((n, t) => n + weight[t], 0)

  const counts: Record<(typeof types)[number], number> = { mcq: 0, short: 0, long: 0 }
  const fractions = types.map(t => {
    const exact = (total * weight[t]) / sum
    counts[t] = Math.floor(exact)
    return { t, frac: exact - Math.floor(exact) }
  })
  let left = total - types.reduce((n, t) => n + counts[t], 0)
  for (const { t } of fractions.sort((a, b) => b.frac - a.frac)) {
    if (left <= 0) break
    counts[t]++
    left--
  }
  if (total >= types.length) {
    for (const t of types) {
      if (counts[t] === 0) {
        const biggest = types.reduce((a, b) => (counts[a] >= counts[b] ? a : b))
        counts[biggest]--
        counts[t]++
      }
    }
  }

  // Deal each type out over the topics, carrying on from where the last type stopped.
  const plans: TopicPlan[] = Array.from({ length: topicCount }, () => ({ mcq: 0, short: 0, long: 0 }))
  let cursor = 0
  for (const t of types) {
    for (let k = 0; k < counts[t]; k++) plans[cursor++ % topicCount][t]++
  }
  return plans
}
