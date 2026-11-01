<script lang="ts">
  // A mass spectrum on the shared graph grid: a bar for each isotope, its
  // abundance over it, the element's name above at the right, and the answer
  // key under the graph.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { buildMassSpectrum } from './figure'
  import { figureLabel, type MassSpectrumSettings } from './settings'

  let { settings, svg = $bindable(), id = 'ms' }: { settings: MassSpectrumSettings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildMassSpectrum(settings))
</script>

<Grid layout={g} {settings} {id} bind:svg label={figureLabel(settings)}>
  {#each g.bars as b, i (i)}<rect x={b.x} y={b.y} width={b.w} height={b.h} fill={INK} />{/each}
  <g font-family={SANS} font-size={g.fs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor="middle">
    {#each g.peakLabels as l, i (i)}<text x={l.x} y={l.y}>{l.text}</text>{/each}
  </g>
  {#if g.name}
    <text x={g.name.x} y={g.name.y} text-anchor="end" font-family={SANS} font-size={g.fs * 1.2} font-weight="bold" fill={INK}>{g.name.text}</text>
  {/if}
  {#each g.answer as a, i (i)}
    <text x={a.x} y={a.y} text-anchor="middle" font-family={SANS} font-size={g.fs * 1.1} fill={INK}>{a.text}</text>
  {/each}
</Grid>
