export type Phase = 'Intermediate' | 'Senior' | 'FET'

export interface BroadTopic {
  id: string
  name: string
  subject: string
  grade: number
  phase: Phase
  description: string
  icon: string
  color: string
  subtopic_count: number
  is_premium: boolean
}

export interface Subtopic {
  id: string
  broad_topic_id: string
  name: string
  description: string
  level_count: number
  order_index: number
  is_premium: boolean
}

export interface QuizLevel {
  id: string
  subtopic_id: string
  broad_topic: string
  subject: string
  grade: number
  level_number: number
  title: string
  description: string
  section_type: 'level' | 'subtopic_mastery' | 'broad_topic_mastery' | 'general_practice'
  question_count: number
  xp_reward: number
  pass_threshold: number
  is_premium: boolean
  // Learning zone content
  intro?: string
  concepts?: LearningConcept[]
  tested?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface LearningConcept {
  type: 'key_rule' | 'did_you_know' | 'example' | 'tip' | 'common_mistake' | 'spot_difference' | 'what_tested'
  title: string
  content: string
  example?: string
}

export interface Question {
  id: string
  grade: number
  subject: string
  broad_topic: string
  subtopic_id?: string
  level_id?: string
  section_type: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation?: string
  is_premium: boolean
}

export interface ShuffledQuestion {
  id: string
  question_text: string
  options: { key: string; text: string }[]
  correct_key: string
  explanation?: string
}

export interface UserProgress {
  user_id: string
  level_id: string
  subtopic_id?: string
  broad_topic_id?: string
  completed: boolean
  passed: boolean
  best_score: number
  attempts: number
  xp_earned: number
  completed_at?: string
}

export interface UserProfile {
  id: string
  display_name: string
  total_xp: number
  streak: number
  is_premium: boolean
  is_founder: boolean
  grade?: number
}

export interface QuizAttemptState {
  levelId: string
  questions: ShuffledQuestion[]
  currentIndex: number
  answers: Record<string, string>
  score: number
  startedAt: number
}

export interface QuizResult {
  score: number
  total: number
  passed: boolean
  xpEarned: number
  timeTaken: number
  newMasteryUnlocked?: string
  nextLevelId?: string
}
