// Titration Curve's address parameters, for /linking and /llms.txt. The grid
// and axis fields come from $shared/graph, whose fields don't say what values
// they take, so those are said here from the same lists.

import { CAPS } from '$shared/graph/caps'
import { EVERY, LABEL_MODES, MINOR, TITLE_MODES } from '$shared/graph/axes'
import { LABEL_SIZES } from '$shared/labelSize'
import { describeLinking, type ParamDoc } from '$lib/linking/define'
import type { FieldAbout } from '$lib/shared/settings'
import { ANALYTE_NAMES, COMMON, MARK_NAMES, titrationSettings } from './settings'

/** The most characters $shared's text() keeps. */
const SHARED_TEXT: FieldAbout = { type: 'text', maxLength: 120 }
const titleModes: FieldAbout = { type: 'choice', options: TITLE_MODES }
const TITLE_MODE_WORDS = 'text: the words given; blank: a blank line for students to write on; none: nothing'
const labelModes: FieldAbout = { type: 'choice', options: LABEL_MODES }
const caps: FieldAbout = { type: 'choice', options: Object.keys(CAPS) }
const every: FieldAbout = { type: 'choice', options: EVERY.map(String) }
const range = (axis: 'x' | 'y', end: string, unit: string): ParamDoc => ({
  what: `The ${axis}-axis’s ${end}, ${unit}, written as a plain number (e.g. 0, 2.5).`,
  about: SHARED_TEXT,
})
const cap = (axis: 'x' | 'y', end: string): ParamDoc => ({ what: `How the ${axis}-axis’s ${end} end is finished.`, about: caps })
const markWords = Object.entries(MARK_NAMES).map(([id, name]) => `${id}: ${name.toLowerCase()}`).join('; ')
const common = COMMON.map((c) => `${c.name}: analyte=${c.analyte}${c.pK ? `, ${c.analyte === 'weak-base' ? 'pKb' : 'pKa'}=${c.pK}` : ''}`).join('; ')

