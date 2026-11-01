// Gas Syringe's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { MAGNIFIER_VIEW_WORDS, figureTextDocs, spanDoc } from '$lib/linking/common'
import { syringeScale } from './syringe'
import { syringeSettings } from './settings'

const places = syringeScale('100').decimals

export const syringeLinking = describeLinking(syringeSettings, {
  id: 'gas-syringe',
  summary:
    'A glass gas syringe lying on its side, marked every 1 and numbered every 10 from 0 at the nozzle, with the plunger pushed out to the volume of gas in reading. It can be drawn alone or collecting gas from a conical flask on a stand.',
  notes: [
    `reading is rounded to ${places} decimal place and kept between 0 and the syringe’s size (50 or 100).`,
    'unit only changes what the scale is labeled: 1 cm³ = 1 mL, so it never changes the reading.',
  ],
  params: {
    size: { what: 'The syringe’s capacity (50 or 100 cm³). Both are drawn the same length; the 50 is thinner.' },
    unit: { what: 'The unit printed on the scale and in the answer key.', values: 'cm3: cm³; mL: mL' },
    reading: { what: 'The volume of gas collected, read at the plunger’s face.', values: `Rounded to ${places} decimal place, 0 up to size` },
    setup: { what: 'Whether the syringe is drawn alone or set up to collect gas.', values: 'syringe: syringe only; setup: with a conical flask, delivery tube and stand' },
    view: { what: 'What the figure shows. The magnifier sits above the syringe.', values: MAGNIFIER_VIEW_WORDS },
    span: spanDoc(),
    ...figureTextDocs('Volume of gas: 43.6 cm³'),
  },
  examples: [
    { shows: 'A 100 cm³ gas syringe alone, holding 62.4 cm³ of gas, with no magnifier.', settings: { setup: 'syringe', reading: 62.4, view: 'whole' } },
    { shows: 'A 50 mL gas syringe collecting gas from a flask, reading 18.5 mL, with a magnifier and the answer key.', settings: { size: '50', unit: 'mL', reading: 18.5, answerKey: true } },
  ],
})
