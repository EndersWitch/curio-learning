import type { LearningConcept, QuizLevel } from '@/types/quiz'

interface DbConcept {
  title?: string
  text?: string
  example?: { text?: string; label?: string }
}

export function buildLearningZone(level: QuizLevel): LearningConcept[] {
  const cards: LearningConcept[] = []

  // Intro / overview card
  if (level.intro) {
    cards.push({ type: 'key_rule', title: '📖 What You\'re Learning', content: level.intro })
  } else if (level.description) {
    cards.push({ type: 'key_rule', title: '📖 Topic Overview', content: level.description })
  }

  // Concept cards — map DB shape { title, text, example } → LearningConcept
  if (level.concepts && level.concepts.length > 0) {
    for (const raw of level.concepts as unknown as DbConcept[]) {
      const asAny = raw as any
      // Already a proper LearningConcept (has type + content)
      if (asAny.type && asAny.content) {
        cards.push(asAny as LearningConcept)
        continue
      }
      // Map DB format
      const content = raw.text ?? ''
      const exampleText = raw.example?.text
        ? `${raw.example.label ? raw.example.label + ': ' : ''}${raw.example.text}`
        : undefined
      cards.push({
        type: 'key_rule',
        title: raw.title ?? 'Concept',
        content,
        example: exampleText,
      })
    }
  }

  // "What will be tested" card
  if (level.tested && level.tested.length > 0) {
    cards.push({
      type: 'what_tested',
      title: '🎯 What You\'ll Be Tested On',
      content: level.tested.join('\n'),
    })
  }

  // Difficulty indicator — map YOUR actual DB values
  if (level.difficulty) {
    const diffMap: Record<string, string> = {
      // DB values
      'Starter':   '🟢 This is a beginner level — take it slow and steady!',
      'Building':  '🟡 This level builds on what you know — think carefully!',
      'Challenge': '🔴 This is a tough one — give it your best shot!',
      // Legacy values (just in case)
      'easy':   '🟢 This is a beginner level — take it slow and steady!',
      'medium': '🟡 This level has a bit more challenge — think carefully!',
      'hard':   '🔴 This is a tough one — give it your best shot!',
    }
    const diffText = diffMap[level.difficulty]
    // Only add card if we have a matching label — skip unknown values
    if (diffText) {
      cards.push({ type: 'tip', title: '💡 Difficulty', content: diffText })
    }
  }

  // Fallback if nothing to show
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
  }

  return cards
}

export const CARD_STYLES: Record<
  LearningConcept['type'],
  { bg: string; border: string; icon: string; label: string }
> = {
  key_rule:        { bg: 'bg-violet-50',  border: 'border-violet-300',  icon: '📕', label: 'Key Rule' },
  did_you_know:    { bg: 'bg-cyan-50',    border: 'border-cyan-300',    icon: '✨', label: 'Did You Know?' },
  example:         { bg: 'bg-amber-50',   border: 'border-amber-300',   icon: '📝', label: 'Example' },
  tip:             { bg: 'bg-emerald-50', border: 'border-emerald-300', icon: '💡', label: 'Quick Tip' },
  common_mistake:  { bg: 'bg-rose-50',    border: 'border-rose-300',    icon: '⚠️', label: 'Common Mistake' },
  spot_difference: { bg: 'bg-orange-50',  border: 'border-orange-300',  icon: '🔍', label: 'Spot the Difference' },
  what_tested:     { bg: 'bg-indigo-50',  border: 'border-indigo-300',  icon: '🎯', label: 'What You\'ll Be Tested On' },
}
