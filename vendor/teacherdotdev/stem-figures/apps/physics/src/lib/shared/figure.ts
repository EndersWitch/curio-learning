// How every physics figure looks. Figures are black line art by default, so
// they survive a black-and-white photocopy: nothing is told apart by color
// alone (magnet poles have letters and shading, field lines have arrows). The
// color switch is for slides.

export const SANS = 'Arial, Helvetica, sans-serif'
export const SERIF = "'Times New Roman', Times, serif"

export interface Palette {
  /** Outlines and wires. */
  ink: string
  /** Parts behind others, like the back of a coil. */
  hidden: string
  /** Vectors. */
  vector: string
  /** A force's components, lighter than the force. */
  component: string
  /** Field lines. */
  field: string
  /** Coil wire. */
  wire: string
  /** A magnet's north half, and the letter on it. */
  north: string
  onNorth: string
  /** A magnet's south half, and the letter on it. */
  south: string
  onSouth: string
  /** Objects like blocks and carts. */
  object: string
  /** Solid ground and ramps. */
  surface: string
}

const INK = '#111827'

export function palette(color: boolean): Palette {
  if (!color) {
    return {
      ink: INK,
      hidden: '#9ca3af',
      vector: INK,
      component: '#6b7280',
      field: '#4b5563',
      wire: INK,
      north: '#4b5563',
      onNorth: '#ffffff',
      south: '#ffffff',
      onSouth: INK,
      object: '#e5e7eb',
      surface: '#f3f4f6',
    }
  }
  return {
    ink: INK,
    hidden: '#9ca3af',
    vector: '#7c3aed',
    component: '#a78bfa',
    field: '#0f766e',
    wire: '#b45309',
    north: '#dc2626',
    onNorth: '#ffffff',
    south: '#2563eb',
    onSouth: '#ffffff',
    object: '#bfdbfe',
    surface: '#fef3c7',
  }
}

/** The transform that mirrors a figure `width` wide, left to right. Text is
 *  drawn outside it, at mirrorX, so it stays readable. */
export const mirrorTransform = (mirror: boolean, width: number) => (mirror ? `matrix(-1 0 0 1 ${width} 0)` : undefined)
export const mirrorX = (mirror: boolean, width: number, x: number) => (mirror ? width - x : x)
export const mirrorAnchor = (mirror: boolean, anchor: 'start' | 'middle' | 'end') =>
  !mirror || anchor === 'middle' ? anchor : anchor === 'start' ? 'end' : 'start'
