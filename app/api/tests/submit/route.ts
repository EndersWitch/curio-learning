import { apiError, getLearner, serverError } from '@/lib/bloom/server'
import { serviceClient } from '@/lib/testbuilder/admin'
import { markInteractive } from '@/lib/testbuilder/interactiveMark'
import { isInteractive } from '@/lib/testbuilder/interactive'
import { MARKING_VERSION, markBatch, type MarkItem, type MarkedAnswer } from '@/lib/testbuilder/marking'
import type { SubmitResponse } from '@/lib/testbuilder/shared'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MCQ_VERSION = 'mcq-v1'
const BATCH = 6

// Hands in a test and marks it. Multiple choice is marked right here in code;
// written answers are marked by the AI against the memo, one mark point at a
// time. The learner's own session is checked first (RLS); the service client
// then does the marking writes a learner cannot, because the answers and memo
// must not be readable earlier.
//
// If the AI marking fails, the test stays 'submitted' and calling this again
// marks only the answers that are still unmarked.
export async function POST(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner
  const svc = serviceClient()
  if (!svc) return apiError('setup', 503, { reason: 'no-service-key' })

  const body = (await req.json().catch(() => null)) as { sessionId?: unknown } | null
  if (!body || typeof body.sessionId !== 'string') return apiError('invalid', 400)

  const { data: session, error: loadError } = await learner.sb
    .from('test_sessions')
    .select('id, status, grade, subject')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (loadError) return serverError('load session', loadError)
  if (!session) return apiError('invalid', 404)

  const retry = session.status === 'submitted'
  if (!retry && session.status !== 'ready' && session.status !== 'in_progress') return apiError('invalid', 409, { reason: 'wrong-state' })

  // Hand in once: later answer saves are refused from this point on.
  let claimedHere = false
  if (!retry) {
    const { data: claimed, error: claimError } = await svc
      .from('test_sessions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', session.id)
      .eq('user_id', learner.id)
      .in('status', ['ready', 'in_progress'])
      .select('id')
    if (claimError) return serverError('claim session', claimError)
    if (!claimed?.length) return apiError('invalid', 409, { reason: 'wrong-state' })
    claimedHere = true
  }

  try {
    const { data: questions, error: qError } = await svc
      .from('test_questions')
      .select('id, qtype, marks, question_text, spec')
      .eq('session_id', session.id)
    if (qError || !questions) throw qError ?? new Error('no questions')

    const ids = questions.map(q => q.id as string)
    const [keysRes, answersRes, pointsRes] = await Promise.all([
      svc.from('test_question_keys').select('question_id, mcq_correct, answer_spec').in('question_id', ids),
      svc.from('test_answers').select('question_id, answer_text, mcq_choice, answer_json, marked_by').eq('session_id', session.id),
      svc.from('test_mark_points').select('id, question_id, position, point_text, accepted_alternatives').in('question_id', ids).order('position'),
    ])
    if (keysRes.error || answersRes.error || pointsRes.error) throw keysRes.error ?? answersRes.error ?? pointsRes.error

    const keyOf = new Map((keysRes.data ?? []).map(k => [k.question_id as string, k.mcq_correct as string | null]))
    const answerSpecOf = new Map((keysRes.data ?? []).map(k => [k.question_id as string, k.answer_spec as unknown]))
    const answerOf = new Map((answersRes.data ?? []).map(a => [a.question_id as string, a]))
    const pointsOf = new Map<string, { id: string; text: string; alternatives: string[] }[]>()
    for (const p of pointsRes.data ?? []) {
      const list = pointsOf.get(p.question_id as string) ?? []
      list.push({ id: p.id as string, text: p.point_text as string, alternatives: (p.accepted_alternatives as string[]) ?? [] })
      pointsOf.set(p.question_id as string, list)
    }

    const rows: Record<string, unknown>[] = []
    const base = (qid: string, given: { answer_text?: unknown; mcq_choice?: unknown; answer_json?: unknown } | undefined) => ({
      session_id: session.id,
      question_id: qid,
      user_id: learner.id,
      answer_text: (given?.answer_text as string | null) ?? null,
      mcq_choice: (given?.mcq_choice as string | null) ?? null,
      answer_json: given?.answer_json ?? null,
    })

    // Multiple choice: marked in code.
    for (const q of questions.filter(q => q.qtype === 'mcq')) {
      const given = answerOf.get(q.id as string)
      const choice = (given?.mcq_choice as string | null) ?? null
      const correctKey = keyOf.get(q.id as string) ?? null
      const correct = choice !== null && (correctKey?.split(',') ?? []).includes(choice)
      rows.push({
        ...base(q.id as string, given),
        marks_awarded: correct ? (q.marks as number) : 0,
        feedback: { correct, chosen: choice, correctKey },
        marked_by: 'code',
        marking_version: MCQ_VERSION,
      })
    }

    // Interactive (draw, drag, sort, activity): marked in code, one mark point at a time.
    for (const q of questions.filter(q => isInteractive(q.qtype as string))) {
      const given = answerOf.get(q.id as string)
      if (given?.marked_by) continue
      const pointIds = (pointsOf.get(q.id as string) ?? []).map(p => p.id)
      const result = markInteractive(q.qtype as string, q.spec, answerSpecOf.get(q.id as string), given?.answer_json ?? null, pointIds)
      rows.push({
        ...base(q.id as string, given),
        marks_awarded: Math.min(q.marks as number, result.marks),
        feedback: { points: result.points, tips: [] },
        marked_by: 'code',
        marking_version: 'interactive-v1',
      })
    }

    // Written: blank answers score nothing without asking the AI; the rest are
    // marked in small batches. Answers already marked on an earlier try are left alone.
    const todo: MarkItem[] = []
    for (const q of questions.filter(q => q.qtype === 'short' || q.qtype === 'long')) {
      const given = answerOf.get(q.id as string)
      if (given?.marked_by) continue
      const points = pointsOf.get(q.id as string) ?? []
      const text = ((given?.answer_text as string | null) ?? '').trim()
      if (!text) {
        rows.push({
          ...base(q.id as string, given),
          marks_awarded: 0,
          feedback: { points: points.map(p => ({ pointId: p.id, awarded: false, reason: "You didn't write an answer for this one, so there were no marks to give." })) },
          marked_by: 'code',
          marking_version: MARKING_VERSION,
        })
      } else {
        todo.push({ questionId: q.id as string, question: q.question_text as string, marks: q.marks as number, points, answer: text })
      }
    }

    const batches: MarkItem[][] = []
    for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH))
    const ctx = { grade: session.grade as number, subject: session.subject as string | null }
    const settled = await Promise.allSettled(batches.map(b => markBatch(learner, ctx, b)))

    let failed = 0
    settled.forEach((r, i) => {
      if (r.status === 'rejected') {
        failed += batches[i].length
        console.error('[tests] marking batch failed', r.reason)
        return
      }
      for (const item of batches[i]) {
        const marked: MarkedAnswer = r.value.get(item.questionId) ?? { points: [], tips: [] }
        rows.push({
          ...base(item.questionId, answerOf.get(item.questionId)),
          marks_awarded: Math.min(item.marks, marked.points.filter(p => p.awarded).length),
          feedback: { points: marked.points, tips: marked.tips },
          marked_by: 'ai',
          marking_version: MARKING_VERSION,
        })
      }
    })

    if (rows.length) {
      const { error: markError } = await svc.from('test_answers').upsert(rows, { onConflict: 'session_id,question_id' })
      if (markError) throw markError
    }

    const { data: scored, error: sumError } = await svc.from('test_answers').select('marks_awarded').eq('session_id', session.id)
    if (sumError) throw sumError
    const awarded = (scored ?? []).reduce((n, a) => n + ((a.marks_awarded as number | null) ?? 0), 0)
    const total = questions.reduce((n, q) => n + (q.marks as number), 0)

    const status = failed === 0 ? 'marked' : 'submitted'
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
    // Nothing was marked: let the learner hand in again rather than leave the test stuck.
    if (claimedHere) await svc.from('test_sessions').update({ status: 'ready' }).eq('id', session.id)
    return serverError('mark test', err)
  }
}
