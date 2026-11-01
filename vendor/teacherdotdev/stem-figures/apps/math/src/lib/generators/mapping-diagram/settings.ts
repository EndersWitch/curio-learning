// Every choice the teacher makes for a mapping diagram, with its default. The
// page address carries any non-default values so a diagram can be bookmarked
// or shared.
//
// The inputs and outputs are kept as the text the teacher typed or pasted
// ("1, 2, 3" or one per line), and each arrow as the input and output it
// joins, by what they say ("2" to "4"), so reordering a list keeps its arrows.
// readMapping() works out what they mean, and whether it's a function.

import { cleanLabelSize, type LabelSize } from '$shared/labelSize'
import { parseNumber } from '$lib/shared/math.js'

export const TITLE_MODES = ['text', 'blank', 'none'] as const // written title, write-on line for students, nothing
export const SHAPES = { oval: 'Ovals', box: 'Boxes', none: 'None' }
export const INK = '#111827'
/** Joins an arrow's input and output in the page address: arrow=2→4. */
const JOIN = '→'

export type TitleMode = (typeof TITLE_MODES)[number]
export type Shape = keyof typeof SHAPES
/** An arrow from one input to one output, by what each says. */
export type Arrow = { from: string; to: string }

export type Settings = {
  inputs: string
  outputs: string
  arrows: Arrow[]
  inputTitle: string
  inputTitleMode: TitleMode
  outputTitle: string
  outputTitleMode: TitleMode
  title: string
  titleMode: TitleMode
  shape: Shape
  labelSize: LabelSize
}
/** Settings as they may arrive: from a form, a link, or a preset stored by an older version. */
export type RawSettings = Record<string, any>

export const DEFAULT_SETTINGS: Settings = {
  inputs: '',
  outputs: '',
  arrows: [],
  inputTitle: 'Input', // over the left side
  inputTitleMode: 'text',
  outputTitle: 'Output', // over the right side
  outputTitleMode: 'text',
  title: '',
  titleMode: 'none',
  shape: 'oval', // what each side's list is drawn in
  labelSize: 'medium', // how big the items and titles are (see labelSize.ts)
}

/** Settings that describe the figure itself, which is what a preset saves. */
export const FIGURE_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

const text = (v: unknown, fallback: string) => (v === undefined || v === null ? fallback : String(v))
const oneOf = <T>(list: readonly T[], v: any, fallback: T): T => (list.includes(v) ? v : fallback)

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s: RawSettings): Settings {
  const d = DEFAULT_SETTINGS
  const arrows: unknown[] = Array.isArray(s.arrows) ? s.arrows : d.arrows
  return {
    inputs: text(s.inputs, d.inputs),
    outputs: text(s.outputs, d.outputs),
    arrows: arrows
      .map((a: any) => ({ from: text(a?.from, '').trim(), to: text(a?.to, '').trim() }))
      .filter((a, i, all) => a.from && a.to && all.findIndex((b) => b.from === a.from && b.to === a.to) === i),
    inputTitle: text(s.inputTitle, d.inputTitle),
    inputTitleMode: oneOf(TITLE_MODES, s.inputTitleMode, d.inputTitleMode),
    outputTitle: text(s.outputTitle, d.outputTitle),
    outputTitleMode: oneOf(TITLE_MODES, s.outputTitleMode, d.outputTitleMode),
    title: text(s.title, d.title),
    titleMode: oneOf(TITLE_MODES, s.titleMode, d.titleMode),
    shape: s.shape in SHAPES ? s.shape : d.shape,
    labelSize: cleanLabelSize(s.labelSize),
  }
}

/**
 * The items in a pasted or typed list, in order. Commas, semicolons, tabs and
 * new lines separate them, so a column or row copied from a spreadsheet works;
 * so do spaces between numbers ("1 2 3"), though not inside words ("New York").
 */
export function parseList(typed: string): string[] {
  const items = typed.split(/[,;\t\r\n]+/).map((t) => t.trim()).filter(Boolean)
  if (items.length === 1) {
    const words = items[0].split(/\s+/)
    if (words.length > 1 && words.every((w) => parseNumber(w) !== null)) return words
  }
  return items
}

/** A list's items with any repeats dropped (a diagram shows each once), and the repeats. */
function unique(items: string[]) {
  const kept: string[] = []
  const repeated: string[] = []
  for (const item of items) {
    if (!kept.includes(item)) kept.push(item)
    else if (!repeated.includes(item)) repeated.push(item)
  }
  return { items: kept, repeated }
}

