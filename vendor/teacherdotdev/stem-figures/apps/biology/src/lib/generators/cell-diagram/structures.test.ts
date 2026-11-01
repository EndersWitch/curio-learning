import { describe, expect, it } from 'vitest'
import { PLANS } from './cells'
import { CELLS, CELL_PARTS, PARTS, drawnParts, labeledParts, partName, partsOf } from './structures'

const none = { without: [], with: [], unlabeled: [] }

describe('each cell’s structures', () => {
  it('follow the textbooks: plant cells have a wall, chloroplasts and a central vacuole but no centrosome or lysosomes', () => {
    const plant = partsOf('plant')
    for (const id of ['wall', 'chloroplasts', 'vacuole', 'plasmodesmata'] as const) expect(plant).toContain(id)
    for (const id of ['centrosome', 'lysosomes'] as const) expect(plant).not.toContain(id)
    expect(partsOf('animal')).not.toContain('wall')
  })

  it('give a bacterium no nucleus or membrane-bound organelles', () => {
    const bacterium = partsOf('bacterium')
    for (const id of ['nucleus', 'mitochondria', 'rough-er', 'golgi', 'chloroplasts'] as const) expect(bacterium).not.toContain(id)
    for (const id of ['capsule', 'wall', 'membrane', 'cytoplasm', 'nucleoid', 'plasmid', 'ribosomes', 'pili', 'flagellum'] as const)
      expect(bacterium).toContain(id)
  })

  it('draw every standard structure by default, and the optional ones only when added', () => {
    for (const cell of CELLS) {
      expect(drawnParts({ cell, ...none })).toEqual(CELL_PARTS[cell].standard)
      expect(drawnParts({ cell, ...none, with: CELL_PARTS[cell].optional })).toEqual(partsOf(cell))
    }
  })

  it('have somewhere to point a label at, in every cell', () => {
    for (const cell of CELLS) for (const id of partsOf(cell)) expect(PLANS[cell].anchors[id]?.length, `${cell} ${id}`).toBeGreaterThan(0)
  })

  it('take the nucleolus, chromatin and pores out with the nucleus', () => {
    const drawn = drawnParts({ cell: 'animal', ...none, without: ['nucleus'] })
    for (const id of ['nucleus', 'envelope', 'pores', 'nucleolus', 'chromatin'] as const) expect(drawn).not.toContain(id)
  })

  it('keep the membrane and cytoplasm, which can’t be taken out', () => {
    expect(drawnParts({ cell: 'plant', ...none, without: ['membrane', 'cytoplasm'] })).toContain('membrane')
    expect(PARTS.cytoplasm.always).toBe(true)
  })

  it('label only what is drawn and not left unlabeled', () => {
    const labeled = labeledParts({ cell: 'animal', without: ['golgi'], with: [], unlabeled: ['ribosomes'] })
    expect(labeled).not.toContain('golgi')
    expect(labeled).not.toContain('ribosomes')
    expect(labeled).toContain('mitochondria')
  })

  it('have textbook and simpler names', () => {
    expect(partName('membrane', 'textbook')).toBe('Plasma membrane')
    expect(partName('membrane', 'simple')).toBe('Cell membrane')
    expect(partName('golgi', 'simple')).toBe('Golgi body')
    expect(partName('rough-er', 'simple')).toBe('Rough ER')
  })
})
