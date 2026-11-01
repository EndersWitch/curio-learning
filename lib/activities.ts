// Interactive maths activities that can sit inside a quiz question, a Learning Zone card
// or a Bloom reply. Content stores a short reference such as
//
//   fraction-fun?n=1&d=4&of=20
//
// and this file turns it into a safe iframe address. Only the tools listed here can be
// shown, and only parameters each tool understands are passed on, so content (or a
// model) can never point a frame at an arbitrary page.
//
// The tools themselves live in public/tools/<name>/ (sources in vendor/teacherdotdev).

export type ActivityId = 'fraction-fun' | 'rounding' | 'algebra-tiles'

export interface ActivitySpec {
  id: ActivityId
  title: string
  /** Topic label for admin pickers. */
  topic: string
  /** One line telling an author (or Bloom) when to use it. */
  use: string
  /** The reference format, with an example. */
  example: string
  height: number
}

export interface ActivityFrame {
  id: ActivityId
  title: string
  src: string
  height: number
  /** The canonical reference, with only the parameters the tool accepts. */
  ref: string
}

export const ACTIVITIES: Record<ActivityId, ActivitySpec> = {
  'fraction-fun': {
    id: 'fraction-fun',
    title: 'Fraction of a number',
    topic: 'Fractions',
    use: 'Finding a fraction of a whole number, like 3/4 of 24. The learner cuts a donut into equal groups and shares out sprinkles.',
    example: 'fraction-fun?n=3&d=4&of=24  (d is 2 to 12, n is 1 to d-1, of is a multiple of d up to 60; optional item=pizza|cookie|cake|watermelon|cheese; mode=watch plays it as an animation)',
    height: 560,
  },
  rounding: {
    id: 'rounding',
    title: 'Rounding on a number line',
    topic: 'Number sense',
    use: 'Rounding whole numbers and decimals by finding the start, end and halfway mark on a number line.',
    example: 'rounding?to=10&max=100&n=5&mode=guided  (to is the place value: 0.1, 1, 10, 100 or 1000; max is 10, 100, 1000 or 10000; n is 1 to 20 questions; mode is guided or quick)',
    height: 620,
  },
  'algebra-tiles': {
    id: 'algebra-tiles',
    title: 'Algebra tiles',
    topic: 'Algebra',
    use: 'Multiplying two brackets, factorising a trinomial, or solving a simple equation with tiles.',
    example: 'algebra-tiles?type=multiply&p=(x+2)(x-3)  or  type=factor&p=x^2-x-6  or  type=solve&p=2x+3=7',
    height: 640,
  },
}

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[]

const FF_ITEMS = ['pizza', 'cookie', 'cake', 'watermelon', 'cheese']
const ROUND_UNITS = [0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000]
const ROUND_MAXES = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000]
const AT_TYPES = ['multiply', 'factor', 'solve']

function int(v: string | null): number | null {
  if (v === null || !/^-?\d{1,6}$/.test(v)) return null
  return Number(v)
}

function build(id: ActivityId, q: URLSearchParams): { params: URLSearchParams; path: string } | null {
  const out = new URLSearchParams()
  switch (id) {
    case 'fraction-fun': {
      const d = int(q.get('d')) ?? 4
      const n = int(q.get('n')) ?? 1
      const of = int(q.get('of')) ?? d * 4
      if (d < 2 || d > 12 || n < 1 || n >= d || of < d || of > 60 || of % d !== 0) return null
      out.set('n', String(n))
      out.set('d', String(d))
      out.set('of', String(of))
      const item = q.get('item')
      if (item && FF_ITEMS.includes(item)) out.set('item', item)
      if (q.get('mode') === 'watch') out.set('mode', 'watch')
      return { params: out, path: '/tools/fraction-fun/' }
    }
    case 'rounding': {
      const max = Number(q.get('max') ?? 100)
      if (!ROUND_MAXES.includes(max)) return null
      const units = (q.get('to') ?? '10')
        .split(',')
        .map(Number)
        .filter((u) => ROUND_UNITS.includes(u) && u <= max)
      if (!units.length) return null
      const count = int(q.get('n')) ?? 5
      out.set('to', units.join(','))
      out.set('max', String(max))
      out.set('n', String(Math.min(Math.max(count, 1), 20)))
      out.set('mode', q.get('mode') === 'quick' ? 'quick' : 'guided')
      for (const flag of ['plot', 'labels', 'retry']) out.set(flag, q.get(flag) === '1' ? '1' : '0')
      return { params: out, path: '/tools/lines/practice' }
    }
    case 'algebra-tiles': {
      const type = q.get('type') ?? ''
      const p = q.get('p') ?? ''
      // Only characters a polynomial or linear equation needs.
      if (!AT_TYPES.includes(type) || !/^[0-9x^+\-*()=. ]{1,40}$/.test(p)) return null
      out.set('type', type)
      out.set('p', p)
      if (q.get('start') === 'none') out.set('start', 'none')
      return { params: out, path: '/tools/algebra-tiles/play' }
    }
  }
}

/** Turns a stored reference like "fraction-fun?n=1&d=4&of=20" into a frame address,
 *  or null when the tool is unknown or the parameters are not valid for it. */
export function parseActivity(ref: string | null | undefined): ActivityFrame | null {
  if (!ref) return null
  const [rawId, query = ''] = ref.trim().split('?')
  if (!(rawId in ACTIVITIES)) return null
  const id = rawId as ActivityId
  const built = build(id, new URLSearchParams(query))
  if (!built) return null
  const canonical = built.params.toString()
  const src = new URLSearchParams(built.params)
  src.set('embed', '1')
  return {
    id,
    title: ACTIVITIES[id].title,
    src: `${built.path}?${src.toString()}`,
    height: ACTIVITIES[id].height,
    ref: `${id}?${canonical}`,
  }
}

/** Message the tools post to their parent page (see public/tools/* and vendor/teacherdotdev). */
export interface ActivityMessage {
  source: 'curio-activity'
  tool: string
  type: 'ready' | 'complete'
  [detail: string]: unknown
}

export function isActivityMessage(data: unknown): data is ActivityMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: unknown }).source === 'curio-activity' &&
    typeof (data as { type?: unknown }).type === 'string'
  )
}

/** Prompt text listing the tools, for Bloom or any other model that may suggest one. */
export function activityGuide(): string {
  return ACTIVITY_IDS.map((id) => `- ${ACTIVITIES[id].title}: ${ACTIVITIES[id].use} Reference: ${ACTIVITIES[id].example}`).join('\n')
}
