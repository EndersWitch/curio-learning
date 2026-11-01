// Every choice the teacher makes on the Coil and Magnet Generator, with its
// default: the most common textbook version, a coil of 8 turns with a bar
// magnet approaching it north pole first. Beside the coil is a magnet, a
// battery (making the coil an electromagnet) or nothing.

import { bool, choice, defineSettings, int, label } from '$lib/shared/settings'

export const coilSettings = defineSettings({
  turns: int(8, 1, 20),
  source: choice('magnet', ['magnet', 'battery', 'none']),
  /** The battery's positive terminal, before mirroring. */
  batteryPlus: choice('left', ['left', 'right']),
  /** The magnet's pole nearest the coil. */
  facing: choice('N', ['N', 'S']),
  distance: choice('outside', ['outside', 'mouth', 'inside']),
  motion: choice('toward', ['toward', 'away', 'none']),
  motionLabel: label({ mode: 'text', text: 'v' }),
  north: label({ mode: 'text', text: 'N' }),
  south: label({ mode: 'text', text: 'S' }),
  /** Whose field lines to draw. With a battery, any choice but none shows the coil's. */
  fieldLines: choice('magnet', ['magnet', 'coil', 'both', 'none']),
  /** Field lines above the magnet or coil (and as many below). */
  lineCount: int(4, 1, 8),
  meter: bool(false),
  /** Which way the meter's needle leans, as the students see it (mirroring doesn't flip it). */
  needle: choice('center', ['left', 'center', 'right', 'blank']),
  /** Arrows on the front of the coil showing which way the current flows. With a battery they follow it. */
  current: choice('none', ['none', 'up', 'down']),
  mirror: bool(false),
  color: bool(false),
})

export type CoilSettings = typeof coilSettings.defaults
