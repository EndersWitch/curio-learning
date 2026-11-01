// The elements a strip can show (CONTEXT.md "Element strip"), each with a few
// of its strongest visible lines rather than every line it has.
//
// Source: NIST Atomic Spectra Database (Kramida, Ralchenko, Reader and NIST
// ASD Team, https://physics.nist.gov/asd), lines of the neutral atom (H I,
// He I, …), observed wavelengths in air, rounded to 0.1 nm, retrieved
// September 2026. Each line's second number is NIST's relative intensity. It
// compares lines of one element only, and is rough: NIST takes each
// element's from a different source (potassium's and calcium's lines come out
// nearly equal, for instance).

/** A line in a preset: its wavelength in nm and NIST's relative intensity. */
export type PresetLine = readonly [nm: number, intensity: number]

export interface SpectrumElement {
  symbol: string
  name: string
  lines: readonly PresetLine[]
}

export const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen', lines: [[410.2, 70000], [434.0, 90000], [486.1, 180000], [656.3, 500000]] },
  {
    symbol: 'He',
    name: 'Helium',
    lines: [[447.1, 200], [471.3, 30], [492.2, 20], [501.6, 100], [587.6, 500], [667.8, 100], [706.5, 200]],
  },
  { symbol: 'Li', name: 'Lithium', lines: [[460.3, 13], [610.4, 320], [670.8, 3600]] },
  { symbol: 'Na', name: 'Sodium', lines: [[568.8, 9], [589.0, 80000], [589.6, 40000], [616.1, 2]] },
  {
    symbol: 'K',
    name: 'Potassium',
    lines: [[404.4, 18], [404.7, 17], [580.2, 17], [583.2, 17], [691.1, 19], [693.9, 20], [766.5, 25], [769.9, 24]],
  },
  {
    symbol: 'Ca',
    name: 'Calcium',
    lines: [[422.7, 50], [445.5, 30], [558.9, 27], [612.2, 29], [616.2, 30], [643.9, 35], [646.3, 34], [649.4, 32]],
  },
  {
    symbol: 'Sr',
    name: 'Strontium',
    lines: [[460.7, 29000], [483.2, 2900], [496.2, 2500], [548.1, 2700], [640.8, 3100], [679.1, 7000], [687.8, 12000], [707.0, 14000]],
  },
  {
    symbol: 'Ba',
    name: 'Barium',
    lines: [[553.5, 1830], [577.8, 740], [606.3, 840], [611.1, 880], [634.2, 900], [648.3, 1770], [649.9, 1060], [659.5, 740]],
  },
  { symbol: 'Cu', name: 'Copper', lines: [[465.1, 2000], [510.6, 1500], [515.3, 2000], [521.8, 2500], [570.0, 1500], [578.2, 1500]] },
  { symbol: 'Zn', name: 'Zinc', lines: [[468.0, 540000], [472.2, 1000000], [481.1, 1100000], [636.2, 240000]] },
  { symbol: 'Cd', name: 'Cadmium', lines: [[467.8, 200], [480.0, 300], [508.6, 1000], [643.8, 2000]] },
  { symbol: 'Hg', name: 'Mercury', lines: [[404.7, 12000], [407.8, 1000], [435.8, 12000], [546.1, 6000], [577.0, 1000], [579.1, 900]] },
  {
    symbol: 'Ne',
    name: 'Neon',
    lines: [[540.1, 20000], [585.2, 20000], [614.3, 10000], [640.2, 20000], [650.7, 15000], [659.9, 10000], [692.9, 100000], [703.2, 85000]],
  },
  {
    symbol: 'Ar',
    name: 'Argon',
    lines: [[415.9, 400], [420.1, 400], [425.9, 200], [451.1, 100], [675.3, 150], [687.1, 150], [696.5, 10000], [706.7, 10000]],
  },
  { symbol: 'Kr', name: 'Krypton', lines: [[427.4, 1000], [432.0, 1000], [446.4, 800], [557.0, 2000], [587.1, 3000]] },
] as const satisfies readonly SpectrumElement[]

export type ElementSymbol = (typeof ELEMENTS)[number]['symbol']

export const SYMBOLS = ELEMENTS.map((e) => e.symbol) as ElementSymbol[]

export const elementOf = (symbol: ElementSymbol): SpectrumElement => ELEMENTS.find((e) => e.symbol === symbol)!
