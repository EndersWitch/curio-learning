/**
 * Row shape of public.quiz_level_catalog(): every quiz level's name, order
 * and lock state, with no learning content. Use it wherever locked Premium
 * levels must still be listed — quiz_levels itself only returns Premium rows
 * to paid-up members (enforced in the database).
 */
export interface CatalogLevel {
  id: string
  phase: string | null
  grade: number
  subject: string
  broad_topic: string
  broad_topic_display: string | null
  section_type: string
  subtopic_id: string | null
  subtopic_display: string | null
  level_id: string
  level_display: string
  level_order: number
  difficulty: string | null
  is_premium: boolean
  question_count: number
  description: string | null
  created_at: string
}
