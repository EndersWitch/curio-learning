// Micropipette Reading's settings, as they appear in the page address. The
// volume is kept in µL, always one the chosen pipette can be set to.

import { figureTextFields } from '$shared/figureText'
import { bool, choice, defineSettings, number } from '$shared/settings'
import { MODELS, canSet, digitsFor, pipette, tidyVolume, volumeText } from './pipette'

/** How the parts are labeled: by name, with blank lines for students, or not at all. */
export const PART_LABELS = ['none', 'names', 'blank'] as const
export type PartLabels = (typeof PART_LABELS)[number]

export const pipetteSettings = defineSettings(
  {
    model: choice(MODELS, 'P20'),
    /** the volume it's set to, in µL */
    volume: number({ min: 0, max: 1000, fallback: 12.5 }),
    tip: bool(true),
    /** red wheels in red, or all in black for photocopying */
    color: bool(true),
    /** a line across the window where the red wheels start */
    decimalLine: bool(true),
    /** the size printed above the window */
    showModel: bool(true),
    parts: choice(PART_LABELS, 'none'),
    /** a line under the figure for students to write the volume on */
    writeIn: bool(false),
    ...figureTextFields(),
  },
  // A volume the pipette can't be set to (from an edited link, say) becomes the nearest it can.
  (s) => ({ ...s, volume: canSet(pipette(s.model), s.volume) ? s.volume : tidyVolume(pipette(s.model), s.volume) }),
)

export type PipetteSettings = typeof pipetteSettings.defaults

/** The digits as the window shows them, "1-2-5". */
export const digitsText = (s: PipetteSettings) => digitsFor(pipette(s.model), s.volume).join('-')

/** The answer key: "Volume: 12.5 µL". */
export const answerLine = (s: PipetteSettings) => `Volume: ${volumeText(pipette(s.model), s.volume)}`

/** The line under the figure: the answer, a blank for students, or nothing. */
export function underLine(s: PipetteSettings) {
  if (s.answerKey) return answerLine(s)
  if (s.writeIn) return 'Volume: ____________ µL'
  return ''
}
