// The DNA ladders a ladder lane can hold: real products, with each band's
// size and how much DNA is in it, from the makers' data sheets. A band with
// more DNA stains darker, so each ladder's reference bands stand out as they
// do on a real gel.

export const LADDER_IDS = ['100bp', '1kb', 'lambda'] as const
export type LadderId = (typeof LADDER_IDS)[number]

export interface Ladder {
  id: LadderId
  name: string
  /** the bands, largest first: size in bp and ng of DNA in a 0.5 µg load */
  bands: [bp: number, ng: number][]
}

export const LADDERS: Record<LadderId, Ladder> = {
  // NEB 100 bp DNA Ladder (N3231): the 500 and 517 bp pieces run together
  // on most gels, and with 1,000 bp are the bright reference bands.
  '100bp': {
    id: '100bp',
    name: '100 bp ladder',
    bands: [
      [1517, 45], [1200, 35], [1000, 95], [900, 27], [800, 24], [700, 21], [600, 18],
      [517, 48.5], [500, 48.5], [400, 38], [300, 29], [200, 25], [100, 48],
    ],
  },
  // NEB 1 kb DNA Ladder (N3232), with the bright 3.0 kb reference band.
  '1kb': {
    id: '1kb',
    name: '1 kb ladder',
    bands: [
      [10000, 42], [8000, 42], [6000, 50], [5000, 42], [4000, 33], [3000, 125], [2000, 48], [1500, 36], [1000, 42], [500, 21],
    ],
  },
  // λ DNA cut with HindIII: one copy of each piece of the 48,502 bp genome,
  // so the DNA in each band goes with its size and the small ones are faint.
  lambda: {
    id: 'lambda',
    name: 'λ DNA / HindIII',
    bands: [
      [23130, 238], [9416, 97], [6557, 68], [4361, 45], [2322, 24], [2027, 21], [564, 5.8], [125, 1.3],
    ],
  },
}

/** A ladder's bands as drawn: each one's size and its amount of DNA against
 *  the ladder's average band, so a typical band is 1. */
export function ladderBands(id: LadderId) {
  const { bands } = LADDERS[id]
  const average = bands.reduce((sum, [, ng]) => sum + ng, 0) / bands.length
  return bands.map(([bp, ng]) => ({ bp, amount: ng / average }))
}
