<script lang="ts">
  // A heating or cooling curve on the shared graph grid: the dashed lines to
  // the temperature axis, the curve, then the melting and boiling points by
  // the dashed lines, its letters and segment labels.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { buildCurve } from './figure'
  import type { CurveSettings } from './settings'

  let { settings, svg = $bindable(), id = 'h' }: { settings: CurveSettings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildCurve(settings))
  const label = $derived(
    settings.titleMode === 'text' && settings.title.trim() ? settings.title : settings.direction === 'heating' ? 'Heating curve' : 'Cooling curve',
  )
</script>

<Grid layout={g} {settings} {id} bind:svg {label}>
  <g stroke={INK} stroke-width="1.6" stroke-dasharray="6 5">
    {#each g.guides as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
  </g>
  {#each g.curve as d}
    <path {d} fill="none" stroke={g.color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  {/each}
  <g font-family={SANS} font-size={g.lfs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
    {#each g.pointLabels as t}<text x={t.x} y={t.y} text-anchor={t.anchor}>{t.text}</text>{/each}
    {#each g.segmentLabels as t}<text x={t.x} y={t.y} text-anchor={t.anchor}>{t.text}</text>{/each}
    {#each g.letters as t}<text x={t.x} y={t.y} text-anchor={t.anchor}>{t.text}</text>{/each}
  </g>
  <g stroke={INK} stroke-width="1.5">
    {#each [...g.pointBlanks, ...g.segmentBlanks] as b}<line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />{/each}
  </g>
</Grid>
