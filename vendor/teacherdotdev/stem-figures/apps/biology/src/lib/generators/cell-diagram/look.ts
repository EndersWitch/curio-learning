// The two looks a cell can be drawn in: color, like a textbook figure, or
// black line art on white, which photocopies cleanly and can be colored in.
// Each organelle has a fill, an edge (its outline) and, for some, a detail
// color (ribosome dots, thylakoid stacks, chromatin).

export const STYLES = ['color', 'bw'] as const
export type Style = (typeof STYLES)[number]

export const STYLE_NAMES: Record<Style, string> = { color: 'Color', bw: 'Black and white' }

export interface Paint {
  fill: string
  edge: string
  detail: string
}

export type Look = Record<
  | 'cytoplasm' | 'membrane' | 'wall' | 'capsule' | 'nucleoplasm' | 'envelope' | 'nucleolus' | 'chromatin'
  | 'rough' | 'smooth' | 'golgi' | 'vesicle' | 'mitochondrion' | 'matrix' | 'chloroplast' | 'granum'
  | 'vacuole' | 'lysosome' | 'peroxisome' | 'centriole' | 'ribosome' | 'cytoskeleton' | 'nucleoid' | 'appendage',
  Paint
> & { ink: string; leader: string }

const paint = (fill: string, edge: string, detail = edge): Paint => ({ fill, edge, detail })

export const COLOR: Look = {
  cytoplasm: paint('#fdf4e3', '#b9772c'),
  membrane: paint('#f3c98b', '#a8641e'),
  wall: paint('#bfe09a', '#5d8f34'),
  capsule: paint('#f4ead0', '#a99158'),
  nucleoplasm: paint('#ece1f6', '#6b3fa0', '#9a73c4'),
  envelope: paint('#cbb2e6', '#5e3591'),
  nucleolus: paint('#6c3d9a', '#46226a'),
  chromatin: paint('none', '#8f67bd'),
  rough: paint('#cfe2f6', '#3b6ea6', '#22416b'),
  smooth: paint('#d3eeee', '#2f8a8c'),
  golgi: paint('#fbd58f', '#bb7a12'),
  vesicle: paint('#fde3ae', '#bb7a12'),
  mitochondrion: paint('#fde0cc', '#bf5130'),
  matrix: paint('#f6a889', '#bf5130'),
  chloroplast: paint('#c6e7a8', '#3c7a29', '#2f6420'),
  granum: paint('#5f9f3f', '#2f5f1f'),
  vacuole: paint('#d7ecfa', '#4c87b9'),
  lysosome: paint('#f7cbd6', '#b2416a', '#b2416a'),
  peroxisome: paint('#fff0a6', '#b48f22', '#c99a12'),
  centriole: paint('#ddd0c9', '#6a4a3c'),
  ribosome: paint('#2f2b55', '#2f2b55'),
  cytoskeleton: paint('none', '#a3aab5'),
  nucleoid: paint('#efe4f7', '#7a3f9e'),
  appendage: paint('none', '#8b6a2c'),
  ink: '#111',
  leader: '#222',
}

const line = paint('#fff', '#111', '#111')

/** Black and white: every fill white and every line black, so nothing is
 *  lost to a photocopier's gray. */
export const BW: Look = {
  ...(Object.fromEntries(Object.keys(COLOR).map((k) => [k, line])) as unknown as Look),
  chromatin: paint('none', '#111'),
  cytoskeleton: paint('none', '#555'),
  appendage: paint('none', '#111'),
  granum: paint('#fff', '#111'),
  ribosome: paint('#111', '#111'),
  ink: '#111',
  leader: '#111',
}

export const lookFor = (style: Style) => (style === 'bw' ? BW : COLOR)
