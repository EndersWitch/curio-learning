// Labels on figures (m₁, F_N, 30°, θ), typed in Caret's math field (see
// docs/adr/0003-caret-for-labels.md). A label's text is kept the way it is
// written in a page address, for people to read: "m_1", "F_N", "30deg",
// "theta", "mu_k". A subscript is _x or _{0x}, a superscript ^2 or ^{-1}.
// A vector is written the LaTeX way: \vec{F}_g has an arrow over the F, and
// \mathbf{F}_g a bold F.

import { charTokenType, createDocToken, defineSchema, defineTokenType, getStrandById, templateFromTokens, traverseStrands } from '@caret-js/core'
import type { Doc, DocStrand, EditorCommand } from '@caret-js/core'
import { subSupTokenType } from '@caret-js/math'

export type LabelMode = 'text' | 'blank' | 'none'

/** A label as the teacher set it. `text` is kept while the label is blank or
 *  off, so switching back to Text brings it back. */
export interface Label {
  mode: LabelMode
  text: string
}

/** Written the same way in a page address and as you type: "theta" becomes θ. */
const SYMBOLS: [string, string][] = [
  ['alpha', 'α'],
  ['beta', 'β'],
  ['gamma', 'γ'],
  ['Delta', 'Δ'],
  ['delta', 'δ'],
  ['epsilon', 'ε'],
  ['theta', 'θ'],
  ['lambda', 'λ'],
  ['mu', 'μ'],
  ['pi', 'π'],
  ['rho', 'ρ'],
  ['sigma', 'σ'],
  ['tau', 'τ'],
  ['phi', 'φ'],
  ['omega', 'ω'],
  // Either types Ω; an address writes it Omega (the last name for a symbol wins).
  ['ohm', 'Ω'],
  ['Omega', 'Ω'],
  ['deg', '°'],
]
const NAME_OF = new Map(SYMBOLS.map(([name, char]) => [char, name]))

export const typingRules = SYMBOLS.map(([match, char]) => ({ match, char }))

/** Caret's field drops typed spaces (spacing is its renderer's job), so inside
 *  the field a space is this blank Braille character, which it keeps. */
export const FIELD_SPACE = String.fromCodePoint(0x2800)

/** Text typed key by key, with symbol names turned into symbols: "30deg" → "30°". */
export function typeLabel(text: string): string {
  let out = ''
  for (const char of text) {
    out += char
    const rule = typingRules.find((r) => out.endsWith(r.match))
    if (rule) out = out.slice(0, -rule.match.length) + rule.char
  }
  return out
}

/** How a vector is set: an arrow over it, or bold. */
export type VectorStyle = 'arrow' | 'bold'

/** The LaTeX command for each, written before its braces: \vec{F}. */
const COMMANDS: Record<VectorStyle, string> = { arrow: '\\vec', bold: '\\mathbf' }
const OPENINGS = (Object.entries(COMMANDS) as [VectorStyle, string][]).map(([style, command]) => ({ style, chars: [...`${command}{`] }))

/** The vector whose command and opening brace start at chars[i], if one does. */
const vectorAt = (chars: string[], i: number) => OPENINGS.find((o) => o.chars.every((c, k) => chars[i + k] === c))

// A label read into parts: plain characters, subscripts or superscripts, and vectors.
type Part = { char: string } | { sub: Part[] | null; sup: Part[] | null } | { vector: VectorStyle; body: Part[] }

