// Point labels, typed before a point in textbook notation: A(1, 2) on a
// coordinate grid, P(0.35) on a number line. A label is one letter, with primes
// (A′, B″) or a subscript (A₁, typed A_1) allowed.

// Subscripts that have their own Unicode characters, so a label stays one plain string.
const SUBSCRIPTS: Record<string, string> = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
}

const primes = (p: string) => p.replace(/''/g, '″').replace(/'/g, '′')

// A label at the start of one point: a letter, primes, a subscript (_1 or _{12}), more primes, then the point's bracket.
const LABEL = /^\s*([A-Za-z])(['′″]*)(?:_(?:\{([^{}]*)\}|([0-9A-Za-z])))?(['′″]*)\s*(?=\()/

/** One label as it's drawn, like "A₁′"; null when its subscript has no Unicode form. */
function labelOf(m: RegExpExecArray): string | null {
  const sub = [...(m[3] ?? m[4] ?? '').trim()]
  if (sub.some((c) => !SUBSCRIPTS[c])) return null
  return m[1] + primes(m[2]) + sub.map((c) => SUBSCRIPTS[c]).join('') + primes(m[5])
}

/** The text split at its top-level commas, so (1, 2), (3, 4) is two points. */
function items(text: string): string[] {
  const out = ['']
  let depth = 0
  for (const ch of text) {
    if ('([{'.includes(ch)) depth++
    if (')]}'.includes(ch)) depth--
    if (ch === ',' && depth === 0) out.push('')
    else out[out.length - 1] += ch
  }
  return out
}

/**
 * Points typed with labels, A(1, 2), B′(3, 4) or P(0.35), 1, as the same text
 * without the labels, and each point's label (or null), in order. Null when
 * nothing is labeled, or the text isn't a list of points.
 */
export function splitLabels(text: string): { text: string; labels: (string | null)[] } | null {
  if (/[=<>≤≥≠]/.test(text)) return null
  const labels: (string | null)[] = []
  const rest = items(text).map((item) => {
    const m = LABEL.exec(item)
    const label = m && labelOf(m)
    labels.push(label)
    return label ? item.slice(m![0].length) : item
  })
  return labels.some(Boolean) ? { text: rest.join(','), labels } : null
}
