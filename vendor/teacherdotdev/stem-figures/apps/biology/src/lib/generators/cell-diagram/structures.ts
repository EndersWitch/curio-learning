// The structures a Cell Diagram can show, which cells have them, and what
// they're called. The lists follow OpenStax Biology 2e (Figures 4.5 and 4.8)
// and Concepts of Biology (Figure 3.7): a plant cell has a cell wall,
// chloroplasts, a central vacuole and plasmodesmata but no centrosome or
// lysosomes, and a bacterium has no nucleus or membrane-bound organelles,
// just a nucleoid, ribosomes and its outer layers.

export const CELLS = ['animal', 'plant', 'bacterium'] as const
export type Cell = (typeof CELLS)[number]

export const CELL_NAMES: Record<Cell, string> = { animal: 'Animal', plant: 'Plant', bacterium: 'Bacterial' }

/** Which names labels use: a biology textbook's (Plasma membrane, Golgi
 *  apparatus) or the shorter ones many middle school worksheets use (Cell
 *  membrane, Golgi body). */
export const NAMINGS = ['textbook', 'simple'] as const
export type Naming = (typeof NAMINGS)[number]

export const PART_IDS = [
  'capsule',
  'wall',
  'membrane',
  'cytoplasm',
  'nucleus',
  'envelope',
  'pores',
  'nucleolus',
  'chromatin',
  'rough-er',
  'smooth-er',
  'ribosomes',
  'golgi',
  'vesicles',
  'mitochondria',
  'chloroplasts',
  'vacuole',
  'lysosomes',
  'peroxisomes',
  'centrosome',
  'cytoskeleton',
  'microvilli',
  'plasmodesmata',
  'nucleoid',
  'plasmid',
  'pili',
  'flagellum',
] as const
export type PartId = (typeof PART_IDS)[number]

export interface Part {
  id: PartId
  /** the label in each naming */
  names: Record<Naming, string>
  /** always drawn in the cells that have it (or with its parent): it can
   *  be labeled or not, but not taken out (the cytoplasm, say) */
  always?: true
  /** drawn only when its parent is (the nucleolus, in the nucleus) */
  parent?: PartId
}

const part = (id: PartId, textbook: string, simple = textbook, more: Partial<Part> = {}): Part => ({
  id,
  names: { textbook, simple },
  ...more,
})

export const PARTS: Record<PartId, Part> = Object.fromEntries(
  [
    part('capsule', 'Capsule'),
    part('wall', 'Cell wall'),
    part('membrane', 'Plasma membrane', 'Cell membrane', { always: true }),
    part('cytoplasm', 'Cytoplasm', 'Cytoplasm', { always: true }),
    part('nucleus', 'Nucleus'),
    part('envelope', 'Nuclear envelope', 'Nuclear membrane', { parent: 'nucleus', always: true }),
    part('pores', 'Nuclear pore', 'Nuclear pore', { parent: 'nucleus' }),
    part('nucleolus', 'Nucleolus', 'Nucleolus', { parent: 'nucleus' }),
    part('chromatin', 'Chromatin', 'Chromatin', { parent: 'nucleus' }),
    part('rough-er', 'Rough endoplasmic reticulum', 'Rough ER'),
    part('smooth-er', 'Smooth endoplasmic reticulum', 'Smooth ER'),
    part('ribosomes', 'Ribosomes'),
    part('golgi', 'Golgi apparatus', 'Golgi body'),
    part('vesicles', 'Vesicle'),
    part('mitochondria', 'Mitochondrion', 'Mitochondria'),
    part('chloroplasts', 'Chloroplast'),
    part('vacuole', 'Central vacuole', 'Vacuole'),
    part('lysosomes', 'Lysosome'),
    part('peroxisomes', 'Peroxisome'),
    part('centrosome', 'Centrosome', 'Centrioles'),
    part('cytoskeleton', 'Cytoskeleton'),
    part('microvilli', 'Microvilli'),
    part('plasmodesmata', 'Plasmodesmata'),
    part('nucleoid', 'Nucleoid', 'DNA (nucleoid)'),
    part('plasmid', 'Plasmid'),
    part('pili', 'Pili'),
    part('flagellum', 'Flagellum'),
  ].map((p) => [p.id, p]),
) as Record<PartId, Part>

/** Each cell's structures, in the order the checklist shows them (outside
 *  in): `standard` are drawn unless the teacher removes them, `optional`
 *  only when added (the cytoskeleton would crowd most figures). */
export const CELL_PARTS: Record<Cell, { standard: PartId[]; optional: PartId[] }> = {
  animal: {
    standard: [
      'membrane', 'cytoplasm', 'nucleus', 'envelope', 'pores', 'nucleolus', 'chromatin', 'rough-er', 'smooth-er',
      'ribosomes', 'golgi', 'vesicles', 'mitochondria', 'lysosomes', 'peroxisomes', 'centrosome',
    ],
    optional: ['cytoskeleton', 'microvilli'],
  },
  plant: {
    standard: [
      'wall', 'membrane', 'cytoplasm', 'plasmodesmata', 'nucleus', 'envelope', 'pores', 'nucleolus', 'chromatin',
      'rough-er', 'smooth-er', 'ribosomes', 'golgi', 'vesicles', 'mitochondria', 'chloroplasts', 'vacuole', 'peroxisomes',
    ],
    optional: ['cytoskeleton'],
  },
  bacterium: {
    standard: ['capsule', 'wall', 'membrane', 'cytoplasm', 'nucleoid', 'plasmid', 'ribosomes', 'pili', 'flagellum'],
    optional: [],
  },
}

/** Every structure a cell can have, in checklist order: its standard ones,
 *  then the optional ones. */
export const partsOf = (cell: Cell): PartId[] => [...CELL_PARTS[cell].standard, ...CELL_PARTS[cell].optional]

export const isStandard = (cell: Cell, id: PartId) => CELL_PARTS[cell].standard.includes(id)

export interface PartChoices {
  cell: Cell
  /** standard structures the teacher took out */
  without: PartId[]
  /** optional structures the teacher put in */
  with: PartId[]
  /** structures drawn but left without a label */
  unlabeled: PartId[]
}

/** Whether the teacher has this structure in, regardless of its parent. */
export function chosen(s: PartChoices, id: PartId) {
  const p = PARTS[id]
  if (p.always) return true
  return isStandard(s.cell, id) ? !s.without.includes(id) : s.with.includes(id)
}

/** The structures drawn: those chosen whose parent is drawn too. */
export function drawnParts(s: PartChoices): PartId[] {
  return partsOf(s.cell).filter((id) => chosen(s, id) && (!PARTS[id].parent || chosen(s, PARTS[id].parent!)))
}

/** The structures drawn and labeled. */
export const labeledParts = (s: PartChoices) => drawnParts(s).filter((id) => !s.unlabeled.includes(id))

/** A structure's label. */
export const partName = (id: PartId, naming: Naming) => PARTS[id].names[naming]
