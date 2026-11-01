// Orbital Diagram's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs } from '$lib/linking/common'
import { FILL_NAMES, MAX_EXTRA } from './diagram'
import { MAX_Z } from './elements'
import { orbitalSettings } from './settings'

const TEXT_MODE_WORDS = 'text: written; blank: a blank line for students; none: not drawn'
const FILL_WORDS = Object.entries(FILL_NAMES).map(([fill, name]) => `${fill ? `"${fill}"` : '""'} ${name}`).join(', ')

export const orbitalLinking = describeLinking(orbitalSettings, {
  id: 'orbital-diagram',
  summary:
    'One atom or ion’s ground-state electron configuration drawn as up and down arrows in a square (or line) per orbital, with sublevel labels under them. The atom is z (its atomic number) and charge; the configuration is worked out from them.',
  notes: [
    `z is the atomic number, 1 to ${MAX_Z}: z=26 is iron. charge is the ion’s charge (positive means fewer electrons than protons) and is never more than z.`,
    'An ion loses its outermost electrons first, as textbooks teach, so Fe²⁺ (z=26&charge=2) is [Ar] 3d⁶, having lost both 4s electrons.',
    'rule=real draws exceptions such as Cr ([Ar] 4s¹ 3d⁵) and Cu as they really are; rule=filling draws every element as the filling order predicts.',
    `changes is URL-encoded JSON for a “which rule is broken?” question: an object from sublevel name to that sublevel’s orbitals, left to right, each one of ${FILL_WORDS}; e.g. {"2p":["ud","u",""]}. The list must have one entry per orbital (s 1, p 3, d 5, f 7) and the sublevel must be drawn (extra can draw up to ${MAX_EXTRA} empty ones past the last filled). Changes that match the ground state are dropped.`,
    'answerKey prints the species and its ground-state configuration (e.g. “Fe²⁺: [Ar] 3d⁶”) and, for a changed diagram, whether it is an excited state or not allowed and each rule it breaks.',
  ],
  params: {
    z: { what: 'The element’s atomic number. Rounded to a whole number.' },
    charge: { what: 'The ion’s charge; 0 for a neutral atom. Rounded to a whole number.' },
    rule: { what: 'How exceptions are drawn.', values: 'real: as they really are; filling: as the filling order predicts' },
    order: { what: 'The order sublevels are drawn in.', values: 'filling: the order they fill (4s before 3d); shell: grouped by shell (3d before 4s)' },
    core: { what: 'Writes the noble gas core in brackets, like [Ar], and draws only the orbitals after it.' },
    arrows: { what: 'The electrons’ arrow style.', values: 'full: full arrows; half: half arrows' },
    orbitals: { what: 'How each orbital is drawn.', values: 'squares: a square box; lines: a line' },
    arrangement: {
      what: 'How the sublevels are laid out.',
      values:
        'row: side by side, wrapping onto more rows; energy: stacked by energy, each sublevel a step higher than the one before it in filling order, with s, p, d and f in their own columns (order then changes only the written configuration)',
    },
    symbol: { what: 'The element symbol (with its charge) beside the diagram.', values: TEXT_MODE_WORDS },
    labels: { what: 'The sublevel labels (1s, 2p…) under the orbitals.', values: TEXT_MODE_WORDS },
    electrons: { what: 'Draws the electrons; 0 draws empty orbitals for students to fill.' },
    configLine: { what: 'The written configuration (e.g. 1s² 2s² 2p⁴) under the diagram.', values: TEXT_MODE_WORDS },
    extra: { what: 'How many more empty sublevels to draw after the last filled one, so electrons can be moved up into them. Rounded to a whole number.' },
    changes: { what: 'The teacher’s changes to orbitals, as JSON (see notes).' },
    ...figureTextDocs('O: 1s² 2s² 2p⁴'),
  },
  examples: [
    { shows: 'Iron, Fe, with its [Ar] noble gas core and the answer key.', settings: { z: 26, core: true, answerKey: true } },
    {
      shows: 'The Fe³⁺ ion (3d⁵, having lost both 4s electrons and one 3d), its sublevels stacked by energy, with its configuration written under it.',
      settings: { z: 26, charge: 3, arrangement: 'energy', configLine: 'text' },
    },
    { shows: 'Chromium, the exception [Ar] 4s¹ 3d⁵, with a blank line for students to write the configuration.', settings: { z: 24, core: true, configLine: 'blank' } },
    { shows: 'Nitrogen drawn breaking Hund’s rule (a pair in 2p while an orbital is empty), with the answer key naming the rule.', settings: { z: 7, changes: { '2p': ['ud', 'u', ''] }, answerKey: true } },
  ],
})
