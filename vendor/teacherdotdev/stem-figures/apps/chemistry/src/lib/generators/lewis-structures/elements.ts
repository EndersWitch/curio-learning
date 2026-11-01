// The elements Lewis Structures can draw: the main-group elements through
// period 5. Transition metals aren't drawn, and the metals of groups 1 and 2
// (other than Be) only form ionic compounds, which a Lewis structure of one
// molecule or ion doesn't show, so they're drawn only as atoms and ions on
// their own.

export interface Element {
  symbol: string
  /** valence electrons */
  valence: number
  period: number
  /** Pauling electronegativity; noble gases without one never go in the middle */
  electronegativity: number
  /** only forms ionic compounds */
  ionic?: boolean
}

const TABLE: [string, number, number, number, boolean?][] = [
  ['H', 1, 1, 2.2],
  ['He', 2, 1, Infinity],
  ['Li', 1, 2, 0.98, true],
  ['Be', 2, 2, 1.57],
  ['B', 3, 2, 2.04],
  ['C', 4, 2, 2.55],
  ['N', 5, 2, 3.04],
  ['O', 6, 2, 3.44],
  ['F', 7, 2, 3.98],
  ['Ne', 8, 2, Infinity],
  ['Na', 1, 3, 0.93, true],
  ['Mg', 2, 3, 1.31, true],
  ['Al', 3, 3, 1.61],
  ['Si', 4, 3, 1.9],
  ['P', 5, 3, 2.19],
  ['S', 6, 3, 2.58],
  ['Cl', 7, 3, 3.16],
  ['Ar', 8, 3, Infinity],
  ['K', 1, 4, 0.82, true],
  ['Ca', 2, 4, 1.0, true],
  ['Ga', 3, 4, 1.81],
  ['Ge', 4, 4, 2.01],
  ['As', 5, 4, 2.18],
  ['Se', 6, 4, 2.55],
  ['Br', 7, 4, 2.96],
  ['Kr', 8, 4, 3.0],
  ['Rb', 1, 5, 0.82, true],
  ['Sr', 2, 5, 0.95, true],
  ['In', 3, 5, 1.78],
  ['Sn', 4, 5, 1.96],
  ['Sb', 5, 5, 2.05],
  ['Te', 6, 5, 2.1],
  ['I', 7, 5, 2.66],
  ['Xe', 8, 5, 2.6],
]

export const ELEMENTS: Record<string, Element> = Object.fromEntries(
  TABLE.map(([symbol, valence, period, electronegativity, ionic]) => [symbol, { symbol, valence, period, electronegativity, ...(ionic ? { ionic } : {}) }]),
)

/** Transition metals, and the other elements that exist but aren't drawn,
 *  so a typed "Fe" gets a better message than "not an element". */
export const TRANSITION_METALS = new Set(
  (
    'Sc Ti V Cr Mn Fe Co Ni Cu Zn Y Zr Nb Mo Tc Ru Rh Pd Ag Cd La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu ' +
    'Hf Ta W Re Os Ir Pt Au Hg Ac Th Pa U'
  ).split(' '),
)
export const UNDRAWN = new Set('Cs Ba Fr Ra Tl Pb Bi Po At Rn'.split(' '))

export const HALOGENS = new Set(['F', 'Cl', 'Br', 'I'])

/** How many electrons an atom has room for around it: H only has a duet. */
export const octetOf = (symbol: string) => (symbol === 'H' || symbol === 'He' ? 2 : 8)

/** Atoms in period 3 and lower can hold more than eight electrons. */
export const canExpand = (symbol: string) => ELEMENTS[symbol].period >= 3
