// Mass Reading's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs, spanDoc } from '$lib/linking/common'
import { OBJECT_NAMES } from '../volume-by-displacement/objects'
import { DECIMAL_PLACES, digitalBalance } from './digital'
import { TRIPLE_BEAM_CAPACITY, TRIPLE_BEAM_DECIMALS } from './tripleBeam'
import { massSettings } from './settings'

const digitalWords = DECIMAL_PLACES.map((d) => {
  const b = digitalBalance(d)
  return `${d} place${d === 1 ? '' : 's'}: up to ${b.capacity} g${b.analytical ? ', an analytical balance in a draft shield' : ''}`
}).join('; ')

export const massLinking = describeLinking(massSettings, {
  id: 'mass-reading',
  summary:
    `A triple beam balance (${TRIPLE_BEAM_CAPACITY} g, read to ${TRIPLE_BEAM_DECIMALS} decimal places from its three riders) or a digital balance whose display shows mass in grams.`,
  notes: [
    `mass is in grams, rounded to the balance’s decimal places and kept between 0 and its capacity: triple beam ${TRIPLE_BEAM_CAPACITY} g to ${TRIPLE_BEAM_DECIMALS} places; digital ${digitalWords}.`,
    'decimals and pan apply only to the digital balance; view and span only to the triple beam balance.',
    'An object other than none sits on either balance’s pan, in place of the digital balance’s pan contents.',
  ],
  params: {
    instrument: { what: 'Which balance.', values: 'triple-beam: triple beam balance; digital: digital balance' },
    decimals: { what: 'How many decimal places of grams the digital display shows. Rounded to a whole number.', when: 'instrument=digital' },
    pan: { what: 'What the digital balance’s pan holds.', when: 'instrument=digital and object=none', values: 'boat: a weigh boat; beaker: a beaker; empty: nothing' },
    object: {
      what: 'An object on the pan, drawn as in Volume by Displacement.',
      values: ['none: no object', ...Object.entries(OBJECT_NAMES).map(([id, name]) => `${id}: ${name.toLowerCase()}`)].join('; '),
    },
    marbles: { what: 'How many marbles. Rounded to a whole number.', when: 'object=marbles' },
    mass: { what: 'The mass shown, in grams.', values: 'Rounded and kept within the balance’s capacity (see notes)' },
    view: {
      what: 'What a triple beam figure shows.',
      when: 'instrument=triple-beam',
      values: 'both: the balance with a magnifier on the 0–10 g beam’s rider; whole: the balance alone; beams: just the beams and riders',
    },
    span: spanDoc('instrument=triple-beam and view=both'),
    ...figureTextDocs('Mass: 24.73 g'),
  },
  examples: [
    { shows: 'A triple beam balance reading 347.85 g, with a magnifier on the front rider and the answer key.', settings: { instrument: 'triple-beam', mass: 347.85, answerKey: true } },
    { shows: 'A digital balance showing 12.6 g with a rock on its pan.', settings: { instrument: 'digital', decimals: 1, object: 'rock', mass: 12.6 } },
    { shows: 'An analytical balance (4 decimal places) showing 0.2534 g in a weigh boat.', settings: { instrument: 'digital', decimals: 4, mass: 0.2534 } },
  ],
})
