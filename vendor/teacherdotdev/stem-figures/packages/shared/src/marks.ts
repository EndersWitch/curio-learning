// The marks along a printed scale (a cylinder's side, a balance beam), from
// the smallest marks up to the numbered ones. Positions are counted in
// smallest-mark steps so 0.1 + 0.2 never drifts.

export type MarkKind = 'major' | 'medium' | 'minor'

export interface Mark {
  value: number
  kind: MarkKind
  /** the number printed beside a major mark */
  label?: string
}

export function marks({ max, labelEvery, minorEvery, from = 0 }: { max: number; labelEvery: number; minorEvery: number; from?: number }): Mark[] {
  const perLabel = Math.round(labelEvery / minorEvery)
  // A medium mark halfway between numbers, when halfway falls on a mark.
  const perMedium = perLabel % 2 === 0 ? perLabel / 2 : 0
  // Numbered from where the scale starts, so one starting at 10 mL reads
  // 10, 30, 50…
  const count = Math.round((max - from) / minorEvery)
  const list: Mark[] = []
  for (let i = 0; i <= count; i++) {
    const value = Number((from + i * minorEvery).toFixed(6))
    if (i % perLabel === 0) list.push({ value, kind: 'major', label: String(value) })
    else list.push({ value, kind: perMedium && i % perMedium === 0 ? 'medium' : 'minor' })
  }
  return list
}

/** The marks worth drawing when `minorGap` apparent units separate the
 *  smallest marks: marks too close to tell apart are left out, and numbers
 *  too close to fit are thinned to every second, fifth… major mark. */
export function legibleMarks(list: Mark[], minorGap: number, labelRoom: number): Mark[] {
  // steps between numbers, measured between the first two, since the scale
  // may start partway between them
  const firstMajor = list.findIndex((m) => m.kind === 'major')
  const perLabel = list.findIndex((m, i) => i > firstMajor && m.kind === 'major') - firstMajor
  if (firstMajor < 0 || perLabel < 1) return list
  const labelGap = perLabel * minorGap
  const labelStep = [1, 2, 5, 10, 20, 50].find((n) => n * labelGap >= labelRoom) ?? 100
  const perMedium = list.some((m) => m.kind === 'medium') ? perLabel / 2 : 0
  let major = 0
  return list.flatMap((m) => {
    if (m.kind === 'minor' && minorGap < 2.4) return []
    if (m.kind === 'medium' && perMedium * minorGap < 2.4) return []
    if (m.kind !== 'major') return [m]
    const shown = major++ % labelStep === 0
    return [shown ? m : { value: m.value, kind: 'major' as const }]
  })
}
