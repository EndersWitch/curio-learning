// Math input with Caret (see docs/adr/0002-caret-for-math-input.md): the one
// schema, grammars and text form both generators use. Text is how math is
// stored in a page address, written for people to read: "x<-1 or x>=3", "3pi/2".

import { CaretParser, charTokenType, createDocToken, defineSchema, getStrandById, TokensTag, tokenIs, type Doc, type DocStrand, type EditorCommand, type TokenID } from '@caret-js/core'
import {
  comparisonTypingRules,
  docToText,
  evaluate,
  fractionTokenType,
  inequalityParselets,
  isNumberChar,
  KeywordNode,
  LogicNode,
  mathCommands,
  numberParselets,
  parenthesesTokenType,
  piTypingRule,
  radicalTokenType,
  subSupTokenType,
  textToDoc,
} from '@caret-js/math'
import { FunctionNameNode, FunctionNode, functionParselets } from './functions.js'

export const schema = defineSchema({ tokenTypes: new Set([charTokenType, fractionTokenType, parenthesesTokenType, radicalTokenType, subSupTokenType]) })
// "deg" is how to type ° (for a range numbered in degrees, like 0° to 360°).
export const typingRules = [...comparisonTypingRules, piTypingRule, { match: 'deg', char: '°' }]

/** A doc in the one schema every math field uses. */
export type MathDoc = Doc<typeof schema>
type Token = MathDoc['root']['tokens'][number]
/** What a math field holds: a number, an inequality or an equation. */
export type MathKind = keyof typeof parsers

export const parsers = {
  number: new CaretParser(numberParselets()),
  inequality: new CaretParser(inequalityParselets()),
  // A coordinate grid's equations, with functions like sin x and log₂ x (see functions.ts).
  equation: new CaretParser(functionParselets()),
}

// Subscripts, as in log₂ x. Caret draws a subscript but can't type one or
// write one as text, so "_" makes one here, and the text form is "log_2x" or
// "log_{10}x".

let subscriptIds = 0
const subscriptToken = (tokens: Token[]): Token => {
  const token = createDocToken(`sub/${subscriptIds++}`, subSupTokenType, { hasSubscript: true, hasSuperscript: false })
  token.children.set('subscript', { id: [token.id, 'subscript'], tokens })
  return token as Token
}
const charOf = (t: Token | undefined) => (t && tokenIs(t, charTokenType) ? t.props.char : null)

/** Every "_" in a doc read from text, and what follows it (a number, one letter or {…}), as a subscript. */
function liftSubscripts(strand: DocStrand<typeof schema>): DocStrand<typeof schema> {
  const out: Token[] = []
  const tokens = strand.tokens.map((t) => {
    for (const [key, child] of t.children) (t.children as Map<string, DocStrand<typeof schema>>).set(key, liftSubscripts(child))
    return t
  })
  for (let i = 0; i < tokens.length; i++) {
    if (charOf(tokens[i]) !== '_') {
      out.push(tokens[i])
      continue
    }
    let j = i + 1
    let inside: Token[]
    if (charOf(tokens[j]) === '{') {
      const end = tokens.findIndex((t, k) => k > j && charOf(t) === '}')
      if (end < 0) {
        out.push(tokens[i])
        continue
      }
      inside = tokens.slice(j + 1, end)
      j = end + 1
    } else {
      while (j < tokens.length && isNumberChar(charOf(tokens[j]) ?? '')) j++
      if (j === i + 1 && /^\p{L}$/u.test(charOf(tokens[j]) ?? '')) j++
      inside = tokens.slice(i + 1, j)
    }
    out.push(subscriptToken(inside))
    i = j - 1
  }
  return { ...strand, tokens: out }
}

