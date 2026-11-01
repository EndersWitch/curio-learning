// Listed structures: molecules and ions with more than one central atom,
// whose formula alone doesn't say which atoms bond to which (see CONTEXT.md
// "Listed structure"). Each stores its skeleton by hand, with the atoms'
// flat positions in bond lengths (y down) and, where the real shape bends,
// shaped ones; the builder places the electrons, so each follows the
// structure rule and has its resonance structures like a built one.

export interface Listed {
  id: string
  /** what teachers call it, for the list and for typing it by name */
  names: string[]
  /** the formula as usually written */
  formula: string
  /** other ways of writing it that should find it */
  aliases?: string[]
  /** each atom and its flat position, in the order the formula is written */
  atoms: [string, number, number][]
  /** shaped positions, in the same order, where the shape isn't the flat drawing */
  shaped?: [number, number][]
  bonds: [number, number][]
  charge?: number
}

// Bent at an O or N: an atom 104.5° round from the bond it continues.
const BENT_X = 0.2504
const BENT_Y = 0.9681

export const LISTED: Listed[] = [
  {
    id: 'ethane',
    names: ['ethane'],
    formula: 'C2H6',
    aliases: ['CH3CH3', 'H3CCH3'],
    atoms: [['C', 0, 0], ['C', 1, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['H', 2, 0], ['H', 1, -1], ['H', 1, 1]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6], [1, 7]],
  },
  {
    id: 'ethene',
    names: ['ethene', 'ethylene'],
    formula: 'C2H4',
    aliases: ['CH2CH2', 'H2CCH2'],
    atoms: [['C', 0, 0], ['C', 1, 0], ['H', -0.5, -0.866], ['H', -0.5, 0.866], ['H', 1.5, -0.866], ['H', 1.5, 0.866]],
    bonds: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]],
  },
  {
    id: 'ethyne',
    names: ['ethyne', 'acetylene'],
    formula: 'C2H2',
    aliases: ['HCCH'],
    atoms: [['C', 0, 0], ['C', 1, 0], ['H', -1, 0], ['H', 2, 0]],
    bonds: [[0, 1], [0, 2], [1, 3]],
  },
  {
    id: 'methanol',
    names: ['methanol', 'methyl alcohol'],
    formula: 'CH3OH',
    aliases: ['CH4O'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['O', 1, 0], ['H', 2, 0]],
    shaped: [[0, 0], [-1, 0], [0, -1], [0, 1], [1, 0], [1 + BENT_X, BENT_Y]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5]],
  },
  {
    id: 'ethanol',
    names: ['ethanol', 'ethyl alcohol'],
    formula: 'C2H5OH',
    aliases: ['CH3CH2OH'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['C', 1, 0], ['H', 1, -1], ['H', 1, 1], ['O', 2, 0], ['H', 3, 0]],
    shaped: [[0, 0], [-1, 0], [0, -1], [0, 1], [1, 0], [1, -1], [1, 1], [2, 0], [2 + BENT_X, BENT_Y]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6], [4, 7], [7, 8]],
  },
  {
    id: 'dimethyl-ether',
    names: ['dimethyl ether', 'methoxymethane'],
    formula: 'CH3OCH3',
    aliases: ['H3COCH3'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['O', 1, 0], ['C', 2, 0], ['H', 3, 0], ['H', 2, -1], ['H', 2, 1]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [5, 6], [5, 7], [5, 8]],
  },
  {
    id: 'acetic-acid',
    names: ['acetic acid', 'ethanoic acid'],
    formula: 'CH3COOH',
    aliases: ['HC2H3O2', 'CH3CO2H'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['C', 1, 0], ['O', 1, -1], ['O', 2, 0], ['H', 3, 0]],
    shaped: [[0, 0], [-1, 0], [0, -1], [0, 1], [1, 0], [1.5, -0.866], [1.5, 0.866], [1.5 + 1, 0.866]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6], [6, 7]],
  },
  {
    id: 'acetate',
    names: ['acetate', 'ethanoate'],
    formula: 'CH3COO-',
    aliases: ['C2H3O2-', 'CH3CO2-'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['C', 1, 0], ['O', 1, -1], ['O', 2, 0]],
    shaped: [[0, 0], [-1, 0], [0, -1], [0, 1], [1, 0], [1.5, -0.866], [1.5, 0.866]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6]],
    charge: -1,
  },
  {
    id: 'formic-acid',
    names: ['formic acid', 'methanoic acid'],
    formula: 'HCOOH',
    aliases: ['HCO2H', 'CH2O2'],
    atoms: [['H', -1, 0], ['C', 0, 0], ['O', 0, -1], ['O', 1, 0], ['H', 2, 0]],
    shaped: [[-0.5, 0.866], [0, 0], [-0.5, -0.866], [1, 0], [1 + BENT_X, BENT_Y]],
    bonds: [[0, 1], [1, 2], [1, 3], [3, 4]],
  },
  {
    id: 'methylamine',
    names: ['methylamine', 'methanamine'],
    formula: 'CH3NH2',
    aliases: ['CH5N'],
    atoms: [['C', 0, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['N', 1, 0], ['H', 2, 0], ['H', 1, 1]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6]],
  },
  {
    id: 'hydrazine',
    names: ['hydrazine'],
    formula: 'N2H4',
    aliases: ['H2NNH2'],
    atoms: [['N', 0, 0], ['N', 1, 0], ['H', -1, 0], ['H', 0, 1], ['H', 2, 0], ['H', 1, 1]],
    bonds: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]],
  },
  {
    id: 'hydrogen-peroxide',
    names: ['hydrogen peroxide'],
    formula: 'H2O2',
    aliases: ['HOOH'],
    atoms: [['H', -1, 0], ['H', 2, 0], ['O', 0, 0], ['O', 1, 0]],
    shaped: [[-BENT_X, BENT_Y], [1 + BENT_X, -BENT_Y], [0, 0], [1, 0]],
    bonds: [[0, 2], [2, 3], [3, 1]],
  },
  {
    id: 'nitrous-oxide',
    names: ['nitrous oxide', 'dinitrogen monoxide'],
    formula: 'N2O',
    aliases: ['NNO'],
    atoms: [['N', 0, 0], ['N', 1, 0], ['O', 2, 0]],
    bonds: [[0, 1], [1, 2]],
  },
  {
    id: 'hypochlorous-acid',
    names: ['hypochlorous acid'],
    formula: 'HOCl',
    aliases: ['HClO'],
    atoms: [['H', -1, 0], ['O', 0, 0], ['Cl', 1, 0]],
    shaped: [[-BENT_X, BENT_Y], [0, 0], [1, 0]],
    bonds: [[0, 1], [1, 2]],
  },
  {
    id: 'nitrous-acid',
    names: ['nitrous acid'],
    formula: 'HNO2',
    aliases: ['HONO'],
    atoms: [['H', -1, 0], ['N', 1, 0], ['O', 0, 0], ['O', 2, 0]],
    shaped: [[-BENT_X, BENT_Y], [1, 0], [0, 0], [1.5, -0.866]],
    bonds: [[0, 2], [2, 1], [1, 3]],
  },
  {
    id: 'nitric-acid',
    names: ['nitric acid'],
    formula: 'HNO3',
    aliases: ['HONO2'],
    atoms: [['H', -1, 0], ['N', 1, 0], ['O', 0, 0], ['O', 2, 0], ['O', 1, -1]],
    shaped: [[-BENT_X, BENT_Y], [1, 0], [0, 0], [1.5, 0.866], [1.5, -0.866]],
    bonds: [[0, 2], [2, 1], [1, 3], [1, 4]],
  },
  {
    id: 'carbonic-acid',
    names: ['carbonic acid'],
    formula: 'H2CO3',
    atoms: [['H', -2, 0], ['H', 2, 0], ['C', 0, 0], ['O', -1, 0], ['O', 1, 0], ['O', 0, -1]],
    bonds: [[0, 3], [1, 4], [2, 3], [2, 4], [2, 5]],
  },
  {
    id: 'hydrogen-carbonate',
    names: ['hydrogen carbonate', 'bicarbonate'],
    formula: 'HCO3-',
    atoms: [['H', -2, 0], ['C', 0, 0], ['O', -1, 0], ['O', 1, 0], ['O', 0, -1]],
    bonds: [[0, 2], [1, 2], [1, 3], [1, 4]],
    charge: -1,
  },
  {
    id: 'sulfuric-acid',
    names: ['sulfuric acid'],
    formula: 'H2SO4',
    atoms: [['H', -2, 0], ['H', 2, 0], ['S', 0, 0], ['O', -1, 0], ['O', 1, 0], ['O', 0, -1], ['O', 0, 1]],
    bonds: [[0, 3], [1, 4], [2, 3], [2, 4], [2, 5], [2, 6]],
  },
  {
    id: 'phosphoric-acid',
    names: ['phosphoric acid'],
    formula: 'H3PO4',
    atoms: [['H', -2, 0], ['H', 2, 0], ['H', 0, 2], ['P', 0, 0], ['O', -1, 0], ['O', 1, 0], ['O', 0, 1], ['O', 0, -1]],
    bonds: [[0, 4], [1, 5], [2, 6], [3, 4], [3, 5], [3, 6], [3, 7]],
  },
  {
    id: 'perchloric-acid',
    names: ['perchloric acid'],
    formula: 'HClO4',
    atoms: [['H', -2, 0], ['Cl', 0, 0], ['O', -1, 0], ['O', 1, 0], ['O', 0, -1], ['O', 0, 1]],
    bonds: [[0, 2], [1, 2], [1, 3], [1, 4], [1, 5]],
  },
]