function parse(text: string): Part[] {
  const chars = [...text]
  let i = 0
  const readStrand = (close: string | null): Part[] => {
    const parts: Part[] = []
    let typed = '' // this strand's plain characters so far, for the typing rules
    while (i < chars.length) {
      const vector = vectorAt(chars, i)
      if (vector) {
        i += vector.chars.length
        parts.push({ vector: vector.style, body: readStrand('}') })
        typed = ''
        continue
      }
      const char = chars[i++]
      if (char === close) break
      if (char === '_' || char === '^') {
        const box = chars[i] === '{' ? (i++, readStrand('}')) : i < chars.length ? [{ char: chars[i++] }] : []
        const last = parts.at(-1)
        const key = char === '_' ? 'sub' : 'sup'
        // A raised o is how a degree sign is often faked: 30^o is 30°.
        if (key === 'sup' && box.length === 1 && 'char' in box[0] && box[0].char === 'o') {
          parts.push({ char: '°' })
          typed = ''
          continue
        }
        if (last && 'sub' in last && last[key] === null) last[key] = box
        else parts.push({ sub: key === 'sub' ? box : null, sup: key === 'sup' ? box : null })
        typed = ''
        continue
      }
      parts.push({ char: char === FIELD_SPACE ? ' ' : char })
      typed += char
      const rule = typingRules.find((r) => typed.endsWith(r.match))
      if (rule) {
        parts.splice(parts.length - [...rule.match].length, [...rule.match].length, { char: rule.char })
        typed = typed.slice(0, -rule.match.length) + rule.char
      }
    }
    return parts
  }
  return readStrand(null)
}

/** A vector in the math field: a box whose letters have an arrow over them or are set in bold. */
export const vectorTokenType = defineTokenType('label/vector', { childKeys: ['body'] })

export const schema = defineSchema({ tokenTypes: new Set([charTokenType, subSupTokenType, vectorTokenType]) })
type LabelDoc = Doc<typeof schema>

/** A label's text as a Caret doc, for the math field. */
export function labelFromText(text: string): LabelDoc {
  let counter = 0
  const nextId = () => `text/${counter++}` as const
  const toTokens = (parts: Part[]): any[] =>
    parts.map((part) => {
      if ('char' in part) return createDocToken(nextId(), charTokenType, { char: part.char === ' ' ? FIELD_SPACE : part.char })
      if ('vector' in part) {
        const token = createDocToken(nextId(), vectorTokenType, { style: part.vector })
        token.children.set('body', { id: [token.id, 'body'], tokens: toTokens(part.body) })
        return token
      }
      const token = createDocToken(nextId(), subSupTokenType, { hasSubscript: part.sub !== null, hasSuperscript: part.sup !== null })
      if (part.sub) token.children.set('subscript', { id: [token.id, 'subscript'], tokens: toTokens(part.sub) })
      if (part.sup) token.children.set('superscript', { id: [token.id, 'superscript'], tokens: toTokens(part.sup) })
      return token
    })
  return { root: { id: '[ROOT]', tokens: toTokens(parse(String(text ?? ''))) }, selection: null } as LabelDoc
}

function strandText(strand: DocStrand<any> | undefined): string {
  let text = ''
  for (const token of (strand?.tokens ?? []) as any[]) {
    if (token.type === charTokenType.type) {
      const char: string = token.props.char
      text += char === FIELD_SPACE ? ' ' : (NAME_OF.get(char) ?? char)
    } else if (token.type === subSupTokenType.type) {
      const box = (name: string) => {
        const inner = strandText(token.children.get(name))
        return [...inner].length === 1 ? inner : `{${inner}}`
      }
      if (token.props.hasSubscript) text += `_${box('subscript')}`
      if (token.props.hasSuperscript) text += `^${box('superscript')}`
    } else if (token.type === vectorTokenType.type) {
      text += `${COMMANDS[token.props.style as VectorStyle]}{${strandText(token.children.get('body'))}}`
    }
  }
  return text
}

/** A Caret doc as a label's text: "m_1", "30deg". */
export const labelToText = (doc: Doc<any>): string => strandText(doc.root)

export interface Run {
  text: string
  shift: 'sub' | 'super' | null
  /** Part of a vector: under an arrow, or bold. */
  vector?: VectorStyle
  /** Which vector, counting from 0, so two side by side get an arrow each. */
  group?: number
}

