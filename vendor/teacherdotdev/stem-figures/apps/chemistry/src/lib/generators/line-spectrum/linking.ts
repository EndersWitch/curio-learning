// Line Spectrum's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs } from '$lib/linking/common'
import { VISIBLE_FROM, VISIBLE_TO } from './color'
import { ELEMENTS } from './elements'
import { MIN_RANGE, spectrumSettings } from './settings'
import { MAX_LINES, MAX_LINES_TEXT, MAX_NAME, MAX_NM, MAX_STRIPS, MIN_NM } from './strips'

const SYMBOL_WORDS = ELEMENTS.map((e) => `${e.symbol} (${e.name.toLowerCase()})`).join(', ')

export const spectrumLinking = describeLinking(spectrumSettings, {
  id: 'line-spectrum',
  summary:
    'One or more horizontal strips stacked on one wavelength scale in nm, each an element’s strongest visible lines, lines typed in, or a mixture of the other strips (an unknown for students to identify). The strips list says what each strip is; the rest is how they are drawn.',
  notes: [
    `strips is a URL-encoded JSON array of 1 to ${MAX_STRIPS} strips, top to bottom, each with a whole-number "id" unique among them: {"type":"element","id":1,"element":"H"}, {"type":"custom","id":2,"name":"Element X","lines":"450, 520.5, 610"} or {"type":"mixture","id":3,"name":"Unknown","of":[1,2]}. Unusable strips are dropped.`,
    `An element strip is one of ${SYMBOL_WORDS}, drawn with 3 to 8 of its strongest visible lines from the NIST Atomic Spectra Database (neutral atoms, wavelengths in air, to 0.1 nm).`,
    `A custom strip’s lines are wavelengths in nm (${MIN_NM} to ${MAX_NM}) separated by commas or spaces, at most ${MAX_LINES} of them and ${MAX_LINES_TEXT} characters; its name is up to ${MAX_NAME} characters.`,
    'A mixture’s of lists the ids of the element and custom strips in it, and it shows every line of every one of them. Its name (e.g. “Unknown”) is always written; the labels setting affects only element strips.',
    `from and to are the ends of the scale in nm, within ${VISIBLE_FROM} to ${VISIBLE_TO}, shortest wavelength on the left; they are swapped if given the wrong way round and widened to at least ${MIN_RANGE} nm. Lines outside the scale aren’t drawn.`,
    'answerKey prints what each mixture is made of (e.g. “Unknown: hydrogen and sodium”) and, with labels=blank, the element strips from the top down.',
  ],
  params: {
    strips: { what: 'The strips, top to bottom, as JSON (see notes).' },
    style: {
      what: 'How the spectra are drawn.',
      values: 'emission: colored bright lines on black; absorption: dark lines across a continuous rainbow; print: black lines on white, for a black-and-white copier',
    },
    strength: { what: 'How bright each line is.', values: 'uniform: every line equally bright; relative: as bright as NIST’s relative intensity for that element (roughly)' },
    labels: {
      what: 'What is written left of each element strip.',
      values: 'names: the element’s name; symbols: its symbol; blank: a blank line for students; none: nothing',
    },
    from: { what: 'The shortest wavelength on the scale, in nm.' },
    to: { what: 'The longest wavelength on the scale, in nm.' },
    ticks: { what: 'The nm between tick marks on the scale.', values: 'none: no minor ticks' },
    numbers: { what: 'The nm between numbered ticks on the scale.' },
    axis: { what: 'Where the wavelength scale is drawn.', values: 'bottom: once, under the last strip; each: under every strip; none: left off' },
    axisTitleMode: { what: 'Whether the scale has a title under it.', when: 'axis is not none', values: 'text: the words in axisTitle; none: no title' },
    axisTitle: { what: 'The scale’s title.', when: 'axisTitleMode=text' },
    ...figureTextDocs('Unknown: hydrogen and sodium'),
  },
  examples: [
    { shows: 'The emission spectra of hydrogen, helium and sodium, with an unknown mixture of hydrogen and sodium under them and the answer key.', settings: { answerKey: true } },
    { shows: 'Hydrogen’s emission spectrum alone: its four visible Balmer lines at 410.2, 434.0, 486.1 and 656.3 nm.', settings: { strips: [{ type: 'element', id: 1, element: 'H' }] } },
    {
      shows: 'Mercury and neon as absorption spectra, dark lines across a rainbow.',
      settings: {
        style: 'absorption',
        strips: [
          { type: 'element', id: 1, element: 'Hg' },
          { type: 'element', id: 2, element: 'Ne' },
        ],
      },
    },
    {
      shows: 'Two made-up elements and an unknown made of both, in black on white for printing.',
      settings: {
        style: 'print',
        strips: [
          { type: 'custom', id: 1, name: 'Element X', lines: '430, 515, 600' },
          { type: 'custom', id: 2, name: 'Element Y', lines: '470, 560, 655' },
          { type: 'mixture', id: 3, name: 'Unknown', of: [1, 2] },
        ],
      },
    },
  ],
})
