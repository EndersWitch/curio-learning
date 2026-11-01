<script lang="ts">
  // A Motion Graph figure: one graph, or three stacked on the same time axis,
  // each the shared graph grid drawn as an SVG inside this one, with each
  // segment's line, dotted joins where velocity or acceleration jumps, the
  // tangent, and letters at the boundaries; the chart title above.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { buildMotion } from './figure'
  import { viewsOf, type MotionSettings } from './settings'
  import TitleText from './TitleText.svelte'

  let { settings, id = 'm' }: { settings: MotionSettings; id?: string } = $props()

  const g = $derived(buildMotion(settings))
  const VIEW_WORDS = { x: 'position', v: 'velocity', a: 'acceleration' }
  const label = $derived(
    settings.title.mode === 'text' && settings.title.text.trim()
      ? settings.title.text.trim()
      : `Graph${viewsOf(settings).length > 1 ? 's' : ''} of ${viewsOf(settings)
          .map((v) => VIEW_WORDS[v])
          .join(', ')
          .replace(/, (?=[^,]*$)/, ' and ')} against time, ${settings.segments.length} segment${settings.segments.length === 1 ? '' : 's'}`,
  )
</script>

<svg
  class="motion-graphs"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {g.width} {g.height}"
  width={g.width}
  height={g.height}
  role="img"
  aria-label={label}
  id="{id}-motion-graphs"
>
  <rect width={g.width} height={g.height} fill="#fff" />

  {#each g.panels as p, i}
    <!-- The panel's size is set here too, so the page's CSS for a lone grid doesn't stretch it. -->
    <g class="panel" transform="translate({p.at.x} {p.at.y})" style:--w="{p.layout.width}px" style:--h="{p.layout.height}px">
      <Grid layout={p.layout} settings={p.grid} id="{id}-{i}" label="{VIEW_WORDS[p.view]} against time">
        <g stroke={INK} stroke-width="1.5">
          {#each p.ticks as t}<line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />{/each}
        </g>
        <g stroke={INK} stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round">
          {#each p.joins as j}<line x1={j.x1} y1={j.y1} x2={j.x2} y2={j.y2} />{/each}
        </g>
        {#each p.lines as l}
          <path d={l.d} fill="none" stroke={l.color} stroke-width="3" stroke-dasharray={l.dash} stroke-linecap={l.dash ? 'butt' : 'round'} stroke-linejoin="round" />
        {/each}
        {#if p.tangent}
          {@const t = p.tangent}
          <!-- White under the dashes, so the tangent still reads where it runs along the curve. -->
          <line x1={t.line.x1} y1={t.line.y1} x2={t.line.x2} y2={t.line.y2} stroke="#fff" stroke-width="5" />
          <line x1={t.line.x1} y1={t.line.y1} x2={t.line.x2} y2={t.line.y2} stroke={INK} stroke-width="2" stroke-dasharray="9 5" />
          <circle cx={t.at.x} cy={t.at.y} r={g.r} fill={INK} stroke="#fff" stroke-width="1.5" />
        {/if}
        {#each p.dots as d}
          <circle cx={d.x} cy={d.y} r={g.r} fill={INK} stroke="#fff" stroke-width="1.5" />
        {/each}
        <g font-family={SANS} font-size={g.letterFs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
          {#each p.letters as l}<text x={l.x} y={l.y} text-anchor={l.anchor}>{l.text}</text>{/each}
        </g>
      </Grid>
    </g>
  {/each}

  {#each g.titles as t}<TitleText title={t} size={g.fs * 1.2} color={INK} />{/each}
  {#if g.chartTitle}<TitleText title={g.chartTitle} size={g.fs * 1.6} color={INK} />{/if}
  {#if g.chartBlank}
    <line x1={g.chartBlank.x1} y1={g.chartBlank.y1} x2={g.chartBlank.x2} y2={g.chartBlank.y2} stroke={INK} stroke-width="1.5" />
  {/if}
</svg>

<style>
  .motion-graphs { display: block; width: 100%; height: auto; }
  /* Grid.svelte fills the width it's shown in; inside this figure each
     panel is its own size instead, whatever the figure card says about SVGs
     (the exported SVG uses its width and height). */
  .motion-graphs .panel :global(svg) { width: var(--w); height: var(--h); max-width: none; max-height: none; }
</style>
