import { describe, expect, test } from 'vitest'
import { cleanSettings, readPlot, sameFigure, settingsFromParams, settingsToQuery } from './settings.js'

const row = (text: string, name = '', asData = false) => ({ text, name, asData })

describe('data sets in the page address', () => {
  test('one data= per row that has something in it, with its name', () => {
    const s = cleanSettings({ rows: [row('1, 2, 3', 'Class A'), row(''), row('4, 5', '', true)] })
    const q = settingsToQuery(s)
    expect(q).toBe('data=1%2C+2%2C+3%7Cname%3DClass+A&data=4%2C+5%7Cas%3Ddata')
    expect(settingsFromParams(new URLSearchParams(q)).rows).toEqual([row('1, 2, 3', 'Class A'), row('4, 5', '', true)])
  })

  test('a name cannot break the address', () => {
    expect(cleanSettings({ rows: [row('1', 'A|B')] }).rows[0].name).toBe('AB')
  })

  test('empty rows do not change the figure', () => {
    expect(sameFigure({ rows: [row('1, 2')] }, { rows: [row('1, 2'), row('')] })).toBe(true)
  })

  test('outliers and labels round-trip', () => {
    const s = cleanSettings({ outliers: true, q1Label: 'text', q1Text: 'x', medianLabel: 'measure' })
    expect(settingsToQuery(s)).toBe('outliers=1&q1Label=text&q1Text=x&medianLabel=measure')
    expect(settingsFromParams(new URLSearchParams(settingsToQuery(s)))).toEqual(s)
  })

  test('whisker end lines are on unless turned off', () => {
    expect(cleanSettings({}).whiskerCaps).toBe(true)
    const s = cleanSettings({ whiskerCaps: false })
    expect(settingsToQuery(s)).toBe('whiskerCaps=0')
    expect(settingsFromParams(new URLSearchParams(settingsToQuery(s))).whiskerCaps).toBe(false)
  })
})

describe('reading the rows', () => {
  test('data gets its five-number summary', () => {
    const plot = readPlot(cleanSettings({ rows: [row('11, 14, 15, 18, 20, 21, 24, 27, 30, 35, 42')] }))
    expect(plot.rows[0]!.summary).toEqual({ min: 11, q1: 15, median: 21, q3: 30, max: 42 })
    expect(plot.rows[0]!.isSummary).toBe(false)
    expect(plot.range).toEqual({ from: 10, to: 45, step: 5 })
  })

  test('five numbers in order are a summary, unless the teacher says they are data', () => {
    const summary = readPlot(cleanSettings({ rows: [row('1, 2, 3, 4, 5')] })).rows[0]!
    expect(summary.isSummary).toBe(true)
    expect(summary.summary).toEqual({ min: 1, q1: 2, median: 3, q3: 4, max: 5 })
    const data = readPlot(cleanSettings({ rows: [row('1, 2, 3, 4, 5', '', true)] })).rows[0]!
    expect(data.isSummary).toBe(false)
    expect(data.couldBeData).toBe(true)
    expect(data.summary).toEqual({ min: 1, q1: 1.5, median: 3, q3: 4.5, max: 5 })
  })

  test('outliers only when turned on', () => {
    const rows = [row('1, 10, 11, 12, 13, 14, 15, 40')]
    expect(readPlot(cleanSettings({ rows })).rows[0]!.outliers).toEqual([])
    const on = readPlot(cleanSettings({ rows, outliers: true })).rows[0]!
    expect(on.outliers).toEqual([1, 40])
    expect(on.whiskers).toEqual({ lo: 10, hi: 15 })
  })

  test('each row has its own problem, and a blank row is null', () => {
    const plot = readPlot(cleanSettings({ rows: [row('1, 2, x'), row(''), row('1, 200'), row('3, 4')], to: '100' }))
    expect(plot.rows[0]!.problem).toMatch(/^“x” isn't a number/)
    expect(plot.rows[1]).toBe(null)
    expect(plot.rows[2]!.problem).toMatch(/^200 is past the end/)
    expect(plot.rows[3]!.problem).toBe(null)
  })

  test('the range fits every data set unless typed', () => {
    const rows = [row('3, 8, 12'), row('20, 25, 41')]
    expect(readPlot(cleanSettings({ rows })).range).toEqual({ from: 0, to: 45, step: 5 })
    expect(readPlot(cleanSettings({ rows, from: '0', to: '50', step: '10' })).range).toEqual({ from: 0, to: 50, step: 10 })
    expect(readPlot(cleanSettings({ rows, step: '0' })).problems.step).toMatch(/bigger than 0/)
  })

  test('no data draws an empty line from 0 to 10', () => {
    expect(readPlot(cleanSettings({})).range).toEqual({ from: 0, to: 10, step: 1 })
  })
})
