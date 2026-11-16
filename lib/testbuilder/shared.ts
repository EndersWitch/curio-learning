// Bloom test builder: constants and wire types shared by the page and the
// /api/tests routes. Server-only code lives in app/api/tests.

export const TEST_LENGTHS = ['short', 'medium', 'long'] as const
export type TestLength = (typeof TEST_LENGTHS)[number]

// Rough question counts per length. The generator treats these as targets.
export const LENGTH_QUESTIONS: Record<TestLength, number> = { short: 10, medium: 25, long: 50 }

export const MAX_SCOPE_CHARS = 6000
export const MAX_TOPICS = 20
export const MAX_TOPIC_CHARS = 90

export interface QuestionMix {
  mcq: boolean
  short: boolean
  long: boolean
}

export interface TopicView {
  id: string
  title: string
  included: boolean
}

// POST /api/tests/topics
export interface TopicsRequest {
  scope: string
  grade: number
  subject?: string
  length: TestLength
  questionMix: QuestionMix
}

export interface TopicsResponse {
  sessionId: string
  topics: TopicView[]
}

// POST /api/tests/generate
export interface GenerateResponse {
  sessionId: string
  questionCount: number
  // The learner asked for written questions, which come in a later step.
  writtenPending: boolean
}

// POST /api/tests/submit
export interface SubmitResponse {
  status: 'marked' | 'submitted'
  marksAwarded: number
  marksTotal: number
}
