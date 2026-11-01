// Mass Spectrum's address parameters, for /linking and /llms.txt. The grid
// and axis fields come from $shared/graph, whose fields don't say what values
// they take, so those are said here from the same lists, as Titration Curve
// says them.

import { CAPS } from '$shared/graph/caps'
import { EVERY, LABEL_MODES, MINOR, TITLE_MODES } from '$shared/graph/axes'
import { LABEL_SIZES } from '$shared/labelSize'
import { describeLinking, type ParamDoc } from '$lib/linking/define'
import type { FieldAbout } from '$lib/shared/settings'
import { MAX_ISOTOPES, MAX_MASS, SCALE_NAMES, massSpectrumSettings } from './settings'

/** The most characters $shared's text() keeps. */
const SHARED_TEXT: FieldAbout = { type: 'text', maxLength: 120 }
const titleModes: FieldAbout = { type: 'choice', options: TITLE_MODES }
const TITLE_MODE_WORDS = 'text: the words given; blank: a blank line for students to write on; none: nothing'
const labelModes: FieldAbout = { type: 'choice', options: LABEL_MODES }
const caps: FieldAbout = { type: 'choice', options: Object.keys(CAPS) }
const every: FieldAbout = { type: 'choice', options: EVERY.map(String) }
const range = (axis: 'x' | 'y', end: string, unit: string, when?: string): ParamDoc => ({
  what: `The ${axis}-axis’s ${end}, ${unit}, written as a plain number (e.g. 0, 2.5).`,
  when,
  about: SHARED_TEXT,
})
const cap = (axis: 'x' | 'y', end: string): ParamDoc => ({ what: `How the ${axis}-axis’s ${end} end is finished.`, about: caps })

export const massSpectrumLinking = describeLinking(massSpectrumSettings, {
  id: 'mass-spectrum',
  summary:
    'One element’s mass spectrum: a bar at each isotope’s mass number (m/z, along the bottom) as tall as its abundance (up the side). The isotopes are an element’s natural ones (source=element) or ones given in isotopes (source=custom).',
  notes: [
    'element is a symbol: H to Xe (but not Tc, which has no natural isotopes), Pt, Au, Hg, Pb or U. Abundances are IUPAC’s representative isotopic compositions (CIAAW 2024, or 2009’s single values where 2024 gives only a range); masses are NIST’s (AME2012).',
    `isotopes is 1 to ${MAX_ISOTOPES} mass-abundance pairs joined by underscores, each mass (1 to ${MAX_MASS}) and % abundance (0 to 100) joined by a hyphen: isotopes=10.013-19.9_11.009-80.1. Each peak sits at its mass rounded to a whole number. Abundances that don’t add up to 100 are averaged as if they did.`,
    'The relative atomic mass is the average of the exact masses weighted by abundance; it is printed only by answerKey, as is the element when names=0.',
    'leaveOut is the m/z of one peak to leave off the figure for students to draw; it must be a peak’s m/z, or it becomes 0. The answer key names it and its abundance.',
    'With xFit=1 (the default) the x-axis fits the peaks, a block for each half m/z, and xFrom, xTo and xStep are ignored. The y-axis is as given, 0 to 100 by 10 unless set.',
    'The y-axis title follows scale (“Abundance (%)” or “Relative abundance”) unless yTitle gives other words.',
  ],
  params: {
    source: { what: 'Where the peaks come from.', values: 'element: an element’s natural isotopes; custom: the isotopes given' },
    element: { what: 'The element, by symbol.', when: 'source=element' },
    isotopes: {
      what: 'The isotopes, lightest or not, as mass-abundance pairs.',
      when: 'source=custom',
      about: { type: 'format', syntax: `mass-percent pairs joined by underscores, e.g. 10-20_11-80 (1 to ${MAX_ISOTOPES})` },
    },
    name: { what: 'What the figure and answer key call the element.', when: 'source=custom' },
    scale: { what: 'How tall each peak is.', values: Object.entries(SCALE_NAMES).map(([id, name]) => `${id}: ${name.toLowerCase()}`).join('; ') + ' (the tallest is 100)' },
    abundances: { what: 'Writes each peak’s abundance over it.' },
    names: { what: 'Writes the element’s name over the spectrum; 0 hides it for a “which element is this?” question.' },
    leaveOut: { what: 'The m/z of a peak left off for students to draw; 0 for none.' },
    answerKey: { what: 'Prints the answer key under the graph: the element and its relative atomic mass, e.g. “Magnesium (Mg): relative atomic mass 24.31”, and the peak left out.' },
    xFit: { what: 'Fits the x-axis to the peaks; 0 uses xFrom, xTo and xStep.' },
    xFrom: range('x', 'start', 'in m/z', 'xFit=0'),
    xTo: range('x', 'end', 'in m/z', 'xFit=0'),
    xStep: range('x', 'gridline spacing', 'in m/z', 'xFit=0'),
    yFrom: range('y', 'start', 'in %'),
    yTo: range('y', 'end', 'in %'),
    yStep: range('y', 'gridline spacing', 'in %'),
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
    { shows: 'Chlorine’s mass spectrum: peaks at m/z 35 (75.76%) and 37 (24.24%), with the answer key.', settings: { element: 'Cl', answerKey: true } },
    { shows: 'An unnamed element’s spectrum for students to identify, with its peak at m/z 25 left out to draw.', settings: { names: false, leaveOut: 25 } },
    {
      shows: 'A made-up Element X with isotopes of mass 10 (20%) and 11 (80%), its abundances relative to the tallest peak.',
      settings: { source: 'custom', scale: 'relative' },
    },
  ],
})
