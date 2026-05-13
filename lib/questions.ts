import { sb } from '@/lib/supabase'
import type { Question, ShuffledQuestion } from '@/types/quiz'

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Randomise option order while tracking which key is correct
export function shuffleQuestion(q: Question): ShuffledQuestion {
  const raw = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d },
  ]
  const correctText = raw.find(o => o.key === q.correct_option)!.text
  const shuffled = shuffle(raw)
  const newCorrectKey = shuffled.find(o => o.text === correctText)!.key

  return {
    id: String(q.id),
    question_text: q.question_text,
    options: shuffled,
    correct_key: newCorrectKey,
    explanation: q.explanation,
  }
}

/**
 * Fetch questions for a quiz_levels row by its UUID (id column).
 * Questions link to quiz_levels via the level_id TEXT slug.
 */
export async function fetchLevelQuestions(quizLevelRowId: string): Promise<ShuffledQuestion[]> {
  // First get the level to find its level_id slug
  const { data: lvl } = await sb
    .from('quiz_levels')
    .select('level_id')
    .eq('id', quizLevelRowId)
    .single()

  if (!lvl?.level_id) return []

  const { data, error } = await sb
    .from('questions')
    .select('*')
    .eq('level_id', lvl.level_id)

  if (error || !data || data.length === 0) return []

  return shuffle(data as Question[]).map(shuffleQuestion)
}
