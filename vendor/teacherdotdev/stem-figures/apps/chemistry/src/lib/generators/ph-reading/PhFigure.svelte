<script lang="ts">
  // The pH Reading figure for a set of settings. An analog meter can have a
  // magnifier around the tip of its needle; a digital meter's display and
  // pH paper's color chart need none.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierLayout } from '$lib/shared/magnify'
  import AnalogPhMeter from './AnalogPhMeter.svelte'
  import DigitalPhMeter from './DigitalPhMeter.svelte'
  import PhPaper from './PhPaper.svelte'
  import { ANALOG_METER, dialPoint, perPh } from './analog'
  import { PH_PAPER } from './paper'
  import { answerLine, readingText, type PhSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: PhSettings; svg?: SVGSVGElement } = $props()

  const DIGITAL_METER = { width: 400, height: 300 }

  // Centered on the marks where the needle crosses them, and never so small
  // that the numbers outside the marks fall out of it.
  const source = $derived({
    ...dialPoint(settings.reading, ANALOG_METER.needleOut),
    r: Math.max((settings.span * perPh) / 2, ANALOG_METER.labelOut - ANALOG_METER.needleOut + 8),
  })
  const layout = $derived(
    settings.instrument === 'analog'
      ? magnifierLayout(settings.view, ANALOG_METER.width, ANALOG_METER.height, source)
      : { ...(settings.instrument === 'digital' ? DIGITAL_METER : PH_PAPER), origin: { x: 0, y: 0 }, magnifier: null },
  )
  const label = $derived(
    settings.instrument === 'paper'
      ? `A strip of pH paper above a color chart, its color matching pH ${readingText(settings)}`
      : `A${settings.instrument === 'analog' ? 'n analog' : ' digital'} pH meter reading ${readingText(settings)}`,
  )
</script>

{#snippet analog(zoom: number)}
  <AnalogPhMeter reading={settings.reading} {zoom} />
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
    <DigitalPhMeter reading={settings.reading} decimals={settings.decimals} />
  {:else if settings.instrument === 'paper'}
    <PhPaper reading={settings.reading} />
  {:else}
    {#if layout.origin}
      <g transform="translate({layout.origin.x} {layout.origin.y})">{@render analog(1)}</g>
    {/if}
    {#if layout.magnifier}
      <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} scene={analog} />
    {/if}
  {/if}
</FigureFrame>
