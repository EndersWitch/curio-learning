import { describe, expect, it } from 'vitest'
import { FIELD_SPACE, crossFromText, crossToText } from './crossField'

const roundTrip = (text: string) => crossToText(crossFromText(text))

describe('the cross in the field', () => {
  it('keeps the cross as the address writes it', () => {
    for (const t of ['Tt × tt', 'C^R C^W × C^R C^W', 'R_1 R_2 × R_1 R_2', 'C_1^R C_2^R × C_1^R C_1^R', 'I^{AB} i × i i', '']) {
      expect(roundTrip(t)).toBe(t)
    }
  })

  it('writes one box for a subscript and superscript together', () => {
    const [, box] = crossFromText('C^R_1').root.tokens as any[]
    expect(box.props).toEqual({ hasSubscript: true, hasSuperscript: true })
  })

  it('keeps spaces as a blank character the field won’t drop', () => {
    const tokens = crossFromText('Tt × tt').root.tokens as any[]
    expect(tokens[2].props.char).toBe(FIELD_SPACE)
  })
})
