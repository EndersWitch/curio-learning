// Volume by Displacement's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { figureTextDocs, spanDoc } from '$lib/linking/common'
import { scaleOptions } from '../volume-reading/scale'
import { OBJECT_NAMES } from './objects'
import { DISPLACEMENT_SIZES, cylinderScale, displacementSettings } from './settings'

const places = DISPLACEMENT_SIZES.map((size) => {
  const d = cylinderScale({ size }).decimals
  return `${size} mL to ${d} decimal place${d === 1 ? '' : 's'}`
}).join(', ')

const spacings = DISPLACEMENT_SIZES.map((size) => {
  const { marks, numbers, standard } = scaleOptions({ instrument: 'cylinder', size, beaker: 'medium' })
  return `${size}: marks ${marks.join(', ')} (standard ${standard.marks}), numbers ${numbers.join(', ')} (standard ${standard.numbers})`
}).join('; ')

export const displacementLinking = describeLinking(displacementSettings, {
  id: 'volume-by-displacement',
  summary:
    'Two graduated cylinders side by side: before, with water at the before reading, and after, with the object in and water at the after reading. The object’s volume is after minus before.',
  notes: [
    `before and after are in mL, rounded to the cylinder’s estimated digit (${places}, with its standard marks), and kept within its capacity.`,
    `marks and numbers take only the spacings the chosen cylinder offers, in mL; any other is its standard one, and so are numbers that don’t land on a mark or leave more than 20 marks between numbers: ${spacings}.`,
    'cm³ is the same size as mL, so unit never changes a reading.',
    'after is always higher than before: an after reading that isn’t is raised to one step above before.',
    'marbles sets how many marbles only when object=marbles.',
  ],
  params: {
    size: { what: 'Both cylinders’ capacity, in mL.' },
    marks: { what: 'The mL between the smallest marks on both cylinders.', values: 'standard: the cylinder’s usual marks; the others only where the cylinder offers them (see notes)' },
    numbers: { what: 'The mL between numbered marks.', values: 'standard: the cylinder’s usual numbers; none: the usual numbered marks drawn longer but without numbers, for students to work out; the others only where the cylinder offers them (see notes)' },
    unit: { what: 'The unit printed on the cylinders and in the answer key.', values: 'mL; cm3: cm³' },
    before: { what: 'The water level before the object goes in, in mL (or cm³).' },
    after: { what: 'The water level with the object in, in mL (or cm³).', values: 'Always above before' },
    guide: { what: 'Draws a dotted line from the bottom of each meniscus across to the marks.' },
    tint: { what: 'The water’s color. Gray photocopies best.' },
    object: {
      what: 'The object dropped into the second cylinder.',
      values: Object.entries(OBJECT_NAMES).map(([id, name]) => `${id}: ${name.toLowerCase()}`).join('; '),
    },
    marbles: { what: 'How many marbles. Rounded to a whole number.', when: 'object=marbles' },
    view: { what: 'Whether a magnified circle of the scale is drawn beside each cylinder.', values: 'whole: cylinders only; both: cylinders and magnifiers' },
    span: spanDoc('view=both'),
    beforeCaption: { what: 'The caption under the first cylinder.' },
    afterCaption: { what: 'The caption under the second cylinder.' },
    ...figureTextDocs('Before: 4.00 mL · After: 6.00 mL · Object: 2.00 mL'),
  },
  examples: [
    { shows: 'A rock raising the water in a 100 mL cylinder from 52.0 to 67.5 mL (a 15.5 mL rock), with the answer key.', settings: { size: '100', before: 52, after: 67.5, object: 'rock', answerKey: true } },
    { shows: 'Three marbles in a 25 mL cylinder, 12.50 to 15.75 mL, with magnifiers.', settings: { size: '25', before: 12.5, after: 15.75, object: 'marbles', marbles: 3, view: 'both' } },
    { shows: 'A metal cylinder in a 50 mL cylinder, 20.0 to 27.0 mL, captioned “Initial” and “Final”.', settings: { size: '50', before: 20, after: 27, object: 'cylinder', beforeCaption: 'Initial', afterCaption: 'Final' } },
    {
      shows: 'A cube in a 100 cm³ cylinder marked every 2 cm³ and numbered every 20 cm³, 46.0 to 61.0 cm³.',
      settings: { size: '100', marks: '2', numbers: '20', unit: 'cm3', before: 46, after: 61, object: 'cube' },
    },
  ],
})
