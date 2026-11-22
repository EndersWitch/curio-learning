import Anthropic from '@anthropic-ai/sdk'
import { BLOOM_MODEL, apiError, getLearner, replyText, serverError } from '@/lib/bloom/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

let anthropic: Anthropic | null = null

const SYSTEM = `You are Bloom, Curio's friendly South African study buddy, helping a learner understand one question on their own marked practice test. You are given the question, what the learner answered, the memo and the marks. Explain clearly why marks were given or missed and how to get it right next time, pitched at the learner's grade. Use South African spelling. Keep it short: a few sentences, plain words, no headings. If the learner thinks a mark is wrong, look at the memo honestly: say so if they have a fair point and tell them to use the Report this mark button, and never change the marks yourself. Stay on this question and its topic; for anything else, kindly bring them back. Never claim the memo or a fact is certain if you are not sure.`

// Asking about one question uses the same daily allowance as Bloom chat, so
// credits and limits stay in one place.
export async function POST(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner
  const { sb } = learner
  if (!process.env.ANTHROPIC_API_KEY) return apiError('setup', 503, { reason: 'no-key' })

  let body: { questionId?: unknown; message?: unknown; history?: unknown }
  try { body = await req.json() } catch { return apiError('invalid', 400) }
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 800) : ''
  if (typeof body.questionId !== 'string' || !message) return apiError('invalid', 400)
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h): h is { q: string; a: string } => !!h && typeof h.q === 'string' && typeof h.a === 'string')
    .slice(-5)
    .map(h => ({ q: h.q.slice(0, 800), a: h.a.slice(0, 2000) }))

  // Everything below is read as the learner, so only their own marked paper is visible.
  const { data: q } = await sb.from('test_questions').select('id, session_id, qtype, marks, question_text').eq('id', body.questionId).maybeSingle()
  if (!q) return apiError('invalid', 404)
  const { data: session } = await sb.from('test_sessions').select('status, grade, subject').eq('id', q.session_id).maybeSingle()
  if (!session || session.status !== 'marked') return apiError('invalid', 409, { reason: 'not-marked' })
  const [{ data: key }, { data: points }, { data: ans }] = await Promise.all([
    sb.from('test_question_keys').select('mcq_correct, explanation').eq('question_id', q.id).maybeSingle(),
    sb.from('test_mark_points').select('id, point_text').eq('question_id', q.id).order('position'),
    sb.from('test_answers').select('answer_text, mcq_choice, marks_awarded, feedback').eq('question_id', q.id).maybeSingle(),
  ])

  const fb = (ans?.feedback ?? null) as { points?: { pointId: string; awarded: boolean; reason?: string }[]; correct?: boolean } | null
  const memo = (points ?? []).map(p => {
    const f = fb?.points?.find(x => x.pointId === p.id)
    return `- ${p.point_text}${f ? ` (${f.awarded ? 'awarded' : 'not awarded'}${f.reason ? `: ${f.reason}` : ''})` : ''}`
  }).join('\n')
  const facts =
    `Grade ${session.grade}${session.subject ? `, ${session.subject}` : ''}.\n` +
    `Question (${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}, type ${q.qtype}): ${q.question_text}\n` +
    (q.qtype === 'mcq' ? `Correct option(s): ${key?.mcq_correct ?? 'unknown'}. Learner chose: ${ans?.mcq_choice ?? 'nothing'}.\nExplanation: ${key?.explanation ?? ''}\n` : memo ? `Memo and marking:\n${memo}\n` : '') +
    `Learner's answer: ${ans?.answer_text?.trim() || '(not a typed answer, or left blank)'}\nMarks: ${ans?.marks_awarded ?? 0}/${q.marks}`

  const { data: used, error: useError } = await sb.rpc('bloom_use_message', { p_limit: learner.limit })
  if (useError) return serverError('count ask', useError)
  if (typeof used !== 'number' || used < 0) return apiError('limit', 429, { limit: learner.limit })

  anthropic ??= new Anthropic()
  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `${facts}\n\nLearner asks: ${history[0]?.q ?? message}` },
      ...history.flatMap((h, i) => i === 0 ? [{ role: 'assistant' as const, content: h.a }] : [{ role: 'user' as const, content: h.q }, { role: 'assistant' as const, content: h.a }]),
      ...(history.length ? [{ role: 'user' as const, content: message }] : []),
    ]
    const res = await anthropic.messages.create({ model: BLOOM_MODEL, max_tokens: 700, system: SYSTEM, messages })
    const { error: logError } = await sb.rpc('log_ai_usage', { p_feature: 'test_ask', p_model: res.model, p_usage: res.usage })
    if (logError) console.error('[tests] log ask failed', logError)
    const reply = replyText(res.content as never) || "I couldn't answer that one. Try asking another way."
    return Response.json({ reply, remaining: learner.limit - used }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return serverError('ask about question', err)
  }
}
