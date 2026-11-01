// A pedigree's family, as a tree. The founder in generation I and everyone
// descended from them are its blood relatives; each may have one partner,
// who married in (so has no parents of their own drawn), and children with
// that partner, in birth order. Keeping it a tree is what lets the layout
// draw it with no crossing lines.
//
// In the page address a family is one short line of letters (see
// formatFamily): each person's sex, upper case when affected, then their
// marks, then their partner and how many children they have, then those
// children in the same way.

export type Sex = 'm' | 'f' | 'u'

/** Twins with the next sibling: identical (monozygotic) or fraternal (dizygotic). */
export type Twin = 'mz' | 'dz'

export interface Person {
  sex: Sex
  affected: boolean
  /** a carrier, drawn only when the teacher shows carriers */
  carrier: boolean
  deceased: boolean
  /** the person the family came to attention through, marked with an arrow */
  proband: boolean
}

export interface Member extends Person {
  /** a twin of the next child in birth order */
  twin?: Twin
  partner?: Person
  /** the partners are related, drawn as a double partner line */
  consanguineous?: boolean
  children: Member[]
}

/** The most generations drawn, and the most children one couple has. */
export const MAX_GENERATIONS = 4
export const MAX_CHILDREN = 9

/** A person in the family: a blood relative by the children taken from the
 *  founder down (`path`), or that relative's partner. */
export interface Ref {
  path: number[]
  partner: boolean
}

export const person = (sex: Sex, over: Partial<Person> = {}): Person => ({
  sex,
  affected: false,
  carrier: false,
  deceased: false,
  proband: false,
  ...over,
})

export const member = (sex: Sex, over: Partial<Member> = {}): Member => ({ ...person(sex), children: [], ...over })

/** The blood relative at `path`, or undefined. */
export function memberAt(root: Member, path: number[]): Member | undefined {
  let at: Member | undefined = root
  for (const i of path) at = at?.children[i]
  return at
}

export const personAt = (root: Member, ref: Ref): Person | undefined => {
  const m = memberAt(root, ref.path)
  return ref.partner ? m?.partner : m
}

export const refKey = (ref: Ref) => `${ref.path.join('.')}${ref.partner ? 'p' : ''}`


/** How many generations the family spans. */
export const depthOf = (m: Member): number => 1 + Math.max(0, ...m.children.map(depthOf))

/** Every person, blood relatives in order down the tree with each one's partner after them. */
export function* everyone(root: Member, path: number[] = []): Generator<{ ref: Ref; person: Person; generation: number }> {
  const m = memberAt(root, path)!
  yield { ref: { path, partner: false }, person: m, generation: path.length }
  if (m.partner) yield { ref: { path, partner: true }, person: m.partner, generation: path.length }
  for (let i = 0; i < m.children.length; i++) yield* everyone(root, [...path, i])
}

// ---- The address ----
//
//   m-F3fcMm-f2mfd
//
// reads: an unaffected man (m) with a partner (-), an affected woman (F),
// and three children: a carrier daughter (fc); an affected son (M); a son
// (m) with a partner (-f) and two children, a son (m) and a daughter who
// died (fd). After the sex come the person's marks: c carrier, d deceased,
// p proband, t a fraternal twin of the next child, i an identical twin. A
// partner joined by "." instead of "-" is a relative (consanguinity). A
// person with no children has no count.

const SEXES: Record<string, Sex> = { m: 'm', f: 'f', u: 'u' }

function formatPerson(p: Person, twin?: Twin) {
  const sex = p.affected ? p.sex.toUpperCase() : p.sex
  return sex + (p.carrier ? 'c' : '') + (p.deceased ? 'd' : '') + (p.proband ? 'p' : '') + (twin === 'dz' ? 't' : twin === 'mz' ? 'i' : '')
}

export function formatFamily(m: Member): string {
  let out = formatPerson(m, m.twin)
  if (m.partner) {
    out += (m.consanguineous ? '.' : '-') + formatPerson(m.partner)
    if (m.children.length) out += m.children.length + m.children.map(formatFamily).join('')
  }
  return out
}

