// Volume Reading's address parameters, for /linking and /llms.txt.

import { describeLinking } from '$lib/linking/define'
import { MAGNIFIER_VIEW_WORDS, figureTextDocs, spanDoc } from '$lib/linking/common'
import { BEAKER_SIZES, CYLINDER_SIZES, scaleOptions, volumeScale, type VolumeInstrument } from './scale'
import { volumeSettings } from './settings'

const scaleWords = (choice: Omit<VolumeInstrument, 'beaker' | 'size'> & Partial<VolumeInstrument>) => {
  const scale = volumeScale({ size: '100', beaker: 'medium', ...choice })
  const places = scale.decimals === 0 ? 'whole mL' : `${scale.decimals} decimal place${scale.decimals === 1 ? '' : 's'}`
  return `${scale.lowest ? `${scale.lowest}–` : '0–'}${scale.capacity} mL to ${places}`
}

const readingRanges = [
  ...CYLINDER_SIZES.map((size) => `cylinder ${size}: ${scaleWords({ instrument: 'cylinder', size })}`),
  `buret: ${scaleWords({ instrument: 'buret' })}`,
  ...BEAKER_SIZES.map((beaker) => `beaker ${beaker}: ${scaleWords({ instrument: 'beaker', beaker })}`),
].join('; ')

const spacingWords = (choice: Omit<VolumeInstrument, 'beaker' | 'size'> & Partial<VolumeInstrument>) => {
  const { marks, numbers, standard } = scaleOptions({ size: '100', beaker: 'medium', ...choice })
  return `marks ${marks.join(', ')} (standard ${standard.marks}), numbers ${numbers.join(', ')} (standard ${standard.numbers})`
}

const spacings = [
  ...CYLINDER_SIZES.map((size) => `cylinder ${size}: ${spacingWords({ instrument: 'cylinder', size })}`),
  `buret: ${spacingWords({ instrument: 'buret' })}`,
  ...BEAKER_SIZES.map((beaker) => `beaker ${beaker}: ${spacingWords({ instrument: 'beaker', beaker })}`),
].join('; ')

export const volumeLinking = describeLinking(volumeSettings, {
  id: 'volume-reading',
  summary:
    'Pick the instrument with instrument (and its size with size or beaker), and the volume it shows with reading, in mL. The reading is rounded to one digit past the smallest mark and kept on the scale.',
  notes: [
    'size applies only to the graduated cylinder and beaker only to the beaker; a buret is always 50 mL and reads from 0 at the top.',
    `reading is rounded and clamped to the chosen instrument, with its standard marks: ${readingRanges}.`,
    `marks and numbers take only the spacings the chosen instrument offers, in mL; any other is its standard one, and so are numbers that don’t land on a mark or leave more than 20 marks between numbers: ${spacings}.`,
    'Finer or coarser marks change how far the reading goes. cm³ is the same size as mL, so unit never changes the reading.',
    'The magnifier is set with view for a cylinder or buret and with beakerView for a beaker (off by default, since beaker marks are coarse).',
  ],
  params: {
    instrument: { what: 'The volume instrument drawn.', values: 'cylinder: graduated cylinder; buret: 50 mL buret; beaker: beaker' },
    size: { what: 'The graduated cylinder’s capacity in mL.', when: 'instrument=cylinder' },
    beaker: { what: 'The beaker’s size.', when: 'instrument=beaker', values: 'small 50 mL, medium 250 mL, large 600 mL' },
    marks: { what: 'The mL between the smallest marks on the scale.', values: 'standard: the instrument’s usual marks; the others only where the instrument offers them (see notes)' },
    numbers: { what: 'The mL between numbered marks.', values: 'standard: the instrument’s usual numbers; none: the usual numbered marks drawn longer but without numbers, for students to work out; the others only where the instrument offers them (see notes)' },
    unit: { what: 'The unit printed on the instrument and in the answer key.', values: 'mL; cm3: cm³' },
    reading: { what: 'The volume the liquid shows, in mL (or cm³), read at the bottom of the meniscus.', values: 'Rounded and kept within the instrument’s scale (see notes)' },
    guide: { what: 'Draws a dotted line from the bottom of the meniscus across to the marks.', when: 'instrument is cylinder or buret' },
    view: { what: 'What the figure shows for a cylinder or buret.', when: 'instrument is cylinder or buret', values: MAGNIFIER_VIEW_WORDS },
    beakerView: { what: 'What the figure shows for a beaker.', when: 'instrument=beaker', values: MAGNIFIER_VIEW_WORDS },
    span: spanDoc(),
    tint: { what: 'The liquid’s color. Gray photocopies best.' },
    ...figureTextDocs('Reading: 43.6 mL'),
  },
  examples: [
    { shows: 'A 50 mL buret reading 23.47 mL, with a magnifier and the answer key.', settings: { instrument: 'buret', reading: 23.47, answerKey: true } },
    { shows: 'A 10 mL graduated cylinder reading 6.54 mL, with no magnifier.', settings: { instrument: 'cylinder', size: '10', reading: 6.54, view: 'whole' } },
    { shows: 'A 250 mL (medium) beaker of blue liquid at 175 mL, titled “Read the volume”.', settings: { instrument: 'beaker', beaker: 'medium', reading: 175, tint: 'blue', titleMode: 'text', title: 'Read the volume' } },
    {
      shows: 'A 25 cm³ graduated cylinder marked every 0.2 cm³ and numbered every 1 cm³, reading 18.64 cm³, with a dotted line at the meniscus.',
      settings: { size: '25', marks: '0.2', unit: 'cm3', reading: 18.64, guide: true },
    },
  ],
})
