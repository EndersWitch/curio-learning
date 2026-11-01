// Classic families to start from, each for a trait taught in intro biology,
// with the trait's usual allele letter. Each is drawn by hand (see the
// family format in family.ts) so a student can tell its inheritance mode.
// Carriers are marked where they must be one (a daughter of an affected
// man, say) or where a carrier is needed to explain an affected child.

import type { Mode } from './genetics'

export interface Classic {
  id: string
  name: string
  mode: Mode
  letter: string
  title: string
  family: string
}

export const CLASSICS: Classic[] = [
  {
    // Four generations shaped like Queen Victoria's family: a carrier queen,
    // an affected son and carrier daughters, hemophilia in her grandsons and
    // great-grandsons. The arrow marks a great-grandson like Alexei.
    id: 'hemophilia',
    name: 'Hemophilia, royal family',
    mode: 'xr',
    letter: 'H',
    title: 'Hemophilia in a royal family',
    family: 'm-fc4mfc-m3fc-m2MdmMdfc-m3ffMpMd-f1fc-m2Mdmfc-m2fc-m3MdmfMd',
  },
  {
    // An affected grandfather, who has died; affected people in every
    // generation, and a father passing it to his son.
    id: 'huntingtons',
    name: 'Huntington’s disease',
    mode: 'ad',
    letter: 'H',
    title: 'Huntington’s disease',
    family: 'Md-f4F-m3MfFm-f2fmM-f3Mfmf',
  },
  {
    // Carrier parents with an affected daughter, and again a generation later.
    id: 'cystic-fibrosis',
    name: 'Cystic fibrosis',
    mode: 'ar',
    letter: 'F',
    title: 'Cystic fibrosis',
    family: 'mc-fc4mc-f2mfFmfc-mc3mFmc',
  },
  {
    // An affected grandfather whose children are all carriers; it skips a
    // generation and returns when two carriers have children.
    id: 'albinism',
    name: 'Albinism',
    mode: 'ar',
    letter: 'A',
    title: 'Albinism',
    family: 'M-f3fc-m2fmmc-fc3Fmmcfc',
  },
  {
    // An affected grandfather, his carrier daughters, and their affected sons.
    id: 'color-blindness',
    name: 'Red–green color blindness',
    mode: 'xr',
    letter: 'B',
    title: 'Red–green color blindness',
    family: 'M-f3fc-m3Mmfcm-f2mffc-m2fM',
  },
  {
    // An affected father whose daughters are all affected and sons aren't.
    id: 'rickets',
    name: 'Vitamin D–resistant rickets',
    mode: 'xd',
    letter: 'R',
    title: 'Vitamin D–resistant rickets',
    family: 'M-f5F-m4MfFmmFm-f2fmF',
  },
]
