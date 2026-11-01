<script lang="ts">
  // A Wave figure, as a self-contained SVG that prints crisply and exports
  // cleanly. The grid, axes, numbers and titles are drawn the way
  // $shared/graph's Grid draws them, but here, so the longitudinal wave can sit
  // above the graph and the gridlines can give way to tick marks. Then the
  // waves, the marks on them, and their labels, each on a white box so it
  // reads over the gridlines.
  import DimensionLine from '$lib/shared/DimensionLine.svelte'
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import LabelBackdrop from '$lib/shared/LabelBackdrop.svelte'
  import type { Cap } from '$shared/graph/caps'
  import { INK, SANS, SERIF } from '$shared/graph/grid'
  import { partsOf, repeatOf, type WaveSettings } from './settings'
  import { buildWave } from './wave'

  let { settings, svg = $bindable(), id = 'w' }: { settings: WaveSettings; svg?: SVGSVGElement; id?: string } = $props()

  const f = $derived(buildWave(settings))
  const g = $derived(f.graph)
  const cap = (c: Cap) => (c === 'none' ? undefined : `url(#${id}-${c})`)

  const description = $derived.by(() => {
    const { transverse, longitudinal, time } = partsOf(settings)
    const kind = transverse && longitudinal ? 'A longitudinal wave above its matching transverse wave' : `A ${transverse ? 'transverse' : 'longitudinal'} wave`
    const n = settings.cycles
    return `${kind}, ${n} cycle${n === 1 ? '' : 's'} long${settings.axes ? `, on axes of displacement against ${time ? 'time' : 'distance'}` : ''}${time ? `, period ${repeatOf(settings)}` : ''}`
  })
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {f.width} {f.height}"
  width={f.width}
  height={f.height}
  role="img"
  aria-label={description}
  id="{id}-waves"
>
  <defs>
    <LabelBackdrop id="{id}-label-box" />
    <!-- Axis end caps; each axis runs from its start (left/bottom) to its end (right/top). -->
    <marker id="{id}-triangle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={INK} />
    </marker>
    <marker id="{id}-line" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M1.5,1 L8.6,5 L1.5,9" fill="none" stroke={INK} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </marker>
    <marker id="{id}-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="5" fill={INK} />
    </marker>
  </defs>
  <rect width={f.width} height={f.height} fill="#fff" />

  {#if g}
    {#if g.gridlines}
      {#if g.minorV.length}
        <g stroke="#9ca3af" stroke-width="0.5">
          {#each g.minorV as x}<line x1={x} y1={g.grid.y} x2={x} y2={g.grid.y + g.grid.h} />{/each}
          {#each g.minorH as y}<line x1={g.grid.x} y1={y} x2={g.grid.x + g.grid.w} y2={y} />{/each}
        </g>
      {/if}
      <g stroke={INK} stroke-width="1" shape-rendering="crispEdges">
        {#each g.vLines as x}<line x1={x} y1={g.grid.y} x2={x} y2={g.grid.y + g.grid.h} />{/each}
        {#each g.hLines as y}<line x1={g.grid.x} y1={y} x2={g.grid.x + g.grid.w} y2={y} />{/each}
      </g>
    {/if}
    <g stroke={INK} stroke-width="2.4">
      <line x1={g.xAxis.x1} y1={g.xAxis.y} x2={g.xAxis.x2} y2={g.xAxis.y} marker-start={cap(settings.xStartCap)} marker-end={cap(settings.xEndCap)} />
      {#if g.yDrawn}
        <line x1={g.yAxis.x} y1={g.yAxis.y1} x2={g.yAxis.x} y2={g.yAxis.y2} marker-start={cap(settings.yStartCap)} marker-end={cap(settings.yEndCap)} />
      {/if}
    </g>
    <g stroke={INK} stroke-width="1.5">
      {#each g.ticks as t}<line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />{/each}
    </g>
  {/if}

  {#if f.rest}
    <line x1={f.rest.x1} y1={f.rest.y1} x2={f.rest.x2} y2={f.rest.y2} stroke={INK} stroke-width="1.3" stroke-dasharray="6 5" />
  {/if}
  {#each f.wave as d}<path {d} fill="none" stroke={f.color} stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />{/each}
  <g stroke={f.color} stroke-width="2" stroke-linecap="round">
    {#each f.band as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
  </g>

  <g stroke={INK} stroke-width="1">
    {#each f.marks as m}
      {#each m.extensions as e}<line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />{/each}
    {/each}
  </g>
  {#each f.marks as m}<DimensionLine m={m.line} color={INK} />{/each}

  {#if g}
    <g font-family={SANS} font-size={g.fs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
      {#each g.numbers as n}<text x={n.x} y={n.y} text-anchor={n.anchor}>{n.text}</text>{/each}
    </g>
    {#each g.labels as l}
      {#if l.kind === 'tip'}
        <text x={l.x} y={l.y} text-anchor={l.anchor} font-family={SERIF} font-style="italic" font-weight="bold" font-size={g.fs * 1.4} fill={INK}>{l.text}</text>
      {:else}
        <text
          x={l.x} y={l.y} text-anchor="middle" dominant-baseline={l.rotate ? 'central' : undefined}
          transform={l.rotate ? `rotate(-90 ${l.x} ${l.y})` : undefined}
          font-family={SANS} font-size={g.fs * 1.2} font-weight="bold" fill={INK}
        >{l.text}</text>
      {/if}
    {/each}
    <g stroke={INK} stroke-width="1.5">
      {#each g.blanks as b}<line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />{/each}
    </g>
  {/if}
  {#if f.title}
    <text x={f.title.x} y={f.title.y} text-anchor="middle" font-family={SANS} font-size={f.fs * 1.6} font-weight="bold" fill={INK}>{f.title.text}</text>
  {/if}
  {#if f.titleBlank}
    <line x1={f.titleBlank.x1} y1={f.titleBlank.y1} x2={f.titleBlank.x2} y2={f.titleBlank.y2} stroke={INK} stroke-width="1.5" />
  {/if}

  {#each f.marks as m}<FigureLabel label={m.label} x={m.at.x} y={m.at.y} size={f.labelSize} blank={m.blank} color={INK} backdrop="{id}-label-box" />{/each}
  {#each f.notes as n}<FigureLabel label={n.label} x={n.at.x} y={n.at.y} size={f.labelSize} color={INK} italic={false} backdrop="{id}-label-box" />{/each}
</svg>
