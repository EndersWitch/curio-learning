// Bohr Model's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { chartTitleDocs } from '$lib/linking/common'
import { MAX_BALLS, MAX_ELECTRONS, MAX_NUCLEONS, MAX_PAIRED, MAX_SHELLS } from './model'
import { bohrSettings } from './settings'

const symbol = (part: string, values: string) => ({ what: `The symbol written on each ${part} ball or dot, or none.`, values })

export const bohrLinking = describeLinking(bohrSettings, {
  id: 'bohr-model',
  summary:
    'One atom or ion: a nucleus of protons and neutrons with electrons as dots on rings. The link gives the counts themselves (protons, neutrons, and electrons on each shell); there is no element parameter, and nothing is checked, so any counts draw exactly as given.',
  notes: [
    `electrons lists each shell’s electrons from the nucleus out, joined by hyphens: 2-8-1 is sodium’s. 1 to ${MAX_SHELLS} shells, each 0 to ${MAX_ELECTRONS}.`,
    'To draw an element, set protons to its atomic number, neutrons to its mass number minus that, and electrons to its shells (the page uses the atomic mass rounded to a whole number; Cl is 17 protons, 18 neutrons, 2-8-7). For an ion, change only electrons: Na⁺ is protons=11&neutrons=12&electrons=2-8.',
    `The charge (protons minus electrons) is worked out, never given. brackets draws square brackets and the charge around an ion; a neutral atom is never bracketed.`,
    `nucleus=balls draws proton and neutron balls only up to ${MAX_BALLS} of them combined; past that it shows the counts as text.`,
    'gainedLost shows how the shells differ from the neutral atom’s (gained electrons in gainedColor, lost ones as dashed empty spots) only when protons is an element’s atomic number and emptyRings is off.',
  ],
  params: {
    protons: { what: 'The number of protons. Rounded to a whole number.', values: `Up to ${MAX_NUCLEONS}` },
    neutrons: { what: 'The number of neutrons. Rounded to a whole number.', values: `Up to ${MAX_NUCLEONS}` },
    nucleus: { what: 'How the nucleus is drawn.', values: 'balls: proton and neutron balls; text: the counts written in a circle; blank: an empty circle for students' },
    seed: { what: 'Which random mix of proton and neutron balls is drawn. Rounded to a whole number.', when: 'nucleus=balls' },
    electrons: {
      what: 'The electrons on each shell, innermost first.',
      about: { type: 'format', syntax: `whole numbers joined by hyphens, e.g. 2-8-1 (1 to ${MAX_SHELLS} shells, each 0 to ${MAX_ELECTRONS})` },
    },
    placement: { what: 'How electrons sit on each ring.', values: `even: spread evenly; paired: the first four singly at top, right, bottom and left, then in pairs, as in Lewis structures (up to ${MAX_PAIRED} per shell; fuller shells are spread evenly)` },
    emptyRings: { what: 'Draws the rings without electrons, for students to draw them.' },
    protonColor: { what: 'The proton balls’ color.', when: 'nucleus=balls' },
    protonSymbol: symbol('proton', 'p+ is written p⁺; empty for none'),
    neutronColor: { what: 'The neutron balls’ color.', when: 'nucleus=balls' },
    neutronSymbol: symbol('neutron', 'n0 is written n⁰; empty for none'),
    electronColor: { what: 'The electron dots’ color.' },
    electronSymbol: symbol('electron', 'e- is written e⁻; empty for none. An electron with a symbol is drawn larger'),
    gainedLost: { what: 'Shows gained and lost electrons compared with the neutral atom (see notes).' },
    gainedColor: { what: 'The gained electrons’ color.', when: 'gainedLost=1' },
    brackets: { what: 'Puts an ion in square brackets with its charge at the top right.' },
    key: { what: 'Draws a key beside the model naming each part drawn as a ball or dot.' },
    shellLabels: { what: 'Writes n = 1, n = 2… on each ring.' },
    ...chartTitleDocs(),
  },
  examples: [
    { shows: 'A sodium atom: 11 protons and 12 neutrons as balls, electrons 2, 8, 1, with shell labels and a key.', settings: { protons: 11, neutrons: 12, electrons: [2, 8, 1], shellLabels: true, key: true } },
    { shows: 'A chloride ion, Cl⁻ (2, 8, 8), in brackets, with its gained electron in green.', settings: { protons: 17, neutrons: 18, electrons: [2, 8, 8], brackets: true, gainedLost: true } },
    { shows: 'An oxygen atom with its nucleus written as text and its rings left empty for students to draw the electrons.', settings: { protons: 8, neutrons: 8, electrons: [2, 6], nucleus: 'text', emptyRings: true } },
  ],
})
