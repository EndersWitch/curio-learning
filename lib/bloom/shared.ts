// Bloom (the Deep Learn tutor): constants and wire types shared by the chat
// UI and the /api/bloom routes. Server-only settings live in lib/bloom/server.ts.

export const BLOOM_GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const

// Questions per South African calendar day. Every message costs real money
// (see the plan: R49/month only covers ~150 Opus messages), so these are the
// main cost lever. Testers get headroom for trialling.
export const DAILY_LIMITS = { free: 3, premium: 20, tester: 150 } as const
export type BloomTier = keyof typeof DAILY_LIMITS

export const MAX_QUESTION_CHARS = 1500
// Long chats re-send their whole history every turn, so cap them and start fresh.
export const MAX_TURNS_PER_CHAT = 20

export interface BloomTurnView {
  question: string
  reply: string
}

// GET /api/bloom/session
export interface BloomSession {
  tier: BloomTier
  limit: number
  remaining: number
  grade: number | null // the learner's profile grade, when it's one Bloom covers
  conversation: { id: string; grade: number; turns: BloomTurnView[] } | null
}

// POST /api/bloom/chat streams these back, one JSON object per line.
export type BloomEvent =
  | { type: 'meta'; conversationId: string; remaining: number }
  | { type: 'cheer' }
  | { type: 'text'; text: string }
  | { type: 'replace'; text: string }
  | { type: 'done'; truncated: boolean }
  | { type: 'error'; message: string }

// Error bodies are { error: BloomErrorCode, ... } with a matching HTTP status.
export type BloomErrorCode = 'signin' | 'closed' | 'limit' | 'full' | 'invalid' | 'setup' | 'server'
