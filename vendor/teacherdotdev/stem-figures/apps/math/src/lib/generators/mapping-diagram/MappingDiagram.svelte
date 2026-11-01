<script lang="ts">
  // The mapping diagram itself, as a self-contained SVG that prints crisply
  // and exports cleanly to PNG/SVG (fonts and colors are inline, no page CSS).
  import { SERIF } from '$lib/shared/mathSvg.js'
  import { buildDiagram } from './layout.js'
  import { INK, type Settings } from './settings.js'

  // id: prefixes the arrowhead's id, which has to be unique on the page.
  let { settings, svg = $bindable(), id = 'm' }: { settings: Settings; svg?: SVGSVGElement; id?: string } = $props()

  const g = $derived(buildDiagram(settings))
  const SANS = 'Arial, Helvetica, sans-serif'
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {g.width} {g.height}"
  width={g.width}
  height={g.height}
  role="img"
  aria-label={settings.title.trim() || 'Mapping diagram'}
>
  <defs>
    <marker id="{id}-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0,0.8 L10,5 L0,9.2 z" fill={INK} />
    </marker>
  </defs>

  <rect width={g.width} height={g.height} fill="#fff" />

  <g stroke={INK} stroke-width="2.2" fill="none">
    {#each g.sides as side}
      {#if g.shape === 'oval'}
        <ellipse cx={side.cx} cy={side.cy} rx={side.rx} ry={side.ry} />
      {:else if g.shape === 'box'}
        <rect x={side.cx - side.rx} y={side.cy - side.ry} width={2 * side.rx} height={2 * side.ry} rx={side.round} />
      {/if}
    {/each}
  </g>

  {#each g.items as item}
    <g transform="translate({item.x.toFixed(1)} {item.y.toFixed(1)})">
      {#each item.box.items as it}
        {#if it.kind === 'text'}
          <text
            x={it.x.toFixed(1)} y={it.y.toFixed(1)} font-family={SERIF} font-size={it.size} font-style={it.italic ? 'italic' : undefined}
            fill={INK} xml:space="preserve"
          >{it.text}</text>
        {:else if it.kind === 'line'}
          <line x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={INK} stroke-width={it.width} />
        {:else}
          <polyline points={it.points.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} stroke-width={it.width} stroke-linejoin="round" stroke-linecap="round" />
        {/if}
      {/each}
    </g>
  {/each}

  <g stroke={INK} stroke-width="1.8" stroke-linecap="round">
    {#each g.arrows as a}
      <line x1={a.x1.toFixed(1)} y1={a.y1.toFixed(1)} x2={a.x2.toFixed(1)} y2={a.y2.toFixed(1)} marker-end="url(#{id}-head)" />
    {/each}
  </g>

  <g font-family={SANS} font-weight="bold" fill={INK} text-anchor="middle">
    {#each g.texts as t}<text x={t.x} y={t.y} font-size={t.size}>{t.text}</text>{/each}
  </g>

  <g stroke={INK} stroke-width="1.5">
    {#each g.blanks as b}<line x1={b.x1} y1={b.y} x2={b.x2} y2={b.y} />{/each}
  </g>
</svg>

<style>
  svg { display: block; width: 100%; height: auto; }
</style>
