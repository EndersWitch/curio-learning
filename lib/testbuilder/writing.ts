// Gentle writing checks for the marked paper. Pure and free: it spots the two
// things Bloom teaches first, a capital letter to start and a full stop to
// finish. Spelling and grammar tips come from the AI at marking time.

export interface WritingBasics {
  // The answer is long enough to be a sentence worth checking.
  isSentence: boolean
  startsLower: boolean
  // Capital letters missing after a full stop, question mark or exclamation mark.
  lowerAfterStop: number
  // The word "i" on its own, which should be "I".
  lonelyI: number
  missingEnd: boolean
  lastWord: string
}

const END_MARK = /[.!?]["'”’)\]]*$/

export function checkBasics(raw: string): WritingBasics {
  const text = raw.trim()
  const words = text.split(/\s+/).filter(Boolean)
  const isSentence = words.length >= 4
  const first = text.match(/[A-Za-z]/)?.[0] ?? ''
  const lastWord = (words[words.length - 1] ?? '').replace(/[^\p{L}\p{N}'’-]+$/u, '')
  return {
    isSentence,
    startsLower: isSentence && first !== '' && first === first.toLowerCase() && first !== first.toUpperCase(),
    lowerAfterStop: isSentence ? (text.match(/[.!?]["'”’)]*\s+[a-z]/g) ?? []).length : 0,
    lonelyI: isSentence ? (text.match(/(^|[\s(])i(?=[\s.,!?']|$)/g) ?? []).length : 0,
    missingEnd: isSentence && !END_MARK.test(text),
    lastWord,
  }
}

export interface WritingTip {
  said: string
  better: string
  why: string
}

// What the AI sends back is untrusted text: keep only well-formed, short tips.
export function cleanTips(value: unknown): WritingTip[] {
  if (!Array.isArray(value)) return []
  const tips: WritingTip[] = []
  for (const t of value as Record<string, unknown>[]) {
    const said = typeof t?.said === 'string' ? t.said.trim().slice(0, 160) : ''
    const better = typeof t?.better === 'string' ? t.better.trim().slice(0, 160) : ''
    const why = typeof t?.why === 'string' ? t.why.trim().slice(0, 240) : ''
    if (said && better && why && said !== better) tips.push({ said, better, why })
    if (tips.length === 3) break
  }
  return tips
}

/** Maths, sciences and the like are marked on the work, not on capital letters or full stops. */
export function skipsWritingTips(subject: string | null | undefined): boolean {
  return /math|physic|chem|account|econom|technolog|engineering|computer|natural science/i.test(subject ?? '')
}
