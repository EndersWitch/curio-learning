<script lang="ts">
  // A figure's labels, drawn inside its SVG. With `onmove`, they can be
  // dragged: onmove(part, [along, across]) gets the label's new offset from
  // its usual spot. `ondrag` hears when a drag starts and ends, so the figure
  // can hold its frame still and not rescale under the pointer.
  import { SERIF } from '$lib/shared/mathSvg.js'
  import type { PlacedLabel, Vec } from './layout.js'
  import type { Offset } from './parts.js'

  let {
    labels, ink, onmove = null, ondrag,
  }: { labels: PlacedLabel[]; ink: string; onmove?: ((part: string, offset: Offset) => void) | null; ondrag?: (dragging: boolean) => void } = $props()

  let drag: { id: number; x: number; y: number; l: PlacedLabel; svg: SVGSVGElement } | null = null
  const pts = (list: Vec[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  function down(event: PointerEvent & { currentTarget: SVGGElement }, l: PlacedLabel) {
    if (!onmove || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, l, svg: event.currentTarget.ownerSVGElement! }
    ondrag?.(true)
  }
  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    const k = drag.svg.getScreenCTM()?.a || 1
    const d = [(event.clientX - drag.x) / k, (event.clientY - drag.y) / k]
    const { part, offset, along, across } = drag.l
    onmove!(part, [offset[0] + d[0] * along[0] + d[1] * along[1], offset[1] + d[0] * across[0] + d[1] * across[1]])
  }
  function up(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    drag = null
    ondrag?.(false)
  }
</script>

{#each labels as l (l.part)}
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
          fill={ink} stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" xml:space="preserve"
        >{it.text}</text>
      {:else if it.kind === 'line'}
        <line x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={ink} stroke-width={it.width} />
      {:else}
        <polyline points={pts(it.points)} fill="none" stroke={ink} stroke-width={it.width} stroke-linejoin="round" stroke-linecap="round" />
      {/if}
    {/each}
  </g>
{/each}
