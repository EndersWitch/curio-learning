// Where everything goes in the figure, top to bottom: the question, the
// diameter arrows, the fields side by side, a caption and scale bar under
// each, and the answer box. Text is wrapped by an estimate of its width, the
// same on the server as in the browser.

/** A field's radius, in pixels. */
export const FIELD_R = 150
export const FIELD_GAP = 70

/** The drawing's scale for a field `field` mm across, in pixels per µm: the
 *  field's diameter is always 2 × FIELD_R pixels, so a specimen measured
 *  against it gives its true size. */
export const pxPerUm = (field: number) => (2 * FIELD_R) / (field * 1000)
/** the narrowest the figure gets, so a question wraps into few lines */
const MIN_WIDTH = 420

export const QUESTION_SIZE = 17
export const QUESTION_LINE = 23
export const CAPTION_SIZE = 16
export const CAPTION_LINE = 21
export const ANSWER_SIZE = 16
export const ANSWER_LINE = 22
export const ANSWER_PAD = 12
const ARROW_H = 46
const SCALE_BAR_H = 44
/** room to write an answer in a blank box */
const BLANK_H = 58

/** About how wide Arial text is: half its size per character, a little more
 *  for capitals and digits. */
export function textWidth(text: string, size: number) {
  let em = 0
  for (const ch of text) em += /[A-Z0-9mwµ×]/.test(ch) ? 0.64 : /[ ilj.,:;'’|!()]/.test(ch) ? 0.28 : 0.52
  return em * size
}

/** Text broken into lines no wider than `width`, at spaces. The first line
 *  can be shorter, by `indent`, for a label before it. */
export function wrap(text: string, size: number, width: number, indent = 0): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    const room = width - (lines.length ? 0 : indent)
    if (line && textWidth(next, size) > room) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export interface FigureParts {
  fields: number
  question: string
  arrows: boolean
  /** caption lines under each field (the most of any) */
  captionLines: number
  scaleBar: boolean
  /** the answer's text, '' for a blank box, or null for none */
  answer: string | null
}

export function figureLayout(p: FigureParts) {
  const fieldsWidth = p.fields * 2 * FIELD_R + (p.fields - 1) * FIELD_GAP
  const width = Math.max(fieldsWidth, MIN_WIDTH)
  const question = p.question ? wrap(p.question, QUESTION_SIZE, width) : []
  let y = question.length ? question.length * QUESTION_LINE + 10 : 0
  const arrowY = y
  if (p.arrows) y += ARROW_H
  const fieldTop = y
  y += 2 * FIELD_R
  const captionY = y + 8
  if (p.captionLines) y += 8 + p.captionLines * CAPTION_LINE
  const scaleBarY = y + 10
  if (p.scaleBar) y += SCALE_BAR_H
  const label = 'Answer:'
  // the label is bold, a little wider than plain text, then a gap
  const indent = 1.1 * textWidth(label, ANSWER_SIZE) + 6
  const answer = p.answer ? wrap(p.answer, ANSWER_SIZE, width - 2 * ANSWER_PAD, indent) : []
  const answerY = y + 18
  const answerH = p.answer === null ? 0 : p.answer ? answer.length * ANSWER_LINE + 18 : BLANK_H
  if (p.answer !== null) y = answerY + answerH
  const left = (width - fieldsWidth) / 2
  return {
    width,
    height: y,
    question,
    arrowY,
    /** each field's middle */
    centers: Array.from({ length: p.fields }, (_, i) => ({ x: left + FIELD_R + i * (2 * FIELD_R + FIELD_GAP), y: fieldTop + FIELD_R })),
    captionY,
    scaleBarY,
    answer: p.answer === null ? null : { y: answerY, height: answerH, lines: answer, label, indent },
  }
}