/** A label as runs of text to draw, each on the baseline, lowered or raised. */
export function labelRuns(text: string): Run[] {
  const runs: Run[] = []
  let vectors = 0
  type InVector = { vector: VectorStyle; group: number } | undefined
  const add = (t: string, shift: Run['shift'], inVector: InVector) => {
    const last = runs.at(-1)
    if (last && last.shift === shift && last.group === inVector?.group) last.text += t
    else if (t) runs.push({ text: t, shift, ...inVector })
  }
  const walk = (parts: Part[], shift: Run['shift'], inVector: InVector) => {
    for (const part of parts) {
      if ('char' in part) add(part.char, shift, inVector)
      else if ('vector' in part) walk(part.body, shift, inVector ?? { vector: part.vector, group: vectors++ })
      else {
        if (part.sub) walk(part.sub, shift ?? 'sub', inVector)
        if (part.sup) walk(part.sup, shift ?? 'super', inVector)
      }
    }
  }
  walk(parse(text), null, undefined)
  return runs
}

/**
 * A label's text without its vector commands, so it's as long as what's drawn:
 * \vec{F}_g → F_g. Braces pair up the way the label is read, where a brace
 * opens only after _, ^ or a command.
 */
export function withoutVectors(text: string): string {
  const chars = [...text]
  const open: boolean[] = [] // the braces open here, true for a vector's
  let out = ''
  for (let i = 0; i < chars.length; ) {
    const vector = vectorAt(chars, i)
    if (vector) {
      open.push(true)
      i += vector.chars.length
    } else if ((chars[i] === '_' || chars[i] === '^') && chars[i + 1] === '{') {
      open.push(false)
      out += chars[i++] + chars[i++]
    } else if (chars[i] === '}' && open.length) {
      if (!open.pop()) out += '}'
      i++
    } else out += chars[i++]
  }
  return out
}

/**
 * A label written as a vector, for a figure that sets every vector one way:
 * F_g → \vec{F}_g, T → \vec{T}. The letters it starts with are the vector. A
 * label already written with a vector, or that doesn't start with a letter
 * (5 N), stays as it is.
 */
export function asVector(label: Label, style: VectorStyle | 'none'): Label {
  if (style === 'none' || label.mode !== 'text' || OPENINGS.some((o) => label.text.includes(o.chars.join('')))) return label
  const letters = /^\p{L}+/u.exec(label.text)?.[0]
  return letters ? { ...label, text: `${COMMANDS[style]}{${letters}}${label.text.slice(letters.length)}` } : label
}

const TALL = /[A-Z0-9bdfhiklt\u0391-\u03A9βδζθλξ]/
const DESCENDS = /[gjpqyβγζημξρφχψ]/

/**
 * How far below the middle of a label's ink, at font size `size`, its
 * baseline goes, to center the label on a point (inside an object). A capital
 * reaches up from the baseline, but a lowercase m doesn't, and a subscript
 * hangs below it, so "m_1" sits higher than "F" would. A blank or missing
 * label takes the offset a capital would.
 */
export function baselineBelowMiddle(label: Label, size: number): number {
  if (label.mode !== 'text' || !label.text.trim()) return size * 0.35
  // Above and below the baseline, as FigureLabel sets subscripts (0.7 the size, 0.3 down) and superscripts (0.45 up).
  let top = 0
  let bottom = 0
  for (const run of labelRuns(label.text)) {
    const em = run.shift ? size * 0.7 : size
    const down = run.shift === 'sub' ? size * 0.3 : run.shift === 'super' ? -size * 0.45 : 0
    top = Math.max(top, (TALL.test(run.text) ? 0.68 : 0.46) * em - down)
    bottom = Math.max(bottom, (DESCENDS.test(run.text) ? 0.22 : 0) * em + down)
  }
  return (top - bottom) / 2
}

/** Unit words set upright even though they're short. */
const UNITS = new Set(['kg', 'cm', 'mm', 'km', 'ms', 'Hz', 'kJ', 'kW', 'kN', 'eV', 'mA', 'mV', 'kV', 'Pa', 'Wb', 'mol', 'rad', 'kPa', 'Ω', 'kΩ', 'MΩ'])