/** A doc with each subscript written out as "_2" or "_{…}" chars, so Caret can write it as text. */
function flattenSubscripts(strand: DocStrand<typeof schema>): DocStrand<typeof schema> {
  const chars = (text: string) => [...text].map((char) => createDocToken(`sub/${subscriptIds++}`, charTokenType, { char }) as Token)
  const out: Token[] = []
  for (const t of strand.tokens) {
    const children = new Map([...t.children].map(([k, s]) => [k, flattenSubscripts(s)]))
    const copy = { ...t, children } as Token
    if (tokenIs(copy, subSupTokenType) && copy.props.hasSubscript) {
      const sub = children.get('subscript' as never) as DocStrand<typeof schema> | undefined
      const plain = sub?.tokens.length && sub.tokens.every((s) => isNumberChar(charOf(s) ?? '') || (sub.tokens.length === 1 && /^\p{L}$/u.test(charOf(s) ?? '')))
      out.push(...chars(plain ? '_' : '_{'), ...(sub?.tokens ?? []), ...(plain ? [] : chars('}')))
      if (copy.props.hasSuperscript) {
        const sup = createDocToken(`sub/${subscriptIds++}`, subSupTokenType, { hasSubscript: false, hasSuperscript: true })
        sup.children.set('superscript', children.get('superscript' as never) as never)
        out.push(sup as Token)
      }
    } else out.push(copy)
  }
  return { ...strand, tokens: out }
}

/** The subscript box the cursor is at the end of, if it holds just a number: where it is in its strand. */
function endOfSubscript(editor: Parameters<EditorCommand<typeof schema>>[0]) {
  const head = editor.head
  if (!head || editor.hasRange || head.index !== head.strand.tokens.length || head.strand.id === '[ROOT]') return null
  const [ownerId, box] = head.strand.id as [TokenID, string]
  if (box !== 'subscript' || !head.strand.tokens.every((t) => isNumberChar(charOf(t) ?? ''))) return null
  const find = (strand: DocStrand<typeof schema>): { strandId: DocStrand<typeof schema>['id']; index: number } | null => {
    const index = strand.tokens.findIndex((t) => t.id === ownerId)
    if (index >= 0) return { strandId: strand.id, index }
    for (const t of strand.tokens) for (const child of t.children.values()) {
      const found = find(child as DocStrand<typeof schema>)
      if (found) return found
    }
    return null
  }
  return find(editor.doc.root)
}

/** "_" makes a subscript and puts the cursor in it: log_2 is log₂. */
const subscriptCommand: EditorCommand<typeof schema> = (editor) => {
  const s = editor.selection
  if (!s) return false
  const at = Math.min(s.anchorIndex, s.headIndex)
  editor.insert([{ type: subSupTokenType.type, props: { hasSubscript: true, hasSuperscript: false }, children: new Map([['subscript', []]]) }] as never)
  const token = getStrandById(editor.doc, s.strandId)?.tokens[at]
  if (token) editor.select({ strandId: [token.id, 'subscript'], tokenIndex: 0 })
  return true
}

/** Typing a letter or "(" at the end of a numbered subscript steps out first: log_2x is log₂ x. */
const afterSubscript =
  (then?: EditorCommand<typeof schema>): EditorCommand<typeof schema> =>
  (editor) => {
    const at = endOfSubscript(editor)
    if (at) editor.select({ strandId: at.strandId, tokenIndex: at.index + 1 })
    return then ? then(editor) : false
  }

