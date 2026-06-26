import { sb } from '@/lib/supabase'
import type { QuizResult } from '@/types/quiz'

// Actual DB row shape for user_level_progress
interface ProgressRow {
  user_id: string
  level_id: string
  topic_id: string | null
  best_score: number
  attempts: number
  passed: boolean
  xp_earned: number
  first_passed_at: string | null
  last_attempted_at: string | null
}

/**
 * Fetch all progress records for current user from the real table
 */
export async function getUserProgress(userId: string): Promise<any[]> {
  const { data } = await sb
    .from('user_level_progress')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}

/**
 * Check if a specific level is passed
 */
export function isLevelPassed(progress: { level_id: string; passed: boolean }[], levelId: string): boolean {
  return progress.some((p) => p.level_id === levelId && p.passed)
}

/**
 * Subtopic mastery unlocked = all normal levels in subtopic passed
 */
export function isSubtopicMasteryUnlocked(
  progress: { level_id: string; passed: boolean }[],
  normalLevelIds: string[]
): boolean {
  return normalLevelIds.every((id) => isLevelPassed(progress, id))
}

/**
 * Broad topic mastery unlocked = all subtopic masteries passed
 */
export function isBroadTopicMasteryUnlocked(
  progress: { level_id: string; passed: boolean }[],
  subtopicMasteryIds: string[]
): boolean {
  return subtopicMasteryIds.every((id) => isLevelPassed(progress, id))
}

/**
 * Save a quiz attempt entirely server-side via the `award_quiz_xp` RPC.
 *
 * The RPC (SECURITY DEFINER, checks auth.uid() = p_user_id) is the single
 * source of truth: it computes XP from the score, upserts
 * `user_level_progress`, and bumps `profiles.xp` / `xp_total` / streak —
 * all atomically in one transaction. Nothing about XP, progress, or streaks
 * is computed or stored on the client.
 *
 * Returns the server-confirmed outcome so the UI can reflect what actually
 * happened (never trust the locally-estimated xpEarned for display).
 */
export async function saveQuizResult(params: {
  userId: string
  topicId: string      // quiz_levels.broad_topic (slug)
  levelId: string       // quiz_levels.level_id (slug, NOT the row uuid)
  sectionType: string
  passThresholdPercent: number // 0-100
  result: QuizResult
}): Promise<{ xpEarned: number; passed: boolean; firstPass: boolean }> {
  const { userId, topicId, levelId, sectionType, passThresholdPercent, result } = params
  const scorePercent = Math.round((result.score / result.total) * 100)

  // Streaks are a "what day was it for the student" concept, not a database
  // server concept — pass the client's own local calendar date so the streak
  // doesn't fall a day behind/ahead of the server's UTC clock near midnight.
  const now = new Date()
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data, error } = await sb.rpc('award_quiz_xp', {
    p_user_id: userId,
    p_topic_id: topicId,
    p_level_id: levelId,
    p_score: scorePercent,
    p_correct: result.score,
    p_total: result.total,
    p_section_type: sectionType,
    p_threshold: passThresholdPercent,
    // Question ids of the ones answered correctly — the RPC looks up each
    // question's real difficulty server-side and weights XP accordingly
    // (Starter/Building/Challenge). Never trust a client-computed XP total.
    p_correct_question_ids: result.correctQuestionIds.map(Number),
    p_local_date: localDate,
  })

  if (error) throw error

  return {
    xpEarned: data?.xp_earned ?? 0,
    passed: data?.passed ?? result.passed,
    firstPass: data?.first_pass ?? false,
  }
}

/**
 * Calculate XP to award
 */
export function calculateXP(params: {
  score: number
  total: number
  sectionType: string
  baseXP: number
}): number {
  const { score, total, sectionType, baseXP } = params
  const ratio = score / total
  let multiplier = 1
  if (ratio === 1) multiplier = 1.5
  if (sectionType === 'subtopic_mastery') multiplier *= 2
  if (sectionType === 'broad_topic_mastery') multiplier *= 3
  return Math.round(baseXP * ratio * multiplier)
}

export async function getUserProfile(userId: string) {
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}