/**
 * A run of label text split into pieces to set in italics or upright, the way
 * physics sets quantities in italics (m, v, F, θ, mg) and words and units
 * upright (kg, cm, "block"). A short word after a number and a space is a
 * unit too: 12 V, 2 A, 5 N, and so is one after a degree sign: 30 °C.
 */
export function italicPieces(text: string): { text: string; italic: boolean }[] {
  const pieces = text.match(/\p{L}+|[^\p{L}]+/gu) ?? []
  return pieces.map((t, i) => ({
    text: t,
    italic: /^\p{L}{1,2}$/u.test(t) && !UNITS.has(t) && !/\d\s+$|°$/.test(pieces[i - 1] ?? ''),
  }))
}

/** A label in a page address: its text, "~" for a blank line, empty for none,
 *  and "~_" for Text with nothing typed yet. */
export function encodeLabel(label: Label): string {
  if (label.mode === 'none') return ''
  if (label.mode === 'blank') return '~'
  if (label.text === '') return EMPTY_TEXT
  return label.text.startsWith('~') ? `~${label.text}` : label.text
}

const EMPTY_TEXT = '~_'

export function decodeLabel(raw: string | null | undefined, fallback: Label): Label {
  if (raw === null || raw === undefined) return { ...fallback }
  if (raw === '') return { mode: 'none', text: fallback.text }
  if (raw === '~') return { mode: 'blank', text: fallback.text }
  if (raw === EMPTY_TEXT) return { mode: 'text', text: '' }
  return { mode: 'text', text: raw.startsWith('~~') ? raw.slice(1) : raw }
}

/** Tidy a stored or linked label into a usable one. */
export function cleanLabel(value: unknown, fallback: Label): Label {
  const v = value as Partial<Label> | null
  const mode = v?.mode === 'text' || v?.mode === 'blank' || v?.mode === 'none' ? v.mode : fallback.mode
  return { mode, text: typeof v?.text === 'string' ? v.text : fallback.text }
}

// Editing commands for the field.

/** The strand holding the box the cursor is in, and where its token sits. */
function owner(editor: Parameters<EditorCommand<any>>[0]) {
  const s = editor.selection
  if (!s || !Array.isArray(s.strandId)) return null
  const [tokenId] = s.strandId
  for (const strand of traverseStrands(editor.doc.root)) {
    const index = strand.tokens.findIndex((t) => t.id === tokenId)
    if (index >= 0) return { strand, index }
  }
  return null
}

type Box = 'subscript' | 'superscript'

/** A subscript or superscript after the cursor, with the cursor in it: "_"
 *  makes F_N, F with N below. With text selected, the box goes around it. */
function makeBox(editor: Parameters<EditorCommand<any>>[0], box: Box): boolean {
  const s = editor.selection
  if (!s) return false
  const at = Math.min(s.anchorIndex, s.headIndex)
  const inside = editor.hasRange ? templateFromTokens(editor.selectedTokens) : []
  editor.insert([{ type: subSupTokenType.type, props: { hasSubscript: box === 'subscript', hasSuperscript: box === 'superscript' }, children: new Map([[box, inside]]) }])
  const strand = getStrandById(editor.doc, s.strandId)
  if (!strand) return true
  editor.select(inside.length ? { strandId: s.strandId, tokenIndex: at + 1 } : { strandId: [strand.tokens[at].id, box], tokenIndex: 0 })
  return true
}

/** Google Docs' shortcuts, Ctrl+. for a superscript and Ctrl+, for a
 *  subscript. The field is sent them as these characters (see LabelInput). */
export const SHORTCUTS: Record<Box, string> = { superscript: '\uE000', subscript: '\uE001' }

/** A shortcut switches its box on and off the way Google Docs does: inside a
 *  superscript, Ctrl+. steps out of it; inside a subscript, it steps out and
 *  starts a superscript. */
const toggleBox =
  (box: Box): EditorCommand<any> =>
  (editor) => {
    const head = editor.head
    if (!head) return false
    const o = editor.hasRange ? null : owner(editor)
    if (o) {
      editor.select({ strandId: o.strand.id, tokenIndex: o.index + 1 })
      if ((head.strand.id as [string, string])[1] === box) return true
    }
    // A raised o just became °, so the Ctrl+. that ends it has nothing left to do.
    const before = editor.head?.before as any
    if (!editor.hasRange && box === 'superscript' && before?.props?.char === '°') return true
    return makeBox(editor, box)
  }

