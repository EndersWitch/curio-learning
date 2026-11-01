// Ready-made starting points for common classroom uses, offered at the top
// of the settings. Each lists only the settings that differ from the defaults.

import type { CellDivisionSettings } from './settings'

export interface Starter {
  name: string
  settings: Partial<CellDivisionSettings>
}

export const STARTERS: Starter[] = [
  { name: 'Mitosis in order', settings: {} },
  {
    name: 'Put mitosis in order',
    settings: { order: 'shuffled', seed: 4, phaseLabels: 'number', answerKey: true },
  },
  { name: 'Metaphase of mitosis', settings: { layout: 'single', phase: 'metaphase', countLabels: 'ploidy' } },
  { name: 'Metaphase I of meiosis', settings: { process: 'meiosis', layout: 'single', phase: 'metaphase-1', countLabels: 'ploidy' } },
  { name: 'Meiosis with crossing over', settings: { process: 'meiosis', crossingOver: true, countLabels: 'ploidy', key: true } },
  {
    name: 'Onion root tip',
    settings: { cell: 'plant', diploid: '8', mitosisPhases: ['g1', 'prophase', 'metaphase', 'anaphase', 'telophase'], phaseLabels: 'blank', answerKey: true },
  },
  {
    name: 'Label the parts',
    settings: {
      layout: 'single',
      phase: 'metaphase',
      chromosome: true,
      sisters: true,
      centromere: true,
      spindle: true,
      centrioles: true,
      labelStyle: 'letters',
      phaseLabels: 'blank',
      answerKey: true,
    },
  },
]
