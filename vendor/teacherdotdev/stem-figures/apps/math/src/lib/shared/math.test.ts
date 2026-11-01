import { describe, expect, test } from 'vitest'
import { fromText, toText, type MathKind } from './math.js'

describe('text for the page address', () => {
  test.each<[string, MathKind, string]>([
    ['x < -1 or x >= 3', 'inequality', 'x<-1 or x>=3'],
    ['-2<x≤5', 'inequality', '-2<x<=5'],
    ['all real numbers', 'inequality', 'all real numbers'],
    ['x>2andx<=3pi/2', 'inequality', 'x>2 and x<=3pi/2'],
    ['x != 2', 'inequality', 'x!=2'],
    ['3π/2', 'number', '3pi/2'],
    ['(1+2)/4', 'number', '(1+2)/4'],
    ['-2.5', 'number', '-2.5'],
    ['3√2', 'number', '3sqrt(2)'],
    ['sqrt(3)/2', 'number', 'sqrt(3)/2'],
  ])('%s', (text, kind, expected) => {
    const once = toText(fromText(text), kind)
    expect(once).toBe(expected)
    expect(toText(fromText(once), kind)).toBe(once)
  })
})