const base = mathCommands as Record<string, EditorCommand<typeof schema>>
export const commands: Record<string, EditorCommand<typeof schema>> = {
  ...base,
  _: subscriptCommand,
  '(': afterSubscript(base['(']),
  ...Object.fromEntries([...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ|'].map((c) => [c, afterSubscript(base[c])])),
}

/** Text (typed, pasted or from a link) as a doc: "<=" becomes ≤, "3pi/2" a fraction, "x^2" an exponent, "sqrt(2)" a root, "log_2" a subscript. */
export const fromText = (text: string | null | undefined): MathDoc => {
  const doc = textToDoc(String(text ?? ''), { typingRules, fractions: true })
  return String(text ?? '').includes('_') ? { ...doc, root: liftSubscripts(doc.root) } : doc
}

/** The value of a typed number like "-2.5", "1/3", "3pi/2" or "90°" (° is just a mark), or null. */
export function parseNumber(text: string | null | undefined): number | null {
  const typed = String(text ?? '').replace(/°/g, '')
  if (!typed.trim()) return null
  const v = evaluate(parsers.number.parse(fromText(typed)))
  return v !== null && Number.isFinite(v) ? v : null
}

/** The tokens spelling words in a parsed doc ("all real numbers", or the "or"
 *  joining two inequalities), with where each word starts and ends. */
function keywordTokens(doc: MathDoc, parser: CaretParser<typeof schema>) {
  const out = new Map<TokenID, { start: boolean; end: boolean }>()
  for (const node of parser.parse(doc).traverse()) {
    let words: string[]
    if (node instanceof KeywordNode) words = node.word.split(' ')
    // A LogicNode's own tokens are its connectives, one word after another.
    else if (node instanceof LogicNode) words = Array(node.clauses.length - 1).fill(node.operator)
    else continue
    const tokens = node.getTag<TokensTag<typeof schema>>(TokensTag)?.ownTokens ?? []
    let i = 0
    for (const word of words) {
      tokens.slice(i, i + word.length).forEach((t, k) => out.set(t.id, { start: k === 0, end: k === word.length - 1 }))
      i += word.length
    }
  }
  return out
}

const ASCII = [['≤', '<='], ['≥', '>='], ['≠', '!='], ['π', 'pi']]

/** A doc as text for the address, with words spaced out: "x<-1 or x>=3". */
export function toText(doc: MathDoc, kind: MathKind = 'number'): string {
  const words = kind === 'inequality' ? keywordTokens(doc, parsers.inequality) : new Map<TokenID, { start: boolean; end: boolean }>()
  let text = ''
  for (const token of flattenSubscripts(doc.root).tokens) {
    const w = words.get(token.id)
    if (w?.start) text += ' '
    text += docToText({ root: { id: '[ROOT]', tokens: [token] }, selection: null })
    if (w?.end) text += ' '
  }
  for (const [from, to] of ASCII) text = text.split(from).join(to)
  return text.replace(/\s+/g, ' ').trim()
}

const OPERATORS = new Set([...'+-−×·÷±=<>≤≥≠,('])

/**
 * Classes for spacing in any math field: a comma has room after it, as in
 * (1, 2), and a minus that starts a number (−3, (−1, 2)) sits tight against
 * it instead of being spaced out like the minus in 5 − 3.
 */
function punctuation(doc: MathDoc): Map<TokenID, string> {
  const classes = new Map<TokenID, string>()
  const walk = (tokens: Token[]) => {
    let prev: Token | undefined
    for (const t of tokens) {
      const c = charOf(t)
      if (c === ',') classes.set(t.id, 'caret-comma')
      else if ((c === '-' || c === '−') && (!prev || OPERATORS.has(charOf(prev) ?? ''))) classes.set(t.id, 'caret-unary')
      for (const child of t.children.values()) walk((child as DocStrand<typeof schema>).tokens)
      prev = t
    }
  }
  walk(doc.root.tokens)
  return classes
}

/** The math field's classes for what it holds: spacing, plus words (inequalities) or function names (equations). */
export function classifyFor(kind: MathKind): (doc: MathDoc) => Map<TokenID, string> {
  return (doc) => new Map([...punctuation(doc), ...(kind === 'inequality' ? classify(doc) : kind === 'equation' ? classifyFunctions(doc) : [])])
}

/** Classes for the math field: keywords like "or" set as words, not variables. */
export function classify(doc: MathDoc): Map<TokenID, string> {
  const classes = new Map<TokenID, string>()
  for (const [id, { start, end }] of keywordTokens(doc, parsers.inequality)) {
    classes.set(id, ['caret-word', start && 'caret-word-start', end && 'caret-word-end'].filter(Boolean).join(' '))
  }
  return classes
}

/** Classes for an equation field: function names like sin set upright, as one word. */
export function classifyFunctions(doc: MathDoc): Map<TokenID, string> {
  const classes = new Map<TokenID, string>()
  let tree
  try {
    tree = parsers.equation.parse(doc)
  } catch {
    return classes
  }
  for (const node of tree.traverse()) {
    if (!(node instanceof FunctionNameNode || node instanceof FunctionNode)) continue
    node._tokens.forEach((t, k) => classes.set(t.id, k === node._tokens.length - 1 ? 'caret-fn caret-fn-end' : 'caret-fn'))
  }
  return classes
}
