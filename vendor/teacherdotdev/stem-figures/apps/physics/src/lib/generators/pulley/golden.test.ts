// Golden figures: the SVG drawn for each of these page addresses, kept in
// ./golden/. They pin what every setup and every example looked like before
// the objects became a list, so old links (with aLabel, bSize…) keep drawing
// the same figure. After a deliberate change to how the Pulley draws, look at
// the new SVGs and update them with `npx vitest run -u`.

import { render } from 'svelte/server'
import { expect, test } from 'vitest'
import Pulley from './Pulley.svelte'
import { pulleySettings } from './settings'

const CASES: Record<string, string> = {
  'atwood': '',
  'atwood-example': 'tension=1&gravity=1&acceleration=forward',
  'atwood-lower-left': 'lower=a&aSize=2&bSize=0.5&gravity=1&tension=1&acceleration=backward',
  'atwood-lower-right': 'lower=b&aSize=0.5&bSize=2&mirror=1&color=1&aLabel=5 kg&bLabel=~',
  'atwood-big': 'aSize=2&bSize=2&gravity=1&aGravityLabel=~&bGravityLabel=',
  'table': 'setup=table',
  'table-example': 'setup=table&surface=rough&tension=1&gravity=1&normal=1&friction=away&acceleration=forward',
  'table-example-blank': 'setup=table&aKind=cart&aLabel=~&bLabel=~',
  'table-big': 'setup=table&aSize=2&bSize=2&tension=1&gravity=1&normal=1&friction=toward&acceleration=backward',
  'table-cart': 'setup=table&aKind=cart&aSize=0.5&bSize=1.5&surface=rough&gravity=1&normal=1&normalLabel=N&tensionLabel=~&tension=1',
  'ramp': 'setup=ramp',
  'ramp-example': 'setup=ramp&angle=40&tension=1&gravity=1&normal=1',
  'ramp-shallow': 'setup=ramp&angle=10&aKind=cart&bSize=2&tension=1&gravity=1&normal=1&friction=toward&acceleration=forward&surface=rough',
  'ramp-steep': 'setup=ramp&angle=60&aSize=2&bSize=2&tension=1&gravity=1&normal=1&friction=away&acceleration=backward',
  'ramp-small': 'setup=ramp&angle=12&aSize=0.5&bSize=0.5&mirror=1&angleLabel=30deg',
  'ramp-cart': 'setup=ramp&angle=35&aKind=cart&aSize=2&bSize=0.5&gravity=1&normal=1&color=1',
  'tackle': 'setup=tackle',
  'tackle-example': 'setup=tackle&strands=3&tension=1&gravity=1',
  'tackle-1': 'setup=tackle&strands=1&loadSize=2&tension=1&gravity=1&acceleration=forward&loadLabel=50 kg',
  'tackle-4': 'setup=tackle&strands=4&loadSize=0.5&tension=1&acceleration=backward&loadGravityLabel=W',
}

/** The figure's SVG, one element to a line, without Svelte's hydration markers. */
const svgOf = (html: string) => html.replace(/<!--[^]*?-->/g, '').replace(/></g, '>\n<') + '\n'

for (const [name, query] of Object.entries(CASES)) {
  test(`${name}: ${query || 'the defaults'}`, async () => {
    const settings = pulleySettings.fromParams(new URLSearchParams(query))
    const { body } = render(Pulley, { props: { settings, id: 'g' } })
    await expect(svgOf(body)).toMatchFileSnapshot(`./golden/${name}.svg`)
  })
}
