// pH Reading's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { MAGNIFIER_VIEW_WORDS, figureTextDocs, spanDoc } from '$lib/linking/common'
import { ANALOG_SCALE, PH_MAX, PH_MIN } from './readings'
import { phSettings } from './settings'

export const phLinking = describeLinking(phSettings, {
  id: 'ph-reading',
  summary:
    `A pH meter wired to an electrode in a beaker, digital or analog (a needle over a ${PH_MIN}–${PH_MAX} dial), or a strip of universal indicator paper above its color chart, showing the pH in reading.`,
  notes: [
    `reading is kept between ${PH_MIN} and ${PH_MAX} and rounded to what the instrument reads: the digital meter to decimals places, the analog meter to ${ANALOG_SCALE.decimals} places (marks every ${ANALOG_SCALE.minorEvery}), and pH paper to the whole number whose color it matches.`,
    'decimals applies only to the digital meter; view and span only to the analog meter.',
    'pH paper only works printed in color.',
  ],
  params: {
    instrument: { what: 'Which instrument.', values: 'digital: digital pH meter; analog: analog pH meter; paper: pH paper and color chart' },
    decimals: { what: 'Decimal places on the digital display. Rounded to a whole number.', when: 'instrument=digital' },
    reading: { what: 'The pH shown.', values: 'Rounded to what the instrument reads (see notes)' },
    view: { what: 'What an analog meter figure shows.', when: 'instrument=analog', values: MAGNIFIER_VIEW_WORDS },
    span: spanDoc('instrument=analog and view is both or magnifier'),
    ...figureTextDocs('pH: 4.62'),
  },
  examples: [
    { shows: 'A digital pH meter showing 8.34, with the answer key.', settings: { reading: 8.34, answerKey: true } },
    { shows: 'An analog pH meter at pH 3.46, with a magnifier on the needle.', settings: { instrument: 'analog', reading: 3.46 } },
    { shows: 'pH paper that has turned the color for pH 11, above the 0–14 color chart.', settings: { instrument: 'paper', reading: 11 } },
  ],
})
