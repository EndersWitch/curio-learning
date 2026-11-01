// Golden figures: the SVG drawn for each of these page addresses, kept in
// ./golden/. They pin what the one-object figures and every example looked
// like before the objects became a list, so old links (with object,
// objectLabel…) keep drawing the same figure. After a deliberate change to
// how the Inclined Plane draws, look at the new SVGs and update them with
// `npx vitest run -u`.

import { render } from 'svelte/server'
import { expect, test } from 'vitest'
import Incline from './Incline.svelte'
import { inclineSettings } from './settings'

const CASES: Record<string, string> = {
  'block': '',
  'example-friction': 'surface=rough&gravity=1&normal=1&friction=up',
  'example-cart': 'object=cart&angle=20&angleLabel=20deg&velocity=down&acceleration=down',
  'example-ball-marks': 'object=ball&angle=25&lengthMark=1&heightMark=1',
  'example-blank-forces': 'objectLabel=5 kg&angle=35&angleLabel=35deg&surface=rough&gravity=1&gravityLabel=~&normal=1&normalLabel=~&friction=up&frictionLabel=~',
  'example-pushed': 'surface=rough&gravity=1&normal=1&friction=down&applied=up&velocity=up',
  'shallow-cart': 'object=cart&objectSize=2&angle=5&lengthMark=1&heightMark=1&gravity=1&normal=1&friction=down&applied=up&velocity=up&acceleration=down',
  'steep-ball': 'object=ball&objectSize=0.5&angle=60&position=0.85&gravity=1&normal=1&friction=up&applied=down&velocity=down&acceleration=up',
  'low-mirrored': 'angle=45&position=0.2&objectLabel=~&mirror=1&color=1&surface=rough',
  'big-ball': 'object=ball&objectSize=2&angle=20&gravity=1&normal=1&gravityLabel=mg&objectLabel=',
}

/** The figure's SVG, one element to a line, without Svelte's hydration markers. */
const svgOf = (html: string) => html.replace(/<!--[^]*?-->/g, '').replace(/></g, '>\n<') + '\n'

for (const [name, query] of Object.entries(CASES)) {
  test(`${name}: ${query || 'the defaults'}`, async () => {
    const settings = inclineSettings.fromParams(new URLSearchParams(query))
    const { body } = render(Incline, { props: { settings, id: 'g' } })
    await expect(svgOf(body)).toMatchFileSnapshot(`./golden/${name}.svg`)
  })
}
