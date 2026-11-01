// How tightly each sublevel's electrons are held in a free atom, H to Xe:
// where each peak of a photoelectron spectrum sits (ADR 0006).
//
// H to Ca are the textbook table in MJ/mol that AP materials quote (Ne 84.0,
// 4.68, 2.08): J. Hutchinson, "The Shell Model of Atoms", Concept
// Development Studies in Chemistry (Rice University, OpenStax CNX, module
// m12451), Table 1.
//
// Sc to Xe are W. Lotz, "Electron binding energies in free atoms", J. Opt.
// Soc. Am. 60, 206 (1970), doi:10.1364/JOSA.60.000206, in eV, as the ARTIS
// project transcribed them (github.com/artis-mcrt/artis,
// data/binding_energies_lotz1970.txt). Each row is copied as given: the
// shells K L1 L2 L3 M1 M2 M3 M4 M5 N1 N2 N3 N4 N5 N6 N7 O1 O2 O3, with 0
// for a shell Lotz leaves empty and the trailing zeros left off. Lotz's 1s
// and outermost values for Ne, Na and Ca round to the textbook's (Na 1075 eV
// is 104 MJ/mol), so the two tables meet without a jump from Ca to Sc.

/** kJ/mol in one eV (CODATA: 96.485 kJ/mol), so MJ/mol in 1000 eV. */
export const MJ_PER_EV = 0.0964853

/** MJ/mol, each sublevel in filling order (Hutchinson, Table 1). */
const TEXTBOOK: Record<number, number[]> = {
  1: [1.31],
  2: [2.37],
  3: [6.26, 0.52],
  4: [11.5, 0.9],
  5: [19.3, 1.36, 0.8],
  6: [28.6, 1.72, 1.09],
  7: [39.6, 2.45, 1.4],
  8: [52.6, 3.12, 1.31],
  9: [67.2, 3.88, 1.68],
  10: [84.0, 4.68, 2.08],
  11: [104, 6.84, 3.67, 0.5],
  12: [126, 9.07, 5.31, 0.74],
  13: [151, 12.1, 7.79, 1.09, 0.58],
  14: [178, 15.1, 10.3, 1.46, 0.79],
  15: [208, 18.7, 13.5, 1.95, 1.01],
  16: [239, 22.7, 16.5, 2.05, 1.0],
  17: [273, 26.8, 20.2, 2.44, 1.25],
  18: [309, 31.5, 24.1, 2.82, 1.52],
  19: [347, 37.1, 29.1, 3.93, 2.38, 0.42],
  20: [390, 42.7, 34.0, 4.65, 2.9, 0.59],
}
const TEXTBOOK_ORDER = ['1s', '2s', '2p', '3s', '3p', '4s']

