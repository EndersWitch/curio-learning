<script lang="ts">
  // The Bohr Model figure: the rings around the nucleus, the electrons on
  // them, optional shell labels, and the optional key to the right.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Dots from './Dots.svelte'
  import { KEY_FONT, KEY_HEADING, KEY_PAD, bohrFigure, looks as looksOf } from './figure'
  import { BRACKET_ARM, CHARGE_FONT, LABEL_SIZE, NUCLEUS_FILL, TEXT_NUCLEUS_R, describeChanges, describeModel, textWidth } from './model'
  import type { BohrSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: BohrSettings; svg?: SVGSVGElement } = $props()

  const figure = $derived(bohrFigure(settings))
  const looks = $derived(looksOf(settings))
  const electrons = $derived(figure.rings.flatMap((r) => r.electrons))
  const changes = $derived(describeChanges(figure.rings))
  const label = $derived(
    describeModel(settings.protons, settings.neutrons, settings.electrons, settings.nucleus, settings.emptyRings) +
      (changes ? `, and ${changes}` : '') +
      (figure.brackets ? `, in brackets with a charge of ${figure.brackets.charge.text}` : '') +
      (figure.key ? `. Key: ${figure.key.lines.map((l) => l.name.toLowerCase()).join(', ')}` : ''),
  )
</script>

<FigureFrame bind:svg width={figure.width} height={figure.height} {label} title={settings.titleMode === 'text' ? settings.title : ''}>
  <g transform="translate({figure.cx} {figure.cy})">
    {#each figure.rings as ring (ring.shell)}
      <circle r={ring.radius} fill="none" stroke="#222" stroke-width="1.5" />
    {/each}
    {#if settings.shellLabels}
      {#each figure.rings as ring (ring.shell)}
        {@const w = textWidth(ring.label.text, LABEL_SIZE) + 6}
        <rect x={ring.label.x - w / 2} y={ring.label.y - 8} width={w} height="16" fill="#fff" />
        <text x={ring.label.x} y={ring.label.y} text-anchor="middle" dominant-baseline="central" font-size={LABEL_SIZE} fill="#111">{ring.label.text}</text>
      {/each}
    {/if}
    {#if figure.nucleus === 'balls'}
      <Dots dots={figure.balls} {looks} />
    {:else}
      <circle r={TEXT_NUCLEUS_R} fill={NUCLEUS_FILL} stroke="#222" stroke-width="1.5" />
      {#if figure.nucleus === 'text'}
        <text y="-10" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" fill="#111">{settings.protons} p⁺</text>
        <text y="11" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" fill="#111">{settings.neutrons} n⁰</text>
      {/if}
    {/if}
    <Dots dots={electrons} {looks} gainedColor={settings.gainedColor} />
    {#if figure.brackets}
      {@const b = figure.brackets}
      <path
        d="M {b.x1 + BRACKET_ARM} {b.y1} H {b.x1} V {b.y2} H {b.x1 + BRACKET_ARM} M {b.x2 - BRACKET_ARM} {b.y1} H {b.x2} V {b.y2} H {b.x2 - BRACKET_ARM}"
        fill="none"
        stroke="#222"
        stroke-width="1.8"
      />
      <text x={b.charge.x} y={b.charge.y} font-size={CHARGE_FONT} fill="#111">{b.charge.text}</text>
    {/if}
  </g>
  {#if figure.key}
    {@const key = figure.key}
    <g transform="translate({key.x} {key.y})">
      <rect x="0.75" y="0.75" width={key.width - 1.5} height={key.height - 1.5} fill="none" stroke="#222" stroke-width="1.5" />
      <text x={KEY_PAD} y={key.headingY} dominant-baseline="central" font-size={KEY_HEADING} font-weight="700" fill="#111">Key</text>
      <Dots dots={key.lines.map((l) => l.dot)} {looks} gainedColor={settings.gainedColor} />
      {#each key.lines as line (line.name)}
        <text x={line.nameX} y={line.dot.y} dominant-baseline="central" font-size={KEY_FONT} fill="#111">{line.name}</text>
      {/each}
    </g>
  {/if}
</FigureFrame>
