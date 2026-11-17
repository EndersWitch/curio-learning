// Bloom test builder: constants and wire types shared by the page and the
// /api/tests routes. Server-only code lives in app/api/tests.

export const TEST_LENGTHS = ['short', 'medium', 'long'] as const
export type TestLength = (typeof TEST_LENGTHS)[number]

// Questions per topic for each length: [fewest, most]. Topics take turns at
// the higher number, so a short test over 4 topics is 2, 1, 2, 1 questions.
export const PER_TOPIC: Record<TestLength, [number, number]> = { short: [1, 2], medium: [3, 4], long: [5, 6] }

export function perTopicLabel(length: TestLength): string {
  const [lo, hi] = PER_TOPIC[length]
  return `${lo} to ${hi} questions per topic`
}

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
  marksTotal: number
}

// POST /api/tests/submit
export interface SubmitResponse {
  status: 'marked' | 'submitted'
  marksAwarded: number
  marksTotal: number
}
