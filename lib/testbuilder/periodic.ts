// All 118 elements with their place in the table. Lanthanides and actinides sit in rows 9 and 10 (row 8 is a gap), with group 0.
export interface El { z: number; sym: string; name: string; row: number; col: number; group: number }
const NAMES = 'Hydrogen,Helium,Lithium,Beryllium,Boron,Carbon,Nitrogen,Oxygen,Fluorine,Neon,Sodium,Magnesium,Aluminium,Silicon,Phosphorus,Sulfur,Chlorine,Argon,Potassium,Calcium,Scandium,Titanium,Vanadium,Chromium,Manganese,Iron,Cobalt,Nickel,Copper,Zinc,Gallium,Germanium,Arsenic,Selenium,Bromine,Krypton,Rubidium,Strontium,Yttrium,Zirconium,Niobium,Molybdenum,Technetium,Ruthenium,Rhodium,Palladium,Silver,Cadmium,Indium,Tin,Antimony,Tellurium,Iodine,Xenon,Caesium,Barium,Lanthanum,Cerium,Praseodymium,Neodymium,Promethium,Samarium,Europium,Gadolinium,Terbium,Dysprosium,Holmium,Erbium,Thulium,Ytterbium,Lutetium,Hafnium,Tantalum,Tungsten,Rhenium,Osmium,Iridium,Platinum,Gold,Mercury,Thallium,Lead,Bismuth,Polonium,Astatine,Radon,Francium,Radium,Actinium,Thorium,Protactinium,Uranium,Neptunium,Plutonium,Americium,Curium,Berkelium,Californium,Einsteinium,Fermium,Mendelevium,Nobelium,Lawrencium,Rutherfordium,Dubnium,Seaborgium,Bohrium,Hassium,Meitnerium,Darmstadtium,Roentgenium,Copernicium,Nihonium,Flerovium,Moscovium,Livermorium,Tennessine,Oganesson'.split(',')
const SYMS = 'H,He,Li,Be,B,C,N,O,F,Ne,Na,Mg,Al,Si,P,S,Cl,Ar,K,Ca,Sc,Ti,V,Cr,Mn,Fe,Co,Ni,Cu,Zn,Ga,Ge,As,Se,Br,Kr,Rb,Sr,Y,Zr,Nb,Mo,Tc,Ru,Rh,Pd,Ag,Cd,In,Sn,Sb,Te,I,Xe,Cs,Ba,La,Ce,Pr,Nd,Pm,Sm,Eu,Gd,Tb,Dy,Ho,Er,Tm,Yb,Lu,Hf,Ta,W,Re,Os,Ir,Pt,Au,Hg,Tl,Pb,Bi,Po,At,Rn,Fr,Ra,Ac,Th,Pa,U,Np,Pu,Am,Cm,Bk,Cf,Es,Fm,Md,No,Lr,Rf,Db,Sg,Bh,Hs,Mt,Ds,Rg,Cn,Nh,Fl,Mc,Lv,Ts,Og'.split(',')

function pos(z: number): { row: number; group: number; col?: number } {
  if (z === 1) return { row: 1, group: 1 }
  if (z === 2) return { row: 1, group: 18 }
  if (z <= 4) return { row: 2, group: z - 2 }
  if (z <= 10) return { row: 2, group: z + 8 }
  if (z <= 12) return { row: 3, group: z - 10 }
  if (z <= 18) return { row: 3, group: z - 0 }
  if (z <= 36) return { row: 4, group: z - 18 }
  if (z <= 54) return { row: 5, group: z - 36 }
  if (z <= 56) return { row: 6, group: z - 54 }
  if (z <= 70) return { row: 9, group: 0, col: z - 54 }
  if (z <= 86) return { row: 6, group: z - 68 }
  if (z <= 88) return { row: 7, group: z - 86 }
  if (z <= 102) return { row: 10, group: 0, col: z - 86 }
  return { row: 7, group: z - 100 }
}
export const ELEMENTS: El[] = SYMS.map((sym, i) => {
  const { row, group, col } = pos(i + 1)
  return { z: i + 1, sym, name: NAMES[i]!, row, col: col ?? group, group }
})
export const ELEMENT_ROWS = 10
export const ELEMENT_COLS = 18

export const PERIODIC_GROUPS: { id: string; name: string; group: number; plural: string; skipH?: boolean; minGrade: number }[] = [
  { id: 'alkali', name: 'alkali metals', plural: 'alkali metals', group: 1, skipH: true, minGrade: 8 },
  { id: 'alkaline', name: 'alkaline earth metals', plural: 'alkaline earth metals', group: 2, minGrade: 9 },
  { id: 'halogens', name: 'halogens', plural: 'halogens', group: 17, minGrade: 8 },
  { id: 'noble', name: 'noble gases', plural: 'noble gases', group: 18, minGrade: 8 },
]
