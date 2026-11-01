import { describe, expect, test } from 'vitest'
import { evaluate } from '$lib/generators/coordinate-grid/evaluate.js'
import { fromText, parsers, toText } from './math.js'

const at = (text: string, x: number, angle: 'radians' | 'degrees' = 'radians') => evaluate(parsers.equation.parse(fromText(text)), { x }, angle)

describe('functions in an equation', () => {
  test.each([
    ['sin(x)', Math.PI / 2, 1],
    ['sin x', Math.PI / 2, 1],
    ['sinx', Math.PI / 2, 1],
    ['sin 2x', Math.PI / 4, 1],
    ['2sin x', Math.PI / 2, 2],
    ['sin x + 1', Math.PI / 2, 2],
    ['sin x cos x', Math.PI / 4, 0.5],
    ['sin^2 x', Math.PI / 4, 0.5],
    ['sin^2(x) + cos^2(x)', 1.234, 1],
    ['sin^-1 x', 1, Math.PI / 2],
    ['sin^(-1)(x)', 1, Math.PI / 2],
    ['arcsin(x)', 1, Math.PI / 2],
    ['arccos x', 1, 0],
    ['arctan x', 1, Math.PI / 4],
    ['tan x', Math.PI / 4, 1],
    ['sec x', 0, 1],
    ['csc x', Math.PI / 2, 1],
    ['cot x', Math.PI / 4, 1],
    ['ln x', Math.E, 1],
    ['ln(x+1)', Math.E - 1, 1],
    ['log x', 1000, 3],
    ['log_2 x', 8, 3],
    ['log_2(x)', 8, 3],
    ['log_{10}x', 100, 2],
    ['e^x', 1, Math.E],
    ['2e^(-x)', 0, 2],
    ['|x|', -3, 3],
    ['|x - 5| + 1', 2, 4],
    ['2|x|', -3, 6],
    ['abs(x)', -3, 3],
    ['sqrt(x) + sin(pi x)', 4, 2],
  ])('%s at %d is %d', (text, x, y) => expect(at(text, x)).toBeCloseTo(y, 9))

  test('degrees', () => {
    expect(at('sin x', 90, 'degrees')).toBeCloseTo(1, 9)
    expect(at('cos x', 180, 'degrees')).toBeCloseTo(-1, 9)
    expect(at('arcsin x', 1, 'degrees')).toBeCloseTo(90, 9)
    expect(at('tan x', 90, 'degrees')).toBeNull()
  })

  test('undefined where the function is', () => {
    expect(at('ln x', 0)).toBeNull()
    expect(at('ln x', -1)).toBeNull()
    expect(at('log x', -1)).toBeNull()
    expect(at('arcsin x', 2)).toBeNull()
    expect(at('tan x', Math.PI / 2)).toBeNull()
  })

  test('a letter that isn’t part of a name is still a variable', () => {
    const tree = parsers.equation.parse(fromText('s i x'))
    expect(at('2x', 3)).toBe(6)
    expect([...tree.traverse()].some((n) => (n as { name?: string }).name === 's')).toBe(true)
  })

  test('the number line’s grammar has no functions', () => {
    const tree = parsers.inequality.parse(fromText('sin x < 1'))
    expect([...tree.traverse()].some((n) => n.constructor.name === 'FunctionNode')).toBe(false)
  })
})

describe('subscripts in text', () => {
  test.each(['log_2x', 'log_10x', 'y=log_2(x+1)', 'log_{x+1}(2)'])('%s comes back as it went in', (text) => {
    expect(toText(fromText(text), 'equation')).toBe(text)
  })
  test('braces around a plain number are dropped', () => expect(toText(fromText('log_{10}x'), 'equation')).toBe('log_10x'))
})
