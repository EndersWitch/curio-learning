// The question printed over the figure and the answer under it, worked out
// from the same numbers the figure is drawn with, so they always agree.

import { fitAcross, formatFit, formatNumber, mmText, umText, UM_PER_MM } from './microscope'
import { knownField, viewsOf, type MicroscopeSettings, type Question, type View } from './settings'
import { SPECIMEN_INFO, wholeCount, type Arranged } from './specimens'

export const QUESTION_NAMES: Record<Question, string> = {
  size: 'Specimen size',
  field: 'Field diameter',
  magnification: 'Total magnification',
  count: 'Count the cells',
  orientation: 'Letter e',
}

/** The questions that make sense for this specimen. */
export function questionsFor(s: MicroscopeSettings): Question[] {
  const kind = SPECIMEN_INFO[s.specimen].kind
  if (kind === 'none') return ['field', 'magnification']
  if (kind === 'letter') return ['size', 'field', 'magnification', 'orientation']
  return ['size', 'field', 'magnification', 'count']
}

const MEASURES = { length: 'length', diameter: 'diameter', height: 'height' }

/** "the length of one onion cell", "the height of the letter e" */
function whatSize(s: MicroscopeSettings) {
  const info = SPECIMEN_INFO[s.specimen]
  const of = info.kind === 'letter' ? 'the letter e' : s.specimen === 'paramecium' && s.count === 1 && s.arrangement === 'scatter' ? 'the paramecium' : `one ${info.one}`
  return `the ${MEASURES[info.measure]} of ${of}`
}

/** How the student knows the field's diameter, as the question says it:
 *  read from the figure when it's labeled there, or given. */
function givenField(s: MicroscopeSettings, view: View) {
  if (s.arrow === 'mm' || s.arrow === 'um') return 'Use the field diameter shown'
  if (s.ruler) return 'Use the ruler to find the field diameter'
  return `The field of view is ${mmText(view.field)} across`
}

/** The question written for these settings. */
export function autoQuestion(s: MicroscopeSettings): string {
  const views = viewsOf(s)
  const [main] = views
  const where = s.compare ? ` in the ${main.magnification}× view` : ''
  switch (s.question) {
    case 'size':
      return `${givenField(s, main)}. Estimate ${whatSize(s)}${where} in micrometers (µm).`
    case 'field': {
      const { from, to } = fieldStep(s)
      if (from.magnification === to.magnification) {
        if (s.ruler) return 'Each space on the ruler is 1 mm. Estimate the diameter of the field of view in mm and in µm.'
        return `The field of view is ${mmText(to.field)} across. What is its diameter in micrometers (µm)?`
      }
      return `At ${from.magnification}× the field of view is ${mmText(from.field)} across. What is the diameter of the field of view at ${to.magnification}×?`
    }
    case 'magnification':
      return s.compare ? 'What is the total magnification of each view?' : 'What is the total magnification?'
    case 'count': {
      const info = SPECIMEN_INFO[s.specimen]
      return `How many whole ${info.many} are in the field of view${where}?`
    }
    case 'orientation':
      return s.orientation === 'seen'
        ? 'This is how the letter e looks through the microscope. Draw how it was placed on the slide.'
        : 'This is how the letter e was placed on the slide. Draw how it looks through the microscope.'
  }
}

/** The question as printed: written for the settings, typed, or none. */
export function questionText(s: MicroscopeSettings) {
  if (s.questionMode === 'none') return ''
  if (s.questionMode === 'text') return s.questionText.trim()
  return autoQuestion(s)
}

/** For a field diameter question: the field it's known from and the one to
 *  work out. Beside a higher power, that's the higher power from the lower;
 *  alone, the field set from the low-power one (or from itself, when it's
 *  typed or already at low power). */
export function fieldStep(s: MicroscopeSettings): { from: { magnification: number; field: number }; to: View } {
  const views = viewsOf(s)
  if (views.length > 1) return { from: views[0], to: views[1] }
  return { from: knownField(s), to: views[0] }
}

/** The answer, with its working: "About 300 µm (1,800 µm ÷ 6 ≈ 300 µm)". */
export function answerText(s: MicroscopeSettings, slide: Arranged): string {
  const views = viewsOf(s)
  const [main] = views
  switch (s.question) {
    case 'size': {
      // The estimate a student makes: the field divided by how many fit
      // across it, as written. The headline and the working both give it.
      const fieldUm = main.field * UM_PER_MM
      const fit = formatFit(fitAcross(main.field, s.size))
      const estimate = umText(fieldUm / Number(fit))
      return `About ${estimate} (${umText(fieldUm)} ÷ ${fit} ≈ ${estimate})`
    }
    case 'field': {
      const { from, to } = fieldStep(s)
      const um = `${umText(to.field * UM_PER_MM)}`
      if (from.magnification === to.magnification) return `${mmText(to.field)} = ${um}`
      return `${mmText(to.field)} = ${um} (${formatNumber(from.field)} mm × ${from.magnification} ÷ ${to.magnification})`
    }
    case 'magnification':
      return views
        .map((v) => `${v.magnification}× (${s.eyepiece}× eyepiece × ${v.objective}× objective)`)
        .join(' and ')
    case 'count':
      return String(wholeCount(slide))
    case 'orientation':
      return s.orientation === 'seen'
        ? 'A normal e: the microscope turns the image upside down and backwards'
        : 'Upside down and backwards: the image is turned 180°'
  }
}
