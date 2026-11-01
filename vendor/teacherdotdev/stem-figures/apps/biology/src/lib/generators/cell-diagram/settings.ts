// Cell Diagram's settings, as they appear in the page address. Which
// structures are drawn is kept as changes from the cell's standard set, so
// the address stays short and a new cell type starts complete.

import { LABEL_SIZES, type LabelSize } from '$shared/labelSize'
import { bool, choice, defineSettings, text, type Field } from '$shared/settings'
import { STYLES } from './look'
import { CELLS, NAMINGS, PART_IDS, isStandard, partsOf, type PartId } from './structures'

/** How the structures are labeled: their names at the ends of leader
 *  lines, numbers (or letters) there instead, blank lines for students to
 *  write the names on, or no labels at all. */
export const LABEL_MODES = ['names', 'numbers', 'blanks', 'none'] as const
export type LabelMode = (typeof LABEL_MODES)[number]

export const LABEL_MODE_NAMES: Record<LabelMode, string> = { names: 'Names', numbers: 'Numbers', blanks: 'Blank lines', none: 'None' }

/** What numbered labels count with. */
export const MARKERS = ['numbers', 'letters'] as const
export type Marker = (typeof MARKERS)[number]

/** A list of structures, written in the address as "golgi,lysosomes". */
function parts(): Field<PartId[]> {
  const accept = (v: unknown) =>
    Array.isArray(v) && v.every((id) => PART_IDS.includes(id)) ? PART_IDS.filter((id) => v.includes(id)) : undefined
  return {
    fallback: [],
    accept,
    parse: (t) => accept(t.split(',').filter(Boolean)),
    format: (v) => v.join(','),
  }
}

export const cellSettings = defineSettings(
  {
    cell: choice(CELLS, 'animal'),
    /** standard structures taken out */
    without: parts(),
    /** optional structures put in */
    with: parts(),
    /** structures drawn without a label */
    unlabeled: parts(),
    style: choice(STYLES, 'color'),
    labels: choice(LABEL_MODES, 'names'),
    marker: choice(MARKERS, 'numbers'),
    naming: choice(NAMINGS, 'textbook'),
    wordBank: bool(false),
    answerKey: bool(false),
    titleMode: choice(['none', 'text'] as const, 'none'),
    title: text(''),
    labelSize: choice(Object.keys(LABEL_SIZES) as LabelSize[], 'medium'),
  },
  // Only this cell's structures are kept, so switching cells tidies the address.
  (s) => {
    const own = partsOf(s.cell)
    return {
      ...s,
      without: s.without.filter((id) => own.includes(id) && isStandard(s.cell, id)),
      with: s.with.filter((id) => own.includes(id) && !isStandard(s.cell, id)),
      unlabeled: s.unlabeled.filter((id) => own.includes(id)),
    }
  },
)

export type CellSettings = typeof cellSettings.defaults

/** The settings with one structure put in or taken out. */
export function withPart(s: CellSettings, id: PartId, on: boolean): Pick<CellSettings, 'without' | 'with'> {
  const toggle = (list: PartId[], add: boolean) => (add ? PART_IDS.filter((p) => p === id || list.includes(p)) : list.filter((p) => p !== id))
  return isStandard(s.cell, id) ? { without: toggle(s.without, !on), with: s.with } : { without: s.without, with: toggle(s.with, on) }
}

/** The settings with one structure's label turned on or off. */
export const withLabel = (s: CellSettings, id: PartId, on: boolean): PartId[] =>
  on ? s.unlabeled.filter((p) => p !== id) : PART_IDS.filter((p) => p === id || s.unlabeled.includes(p))

/** Quick starting points for common worksheets, applied to the current cell. */
export const QUICK = [
  { id: 'textbook', name: 'Textbook figure', set: { style: 'color', labels: 'names', wordBank: false, answerKey: false } },
  { id: 'quiz', name: 'Numbered quiz', set: { style: 'bw', labels: 'numbers', wordBank: true, answerKey: false } },
  { id: 'blanks', name: 'Fill in the blanks', set: { style: 'bw', labels: 'blanks', wordBank: true, answerKey: false } },
  { id: 'coloring', name: 'Coloring page', set: { style: 'bw', labels: 'names', wordBank: false, answerKey: false } },
] as const satisfies readonly { id: string; name: string; set: Partial<CellSettings> }[]

export type Quick = (typeof QUICK)[number]

/** Whether the settings already look like a quick start. */
export const isQuick = (s: CellSettings, q: Quick) => Object.entries(q.set).every(([k, v]) => s[k as keyof CellSettings] === v)
