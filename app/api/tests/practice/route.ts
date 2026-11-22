import { apiError, getLearner, serverError } from '@/lib/bloom/server'
import { TEST_DAILY_LIMITS } from '@/lib/bloom/shared'

export const dynamic = 'force-dynamic'

// Starts a new test on just the topics a learner struggled with. Everything
// runs as the learner (RLS): their own session is copied with only the chosen
// topics, ready for /api/tests/generate.
export async function POST(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner

  const body = (await req.json().catch(() => null)) as { sessionId?: unknown; topicIds?: unknown } | null
  if (!body || typeof body.sessionId !== 'string' || !Array.isArray(body.topicIds)) return apiError('invalid', 400)
  const wanted = new Set(body.topicIds.filter((t): t is string => typeof t === 'string'))
  if (wanted.size === 0 || wanted.size > 20) return apiError('invalid', 400)

  const { data: src, error: srcError } = await learner.sb
    .from('test_sessions')
    .select('grade, subject, scope_text, length, question_mix, difficulty_mix, status')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (srcError) return serverError('practice load', srcError)
  if (!src || src.status !== 'marked') return apiError('invalid', 404)

  const { data: topics, error: tError } = await learner.sb
    .from('test_topics')
    .select('id, title, position')
    .eq('session_id', body.sessionId)
    .order('position')
  if (tError) return serverError('practice topics', tError)
  const chosen = (topics ?? []).filter(t => wanted.has(t.id as string))
  if (chosen.length === 0) return apiError('invalid', 400)

  const { data: usedBuilds, error: buildError } = await learner.sb.rpc('test_use_build', { p_limit: TEST_DAILY_LIMITS[learner.tier] })
  if (buildError) return serverError('count practice build', buildError)
  if (typeof usedBuilds !== 'number' || usedBuilds < 0) return apiError('limit', 429, { reason: 'daily', limit: TEST_DAILY_LIMITS[learner.tier] })

  const { data: created, error: cError } = await learner.sb
    .from('test_sessions')
    .insert({
      grade: src.grade,
      subject: src.subject,
      scope_text: src.scope_text,
      length: src.length,
      question_mix: src.question_mix,
      difficulty_mix: src.difficulty_mix,
    })
    .select('id')
    .single()
  if (cError || !created) return serverError('practice create', cError)

  const { error: iError } = await learner.sb
    .from('test_topics')
    .insert(chosen.map((t, i) => ({ session_id: created.id, position: i + 1, title: t.title, included: true })))
  if (iError) return serverError('practice add topics', iError)

  const { error: uError } = await learner.sb.from('test_sessions').update({ status: 'topics_ready' }).eq('id', created.id)
  if (uError) return serverError('practice ready', uError)

  return Response.json({ sessionId: created.id })
}