/** An "o" typed into an empty superscript is a degree sign instead: 30^o is 30°. */
const degreeCommand: EditorCommand<any> = (editor) => {
  const head = editor.head
  if (!head || editor.hasRange || head.strand.tokens.length > 0 || !Array.isArray(head.strand.id) || head.strand.id[1] !== 'superscript') return false
  const o = owner(editor)
  if (!o || (o.strand.tokens[o.index] as any).props.hasSubscript) return false
  editor.select({ strandId: o.strand.id, anchorIndex: o.index, headIndex: o.index + 1 })
  editor.insert([{ type: charTokenType.type, props: { char: '°' }, children: new Map() }])
  return true
}

/** A space typed at the end of a subscript or superscript steps out of it and
 *  is then typed there, so "F_N = 3" reads the way it's typed. */
const spaceCommand: EditorCommand<any> = (editor) => {
  const head = editor.head
  if (!head || editor.hasRange || head.index === 0 || head.index !== head.strand.tokens.length) return false
  const o = owner(editor)
  if (!o) return false
  editor.select({ strandId: o.strand.id, tokenIndex: o.index + 1 })
  return false
}

/**
 * Braces typed or pasted the way they're written in the text: the "{" of
 * \vec{ or \mathbf{ turns the command before it into a vector with the cursor
 * in it, and a "{" starting an empty subscript or superscript is already the
 * box it opens. Elsewhere "{" is typed as it is.
 */
const openBraceCommand: EditorCommand<any> = (editor) => {
  const head = editor.head
  if (!head || editor.hasRange) return false
  const before = head.strand.tokens.slice(0, head.index).map((t: any) => t.props?.char ?? '')
  const vector = OPENINGS.find((o) => o.chars.slice(0, -1).every((c, k, cs) => before[before.length - cs.length + k] === c))
  if (!vector) return head.strand.tokens.length === 0 && Array.isArray(head.strand.id) && head.strand.id[1] !== 'body'
  const start = head.index - (vector.chars.length - 1)
  editor.select({ strandId: head.strand.id, anchorIndex: start, headIndex: head.index })
  editor.insert([{ type: vectorTokenType.type, props: { style: vector.style }, children: new Map([['body', []]]) }])
  const strand = getStrandById(editor.doc, head.strand.id)
  if (strand) editor.select({ strandId: [strand.tokens[start].id, 'body'], tokenIndex: 0 })
  return true
}

/** "}" steps out of the vector, subscript or superscript the cursor is in, so \vec{F}_{g} types as it reads. */
const closeBraceCommand: EditorCommand<any> = (editor) => {
  const o = editor.hasRange ? null : owner(editor)
  if (!o) return false
  editor.select({ strandId: o.strand.id, tokenIndex: o.index + 1 })
  return true
}

export const commands: Record<string, EditorCommand<any>> = {
  '^': (editor) => makeBox(editor, 'superscript'),
  _: (editor) => makeBox(editor, 'subscript'),
  '{': openBraceCommand,
  '}': closeBraceCommand,
  o: degreeCommand,
  [SHORTCUTS.superscript]: toggleBox('superscript'),
  [SHORTCUTS.subscript]: toggleBox('subscript'),
  [FIELD_SPACE]: spaceCommand,
}

/** A component's label from its vector's: T → T_x, F_g → F_{gx}, F_{air} → F_{airx}. */
export function componentLabel(text: string, axis: 'x' | 'y'): string {
  const braced = /^(.*)_\{(.*)\}$/.exec(text)
  if (braced) return `${braced[1]}_{${braced[2]}${axis}}`
  const single = /^(.*)_(.)$/u.exec(text)
  if (single) return `${single[1]}_{${single[2]}${axis}}`
  return text ? `${text}_${axis}` : ''
}
