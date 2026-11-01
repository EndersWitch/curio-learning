// Ready-made experiments to start a gel from: the lanes, and the gel and
// ladder that suit their sizes. The teacher can change anything after.

import type { Lane } from './lanes'
import type { Gel } from './migration'

export interface Scenario {
  id: string
  name: string
  note: string
  gel: Gel
  lanes: Lane[]
}

const ladder = (id: number, ladder: 'lambda' | '1kb' | '100bp' = '1kb'): Lane => ({ type: 'ladder', id, label: 'Ladder', ladder })
const sample = (id: number, label: string, bands: string): Lane => ({ type: 'sample', id, label, bands })

export const SCENARIOS: Scenario[] = [
  {
    id: 'crime-scene',
    name: 'Crime scene',
    note: 'DNA from a crime scene beside three suspects’; Suspect 2’s bands match.',
    gel: '1',
    lanes: [
      ladder(1),
      sample(2, 'Crime scene', '5200, 3100, 1800, 900'),
      sample(3, 'Suspect 1', '6000, 3100, 1500, 700'),
      sample(4, 'Suspect 2', '5200, 3100, 1800, 900'),
      sample(5, 'Suspect 3', '4200, 2400, 1800, 1100'),
    ],
  },
  {
    id: 'paternity',
    name: 'Paternity test',
    note: 'Every band of the child’s is the mother’s or Father 2’s; Father 1 has none of the rest.',
    gel: '1',
    lanes: [
      ladder(1),
      sample(2, 'Mother', '4800, 2900, 1600, 800'),
      sample(3, 'Child', '4800, 3200, 1600, 650'),
      sample(4, 'Father 1', '5600, 3500, 2200, 1100'),
      sample(5, 'Father 2', '4400, 3200, 1900, 650'),
    ],
  },
  {
    id: 'digest',
    name: 'Restriction digest',
    note: 'A 5,000 bp plasmid cut once by EcoRI, twice by HindIII, and by both; each lane adds up to 5,000 bp.',
    gel: '1',
    lanes: [
      ladder(1),
      sample(2, 'EcoRI', '5000'),
      sample(3, 'HindIII', '3200, 1800'),
      sample(4, 'EcoRI + HindIII', '2100, 1800, 1100'),
    ],
  },
  {
    id: 'pcr',
    name: 'PCR products',
    note: 'A 450 bp PCR product with positive and negative controls, on a 2% gel with a 100 bp ladder.',
    gel: '2',
    lanes: [
      ladder(1, '100bp'),
      sample(2, '+ control', '450'),
      sample(3, '− control', ''),
      sample(4, 'Sample 1', '450'),
      sample(5, 'Sample 2', ''),
      sample(6, 'Sample 3', '450'),
    ],
  },
]
