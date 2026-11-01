// The elements an orbital diagram can show, by atomic number, and the real
// ground states that don't follow the filling order (see CONTEXT.md
// "Exception").

const TABLE = `H Hydrogen,He Helium,Li Lithium,Be Beryllium,B Boron,C Carbon,N Nitrogen,O Oxygen,F Fluorine,Ne Neon,
Na Sodium,Mg Magnesium,Al Aluminum,Si Silicon,P Phosphorus,S Sulfur,Cl Chlorine,Ar Argon,K Potassium,Ca Calcium,
Sc Scandium,Ti Titanium,V Vanadium,Cr Chromium,Mn Manganese,Fe Iron,Co Cobalt,Ni Nickel,Cu Copper,Zn Zinc,
Ga Gallium,Ge Germanium,As Arsenic,Se Selenium,Br Bromine,Kr Krypton,Rb Rubidium,Sr Strontium,Y Yttrium,Zr Zirconium,
Nb Niobium,Mo Molybdenum,Tc Technetium,Ru Ruthenium,Rh Rhodium,Pd Palladium,Ag Silver,Cd Cadmium,In Indium,Sn Tin,
Sb Antimony,Te Tellurium,I Iodine,Xe Xenon,Cs Cesium,Ba Barium,La Lanthanum,Ce Cerium,Pr Praseodymium,Nd Neodymium,
Pm Promethium,Sm Samarium,Eu Europium,Gd Gadolinium,Tb Terbium,Dy Dysprosium,Ho Holmium,Er Erbium,Tm Thulium,Yb Ytterbium,
Lu Lutetium,Hf Hafnium,Ta Tantalum,W Tungsten,Re Rhenium,Os Osmium,Ir Iridium,Pt Platinum,Au Gold,Hg Mercury,
Tl Thallium,Pb Lead,Bi Bismuth,Po Polonium,At Astatine,Rn Radon,Fr Francium,Ra Radium,Ac Actinium,Th Thorium,
Pa Protactinium,U Uranium,Np Neptunium,Pu Plutonium,Am Americium,Cm Curium,Bk Berkelium,Cf Californium,Es Einsteinium,Fm Fermium,
Md Mendelevium,No Nobelium,Lr Lawrencium,Rf Rutherfordium,Db Dubnium,Sg Seaborgium,Bh Bohrium,Hs Hassium,Mt Meitnerium,Ds Darmstadtium,
Rg Roentgenium,Cn Copernicium,Nh Nihonium,Fl Flerovium,Mc Moscovium,Lv Livermorium,Ts Tennessine,Og Oganesson`

export interface Element {
  z: number
  symbol: string
  name: string
}

export const ELEMENTS: Element[] = TABLE.split(',').map((entry, i) => {
  const [symbol, name] = entry.trim().split(' ')
  return { z: i + 1, symbol, name }
})

export const MAX_Z = ELEMENTS.length

export const element = (z: number) => ELEMENTS[z - 1]

/** Atomic numbers of the noble gases, whose electrons make a noble gas core. */
export const NOBLE_GASES = [2, 10, 18, 36, 54, 86, 118]

/** Ground states that differ from the filling order, as the sublevels that
 *  differ from it (NIST). Every other sublevel is as the filling order has it. */
export const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { '4s': 1, '3d': 5 }, // Cr
  29: { '4s': 1, '3d': 10 }, // Cu
  41: { '5s': 1, '4d': 4 }, // Nb
  42: { '5s': 1, '4d': 5 }, // Mo
  44: { '5s': 1, '4d': 7 }, // Ru
  45: { '5s': 1, '4d': 8 }, // Rh
  46: { '5s': 0, '4d': 10 }, // Pd
  47: { '5s': 1, '4d': 10 }, // Ag
  57: { '4f': 0, '5d': 1 }, // La
  58: { '4f': 1, '5d': 1 }, // Ce
  64: { '4f': 7, '5d': 1 }, // Gd
  78: { '6s': 1, '5d': 9 }, // Pt
  79: { '6s': 1, '5d': 10 }, // Au
  89: { '5f': 0, '6d': 1 }, // Ac
  90: { '5f': 0, '6d': 2 }, // Th
  91: { '5f': 2, '6d': 1 }, // Pa
  92: { '5f': 3, '6d': 1 }, // U
  93: { '5f': 4, '6d': 1 }, // Np
  96: { '5f': 7, '6d': 1 }, // Cm
  103: { '6d': 0, '7p': 1 }, // Lr
}
