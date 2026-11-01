// Reading the formula a teacher types: "CH4", "SO4 2-", "NH4+", "N 3-", or
// pasted with real subscripts and superscripts ("SO₄²⁻"). Digits right after
// an element are its count, so a charge of 2 or more needs a space, ^ or
// parentheses before it ("SO42-" is 42 oxygens and a charge of 1−, and
// "N3-" is three N atoms, azide, rather than nitride).

import { ELEMENTS, TRANSITION_METALS, UNDRAWN } from './elements'

export interface Formula {
  /** every atom, in the order written */
  atoms: string[]
  /** the formula as written, element by element, for showing it */
  tokens: { symbol: string; count: number }[]
  charge: number
  /** as written without spaces, with the charge after one ("SO4 2-"), for
   *  matching the list of structures */
  written: string
  /** the same for any formula with the same atoms and charge, whatever
   *  order they're written in */
  composition: string
}

export type ParsedFormula = { ok: true; formula: Formula } | { ok: false; message: string }

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉'
const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const MAX_ATOMS = 60

/** Plain ASCII: subscripts become digits, a run of superscripts becomes "^"
 *  and what it says, and minus signs become hyphens. */
function plain(text: string) {
  let out = ''
  let superscript = false
  for (const ch of text.replace(/[−–]/g, '-')) {
    const sub = SUBSCRIPTS.indexOf(ch)
    const sup = SUPERSCRIPTS.indexOf(ch)
    const sign = ch === '⁺' ? '+' : ch === '⁻' ? '-' : ''
    if (sup >= 0 || sign) {
      out += (superscript ? '' : '^') + (sign || String(sup))
      superscript = true
      continue
    }
    superscript = false
    out += sub >= 0 ? String(sub) : ch
  }
  return out
}

const CHARGE_PATTERNS: [RegExp, (m: RegExpMatchArray) => [string, string]][] = [
  [/\(\s*(\d*)\s*([+-])\s*\)$/, (m) => [m[1], m[2]]],
  [/\(\s*([+-])\s*(\d*)\s*\)$/, (m) => [m[2], m[1]]],
  [/(?:\^|\s)\s*(\d*)\s*([+-])$/, (m) => [m[1], m[2]]],
  [/(?:\^|\s)\s*([+-])\s*(\d+)$/, (m) => [m[2], m[1]]],
  [/([+-])$/, (m) => ['', m[1]]],
]

/** The charge written at the end, and what comes before it. */
function splitCharge(text: string): [string, number] {
  for (const [pattern, parts] of CHARGE_PATTERNS) {
    const m = text.match(pattern)
    if (!m) continue
    const [digits, sign] = parts(m)
    const size = digits ? Number(digits) : 1
    return [text.slice(0, m.index), sign === '-' ? -size : size]
  }
  return [text, 0]
}

export function parseFormula(typed: string): ParsedFormula {
  const fail = (message: string): ParsedFormula => ({ ok: false, message })
  const [before, charge] = splitCharge(plain(typed).trim())
  const body = before.replace(/\s+/g, '')
  if (!body) return fail('Type a formula, like H2O or SO4 2-.')
  if (/^[a-z]/.test(body)) return fail('Start each element with a capital letter, like CO2.')
  if (!/^([A-Z][a-z]?\d*)+$/.test(body)) return fail(`Lewis Structures can’t read “${typed.trim()}”. Type a formula like H2O or SO4 2-.`)

  const tokens: Formula['tokens'] = []
  for (const [, symbol, digits] of body.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    if (TRANSITION_METALS.has(symbol)) return fail(`Lewis Structures doesn’t draw transition metals like ${symbol}.`)
    if (UNDRAWN.has(symbol)) return fail(`Lewis Structures doesn’t draw ${symbol}.`)
    if (!ELEMENTS[symbol]) return fail(`“${symbol}” isn’t an element. Check the capital letters.`)
    const count = digits ? Number(digits) : 1
    if (count < 1) return fail(`“${symbol}${digits}” needs a count of at least 1.`)
    tokens.push({ symbol, count })
  }

  const atoms = tokens.flatMap(({ symbol, count }) => Array<string>(Math.min(count, MAX_ATOMS)).fill(symbol))
  if (atoms.length > MAX_ATOMS) return fail('That’s too many atoms for a Lewis structure.')
  // The metals that only form ionic compounds are drawn as atoms and ions on their own.
  const ionic = tokens.find(({ symbol }) => ELEMENTS[symbol].ionic)
  if (ionic && atoms.length > 1) {
    const meant = ionMeant(tokens, charge)
    if (meant) return fail(`${typed.trim()} is ${atoms.length} ${ionic.symbol} atoms. For the ${meant.name} ion, type ${meant.typed}.`)
    const ion = ELEMENTS[ionic.symbol].valence
    return fail(`${ionic.symbol} forms ionic compounds, which Lewis Structures doesn’t draw. Type ${ionic.symbol}${ion > 1 ? ` ${ion}` : ''}+ for its ion on its own.`)
  }

  const counts = new Map<string, number>()
  for (const a of atoms) counts.set(a, (counts.get(a) ?? 0) + 1)
  const composition = [...counts].sort(([a], [b]) => (a < b ? -1 : 1)).map(([symbol, n]) => `${symbol}${n}`).join('') + `q${charge}`
  const written = body + (charge ? ` ${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge < 0 ? '-' : '+'}` : '')
  return { ok: true, formula: { atoms, tokens, charge, written, composition } }
}

const toScript = (digits: string, script: string) => [...digits].map((d) => script[Number(d)]).join('')

/** A charge as written after an ion: "+", "2−" (no 1, a true minus sign). */
export const chargeText = (charge: number) =>
  charge === 0 ? '' : `${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge < 0 ? '−' : '+'}`

/** A charge in superscripts: "²⁻". */
const chargeScript = (charge: number) => toScript(chargeText(charge).replace(/\D/g, ''), SUPERSCRIPTS) + (charge < 0 ? '⁻' : charge > 0 ? '⁺' : '')

/** The ion a formula of one element with a count and a charge of 1, like
 *  N3-, may have been meant as, since the digits are read as its count:
 *  N³⁻, typed "N 3-". */
export function ionMeant(tokens: Formula['tokens'], charge: number) {
  if (tokens.length !== 1 || tokens[0].count < 2 || Math.abs(charge) !== 1) return undefined
  const { symbol, count } = tokens[0]
  return { name: symbol + chargeScript(count * charge), typed: `${symbol} ${count}${charge < 0 ? '-' : '+'}` }
}

/** A formal charge with its sign: "+1", "−2". */
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** The formula in plain text with real subscripts and superscripts: "SO₄²⁻". */
export function formulaText(f: Formula) {
  const body = f.tokens.map(({ symbol, count }) => symbol + (count > 1 ? toScript(String(count), SUBSCRIPTS) : '')).join('')
  return body + chargeScript(f.charge)
}
