/**
 * Converts a database slug into a proper human-readable display name.
 * "parts_of_speech"  → "Parts of Speech"
 * "english_hl"       → "English HL"
 * "nouns"            → "Nouns"
 * "grade_4_comprehension" → "Grade 4 Comprehension"
 *
 * Rules:
 * - Replace underscores and hyphens with spaces
 * - Title-case every word EXCEPT small connector words (unless first word)
 * - Known acronyms stay uppercase (HL, FAL, EGD, CAT, IT)
 */

const SMALL_WORDS = new Set(['of', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by'])
const ACRONYMS    = new Set(['hl', 'fal', 'egd', 'cat', 'it', 'rsa', 'sa'])

export function toDisplayName(slug: string): string {
  if (!slug) return ''
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (ACRONYMS.has(lower)) return word.toUpperCase()
      if (i > 0 && SMALL_WORDS.has(lower)) return lower
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
