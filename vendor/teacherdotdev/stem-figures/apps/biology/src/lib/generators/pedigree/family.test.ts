import { describe, expect, it } from 'vitest'
import {
  addChild,
  addPartner,
  addSibling,
  canAddChild,
  canAddSibling,
  changePerson,
  depthOf,
  everyone,
  formatFamily,
  memberAt,
  parseFamily,
  personAt,
  removePerson,
  setTwin,
  type Member,
} from './family'

const read = (text: string) => parseFamily(text)!

describe('the family in the address', () => {
  it('reads and writes the same text', () => {
    for (const text of ['m', 'M-f', 'm-F3fcMm-f2mfd', 'm.fc2Fi-m1uFp', 'M-f4Mi-f2FmM-f1mFt-m1fm']) {
      expect(formatFamily(read(text))).toBe(text)
    }
  })

  it('reads sexes, marks and partners', () => {
    const f = read('m-F3fcMm.f2mfd')
    expect(f).toMatchObject({ sex: 'm', affected: false, partner: { sex: 'f', affected: true } })
    expect(f.children.map((c) => formatFamily({ ...c, partner: undefined, children: [] }))).toEqual(['fc', 'M', 'm'])
    expect(f.children[2].consanguineous).toBe(true)
    expect(f.children[2].children[1]).toMatchObject({ sex: 'f', deceased: true })
  })

  it('turns down text that isn’t a family', () => {
    for (const text of ['', 'x', 'm-', 'm-f3mm', 'm-f2mmf', 'm-f2mm-', 'mz', 'm-f1f-m1m-f1m-f1m']) {
      expect(parseFamily(text)).toBeUndefined()
    }
  })

  it('keeps one proband, and twins only between siblings', () => {
    const f = read('mp-fp2fimp')
    expect([...everyone(f)].filter((e) => e.person.proband)).toHaveLength(1)
    // An identical pair of different sexes is fraternal.
    expect(f.children[0].twin).toBe('dz')
    // The last child has no next sibling to be a twin of.
    expect(read('m-f2mft').children[1].twin).toBeUndefined()
    // No triplets: a twin pair isn't part of a second pair.
    expect(read('m-f3mtmtm').children.map((c) => c.twin)).toEqual(['dz', undefined, undefined])
  })

  it('never gives someone of unknown sex a partner', () => {
    expect(read('u-f1m').partner).toBeUndefined()
  })
})

describe('changes made by hand', () => {
  const f = read('m-f2fM-f1m')

  it('add a child after the last, with a partner if there was none', () => {
    const one = addChild(f, { path: [0], partner: false })
    expect(memberAt(one.family, [0])!.partner).toMatchObject({ sex: 'm' })
    expect(one.select).toEqual({ path: [0, 0], partner: false })
    const two = addChild(f, { path: [], partner: true })
    expect(two.family.children).toHaveLength(3)
    expect(two.select).toEqual({ path: [2], partner: false })
  })

  it('stop at four generations and nine children', () => {
    const deep = read('m-f1m-f1m-f1m')
    expect(depthOf(deep)).toBe(4)
    expect(canAddChild(deep, { path: [0, 0, 0], partner: false })).toBe(false)
    expect(canAddChild(read('m-f9mmmmmmmmm'), { path: [], partner: false })).toBe(false)
    expect(canAddSibling(read('m-f9mmmmmmmmm'), { path: [3], partner: false })).toBe(false)
  })

  it('add a sibling just after the person', () => {
    const next = addSibling(f, { path: [0], partner: false })
    expect(next.family.children.map((c) => c.sex)).toEqual(['f', 'm', 'm'])
    expect(next.select).toEqual({ path: [1], partner: false })
    expect(canAddSibling(f, { path: [], partner: false })).toBe(false)
  })

  it('add a partner of the other sex', () => {
    const next = addPartner(f, { path: [0], partner: false })
    expect(personAt(next.family, next.select!)).toMatchObject({ sex: 'm' })
  })

  it('remove a person with their partner and children', () => {
    expect(formatFamily(removePerson(f, { path: [1], partner: false }).family)).toBe('m-f1f')
    expect(formatFamily(removePerson(f, { path: [1], partner: true }).family)).toBe('m-f2fM')
    expect(formatFamily(removePerson(f, { path: [], partner: true }).family)).toBe('m')
    // The founder stays.
    expect(removePerson(f, { path: [], partner: false }).family).toBe(f)
  })

  it('keep a couple a man and a woman when one changes sex', () => {
    const next = changePerson(f, { path: [1], partner: false }, { sex: 'f' })
    expect(formatFamily(next.family)).toBe('m-f2fF-m1m')
    // Someone with a partner can't be of unknown sex.
    expect(changePerson(f, { path: [1], partner: false }, { sex: 'u' }).family).toBe(f)
    expect(formatFamily(changePerson(f, { path: [0], partner: false }, { sex: 'u' }).family)).toBe('m-f2uM-f1m')
  })

  it('move the proband arrow rather than add a second', () => {
    const one = changePerson(f, { path: [0], partner: false }, { proband: true }).family
    const two = changePerson(one, { path: [1, 0], partner: false }, { proband: true }).family
    expect([...everyone(two)].filter((e) => e.person.proband).map((e) => e.ref)).toEqual([{ path: [1, 0], partner: false }])
  })

  it('make identical twins the same sex, and keep them so', () => {
    const twins = setTwin(f, [0], 'mz').family
    expect(twins.children.map((c) => [c.sex, c.twin])).toEqual([['f', 'mz'], ['f', undefined]])
    const changed = changePerson(twins, { path: [0], partner: false }, { sex: 'm' }).family as Member
    expect(changed.children.map((c) => c.sex)).toEqual(['m', 'm'])
  })
})
