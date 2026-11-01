<script lang="ts">
  // A population growth figure: one graph, or two stacked, each the shared
  // graph grid drawn as an SVG inside this one, with the curves, the
  // carrying capacity, marked points and census points on it; the phases
  // and chart title above, and the census table beside.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { buildPopulation } from './figure'
  import type { PopulationSettings } from './settings'

  let { settings, svg = $bindable(), id = 'p' }: { settings: PopulationSettings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildPopulation(settings))
  const VIEW_WORDS = { size: 'population size', rate: 'growth rate', percapita: 'per capita growth rate' }
  const label = $derived(
    settings.titleMode === 'text' && settings.title.trim()
      ? settings.title.trim()
      : `Graph of ${g.panels.map((p) => VIEW_WORDS[p.view]).join(' and ')} against ${settings.graphs.endsWith('-n') ? 'population size' : 'time'}`,
  )
</script>

{#snippet labelText(l: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; text?: string; rotate?: boolean })}
  {#if l.text}<text x={l.x} y={l.y} text-anchor={l.anchor} transform={l.rotate ? `rotate(-90 ${l.x} ${l.y})` : undefined}>{l.text}</text>{/if}
{/snippet}

<svg
  bind:this={svg}
  class="population"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {g.width} {g.height}"
  width={g.width}
  height={g.height}
  role="img"
  aria-label={label}
>
  <rect width={g.width} height={g.height} fill="#fff" />

  {#each g.panels as p, i}
    <!-- The panel's size is set here too, so the page's CSS for a lone grid doesn't stretch it. -->
    <g class="panel" transform="translate({p.at.x} {p.at.y})" style:--w="{p.layout.width}px" style:--h="{p.layout.height}px">
      <Grid layout={p.layout} settings={p.grid} id="{id}-{i}" label={VIEW_WORDS[p.view]}>
        <g stroke={INK} stroke-width="1.3" stroke-dasharray="2 5" stroke-linecap="round">
          {#each p.edges as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
        </g>
        <!-- White under the dashes, so a line along a gridline still reads as dashed. -->
        <g stroke="#fff" stroke-width="4">
          {#each p.refs as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
        </g>
        <g stroke={INK} stroke-width="1.8" stroke-dasharray="7 5">
          {#each p.refs as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
        </g>
        {#each p.curves as c}
          <path d={c.d} fill="none" stroke={c.color} stroke-width="3" stroke-dasharray={c.dash} stroke-linecap={c.dash ? 'butt' : 'round'} stroke-linejoin="round" />
        {/each}
        {#each p.points as pt}
          <circle cx={pt.x} cy={pt.y} r={g.censusR} fill={INK} stroke="#fff" stroke-width="1.5" />
        {/each}
        {#each p.dots as d}
          <circle cx={d.x} cy={d.y} r={g.r} fill="#fff" stroke={INK} stroke-width="2.5" />
        {/each}
        <!-- Each label is backed in white, so no gridline runs through it. -->
        <g fill="#fff">
          {#each p.labels as l}
            {#if l.text && l.box}<rect x={l.box.x0} y={l.box.y0} width={l.box.x1 - l.box.x0} height={l.box.y1 - l.box.y0} />{/if}
          {/each}
        </g>
        <g font-family={SANS} font-size={g.labelFs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
          {#each p.labels as l}{@render labelText(l)}{/each}
        </g>
        <!-- A write-on line gets a clear patch of the grid for the student's words. -->
        {#each p.labels as l}
          {#if l.blank}
            {@const b = l.blank}
            {#if l.rotate}
              <rect x={b.x1 - g.labelFs * 1.2} y={b.y1 - 4} width={g.labelFs * 1.2 + 4} height={b.y2 - b.y1 + 8} fill="#fff" />
            {:else}
              <rect x={b.x1 - 4} y={b.y1 - g.labelFs * 1.2} width={b.x2 - b.x1 + 8} height={g.labelFs * 1.2 + 4} fill="#fff" />
            {/if}
            <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={INK} stroke-width="1.5" />
          {/if}
        {/each}
      </Grid>
    </g>
  {/each}

  {#each g.yTitles as t}
    <text
      x={t.x} y={t.y} text-anchor="middle" dominant-baseline="central" transform="rotate(-90 {t.x} {t.y})"
      font-family={SANS} font-size={g.fs * 1.2} font-weight="bold" fill={INK}
    >{t.text}</text>
  {/each}
  {#if g.title}
    <text x={g.title.x} y={g.title.y} text-anchor="middle" font-family={SANS} font-size={g.fs * 1.6} font-weight="bold" fill={INK}>{g.title.text}</text>
  {/if}
  {#if g.titleBlank}
    <line x1={g.titleBlank.x1} y1={g.titleBlank.y1} x2={g.titleBlank.x2} y2={g.titleBlank.y2} stroke={INK} stroke-width="1.5" />
  {/if}

  <!-- The growth phases: a bracket over each, its name above. -->
  <g stroke={INK} stroke-width="1.6" fill="none">
    {#each g.brackets as b}
      <path d="M{b.x1},{b.y1 + 6}V{b.y1}H{b.x2}V{b.y1 + 6}" />
    {/each}
    {#each g.bandLabels as l}
      {#if l.blank}<line x1={l.blank.x1} y1={l.blank.y1} x2={l.blank.x2} y2={l.blank.y2} stroke-width="1.5" />{/if}
    {/each}
  </g>
  <g font-family={SANS} font-size={g.labelFs} font-weight="bold" fill={INK}>
    {#each g.bandLabels as l}{@render labelText(l)}{/each}
  </g>

  {#if g.table}
    {@const t = g.table}
    <g font-family={SANS} font-size={g.fs} fill={INK}>
      {#each t.frame as f}
        <rect x={f.x} y={f.y} width={f.w} height={t.headH} fill="#e5e7eb" />
        <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="none" stroke={INK} stroke-width="1.5" />
      {/each}
      <g stroke={INK} stroke-width="1">
        {#each t.rules as r}<line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />{/each}
      </g>
      <g font-weight="bold" text-anchor="middle">
        {#each t.heads as h}
          {#each h.lines as line, k}
            <text x={h.x} y={t.y + 5 + g.fs * (1 + k * 1.2)}>{line}</text>
          {/each}
        {/each}
      </g>
      <g text-anchor="end">
        {#each t.rows as r}<text x={r.x} y={r.y}>{r.text}</text>{/each}
      </g>
    </g>
  {/if}
</svg>

<style>
  .population { display: block; width: 100%; height: auto; }
  /* Grid.svelte fills the width it's shown in; inside this figure each
     panel is its own size instead, whatever the figure card says about SVGs
     (the exported SVG uses its width and height). */
  .population .panel :global(svg) { width: var(--w); height: var(--h); max-width: none; max-height: none; }
</style>