/** eV, shells K L1 L2 L3 M1 M2 M3 M4 M5 N1 N2 N3 N4 N5 N6 N7 O1 O2 O3 (Lotz 1970). */
const LOTZ: Record<number, string> = {
  21: '4494 503 408 403 55 33 33 8 0 6.54',
  22: '4970 567 465 459 64 39 38 8 0 6.82',
  23: '5470 633 525 518 72 44 43 8 0 6.74',
  24: '5995 702 589 580 80 49 48 8.25 0 6.765',
  25: '6544 775 656 645 89 55 53 9 0 7.434',
  26: '7117 851 726 713 98 61 59 9 0 7.87',
  27: '7715 931 800 785 107 68 66 9 0 7.864',
  28: '8338 1015 877 860 117 75 73 10 10 7.635',
  29: '8986 1103 958 938 127 82 80 11 10.4 7.726',
  30: '9663 1198 1047 1024 141 94 91 12 11.2 9.394',
  31: '10371 1302 1146 1119 162 111 107 21 20 11 6',
  32: '11107 1413 1251 1220 184 130 125 33 32 14.3 7.9',
  33: '11871 1531 1362 1327 208 151 145 46 45 17 9.81',
  34: '12662 1656 1479 1439 234 173 166 61 60 20.15 9.75',
  35: '13481 1787 1602 1556 262 197 189 77 76 23.8 11.85',
  36: '14327 1927 1731 1678 292 222 214 95 93.8 27.51 14.67 14',
  37: '15203 2068 1867 1807 325 251 242 116 114 32 16 15.3 0 0 0 0 4.18',
  38: '16108 2219 2010 1943 361 283 273 139 137 40 23 22 0 0 0 0 5.69',
  39: '17041 2375 2158 2083 397 315 304 163 161 48 30 29 6.38 0 0 0 6.48',
  40: '18002 2536 2311 2227 434 348 335 187 185 56 35 33 8.61 0 0 0 6.84',
  41: '18990 2702 2469 2375 472 382 367 212 209 62 40 38 7.17 0 0 0 6.88',
  42: '20006 2872 2632 2527 511 416 399 237 234 68 45 42 8.56 0 0 0 7.1',
  43: '21050 3048 2800 2683 551 451 432 263 259 74 49 45 8.6 0 0 0 7.28',
  44: '22123 3230 2973 2844 592 488 466 290 286 81 53 49 8.5 0 0 0 7.37',
  45: '23225 3418 3152 3010 634 526 501 318 313 87 58 53 9.56 0 0 0 7.46',
  46: '24357 3611 3337 3180 677 565 537 347 342 93 63 57 8.78 8.34',
  47: '25520 3812 3530 3357 724 608 577 379 373 101 69 63 11 10 0 0 7.58',
  48: '26715 4022 3732 3542 775 655 621 415 408 112 78 71 14 13 0 0 8.99',
  49: '27944 4242 3943 3735 830 707 669 455 447 126 90 82 21 20 0 0 10 5.79',
  50: '29204 4469 4160 3933 888 761 719 497 489 141 102 93 29 28 0 0 12 7.34',
  51: '30496 4703 4385 4137 949 817 771 542 533 157 114 104 38 37 0 0 15 8.64',
  52: '31820 4945 4618 4347 1012 876 825 589 578 174 127 117 48 46 0 0 17.84 9.01',
  53: '33176 5195 4858 4563 1078 937 881 638 626 193 141 131 58 56 0 0 20.61 10.45',
  54: '34565 5452 5106 4785 1149 1001 939 689 676 213 157 147 69.5 67.5 0 0 23.4 13.44 12.13',
}

/** Each sublevel's shells in Lotz's columns, with how many electrons each
 *  holds: a p or d sublevel is split in two (2p½ and 2p³⁄₂, say). */
const LOTZ_SHELLS: [string, [number, number][]][] = [
  ['1s', [[0, 2]]],
  ['2s', [[1, 2]]],
  ['2p', [[2, 2], [3, 4]]],
  ['3s', [[4, 2]]],
  ['3p', [[5, 2], [6, 4]]],
  ['3d', [[7, 4], [8, 6]]],
  ['4s', [[9, 2]]],
  ['4p', [[10, 2], [11, 4]]],
  ['4d', [[12, 4], [13, 6]]],
  ['4f', [[14, 6], [15, 8]]],
  ['5s', [[16, 2]]],
  ['5p', [[17, 2], [18, 4]]],
]

/** The heaviest element with binding energies here: xenon. */
export const MAX_PES_Z = 54

/**
 * Each sublevel's binding energy in MJ/mol for element `z`, by sublevel
 * name. A spectrum draws a p or d sublevel as one peak, so where Lotz
 * splits one in two, it's their average weighted by how many electrons
 * each holds.
 */
export function bindingEnergies(z: number): Record<string, number> {
  if (z in TEXTBOOK) return Object.fromEntries(TEXTBOOK[z].map((mj, i) => [TEXTBOOK_ORDER[i], mj]))
  const row = LOTZ[z]
  if (!row) return {}
  const ev = row.split(' ').map(Number)
  const out: Record<string, number> = {}
  for (const [name, shells] of LOTZ_SHELLS) {
    const found = shells.filter(([i]) => ev[i] > 0)
    if (!found.length) continue
    const weight = found.reduce((sum, [, holds]) => sum + holds, 0)
    out[name] = (found.reduce((sum, [i, holds]) => sum + ev[i] * holds, 0) / weight) * MJ_PER_EV
  }
  return out
}
