<script lang="ts">
  // A predator–prey graph on the shared graph grid: the dotted guides, then
  // both populations (prey solid, predators dashed, so they read apart in
  // black and white), the peaks, lag and period, a key naming each
  // population under the graph, and the right-hand axis when the predators
  // have one.
  // The phase plane draws the loop with arrows instead.
  import Grid from '$shared/graph/Grid.svelte'
  import { INK, SANS } from '$shared/graph/grid'
  import { COUNT_DASH, PREDATOR_DASH, buildPredatorPrey, type SeriesKey } from './figure'
  import type { PredatorPreySettings } from './settings'

  let { settings, svg = $bindable(), id = 'pp' }: { settings: PredatorPreySettings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildPredatorPrey(settings))
  const census = $derived(g.census)
  const dash = (key: SeriesKey) => (key === 'predators' ? (census ? COUNT_DASH : PREDATOR_DASH) : undefined)
  const lineWidth = $derived(census ? 1.6 : 3)
  const square = 8.5

  const label = $derived.by(() => {
    if (settings.titleMode === 'text' && settings.title.trim()) return settings.title.trim()
    const names = `${settings.preyName.trim() || 'Prey'} and ${settings.predatorName.trim() || 'predators'}`
    return settings.view === 'phase' ? `Phase plane of ${names}` : `Populations of ${names} over time`
  })

  /** An arrowhead at the end of a two-headed arrow, pointing along it. */
  const head = (x: number, y: number, dir: 1 | -1) => `M${x},${y}l${-8 * dir},-4.5v9z`
</script>

{#snippet mark(key: SeriesKey, x: number, y: number)}
  {#if key === 'prey'}
    <circle cx={x} cy={y} r="4.5" fill={g.color(key)} stroke="#fff" stroke-width="1.2" />
  {:else}
    <rect x={x - square / 2} y={y - square / 2} width={square} height={square} fill="#fff" stroke={g.color(key)} stroke-width="2" />
  {/if}
{/snippet}

{#snippet sample(key: SeriesKey, l: { x1: number; y1: number; x2: number; y2: number })}
  {#if !census || settings.connect}
    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={g.color(key)} stroke-width={lineWidth} stroke-dasharray={key === 'predators' ? (census ? '4 3' : '7 4') : undefined} />
  {/if}
  {#if census}{@render mark(key, (l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2)}{/if}
{/snippet}

<Grid layout={g} {settings} {id} bind:svg {label}>
  <g stroke={INK} stroke-width="1.3" stroke-dasharray="2 4" stroke-linecap="round">
    {#each g.drops as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
    {#each g.spans as sp}
      {#each sp.guides as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />{/each}
    {/each}
  </g>

  {#each g.series as line (line.key)}
    {#each line.lines as d}
      <path {d} fill="none" stroke={line.color} stroke-width={lineWidth} stroke-dasharray={dash(line.key)} stroke-linejoin="round" />
    {/each}
  {/each}
  {#each g.series as line (line.key)}
    {#each line.counts as p}{@render mark(line.key, p.x, p.y)}{/each}
  {/each}

  {#if g.loop}
    {@const loopColor = g.color('prey')}
    {#each g.loop.lines as d}
      <path {d} fill="none" stroke={loopColor} stroke-width={census ? 1.6 : 3} stroke-linejoin="round" />
    {/each}
    {#each g.loop.counts as p}<circle cx={p.x} cy={p.y} r="4" fill={loopColor} stroke="#fff" stroke-width="1.2" />{/each}
    {#each g.loop.arrows as a}
      <path d="M7,0L-6,-6.5L-3,0L-6,6.5z" transform="translate({a.tip.x} {a.tip.y}) rotate({a.angle})" fill={INK} stroke="#fff" stroke-width="1" stroke-linejoin="round" />
    {/each}
  {/if}

  {#each g.peaks as q}
    {#if census}
      <circle cx={q.p.x} cy={q.p.y} r="8.5" fill="none" stroke={INK} stroke-width="1.6" />
    {:else}
      <circle cx={q.p.x} cy={q.p.y} r={g.r} fill={g.color(q.key)} stroke="#fff" stroke-width="1.5" />
    {/if}
  {/each}

  <!-- Too short for heads inside, an arrow's heads point in from outside. -->
  {#each g.spans as sp}
    {@const a = sp.arrow}
    {@const short = a.x2 - a.x1 < 24}
    {#if short}
      <line x1={a.x1 - 14} y1={a.y1} x2={a.x2 + 14} y2={a.y2} stroke={INK} stroke-width="1.5" />
      <path d={head(a.x1, a.y1, 1)} fill={INK} />
      <path d={head(a.x2, a.y2, -1)} fill={INK} />
    {:else}
      <line x1={a.x1 + 4} y1={a.y1} x2={a.x2 - 4} y2={a.y2} stroke={INK} stroke-width="1.5" />
      <path d={head(a.x1, a.y1, -1)} fill={INK} />
      <path d={head(a.x2, a.y2, 1)} fill={INK} />
    {/if}
  {/each}

  {#each g.keyEntries as n}{@render sample(n.key, n.sample)}{/each}

  <g font-family={SANS} font-size={g.fs * 1.05} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
    {#each g.spans as sp}<text x={sp.label.x} y={sp.label.y} text-anchor={sp.label.anchor}>{sp.label.text}</text>{/each}
    {#each g.keyEntries as n}<text x={n.text.x} y={n.text.y} text-anchor={n.text.anchor}>{n.text.text}</text>{/each}
  </g>
  <g stroke={INK} stroke-width="1.5">
    {#each g.spans as sp}
      {#if sp.blank}<line x1={sp.blank.x1} y1={sp.blank.y1} x2={sp.blank.x2} y2={sp.blank.y2} />{/if}
    {/each}
  </g>

  {#if g.right}
    <line x1={g.right.line.x1} y1={g.right.line.y1} x2={g.right.line.x2} y2={g.right.line.y2} stroke={INK} stroke-width="2.4" />
    <g font-family={SANS} font-size={g.fs} font-weight="bold" fill={INK} stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
      {#each g.right.numbers as n}<text x={n.x} y={n.y} text-anchor={n.anchor}>{n.text}</text>{/each}
    </g>
    {#if g.right.title}
      <text
        x={g.right.title.x} y={g.right.title.y} text-anchor="middle" dominant-baseline="central"
        transform="rotate(-90 {g.right.title.x} {g.right.title.y})"
        font-family={SANS} font-size={g.fs * 1.2} font-weight="bold" fill={INK}
      >{g.right.title.text}</text>
    {/if}
    {#if g.right.blank}
      <line x1={g.right.blank.x1} y1={g.right.blank.y1} x2={g.right.blank.x2} y2={g.right.blank.y2} stroke={INK} stroke-width="1.5" />
    {/if}
  {/if}
</Grid>
