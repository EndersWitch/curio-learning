// Reading what a teacher types, with Caret (see docs/adr/0002-caret-for-math-input.md):
// an inequality becomes the set of numbers it's true for, as a list of intervals,
// points like "3" or "−1, 2.5" become that set too (one closed dot each), a
// sequence like "aₙ = 1/n" becomes its rule, and a range value like "3π/2"
// becomes a number. Runs on the server too.

import type { TreeNode } from '@caret-js/core'
import { CommaListNode, ComparisonNode, KeywordNode, LogicNode, ParenthesesChildTag, VariableNode, evaluate } from '@caret-js/math'
import { fromText, parsers } from '$lib/shared/math.js'

export { parseNumber } from '$lib/shared/math.js'

/**
 * An interval runs from `lo` to `hi`. Each end is { v, closed }, where v can be
 * ±Infinity (never closed). A single number is an interval with lo.v === hi.v.
 */
export type Interval = { lo: End; hi: End }
export type End = { v: number; closed: boolean }

const EPS = 1e-9
const same = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const ALL: Interval[] = [{ lo: { v: -Infinity, closed: false }, hi: { v: Infinity, closed: false } }]

const isEmpty = ({ lo, hi }: Interval) => lo.v > hi.v || (same(lo.v, hi.v) && !(lo.closed && hi.closed))

/** Numbers in both sets. */
export function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = []
  for (const p of a) {
    for (const q of b) {
      const lo = same(p.lo.v, q.lo.v) ? { v: p.lo.v, closed: p.lo.closed && q.lo.closed } : p.lo.v > q.lo.v ? p.lo : q.lo
      const hi = same(p.hi.v, q.hi.v) ? { v: p.hi.v, closed: p.hi.closed && q.hi.closed } : p.hi.v < q.hi.v ? p.hi : q.hi
      if (!isEmpty({ lo, hi })) out.push({ lo, hi })
    }
  }
  return union(out, [])
}

/** Numbers in either set, as few intervals as possible, left to right. */
export function union(a: Interval[], b: Interval[]): Interval[] {
  const sorted = [...a, ...b].filter((i) => !isEmpty(i)).sort((p, q) => p.lo.v - q.lo.v || (q.lo.closed ? 1 : -1))
  const out: Interval[] = []
  for (const i of sorted) {
    const last = out.at(-1)
    const touches = last && (i.lo.v < last.hi.v || (same(i.lo.v, last.hi.v) && (i.lo.closed || last.hi.closed)))
    if (!touches) out.push({ lo: { ...i.lo }, hi: { ...i.hi } })
    else if (same(i.hi.v, last!.hi.v)) last!.hi.closed ||= i.hi.closed
    else if (i.hi.v > last!.hi.v) last!.hi = { ...i.hi }
  }
  return out
}

/** The numbers where `variable <op> value` is true. */
function solve(op: Comparator, value: number): Interval[] {
  const at = (closed: boolean): End => ({ v: value, closed })
  const below = (closed: boolean): Interval[] => [{ lo: { v: -Infinity, closed: false }, hi: at(closed) }]
  const above = (closed: boolean): Interval[] => [{ lo: at(closed), hi: { v: Infinity, closed: false } }]
  switch (op) {
    case '<': return below(false)
    case '≤': return below(true)
    case '>': return above(false)
    case '≥': return above(true)
    case '=': return [{ lo: at(true), hi: at(true) }]
    case '≠': return union(below(false), above(false))
  }
}
type Comparator = ComparisonNode['operators'][number]
const FLIP: Record<Comparator, Comparator> = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=', '≠': '≠' }

class ReadError extends Error {}

function setOf(node: TreeNode, vars: Set<string>): Interval[] {
  if (node instanceof KeywordNode) {
    if (node.word === 'all real numbers') return ALL
    if (node.word === 'no solution') return []
  }
  if (node instanceof LogicNode) {
    const sets = node.clauses.map((c) => setOf(c, vars))
    return sets.reduce((a, b) => (node.operator === 'and' ? intersect(a, b) : union(a, b)))
  }
  if (node instanceof ComparisonNode) {
    // Each neighboring pair in a chain is one comparison: -2 < x ≤ 5 is -2 < x and x ≤ 5.
    let set = ALL
    for (let k = 0; k < node.operators.length; k++) {
      const [left, right] = [node.operands[k], node.operands[k + 1]]
      const op = node.operators[k]
      let pair: Interval[]
      if (left instanceof VariableNode && !(right instanceof VariableNode)) pair = solve(op, number(right))
      else if (right instanceof VariableNode && !(left instanceof VariableNode)) pair = solve(FLIP[op], number(left))
      else throw new ReadError('Put the letter on one side and a number on the other, like x < 3.')
      vars.add((left instanceof VariableNode ? left : (right as VariableNode)).name)
      set = intersect(set, pair)
    }
    return set
  }
  throw new ReadError('Try an equation like −2 < x ≤ 5 or x < −1 or x ≥ 3, or points like 3 or −1, 2.5.')
}

