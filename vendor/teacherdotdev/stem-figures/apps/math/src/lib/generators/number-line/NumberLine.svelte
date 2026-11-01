<script lang="ts">
  // The number line itself, as a self-contained SVG that prints crisply and
  // exports cleanly to PNG/SVG (fonts and colors are inline, no page CSS).
  import { buildLine } from './numberline.js'
  import { INK, type Settings } from './settings.js'

  let { settings, svg = $bindable(), id = 'n' }: { settings: Settings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildLine(settings))
  const SANS = 'Arial, Helvetica, sans-serif'
  const SERIF = "'Times New Roman', Times, serif"
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {g.width} {g.height}"
  width={g.width}
  height={g.height}
  role="img"
  aria-label={settings.equations.map((r) => r.text.trim()).filter(Boolean).join('; ') || 'Number line'}
>
  <defs>
    <!-- The line's arrows, one at each end. -->
    <marker id="{id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={INK} />
    </marker>
  </defs>

  <rect width={g.width} height={g.height} fill="#fff" />

  <line
    x1={g.axis.x1} y1={g.axis.y} x2={g.axis.x2} y2={g.axis.y} stroke={INK} stroke-width="2.4"
    marker-start="url(#{id}-arrow)" marker-end="url(#{id}-arrow)"
  />
  <g stroke={INK} stroke-width="2">
    {#each g.ticks as t}<line x1={t.x} y1={t.y1} x2={t.x} y2={t.y2} />{/each}
  </g>

  <!-- Each color's equation graphs and points, later colors over earlier ones. -->
  {#each g.groups as group}
    <g stroke={group.ink} stroke-width="6">
      {#each group.segments as s}<line x1={s.x1} y1={g.axis.y} x2={s.x2} y2={g.axis.y} />{/each}
    </g>
    {#each group.arrows as d}<path {d} fill={group.ink} />{/each}
    {#each group.crosses as cx}
      <path d="M{cx - 7},{g.axis.y - 7} L{cx + 7},{g.axis.y + 7} M{cx - 7},{g.axis.y + 7} L{cx + 7},{g.axis.y - 7}" stroke={group.ink} stroke-width="3" stroke-linecap="round" />
    {/each}
    {#each group.endpoints as e}
      <circle cx={e.x} cy={g.axis.y} r={g.r} fill={e.closed ? group.ink : '#fff'} stroke={group.ink} stroke-width="2.5" />
    {/each}
  {/each}

  <g font-family={SANS} font-size={g.fs} font-weight="bold" fill={INK} text-anchor="middle">
    {#each g.numbers as n}
      {#if n.den}
        <text x={n.x} y={n.numY}>{n.num}</text>
        <line x1={n.x - Math.max(n.num.length, n.den.length) * g.fs * 0.32 - 1} y1={n.barY} x2={n.x + Math.max(n.num.length, n.den.length) * g.fs * 0.32 + 1} y2={n.barY} stroke={INK} stroke-width="1.5" />
        <text x={n.x} y={n.denY}>{n.den}</text>
        {#if n.sign}
          <text x={n.x - Math.max(n.num.length, n.den.length) * g.fs * 0.32 - 3} y={n.barY + g.fs * 0.35} text-anchor="end">{n.sign}</text>
        {/if}
      {:else}
        <text x={n.x} y={n.y}>{n.text}</text>
      {/if}
    {/each}
  </g>

  <!-- Point labels, as on the coordinate grid: the letter in italic serif, a value after it upright. -->
  <g font-size={g.labelFs} font-weight="bold" text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">
    {#each g.labels as l}
      <text x={l.x} y={l.y} fill={l.ink}
        ><tspan font-family={SERIF} font-style="italic">{l.text}</tspan
        >{#if l.coords}<tspan font-family={SANS} font-size={g.fs}>{l.coords}</tspan>{/if}</text
      >
    {/each}
  </g>
</svg>

<style>
  svg { display: block; width: 100%; height: auto; }
</style>
