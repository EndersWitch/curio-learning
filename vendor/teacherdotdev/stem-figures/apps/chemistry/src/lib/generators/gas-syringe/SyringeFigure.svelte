<script lang="ts">
  // The Gas Syringe figure for a set of settings: the syringe, alone or set
  // up with its flask and stand, a magnifier above it around the plunger's
  // face, or both.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierAboveLayout } from '$lib/shared/magnify'
  import Syringe from './Syringe.svelte'
  import SyringeSetup from './SyringeSetup.svelte'
  import { syringeLayout, syringeName, syringeScale } from './syringe'
  import { answerLine, readingText, type SyringeSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: SyringeSettings; svg?: SVGSVGElement } = $props()

  const scale = $derived(syringeScale(settings.size))
  const at = $derived(syringeLayout(scale, settings.size, settings.setup))
  const source = $derived({
    x: at.offset.x + at.g.xOf(settings.reading),
    y: at.offset.y,
    r: (settings.span * scale.labelEvery * at.g.perUnit) / 2,
  })
  const layout = $derived(magnifierAboveLayout(settings.view, at.width, at.height, source))
  const label = $derived(
    `A ${syringeName(settings.size, settings.unit)}${settings.setup === 'setup' ? ' collecting gas from a conical flask' : ''}, ` +
      `reading ${readingText(settings)}`,
  )
</script>

{#snippet scene(zoom: number)}
  <g transform="translate({at.offset.x} {at.offset.y})">
    <Syringe g={at.g} {scale} unit={settings.unit} reading={settings.reading} {zoom} />
    {#if at.around}
      <SyringeSetup g={at.g} at={at.around} {zoom} />
    {/if}
  </g>
{/snippet}

<FigureFrame
  bind:svg
  width={layout.width}
  height={layout.height}
  {label}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answerLine(settings) : ''}
>
  {#if layout.origin}
    <g transform="translate({layout.origin.x} {layout.origin.y})">{@render scene(1)}</g>
  {/if}
  {#if layout.magnifier}
    <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} {scene} />
  {/if}
</FigureFrame>
