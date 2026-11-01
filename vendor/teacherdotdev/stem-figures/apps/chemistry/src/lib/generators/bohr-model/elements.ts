// The elements by atomic number, each one's mass number, and an atom or
// ion's real ground-state electrons per shell, which is what Fill and Charge
// set (see CONTEXT.md "Bohr models"). This, with the neutral atom's shells
// the gained and lost electrons are worked out against, is all the chemistry
// the generator knows; nothing it draws is checked against it.

import { SUBLEVELS, ionConfiguration } from '../orbital-diagram/configuration'

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

/** The element with `z` protons, if there is one. */
export const element = (z: number): Element | undefined => ELEMENTS[z - 1]

/** Each element's mass number, by atomic number: its standard atomic weight
 *  rounded to a whole number, or for an element with no stable isotope the
 *  bracketed mass number periodic tables show (IUPAC). */
const MASS_NUMBERS = [
  1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40,
  45, 48, 51, 52, 55, 56, 59, 59, 64, 65, 70, 73, 75, 79, 80, 84, 85, 88, 89, 91,
  93, 96, 98, 101, 103, 106, 108, 112, 115, 119, 122, 128, 127, 131, 133, 137, 139, 140, 141, 144,
  145, 150, 152, 157, 159, 163, 165, 167, 169, 173, 175, 178, 181, 184, 186, 190, 192, 195, 197, 201,
  204, 207, 209, 209, 210, 222, 223, 226, 227, 232, 231, 238, 237, 244, 243, 247, 247, 251, 252, 257,
  258, 259, 266, 267, 268, 269, 270, 269, 278, 281, 282, 285, 286, 289, 290, 293, 294, 294,
]

/** The mass number of the element with `z` protons (Cl is 35), if there is one. */
export const massNumber = (z: number): number | undefined => (element(z) ? MASS_NUMBERS[z - 1] : undefined)

/** The charges Charge can be set to. */
export const MIN_CHARGE = -4
export const MAX_CHARGE = 8

/** The charge nearest `charge` that an ion of the element with `z` protons
 *  can have: at least 0 electrons, and no more than the heaviest element's. */
export const ionCharge = (z: number, charge: number) =>
  Math.min(z, MAX_CHARGE, Math.max(z - MAX_Z, MIN_CHARGE, Math.round(charge)))

/** An atom or ion's ground-state electrons per shell, innermost first, up to
 *  its outermost occupied shell, from the same configuration an orbital
 *  diagram draws (Fe is [2, 8, 14, 2] and Fe²⁺ [2, 8, 14]; Na⁺ is [2, 8]).
 *  An ion with no electrons has one empty shell. Undefined when no element
 *  has `z` protons. */
export function groundStateShells(z: number, charge = 0): number[] | undefined {
  if (!element(z)) return undefined
  const shells: number[] = [0]
  for (const [name, electrons] of Object.entries(ionConfiguration(z, ionCharge(z, charge)))) {
    const n = SUBLEVELS[name].n
    while (shells.length < n) shells.push(0)
    shells[n - 1] += electrons
  }
  while (shells.length > 1 && !shells[shells.length - 1]) shells.pop()
  return shells
}
