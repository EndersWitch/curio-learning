import { describe, expect, test } from 'vitest'
import { bool, choice, defineSettings, int, label, list, number } from './settings'

const def = defineSettings({
  turns: int(8, 1, 20),
  size: number(1, 0.5, 2),
  source: choice('magnet', ['magnet', 'none']),
  mirror: bool(false),
  north: label({ mode: 'text', text: 'N' }),
})

describe('defineSettings', () => {
  test('defaults', () => {
    expect(def.defaults).toEqual({ turns: 8, size: 1, source: 'magnet', mirror: false, north: { mode: 'text', text: 'N' } })
  })

  test('clean keeps good values and fixes bad ones', () => {
    expect(def.clean({ turns: 50, size: 'x', source: 'battery', mirror: true, north: { mode: 'blank', text: 'N' } })).toEqual({
      turns: 20,
      size: 1,
      source: 'magnet',
      mirror: true,
      north: { mode: 'blank', text: 'N' },
    })
    expect(def.clean(null)).toEqual(def.defaults)
    expect(def.clean({ turns: 3.6 }).turns).toBe(4)
  })

  test('the address carries only what differs from the defaults', () => {
    expect(def.toQuery(def.defaults)).toBe('')
    const s = { ...def.defaults, turns: 3, mirror: true, north: { mode: 'none' as const, text: 'N' } }
    const query = def.toQuery(s)
    expect(query).toBe('turns=3&mirror=1&north=')
    expect(def.fromParams(new URLSearchParams(query))).toEqual(s)
  })

  test('labels round-trip through the address', () => {
    const s = { ...def.defaults, north: { mode: 'text' as const, text: 'm_1 theta' } }
    expect(def.fromParams(new URLSearchParams(def.toQuery(s)))).toEqual(s)
  })

  test('a bad link falls back to defaults', () => {
    expect(def.fromParams(new URLSearchParams('turns=abc&source=nope&mirror=maybe'))).toEqual(def.defaults)
  })

  test('same', () => {
    expect(def.same(def.defaults, { ...def.defaults })).toBe(true)
    expect(def.same(def.defaults, { ...def.defaults, turns: 2 })).toBe(false)
  })
})

describe('list', () => {
  const F_G = { mode: 'text', text: 'F_g' } as const
  const rows = defineSettings({
    forces: list(
      { angle: int(0, 0, 359), length: number(1, 0.25, 2), label: label({ mode: 'text', text: 'F' }), marked: bool(false) },
      [{ angle: 270, length: 1, label: F_G, marked: false }],
      3,
    ),
  })
  type Row = (typeof rows.defaults.forces)[number]
  const row = (over: Partial<Row> = {}): Row => ({ angle: 270, length: 1, label: F_G, marked: false, ...over })

  test('defaults are a copy', () => {
    rows.defaults.forces[0].angle = 5
    expect(rows.clean(undefined).forces[0].angle).toBe(270)
    rows.defaults.forces[0].angle = 270
  })

  test('clean fixes each row, drops junk and caps the list', () => {
    const cleaned = rows.clean({ forces: [{ angle: 400, length: 'x' }, 'junk', null, row(), row(), row()] }).forces
    expect(cleaned).toHaveLength(3)
    expect(cleaned[0]).toEqual({ angle: 359, length: 1, label: { mode: 'text', text: 'F' }, marked: false })
    expect(rows.clean({ forces: 'nope' }).forces).toEqual(rows.defaults.forces)
  })

  test('rows leave off trailing defaults in the address', () => {
    const s = { forces: [row({ label: { mode: 'text', text: 'F' } }), row({ angle: 90, length: 0.6, label: { mode: 'text', text: 'F_N' } })] }
    const query = rows.toQuery(s)
    expect(decodeURIComponent(query)).toBe('forces=270;90,0.6,F_N')
    expect(rows.fromParams(new URLSearchParams(query))).toEqual(s)
  })

  test('awkward labels round-trip', () => {
    const s = {
      forces: [
        row({ label: { mode: 'text', text: 'a, b; c\\d' }, marked: true }),
        row({ label: { mode: 'blank', text: 'F' } }),
        row({ label: { mode: 'none', text: 'F' }, marked: true }),
      ],
    }
    expect(rows.fromParams(new URLSearchParams(rows.toQuery(s)))).toEqual(s)
    for (const text of ['\\', 'x\\', '\\\\v', 'a\\,b', '\\vec{F}']) {
      const one = { forces: [row({ label: { mode: 'text', text } })] }
      expect(rows.fromParams(new URLSearchParams(rows.toQuery(one)))).toEqual(one)
    }
  })

  test('a backslash before anything but a comma, semicolon or backslash is written as it is', () => {
    const s = { forces: [row({ label: { mode: 'text', text: '\\vec{F}_N' } })] }
    expect(decodeURIComponent(rows.toQuery(s))).toBe('forces=270,1,\\vec{F}_N')
    expect(rows.fromParams(new URLSearchParams('forces=270,1,\\vec{F}_N')).forces[0].label.text).toBe('\\vec{F}_N')
  })

  test('an empty list is not the default list', () => {
    const query = rows.toQuery({ forces: [] })
    expect(query).toBe('forces=')
    expect(rows.fromParams(new URLSearchParams(query)).forces).toEqual([])
    expect(rows.toQuery(rows.defaults)).toBe('')
  })

  test('a bad link falls back field by field', () => {
    const F = { mode: 'text', text: 'F' }
    expect(rows.fromParams(new URLSearchParams('forces=abc,zz;45')).forces).toEqual([
      { angle: 0, length: 1, label: F, marked: false },
      { angle: 45, length: 1, label: F, marked: false },
    ])
  })

  test('a list with a minimum is filled up from the default', () => {
    const pair = defineSettings({ sizes: list({ size: number(1, 0.5, 2) }, [{ size: 1 }, { size: 2 }], 3, 2) })
    expect(pair.clean({ sizes: [{ size: 0.5 }] }).sizes).toEqual([{ size: 0.5 }, { size: 2 }])
    expect(pair.fromParams(new URLSearchParams('sizes=')).sizes).toEqual([{ size: 1 }, { size: 2 }])
    expect(pair.clean({ sizes: [{ size: 0.5 }, { size: 0.5 }, { size: 0.5 }] }).sizes).toHaveLength(3)
  })
})

describe('legacy settings', () => {
  // Once there was one `weight`; now there are `weights`.
  const def = defineSettings(
    { weights: list({ kg: number(1, 0, 10) }, [{ kg: 1 }], 3), mirror: bool(false) },
    {
      fields: { weight: number(1, 0, 10) },
      upgrade: (raw) => ('weights' in raw || !('weight' in raw) ? raw : { ...raw, weights: [{ kg: raw.weight }] }),
    },
  )

  test('an old link still loads', () => {
    expect(def.fromParams(new URLSearchParams('weight=4&mirror=1'))).toEqual({ weights: [{ kg: 4 }], mirror: true })
  })

  test('an old preset still loads', () => {
    expect(def.clean({ weight: 6, mirror: false })).toEqual({ weights: [{ kg: 6 }], mirror: false })
  })

  test('today’s settings win, and are written today’s way', () => {
    expect(def.fromParams(new URLSearchParams('weight=4&weights=2'))).toEqual({ weights: [{ kg: 2 }], mirror: false })
    expect(def.toQuery(def.fromParams(new URLSearchParams('weight=4')))).toBe('weights=4')
  })
})
