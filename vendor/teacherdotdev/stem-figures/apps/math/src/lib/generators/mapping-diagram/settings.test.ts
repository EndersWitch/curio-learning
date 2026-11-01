import { describe, expect, test } from 'vitest'
import { cleanSettings, parseList, readMapping, readPairs, sameFigure, settingsFromParams, settingsToQuery } from './settings.js'

const arrow = (from: string, to: string) => ({ from, to })
const mapping = (inputs: string, outputs: string, ...arrows: [string, string][]) =>
  readMapping(cleanSettings({ inputs, outputs, arrows: arrows.map(([from, to]) => arrow(from, to)) }))

describe('typing or pasting a list', () => {
  test('commas, semicolons, tabs and new lines separate items', () => {
    expect(parseList('1, 2,3')).toEqual(['1', '2', '3'])
    expect(parseList('1\n2\r\n\n3\n')).toEqual(['1', '2', '3'])
    expect(parseList('a\tb; c')).toEqual(['a', 'b', 'c'])
  })

  test('spaces separate numbers but not words', () => {
    expect(parseList('-1 0 1/2 3')).toEqual(['-1', '0', '1/2', '3'])
    expect(parseList('New York')).toEqual(['New York'])
    expect(parseList('New York, Paris')).toEqual(['New York', 'Paris'])
  })

  test('a repeated item is shown once, and noted', () => {
    const m = mapping('1, 2, 1', '4, 4, 5')
    expect(m.inputs).toEqual(['1', '2'])
    expect(m.outputs).toEqual(['4', '5'])
    expect(m.repeated).toEqual({ inputs: ['1'], outputs: ['4'] })
  })
})

describe('arrows in the page address', () => {
  test('one arrow= per arrow drawn, top input first, by what they say', () => {
    const s = cleanSettings({ inputs: '1, 2', outputs: '3, 4', arrows: [arrow('2', '4'), arrow('1', '3')] })
    const q = settingsToQuery(s)
    expect(q).toBe('inputs=1%2C+2&outputs=3%2C+4&arrow=1%E2%86%923&arrow=2%E2%86%924')
    expect(settingsFromParams(new URLSearchParams(q))).toEqual({ ...s, arrows: [arrow('1', '3'), arrow('2', '4')] })
  })

  test('an arrow to an item no longer listed is not drawn or written', () => {
    const s = cleanSettings({ inputs: '1', outputs: '3', arrows: [arrow('1', '3'), arrow('9', '3')] })
    expect(readMapping(s).arrows).toEqual([{ from: 0, to: 0 }])
    expect(settingsToQuery(s)).toBe('inputs=1&outputs=3&arrow=1%E2%86%923')
  })

  test('repeated arrows and the order they were drawn in do not change the figure', () => {
    const a = { inputs: '1, 2', outputs: '3', arrows: [arrow('1', '3'), arrow('2', '3')] }
    expect(sameFigure(a, { ...a, arrows: [arrow('2', '3'), arrow('1', '3'), arrow('1', '3')] })).toBe(true)
  })

  test('titles and the shape round-trip', () => {
    const s = cleanSettings({ inputTitle: 'Domain', outputTitleMode: 'blank', title: 'f', titleMode: 'text', shape: 'box' })
    expect(settingsFromParams(new URLSearchParams(settingsToQuery(s)))).toEqual(s)
  })
})

describe('function or not', () => {
  test('every input to exactly one output is a function', () => {
    expect(mapping('-2, 2, 3', '4, 9', ['-2', '4'], ['2', '4'], ['3', '9']).verdict).toEqual({
      kind: 'function',
      text: 'A function: every input goes to exactly one output.',
    })
  })

  test('says when it is one-to-one', () => {
    expect(mapping('1, 2', '3, 4', ['1', '3'], ['2', '4']).verdict?.text).toContain('one-to-one')
  })

  test('an input with two outputs is not a function', () => {
    expect(mapping('4, 9', '-2, 2, 3', ['4', '-2'], ['4', '2'], ['9', '3']).verdict).toEqual({
      kind: 'not-function',
      text: 'Not a function: 4 goes to both -2 and 2.',
    })
  })

  test('an input without an output is not a function yet', () => {
    expect(mapping('1, 2, 3', '5', ['1', '5']).verdict).toEqual({
      kind: 'unfinished',
      text: 'Not a function yet: 2 and 3 have no output. Every input needs exactly one.',
    })
  })

  test('no arrows says nothing, for a diagram students finish', () => {
    expect(mapping('1, 2', '3, 4').verdict).toBeNull()
  })
})

describe('pasting ordered pairs', () => {
  test('fills both lists, numbers in order, and the arrows', () => {
    expect(readPairs('(3, 9), (-2, 4), (2, 4)')).toEqual({
      inputs: ['-2', '2', '3'],
      outputs: ['4', '9'],
      arrows: [arrow('3', '9'), arrow('-2', '4'), arrow('2', '4')],
    })
  })

  test('takes arrows too, and keeps words in the order they came', () => {
    expect(readPairs('Ana -> red\nBo → blue, Cy => red')).toEqual({
      inputs: ['Ana', 'Bo', 'Cy'],
      outputs: ['red', 'blue'],
      arrows: [arrow('Ana', 'red'), arrow('Bo', 'blue'), arrow('Cy', 'red')],
    })
  })

  test('nothing that reads as pairs is null', () => {
    expect(readPairs('1, 2, 3')).toBeNull()
  })
})
