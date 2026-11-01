// The text a figure can carry besides its drawing: the chart title across the
// top and the answer key line under it. Both start off. Spread into a
// generator's defineSettings.

import { bool, choice, text } from './settings'

export const figureTextFields = () => ({
  titleMode: choice(['none', 'text'] as const, 'none'),
  title: text(''),
  answerKey: bool(false),
})
