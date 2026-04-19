import type { LearningConcept, QuizLevel } from '@/types/quiz'

/**
 * Map raw quiz level data into structured learning zone cards.
 * Falls back gracefully if DB content is sparse.
 */
export function buildLearningZone(level: QuizLevel): LearningConcept[] {
  const cards: LearningConcept[] = []

  // Intro card — always present
  if (level.intro) {
    cards.push({
      type: 'key_rule',
      title: '📖 What You\'re Learning',
      content: level.intro,
    })
  } else if (level.description) {
    cards.push({
      type: 'key_rule',
      title: '📖 Topic Overview',
      content: level.description,
    })
  }

  // Concept cards
  if (level.concepts && level.concepts.length > 0) {
    cards.push(...level.concepts)
  }

  // "What will be tested" card — always try to include
  if (level.tested && level.tested.length > 0) {
    cards.push({
      type: 'what_tested',
      title: '🎯 What You\'ll Be Tested On',
      content: level.tested.join('\n'),
    })
  }

  // Difficulty indicator
  if (level.difficulty) {
    const diffMap: Record<string, string> = {
      easy: '🟢 This is a beginner level — take it slow and steady!',
      medium: '🟡 This level has a bit more challenge — think carefully!',
      hard: '🔴 This is a tough one — give it your best shot!',
    }
    cards.push({
      type: 'tip',
      title: '💪 Difficulty',
      content: diffMap[level.difficulty] ?? '',
    })
  }

  // Fallback if we have nothing
  if (cards.length === 0) {
    cards.push({
      type: 'key_rule',
      title: '📖 Getting Ready',
      content: `You're about to answer ${level.question_count} questions. Read each question carefully before choosing your answer.`,
    })
    cards.push({
      type: 'tip',
      title: '💡 Quick Tip',
      content: 'If you\'re not sure, try to eliminate the obviously wrong answers first — your instincts are often right!',
    })
    cards.push({
      type: 'what_tested',
      title: '🎯 What to Expect',
      content: `${level.question_count} multiple-choice questions. You need to pass to unlock the next level.`,
    })
  }

  return cards
}

/**
 * Visual config for each card type
 */
export const CARD_STYLES: Record<
  LearningConcept['type'],
  { bg: string; border: string; icon: string; label: string }
> = {
  key_rule: {
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    icon: '🔑',
    label: 'Key Rule',
  },
  did_you_know: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    icon: '✨',
    label: 'Did You Know?',
  },
  example: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: '📝',
    label: 'Example',
  },
  tip: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    icon: '💡',
    label: 'Quick Tip',
  },
  common_mistake: {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    icon: '⚠️',
    label: 'Common Mistake',
  },
  spot_difference: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: '🔍',
    label: 'Spot the Difference',
  },
  what_tested: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    icon: '🎯',
    label: 'What You\'ll Be Tested On',
  },
}