/** The family in `text`, tidied (see tidyFamily), or undefined if it isn't one. */
export function parseFamily(text: string): Member | undefined {
  let i = 0
  const readPerson = (): (Person & { twin?: Twin }) | undefined => {
    const c = text[i]
    const sex = c && SEXES[c.toLowerCase()]
    if (!sex) return undefined
    i++
    const p: Person & { twin?: Twin } = person(sex, { affected: c !== c.toLowerCase() })
    for (;;) {
      const mark = text[i]
      if (mark === 'c') p.carrier = true
      else if (mark === 'd') p.deceased = true
      else if (mark === 'p') p.proband = true
      else if (mark === 't') p.twin = 'dz'
      else if (mark === 'i') p.twin = 'mz'
      else break
      i++
    }
    return p
  }
  const readMember = (depth: number): Member | undefined => {
    if (depth > MAX_GENERATIONS) return undefined
    const p = readPerson()
    if (!p) return undefined
    const m: Member = { ...p, children: [] }
    if (!p.twin) delete m.twin
    if (text[i] === '-' || text[i] === '.') {
      m.consanguineous = text[i] === '.'
      i++
      const partner = readPerson()
      if (!partner) return undefined
      delete partner.twin
      m.partner = partner
      if (!m.consanguineous) delete m.consanguineous
      if (/[1-9]/.test(text[i] ?? '')) {
        const n = Number(text[i++])
        for (let k = 0; k < n; k++) {
          const child = readMember(depth + 1)
          if (!child) return undefined
          m.children.push(child)
        }
      }
    }
    return m
  }
  const root = readMember(1)
  if (!root || i !== text.length) return undefined
  return tidyFamily(root)
}

/** A family with its rules kept: one proband at most, twins only between
 *  siblings (an identical pair the same sex), and a person of unknown sex
 *  with no partner. The founder is never anyone's twin. */
export function tidyFamily(root: Member): Member {
  let proband = false
  const tidyPerson = <P extends Person>(p: P): P => {
    const keep = p.proband && !proband
    if (keep) proband = true
    return { ...p, proband: keep }
  }
  const tidy = (m: Member, isRoot: boolean): Member => {
    const out: Member = tidyPerson({ ...m, children: [] })
    delete out.twin
    if (m.sex === 'u' || !m.partner) {
      delete out.partner
      delete out.consanguineous
    } else {
      out.partner = tidyPerson(person(m.partner.sex, m.partner))
      out.children = m.children.slice(0, MAX_CHILDREN).map((c) => tidy(c, false))
      // A twin mark needs a next sibling to be the twin of, and a pair is
      // never part of a second pair (no triplets).
      out.children.forEach((c, k) => {
        const source = m.children[k]
        const next = out.children[k + 1]
        const prev = out.children[k - 1]
        if (source.twin && next && !prev?.twin) {
          c.twin = source.twin === 'mz' && next.sex !== c.sex ? 'dz' : source.twin
        }
      })
    }
    if (isRoot) delete out.twin
    return out
  }
  return tidy(root, true)
}

// ---- Changes made by hand ----
// Each returns a new family and the person to select afterwards.

type Change = { family: Member; select: Ref | null }

/** The family with the blood relative at `path` replaced. */
function withMember(root: Member, path: number[], change: (m: Member) => Member | null): Member {
  if (!path.length) return change(root) ?? root
  const [i, ...rest] = path
  const children = [...root.children]
  if (!rest.length) {
    const next = change(children[i])
    if (next) children[i] = next
    else children.splice(i, 1)
  } else children[i] = withMember(children[i], rest, change)
  return { ...root, children }
}

const opposite = (sex: Sex): Sex => (sex === 'm' ? 'f' : 'm')

/** A blood relative as the other sex, their partner changing with them. */
const withSex = (m: Member, sex: Sex): Member => ({ ...m, sex, partner: m.partner && { ...m.partner, sex: opposite(sex) } })

/** Changes one person's own marks (sex, affected, carrier, deceased, proband). */
export function changePerson(root: Member, ref: Ref, over: Partial<Person>): Change {
  if (over.sex === 'u' && !canBeUnknownSex(root, ref)) return { family: root, select: ref }
  // Only one proband: everyone else's arrow goes when this one is set.
  let family = withMember(over.proband ? clearProband(root) : root, ref.path, (m) => {
    if (!ref.partner) return { ...m, ...over }
    return m.partner ? { ...m, partner: { ...m.partner, ...over } } : m
  })
  const sex = over.sex
  if (sex && sex !== 'u') {
    // A couple stays a man and a woman, so the genetics can be read: the
    // partner changes too.
    family = withMember(family, ref.path, (m) => {
      if (ref.partner) return { ...m, sex: opposite(sex) }
      return m.partner ? { ...m, partner: { ...m.partner, sex: opposite(sex) } } : m
    })
    // An identical twin is the same sex as its pair.
    const k = ref.path[ref.path.length - 1]
    if (!ref.partner && ref.path.length) {
      family = withMember(family, ref.path.slice(0, -1), (parent) => ({
        ...parent,
        children: parent.children.map((c, j) =>
          (j === k + 1 && parent.children[k].twin === 'mz') || (j === k - 1 && c.twin === 'mz') ? withSex(c, sex) : c,
        ),
      }))
    }
  }
  return { family: tidyFamily(family), select: ref }
}

