<script lang="ts">
  // The Volume by Displacement figure for a set of settings: the same
  // graduated cylinder twice, side by side, before and after the object goes
  // in, each with its caption underneath and, optionally, a magnifier on its
  // meniscus beside it.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierLayout, sizeAt } from '$lib/shared/magnify'
  import GraduatedCylinder from '../volume-reading/GraduatedCylinder.svelte'
  import { cylinderLayout } from '../volume-reading/cylinder'
  import { UNIT_SYMBOLS } from '../volume-reading/scale'
  import ObjectShape from './ObjectShape.svelte'
  import { objectName } from './objects'
  import { answerLine, cylinderScale, objectInCylinder, volumeText, type DisplacementSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: DisplacementSettings; svg?: SVGSVGElement } = $props()

  const GAP = 64
  const CAPTION_H = 34

  const scale = $derived(cylinderScale(settings))
  const unit = $derived(UNIT_SYMBOLS[settings.unit])
  const at = $derived(cylinderLayout(scale, settings.size))
  const object = $derived(objectInCylinder(settings).placed)
  const captioned = $derived(!!(settings.beforeCaption.trim() || settings.afterCaption.trim()))

  /** One cylinder and its magnifier, laid out as if on their own. */
  const cylinderWithMagnifier = (reading: number) => {
    const source = { x: at.cx, y: at.yOf(reading), r: (settings.span * scale.labelEvery * at.perMl) / 2 }
    const layout = magnifierLayout(settings.view, at.width, at.height, source)
    // Only a magnifier-only view leaves the cylinder out, and this has none.
    return { source, ...layout, origin: layout.origin ?? { x: 0, y: 0 } }
  }
  const before = $derived(cylinderWithMagnifier(settings.before))
  const after = $derived(cylinderWithMagnifier(settings.after))
  const width = $derived(before.width + GAP + after.width)
  const height = $derived(before.height + (captioned ? CAPTION_H : 0))

  const label = $derived(
    `A ${settings.size} ${unit} graduated cylinder reading ${volumeText(settings, settings.before)}, ` +
      `then ${volumeText(settings, settings.after)} with ${objectName(settings.object, settings.marbles)} in it`,
  )
</script>

{#snippet beforeScene(zoom: number)}
  <GraduatedCylinder {scale} size={settings.size} reading={settings.before} tint={settings.tint} {unit} guide={settings.guide} {zoom} />
{/snippet}

{#snippet afterScene(zoom: number)}
  <GraduatedCylinder {scale} size={settings.size} reading={settings.after} tint={settings.tint} {unit} guide={settings.guide} {zoom}>
    <ObjectShape placed={object} k={sizeAt(zoom)} />
  </GraduatedCylinder>
{/snippet}

{#snippet cylinder(x: number, part: typeof before, caption: string, scene: typeof beforeScene)}
  <g transform="translate({x} 0)">
    <g transform="translate({part.origin.x} {part.origin.y})">{@render scene(1)}</g>
    {#if part.magnifier}
      <Magnifier source={part.source} target={part.magnifier} marked origin={part.origin} {scene} />
    {/if}
    {#if caption.trim()}
      <text x={part.origin.x + at.cx} y={part.height + 24} text-anchor="middle" font-size="18" font-weight="700" fill="#111">{caption.trim()}</text>
    {/if}
  </g>
{/snippet}

<FigureFrame
  bind:svg
  {width}
  {height}
  {label}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answerLine(settings) : ''}
>
  {@render cylinder(0, before, settings.beforeCaption, beforeScene)}
  {@render cylinder(before.width + GAP, after, settings.afterCaption, afterScene)}
</FigureFrame>
