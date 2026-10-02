import { RESUME_WITHIN_HOURS, apiError, getLearner, serverError, todayInSA } from '@/lib/bloom/server'
import type { BloomSession } from '@/lib/bloom/shared'

export const dynamic = 'force-dynamic'

// What the chat page needs on load: the learner's tier, how many questions
// they have left today, and their latest chat if it's recent enough to resume.
export async function GET(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner
  const { sb } = learner

  // Say so up front rather than after the learner has typed a question.
  if (!process.env.ANTHROPIC_API_KEY) return apiError('setup', 503)

  const { data: usage, error: usageError } = await sb
    .from('bloom_usage')
    .select('messages')
    .eq('day', todayInSA())
    .maybeSingle()
  if (usageError) return serverError('load usage', usageError)

  const { data: latest, error: latestError } = await sb
    .from('bloom_conversations')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) return serverError('load conversation', latestError)

  let conversation: BloomSession['conversation'] = null
  if (latest) {
    const { data: turns, error } = await sb
      .from('bloom_turns')
      .select('grade, question, reply_text, created_at')
      .eq('conversation_id', latest.id)
      .order('id')
    if (error) return serverError('load turns', error)

    const last = turns[turns.length - 1]
    if (last && Date.now() - new Date(last.created_at).getTime() < RESUME_WITHIN_HOURS * 3_600_000) {
      conversation = {
        id: latest.id,
        grade: last.grade,
        turns: turns.map(t => ({ question: t.question, reply: t.reply_text })),
      }
    }
  }

  const session: BloomSession = {
    tier: learner.tier,
    limit: learner.limit,
    remaining: Math.max(0, learner.limit - (usage?.messages ?? 0)),
    grade: learner.grade,
    conversation,
  }
  return Response.json(session, { headers: { 'Cache-Control': 'no-store' } })
}
