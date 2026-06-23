import { sb } from '@/lib/supabase'
import type { Question, ShuffledQuestion } from '@/types/quiz'

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffleQuestion(q: Question): ShuffledQuestion {
  // correct_option may be uppercase ("A","B","C","D") — normalise to lowercase
  const correctKey = (q.correct_option ?? '').toLowerCase()

  const raw = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d },
  ].filter(o => o.text != null) // drop null options (True/False only has a+b)

  const correctOption = raw.find(o => o.key === correctKey)
  if (!correctOption) {
    // Should never happen — but fail gracefully rather than crash
    console.warn(`[shuffleQuestion] correct_option "${q.correct_option}" not found in options for question id ${q.id}`)
  }
  const correctText = correctOption?.text ?? ''

  const shuffled = shuffle(raw)
  const newCorrectKey = shuffled.find(o => o.text === correctText)?.key ?? correctKey

  return {
    id: String(q.id),
    question_text: q.question_text,
    options: shuffled,
    correct_key: newCorrectKey,
    explanation: q.explanation,
    difficulty: q.difficulty,
  }
}

/**
 * Fetch questions for a quiz_levels row.
 * Supports two storage patterns:
 *   - Legacy: questions.level_id = quiz_levels.id (UUID)
 *   - New:    questions.level_id = quiz_levels.level_id (string e.g. "verbs_4")
 * Tries UUID first. If nothing found, fetches the quiz_levels row to get its
 * string level_id and tries that instead.
 */
export async function fetchLevelQuestions(quizLevelUUID: string): Promise<ShuffledQuestion[]> {
  // Try UUID match first (legacy questions)
  const { data: byUUID } = await sb
    .from('questions')
    .select('*')
    .eq('level_id', quizLevelUUID)

  if (byUUID && byUUID.length > 0) {
    return shuffle(byUUID as Question[]).map(shuffleQuestion)
  }

  // Fall back: look up the string level_id from quiz_levels, then match on that
  const { data: lvl } = await sb
    .from('quiz_levels')
    .select('level_id')
    .eq('id', quizLevelUUID)
    .single()

  if (!lvl?.level_id) return []

  const { data: byString } = await sb
    .from('questions')
    .select('*')
    .eq('level_id', lvl.level_id)

  if (!byString || byString.length === 0) return []
  return shuffle(byString as Question[]).map(shuffleQuestion)
}
