// Marks the interactive questions in code, one mark point at a time, so the
// marked paper shows ticks and reasons exactly like a written answer does.

import { markAuthored } from '@/lib/testbuilder/authored'
import { cleanGeometry, reasonLabel, toNumber } from '@/lib/testbuilder/geometry'
import {
  COMPOUNDS, checkBond, checkMapLine, checkSymmetry, cleanActivity, cleanAssign, cleanLines, cleanMapLine, cleanMoves, cleanPicks, isCompoundId, isShapeId,
  type MapDot,
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
    const done = cleanActivity(given)
    const tool = typeof key.tool === 'string' ? key.tool : 'rounding'
    const count = typeof key.count === 'number' ? key.count : pointIds.length
    const unfinished = "You didn't finish the activity."
    if (tool === 'rounding') {
      const correct = done && done.total === count && typeof done.correct === 'number' ? Math.min(count, done.correct) : 0
      pointIds.forEach((_, k) => flags.push(k < correct ? { awarded: true, reason: 'You got this one right in the activity.' } : { awarded: false, reason: done ? 'This one needed another look. Try the activity again to practise.' : unfinished }))
    } else if (tool === 'fraction-fun') {
      const m = done && !done.watch && typeof done.mistakes === 'number' ? done.mistakes : null
      flags.push(
        m !== null ? { awarded: true, reason: 'You worked all the way through the activity.' } : { awarded: false, reason: unfinished },
        m !== null && m <= 2 ? { awarded: true, reason: 'Two mistakes or fewer. Nicely done.' } : { awarded: false, reason: m === null ? unfinished : `You made ${m} mistakes along the way. Watch how the sprinkles share out equally and try again.` },
        m === 0 ? { awarded: true, reason: 'Not a single mistake!' } : { awarded: false, reason: m === null ? unfinished : 'Look for the groups that need to be equal first, then count the sprinkles in the groups you keep.' },
      )
    } else {
      flags.push(done && !done.watch ? { awarded: true, reason: 'You worked through every step with the tiles.' } : { awarded: false, reason: unfinished })
    }
  } else if (type === 'maplocate') {
    const targets = Array.isArray(key.targets) ? (key.targets as string[]) : []
    const names = obj(key.names) as Record<string, string>
    const picks = cleanPicks(given, targets)
    for (const t of targets) {
      const got = picks[t]
      if (got === t) flags.push({ awarded: true, reason: `Yes, that's ${names[t]}.` })
      else if (!got) flags.push({ awarded: false, reason: `You didn't find ${names[t]}. It is shown in green on the marked map.` })
      else flags.push({ awarded: false, reason: `You picked ${names[got] ?? 'another place'}, but ${names[t]} is somewhere else. Look for it in green on the marked map.` })
    }
  } else if (type === 'geometry') {
    const vals = obj(key.values) as Record<string, number>
    const accepted = (Array.isArray(key.reasons) ? key.reasons : []) as string[]
    const fieldIds = Object.keys(vals)
    const ans = cleanGeometry(given, fieldIds)
    const working = String(key.working ?? '')
    const tol = typeof key.tol === 'number' ? key.tol : 0
    for (const id of fieldIds) {
      const got = toNumber(ans?.fields[id])
      const want = vals[id]!
      flags.push(
        got !== null && Math.abs(got - want) <= tol + 1e-9
          ? { awarded: true, reason: 'Yes, that is the right value.' }
          : { awarded: false, reason: got === null ? "You didn't give a value." : `You gave ${got}. Work it out again: ${working}` },
      )
    }
    if (accepted.length) {
      flags.push(
        ans?.reason && accepted.includes(ans.reason)
          ? { awarded: true, reason: `Yes: ${reasonLabel(ans.reason).toLowerCase()}.` }
          : { awarded: false, reason: ans?.reason ? `You chose "${reasonLabel(ans.reason)}". The reason here is "${reasonLabel(accepted[0] ?? '')}".` : "You didn't choose a reason." },
      )
    }
  } else if (type === 'mapline') {
    const dots = (Array.isArray(s.dots) ? s.dots : []) as MapDot[]
    const names = obj(key.names) as Record<string, string>
    const from = String(key.from)
    const to = String(key.to)
    const r = checkMapLine(dots, from, to, cleanMapLine(given))
    const line = cleanMapLine(given)
    flags.push(
      r.start ? { awarded: true, reason: 'Your line starts on the right dot.' } : { awarded: false, reason: line ? `Your line didn't start at ${names[from]}. Check the green line on the marked map.` : "You didn't draw a line." },
      r.end ? { awarded: true, reason: 'And it ends on the right dot.' } : { awarded: false, reason: line ? `Your line didn't end at ${names[to]}. Check the green line on the marked map.` : "You didn't draw a line." },
    )
  }

  const authored = markAuthored(type, spec, answerSpec, given, pointIds.length)
  if (authored) flags.push(...authored)

  const points = pointIds.map((pointId, k) => ({ pointId, ...(flags[k] ?? { awarded: false, reason: "You didn't answer this one." }) }))
  return { marks: points.filter(p => p.awarded).length, points }
}
