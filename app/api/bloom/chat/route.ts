import Anthropic from '@anthropic-ai/sdk'
import { BLOOM_RULEBOOK, CHEER_MARKER, learnerContext } from '@/lib/bloom/rulebook'
import { MAX_QUESTION_CHARS, MAX_TURNS_PER_CHAT, type BloomEvent } from '@/lib/bloom/shared'
import {
  BLOOM_EFFORT,
  BLOOM_MAX_TOKENS,
  BLOOM_MODEL,
  apiError,
  getLearner,
  historyMessages,
  parseGrade,
  replayableContent,
  replyText,
  serverError,
  type StoredTurn,
} from '@/lib/bloom/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const REFUSED_TEXT = "Hmm, that's one I can't help with. Let's try a different question about your schoolwork!"

let anthropic: Anthropic | null = null

// Sends one learner message to Bloom and streams the reply back as
// newline-delimited JSON (BloomEvent). The turn is only saved once the reply
// is complete, so a failed reply never leaves a half-written conversation.
export async function POST(req: Request) {
  const learner = await getLearner(req)
  if (learner instanceof Response) return learner
  const { sb } = learner

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[bloom] ANTHROPIC_API_KEY is not set')
    return apiError('setup', 503)
  }

  let body: { conversationId?: unknown; grade?: unknown; message?: unknown }
  try {
    body = await req.json()
  } catch {
    return apiError('invalid', 400)
  }
  const question = typeof body.message === 'string' ? body.message.trim() : ''
  const grade = parseGrade(body.grade)
  if (!question || question.length > MAX_QUESTION_CHARS || grade === null) return apiError('invalid', 400)

  // Continue the learner's own conversation if they named one (RLS hides
  // everyone else's); otherwise a new one starts below.
  let conversationId: string | null = null
  let turns: StoredTurn[] = []
  if (typeof body.conversationId === 'string') {
    const { data: owned } = await sb
      .from('bloom_conversations')
      .select('id')
      .eq('id', body.conversationId)
      .maybeSingle()
    if (owned) {
      conversationId = owned.id
      const { data, error } = await sb
        .from('bloom_turns')
        .select('grade, question, context, reply')
        .eq('conversation_id', owned.id)
        .order('id')
      if (error) return serverError('load turns', error)
      turns = data as StoredTurn[]
      if (turns.length >= MAX_TURNS_PER_CHAT) return apiError('full', 409)
    }
  }

  // Count the message against today's allowance before spending anything.
  // A reply that fails later still uses it up: refunds would need an
  // endpoint learners could call to top themselves back up.
  const { data: used, error: useError } = await sb.rpc('bloom_use_message', { p_limit: learner.limit })
  if (useError) return serverError('count message', useError)
  if (typeof used !== 'number' || used < 0) return apiError('limit', 429, { limit: learner.limit })

  if (!conversationId) {
    const { data, error } = await sb.from('bloom_conversations').insert({ user_id: learner.id }).select('id').single()
    if (error) return serverError('start conversation', error)
    conversationId = data.id as string
  }

  // Tell Claude the grade on the first turn, and again whenever it changes.
  const previousGrade = turns.length ? turns[turns.length - 1].grade : null
  const context = grade === previousGrade ? null : learnerContext(grade, previousGrade !== null)

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...historyMessages(turns),
    { role: 'user', content: question },
    ...(context ? [{ role: 'system' as const, content: context }] : []),
  ]

  anthropic ??= new Anthropic()
  const stream = anthropic.beta.messages.stream({
    model: BLOOM_MODEL,
    max_tokens: BLOOM_MAX_TOKENS,
    betas: ['server-side-fallback-2026-07-01', 'thinking-binding-controls-2026-08-01'],
    // If a safety classifier wrongly declines a school question, the API
    // re-runs it on Anthropic's recommended fallback model instead of failing.
    fallbacks: 'default',
    thinking: {
      type: 'adaptive',
      display: 'omitted',
      // History is append-only, so this should never trigger; if it ever
      // does, drop the stale reasoning rather than fail the learner's message.
      block_binding: { prefix_mismatch_behavior: 'drop_block' },
    },
    output_config: { effort: BLOOM_EFFORT },
    // The rulebook is identical for every learner, so it's cached once and
    // shared; the top-level marker caches each conversation as it grows.
    system: [{ type: 'text', text: BLOOM_RULEBOOK, cache_control: { type: 'ephemeral' } }],
    cache_control: { type: 'ephemeral' },
    messages,
  })

  const encoder = new TextEncoder()
  const remaining = learner.limit - used
  const newConversationId = conversationId

  const replyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: BloomEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
        } catch {
          // The learner closed the page; nothing left to tell them.
        }
      }

      send({ type: 'meta', conversationId: newConversationId, remaining })

      // Hold back the first few characters until we know whether the reply
      // opens with the celebration marker, so the marker is never shown.
      let opening = ''
      let opened = false
      const emit = (text: string) => {
        if (opened) return send({ type: 'text', text })
        opening += text
        const head = opening.trimStart()
        if (head.length < CHEER_MARKER.length && CHEER_MARKER.startsWith(head)) return
        opened = true
        opening = head
        if (opening.startsWith(CHEER_MARKER)) {
          send({ type: 'cheer' })
          opening = opening.slice(CHEER_MARKER.length).trimStart()
        }
        if (opening) send({ type: 'text', text: opening })
      }

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') emit(event.delta.text)
        }
        const final = await stream.finalMessage()
        if (!opened && opening.trim()) send({ type: 'text', text: opening.trim() })

        if (final.stop_reason === 'refusal') {
          // The whole fallback chain declined: swap out any partial answer and
          // save nothing, so the declined exchange never re-enters the history.
          send({ type: 'replace', text: REFUSED_TEXT })
          send({ type: 'done', truncated: false })
          return
        }

        const text = replyText(final.content)
        if (!text) throw new Error(`empty reply (stop_reason: ${final.stop_reason})`)

        const { error } = await sb.from('bloom_turns').insert({
          conversation_id: newConversationId,
          user_id: learner.id,
          grade,
          question,
          context,
          reply: replayableContent(final.content),
          reply_text: text,
          model: final.model,
          usage: final.usage,
        })
        if (error) console.error('[bloom] save turn failed', error)

        send({ type: 'done', truncated: final.stop_reason === 'max_tokens' })
      } catch (err) {
        if (!stream.aborted) console.error('[bloom] reply failed', err)
        send({ type: 'error', message: friendlyError(err) })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
    // The learner closed the page mid-reply: stop paying for tokens nobody will read.
    cancel() {
      stream.abort()
    },
  })

  return new Response(replyStream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}

function friendlyError(err: unknown) {
  if (err instanceof Anthropic.RateLimitError) {
    return 'Lots of learners are asking Bloom things right now. Try again in a minute.'
  }
  if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500) {
    return "Bloom's brain is having a moment. Try again shortly."
  }
  return 'Bloom got a bit tangled up. Try again in a moment.'
}
