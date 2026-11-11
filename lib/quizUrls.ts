// URL + label helpers for the quiz tree, shared by server pages (sitemap,
// lesson pages) and client components (quiz runner, results). Keep this file
// free of data fetching so it's safe to import from either side.

// broad_topic slugs (e.g. "parts_of_speech") are reused across grades and
// subjects, so a topic URL must always carry grade + subject to be unambiguous.
export function topicHref(t: { broad_topic: string; grade: number; subject: string }): string {
  return `/quiz/${encodeURIComponent(t.broad_topic)}?grade=${t.grade}&subject=${encodeURIComponent(t.subject)}`
}

export function learnHref(l: { broad_topic: string; id: string }): string {
  return `/quiz/${encodeURIComponent(l.broad_topic)}/${l.id}/learn`
}

export function playHref(l: { broad_topic: string; id: string }): string {
  return `/quiz/${encodeURIComponent(l.broad_topic)}/${l.id}/play`
}

// "parts_of_speech" → "Parts Of Speech" — fallback when a row has no _display.
export function prettySlug(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English Home Language',
}

export function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject] ?? prettySlug(subject)
}

// Lesson copy is stored with a few inline tags (<strong>, <em>) — strip them
// for meta descriptions and other plain-text contexts.
export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length) + '…'
}
