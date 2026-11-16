import { apiError, getLearner, serverError } from '@/lib/bloom/server'
import { serviceClient } from '@/lib/testbuilder/admin'
import type { SubmitResponse } from '@/lib/testbuilder/shared'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MARKING_VERSION = 'mcq-v1'

// Hands in a test. Multiple choice is marked right here in code. The learner's
// own session is checked first (RLS); the service client then does the marking
// writes a learner cannot, because the answers must not be readable earlier.
// Written questions will be marked in a later step; a test that has any stays
// 'submitted' until then.
export async function POST(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner
  const svc = serviceClient()
  if (!svc) return apiError('setup', 503, { reason: 'no-service-key' })

  const body = (await req.json().catch(() => null)) as { sessionId?: unknown } | null
  if (!body || typeof body.sessionId !== 'string') return apiError('invalid', 400)

  const { data: session, error: loadError } = await learner.sb
    .from('test_sessions')
    .select('id, status')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (loadError) return serverError('load session', loadError)
  if (!session) return apiError('invalid', 404)
  if (session.status === 'marked' || session.status === 'submitted') {
    return apiError('invalid', 409, { reason: 'wrong-state' })
  }
  if (session.status !== 'ready' && session.status !== 'in_progress') return apiError('invalid', 409, { reason: 'wrong-state' })

  // Hand in once: later answer saves are refused from this point on.
  const { data: claimed, error: claimError } = await svc
    .from('test_sessions')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('user_id', learner.id)
    .in('status', ['ready', 'in_progress'])
    .select('id')
  if (claimError) return serverError('claim session', claimError)
  if (!claimed?.length) return apiError('invalid', 409, { reason: 'wrong-state' })

  try {
    const { data: questions, error: qError } = await svc
      .from('test_questions')
      .select('id, qtype, marks')
      .eq('session_id', session.id)
    if (qError || !questions) throw qError ?? new Error('no questions')

    const ids = questions.map(q => q.id as string)
    const [{ data: keys, error: kError }, { data: answers, error: aError }] = await Promise.all([
      svc.from('test_question_keys').select('question_id, mcq_correct').in('question_id', ids),
      svc.from('test_answers').select('question_id, answer_text, mcq_choice').eq('session_id', session.id),
    ])
    if (kError || aError || !keys || !answers) throw kError ?? aError ?? new Error('load marking data')

    const keyOf = new Map(keys.map(k => [k.question_id as string, k.mcq_correct as string | null]))
    const answerOf = new Map(answers.map(a => [a.question_id as string, a]))

    let awarded = 0
    let total = 0
    let hasWritten = false
    const rows = []
    for (const q of questions) {
      const marks = q.marks as number
      total += marks
      if (q.qtype !== 'mcq') {
        hasWritten = true
        continue
      }
      const given = answerOf.get(q.id as string)
      const choice = (given?.mcq_choice as string | null) ?? null
      const correctKey = keyOf.get(q.id as string) ?? null
      const correct = choice !== null && (correctKey?.split(',') ?? []).includes(choice)
      const got = correct ? marks : 0
      awarded += got
      rows.push({
        session_id: session.id,
        question_id: q.id,
        user_id: learner.id,
        answer_text: (given?.answer_text as string | null) ?? null,
        mcq_choice: choice,
        marks_awarded: got,
        feedback: { correct, chosen: choice, correctKey },
        marked_by: 'code',
        marking_version: MARKING_VERSION,
      })
    }

    if (rows.length) {
      const { error: markError } = await svc.from('test_answers').upsert(rows, { onConflict: 'session_id,question_id' })
      if (markError) throw markError
    }

    const status = hasWritten ? 'submitted' : 'marked'
    const { error: doneError } = await svc
      .from('test_sessions')
      .update({
        status,
        marks_total: total,
        marks_awarded: awarded,
        ...(status === 'marked' ? { marked_at: new Date().toISOString() } : {}),
      })
      .eq('id', session.id)
    if (doneError) throw doneError

    const out: SubmitResponse = { status, marksAwarded: awarded, marksTotal: total }
    return Response.json(out, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    // Let the learner hand in again rather than leave the test stuck.
    await svc.from('test_sessions').update({ status: 'ready' }).eq('id', session.id)
    return serverError('mark test', err)
  }
}