export const titrationLinking = describeLinking(titrationSettings, {
  id: 'titration-curve',
  summary:
    'A graph of pH (up the side) against the volume of titrant added in mL (along the bottom) for one monoprotic acid titrated with NaOH or base titrated with HCl. The curve is worked out either from concentrations (source=chemistry) or from key points (source=points).',
  notes: [
    'With source=chemistry (the default) the curve comes from analyteM, analyteMl, titrantM and pKa (weak acid) or pKb (weak base); the pH at each volume is solved exactly. startPH, eqMl, eqPH and endPH are ignored.',
    'With source=points the curve is a real titration curve bent to pass through startPH, the equivalence point (eqMl, eqPH) and endPH, which is the pH at the end of the x-axis. The concentrations are ignored.',
    `The defaults are 25.0 mL of 0.100 M acetic acid (pKa 4.76) titrated with 0.100 M NaOH. The page’s common titrations are all 25.0 mL of 0.100 M with 0.100 M: ${common}.`,
    'The x-axis title is not changed by the link: for a base (analyte=strong-base or weak-base) also set xTitle, e.g. “Volume of HCl added (mL)”.',
    'The half-equivalence point (halfMark and its label) is drawn only for a weak acid or weak base.',
    'Axis ranges are text holding plain numbers. From xFrom to xTo counting by xStep makes the gridlines, at most 50 blocks per axis; an axis whose range can’t be used falls back to 0 to 15 by 1.',
  ],
  params: {
    source: { what: 'What the curve is worked out from.', values: 'chemistry: concentrations; points: key points' },
    analyte: {
      what: 'What is in the flask. An acid is titrated with NaOH, a base with HCl.',
      values: Object.entries(ANALYTE_NAMES).map(([id, name]) => `${id}: ${name.toLowerCase()}`).join('; '),
    },
    analyteM: { what: 'The acid or base’s molarity, in M.', when: 'source=chemistry' },
    analyteMl: { what: 'The volume of acid or base in the flask, in mL.', when: 'source=chemistry' },
    titrantM: { what: 'The NaOH or HCl molarity, in M.', when: 'source=chemistry' },
    pKa: { what: 'The weak acid’s pKa.', when: 'source=chemistry and analyte=weak-acid' },
    pKb: { what: 'The weak base’s pKb.', when: 'source=chemistry and analyte=weak-base' },
    startPH: { what: 'The pH before any titrant is added.', when: 'source=points' },
    eqMl: { what: 'The volume of titrant at the equivalence point, in mL.', when: 'source=points' },
    eqPH: { what: 'The pH at the equivalence point.', when: 'source=points' },
    endPH: { what: 'The pH at the end of the x-axis.', when: 'source=points' },
    eqMark: { what: 'How the equivalence point is marked.', values: markWords },
    eqLabelMode: { what: 'The equivalence point’s label.', when: 'eqMark is not none', values: TITLE_MODE_WORDS },
    eqLabel: { what: 'The equivalence point label’s words.', when: 'eqLabelMode=text' },
    halfMark: { what: 'How the half-equivalence point is marked.', when: 'analyte is weak-acid or weak-base', values: markWords },
    halfLabelMode: { what: 'The half-equivalence point’s label.', when: 'halfMark is not none', values: TITLE_MODE_WORDS },
    halfLabel: { what: 'The half-equivalence point label’s words.', when: 'halfLabelMode=text' },
    color: { what: 'The curve’s color.' },
    xFrom: range('x', 'start', 'in mL'),
    xTo: range('x', 'end', 'in mL; the curve runs to here'),
    xStep: range('x', 'gridline spacing', 'in mL'),
    yFrom: range('y', 'start', 'in pH'),
    yTo: range('y', 'end', 'in pH'),
    yStep: range('y', 'gridline spacing', 'in pH'),
    xEvery: { what: 'Number every nth x gridline; 0 leaves the x-axis unnumbered.', about: every },
    yEvery: { what: 'Number every nth y gridline; 0 leaves the y-axis unnumbered.', about: every },
    title: { what: 'The chart title’s words.', when: 'titleMode=text', about: SHARED_TEXT },
    titleMode: { what: 'The chart title across the top.', about: titleModes, values: TITLE_MODE_WORDS },
    xTitle: { what: 'The x-axis title’s words.', when: 'xTitleMode=text', about: SHARED_TEXT },
    xTitleMode: { what: 'The x-axis title.', about: titleModes, values: TITLE_MODE_WORDS },
    yTitle: { what: 'The y-axis title’s words.', when: 'yTitleMode=text', about: SHARED_TEXT },
    yTitleMode: { what: 'The y-axis title.', about: titleModes, values: TITLE_MODE_WORDS },
    xLabel: { what: 'The letter at the end of the x-axis.', when: 'xLabelMode=text', about: SHARED_TEXT },
    xLabelMode: { what: 'Whether the x-axis has a letter at its end.', about: labelModes },
    yLabel: { what: 'The letter at the end of the y-axis.', when: 'yLabelMode=text', about: SHARED_TEXT },
    yLabelMode: { what: 'Whether the y-axis has a letter at its end.', about: labelModes },
    xStartCap: cap('x', 'left'),
    xEndCap: cap('x', 'right'),
    yStartCap: cap('y', 'bottom'),
    yEndCap: cap('y', 'top'),
    minor: { what: 'Minor gridlines: how many parts each grid block is split into; 0 for none.', about: { type: 'choice', options: MINOR.map(String) } },
    labelSize: { what: 'How big the figure’s text is compared to its lines.', about: { type: 'choice', options: Object.keys(LABEL_SIZES) } },
  },
  examples: [
    { shows: 'Acetic acid (25.0 mL, 0.100 M, pKa 4.76) titrated with 0.100 M NaOH, with the equivalence and half-equivalence points marked.', settings: { halfMark: 'guides' } },
    {
      shows: 'Ammonia (0.100 M, pKb 4.75) titrated with 0.100 M HCl, the half-equivalence point marked with a dot.',
      settings: { analyte: 'weak-base', pKb: 4.75, xTitle: 'Volume of HCl added (mL)', halfMark: 'dot' },
    },
    {
      shows: 'A strong acid curve from key points (starting pH 1, equivalence at 20 mL and pH 7, ending pH 12.5), its equivalence label left blank for students.',
      settings: { source: 'points', analyte: 'strong-acid', startPH: 1, eqMl: 20, eqPH: 7, endPH: 12.5, eqLabelMode: 'blank' },
    },
  ],
})
