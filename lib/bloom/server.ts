// Server-only helpers for the /api/bloom routes. Never import this from a
// client component.

import type Anthropic from '@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseConfig'
import { CHEER_MARKER } from '@/lib/bloom/rulebook'
import { BLOOM_GRADES, DAILY_LIMITS, type BloomErrorCode, type BloomTier } from '@/lib/bloom/shared'

export const BLOOM_MODEL = 'claude-opus-5-5'
// Thinking is always on for this model; effort sets how much. A chat wants a
// quick first word more than long deliberation. Try 'medium' if the test
// questions show it cutting corners.
export const BLOOM_EFFORT = 'low' as const
// Thinking counts toward this as well, so leave room above the longest reply.
export const BLOOM_MAX_TOKENS = 8000
// A chat left alone longer than this starts fresh on the next visit.
export const RESUME_WITHIN_HOURS = 12

type Access = 'off' | 'testers' | 'everyone'

// Who may use Bloom at all, from BLOOM_ACCESS. Unset means 'off' everywhere
// except `npm run dev` (testers only), so merging this code can never switch
// Bloom on for the public by accident; launching is a deliberate env change.
function bloomAccess(): Access {
  const value = process.env.BLOOM_ACCESS?.trim().toLowerCase()
  if (value === 'off' || value === 'testers' || value === 'everyone') return value
  return process.env.NODE_ENV === 'development' ? 'testers' : 'off'
}

// Admin accounts are always testers; BLOOM_TESTERS adds more by email
// (comma-separated), e.g. a plain student account for trying Bloom as a learner.
function testerEmails() {
  return new Set(
    (process.env.BLOOM_TESTERS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
  )
}

export function apiError(code: BloomErrorCode, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error: code, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function serverError(what: string, err: unknown) {
  console.error(`[bloom] ${what} failed`, err)
  // Before the Bloom migration is applied, its tables and function don't exist yet.
  const code = (err as { code?: string } | null)?.code
  if (code && ['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)) return apiError('setup', 503)
  return apiError('server', 500)
}

export interface Learner {
  id: string
  grade: number | null
  tier: BloomTier
  limit: number
  sb: SupabaseClient
}

// Resolves the signed-in learner from the request's bearer token, or returns
// the error response to send instead.
export async function getLearner(req: Request): Promise<Learner | Response> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return apiError('signin', 401)

  // A client that acts as the learner (their own JWT), so every query below
  // is held to RLS: no service-role key anywhere in Bloom.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return apiError('signin', 401)

  const { data: profile } = await sb
    .from('profiles')
    .select('grade, is_premium, is_founder, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const access = bloomAccess()
  const isTester = profile?.is_admin === true || testerEmails().has((user.email ?? '').toLowerCase())
  if (access === 'off' || (access === 'testers' && !isTester)) return apiError('closed', 403)

  // Same premium rule as the rest of the site: paying members and founders.
  const tier: BloomTier = isTester ? 'tester' : profile?.is_premium || profile?.is_founder ? 'premium' : 'free'
  return { id: user.id, grade: parseGrade(profile?.grade), tier, limit: DAILY_LIMITS[tier], sb }
}

export function parseGrade(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return (BLOOM_GRADES as readonly number[]).includes(n) ? n : null
}

// Today in South Africa as YYYY-MM-DD, the same day bloom_use_message() counts against.
export function todayInSA() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())
}

export interface StoredTurn {
  grade: number
  question: string
  context: string | null
  reply: Anthropic.Beta.BetaContentBlockParam[]
}

// Rebuilds the conversation exactly as it was sent before: same messages in
// the same order, Claude's replies untouched. Editing anything here would
// invalidate the reasoning Claude carried in its earlier replies.
export function historyMessages(turns: StoredTurn[]): Anthropic.Beta.BetaMessageParam[] {
  const messages: Anthropic.Beta.BetaMessageParam[] = []
  for (const turn of turns) {
    messages.push({ role: 'user', content: turn.question })
    if (turn.context) messages.push({ role: 'system', content: turn.context })
    messages.push({ role: 'assistant', content: turn.reply })
  }
  return messages
}

// What to keep from a reply so it can be replayed next turn. If a safety
// fallback took over partway through, only the text from before the switch is
// kept from the model that declined (the API's rule for echoing fallback
// turns), and the fallback marker block itself is dropped.
export function replayableContent(blocks: Anthropic.Beta.BetaContentBlock[]) {
  const boundary = blocks.map(b => b.type).lastIndexOf('fallback')
  return blocks.filter((b, i) => b.type !== 'fallback' && (i > boundary || b.type === 'text'))
}

// The reply as the learner sees it: its text, minus the celebration marker.
export function replyText(blocks: Anthropic.Beta.BetaContentBlock[]) {
  const text = blocks.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('').trim()
  return text.startsWith(CHEER_MARKER) ? text.slice(CHEER_MARKER.length).trim() : text
}
