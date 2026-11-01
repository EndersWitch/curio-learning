// Mitosis & Meiosis' colors. In color, each homologous pair has its own hue,
// dark for the maternal chromosome and light for the paternal one. In black
// and white, maternal is solid and paternal is white inside a dark edge, so
// a photocopy keeps them apart; pairs differ by size and centromere.

import type { Origin } from './model'

export const INK = '#1f2328'

const HUES = [
  { m: '#1d4ed8', p: '#93c5fd' }, // blue
  { m: '#c2410c', p: '#fdba74' }, // orange
  { m: '#047857', p: '#6ee7b7' }, // green
  { m: '#7e22ce', p: '#d8b4fe' }, // purple
]

export interface Palette {
  ink: string
  cytoplasm: string
  wall: string
  nucleus: string
  nucleolus: string
  fiber: string
  /** a chromatid's fill, by its pair and whose DNA it is */
  chromatid: (pair: number, origin: Origin) => string
}

export function paletteFor(ink: 'color' | 'bw', cell: 'animal' | 'plant'): Palette {
  if (ink === 'bw')
    return {
      ink: INK,
      cytoplasm: cell === 'plant' ? '#f7f7f7' : '#ffffff',
      wall: '#cfcfcf',
      nucleus: '#f3f3f3',
      nucleolus: '#6b6b6b',
      fiber: '#5c5c5c',
      // dark gray rather than black, so the edge between sister chromatids shows
      chromatid: (_, origin) => (origin === 'm' ? '#555555' : '#ffffff'),
    }
  return {
    ink: INK,
    cytoplasm: cell === 'plant' ? '#f2f8ea' : '#fff6eb',
    wall: '#c7dca8',
    nucleus: '#f1eef9',
    nucleolus: '#8f84ad',
    fiber: '#7c8594',
    chromatid: (pair, origin) => HUES[pair % HUES.length][origin],
  }
}
