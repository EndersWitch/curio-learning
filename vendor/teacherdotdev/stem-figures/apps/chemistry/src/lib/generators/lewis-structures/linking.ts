// Lewis Structures' address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs } from '$lib/linking/common'
import { MAX_LONE, MAX_ORDER } from './changes'
import { LISTED } from './listed'
import { MAX_FORMULA, lewisSettings } from './settings'

/** Listed structures that share a formula with another, which `which` picks between. */
const atomsOf = (l: (typeof LISTED)[number]) => `${l.atoms.map(([element]) => element).sort().join()} ${l.charge ?? 0}`
const shared = LISTED.filter((l) => LISTED.some((o) => o !== l && atomsOf(o) === atomsOf(l)))

export const lewisLinking = describeLinking(lewisSettings, {
  id: 'lewis-structures',
  summary:
    'The Lewis structure of one molecule or polyatomic ion, or the Lewis dot diagram of one atom or monatomic ion, from formula. It always starts correct; scaffold turns it into a “complete this” question, and central or changes turn it into a “find the mistake” question.',
  notes: [
    'formula is a formula such as H2O, CH4, NH4+, SO4 2- or SO4^2- (a charge of 2 or more needs a space, ^ or parentheses before it: SO42- would be 42 oxygens), or pasted with real subscripts (SO₄²⁻). URL-encode it: a space is + or %20 and a plus sign is %2B, so NH4+ is formula=NH4%2B and SO4 2- is formula=SO4+2-.',
    'formula can be one atom or monatomic ion, such as N, P, Cl-, N 3- or Ca 2+ (N3- would be three N atoms, azide; Ca2+ two Ca atoms). Its valence electrons are drawn one to a side, then paired; an ion takes the electrons it gains or loses its own and goes in brackets with its charge. It has no bonds, so scaffold=bonds draws as skeleton, and formalCharges is ignored.',
    `Molecules with more than one central atom come from a list and can also be given by name: ${LISTED.map((l) => `${l.names[0]} (${l.formula})`).join(', ')}.`,
    `When a formula matches more than one listed structure by its atoms, which picks one by id${shared.length ? `: ${shared.map((l) => l.id).join(', ')}` : ''}.`,
    'rule decides which correct structure is built where textbooks disagree (SO₄²⁻, PO₄³⁻, ClO₄⁻, SO₂, SO₃): octet gives every atom an octet with formal charges; fewest lets period 3 and lower atoms exceed eight electrons for the fewest formal charges.',
    'A figure is either a “complete this” question or a “find the mistake” question: when central or changes change the structure, it is drawn in full as one structure, whatever scaffold and resonance say.',
    'answerKey prints, under a scaffolded structure, the full structure, and under a changed one, a list of its mistakes. A correct full structure has no answer key.',
  ],
  params: {
    formula: { what: 'The molecule or ion, as a formula or a listed name (see notes).', values: `Up to ${MAX_FORMULA} characters` },
    which: { what: 'Which listed structure, by id, when several share the formula’s atoms.', values: 'A listed id, e.g. ethanol or dimethyl-ether' },
    rule: { what: 'The structure rule.', values: 'octet: the octet rule; fewest: fewest formal charges' },
    resonance: { what: 'For a molecule or ion with resonance structures, whether to draw one of them or all of them in a row joined by ↔.' },
    form: { what: 'Which resonance structure to draw, counting from 1. Rounded to a whole number; past the last one draws the last.', when: 'resonance=one' },
    shape: { what: 'How the atoms are placed.', values: 'flat: outer atoms on the four sides, as in most textbooks; shaped: hinting at the real shape (bent H₂O)' },
    bondStyle: { what: 'How bonds are drawn.', values: 'lines: a line per shared pair; dots: two dots per shared pair' },
    formalCharges: { what: 'Labels atoms with their formal charges.' },
    scaffold: { what: 'How much of the structure a “complete this” question gives.', values: 'full: the whole structure; bonds: bonds without lone electrons; skeleton: just the atoms placed' },
    central: { what: 'Rebuilds a structure made from its formula around another of its elements as the central atom, making a “find the mistake” question.', values: 'An element symbol in the formula, e.g. O in CO2; ignored for listed structures and formulas under 3 atoms' },
    changes: {
      what: 'Edits to the correct structure, for a “find the mistake” question. Atoms and bonds are numbered from 0 in the structure’s own order, so these are easiest made on the page and copied with Share link.',
      about: {
        type: 'format',
        syntax: `items joined by dots: bN_O sets bond N to order O (0–${MAX_ORDER}); lN_E gives atom N E lone electrons (0–${MAX_LONE}); fN_C labels atom N with formal charge C; k_1 or k_0 turns brackets on or off; q_C writes the ion’s charge as C. A negative number is written with m, e.g. f2_m1`,
      },
    },
    ...figureTextDocs(''),
    answerKey: { what: 'Prints the answer key under the figure: the full structure under a scaffolded one, the list of mistakes under a changed one.', when: 'scaffold is not full, or the structure is changed' },
  },
  examples: [
    { shows: 'Sulfate, SO₄²⁻, under the octet rule, in brackets, with formal charges.', settings: { formula: 'SO4 2-', formalCharges: true } },
    { shows: 'All three resonance structures of nitrate, NO₃⁻, joined by ↔.', settings: { formula: 'NO3-', resonance: 'all' } },
    { shows: 'The skeleton of ammonia, NH₃, shaped, for students to complete, with the full structure as the answer key.', settings: { formula: 'NH3', shape: 'shaped', scaffold: 'skeleton', answerKey: true } },
    { shows: 'Carbon dioxide wrongly built around an O atom, for students to find the mistake, which the answer key names.', settings: { formula: 'CO2', central: 'O', answerKey: true } },
  ],
})