/** What the arrows say about the diagram: a function or not, and why, for the settings panel. */
export type Verdict = { kind: 'function' | 'not-function' | 'unfinished'; text: string } | null

/**
 * What the settings mean: each side's items, top to bottom, the arrows
 * between them (by position), any items typed twice, and whether the
 * mapping is a function.
 */
export function readMapping(s: Settings) {
  const inputs = unique(parseList(s.inputs))
  const outputs = unique(parseList(s.outputs))
  const arrows = s.arrows
    .map((a) => ({ from: inputs.items.indexOf(a.from), to: outputs.items.indexOf(a.to) }))
    .filter((a) => a.from >= 0 && a.to >= 0)
    .sort((a, b) => a.from - b.from || a.to - b.to)
  return {
    inputs: inputs.items,
    outputs: outputs.items,
    arrows,
    repeated: { inputs: inputs.repeated, outputs: outputs.repeated },
    verdict: verdictOf(inputs.items, outputs.items, arrows),
  }
}

const and = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

function verdictOf(inputs: string[], outputs: string[], arrows: { from: number; to: number }[]): Verdict {
  if (!inputs.length || !arrows.length) return null
  const outsOf = inputs.map((_, i) => arrows.filter((a) => a.from === i).map((a) => outputs[a.to]))
  const many = outsOf.findIndex((outs) => outs.length > 1)
  if (many >= 0) {
    const outs = outsOf[many]
    return { kind: 'not-function', text: `Not a function: ${inputs[many]} goes to ${outs.length === 2 ? 'both ' : ''}${and(outs)}.` }
  }
  const lonely = inputs.filter((_, i) => !outsOf[i].length)
  if (lonely.length) {
    const has = lonely.length === 1 ? 'has' : 'have'
    return { kind: 'unfinished', text: `Not a function yet: ${and(lonely)} ${has} no output. Every input needs exactly one.` }
  }
  const oneToOne = new Set(arrows.map((a) => a.to)).size === arrows.length
  return { kind: 'function', text: `A function: every input goes to exactly one output${oneToOne ? ', and no two share one, so it’s one-to-one' : ''}.` }
}

/**
 * The inputs, outputs and arrows written in ordered pairs, like
 * "(1, 4), (2, 5)", or as "1 → 4" one per line, or null when there are none.
 * Numbers are put in order; anything else stays in the order it came.
 */
export function readPairs(typed: string): { inputs: string[]; outputs: string[]; arrows: Arrow[] } | null {
  const found = [...typed.matchAll(/\(([^(),]+),([^(),]+)\)/g)]
  const pairs = found.length
    ? found.map((m) => [m[1], m[2]])
    : typed.split(/[\r\n;,]+/).map((line) => line.split(/→|↦|\|->|->|=>/)).filter((p) => p.length === 2)
  const arrows = pairs.map(([from, to]) => ({ from: from.trim(), to: to.trim() })).filter((a) => a.from && a.to)
  if (!arrows.length) return null
  const sorted = (items: string[]) => {
    const list = unique(items).items
    const values = list.map(parseNumber)
    return values.every((v) => v !== null) ? list.map((item, i) => [item, values[i]!] as const).sort((a, b) => a[1] - b[1]).map(([item]) => item) : list
  }
  return { inputs: sorted(arrows.map((a) => a.from)), outputs: sorted(arrows.map((a) => a.to)), arrows }
}

/** Do two settings draw the same figure? */
export function sameFigure(a: RawSettings, b: RawSettings): boolean {
  return settingsToQuery(cleanSettings(a)) === settingsToQuery(cleanSettings(b))
}

export function settingsToQuery(s: Settings): string {
  const params = new URLSearchParams()
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = s[key as keyof Settings]
    if (key === 'arrows' || v === def || v === null || v === undefined) continue
    params.set(key, String(v))
  }
  // One arrow= per arrow the diagram draws, top input first.
  const { inputs, outputs, arrows } = readMapping(s)
  for (const a of arrows) params.append('arrow', `${inputs[a.from]}${JOIN}${outputs[a.to]}`)
  return params.toString()
}

export function settingsFromParams(params: URLSearchParams): Settings {
  const arrows = params.getAll('arrow').map((p) => {
    const at = p.indexOf(JOIN)
    return at < 0 ? null : { from: p.slice(0, at), to: p.slice(at + JOIN.length) }
  })
  const s: RawSettings = { ...DEFAULT_SETTINGS, arrows: arrows.filter(Boolean) }
  for (const key of Object.keys(DEFAULT_SETTINGS)) if (key !== 'arrows' && params.has(key)) s[key] = params.get(key)
  return cleanSettings(s)
}
