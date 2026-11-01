<script lang="ts">
  // The Temperature Reading figure for a set of settings. A liquid-in-glass
  // thermometer can have a magnifier around the top of its liquid; a digital
  // one's display needs none.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierLayout } from '$lib/shared/magnify'
  import DigitalThermometer from './DigitalThermometer.svelte'
  import GlassThermometer from './GlassThermometer.svelte'
  import { DIGITAL_THERMOMETER } from './digital'
  import { glassLayout, glassScale } from './glass'
  import { answerLine, readingText, type TemperatureSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: TemperatureSettings; svg?: SVGSVGElement } = $props()

  const scale = $derived(glassScale(settings.unit))
  const at = $derived(glassLayout(scale))
  // Centered on the bore, so the magnifier shows the marks on its left and
  // the numbers on its right.
  const source = $derived({
    x: at.bore.x + 2,
    y: at.yOf(settings.reading),
    r: (settings.span * scale.labelEvery * at.perDegree) / 2,
  })
  const layout = $derived(
    settings.instrument === 'digital'
      ? { ...DIGITAL_THERMOMETER, origin: { x: 0, y: 0 }, magnifier: null }
      : magnifierLayout(settings.view, at.width, at.height, source),
  )
  const label = $derived(
    `A ${settings.instrument === 'glass' ? 'liquid-in-glass' : 'digital'} thermometer reading ${readingText(settings)}`,
  )
</script>

{#snippet glass(zoom: number)}
  <GlassThermometer {scale} unit={settings.unit} reading={settings.reading} tint={settings.tint} {zoom} />
{/snippet}

<FigureFrame
  bind:svg
  width={layout.width}
  height={layout.height}
  {label}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answerLine(settings) : ''}
>
  {#if settings.instrument === 'digital'}
    <DigitalThermometer reading={settings.reading} decimals={settings.decimals} unit={settings.unit} />
  {:else}
    {#if layout.origin}
      <g transform="translate({layout.origin.x} {layout.origin.y})">{@render glass(1)}</g>
    {/if}
    {#if layout.magnifier}
      <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} scene={glass} />
    {/if}
  {/if}
</FigureFrame>
