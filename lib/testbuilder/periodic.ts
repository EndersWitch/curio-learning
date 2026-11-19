// Periods 1 to 5 of the periodic table, with the position of each element.
export interface El { z: number; sym: string; name: string; row: number; col: number; group: number }
const NAMES = 'Hydrogen,Helium,Lithium,Beryllium,Boron,Carbon,Nitrogen,Oxygen,Fluorine,Neon,Sodium,Magnesium,Aluminium,Silicon,Phosphorus,Sulfur,Chlorine,Argon,Potassium,Calcium,Scandium,Titanium,Vanadium,Chromium,Manganese,Iron,Cobalt,Nickel,Copper,Zinc,Gallium,Germanium,Arsenic,Selenium,Bromine,Krypton,Rubidium,Strontium,Yttrium,Zirconium,Niobium,Molybdenum,Technetium,Ruthenium,Rhodium,Palladium,Silver,Cadmium,Indium,Tin,Antimony,Tellurium,Iodine,Xenon'.split(',')
const SYMS = 'H,He,Li,Be,B,C,N,O,F,Ne,Na,Mg,Al,Si,P,S,Cl,Ar,K,Ca,Sc,Ti,V,Cr,Mn,Fe,Co,Ni,Cu,Zn,Ga,Ge,As,Se,Br,Kr,Rb,Sr,Y,Zr,Nb,Mo,Tc,Ru,Rh,Pd,Ag,Cd,In,Sn,Sb,Te,I,Xe'.split(',')

function pos(z: number): { row: number; group: number } {
  if (z === 1) return { row: 1, group: 1 }
  if (z === 2) return { row: 1, group: 18 }
  if (z <= 4) return { row: 2, group: z - 2 }
  if (z <= 10) return { row: 2, group: z + 8 }
  if (z <= 12) return { row: 3, group: z - 10 }
  if (z <= 18) return { row: 3, group: z - 0 }
  if (z <= 36) return { row: 4, group: z - 18 }
  return { row: 5, group: z - 36 }
}
export const ELEMENTS: El[] = SYMS.map((sym, i) => {
  const { row, group } = pos(i + 1)
  return { z: i + 1, sym, name: NAMES[i]!, row, col: group, group }
})
export const ELEMENT_ROWS = 5
export const ELEMENT_COLS = 18

export const PERIODIC_GROUPS: { id: string; name: string; group: number; plural: string; skipH?: boolean; minGrade: number }[] = [
  { id: 'alkali', name: 'alkali metals', plural: 'alkali metals', group: 1, skipH: true, minGrade: 8 },
  { id: 'alkaline', name: 'alkaline earth metals', plural: 'alkaline earth metals', group: 2, minGrade: 9 },
  { id: 'halogens', name: 'halogens', plural: 'halogens', group: 17, minGrade: 8 },
  { id: 'noble', name: 'noble gases', plural: 'noble gases', group: 18, minGrade: 8 },
]
