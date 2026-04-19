import { supabase } from './supabase'
import type { Question, ShuffledQuestion } from '@/types/quiz'

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Convert a raw Question into a ShuffledQuestion with randomised option order.
 * The correct_key is updated to match the new shuffled position.
 */
export function shuffleQuestion(q: Question): ShuffledQuestion {
  const rawOptions = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d },
  ]

  const correctText = rawOptions.find((o) => o.key === q.correct_option)!.text
  const shuffled = shuffle(rawOptions)
  const newCorrectKey = shuffled.find((o) => o.text === correctText)!.key

  return {
    id: q.id,
    question_text: q.question_text,
    options: shuffled,
    correct_key: newCorrectKey,
    explanation: q.explanation,
  }
}

/**
 * Fetch questions for a specific level, shuffle order and options.
 */
export async function fetchLevelQuestions(levelId: string): Promise<ShuffledQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('level_id', levelId)
    .order('id')

  if (error || !data) return []

  // Shuffle question order, then shuffle each question's options
  return shuffle(data as Question[]).map(shuffleQuestion)
}

/**
 * Fetch questions for general practice (broad topic, no level)
 */
export async function fetchGeneralPracticeQuestions(params: {
  grade: number
  subject: string
  broadTopic: string
  limit?: number
}): Promise<ShuffledQuestion[]> {
  const { grade, subject, broadTopic, limit = 10 } = params

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('grade', grade)
    .eq('subject', subject)
    .eq('broad_topic', broadTopic)
    .eq('section_type', 'general_practice')
    .limit(limit * 2) // fetch extra so shuffle feels meaningful

  if (error || !data) return []

  return shuffle(data as Question[]).slice(0, limit).map(shuffleQuestion)
}

/**
 * Fetch questions for mastery challenge
 */
export async function fetchMasteryQuestions(params: {
  subtopicId?: string
  broadTopicId?: string
  sectionType: 'subtopic_mastery' | 'broad_topic_mastery'
}): Promise<ShuffledQuestion[]> {
  const { subtopicId, broadTopicId, sectionType } = params

  let query = supabase
    .from('questions')
    .select('*')
    .eq('section_type', sectionType)

  if (subtopicId) query = query.eq('subtopic_id', subtopicId)
  if (broadTopicId) query = query.eq('broad_topic', broadTopicId)

  const { data, error } = await query

  if (error || !data) return []

  return shuffle(data as Question[]).map(shuffleQuestion)
}
