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
 * Fetch questions for a quiz_levels row.
 * The questions table stores the quiz_levels UUID in its level_id column.
 * quizLevelUUID = the quiz_levels.id (UUID primary key)
 */
export async function fetchLevelQuestions(quizLevelUUID: string): Promise<ShuffledQuestion[]> {
  const { data, error } = await sb
    .from('questions')
    .select('*')
    .eq('level_id', quizLevelUUID)

  if (error || !data || data.length === 0) return []
  return shuffle(data as Question[]).map(shuffleQuestion)
}
