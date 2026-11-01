// Mass Reading's settings, as they appear in the page address.

import { figureTextFields } from '$lib/shared/figureText'
import { MAGNIFIER_VIEW_NAMES } from '$lib/shared/magnify'
import { choice, defineSettings, number } from '$lib/shared/settings'
import { PAN_OBJECTS } from './panObject'
import { PAN_CONTENTS, digitalBalance, randomMass, roundMass, type DecimalPlaces } from './digital'
import { TRIPLE_BEAM_CAPACITY, TRIPLE_BEAM_DECIMALS, randomTripleBeamMass, roundTripleBeam } from './tripleBeam'

export const MASS_INSTRUMENTS = ['triple-beam', 'digital'] as const
export type MassInstrument = (typeof MASS_INSTRUMENTS)[number]

/** No magnifier-only view: nobody wants a mass figure without the balance in
 *  it. "beams" is the balance cropped to its beams, riders and the block
 *  joining them. */
export const MASS_VIEWS = ['both', 'whole', 'beams'] as const
export type MassView = (typeof MASS_VIEWS)[number]

export const MASS_VIEW_NAMES: Record<MassView, string> = {
  both: MAGNIFIER_VIEW_NAMES.both,
  whole: MAGNIFIER_VIEW_NAMES.whole,
  beams: 'Beams only',
}

export const massSettings = defineSettings(
  {
    instrument: choice(MASS_INSTRUMENTS, 'triple-beam'),
    decimals: number({ min: 1, max: 4, fallback: 2 }),
    /** the digital balance's own contents: a weigh boat, a beaker or nothing */
    pan: choice(PAN_CONTENTS, 'boat'),
    /** an object from Volume by Displacement on either balance's pan, in
     *  place of the digital balance's contents */
    object: choice(PAN_OBJECTS, 'none'),
    marbles: number({ min: 1, max: 5, fallback: 2 }),
    mass: number({ min: 0, max: 1000, fallback: 24.73 }),
    view: choice(MASS_VIEWS, 'both'),
    span: number({ min: 1, max: 6, fallback: 3 }),
    ...figureTextFields(),
  },
  (s) => {
    const fixed = { ...s, decimals: Math.round(s.decimals), marbles: Math.round(s.marbles), span: Math.round(s.span) }
    return { ...fixed, mass: massRules(fixed).round(s.mass) }
  },
)

export type MassSettings = typeof massSettings.defaults

interface MassRules {
  decimals: number
  capacity: number
  round: (grams: number) => number
  random: () => number
}

/** What counts as a mass on the chosen balance. */
export function massRules(s: { instrument: MassInstrument; decimals: number }): MassRules {
  if (s.instrument === 'triple-beam') {
    return { decimals: TRIPLE_BEAM_DECIMALS, capacity: TRIPLE_BEAM_CAPACITY, round: roundTripleBeam, random: () => randomTripleBeamMass() }
  }
  const balance = digitalBalance(s.decimals as DecimalPlaces)
  return {
    decimals: balance.decimals,
    capacity: balance.capacity,
    round: (g: number) => roundMass(balance, g),
    random: () => randomMass(balance),
  }
}

export const massText = (s: MassSettings) => s.mass.toFixed(massRules(s).decimals)

/** The answer key line, e.g. "Mass: 24.73 g". */
export const answerLine = (s: MassSettings) => `Mass: ${massText(s)} g`
