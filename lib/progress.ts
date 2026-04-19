import { supabase } from './supabase'
import type { UserProgress, QuizResult } from '@/types/quiz'

/**
 * Fetch all progress records for current user
 */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  return data ?? []
}

/**
 * Check if a specific level is completed/passed
 */
export function isLevelPassed(progress: UserProgress[], levelId: string): boolean {
  return progress.some((p) => p.level_id === levelId && p.passed)
}

/**
 * Check if a subtopic mastery is unlocked
 * (all normal levels in that subtopic must be passed)
 */
export function isSubtopicMasteryUnlocked(
  progress: UserProgress[],
  normalLevelIds: string[]
): boolean {
  return normalLevelIds.every((id) => isLevelPassed(progress, id))
}

/**
 * Check if broad topic mastery is unlocked
 * (all subtopic masteries must be passed)
 */
export function isBroadTopicMasteryUnlocked(
  progress: UserProgress[],
  subtopicMasteryIds: string[]
): boolean {
  return subtopicMasteryIds.every((id) => isLevelPassed(progress, id))
}

/**
 * Save quiz result and award XP via RPC
 */
export async function saveQuizResult(params: {
  userId: string
  levelId: string
  result: QuizResult
}): Promise<void> {
  const { userId, levelId, result } = params

  // Upsert progress
  await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      level_id: levelId,
      completed: true,
      passed: result.passed,
      best_score: result.score,
      attempts: 1,
      xp_earned: result.xpEarned,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,level_id' }
  )

  // Award XP via existing RPC
  if (result.xpEarned > 0) {
    await supabase.rpc('award_quiz_xp', {
      p_user_id: userId,
      p_xp: result.xpEarned,
    })
  }
}

/**
 * Fetch the user profile (XP, streak, premium status)
 */
export async function getUserProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return data
}

/**
 * Calculate XP to award based on score and level type
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

  if (ratio === 1) multiplier = 1.5 // perfect score bonus
  if (sectionType === 'subtopic_mastery') multiplier *= 2
  if (sectionType === 'broad_topic_mastery') multiplier *= 3

  return Math.round(baseXP * ratio * multiplier)
}
