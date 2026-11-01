<script lang="ts">
  // A titration curve on the shared graph grid: the curve, then its marked
  // points' dashed lines, dots and labels.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { buildTitration } from './figure'
  import type { TitrationSettings } from './settings'

  let { settings, svg = $bindable(), id = 't' }: { settings: TitrationSettings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildTitration(settings))
</script>

<Grid layout={g} {settings} {id} bind:svg label={settings.titleMode === 'text' && settings.title.trim() ? settings.title : 'Titration curve'}>
  <g stroke={INK} stroke-width="1.6" stroke-dasharray="6 5">
    {#each g.marks as m}
      {#each m.guides as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
    {/each}
  </g>
  {#each g.curve as d}
    <path {d} fill="none" stroke={g.color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  {/each}
  {#each g.marks as m}
    <circle cx={m.dot.x} cy={m.dot.y} r={g.r} fill={INK} stroke="#fff" stroke-width="1.5" />
  {/each}
  <g font-family={SANS} font-size={g.fs * 1.1} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
    {#each g.marks as m}
      {#if m.label}<text x={m.label.x} y={m.label.y} text-anchor={m.label.anchor}>{m.label.text}</text>{/if}
    {/each}
  </g>
  <g stroke={INK} stroke-width="1.5">
    {#each g.marks as m}
      {#if m.blank}<line x1={m.blank.x1} y1={m.blank.y1} x2={m.blank.x2} y2={m.blank.y2} />{/if}
    {/each}
  </g>
</Grid>
