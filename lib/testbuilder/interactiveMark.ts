// Marks the interactive questions in code, one mark point at a time, so the
// marked paper shows ticks and reasons exactly like a written answer does.

import {
  COMPOUNDS, checkBond, checkSymmetry, cleanAssign, cleanLines, cleanMoves, isCompoundId, isShapeId,
  type SortAnswer, type SortSpec,
} from '@/lib/testbuilder/interactive'

export interface PointOut { pointId: string; awarded: boolean; reason: string }
export interface InteractiveMarked { marks: number; points: PointOut[] }

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

export function markInteractive(type: string, spec: unknown, answerSpec: unknown, given: unknown, pointIds: string[]): InteractiveMarked {
  const s = obj(spec)
  const key = obj(answerSpec)
  const a = obj(given)
  const flags: { awarded: boolean; reason: string }[] = []

  if (type === 'symmetry' && isShapeId(s.shape)) {
    const lines = cleanLines(a.lines)
    const { found, strays } = checkSymmetry(s.shape, lines)
    const hits = found.filter(i => i >= 0).length
    pointIds.forEach((_, k) => {
      if (k < hits) flags.push({ awarded: true, reason: 'Yes, that line cuts the shape into two halves that match exactly.' })
      else if (lines.length === 0) flags.push({ awarded: false, reason: "You didn't draw any lines on this one." })
      else if (k === hits && strays.length > 0) flags.push({ awarded: false, reason: `${strays.length === 1 ? 'One of your lines is' : 'Some of your lines are'} not a line of symmetry. If you folded the shape along it, the two halves would not land on top of each other.` })
      else flags.push({ awarded: false, reason: "There's another line of symmetry here that you didn't find. Imagine folding the shape: the two halves must match exactly." })
    })
  } else if (type === 'bond' && isCompoundId(s.compound)) {
    const c = COMPOUNDS[s.compound]!
    const r = checkBond(c, cleanMoves(a.moves))
    flags.push(
      r.gaveAll
        ? { awarded: true, reason: 'The metal gave away all of its outer electrons. That is how a metal becomes a positive ion.' }
        : { awarded: false, reason: r.gaveCount === 0 ? "You didn't move any electrons." : `You moved ${r.gaveCount} of the ${r.gaveTotal} outer electrons. A metal gives away all of its outer electrons.` },
      r.allFull
        ? { awarded: true, reason: 'Every non-metal atom now has 8 electrons in its outer shell, so each one is a stable negative ion.' }
        : { awarded: false, reason: `${r.fullCount} of ${c.nonmetals.length} non-metal ${c.nonmetals.length === 1 ? 'atom has' : 'atoms have'} a full outer shell. A non-metal takes in electrons until its outer shell has 8.` },
    )
  } else if (type === 'sort') {
    const sortSpec = s as unknown as SortSpec
    if (Array.isArray(sortSpec.items) && Array.isArray(sortSpec.categories)) {
      const right = obj(key.answer) as SortAnswer
      const placed = cleanAssign(a.assign, sortSpec)
      for (const it of sortSpec.items) {
        const want = right[it.id]
        const got = placed[it.id]
        if (got === want) flags.push({ awarded: true, reason: `Right, "${it.text}" goes under ${sortSpec.categories[want!]}.` })
        else if (got === undefined) flags.push({ awarded: false, reason: `You didn't place "${it.text}". It goes under ${sortSpec.categories[want!]}.` })
        else flags.push({ awarded: false, reason: `You put "${it.text}" under ${sortSpec.categories[got]}, but it belongs under ${sortSpec.categories[want!]}.` })
      }
    }
  } else if (type === 'activity') {
    const count = typeof key.count === 'number' ? key.count : pointIds.length
    const total = typeof a.total === 'number' ? a.total : 0
    const correct = total === count && typeof a.correct === 'number' ? Math.max(0, Math.min(count, Math.floor(a.correct))) : 0
    pointIds.forEach((_, k) => {
      flags.push(k < correct ? { awarded: true, reason: 'You got this one right in the activity.' } : { awarded: false, reason: total === 0 ? "You didn't finish the activity." : 'This one needed another look. Try the activity again to practise.' })
    })
  }

  const points = pointIds.map((pointId, k) => ({ pointId, ...(flags[k] ?? { awarded: false, reason: "You didn't answer this one." }) }))
  return { marks: points.filter(p => p.awarded).length, points }
}
