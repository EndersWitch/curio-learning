// How students can tell a pedigree's inheritance mode: for each mode,
// whether the family fits it, and the textbook clues that rule it out, each
// a sentence naming the people ("II-3 and II-4 are unaffected but have an
// affected child, III-2"). The verdict comes from the genetics; the clues
// are every one of the usual reasons found in the family.

import { refKey, type Member, type Person } from './family'
import { CLEAR_ODDS, compareModes, type Mode } from './genetics'

export interface Verdict {
  mode: Mode
  /** fits, fits but is far less likely than another, or can't happen */
  verdict: 'fits' | 'unlikely' | 'ruled out'
  /** the clues against it, oldest generation first: any of the usual ones found */
  reasons: string[]
}

interface Family {
  depth: number
  father: { key: string; p: Person }
  mother: { key: string; p: Person }
  children: { key: string; p: Person }[]
}

/** Every couple with children, as father, mother and children. */
function familiesOf(root: Member): Family[] {
  const out: Family[] = []
  const walk = (m: Member, path: number[]) => {
    m.children.forEach((c, i) => walk(c, [...path, i]))
    if (!m.partner || !m.children.length) return
    const me = { key: refKey({ path, partner: false }), p: m as Person }
    const them = { key: refKey({ path, partner: true }), p: m.partner }
    const [father, mother] = m.sex === 'f' ? [them, me] : [me, them]
    out.push({ depth: path.length, father, mother, children: m.children.map((c, i) => ({ key: refKey({ path: [...path, i], partner: false }), p: c })) })
  }
  walk(root, [])
  // Oldest generation first, so the clue named is the one highest up.
  return out.sort((a, b) => a.depth - b.depth)
}

/** Every clue in the family that rules out `mode`, written with `name` for
 *  each person's number. */
function cluesAgainst(mode: Mode, root: Member, name: (key: string) => string, carriersShown: boolean): string[] {
  const families = familiesOf(root)
  const out: string[] = []
  const clue = (text: string) => {
    if (!out.includes(text)) out.push(text)
  }
  const kid = (p: Person) => (p.sex === 'm' ? 'son' : p.sex === 'f' ? 'daughter' : 'child')
  for (const f of families) {
    const parents = `${name(f.father.key)} and ${name(f.mother.key)}`
    const both = f.father.p.affected && f.mother.p.affected
    const neither = !f.father.p.affected && !f.mother.p.affected
    for (const c of f.children) {
      const child = name(c.key)
      // One clue a child: the first of these that fits them.
      if ((mode === 'ad' || mode === 'xd') && neither && c.p.affected) {
        clue(`${parents} are unaffected but have an affected ${kid(c.p)}, ${child}.`)
      } else if ((mode === 'ar' || mode === 'xr') && both && !c.p.affected) {
        clue(`${parents} are both affected but have an unaffected ${kid(c.p)}, ${child}.`)
      } else if (mode === 'xr' && c.p.sex === 'f' && c.p.affected && !f.father.p.affected) {
        clue(`${child} is an affected daughter of an unaffected father, ${name(f.father.key)}.`)
      } else if (mode === 'xr' && c.p.sex === 'm' && !c.p.affected && f.mother.p.affected) {
        clue(`${name(f.mother.key)} is affected but her son ${child} isn’t.`)
      } else if (mode === 'xr' && carriersShown && c.p.sex === 'm' && c.p.affected && !f.mother.p.affected && !f.mother.p.carrier) {
        clue(`${child} is affected, but his mother, ${name(f.mother.key)}, isn’t affected or a carrier.`)
      } else if (mode === 'xd' && c.p.sex === 'f' && !c.p.affected && f.father.p.affected) {
        clue(`${name(f.father.key)} is affected but his daughter ${child} isn’t.`)
      } else if (mode === 'xd' && c.p.sex === 'm' && c.p.affected && !f.mother.p.affected) {
        clue(`${child} is affected, but his mother, ${name(f.mother.key)}, isn’t.`)
      } else if (mode === 'y' && c.p.sex === 'm' && c.p.affected !== f.father.p.affected) {
        clue(c.p.affected
          ? `${child} is affected, but his father, ${name(f.father.key)}, isn’t.`
          : `${name(f.father.key)} is affected but his son ${child} isn’t.`)
      }
    }
  }
  if (mode === 'y') {
    for (const f of families) {
      for (const who of [f.father, f.mother, ...f.children]) {
        if (who.p.affected && who.p.sex === 'f') clue(`${name(who.key)} is an affected woman, and women have no Y.`)
      }
    }
  }
  return out
}

/** Every mode's verdict for the drawn family. */
export function verdicts(root: Member, name: (key: string) => string, carriersShown: boolean): Verdict[] {
  return compareModes(root, carriersShown).map(({ mode, fits, odds }) => {
    if (!fits) return { mode, verdict: 'ruled out', reasons: cluesAgainst(mode, root, name, carriersShown) }
    return { mode, verdict: odds >= CLEAR_ODDS ? 'unlikely' : 'fits', reasons: [] }
  })
}
