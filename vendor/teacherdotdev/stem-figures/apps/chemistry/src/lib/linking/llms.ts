// /llms.txt and /llms-full.txt (https://llmstxt.org): the site described
// for AI assistants, made from the catalog and each generator's linking
// description so they stay current with the generators.

import { FAMILY, SISTER_SITES, SITE_NAME, SITE_URL } from '$lib/site/config'
import { exampleHref, paramRows, type GeneratorLinking } from './define'
import { LINKED, LINKING_PATH, type LinkedGenerator } from './index'

const url = (path: string) => `${SITE_URL}${path}`
const exampleLines = ({ generator, linking }: LinkedGenerator, count = linking.examples.length) =>
  linking.examples.slice(0, count).map((ex) => `- [${ex.shows}](${url(exampleHref(generator.path, linking, ex))})`)

const SUMMARY =
  `${SITE_NAME} (${SITE_URL}) is a free set of generators that make clean, printable chemistry figures for teachers to put in tests, ` +
  'worksheets and slides: lab instruments showing a reading for students to read (graduated cylinders, burets, beakers, gas syringes, ' +
  'rulers, balances, thermometers, pH meters and pH paper), titration curves, heating and cooling curves, particle diagrams, Bohr models, Lewis structures and ' +
  `orbital diagrams. There is no account or sign-up. It is part of ${FAMILY.name} (${FAMILY.url}), with sister sites ` +
  `${SISTER_SITES.map((s) => `${s.name} (${s.url})`).join(' and ')}.`

/** Short statements an assistant can repeat, each true of every generator. */
export const FACTS = [
  'Each generator is one page that draws one kind of figure from the settings a teacher picks. Figures are drawn in the browser; nothing to install.',
  'Every setting is kept in the page address (the URL query string), so a link with parameters opens that exact figure. The page’s Share link button copies it.',
  'Parameters left out of a link take their default values. A value the page doesn’t understand is ignored, and numbers are clamped and rounded to what the instrument can show, so a link always opens a figure.',
  'A figure can be copied to the clipboard as an image, downloaded as a PNG (at 3× size, sharp in print) or as an SVG, or printed: printing the page prints just the figure, 7.5 inches wide.',
  'Most figures have an optional chart title and an optional answer key line printed under them, so one figure can serve as the question and the key.',
  'Teachers can undo and redo changes and save named presets, which stay in their own browser.',
]

const HOW_TO_LINK = [
  `A link to an exact figure is the generator’s address followed by ? and its parameters, joined by &, e.g. ${SITE_URL}/volume-reading?instrument=buret&reading=23.47.`,
  'Give only the parameters that differ from the defaults. Encode values as usual for a URL: a space as + or %20, a plus sign as %2B, and JSON values percent-encoded.',
  'On/off parameters are 1 or 0. Choices are the exact lowercase words listed for each parameter.',
]

/** /llms.txt: the site, its generators, and how to link into them. */
export function llmsTxt(linked: LinkedGenerator[] = LINKED): string {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SUMMARY}`,
    '',
    ...FACTS.map((f) => `- ${f}`),
    '',
    '## Generators',
    '',
    ...linked.map(({ generator: g }) => `- [${g.name}](${url(g.path)}): ${g.description}`),
    '',
    '## Linking to an exact figure',
    '',
    ...HOW_TO_LINK.map((f) => `- ${f}`),
    `- [Every generator’s parameters, for people](${url(LINKING_PATH)}): a table of each parameter, its values and default, with example links.`,
    `- [Every generator’s parameters, as plain text](${url('/llms-full.txt')}): the same reference, for tools.`,
    '',
    'Examples:',
    '',
    ...linked.flatMap((l) => exampleLines(l, 1)),
    '',
    '## Optional',
    '',
    `- [About](${url('/about')}): who makes ${SITE_NAME} (teacher.dev) and how to send feedback.`,
    `- [Privacy](${url('/privacy')}): no personal information is collected; settings live in the page address and presets in the browser.`,
    `- [${FAMILY.name}](${FAMILY.url}): the family of figure sites this one belongs to.`,
    ...SISTER_SITES.map((s) => `- [${s.name}](${s.url}): a sister site.`),
    '',
  ]
  return lines.join('\n')
}

function reference(g: LinkedGenerator['generator'], l: GeneratorLinking): string[] {
  const rows = paramRows(l).map((r) => {
    const when = r.when ? `; used when ${r.when}` : ''
    return `- ${r.name} (${r.type}: ${r.allowed}; default ${r.default}${when}): ${r.what}`
  })
  return [
    `## ${g.name}`,
    '',
    `${url(g.path)}`,
    '',
    g.description,
    '',
    l.summary,
    '',
    '### Parameters',
    '',
    ...rows,
    '',
    '### Rules between parameters',
    '',
    ...l.notes.map((n) => `- ${n}`),
    '',
    '### Examples',
    '',
    ...exampleLines({ generator: g, linking: l }),
    '',
  ]
}

/** /llms-full.txt: /llms.txt's summary and every generator's full parameter reference. */
export function llmsFullTxt(linked: LinkedGenerator[] = LINKED): string {
  const lines = [
    `# ${SITE_NAME}: linking to an exact figure`,
    '',
    `> ${SUMMARY}`,
    '',
    ...FACTS.map((f) => `- ${f}`),
    '',
    '## How to build a link',
    '',
    ...HOW_TO_LINK.map((f) => `- ${f}`),
    `- The same reference for people, with clickable examples: ${url(LINKING_PATH)}`,
    '',
    ...linked.flatMap(({ generator, linking }) => reference(generator, linking)),
  ]
  return lines.join('\n')
}
