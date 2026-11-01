// The cross typed in Caret's math field, the way Physics Figures types its
// labels (see its docs/adr/0003-caret-for-labels.md), so Cᴿ and R₁ look raised
// and lowered as they're typed. The field's text is the cross as the page
// address keeps it: "C^R C^W × C^R C^W", "R_1 R_2 × R_1 R_2". A superscript is
// ^x or ^{xy}, a subscript _x or _{xy}.

import { charTokenType, createDocToken, defineSchema, getStrandById, templateFromTokens, traverseStrands } from '@caret-js/core'
import type { Doc, DocStrand, EditorCommand } from '@caret-js/core'
import { subSupTokenType } from '@caret-js/math'

/** Caret's field drops typed spaces, so inside the field a space is this
 *  blank Braille character, which it keeps. */
export const FIELD_SPACE = String.fromCodePoint(0x2800)

/** A * is the × between the parents. */
export const typingRules = [{ match: '*', char: '×' }]

// The cross read into parts: plain characters, and subscripts or superscripts.
type Part = { char: string } | { sub: Part[] | null; sup: Part[] | null }

function parse(text: string): Part[] {
  const chars = [...text]
  let i = 0
  const readStrand = (close: string | null): Part[] => {
    const parts: Part[] = []
    while (i < chars.length) {
      const char = chars[i++]
      if (char === close) break
      if (char === '_' || char === '^') {
        const box = chars[i] === '{' ? (i++, readStrand('}')) : i < chars.length ? [{ char: chars[i++] }] : []
        const last = parts.at(-1)
        const key = char === '_' ? 'sub' : 'sup'
        if (last && 'sub' in last && last[key] === null) last[key] = box
        else parts.push({ sub: key === 'sub' ? box : null, sup: key === 'sup' ? box : null })
        continue
      }
      parts.push({ char: char === FIELD_SPACE ? ' ' : char })
    }
    return parts
  }
  return readStrand(null)
}

export const schema = defineSchema({ tokenTypes: new Set([charTokenType, subSupTokenType]) })
type CrossDoc = Doc<typeof schema>

/** The cross's text as a Caret doc, for the field. */
export function crossFromText(text: string): CrossDoc {
  let counter = 0
  const nextId = () => `text/${counter++}` as const
  const toTokens = (parts: Part[]): any[] =>
    parts.map((part) => {
      if ('char' in part) return createDocToken(nextId(), charTokenType, { char: part.char === ' ' ? FIELD_SPACE : part.char })
      const token = createDocToken(nextId(), subSupTokenType, { hasSubscript: part.sub !== null, hasSuperscript: part.sup !== null })
      if (part.sub) token.children.set('subscript', { id: [token.id, 'subscript'], tokens: toTokens(part.sub) })
      if (part.sup) token.children.set('superscript', { id: [token.id, 'superscript'], tokens: toTokens(part.sup) })
      return token
    })
  return { root: { id: '[ROOT]', tokens: toTokens(parse(String(text ?? ''))) }, selection: null } as CrossDoc
}

function strandText(strand: DocStrand<any> | undefined): string {
  let text = ''
  for (const token of (strand?.tokens ?? []) as any[]) {
    if (token.type === charTokenType.type) {
      text += token.props.char === FIELD_SPACE ? ' ' : token.props.char
    } else if (token.type === subSupTokenType.type) {
      const box = (name: string) => {
        const inner = strandText(token.children.get(name))
        return [...inner].length === 1 ? inner : `{${inner}}`
      }
      if (token.props.hasSubscript) text += `_${box('subscript')}`
      if (token.props.hasSuperscript) text += `^${box('superscript')}`
    }
  }
  return text
}

/** A Caret doc as the cross's text: "C^R C^W × C^R C^W". */
export const crossToText = (doc: Doc<any>): string => strandText(doc.root)

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

/** A subscript or superscript after the cursor, with the cursor in it: "^"
 *  makes C^R, C with R raised. With text selected, the box goes around it. */
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
 *  subscript. The field is sent them as these characters (see CrossInput). */
export const SHORTCUTS: Record<Box, string> = { superscript: '', subscript: '' }

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
    return makeBox(editor, box)
  }

/** A space or × typed at the end of a subscript or superscript steps out of
 *  it and is then typed there, so "C^R C^W" reads the way it's typed. */
const stepOut: EditorCommand<any> = (editor) => {
  const head = editor.head
  if (!head || editor.hasRange || head.index === 0 || head.index !== head.strand.tokens.length) return false
  const o = owner(editor)
  if (!o) return false
  editor.select({ strandId: o.strand.id, tokenIndex: o.index + 1 })
  return false
}

export const commands: Record<string, EditorCommand<any>> = {
  '^': (editor) => makeBox(editor, 'superscript'),
  _: (editor) => makeBox(editor, 'subscript'),
  [SHORTCUTS.superscript]: toggleBox('superscript'),
  [SHORTCUTS.subscript]: toggleBox('subscript'),
  [FIELD_SPACE]: stepOut,
  '×': stepOut,
  '*': stepOut,
}
