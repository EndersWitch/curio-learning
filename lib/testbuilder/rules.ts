// Rules every generated question must follow so it can be answered by typing
// or choosing an option, nothing else. Pure, so it is shared by every checker.

// Things a learner would have to do on paper (or with formatting) instead of
// typing: underline, circle, highlight, tick, draw, match and so on.
const PAPER_ACTIONS =
  /\b(underline[sd]?|underlining|circle (the|each|all|one)|circled|highlight(ed|ing)?|tick (the|each|all|one)|cross out|colou?r in|shade (the|in)|draw|sketch|label the|match (the|each|column)|fill in the table|in bold|bold(ed)? (word|text|letters?)|italici[sz]ed)\b/i

// Emphasis markers that would show up as stray symbols: *word*, _word_, ~word~.
const MARKERS = /(\*[^*\s][^*]*\*|\b_[^_\s][^_]*_\b|~[^~\s][^~]*~)/

export function breaksTypingRule(text: string): boolean {
  return PAPER_ACTIONS.test(text) || MARKERS.test(text)
}

export const TYPING_RULE_PROMPT =
  'Every question must be answerable by typing or by picking an option. Never ask the learner to underline, circle, highlight, tick, cross out, colour, shade, match, draw or label anything, and never rely on formatting such as underlined, bold or italic words. When you point to a word in a sentence, put it in quotation marks. Do not use asterisks, underscores or tildes for emphasis.'
