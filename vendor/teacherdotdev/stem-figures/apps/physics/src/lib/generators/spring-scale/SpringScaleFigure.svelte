<script lang="ts">
  // The Spring Scale figure for a set of settings: the scale with its load,
  // and a magnifier around its pointer. With a zero offset, the same scale
  // with nothing hanging can stand to its left, showing where its pointer
  // rests.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import Magnifier from '$shared/Magnifier.svelte'
  import { magnifierLayout } from '$shared/magnify'
  import SpringScale from './SpringScale.svelte'
  import { loadLayout, springLayout, springScale } from './scale'
  import { answerLines, forceText, pointerAt, type SpringScaleSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: SpringScaleSettings; svg?: SVGSVGElement } = $props()

  const GAP = 40
  const scale = $derived(springScale(settings.capacity))
  const at = $derived(springLayout(scale))
  const pointer = $derived(pointerAt(settings))
  // Both scales alike, whichever pointer rests above zero.
  const marksAbove = $derived(settings.zero < 0)
  const twin = $derived(settings.zero !== 0 && settings.unloaded)
  /** where the loaded scale starts: right of the unloaded one, when it's drawn */
  const shift = $derived(twin ? at.width + GAP : 0)
  const height = $derived(loadLayout(at, settings.hanging, settings.masses).bottom)
  // Around the pointer, spanning the numbered marks asked for, and never so
  // small the numbers beside the slot fall outside it. With one unit its
  // numbers are all on one side (newtons left, grams right), so it's centered
  // toward that side, still reaching the pointer line's far end.
  const both = $derived(settings.units === 'both')
  const toward = $derived(settings.units === 'newtons' ? -17 : settings.units === 'grams' ? 17 : 0)
  const source = $derived({
    x: shift + at.cx + toward,
    y: at.yOf(pointer),
    r: Math.max((settings.span * scale.labelEvery * at.perNewton) / 2, both ? 62 : 45),
  })
  const layout = $derived(magnifierLayout(settings.view, shift + at.width, height, source))
  const label = $derived(
    `A ${scale.capacity} N spring scale reading ${forceText(settings, pointer)}` +
      (twin ? `, beside the same scale reading ${forceText(settings, settings.zero)} with nothing hanging` : ''),
  )
</script>

{#snippet drawing(zoom: number)}
  {#if twin}
    <SpringScale {scale} units={settings.units} pointer={settings.zero} color={settings.color} {marksAbove} {zoom} />
  {/if}
  <g transform="translate({shift} 0)">
    <SpringScale
      {scale}
      units={settings.units}
      {pointer}
      color={settings.color}
      hanging={settings.hanging}
      masses={settings.masses}
      blockLabel={settings.blockLabel}
      {marksAbove}
      {zoom}
    />
  </g>
{/snippet}

<FigureFrame
  bind:svg
  width={layout.width}
  height={layout.height}
  {label}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answerLines(settings) : ''}
>
  {#if layout.origin}
    <g transform="translate({layout.origin.x} {layout.origin.y})">{@render drawing(1)}</g>
  {/if}
  {#if layout.magnifier}
    <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} scene={drawing} />
  {/if}
</FigureFrame>
