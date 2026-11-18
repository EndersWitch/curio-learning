// Pure helpers for multiple-choice generation: how many questions to ask for,
// and checks that apply Curio's quiz rules to what the model sends back.

import { PER_TOPIC, type QuestionMix, type TestLength } from '@/lib/testbuilder/shared'
import { breaksTypingRule } from '@/lib/testbuilder/rules'

export type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_SPREAD: Difficulty[] = ['easy', 'medium', 'medium', 'hard', 'medium', 'easy', 'hard', 'medium', 'easy', 'medium']

export const LETTERS = ['A', 'B', 'C', 'D'] as const

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

  // Everything must be answerable by choosing an option: no paper-only actions or emphasis markers.
  if (breaksTypingRule(question)) return null

  // One question only, and no talk of "diagram-free" or "the statement below": the text must stand on its own.
  if ((question.match(/\?/g) ?? []).length > 1) return null
  if (/diagram[- ]free|statement below|text below|as described/i.test(question)) return null

  // No "Why...?" multiple choice: those test explaining, not identifying or applying.
  if (/^\s*why\b/i.test(question)) return null

  if (!Array.isArray(raw.options) || raw.options.length !== 4) return null
  const options = raw.options.map(o => (typeof o === 'string' ? o.trim() : ''))
  if (options.some(o => !o || o.length > 240 || breaksTypingRule(o))) return null
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

// How many of each question type every topic gets. The length sets how many
// questions each topic gets (short 1-2, medium 3-4, long 5-6), with topics
// taking turns at the higher number. Multiple choice weighs most, then short
// answer, then long answer, and each type the learner picked appears at least
// once when there is room.
export function planTest(length: TestLength, mix: QuestionMix, topicCount: number): TopicPlan[] {
  if (topicCount === 0) return []
  const types = (['mcq', 'short', 'long'] as const).filter(t => mix[t])
  if (!types.length) return []
  const [lo, hi] = PER_TOPIC[length]
  const capacity = Array.from({ length: topicCount }, (_, i) => (i % 2 === 0 ? hi : lo))
  const total = capacity.reduce((n, c) => n + c, 0)

  const weight = { mcq: 3, short: 2, long: 1 }
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

  // Deal the scarcer types out first so they spread across topics, each topic
  // ending with exactly its own number of questions.
  const plans: TopicPlan[] = Array.from({ length: topicCount }, () => ({ mcq: 0, short: 0, long: 0 }))
  const room = [...capacity]
  let cursor = 0
  for (const t of (['long', 'short', 'mcq'] as const).filter(t => mix[t])) {
    for (let k = 0; k < counts[t]; k++) {
      let steps = 0
      while (room[cursor % topicCount] === 0 && steps++ < topicCount) cursor++
      const idx = cursor % topicCount
      plans[idx][t]++
      room[idx]--
      cursor = idx + 1
    }
  }
  return plans
}
