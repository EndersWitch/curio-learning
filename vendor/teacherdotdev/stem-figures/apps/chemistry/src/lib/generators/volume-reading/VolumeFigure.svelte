<script lang="ts">
  // The Volume Reading figure for a set of settings: the instrument, a
  // magnifier around its meniscus, or both side by side.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierLayout } from '$lib/shared/magnify'
  import Beaker from './Beaker.svelte'
  import Buret from './Buret.svelte'
  import GraduatedCylinder from './GraduatedCylinder.svelte'
  import { beakerLayout } from './beaker'
  import { buretLayout } from './buret'
  import { cylinderLayout } from './cylinder'
  import { UNIT_SYMBOLS, instrumentName, volumeScale } from './scale'
  import { answerLine, magnifierView, readingText, type VolumeSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: VolumeSettings; svg?: SVGSVGElement } = $props()

  const scale = $derived(volumeScale(settings))
  const at = $derived(
    settings.instrument === 'buret' ? buretLayout() : settings.instrument === 'beaker' ? beakerLayout(scale) : cylinderLayout(scale, settings.size),
  )
  const source = $derived({
    x: 'readX' in at ? at.readX : at.cx,
    y: at.yOf(settings.reading),
    r: (settings.span * scale.labelEvery * at.perMl) / 2,
  })
  const layout = $derived(magnifierLayout(magnifierView(settings), at.width, at.height, source))
  const unit = $derived(UNIT_SYMBOLS[settings.unit])
  const label = $derived(`A ${instrumentName(settings, settings.unit)} reading ${readingText(settings)}`)
</script>

{#snippet instrument(zoom: number)}
  {#if settings.instrument === 'buret'}
    <Buret {scale} reading={settings.reading} tint={settings.tint} {unit} guide={settings.guide} {zoom} />
  {:else if settings.instrument === 'beaker'}
    <Beaker {scale} reading={settings.reading} tint={settings.tint} {unit} {zoom} />
  {:else}
    <GraduatedCylinder {scale} size={settings.size} reading={settings.reading} tint={settings.tint} {unit} guide={settings.guide} {zoom} />
  {/if}
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
    <g transform="translate({layout.origin.x} {layout.origin.y})">{@render instrument(1)}</g>
  {/if}
  {#if layout.magnifier}
    <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} scene={instrument} />
  {/if}
</FigureFrame>
