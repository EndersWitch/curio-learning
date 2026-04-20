import { createClient } from '@supabase/supabase-js'
import type { QuizResult } from '@/types/quiz'

const sb = createClient(
  'https://inmrsgujgfktapjnekjs.supabase.co',
  'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

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
 * Save quiz result to user_level_progress (real table) and award XP on profiles
 */
export async function saveQuizResult(params: {
  userId: string
  levelId: string
  topicId?: string
  result: QuizResult
}): Promise<void> {
  const { userId, levelId, topicId, result } = params
  const now = new Date().toISOString()

  // Fetch existing record to handle best_score and attempts properly
  const { data: existing } = await sb
    .from('user_level_progress')
    .select('best_score, attempts, passed')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .single()

  const prevBest    = existing?.best_score ?? 0
  const prevAttempts = existing?.attempts ?? 0
  const wasAlreadyPassed = existing?.passed ?? false

  await sb.from('user_level_progress').upsert(
    {
      user_id:            userId,
      level_id:           levelId,
      topic_id:           topicId ?? null,
      best_score:         Math.max(prevBest, result.score),
      attempts:           prevAttempts + 1,
      passed:             wasAlreadyPassed || result.passed,
      xp_earned:          result.xpEarned,
      last_attempted_at:  now,
      // Only set first_passed_at if this is the first pass
      ...(result.passed && !wasAlreadyPassed ? { first_passed_at: now } : {}),
    },
    { onConflict: 'user_id,topic_id,level_id' }
  )

  // Award XP on profiles — add to xp and xp_total
  if (result.xpEarned > 0) {
    // Try the existing RPC first, fall back to direct update
    const { error: rpcError } = await sb.rpc('award_quiz_xp', {
      p_user_id: userId,
      p_xp: result.xpEarned,
    })
    if (rpcError) {
      // Fallback: direct increment
      await sb.rpc('increment_xp', { uid: userId, amount: result.xpEarned })
        .then(() => {})
        .catch(() => {
          // Last resort — just update xp column directly
          sb.from('profiles')
            .select('xp, xp_total')
            .eq('id', userId)
            .single()
            .then(({ data: prof }) => {
              if (prof) {
                sb.from('profiles').update({
                  xp:       (prof.xp ?? 0) + result.xpEarned,
                  xp_total: (prof.xp_total ?? 0) + result.xpEarned,
                }).eq('id', userId)
              }
            })
        })
    }
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
