// Temperature Reading's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { MAGNIFIER_VIEW_WORDS, figureTextDocs, spanDoc } from '$lib/linking/common'
import { digitalRange } from './digital'
import { glassScale } from './glass'
import { TEMPERATURE_UNITS, UNIT_SYMBOLS } from './units'
import { temperatureSettings } from './settings'

const glassWords = TEMPERATURE_UNITS.map((u) => {
  const s = glassScale(u)
  return `${s.min} to ${s.max} ${UNIT_SYMBOLS[u]} marked every ${s.minorEvery}`
}).join(', ')
const digitalWords = TEMPERATURE_UNITS.map((u) => {
  const r = digitalRange(u)
  return `${r.min} to ${r.max} ${UNIT_SYMBOLS[u]}`
}).join(', ')
const glassPlaces = glassScale('celsius').decimals

export const temperatureLinking = describeLinking(temperatureSettings, {
  id: 'temperature-reading',
  summary:
    'A liquid-in-glass thermometer (read at the top of its liquid column, with an optional magnifier) or a digital probe thermometer standing in a beaker, showing reading in the chosen unit.',
  notes: [
    'reading is in the unit set by unit: unit=kelvin&reading=300 is 300 K. Give reading whenever you change unit, since the default 23.4 is outside the Kelvin glass scale and would be clamped to its bottom.',
    `On the glass thermometer reading is rounded to ${glassPlaces} decimal place and kept on the scale: ${glassWords}.`,
    `On the digital thermometer reading is rounded to decimals places and kept within ${digitalWords}.`,
    'decimals applies only to the digital thermometer; tint, view and span only to the glass one.',
  ],
  params: {
    instrument: { what: 'Which thermometer.', values: 'glass: liquid-in-glass thermometer; digital: digital probe thermometer' },
    unit: { what: 'The temperature scale the thermometer reads in.', values: 'celsius: °C; kelvin: K; fahrenheit: °F' },
    decimals: { what: 'Decimal places on the digital display. Rounded to a whole number.', when: 'instrument=digital' },
    reading: { what: 'The temperature shown, in the chosen unit.', values: 'Rounded and kept within the thermometer’s range (see notes)' },
    tint: { what: 'The glass thermometer’s liquid color (red like alcohol, gray like mercury).', when: 'instrument=glass' },
    view: { what: 'What a glass thermometer figure shows.', when: 'instrument=glass', values: MAGNIFIER_VIEW_WORDS },
    span: spanDoc('instrument=glass and view is both or magnifier'),
    ...figureTextDocs('Temperature: 23.4 °C'),
  },
  examples: [
    { shows: 'A liquid-in-glass thermometer reading 78.5 °C, with a magnifier and the answer key.', settings: { reading: 78.5, answerKey: true } },
    { shows: 'A digital thermometer showing −12.35 °C.', settings: { instrument: 'digital', decimals: 2, reading: -12.35 } },
    { shows: 'A liquid-in-glass thermometer marked in kelvins, reading 310.0 K, with a gray (mercury) column and no magnifier.', settings: { unit: 'kelvin', reading: 310, tint: 'gray', view: 'whole' } },
  ],
})
