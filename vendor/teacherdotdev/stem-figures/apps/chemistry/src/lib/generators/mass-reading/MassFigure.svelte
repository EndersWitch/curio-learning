<script lang="ts">
  // The Mass Reading figure for a set of settings. A triple beam balance can
  // have a magnifier on its front beam beside it, or be cropped to its beams.
  // Either balance can have an object from Volume by Displacement on its pan.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import Magnifier from '$lib/shared/Magnifier.svelte'
  import { magnifierLayout } from '$lib/shared/magnify'
  import DigitalBalance from './DigitalBalance.svelte'
  import TripleBeamBalance, { TRIPLE_BEAM, TRIPLE_BEAM_BEAMS, frontBeamY, frontRiderX } from './TripleBeamBalance.svelte'
  import { objectBounds, objectName } from '../volume-by-displacement/objects'
  import { DIGITAL_PAN, digitalBalance, digitalBalanceSize, type DecimalPlaces } from './digital'
  import { objectOnPan } from './panObject'
  import { answerLine, massText, type MassSettings } from './settings'
  import { splitRiders } from './tripleBeam'

  let { settings, svg = $bindable() }: { settings: MassSettings; svg?: SVGSVGElement } = $props()

  const balance = $derived(digitalBalance(settings.decimals as DecimalPlaces))
  const object = $derived(
    settings.object === 'none'
      ? null
      : objectOnPan(settings.object, settings.marbles, settings.instrument === 'digital' ? DIGITAL_PAN : TRIPLE_BEAM.pan),
  )
  const digitalSize = $derived(digitalBalanceSize(balance.analytical, settings.pan, object ? objectBounds(object).top : undefined))
  const source = $derived({
    x: frontRiderX(splitRiders(settings.mass).front),
    y: frontBeamY,
    r: (settings.span * TRIPLE_BEAM.frontPerGram) / 2,
  })
  const beams = TRIPLE_BEAM_BEAMS
  const layout = $derived(
    settings.instrument === 'digital'
      ? { ...digitalSize, origin: { x: 0, y: 0 }, magnifier: null }
      : settings.view === 'beams'
        ? { width: beams.width, height: beams.height, origin: { x: -beams.x, y: -beams.y }, magnifier: null }
        : magnifierLayout(settings.view, TRIPLE_BEAM.width, TRIPLE_BEAM.height, source),
  )
  const label = $derived(
    `A ${settings.instrument === 'triple-beam' ? 'triple beam' : 'digital'} balance showing ${massText(settings)} g` +
      (settings.object === 'none' ? '' : ` with ${objectName(settings.object, settings.marbles)} on its pan`),
  )
</script>

{#snippet tripleBeam(zoom: number)}
  <TripleBeamBalance mass={settings.mass} {zoom} beamsOnly={settings.view === 'beams'} {object} />
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
    <DigitalBalance {balance} mass={settings.mass} pan={settings.pan} {object} />
  {:else}
    {#if layout.origin}
      <g transform="translate({layout.origin.x} {layout.origin.y})">{@render tripleBeam(1)}</g>
    {/if}
    {#if layout.magnifier}
      <Magnifier {source} target={layout.magnifier} marked={!!layout.origin} origin={layout.origin ?? undefined} scene={tripleBeam} />
    {/if}
  {/if}
</FigureFrame>
