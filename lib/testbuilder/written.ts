// Pure helpers for short- and long-answer questions: what the memo looks like
// and the checks every generated question must pass before it is saved.

export type WrittenType = 'short' | 'long'

export const MARK_RANGE: Record<WrittenType, [number, number]> = { short: [1, 3], long: [4, 8] }
export const MAX_ANSWER_CHARS: Record<WrittenType, number> = { short: 1500, long: 5000 }

export interface MarkPointDraft {
  text: string
  alternatives: string[]
}

export interface CleanWritten {
  type: WrittenType
  question: string
  marks: number
  points: MarkPointDraft[]
}

const HESITATION = /\b(wait|actually|hmm|let me|on second thought|recheck|re-check|needs? checking|need to check|i mean|oops|correction)\b/i

import { breaksTypingRule } from '@/lib/testbuilder/rules'

// Sub-parts like (a) / b) mean several small questions glued into one.
const SUBPARTS = /(\(\s*[a-eA-E]\s*\)|(^|\s)[a-eA-E]\)\s|\(\s*(i{1,3}|iv|v)\s*\))/

// Returns null for a question that should be dropped rather than shown. One
// mark point is worth exactly one mark, so the number of points must equal the
// marks, and no two points may say the same thing.
export function cleanWritten(raw: Record<string, unknown>, want: WrittenType): CleanWritten | null {
  if (raw.type !== want) return null
  const question = typeof raw.question === 'string' ? raw.question.trim() : ''
  if (question.length < 10 || question.length > 700 || HESITATION.test(question)) return null
  // One task per question. A long answer is a single extended task, never a
  // bundle of small questions, so sub-parts and several questions are refused.
  if (SUBPARTS.test(question)) return null
  // Everything must be answerable by typing: no underlining, circling and so on.
  if (breaksTypingRule(question)) return null
  if ((question.match(/\?/g) ?? []).length > (want === 'long' ? 1 : 2)) return null

  const [lo, hi] = MARK_RANGE[want]
  const marks = raw.marks
  if (typeof marks !== 'number' || !Number.isInteger(marks) || marks < lo || marks > hi) return null

  if (!Array.isArray(raw.markPoints) || raw.markPoints.length !== marks) return null
  const points: MarkPointDraft[] = []
  const seen = new Set<string>()
  for (const p of raw.markPoints as Record<string, unknown>[]) {
    const text = typeof p?.text === 'string' ? p.text.trim() : ''
    if (text.length < 3 || text.length > 300 || HESITATION.test(text)) return null
    if (seen.has(text.toLowerCase())) return null
    seen.add(text.toLowerCase())
    const alternatives = Array.isArray(p.alternatives)
      ? (p.alternatives as unknown[])
          .filter((a): a is string => typeof a === 'string' && a.trim().length > 0 && a.length <= 200)
          .map(a => a.trim())
          .slice(0, 6)
      : []
    points.push({ text, alternatives })
  }
  return { type: want, question, marks, points }
}
