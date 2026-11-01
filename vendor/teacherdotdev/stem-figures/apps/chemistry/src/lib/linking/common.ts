// Descriptions of parameters several generators share: the chart title and
// answer key (figureTextFields) and the magnifier (MagnifierSettings).

import type { ParamDoc } from './define'

/** titleMode, title and answerKey; `answer` is an answer key line as it prints. */
export const figureTextDocs = (answer: string) => ({
  titleMode: { what: 'Whether a chart title is drawn across the top of the figure.', values: 'none: no title; text: the words in title' } satisfies ParamDoc,
  title: { what: 'The chart title’s words.', when: 'titleMode=text' } satisfies ParamDoc,
  answerKey: { what: `Prints the answer key line under the figure, e.g. “${answer}”.` } satisfies ParamDoc,
})

/** titleMode and title alone, for a generator without an answer key. */
export const chartTitleDocs = () => {
  const { titleMode, title } = figureTextDocs('')
  return { titleMode, title }
}

export const MAGNIFIER_VIEW_WORDS = 'both: the instrument with a magnified circle of its scale beside it; magnifier: the magnified circle alone; whole: the instrument alone'

/** How many numbered marks a magnifier spans. */
export const spanDoc = (when = 'view=both or view=magnifier'): ParamDoc => ({
  what: 'How many numbered marks the magnified circle spans; fewer marks means a bigger zoom. Rounded to a whole number.',
  when,
})
