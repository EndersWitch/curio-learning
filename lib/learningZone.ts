import type { LearningConcept, CardType, QuizLevel } from '@/types/quiz'

interface DbConcept {
  type?: CardType
  title?: string
  text?: string
  content?: string
  example?: string | { text?: string; label?: string }
  sideA?: string
  sideB?: string
}

// Normalise a raw DB concept into the canonical LearningConcept shape.
// Supports both old format { title, text, example: { label, text } }
// and new format { type, title, content, example: string }.
function normaliseConcept(raw: DbConcept): LearningConcept {
  // If it already has type + content it's the new format — use as-is
  if (raw.type && (raw.content || raw.text)) {
    const content = raw.content ?? raw.text ?? ''
    let example: string | undefined
    if (typeof raw.example === 'string') {
      example = raw.example
    } else if (raw.example?.text) {
      example = raw.example.label
        ? `${raw.example.label}: ${raw.example.text}`
        : raw.example.text
    }
    return {
      type:    raw.type,
      title:   raw.title ?? 'Concept',
      content,
      example,
      sideA:   raw.sideA,
      sideB:   raw.sideB,
    }
  }

  // Legacy format — has no type, derive from title heuristics or default to key_rule
  const content = raw.text ?? raw.content ?? ''
  let example: string | undefined
  if (typeof raw.example === 'string') {
    example = raw.example
  } else if (raw.example?.text) {
    example = raw.example.label
      ? `${raw.example.label}: ${raw.example.text}`
      : raw.example.text
  }

  const title = raw.title ?? 'Concept'
  let type: CardType = 'key_rule'
  const t = title.toLowerCase()
  if (t.includes('did you know') || t.includes('fun fact') || t.includes('interesting')) type = 'did_you_know'
  else if (t.includes('example') || t.includes('try this')) type = 'example'
  else if (t.includes('tip') || t.includes('shortcut') || t.includes('trick')) type = 'tip'
  else if (t.includes('mistake') || t.includes('wrong') || t.includes('incorrect')) type = 'common_mistake'
  else if (t.includes('step')) type = 'step_by_step'
  else if (t.includes('definition') || t.includes('what is') || t.includes('meaning')) type = 'definition'
  else if (t.includes('compare') || t.includes('vs') || t.includes('difference')) type = 'spot_difference'
  else if (t.includes('remember') || t.includes('memory') || t.includes('mnemonic')) type = 'memory_trick'
  else if (t.includes('real') || t.includes('life') || t.includes('world')) type = 'real_world'
  else if (t.includes('watch out') || t.includes('warning') || t.includes('careful')) type = 'watch_out'

  return { type, title, content, example }
}

export function buildLearningZone(level: QuizLevel): LearningConcept[] {
  const cards: LearningConcept[] = []

  // Intro / overview card
  if (level.intro) {
    cards.push({ type: 'key_rule', title: '📖 What You\'re Learning', content: level.intro })
  } else if (level.description) {
    cards.push({ type: 'key_rule', title: '📖 Topic Overview', content: level.description })
  }

  // Concept cards
  if (level.concepts && level.concepts.length > 0) {
    for (const raw of level.concepts as unknown as DbConcept[]) {
      cards.push(normaliseConcept(raw))
    }
  }

  // "What will be tested" checklist
  if (level.tested && level.tested.length > 0) {
    cards.push({
      type: 'what_tested',
      title: 'What You\'ll Be Tested On',
      content: level.tested.join('\n'),
    })
  }

  // Difficulty card
  if (level.difficulty) {
    const diffMap: Record<string, { content: string; type: CardType }> = {
      Starter:   { type: 'tip', content: '🟢 Beginner level — take it slow and steady!' },
      Building:  { type: 'tip', content: '🟡 Building on what you know — think carefully!' },
      Challenge: { type: 'watch_out', content: '🔴 Tough one — read every question twice before answering!' },
      easy:      { type: 'tip', content: '🟢 Beginner level — take it slow and steady!' },
      medium:    { type: 'tip', content: '🟡 A bit more challenging — think carefully!' },
      hard:      { type: 'watch_out', content: '🔴 Tough one — read every question twice before answering!' },
    }
    const d = diffMap[level.difficulty]
    if (d) cards.push({ type: d.type, title: 'Difficulty Level', content: d.content })
  }

  // Fallback
  if (cards.length === 0) {
    cards.push({
      type: 'key_rule',
      title: '📖 Getting Ready',
      content: `You're about to answer ${level.question_count} questions. Read each one carefully before choosing your answer.`,
    })
    cards.push({
      type: 'tip',
      title: 'Quick Tip',
      content: 'If you\'re not sure, try to eliminate the obviously wrong answers first — your instincts are often right!',
    })
  }

  return cards
}

// Card metadata — used by admin for display labels and admin preview
export const CARD_META: Record<CardType, { icon: string; label: string; description: string; color: string }> = {
  key_rule:        { icon: '📕', label: 'Key Rule',             color: '#6DD3CE', description: 'Core concept or rule the learner must know' },
  did_you_know:    { icon: '✨', label: 'Did You Know?',        color: '#F5C842', description: 'Interesting fact — sparks curiosity' },
  example:         { icon: '📝', label: 'Example',              color: '#FF5E5B', description: 'Worked example showing the concept in action' },
  tip:             { icon: '💡', label: 'Quick Tip',            color: '#6DD3CE', description: 'Shortcut, trick or helpful hint' },
  common_mistake:  { icon: '⚠️', label: 'Common Mistake',      color: '#FF5E5B', description: 'Flip card — shows the mistake then the fix' },
  spot_difference: { icon: '🔍', label: 'Spot the Difference', color: '#F5C842', description: 'Side-by-side comparison of two things' },
  what_tested:     { icon: '🎯', label: "What You'll Be Tested On", color: '#c4b8d8', description: 'Auto-generated from the tested array — not selectable in admin' },
  try_it:          { icon: '🎮', label: 'Try It!',              color: '#a78bfa', description: 'Mini challenge — learner attempts before seeing the answer' },
  real_world:      { icon: '🌍', label: 'Real World',           color: '#6DD3CE', description: 'Story or context connecting to real life' },
  memory_trick:    { icon: '🧠', label: 'Memory Trick',         color: '#a78bfa', description: 'Mnemonic or trick to help remember a rule' },
  watch_out:       { icon: '🚨', label: 'Watch Out!',           color: '#FF5E5B', description: 'Critical warning — examiners love to test this' },
  fun_fact:        { icon: '🎉', label: 'Fun Fact!',            color: '#F5C842', description: 'Playful and surprising — keeps energy up' },
  step_by_step:    { icon: '🪜', label: 'Step by Step',         color: '#6DD3CE', description: 'Numbered steps for a process or method' },
  definition:      { icon: '📖', label: 'Definition',           color: '#c4b8d8', description: 'Formal dictionary-style definition of a term' },
}