function number(node: TreeNode): number {
  const v = evaluate(node)
  if (v === null || !Number.isFinite(v)) throw new ReadError('Each side of an equation needs a number, like x < 3 or x ≥ 3π/2.')
  return v
}

/** Points typed as numbers, like 3 or −1, 2.5, π/2, as their values; null when it isn't a list of numbers. */
function pointsOf(text: string): number[] | null {
  const node = parsers.equation.parse(fromText(text))
  if (node instanceof CommaListNode && node.hasTag(ParenthesesChildTag)) {
    throw new ReadError('A point on a number line is one number, like 3 or −1/2. For more than one: 3, −1, 5/2.')
  }
  const values = (node instanceof CommaListNode ? node.expressions : [node]).map((n) => evaluate(n))
  return values.every((v) => v !== null && Number.isFinite(v)) ? (values as number[]) : null
}

/**
 * Read an inequality, or points. Blank text is a blank number line (set: null).
 * Points also come back as `values`, in the order they were typed, which is
 * the order their point names go to them.
 */
export function parseInequality(text: string): {
  set: Interval[] | null
  variable: string | null
  points: boolean
  values: number[] | null
  error: string | null
} {
  const none = { set: null, variable: null, points: false, values: null }
  if (!String(text ?? '').trim()) return { ...none, error: null }
  const vars = new Set<string>()
  try {
    const points = pointsOf(text)
    if (points) return { set: union(points.map((v) => ({ lo: { v, closed: true }, hi: { v, closed: true } })), []), variable: null, points: true, values: points, error: null }
    const set = setOf(parsers.inequality.parse(fromText(text)), vars)
    if (vars.size > 1) return { ...none, error: `Use one letter throughout, not ${[...vars].join(' and ')}.` }
    return { set, variable: [...vars][0] ?? null, points: false, values: null, error: null }
  } catch (e) {
    if (e instanceof ReadError) return { ...none, error: e.message }
    throw e
  }
}

// The "aₙ =" a sequence's rule may start with, in any letter: aₙ, a_n, a_{n} or a(n).
const SEQUENCE_NAME = /^\s*[a-zA-Z]\s*(?:ₙ|_\s*n|_\s*\{\s*n\s*\}|_\s*\(\s*n\s*\)|\(\s*n\s*\))\s*=\s*/
// Just the aₙ, before the rest is typed.
const SEQUENCE_ALONE = /^\s*[a-zA-Z]\s*(?:ₙ|_\s*n|_\s*\{\s*n\s*\}|_\s*\(\s*n\s*\))\s*$/

/**
 * Read a sequence: a rule in n, such as "aₙ = 1/n", "uₙ = 2n + 1" or just "1/n",
 * as the function giving its nth term (null where the rule has no value, like
 * 1/n at n = 0). Anything that isn't a sequence, such as an inequality in n or a
 * list of numbers, gives null, so it can be read as an equation or points instead.
 */
export function parseSequence(text: string): { term: (n: number) => number | null; error: null } | { term: null; error: string } | null {
  if (SEQUENCE_ALONE.test(text)) return { term: null, error: 'Add = and the rule in n, like aₙ = 1/n.' }
  const named = SEQUENCE_NAME.test(text)
  const rule = String(text ?? '').replace(SEQUENCE_NAME, '')
  if (!rule.trim()) return named ? { term: null, error: 'Write the rule after the = sign, like aₙ = 1/n.' } : null
  if (named && /ₙ|_/.test(rule)) {
    return { term: null, error: 'Rules built from earlier terms, like aₙ = aₙ₋₁ + 3, aren’t here yet. Write the rule in n, like aₙ = 3n + 1.' }
  }
  const node = parsers.equation.parse(fromText(rule))
  if (node instanceof ComparisonNode || node instanceof CommaListNode) return named ? { term: null, error: 'Write one rule in n after the = sign, like aₙ = 1/n.' } : null
  const letters = new Set<string>()
  for (const n of node.traverse()) if (n instanceof VariableNode) letters.add(n.name)
  const other = [...letters].find((l) => l !== 'n')
  if (other) return named ? { term: null, error: `Write the rule in n, not ${other}, like aₙ = 1/n.` } : null
  if (!named && !letters.size) return null // just numbers: points
  const term = (n: number) => {
    const v = evaluate(node, { n })
    return v !== null && Number.isFinite(v) ? v : null
  }
  // A rule that can't be worked out anywhere isn't math Caret could read.
  if ([1, 2, 3, 0.5].every((n) => term(n) === null)) return named ? { term: null, error: 'Try a rule in n, like aₙ = 1/n or aₙ = 2n + 1.' } : null
  return { term, error: null }
}
