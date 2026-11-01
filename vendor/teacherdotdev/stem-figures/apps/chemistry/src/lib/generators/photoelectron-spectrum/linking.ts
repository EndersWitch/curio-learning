// Photoelectron Spectrum's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs } from '$lib/linking/common'
import { MAX_PES_Z } from './energies'
import { pesSettings } from './settings'

const TEXT_MODE_WORDS = 'text: written; blank: a blank line for students; none: not drawn'

export const pesLinking = describeLinking(pesSettings, {
  id: 'photoelectron-spectrum',
  summary:
    'One neutral atom’s photoelectron spectrum, as in AP Chemistry: a peak for each sublevel of its ground state, as tall as that sublevel’s electrons, at its binding energy, which falls from left to right. z is the element’s atomic number; compare adds a second element drawn dashed behind it.',
  notes: [
    `z and compare are atomic numbers, 1 to ${MAX_PES_Z} (hydrogen to xenon): z=11 is sodium. compare=0, or the same as z, draws no second element.`,
    'Peaks follow the ground-state configuration, exceptions included (Cr is [Ar] 4s¹ 3d⁵, Cu [Ar] 4s¹ 3d¹⁰). Energies for H to Ca are the textbook table AP materials quote; Sc to Xe are from Lotz (1970), with a split p or d sublevel drawn as one peak at its electron-weighted average.',
    'scale=log spaces the energy axis in powers of ten; scale=broken gives each group of nearby peaks its own linear stretch, with break marks between; scale=linear runs evenly from 0, which crowds the valence peaks together at the right.',
    'With names=0 the key and answer key call the elements Element A and Element B (a single element isn’t named anywhere on the figure); answerKey prints each element and its configuration, e.g. “Sodium (Na): 1s² 2s² 2p⁶ 3s¹”.',
  ],
  params: {
    z: { what: 'The element’s atomic number. Rounded to a whole number.' },
    compare: { what: 'A second element’s atomic number, drawn dashed and gray behind the first; 0 for none. Rounded to a whole number.' },
    unit: { what: 'The binding energy’s unit.', values: 'MJ/mol (megajoules per mole) or eV (electronvolts per electron)' },
    scale: { what: 'How the binding energy axis is spaced (see notes).' },
    peaks: { what: 'How each peak is drawn.', values: 'peaks: a narrow smooth peak; bars: a bar' },
    sublevels: { what: 'The sublevel labels (1s, 2p…) over the peaks.', values: TEXT_MODE_WORDS },
    counts: { what: 'Writes each peak’s number of electrons after its sublevel label, like 2p⁶.', when: 'sublevels=text' },
    energies: { what: 'Writes each peak’s binding energy over it, in unit.' },
    yNumbers: { what: 'Numbers the relative number of electrons axis, so peak heights can be read.' },
    gridlines: { what: 'Draws a light line across at each number of electrons.' },
    names: { what: 'Names the elements in the key; 0 hides them for a “which element is this?” question.' },
    labelSize: { what: 'How big the figure’s text is compared to its lines.' },
    ...figureTextDocs('Sodium (Na): 1s² 2s² 2p⁶ 3s¹'),
  },
  examples: [
    { shows: 'Sodium’s photoelectron spectrum on a logarithmic energy axis, its four peaks labeled 1s², 2s², 2p⁶ and 3s¹.', settings: { counts: true } },
    { shows: 'Neon with each peak’s electrons and binding energy written over it, in MJ/mol.', settings: { z: 10, counts: true, energies: true } },
    { shows: 'Magnesium compared with sodium dashed behind it, the names hidden as Element A and B, with the answer key.', settings: { z: 12, compare: 11, names: false, answerKey: true } },
    { shows: 'Calcium on a broken axis in eV, drawn as bars, its sublevel labels left blank for students.', settings: { z: 20, unit: 'eV', scale: 'broken', peaks: 'bars', sublevels: 'blank' } },
  ],
})