/** Only someone without a partner can be of unknown sex (a diamond). */
export const canBeUnknownSex = (root: Member, ref: Ref) => !ref.partner && !memberAt(root, ref.path)?.partner

function clearProband(m: Member): Member {
  return {
    ...m,
    proband: false,
    partner: m.partner && { ...m.partner, proband: false },
    children: m.children.map(clearProband),
  }
}

/** Sets whether a child is a twin of the next one. */
export function setTwin(root: Member, path: number[], twin: Twin | null): Change {
  const family = withMember(root, path.slice(0, -1), (parent) => {
    const k = path[path.length - 1]
    const children = parent.children.map((c, j) => {
      if (j === k) {
        const next: Member = { ...c }
        if (twin) next.twin = twin
        else delete next.twin
        return next
      }
      // An identical twin is the same sex as its pair.
      if (j === k + 1 && twin === 'mz') return withSex(c, parent.children[k].sex)
      // The twin before this one can't stay a twin of it.
      if (j === k - 1 && twin && c.twin) {
        const prev = { ...c }
        delete prev.twin
        return prev
      }
      return c
    })
    return { ...parent, children }
  })
  return { family: tidyFamily(family), select: { path, partner: false } }
}

/** Sets whether a couple are relatives of each other. */
export function setConsanguineous(root: Member, path: number[], on: boolean): Change {
  const family = withMember(root, path, (m) => ({ ...m, consanguineous: on }))
  return { family: tidyFamily(family), select: { path, partner: false } }
}

/** Whether a child can be added to this person's couple: one more
 *  generation fits, they aren't of unknown sex, and the couple has room. */
export function canAddChild(root: Member, ref: Ref) {
  const m = memberAt(root, ref.path)
  if (!m || m.sex === 'u' || ref.path.length + 1 >= MAX_GENERATIONS) return false
  return m.children.length < MAX_CHILDREN
}

/** Adds a child after the couple's last one, adding a partner first if needed. */
export function addChild(root: Member, ref: Ref): Change {
  if (!canAddChild(root, ref)) return { family: root, select: ref }
  const m = memberAt(root, ref.path)!
  const last = m.children[m.children.length - 1]
  const child = member(last ? opposite(last.sex) : 'f')
  const family = withMember(root, ref.path, (at) => ({
    ...at,
    partner: at.partner ?? person(opposite(at.sex)),
    children: [...at.children, child],
  }))
  return { family: tidyFamily(family), select: { path: [...ref.path, m.children.length], partner: false } }
}

export const canAddPartner = (root: Member, ref: Ref) => {
  const m = memberAt(root, ref.path)
  return !ref.partner && !!m && !m.partner && m.sex !== 'u'
}

export function addPartner(root: Member, ref: Ref): Change {
  if (!canAddPartner(root, ref)) return { family: root, select: ref }
  const family = withMember(root, ref.path, (m) => ({ ...m, partner: person(opposite(m.sex)) }))
  return { family: tidyFamily(family), select: { path: ref.path, partner: true } }
}

/** Whether a sibling can be added: the person has parents drawn, with room for another child. */
export const canAddSibling = (root: Member, ref: Ref) =>
  !ref.partner && ref.path.length > 0 && (memberAt(root, ref.path.slice(0, -1))?.children.length ?? MAX_CHILDREN) < MAX_CHILDREN

/** Adds a sibling just after this person in birth order. */
export function addSibling(root: Member, ref: Ref): Change {
  if (!canAddSibling(root, ref)) return { family: root, select: ref }
  const k = ref.path[ref.path.length - 1]
  const parentPath = ref.path.slice(0, -1)
  const me = memberAt(root, ref.path)!
  const family = withMember(root, parentPath, (parent) => {
    const children = [...parent.children]
    children.splice(k + 1, 0, member(opposite(me.sex === 'u' ? 'f' : me.sex)))
    return { ...parent, children }
  })
  return { family: tidyFamily(family), select: { path: [...parentPath, k + 1], partner: false } }
}

/** Whether a person can be removed: anyone but the founder. */
export const canRemove = (ref: Ref) => ref.partner || ref.path.length > 0

/** Removes a person, and their children with them; removing a partner
 *  removes the couple's children too. */
export function removePerson(root: Member, ref: Ref): Change {
  if (!canRemove(ref)) return { family: root, select: ref }
  if (ref.partner) {
    const family = withMember(root, ref.path, (m) => {
      const next: Member = { ...m, children: [] }
      delete next.partner
      delete next.consanguineous
      return next
    })
    return { family: tidyFamily(family), select: { path: ref.path, partner: false } }
  }
  const family = withMember(root, ref.path, () => null)
  return { family: tidyFamily(family), select: null }
}
