// Hard check for answers that must be word for word (verified definitions).
// The AI marker can be generous, so code has the last word: every key term of
// the verified wording has to appear in the learner's answer.

const STOP = new Set('that this with from which when where what have been were their there then than they them into over under also each other such only some more most both while because between about after before'.split(' '))

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/-/g, ' ')

// The term being defined ("Gross profit is …") does not have to be repeated.
const body = (exact: string) => { const m = /^(.{1,60}?)\s+(?:is|are|means|refers to)\s+(.+)$/i.exec(exact.trim()); return m ? m[2]! : exact }

export function keyTerms(exactFull: string): string[] {
  const exact = body(exactFull)
  const out = new Set<string>()
  for (const w of norm(exact).split(/\s+/)) if (w.length >= 5 && !STOP.has(w)) out.add(w)
  for (const w of norm(exact).split(/\s+/)) if (/^\d+$/.test(w)) out.add(w)
  return [...out]
}

const stem = (w: string) => (w.length > 6 ? w.slice(0, w.length - 2) : w.length > 4 ? w.slice(0, w.length - 1) : w)

/** Every key term must be there (a plural or tense change is fine). */
export function exactHolds(answer: string, exact: string): { ok: boolean; missing: string[] } {
  const words = norm(answer).split(/\s+/).filter(Boolean)
  const missing = keyTerms(exact).filter(t => !words.some(w => w === t || w.startsWith(stem(t)) || t.startsWith(stem(w)) && w.length >= 5))
  return { ok: missing.length === 0, missing }
}
