import { describe, expect, it } from 'vitest'
import { answerText, autoQuestion, fieldStep, questionText, questionsFor } from './questions'
import { SETUPS, fieldOf, microscopeSettings, setupSettings, slideOf, tooSmall, viewsOf, type MicroscopeSettings } from './settings'
import { wholeCount } from './specimens'

const settings = (changes: Partial<MicroscopeSettings> = {}) => setupSettings(changes)

describe('the settings', () => {
  it('start at 100×, with a 1.8 mm field from 4.5 mm at 40×', () => {
    const s = microscopeSettings.defaults
    expect(viewsOf(s)).toEqual([{ objective: '10', magnification: 100, field: 1.8 }])
  })

  it('work out each objective’s field from the low-power one, or from the one typed', () => {
    const s = settings()
    expect(fieldOf(s, '4')).toBeCloseTo(4.5)
    expect(fieldOf(s, '40')).toBeCloseTo(0.45)
    expect(fieldOf(s, '100')).toBeCloseTo(0.18)
    const typed = settings({ fieldSource: 'typed', objective: '40', field: 0.4 })
    expect(fieldOf(typed, '40')).toBe(0.4)
    expect(fieldOf(typed, '10')).toBeCloseTo(1.6)
  })

  it('keep the second field the higher power', () => {
    expect(settings({ compare: true, objective: '40', highObjective: '10' }).highObjective).toBe('100')
    const oil = settings({ compare: true, objective: '100', highObjective: '40' })
    expect([oil.objective, oil.highObjective]).toEqual(['40', '100'])
    expect(viewsOf(settings({ compare: true })).map((v) => v.magnification)).toEqual([100, 400])
  })

  it('ask only a question the specimen can answer', () => {
    expect(settings({ specimen: 'none', question: 'size' }).question).toBe('field')
    expect(settings({ specimen: 'letter', question: 'count' }).question).toBe('orientation')
    expect(settings({ specimen: 'onion', question: 'orientation' }).question).toBe('size')
    for (const sp of ['onion', 'cheek', 'letter', 'none'] as const) {
      const s = settings({ specimen: sp })
      expect(questionsFor(s)).toContain(s.question)
    }
  })

  it('round-trip through the address', () => {
    const s = settings({ compare: true, specimen: 'paramecium', size: 225, arrow: 'um', questionMode: 'text', questionText: 'Hi?' })
    expect(microscopeSettings.fromParams(new URLSearchParams(microscopeSettings.toQuery(s)))).toEqual(s)
    expect(microscopeSettings.toQuery(microscopeSettings.defaults)).toBe('')
  })

  it('give every setup valid settings', () => {
    for (const setup of SETUPS) {
      const s = setupSettings(setup.changes)
      expect(microscopeSettings.tidy(s), setup.name).toEqual(s)
      expect(questionsFor(s), setup.name).toContain(s.question)
    }
  })

  it('say when tissue is too small to draw to scale', () => {
    expect(tooSmall(settings())).toBe(false)
    expect(tooSmall(settings({ objective: '4', specimen: 'elodea', size: 50 }))).toBe(true)
  })
})

describe('questions and answers', () => {
  it('estimate a cell’s size from the field', () => {
    const s = settings()
    expect(autoQuestion(s)).toBe('The field of view is 1.8 mm across. Estimate the length of one onion cell in micrometers (µm).')
    expect(answerText(s, slideOf(s))).toBe('About 300 µm (1,800 µm ÷ 6 ≈ 300 µm)')
    expect(autoQuestion(settings({ arrow: 'mm' }))).toMatch(/^Use the field diameter shown/)
    expect(autoQuestion(settings({ ruler: true }))).toMatch(/^Use the ruler/)
  })

  it('give the same size in the answer’s headline as in its working', () => {
    const s = settings({ specimen: 'paramecium', size: 220, count: 1, objective: '40' })
    expect(answerText(s, slideOf(s))).toBe('About 220 µm (450 µm ÷ 2.05 ≈ 220 µm)')
    for (const objective of ['4', '10', '40', '100'] as const)
      for (const size of [7.5, 8, 60, 75, 100, 220, 223, 300, 333, 1500]) {
        const t = settings({ specimen: 'cells', size, objective })
        const [, headline, working] = answerText(t, slideOf(t)).match(/^About (.+?) \(.+ ≈ (.+)\)$/)!
        expect(headline, `${size} µm at ${objective}×`).toBe(working)
      }
  })

  it('work out the field at a higher power', () => {
    const s = settings({ question: 'field', compare: true })
    expect(fieldStep(s).from.magnification).toBe(100)
    expect(autoQuestion(s)).toBe('At 100× the field of view is 1.8 mm across. What is the diameter of the field of view at 400×?')
    expect(answerText(s, slideOf(s))).toBe('0.45 mm = 450 µm (1.8 mm × 100 ÷ 400)')
    // alone, from the low-power field
    const alone = settings({ question: 'field', objective: '40' })
    expect(answerText(alone, slideOf(alone))).toBe('0.45 mm = 450 µm (4.5 mm × 40 ÷ 400)')
  })

  it('measure the field with a ruler', () => {
    const s = setupSettings(SETUPS.find((x) => x.name.includes('ruler'))!.changes)
    expect(autoQuestion(s)).toMatch(/ruler/)
    expect(answerText(s, slideOf(s))).toBe('4.5 mm = 4,500 µm')
  })

  it('multiply the lenses for the total magnification', () => {
    const s = settings({ question: 'magnification', objective: '40' })
    expect(answerText(s, slideOf(s))).toBe('400× (10× eyepiece × 40× objective)')
  })

  it('count the whole cells drawn', () => {
    const s = settings({ question: 'count', specimen: 'cheek', objective: '40', size: 60, count: 7 })
    expect(answerText(s, slideOf(s))).toBe('7')
    const onion = settings({ question: 'count' })
    expect(answerText(onion, slideOf(onion))).toBe(String(wholeCount(slideOf(onion))))
  })

  it('turn the letter e upside down and backwards', () => {
    const s = settings({ specimen: 'letter', size: 1500, question: 'orientation' })
    expect(autoQuestion(s)).toMatch(/looks through the microscope/)
    expect(answerText({ ...s, orientation: 'slide' }, slideOf(s))).toMatch(/upside down and backwards/i)
  })

  it('print the teacher’s own question, or none', () => {
    expect(questionText(settings({ questionMode: 'text', questionText: '  Draw it.  ' }))).toBe('Draw it.')
    expect(questionText(settings({ questionMode: 'none' }))).toBe('')
  })
})
