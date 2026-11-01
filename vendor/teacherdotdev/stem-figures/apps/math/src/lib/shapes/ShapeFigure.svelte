<script lang="ts">
  // A shape itself, as a self-contained SVG that prints crisply and exports
  // cleanly to PNG/SVG (fonts and colors are inline, no page CSS). With
  // `onmove`, its labels can be dragged: onmove(part, [along, across]) gets
  // the label's new offset from its usual spot. The frame holds still while a
  // label is dragged, so the figure doesn't rescale under the pointer.
  import { SERIF } from '$lib/shared/mathSvg.js'
  import type { PlacedLabel, ShapeLayout, Vec } from './layout.js'
  import { INK, type LineStyle, type Offset } from './parts.js'

  let {
    figure, svg = $bindable(), label, onmove = null,
  }: { figure: ShapeLayout; svg?: SVGSVGElement; label: string; onmove?: ((part: string, offset: Offset) => void) | null } = $props()

  let drag: { id: number; x: number; y: number; l: PlacedLabel } | null = null
  let frozen = $state<ShapeLayout['frame'] | null>(null)
  const f = $derived(frozen ?? figure.frame)

  const DASH: Record<LineStyle, string | undefined> = { solid: undefined, dashed: '7 5', dotted: '0.01 5' }
  const pts = (list: Vec[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  function down(event: PointerEvent & { currentTarget: Element }, l: PlacedLabel) {
    if (!onmove || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, l }
    frozen = figure.frame
  }
  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    const k = svg!.getScreenCTM()?.a || 1
    const d = [(event.clientX - drag.x) / k, (event.clientY - drag.y) / k]
    const { part, offset, along, across } = drag.l
    onmove!(part, [offset[0] + d[0] * along[0] + d[1] * along[1], offset[1] + d[0] * across[0] + d[1] * across[1]])
  }
  function up(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    drag = null
    frozen = null
  }
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="{f.x} {f.y} {f.w} {f.h}"
  width={f.w}
  height={f.h}
  role="img"
  aria-label={label}
>
  <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#fff" />

  {#each figure.extensions as [p, q]}
    <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={INK} stroke-width="1.6" stroke-dasharray="6 5" />
  {/each}
  {#each figure.lines as h}
    <line
      x1={h.from[0]} y1={h.from[1]} x2={h.to[0]} y2={h.to[1]} stroke={INK} stroke-width={h.style === 'dotted' ? 2.4 : 1.8}
      stroke-dasharray={DASH[h.style]} stroke-linecap={h.style === 'dotted' ? 'round' : 'butt'}
    />
  {/each}

  <g fill="none" stroke={INK} stroke-width="1.6">
    {#each figure.squares as sq}<polyline points={pts(sq)} />{/each}
    {#each figure.arcs as d}<path {d} />{/each}
    {#each figure.ticks as [p, q]}<line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke-width="1.8" />{/each}
    {#each figure.arrows as a}<polyline points={pts(a)} stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />{/each}
  </g>

  <polygon points={pts(figure.corners)} fill="none" stroke={INK} stroke-width="2.4" stroke-linejoin="round" />
  {#each figure.dots as [x, y]}<circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5" fill={INK} />{/each}

  {#each figure.labels as l (l.part)}
    <g
      transform="translate({l.x.toFixed(1)} {l.y.toFixed(1)})"
      style={onmove ? 'cursor: move; touch-action: none' : undefined}
      onpointerdown={(e) => down(e, l)}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      role={onmove ? 'button' : undefined}
      aria-label={onmove ? 'Drag to move this label' : undefined}
    >
      {#if onmove}<rect x="-3" y={-l.box.asc - 3} width={l.box.w + 6} height={l.box.asc + l.box.desc + 6} fill="transparent" />{/if}
      {#each l.box.items as it}
        {#if it.kind === 'text'}
          <text
            x={it.x.toFixed(1)} y={it.y.toFixed(1)} font-family={SERIF} font-size={it.size} font-style={it.italic ? 'italic' : undefined}
            fill={INK} stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" xml:space="preserve"
          >{it.text}</text>
        {:else if it.kind === 'line'}
          <line x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={INK} stroke-width={it.width} />
        {:else}
          <polyline points={pts(it.points)} fill="none" stroke={INK} stroke-width={it.width} stroke-linejoin="round" stroke-linecap="round" />
        {/if}
      {/each}
    </g>
  {/each}
</svg>

<style>
  svg { display: block; width: 100%; height: auto; user-select: none; -webkit-user-select: none; }
</style>
